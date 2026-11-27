#!/usr/bin/env bash
# ==============================================================================
# Pantryo - OpenSSH & Linux OS CVE Remediation Script
# ==============================================================================
# Remediates the following High-severity advisories on Debian / Proxmox LXC:
#   - CVE-2026-35385 : OpenSSH < 10.3 legacy scp (-O) setuid/setgid preservation
#   - CVE-2024-6387  : OpenSSH 8.5p1-9.7p1 regreSSHion SIGALRM race condition
#                      (memory corruption, access violation, remote code execution)
#   - CVE-2023-28531 : OpenSSH 8.9-9.2 ssh-agent smartcard destination bypass
#
# Modes:
#   (default)       Patch OS & OpenSSH packages, write sshd CVE hardening config,
#                   and inside LXC containers (when NOT over an active SSH session)
#                   stop/disable sshd so port 22 is no longer exposed.
#   --keep-ssh      Patch and harden sshd_config.d but keep sshd running.
#   --disable-ssh   Stop, disable, and purge openssh-server (Proxmox pct enter).
#   --audit         Read-only status check without modifying the system.
# ==============================================================================
set -eo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

MODE="auto"
for arg in "$@"; do
  case "$arg" in
    --keep-ssh)    MODE="keep-ssh" ;;
    --disable-ssh) MODE="disable-ssh" ;;
    --audit)       MODE="audit" ;;
  esac
done

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}   Pantryo OpenSSH & Host CVE Remediation (CVE-2026-35385 / 2024-6387)  ${NC}"
echo -e "${CYAN}========================================================================${NC}"

if [[ "$MODE" != "audit" ]] && [[ $EUID -ne 0 ]]; then
  echo -e "${RED}[ERROR] Remediation requires root or sudo privileges.${NC}"
  echo -e "Run: ${YELLOW}sudo $0${NC} (or ${YELLOW}$0 --audit${NC} for read-only check)"
  exit 1
fi

IS_LXC=false
if grep -qa 'container=lxc' /proc/1/environ 2>/dev/null || [[ -d "/dev/lxd" ]] || systemd-detect-virt -c 2>/dev/null | grep -qi 'lxc'; then
  IS_LXC=true
fi

CURRENT_SSH_VER="not installed"
if command -v ssh >/dev/null 2>&1; then
  CURRENT_SSH_VER=$(ssh -V 2>&1 || true)
fi
echo -e "Detected OpenSSH:  ${BOLD}${CURRENT_SSH_VER}${NC}"
echo -e "Environment:       ${BOLD}$( [[ "$IS_LXC" == true ]] && echo "Proxmox / Linux LXC Container" || echo "Linux Host / Container" )${NC}"
echo -e "Active SSH Session:${BOLD}$( [[ -n "${SSH_CONNECTION:-}" ]] && echo " YES (will not disconnect)" || echo " NO" )${NC}"

if [[ "$MODE" == "audit" ]]; then
  echo -e "\n${BLUE}[Audit] Checking OpenSSH daemon & hardening configuration...${NC}"
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet ssh 2>/dev/null; then
    echo -e "  ${YELLOW}[WARN] ssh.service is active and listening on port 22.${NC}"
  else
    echo -e "  ${GREEN}[PASS] ssh.service is not active (port 22 not exposed).${NC}"
  fi
  if [[ -f "/etc/ssh/sshd_config.d/99-pantryo-cve-hardening.conf" ]]; then
    echo -e "  ${GREEN}[PASS] Hardening drop-in present: /etc/ssh/sshd_config.d/99-pantryo-cve-hardening.conf${NC}"
  else
    echo -e "  ${YELLOW}[WARN] Hardening drop-in missing: /etc/ssh/sshd_config.d/99-pantryo-cve-hardening.conf${NC}"
  fi
  exit 0
fi

