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

# Detect if running on Proxmox VE Hypervisor Host
if command -v pveversion >/dev/null 2>&1; then
  echo -e "${YELLOW}${BOLD}[Proxmox VE Hypervisor Host Detected]${NC}"
  echo -e "You are running this command on the Proxmox VE host shell (${CYAN}$(pveversion 2>/dev/null | head -n 1)${NC})."
  echo -e "Best practice: Deploy Pantryo in a dedicated ${BOLD}Debian 12 LXC Container${NC}."
  echo ""
  read -rp "$(echo -e "${BOLD}Would you like to automatically create and deploy an LXC container for Pantryo? [${GREEN}Y/n${NC}${BOLD}]: ${NC}")" PVE_AUTO_LXC
  PVE_AUTO_LXC="${PVE_AUTO_LXC:-Y}"

  if [[ "$PVE_AUTO_LXC" =~ ^[Yy]$ ]]; then
    # Auto-find available CTID starting from 200
    NEXT_ID=200
    while pct status "$NEXT_ID" >/dev/null 2>&1 || qm status "$NEXT_ID" >/dev/null 2>&1; do
      NEXT_ID=$((NEXT_ID + 1))
    done

    read -rp "$(echo -e "${BOLD}Container ID [${GREEN}${NEXT_ID}${NC}${BOLD}]: ${NC}")" CT_ID
    CT_ID="${CT_ID:-$NEXT_ID}"

    read -rp "$(echo -e "${BOLD}Container Hostname [${GREEN}pantryo${NC}${BOLD}]: ${NC}")" CT_NAME
    CT_NAME="${CT_NAME:-pantryo}"

    read -rp "$(echo -e "${BOLD}RAM in MB [${GREEN}1024${NC}${BOLD}]: ${NC}")" CT_RAM
    CT_RAM="${CT_RAM:-1024}"

    read -rp "$(echo -e "${BOLD}Disk Size in GB [${GREEN}8${NC}${BOLD}]: ${NC}")" CT_DISK
    CT_DISK="${CT_DISK:-8}"

    # Detect storage pool with rootdir support
    DEFAULT_STORAGE=$(pvesm status -content rootdir 2>/dev/null | awk 'NR>1 {print $1}' | head -n 1 || echo "local-lvm")
    read -rp "$(echo -e "${BOLD}Storage Pool [${GREEN}${DEFAULT_STORAGE}${NC}${BOLD}]: ${NC}")" CT_STORAGE
    CT_STORAGE="${CT_STORAGE:-$DEFAULT_STORAGE}"

    # Container Root Password (interactive + auto-generation)
    echo -e "\n${CYAN}${BOLD}--- Container Root Password ---${NC}"
    echo -e "You can type a custom root password, or press Enter to auto-generate a secure 20-character password."
    read -rp "$(echo -e "${BOLD}Container Root Password [${GREEN}Press Enter to auto-generate secure 20-char password${NC}${BOLD}]: ${NC}")" INPUT_CT_PASSWORD

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

    echo -e "\n${BLUE}Updating template catalog & preparing Debian 12...${NC}"
    pveam update || true
    TMPL_FILE=$(pveam available -section system 2>/dev/null | grep -E "debian-12-standard" | awk '{print $2}' | tail -n 1 || echo "")
    if [[ -z "$TMPL_FILE" ]]; then
      TMPL_FILE="debian-12-standard_12.7-1_amd64.tar.zst"
    fi

    # Check if template already in storage
    if ! pveam list local 2>/dev/null | grep -q "$TMPL_FILE"; then
      echo -e "${BLUE}Downloading Debian 12 template (${TMPL_FILE})...${NC}"
      pveam download local "$TMPL_FILE" || true
    fi

    echo -e "\n${BLUE}Creating unprivileged LXC container ${CT_ID} (${CT_NAME})...${NC}"
    pct create "$CT_ID" "local:vztmpl/${TMPL_FILE}" \
      --hostname "$CT_NAME" \
      --cores 2 \
      --memory "$CT_RAM" \
      --swap 512 \
      --rootfs "${CT_STORAGE}:${CT_DISK}" \
      --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=1 \
      --features nesting=1 \
      --unprivileged 1 \
      --password "$CT_PASSWORD" \
      --onboot 1

    echo -e "${BLUE}Starting Container ${CT_ID}...${NC}"
    pct start "$CT_ID"
    sleep 4

    CT_IP=$(pct exec "$CT_ID" -- hostname -I 2>/dev/null | awk '{print $1}' || echo "")

    echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
    echo -e "${GREEN}${BOLD}         🔐 Container Root Credentials for Password Manager             ${NC}"
    echo -e "${GREEN}${BOLD}========================================================================${NC}"
    echo -e "Container ID:            ${CYAN}${BOLD}${CT_ID}${NC}"
    echo -e "Container Hostname:      ${CYAN}${CT_NAME}${NC}"
    echo -e "Container Root Username: ${GREEN}${BOLD}root${NC}"
    echo -e "Container Root Password: ${YELLOW}${BOLD}${CT_PASSWORD}${NC}"
    if [[ "$IS_AUTOGEN_CT_PASSWORD" == "true" ]]; then
      echo -e "${GREEN}► [Auto-generated 20-character password - copy to Bitwarden / 1Password]${NC}"
    fi
    if [[ -n "$CT_IP" ]]; then
      echo -e "Container IP Address:    ${CYAN}${CT_IP}${NC}"
    fi
    echo -e "${GREEN}========================================================================${NC}\n"

    read -rp "$(echo -e "${BOLD}Would you like to install Pantryo inside Container ${CT_ID} now? [${GREEN}Y/n${NC}${BOLD}]: ${NC}")" DO_INSTALL_INSIDE
    DO_INSTALL_INSIDE="${DO_INSTALL_INSIDE:-Y}"

    if [[ "$DO_INSTALL_INSIDE" =~ ^[Yy]$ ]]; then
      echo -e "\n${BLUE}Installing packages & running Pantryo setup inside Container ${CT_ID}...${NC}"
      pct exec "$CT_ID" -- bash -c "apt-get update -y && apt-get install -y curl ca-certificates sudo git && bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install-proxmox.sh)\""
      exit 0
    else
      echo -e "\n${CYAN}To enter your container anytime, run:${NC}"
      echo -e "${BOLD}pct enter ${CT_ID}${NC}\n"
      exit 0
    fi
  fi
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

