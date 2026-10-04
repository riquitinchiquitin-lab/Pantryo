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
  -net0 "name=eth0,bridge=${BRIDGE},ip=dhcp" \
  -ostype debian \
  -unprivileged 1 \
  -features nesting=1 \
  -onboot 1

echo -e "${BL}[INFO] Starting container ${CTID}...${CL}"
pct start "$CTID"
sleep 5

echo -e "${BL}[INFO] Launching interactive Pantryo setup inside container...${CL}"
echo -e "${YW}[INFO] You will now be prompted for your Administrator credentials, 256-bit SQLCipher key,${CL}"
echo -e "${YW}       App URL, Gemini API Key, Cloudflare Tunnel Token, and Mobile API endpoint.${CL}"
echo -e "${YW}       (Remember: all of these values can also be updated anytime inside the web Admin Pane!)${CL}\n"
pct exec "$CTID" -- bash -c "apt-get update && apt-get install -y git curl ca-certificates"
pct exec "$CTID" -- bash -c "mkdir -p /opt/pantryo && cd /opt"
pct exec "$CTID" -- bash -c "git clone https://github.com/yjsboily/pantryo.git /opt/pantryo || true"
pct exec "$CTID" -- bash -c "cd /opt/pantryo && chmod +x install-proxmox.sh && ./install-proxmox.sh"

echo -e "\n${GN}========================================================================${CL}"
echo -e "${GN}✓ Proxmox LXC Container ${CTID} created and Pantryo installed successfully!${CL}"
echo -e "${GN}  Log in with your administrator account and visit the Admin Pane anytime${CL}"
echo -e "${GN}  to adjust App URL, Cloudflare Tunnel, Gemini Key, or security settings.${CL}"
echo -e "${GN}========================================================================${CL}"