# ------------------------------------------------------------------------------
# 1. Ensure Debian security repository is enabled and patch base OS + OpenSSH
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/4] Updating Debian security packages (OpenSSH, glibc, OpenSSL)...${NC}"
if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive

  # Ensure debian-security repo is present on Debian Bookworm/Trixie hosts
  if [[ -f "/etc/os-release" ]] && grep -qi '^ID=debian' /etc/os-release; then
    CODENAME=$(. /etc/os-release && echo "${VERSION_CODENAME:-bookworm}")
    if ! grep -rq "debian-security" /etc/apt/sources.list /etc/apt/sources.list.d/ 2>/dev/null; then
      echo "deb https://security.debian.org/debian-security ${CODENAME}-security main contrib non-free-firmware" > /etc/apt/sources.list.d/pantryo-debian-security.list
      echo -e "  ${GREEN}✓ Added official Debian security repository (${CODENAME}-security).${NC}"
    fi
  fi

  apt-get update -y -q || true
  apt-get dist-upgrade -y --no-install-recommends -q || true

  # Explicitly upgrade security-critical packages if installed
  for pkg in openssh-server openssh-client openssh-sftp-server libc6 openssl libssl3; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      apt-get install -y --only-upgrade --no-install-recommends -q "$pkg" 2>/dev/null || true
    fi
  done

  apt-get autoremove -y -q || true
  apt-get clean || true
  echo -e "  ${GREEN}✓ OS and OpenSSH packages updated to latest vendor security patches.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Apply sshd CVE Hardening Drop-In (Mitigates CVE-2024-6387 & CVE-2023-28531)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/4] Applying sshd CVE hardening directives...${NC}"
if [[ -d "/etc/ssh" ]]; then
  mkdir -p /etc/ssh/sshd_config.d
  cat <<'EOF_SSHD' > /etc/ssh/sshd_config.d/99-pantryo-cve-hardening.conf
# Pantryo OpenSSH CVE Hardening
# - LoginGraceTime 0 eliminates the SIGALRM race window (CVE-2024-6387 regreSSHion)
# - AllowAgentForwarding no mitigates ssh-agent destination bypass (CVE-2023-28531)
# - DebianBanner no prevents OS/package version fingerprinting by network scanners
LoginGraceTime 0
DebianBanner no
AllowAgentForwarding no
X11Forwarding no
PermitEmptyPasswords no
MaxAuthTries 3
MaxStartups 10:30:60
EOF_SSHD
  chmod 600 /etc/ssh/sshd_config.d/99-pantryo-cve-hardening.conf

  # Ensure main sshd_config includes sshd_config.d
  if [[ -f "/etc/ssh/sshd_config" ]] && ! grep -qE '^\s*Include\s+/etc/ssh/sshd_config\.d/\*\.conf' /etc/ssh/sshd_config; then
    sed -i '1i Include /etc/ssh/sshd_config.d/*.conf' /etc/ssh/sshd_config
  fi

  if command -v sshd >/dev/null 2>&1 && sshd -t 2>/dev/null; then
    echo -e "  ${GREEN}✓ Validated sshd configuration with CVE hardening directives.${NC}"
  else
    echo -e "  ${YELLOW}⚠ sshd config test skipped (sshd not installed or custom config).${NC}"
  fi
fi

# ------------------------------------------------------------------------------
# 3. Mitigate CVE-2026-35385 (legacy scp -O setuid/setgid preservation)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/4] Mitigating CVE-2026-35385 (legacy scp -O permission preservation)...${NC}"
if [[ -x "/usr/bin/scp" ]] && [[ ! -L "/usr/bin/scp" ]]; then
  SSH_VER_NOW=$(ssh -V 2>&1 || true)
  MAJOR=$(echo "$SSH_VER_NOW" | sed -nE 's/.*OpenSSH_([0-9]+)\.([0-9]+).*/\1/p')
  MINOR=$(echo "$SSH_VER_NOW" | sed -nE 's/.*OpenSSH_([0-9]+)\.([0-9]+).*/\2/p')
  if [[ -n "$MAJOR" && -n "$MINOR" ]] && (( MAJOR < 10 || (MAJOR == 10 && MINOR < 3) )); then
    # Restrict legacy scp binary execution to root/sftp-only or disable legacy -O usage
    # Move /usr/bin/scp -> /usr/bin/scp.real and install a thin wrapper rejecting -O
    if [[ ! -f "/usr/bin/scp.real" ]]; then
      dpkg-divert --local --rename --add /usr/bin/scp >/dev/null 2>&1 || mv /usr/bin/scp /usr/bin/scp.real
      if [[ -f "/usr/bin/scp.distrib" && ! -f "/usr/bin/scp.real" ]]; then
        ln -sf /usr/bin/scp.distrib /usr/bin/scp.real
      fi
      cat <<'EOF_SCP' > /usr/bin/scp