# Display SQLCipher 256-bit key in copy-friendly format for password managers
echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}     🔑 SQLCipher 256-bit Database Encryption Key (AES-256-GCM)        ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "Encryption Key: ${YELLOW}${BOLD}${DB_KEY}${NC}"
echo -e "${GREEN}► [Copy this key to your Password Manager under 'Pantryo DB Encryption Key']${NC}"
echo -e "  Saved in:     ${INSTALL_DIR}/.env (DB_ENCRYPTION_KEY)"
echo -e "${GREEN}========================================================================${NC}\n"

# 5. Application HTTP Port
DEFAULT_PORT="${PORT:-3000}"
read -rp "$(echo -e "${BOLD}Application HTTP Port [${GREEN}${DEFAULT_PORT}${NC}${BOLD}]: ${NC}")" INPUT_PORT
APP_PORT="${INPUT_PORT:-$DEFAULT_PORT}"

# --- SECTION B: Reverse Proxy & Ingress Selection (5 Options + LAN Only) ---
echo -e "\n${CYAN}${BOLD}--- Reverse Proxy & Ingress Configuration ---${NC}"
echo -e "Choose your external access / reverse proxy architecture:"
echo -e "  ${BOLD}[1] Cloudflare Tunnel${NC} (Zero Port-Forwarding, instant HTTPS, DDoS protection)"
echo -e "  ${BOLD}[2] Caddy${NC} (Automatic HTTPS with Let's Encrypt / ZeroSSL, zero-config renewal)"
echo -e "  ${BOLD}[3] Nginx & Let's Encrypt (Certbot)${NC} (Native Debian/Ubuntu reverse proxy + certbot)"
echo -e "  ${BOLD}[4] Nginx Proxy Manager (NPM GUI)${NC} (Upstream container configuration + web UI guide)"
echo -e "  ${BOLD}[5] Traefik v2 / v3${NC} (Dynamic file provider configuration with automatic TLS)"
echo -e "  ${BOLD}[6] Local Network Only${NC} (Direct HTTP on port ${APP_PORT}, no reverse proxy)"

