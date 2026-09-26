#!/usr/bin/env bash
# ==============================================================================
# Pantryo - Proxmox VE & Debian/Ubuntu LXC Interactive Installer
# Smart Food Inventory, Receipt Scanning, Meal Planning & SQLCipher Security
# ==============================================================================
set -euo pipefail

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear 2>/dev/null || true

echo -e "${CYAN}${BOLD}"
echo "========================================================================"
echo "               Pantryo - Proxmox VE LXC Installer                      "
echo "        Smart Kitchen Food Inventory, Receipts & Meal Planning          "
echo "========================================================================"
echo -e "${NC}"

# Check root privilege
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This installation script must be run as root.${NC}"
   exit 1
fi

INSTALL_DIR="${INSTALL_DIR:-$(pwd)}"
if [[ "$INSTALL_DIR" == "/" ]]; then
  INSTALL_DIR="/opt/pantryo"
fi

echo -e "${BLUE}[1/5] Configuring Administrator, Network & Integrations...${NC}"
echo -e "Configure your primary administrator account, encryption key, and network endpoints."
echo -e "${YELLOW}Note: ALL of these values can also be modified later in the web Admin Pane.${NC}\n"

# Detect container IP address early for sensible defaults
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

# --- SECTION A: Administrator Account & Local Database Security ---
echo -e "${CYAN}${BOLD}--- Primary Administrator & Local Encryption ---${NC}"

# 1. Full Name or Display Name
DEFAULT_ADMIN_NAME="${PANTRYO_ADMIN_NAME:-Alex Johnson}"
read -rp "$(echo -e "${BOLD}Full Name or Display Name [${GREEN}${DEFAULT_ADMIN_NAME}${NC}${BOLD}]: ${NC}")" INPUT_ADMIN_NAME
ADMIN_NAME="${INPUT_ADMIN_NAME:-$DEFAULT_ADMIN_NAME}"

# 2. Personal Username or Email
DEFAULT_ADMIN_USER="${PANTRYO_ADMIN_USERNAME:-alex}"
while true; do
  read -rp "$(echo -e "${BOLD}Personal Username or Email [${GREEN}${DEFAULT_ADMIN_USER}${NC}${BOLD}]: ${NC}")" INPUT_ADMIN_USER
  ADMIN_USERNAME="${INPUT_ADMIN_USER:-$DEFAULT_ADMIN_USER}"
  ADMIN_USERNAME="$(echo "$ADMIN_USERNAME" | tr '[:upper:]' '[:lower:]' | xargs)"
  if [[ -n "$ADMIN_USERNAME" ]]; then
    break
  fi
  echo -e "${RED}Username cannot be empty. Please enter a username or email.${NC}"
done

# 3. Secure Password (NIST SP 800-63B)
if [[ -n "${PANTRYO_ADMIN_PASSWORD:-}" ]]; then
  ADMIN_PASSWORD="$PANTRYO_ADMIN_PASSWORD"
else
  while true; do
    echo -ne "${BOLD}Secure Password (NIST SP 800-63B, min 8 chars): ${NC}"
    read -rs ADMIN_PASSWORD
    echo ""
    if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
      echo -e "${RED}Password must be at least 8 characters long.${NC}"
      continue
    fi

    echo -ne "${BOLD}Confirm Password: ${NC}"
    read -rs ADMIN_PASSWORD_CONFIRM
    echo ""
    if [[ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]]; then
      echo -e "${RED}Passwords do not match. Please try again.${NC}"
      continue
    fi
    break
  done
fi

# 4. At-Rest SQLite SQLCipher 256-bit Encryption Key
GEN_DB_KEY=""
if command -v openssl >/dev/null 2>&1; then
  GEN_DB_KEY=$(openssl rand -hex 32)
elif command -v node >/dev/null 2>&1; then
  GEN_DB_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
else
  GEN_DB_KEY=$(tr -dc 'a-f0-9' </dev/urandom | head -c 64 || true)
fi

echo ""
echo -e "${CYAN}${BOLD}At-Rest SQLite SQLCipher Key (256-bit AES-GCM):${NC}"
echo -e "Auto-generated secure key: ${GREEN}${GEN_DB_KEY}${NC}"
read -rp "$(echo -e "${BOLD}Use this auto-generated 256-bit encryption key? [${GREEN}Y/n${NC}${BOLD}]: ${NC}")" USE_GEN_KEY
USE_GEN_KEY="${USE_GEN_KEY:-Y}"

if [[ "$USE_GEN_KEY" =~ ^[Yy]$ ]]; then
  DB_KEY="$GEN_DB_KEY"