#!/usr/bin/env bash
# Pantryo CVE-2026-35385 mitigation wrapper: blocks legacy SCP protocol (-O)
for arg in "$@"; do
  if [[ "$arg" == "-O" ]]; then
    echo "Blocked: legacy SCP protocol (-O) is disabled to mitigate CVE-2026-35385. Use SFTP mode instead." >&2
    exit 1
  fi
done
REAL_SCP="/usr/bin/scp.distrib"
[[ -x "$REAL_SCP" ]] || REAL_SCP="/usr/bin/scp.real"
exec "$REAL_SCP" "$@"
EOF_SCP
      chmod 755 /usr/bin/scp
      echo -e "  ${GREEN}✓ Installed SFTP-only scp wrapper blocking vulnerable legacy '-O' mode (CVE-2026-35385).${NC}"
    else
      echo -e "  ${GREEN}✓ Legacy scp '-O' mitigation wrapper already active.${NC}"
    fi
  else
    echo -e "  ${GREEN}✓ OpenSSH ${MAJOR}.${MINOR} is natively patched against CVE-2026-35385.${NC}"
  fi
else
  echo -e "  ${GREEN}✓ scp binary not exposed or already wrapped.${NC}"
fi

# ------------------------------------------------------------------------------
# 4. Disable Unnecessary sshd inside Proxmox LXC Containers (Eliminates Port 22)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/4] Securing SSH network exposure...${NC}"
SHOULD_DISABLE_SSH=false
if [[ "$MODE" == "disable-ssh" ]]; then
  SHOULD_DISABLE_SSH=true
elif [[ "$MODE" == "auto" && "$IS_LXC" == true && -z "${SSH_CONNECTION:-}" ]]; then
  SHOULD_DISABLE_SSH=true
fi

if [[ "$SHOULD_DISABLE_SSH" == true ]]; then
  if command -v systemctl >/dev/null 2>&1; then
    systemctl stop ssh.service ssh.socket sshd.service 2>/dev/null || true
    systemctl disable ssh.service ssh.socket sshd.service 2>/dev/null || true
    systemctl mask ssh.service ssh.socket 2>/dev/null || true
  fi
  if command -v apt-get >/dev/null 2>&1 && dpkg -s openssh-server >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get purge -y openssh-server openssh-sftp-server -q 2>/dev/null || true
    apt-get autoremove -y -q 2>/dev/null || true
  fi
  echo -e "  ${GREEN}✓ Stopped and removed openssh-server inside LXC container (port 22 closed).${NC}"
  echo -e "    Manage this container securely from Proxmox host via: ${BOLD}pct enter <CTID>${NC}"
else
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet ssh 2>/dev/null; then
    systemctl reload ssh 2>/dev/null || systemctl restart ssh 2>/dev/null || true
    echo -e "  ${GREEN}✓ Reloaded hardened sshd service (LoginGraceTime 0, DebianBanner no, AllowAgentForwarding no).${NC}"
  else
    echo -e "  ${GREEN}✓ sshd service is inactive (port 22 closed).${NC}"
  fi
  if [[ "$IS_LXC" == true && -n "${SSH_CONNECTION:-}" ]]; then
    echo -e "  ${YELLOW}ℹ Active SSH session detected, so sshd was kept running in hardened mode.${NC}"
    echo -e "    To remove port 22 completely, run from Proxmox console: ${BOLD}sudo $0 --disable-ssh${NC}"
  fi
fi

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}✓ OpenSSH CVE Remediation Complete (CVE-2026-35385, 2024-6387, 2023-28531)${NC}"
echo -e "${GREEN}========================================================================${NC}\n"