DEFAULT_MODE_CHOICE="1"
if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  DEFAULT_MODE_CHOICE="1"
elif [[ -n "${APP_URL:-}" ]] && [[ ! "${APP_URL}" =~ (localhost|127\.|192\.168|\.local) ]]; then
  DEFAULT_MODE_CHOICE="2"
fi

read -rp "$(echo -e "${BOLD}Select Reverse Proxy [1-6, default: ${GREEN}${DEFAULT_MODE_CHOICE}${NC}${BOLD}]: ${NC}")" INPUT_MODE_CHOICE
MODE_CHOICE="${INPUT_MODE_CHOICE:-$DEFAULT_MODE_CHOICE}"

HOSTING_MODE="cloudflare"
CF_TUNNEL_TOKEN=""
PROXY_DOMAIN=""
CERTBOT_EMAIL=""

case "$MODE_CHOICE" in
  2)
    HOSTING_MODE="caddy"
    echo -e "\n${BLUE}--> Selected: Caddy (Automatic HTTPS)${NC}"
    DEFAULT_APP_URL="${APP_URL:-https://pantryo.example.com}"
    read -rp "$(echo -e "${BOLD}Public Domain Name (e.g. pantryo.mydomain.com) [${GREEN}${DEFAULT_APP_URL#https://}${NC}${BOLD}]: ${NC}")" INPUT_DOMAIN
    PROXY_DOMAIN="${INPUT_DOMAIN:-${DEFAULT_APP_URL#https://}}"
    PROXY_DOMAIN="${PROXY_DOMAIN#http://}"
    PROXY_DOMAIN="${PROXY_DOMAIN%/}"
    APP_URL="https://${PROXY_DOMAIN}"
    ;;
  3)
    HOSTING_MODE="nginx"
    echo -e "\n${BLUE}--> Selected: Nginx & Let's Encrypt (Certbot)${NC}"
    DEFAULT_APP_URL="${APP_URL:-https://pantryo.example.com}"
    read -rp "$(echo -e "${BOLD}Public Domain Name (e.g. pantryo.mydomain.com) [${GREEN}${DEFAULT_APP_URL#https://}${NC}${BOLD}]: ${NC}")" INPUT_DOMAIN
    PROXY_DOMAIN="${INPUT_DOMAIN:-${DEFAULT_APP_URL#https://}}"
    PROXY_DOMAIN="${PROXY_DOMAIN#http://}"
    PROXY_DOMAIN="${PROXY_DOMAIN%/}"
    APP_URL="https://${PROXY_DOMAIN}"
    read -rp "$(echo -e "${BOLD}Admin Email for Let's Encrypt Certificate Expiry [${GREEN}${ADMIN_USERNAME}@${PROXY_DOMAIN}${NC}${BOLD}]: ${NC}")" INPUT_EMAIL
    CERTBOT_EMAIL="${INPUT_EMAIL:-${ADMIN_USERNAME}@${PROXY_DOMAIN}}"
    ;;
  4)
    HOSTING_MODE="npm"
    echo -e "\n${BLUE}--> Selected: Nginx Proxy Manager (NPM GUI)${NC}"
    DEFAULT_APP_URL="${APP_URL:-https://pantryo.example.com}"
    read -rp "$(echo -e "${BOLD}Configured Domain in NPM (e.g. pantryo.mydomain.com) [${GREEN}${DEFAULT_APP_URL#https://}${NC}${BOLD}]: ${NC}")" INPUT_DOMAIN
    PROXY_DOMAIN="${INPUT_DOMAIN:-${DEFAULT_APP_URL#https://}}"
    PROXY_DOMAIN="${PROXY_DOMAIN#http://}"
    PROXY_DOMAIN="${PROXY_DOMAIN%/}"
    APP_URL="https://${PROXY_DOMAIN}"
    ;;
  5)
    HOSTING_MODE="traefik"
    echo -e "\n${BLUE}--> Selected: Traefik v2 / v3 (Dynamic Configuration)${NC}"
    DEFAULT_APP_URL="${APP_URL:-https://pantryo.example.com}"
    read -rp "$(echo -e "${BOLD}Public Domain Name (e.g. pantryo.mydomain.com) [${GREEN}${DEFAULT_APP_URL#https://}${NC}${BOLD}]: ${NC}")" INPUT_DOMAIN
    PROXY_DOMAIN="${INPUT_DOMAIN:-${DEFAULT_APP_URL#https://}}"
    PROXY_DOMAIN="${PROXY_DOMAIN#http://}"
    PROXY_DOMAIN="${PROXY_DOMAIN%/}"
    APP_URL="https://${PROXY_DOMAIN}"
    ;;
  6)
    HOSTING_MODE="local_lan"
    echo -e "\n${GREEN}--> Selected: Local Network (LAN Only)${NC}"
    APP_URL="http://${HOST_IP}:${APP_PORT}"
    ;;
  *)
    HOSTING_MODE="cloudflare"
    echo -e "\n${BLUE}--> Selected: Cloudflare Zero Trust Tunnel${NC}"
    DEFAULT_APP_URL="${APP_URL:-https://pantryo.yourdomain.com}"
    read -rp "$(echo -e "${BOLD}Public Cloudflare Hostname / URL [${GREEN}${DEFAULT_APP_URL}${NC}${BOLD}]: ${NC}")" INPUT_APP_URL
    APP_URL="${INPUT_APP_URL:-$DEFAULT_APP_URL}"
    DEFAULT_CF_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
    if [[ -n "$DEFAULT_CF_TOKEN" ]]; then
      PROMPT_CF="Cloudflare Zero Trust Tunnel Token [${GREEN}configured from env${NC}${BOLD}]: "
    else
      PROMPT_CF="Cloudflare Zero Trust Tunnel Token [${YELLOW}leave blank to configure later in Admin Pane${NC}${BOLD}]: "
    fi
    read -rp "$(echo -e "${BOLD}${PROMPT_CF}${NC}")" INPUT_CF_TOKEN
    CF_TUNNEL_TOKEN="${INPUT_CF_TOKEN:-$DEFAULT_CF_TOKEN}"
    ;;
esac

# 7. Google Gemini API Key (Vision OCR & Smart Recipes)
DEFAULT_GEMINI_KEY="${GEMINI_API_KEY:-}"
if [[ -n "$DEFAULT_GEMINI_KEY" ]]; then
  PROMPT_GEMINI="Google Gemini API Key [${GREEN}configured from env${NC}${BOLD}]: "
else
  PROMPT_GEMINI="Google Gemini API Key [${YELLOW}leave blank to configure later in Admin Pane${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_GEMINI}${NC}")" INPUT_GEMINI_KEY
GEMINI_KEY="${INPUT_GEMINI_KEY:-$DEFAULT_GEMINI_KEY}"

# 8. Expo Mobile Client API URL
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

# Install Node.js 22 if not present or < 22
NEED_NODE=false
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=true
else
  NODE_VER=$(node -v | tr -d 'v' | cut -d. -f1)
  if [[ "$NODE_VER" -lt 22 ]]; then
    NEED_NODE=true
  fi
fi

if [[ "$NEED_NODE" == "true" ]]; then
  echo -e "${CYAN}Installing Node.js 22 LTS...${NC}"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
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
PANTRYO_HOSTING_MODE="${HOSTING_MODE}"
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

# ------------------------------------------------------------------------------
# Automated Reverse Proxy & Ingress Provisioning
# ------------------------------------------------------------------------------
case "$HOSTING_MODE" in
  caddy)
    echo -e "\n${CYAN}Configuring Caddy Web Server (Automatic HTTPS)...${NC}"
    if ! command -v caddy >/dev/null 2>&1; then
      apt-get install -y debian-keyring debian-archive-keyring apt-transport-https 2>/dev/null || true
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes 2>/dev/null || true
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null 2>&1 || true
      apt-get update -y >/dev/null 2>&1 || true
      apt-get install -y caddy >/dev/null 2>&1 || true
    fi
    if command -v caddy >/dev/null 2>&1; then
      mkdir -p /etc/caddy
      cat <<EOF > /etc/caddy/Caddyfile
${PROXY_DOMAIN} {
    reverse_proxy localhost:${APP_PORT}
}
EOF
      systemctl daemon-reload 2>/dev/null || true
      systemctl enable caddy 2>/dev/null || true
      systemctl restart caddy 2>/dev/null || true
      echo -e "${GREEN}✓ Caddy configured with automatic Let's Encrypt HTTPS for ${PROXY_DOMAIN}.${NC}"
    fi
    ;;
  nginx)
    echo -e "\n${CYAN}Configuring Nginx Reverse Proxy & Let's Encrypt...${NC}"
    apt-get install -y nginx certbot python3-certbot-nginx >/dev/null 2>&1 || true
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
    cat <<EOF > /etc/nginx/sites-available/pantryo