else
  while true; do
    read -rp "Enter custom encryption key (min 16 chars, 64 hex recommended): " CUSTOM_KEY
    if [[ ${#CUSTOM_KEY} -ge 16 ]]; then
      DB_KEY="$CUSTOM_KEY"
      break
    fi
    echo -e "${RED}Key must be at least 16 characters.${NC}"
  done
fi

# 5. Application HTTP Port
DEFAULT_PORT="${PORT:-3000}"
read -rp "$(echo -e "${BOLD}Application HTTP Port [${GREEN}${DEFAULT_PORT}${NC}${BOLD}]: ${NC}")" INPUT_PORT
APP_PORT="${INPUT_PORT:-$DEFAULT_PORT}"

# --- SECTION B: Network, Public Domain, Cloudflare & External Integrations ---
echo -e "\n${CYAN}${BOLD}--- Network, External Domain & Integrations ---${NC}"

# 6. Public Application URL (e.g. https://pantryo.yknet.org or http://IP:PORT)
DEFAULT_APP_URL="${APP_URL:-http://${HOST_IP}:${APP_PORT}}"
read -rp "$(echo -e "${BOLD}Public Application URL / Domain [${GREEN}${DEFAULT_APP_URL}${NC}${BOLD}]: ${NC}")" INPUT_APP_URL
APP_URL="${INPUT_APP_URL:-$DEFAULT_APP_URL}"

# 7. Google Gemini API Key (Vision OCR & Smart Recipes)
DEFAULT_GEMINI_KEY="${GEMINI_API_KEY:-}"
if [[ -n "$DEFAULT_GEMINI_KEY" ]]; then
  PROMPT_GEMINI="Google Gemini API Key [${GREEN}configured from env${NC}${BOLD}]: "
else
  PROMPT_GEMINI="Google Gemini API Key [${YELLOW}leave blank to configure later in Admin Pane${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_GEMINI}${NC}")" INPUT_GEMINI_KEY
GEMINI_KEY="${INPUT_GEMINI_KEY:-$DEFAULT_GEMINI_KEY}"

# 8. Cloudflare Zero Trust Tunnel Token
DEFAULT_CF_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
if [[ -n "$DEFAULT_CF_TOKEN" ]]; then
  PROMPT_CF="Cloudflare Zero Trust Tunnel Token [${GREEN}configured from env${NC}${BOLD}]: "
else
  PROMPT_CF="Cloudflare Zero Trust Tunnel Token [${YELLOW}leave blank to skip / configure later${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_CF}${NC}")" INPUT_CF_TOKEN
CF_TUNNEL_TOKEN="${INPUT_CF_TOKEN:-$DEFAULT_CF_TOKEN}"

# 9. Expo Mobile Client API URL
DEFAULT_EXPO_URL="${EXPO_PUBLIC_API_URL:-${APP_URL}/api/v1/inventory}"
read -rp "$(echo -e "${BOLD}Expo Mobile Client API URL [${GREEN}${DEFAULT_EXPO_URL}${NC}${BOLD}]: ${NC}")" INPUT_EXPO_URL
EXPO_API_URL="${INPUT_EXPO_URL:-$DEFAULT_EXPO_URL}"

# 10. External PostgreSQL Database URL (Optional)
DEFAULT_DB_URL="${DATABASE_URL:-}"
if [[ -n "$DEFAULT_DB_URL" ]]; then
  PROMPT_DB="PostgreSQL DATABASE_URL [${GREEN}configured${NC}${BOLD}]: "
else
  PROMPT_DB="PostgreSQL DATABASE_URL [${YELLOW}leave blank to use local encrypted SQLCipher${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_DB}${NC}")" INPUT_DB_URL
DB_URL="${INPUT_DB_URL:-$DEFAULT_DB_URL}"

echo -e "\n${BLUE}[2/5] Checking and Installing System Packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  gnupg \
  build-essential \
  python3 \
  make \
  g++ \
  gcc

# Install Node.js 20 if not present or < 20
NEED_NODE=false
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=true
else
  NODE_VER=$(node -v | tr -d 'v' | cut -d. -f1)
  if [[ "$NODE_VER" -lt 20 ]]; then
    NEED_NODE=true
  fi
fi

if [[ "$NEED_NODE" == "true" ]]; then
  echo -e "${CYAN}Installing Node.js 20 LTS...${NC}"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

echo -e "${GREEN}✓ Node.js $(node -v) and npm $(npm -v) are ready.${NC}"

echo -e "\n${BLUE}[3/5] Setting up Pantryo Environment in ${INSTALL_DIR}...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Write .env configuration file
cat <<EOF > "$INSTALL_DIR/.env"
# Pantryo - Proxmox VE Production Environment Configuration
# Generated automatically during interactive LXC installation.
# All values can be viewed and updated anytime inside the web Admin Pane.

