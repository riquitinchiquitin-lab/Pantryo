#!/usr/bin/env bash
# ==============================================================================
# Pantryo - Proxmox VE Host Helper Script
# Creates a Debian 12 LXC container on Proxmox VE and installs Pantryo
# ==============================================================================
set -euo pipefail

YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m")
GN=$(echo "\033[1;92m")
CL=$(echo "\033[m")

header_info() {
  clear
  cat <<"EOF"
    ____              __                  
   / __ \____ _____  / /________  ______  
  / /_/ / __ `/ __ \/ __/ ___/ / / / __ \ 
 / ____/ /_/ / / / / /_/ /  / /_/ / /_/ / 
/_/    \__,_/_/ /_/\__/_/   \__, /\____/  
                           /____/         
            Proxmox VE LXC Installer
EOF
}

header_info

if ! command -v pveversion >/dev/null 2>&1; then
  echo -e "${RD}[ERROR] This helper script must be executed on a Proxmox VE host.${CL}"
  echo -e "If you are already inside a Debian/Ubuntu container or VM, run: ${GN}./install-proxmox.sh${CL}"
  exit 1
fi

echo -e "${BL}[INFO] Welcome to the Pantryo Proxmox LXC installation assistant.${CL}"
echo -e "This script will create a dedicated Debian 12 LXC container and launch the interactive setup.\n"

# Container configurations
NEXTID=$(pvesh get /cluster/nextid)
read -rp "Container ID [${NEXTID}]: " CTID
CTID="${CTID:-$NEXTID}"

read -rp "Hostname [pantryo]: " HN
HN="${HN:-pantryo}"

read -rp "Disk Size in GB [10]: " DISK
DISK="${DISK:-10}"

read -rp "RAM in MB [2048]: " RAM
RAM="${RAM:-2048}"

read -rp "CPU Cores [2]: " CORES
CORES="${CORES:-2}"

read -rp "Storage Pool [local-lvm]: " STORAGE
STORAGE="${STORAGE:-local-lvm}"

read -rp "Network Bridge [vmbr0]: " BRIDGE
BRIDGE="${BRIDGE:-vmbr0}"

# Container Root Password (interactive with secure 20-character auto-generation)
echo -e "\n${BL}[Container Security & Credentials]${CL}"
echo -e "You can type a custom root password, or press Enter to auto-generate a secure 20-character password."
read -rp "Container Root Password [Press Enter to auto-generate 20-char password]: " INPUT_CT_PASSWORD

if [[ -z "$INPUT_CT_PASSWORD" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    CT_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9!@#%^&*' | head -c 20)
  else
    CT_PASSWORD=$(tr -dc 'a-zA-Z0-9!@#%^&*' </dev/urandom | head -c 20)
  fi
  IS_AUTOGEN_CT_PASSWORD=true
else
  CT_PASSWORD="$INPUT_CT_PASSWORD"
  IS_AUTOGEN_CT_PASSWORD=false
fi

echo -e "\n${BL}[INFO] Downloading Debian 12 LXC template if required...${CL}"
pveam update
TEMPLATE=$(pveam available -section system | grep "debian-12-standard" | head -n1 | awk '{print $2}')
if [[ -z "$TEMPLATE" ]]; then
  echo -e "${RD}Could not find Debian 12 standard template.${CL}"
  exit 1
fi

if ! pveam list local | grep -q "$TEMPLATE"; then
  echo -e "${BL}Downloading $TEMPLATE to local...${CL}"
  pveam download local "$TEMPLATE"
fi

echo -e "\n${BL}[INFO] Creating LXC container ${CTID} (${HN})...${CL}"
pct create "$CTID" "local:vztmpl/${TEMPLATE}" \
  -hostname "$HN" \
  -cores "$CORES" \
  -memory "$RAM" \
  -swap 512 \
  -rootfs "${STORAGE}:${DISK}" \
  -net0 "name=eth0,bridge=${BRIDGE},ip=dhcp,firewall=1" \
  -ostype debian \
  -unprivileged 1 \
  -features nesting=1 \
  --password "$CT_PASSWORD" \
  -onboot 1

# Automatically permit /dev/net/tun device in unprivileged container for Tailscale / WireGuard
if [ -f "/etc/pve/lxc/${CTID}.conf" ]; then
  cat <<'EOF_TUN' >> "/etc/pve/lxc/${CTID}.conf"
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file
EOF_TUN
fi

echo -e "${BL}[INFO] Starting container ${CTID}...${CL}"
pct start "$CTID"
sleep 4

CT_IP=$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}' || echo "")

echo -e "\n${GN}========================================================================${CL}"
echo -e "${GN}        🔐 Container Root Credentials for Password Manager              ${CL}"
echo -e "${GN}========================================================================${CL}"
echo -e "Container ID:            ${BL}${CTID}${CL}"
echo -e "Container Hostname:      ${BL}${HN}${CL}"
echo -e "Container Root Username: ${GN}root${CL}"
echo -e "Container Root Password: ${YW}${CT_PASSWORD}${CL}"
if [[ "$IS_AUTOGEN_CT_PASSWORD" == "true" ]]; then
  echo -e "${GN}► [Auto-generated 20-char password - save in Bitwarden / 1Password / KeePass]${CL}"
fi
if [[ -n "$CT_IP" ]]; then
  echo -e "Container IP Address:    ${BL}${CT_IP}${CL}"
fi
echo -e "${GN}========================================================================${CL}\n"

echo -e "${BL}[INFO] Launching interactive Pantryo setup inside container...${CL}"
echo -e "${YW}[INFO] You will now be prompted for your Administrator credentials, 256-bit SQLCipher key,${CL}"
echo -e "${YW}       Access Mode (Local LAN, Cloudflare Tunnel, Tailscale Funnel), and Gemini API Key.${CL}"
echo -e "${YW}       (Remember: all of these values can also be updated anytime inside the web Admin Pane!)${CL}\n"
pct exec "$CTID" -- bash -c "export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get dist-upgrade -y && apt-get install -y git curl ca-certificates sudo unattended-upgrades"
pct exec "$CTID" -- bash -c "mkdir -p /opt/pantryo && cd /opt"
pct exec "$CTID" -- bash -c "git clone https://github.com/riquitinchiquitin-lab/Pantryo.git /opt/pantryo || (cd /opt/pantryo && git pull) || true"
pct exec "$CTID" -- bash -c "cd /opt/pantryo && chmod +x install-proxmox.sh && ./install-proxmox.sh"

echo -e "\n${GN}========================================================================${CL}"
echo -e "${GN}✓ Proxmox LXC Container ${CTID} created and Pantryo installed successfully!${CL}"
echo -e "${GN}========================================================================${CL}"
echo -e "Container Root Password: ${YW}${CT_PASSWORD}${CL} ${GN}(Copy to Password Manager)${CL}"
if [[ -n "$CT_IP" ]]; then
  echo -e "Direct LAN Web URL:      ${BL}http://${CT_IP}:3000${CL}"
fi
echo -e "Enter Container Shell:   ${BL}pct enter ${CTID}${CL}"
echo -e "${GN}Log in with your administrator account and visit the Admin Pane anytime${CL}"
echo -e "${GN}to adjust App URL, Reverse Proxy, Gemini Key, or security settings.${CL}"
echo -e "${GN}========================================================================${CL}"