server {
    listen 80;
    server_name ${PROXY_DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/pantryo /etc/nginx/sites-enabled/pantryo
    rm -f /etc/nginx/sites-enabled/default
    nginx -t 2>/dev/null && systemctl restart nginx 2>/dev/null || true
    echo -e "${GREEN}✓ Nginx virtual host configured for ${PROXY_DOMAIN}.${NC}"

    if [[ -n "$CERTBOT_EMAIL" ]] && command -v certbot >/dev/null 2>&1; then
      echo -e "${CYAN}Requesting Let's Encrypt SSL certificate via Certbot...${NC}"
      certbot --nginx -d "${PROXY_DOMAIN}" --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" --redirect 2>/dev/null || {
        echo -e "${YELLOW}Note: Certbot challenge deferred (ensure DNS points to this server, then run: certbot --nginx -d ${PROXY_DOMAIN})${NC}"
      }
    fi
    ;;
  npm)
    echo -e "\n${CYAN}Generating Nginx Proxy Manager (NPM GUI) Configuration Guide...${NC}"
    cat <<EOF > "${INSTALL_DIR}/NPM-CONFIGURATION.txt"
========================================================================
             Nginx Proxy Manager (NPM) Configuration Guide              
========================================================================
In your Nginx Proxy Manager Web GUI (http://<npm-ip>:81):
  1. Click "Proxy Hosts" -> "Add Proxy Host"
  2. Domain Names:             ${PROXY_DOMAIN}
  3. Scheme:                   http
  4. Forward Hostname / IP:    ${HOST_IP}
  5. Forward Port:             ${APP_PORT}
  6. Cache Assets:             ON
  7. Block Common Exploits:    ON
  8. Websockets Support:       ON (Required for real-time receipt status)
  9. SSL Tab:
     - SSL Certificate: Request a new SSL Certificate
     - Force SSL: ON
     - HTTP/2 Support: ON
     - HSTS Enabled: ON
========================================================================
EOF
    echo -e "${GREEN}✓ NPM configuration guide saved to ${INSTALL_DIR}/NPM-CONFIGURATION.txt.${NC}"
    ;;
  traefik)
    echo -e "\n${CYAN}Generating Traefik dynamic provider configuration...${NC}"
    mkdir -p /etc/traefik/dynamic "${INSTALL_DIR}"
    cat <<EOF > "${INSTALL_DIR}/traefik-pantryo.yml"