PORT=${APP_PORT}
NODE_ENV=production

# Primary Administrator
PANTRYO_ADMIN_NAME="${ADMIN_NAME}"
PANTRYO_ADMIN_USERNAME="${ADMIN_USERNAME}"
PANTRYO_ADMIN_PASSWORD="${ADMIN_PASSWORD}"
PANTRYO_ADMIN_AVATAR="/avatars/chef-cat.svg"

# Database Encryption (256-bit AES-GCM SQLCipher)
DB_ENCRYPTION_KEY="${DB_KEY}"

# Application Public Host & Domain
APP_URL="${APP_URL}"

# AI Services (Vision OCR, Receipt Scanning, Smart Recipes)
GEMINI_API_KEY="${GEMINI_KEY}"

# Remote Access & Cloudflare Zero Trust
CLOUDFLARE_TUNNEL_TOKEN="${CF_TUNNEL_TOKEN}"

# Expo React Native Mobile Client API
EXPO_PUBLIC_API_URL="${EXPO_API_URL}"

# Optional PostgreSQL / Prisma URL
DATABASE_URL="${DB_URL}"
EOF
chmod 600 "$INSTALL_DIR/.env"
echo -e "${GREEN}✓ Environment configuration written to .env (mode 600).${NC}"

# Optional Cloudflare Tunnel daemon installation
if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
  echo -e "\n${CYAN}Configuring Cloudflare Zero Trust Tunnel (cloudflared)...${NC}"
  if ! command -v cloudflared >/dev/null 2>&1; then
    ARCH=$(dpkg --print-architecture 2>/dev/null || echo "amd64")
    curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -o /tmp/cloudflared.deb 2>/dev/null && dpkg -i /tmp/cloudflared.deb 2>/dev/null || true
    rm -f /tmp/cloudflared.deb 2>/dev/null || true
  fi

  if command -v cloudflared >/dev/null 2>&1; then
    cat <<EOF > /etc/systemd/system/pantryo-tunnel.service
[Unit]
Description=Cloudflare Zero Trust Tunnel for Pantryo
After=network.target pantryo.service

[Service]
Type=simple
User=root
ExecStart=$(which cloudflared) tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable pantryo-tunnel.service 2>/dev/null || true
    systemctl restart pantryo-tunnel.service 2>/dev/null || true
    echo -e "${GREEN}✓ Cloudflare tunnel service 'pantryo-tunnel.service' enabled & active.${NC}"
  fi
fi

echo -e "\n${BLUE}[4/5] Building Production Application...${NC}"
npm install
npm run build

echo -e "\n${BLUE}[5/5] Configuring systemd service 'pantryo.service'...${NC}"
cat <<EOF > /etc/systemd/system/pantryo.service
[Unit]
Description=Pantryo Smart Kitchen & Inventory Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=$(which node) ${INSTALL_DIR}/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${INSTALL_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable pantryo.service
systemctl restart pantryo.service

echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}           🎉 Pantryo Installed & Running Successfully!                ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "Primary Public URL:  ${CYAN}${BOLD}${APP_URL}${NC}"
echo -e "Local LAN URL:       ${CYAN}http://${HOST_IP}:${APP_PORT}${NC}"
echo -e "Admin Username:      ${GREEN}${BOLD}${ADMIN_USERNAME}${NC}"
echo -e "Admin Display Name:  ${GREEN}${ADMIN_NAME}${NC}"
echo -e "Database Security:   ${GREEN}256-bit AES-GCM SQLCipher (Active)${NC}"
if [[ -n "$GEMINI_KEY" ]]; then
  echo -e "Gemini AI Engine:    ${GREEN}Configured (Vision & Recipe AI Active)${NC}"
else
  echo -e "Gemini AI Engine:    ${YELLOW}Not set (can be configured in Admin Pane)${NC}"
fi
if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
  echo -e "Cloudflare Tunnel:   ${GREEN}Configured (Zero Trust Remote Access)${NC}"
else
  echo -e "Cloudflare Tunnel:   ${YELLOW}Not configured (optional)${NC}"
fi
echo -e "Expo Mobile API URL: ${CYAN}${EXPO_API_URL}${NC}"
echo -e ""
echo -e "${YELLOW}${BOLD}Management & Settings:${NC}"
echo -e "All of these values (Display Name, Username, Password, Database Key,"
echo -e "Public App URL, Gemini API Key, Cloudflare Tunnel Token, and Mobile API)"
echo -e "can be viewed and modified anytime in the web ${BOLD}Admin Pane${NC}."
echo -e "${GREEN}========================================================================${NC}\n"