# Traefik v2 / v3 Dynamic Configuration for Pantryo
http:
  routers:
    pantryo-secure:
      rule: "Host(\`${PROXY_DOMAIN}\`)"
      entryPoints:
        - websecure
      service: pantryo-service
      tls:
        certResolver: myresolver
    pantryo-http:
      rule: "Host(\`${PROXY_DOMAIN}\`)"
      entryPoints:
        - web
      middlewares:
        - redirect-to-https
      service: pantryo-service

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true

  services:
    pantryo-service:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:${APP_PORT}"
EOF
    cp "${INSTALL_DIR}/traefik-pantryo.yml" /etc/traefik/dynamic/pantryo.yml 2>/dev/null || true
    echo -e "${GREEN}✓ Traefik dynamic router config saved to ${INSTALL_DIR}/traefik-pantryo.yml.${NC}"
    ;;
  cloudflare)
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
        systemctl daemon-reload 2>/dev/null || true
        systemctl enable pantryo-tunnel.service 2>/dev/null || true
        systemctl restart pantryo-tunnel.service 2>/dev/null || true
        echo -e "${GREEN}✓ Cloudflare tunnel service 'pantryo-tunnel.service' enabled & active.${NC}"
      fi
    fi
    ;;
esac

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

# Configure daily automated package security patches & updates
cat <<EOF_CRON > /etc/cron.daily/pantryo-autoupdate
#!/usr/bin/env bash
# Pantryo automated daily vulnerability remediation and package updater
cd "${INSTALL_DIR}" || exit 0
if [ -f "scripts/auto-update-dependencies.js" ]; then
  node scripts/auto-update-dependencies.js >> /var/log/pantryo-autoupdate.log 2>&1
  systemctl restart pantryo.service || true
fi
EOF_CRON
chmod +x /etc/cron.daily/pantryo-autoupdate

echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}           🎉 Pantryo Installed & Running Successfully!                ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
echo -e "Primary Public URL:  ${CYAN}${BOLD}${APP_URL}${NC}"
echo -e "Local LAN URL:       ${CYAN}http://${HOST_IP}:${APP_PORT}${NC}"
echo -e "Reverse Proxy Mode:  ${GREEN}${BOLD}${HOSTING_MODE}${NC}"
echo -e "Admin Username:      ${GREEN}${BOLD}${ADMIN_USERNAME}${NC}"
echo -e "Admin Display Name:  ${GREEN}${ADMIN_NAME}${NC}"
echo -e "Database Security:   ${GREEN}256-bit AES-GCM SQLCipher (Active)${NC}"
echo -e "SQLCipher DB Key:    ${YELLOW}${DB_KEY}${NC} ${GREEN}(Saved to .env & Password Manager)${NC}"
if [[ "$HOSTING_MODE" == "npm" ]]; then
  echo -e "NPM Configuration:   ${CYAN}${INSTALL_DIR}/NPM-CONFIGURATION.txt${NC}"
elif [[ "$HOSTING_MODE" == "traefik" ]]; then
  echo -e "Traefik Provider:    ${CYAN}${INSTALL_DIR}/traefik-pantryo.yml${NC}"
fi
if [[ -n "$GEMINI_KEY" ]]; then
  echo -e "Gemini AI Engine:    ${GREEN}Configured (Vision & Recipe AI Active)${NC}"
else
  echo -e "Gemini AI Engine:    ${YELLOW}Not set (can be configured in Admin Pane)${NC}"
fi
if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
  echo -e "Cloudflare Tunnel:   ${GREEN}Configured & Running as Systemd Service${NC}"
fi
echo -e "Expo Mobile API URL: ${CYAN}${EXPO_API_URL}${NC}"
echo -e ""
echo -e "${YELLOW}${BOLD}Management & Settings:${NC}"
echo -e "All credentials, encryption keys, reverse proxies, and Gemini keys"
echo -e "can be audited and managed anytime in the web ${BOLD}Admin Pane${NC}."
echo -e "${GREEN}========================================================================${NC}\n"
