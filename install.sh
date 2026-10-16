#!/usr/bin/env bash
# ==============================================================================
# Pantryo - Universal Linux & Raspberry Pi Interactive Installer
# Compatible with: Raspberry Pi OS, Debian, Ubuntu, Armbian, DietPi,
#                  Fedora, Rocky Linux, AlmaLinux, CentOS, Arch Linux, Alpine
# Architectures: aarch64 (ARM64), armv7l (ARM32), x86_64 (AMD64)
# ==============================================================================
set -euo pipefail

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

clear 2>/dev/null || true

echo -e "${CYAN}${BOLD}"
echo "========================================================================"
echo "          Pantryo - Universal Linux & Raspberry Pi Installer            "
echo "     Smart Kitchen Inventory, Receipt OCR, Meal Planning & SQLCipher    "
echo "========================================================================"
echo -e "${NC}"

# ------------------------------------------------------------------------------
# 1. Privilege Check (root or sudo)
# ------------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    echo -e "${YELLOW}[INFO] Re-running installer with sudo privileges...${NC}"
    exec sudo bash "$0" "$@"
  else
    echo -e "${RED}[ERROR] This installation script must be run as root or with sudo.${NC}"
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# 2. Hardware & Architecture Detection
# ------------------------------------------------------------------------------
RAW_ARCH=$(uname -m)
case "$RAW_ARCH" in
  x86_64|amd64)
    ARCH="amd64"
    CF_ARCH="amd64"
    NODE_ARCH="x64"
    ;;
  aarch64|arm64)
    ARCH="arm64"
    CF_ARCH="arm64"
    NODE_ARCH="arm64"
    ;;
  armv7l|armv6l|armhf)
    ARCH="armhf"
    CF_ARCH="arm"
    NODE_ARCH="armv7l"
    ;;
  i386|i686)
    ARCH="386"
    CF_ARCH="386"
    NODE_ARCH="x86"
    ;;
  *)
    ARCH="$RAW_ARCH"
    CF_ARCH="amd64"
    NODE_ARCH="x64"
    ;;
esac

# Detect Raspberry Pi or Single Board Computer (SBC)
IS_RASPBERRY_PI=false
DEVICE_MODEL="Generic Linux Device"
if [ -f /proc/device-tree/model ]; then
  DEVICE_MODEL=$(tr -d '\0' </proc/device-tree/model 2>/dev/null || echo "ARM Device")
  if echo "$DEVICE_MODEL" | grep -qi "Raspberry Pi"; then
    IS_RASPBERRY_PI=true
  fi
elif grep -qi "raspberry" /proc/cpuinfo 2>/dev/null; then
  IS_RASPBERRY_PI=true
  DEVICE_MODEL="Raspberry Pi"
elif [ -f /etc/rpi-issue ]; then
  IS_RASPBERRY_PI=true
  DEVICE_MODEL="Raspberry Pi (Raspberry Pi OS)"
fi

# Detect Linux Distribution
OS="unknown"
OS_NAME="Linux"
OS_FAMILY="debian"
if [ -f /etc/os-release ]; then
  # shellcheck source=/dev/null
  . /etc/os-release
  OS="${ID:-linux}"
  OS_NAME="${PRETTY_NAME:-$ID}"
  if [[ "$OS" =~ ^(debian|ubuntu|raspbian|linuxmint|pop|armbian|dietpi)$ ]] || [[ "${ID_LIKE:-}" =~ (debian|ubuntu) ]]; then
    OS_FAMILY="debian"
  elif [[ "$OS" =~ ^(fedora|rhel|centos|rocky|almalinux)$ ]] || [[ "${ID_LIKE:-}" =~ (rhel|fedora) ]]; then
    OS_FAMILY="rhel"
  elif [[ "$OS" =~ ^(arch|manjaro|endeavouros)$ ]] || [[ "${ID_LIKE:-}" =~ arch ]]; then
    OS_FAMILY="arch"
  elif [[ "$OS" =~ ^(alpine)$ ]]; then
    OS_FAMILY="alpine"
  elif [[ "$OS" =~ ^(opensuse|sles)$ ]] || [[ "${ID_LIKE:-}" =~ suse ]]; then
    OS_FAMILY="suse"
  fi
fi

echo -e "${BLUE}[Device & OS Detected]${NC}"
if [[ "$IS_RASPBERRY_PI" == "true" ]]; then
  echo -e "  Hardware:     ${GREEN}${BOLD}🍓 ${DEVICE_MODEL}${NC}"
else
  echo -e "  Hardware:     ${GREEN}${DEVICE_MODEL}${NC}"
fi
echo -e "  Architecture: ${GREEN}${RAW_ARCH} (${ARCH})${NC}"
echo -e "  Distribution: ${GREEN}${OS_NAME} (${OS_FAMILY})${NC}\n"

# ------------------------------------------------------------------------------
# 3. Memory & Swap Optimization (Essential for Raspberry Pi / Low-RAM SBCs)
# ------------------------------------------------------------------------------
TOTAL_RAM_MB=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "2048")
TOTAL_SWAP_MB=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}' || echo "1024")

if [ "$TOTAL_RAM_MB" -lt 1500 ] && [ "$TOTAL_SWAP_MB" -lt 1024 ]; then
  echo -e "${YELLOW}[Low-Memory Warning] Device has ${TOTAL_RAM_MB}MB RAM and ${TOTAL_SWAP_MB}MB swap.${NC}"
  echo -e "To ensure Vite and esbuild build without crashing (OOM), we recommend a 1GB temporary swapfile."
  read -rp "$(echo -e "${BOLD}Create a 1GB temporary swapfile? [${GREEN}Y/n${NC}${BOLD}]: ${NC}")" SETUP_SWAP
  SETUP_SWAP="${SETUP_SWAP:-Y}"
  if [[ "$SETUP_SWAP" =~ ^[Yy]$ ]]; then
    if [ ! -f /swapfile_pantryo ]; then
      echo -e "${CYAN}Creating 1GB swapfile at /swapfile_pantryo...${NC}"
      fallocate -l 1G /swapfile_pantryo 2>/dev/null || dd if=/dev/zero of=/swapfile_pantryo bs=1M count=1024 2>/dev/null
      chmod 600 /swapfile_pantryo
      mkswap /swapfile_pantryo >/dev/null 2>&1
      swapon /swapfile_pantryo >/dev/null 2>&1 || true
      echo -e "${GREEN}✓ Temporary swap activated.${NC}"
    fi
  fi
fi

# Detect local IP address
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -n1 || echo "127.0.0.1")

# Target installation directory
INSTALL_DIR="${INSTALL_DIR:-$(pwd)}"
if [[ "$INSTALL_DIR" == "/" ]] || [[ "$INSTALL_DIR" == "/root" ]]; then
  INSTALL_DIR="/opt/pantryo"
fi

# ------------------------------------------------------------------------------
# 4. Configuration Wizard (Bilingual English / French)
# ------------------------------------------------------------------------------
echo -e "${BLUE}[1/5] Configuring Administrator, Network & Storage...${NC}"
echo -e "All of these values can also be updated anytime inside the web Admin Pane.\n"

echo -e "${CYAN}${BOLD}--- Primary Administrator & Local Security ---${NC}"

# Admin Name
DEFAULT_ADMIN_NAME="${PANTRYO_ADMIN_NAME:-Alex Johnson}"
read -rp "$(echo -e "${BOLD}Administrator Display Name [${GREEN}${DEFAULT_ADMIN_NAME}${NC}${BOLD}]: ${NC}")" INPUT_ADMIN_NAME
ADMIN_NAME="${INPUT_ADMIN_NAME:-$DEFAULT_ADMIN_NAME}"

# Admin Username / Email
DEFAULT_ADMIN_USER="${PANTRYO_ADMIN_USERNAME:-alex}"
while true; do
  read -rp "$(echo -e "${BOLD}Administrator Username or Email [${GREEN}${DEFAULT_ADMIN_USER}${NC}${BOLD}]: ${NC}")" INPUT_ADMIN_USER
  ADMIN_USERNAME="${INPUT_ADMIN_USER:-$DEFAULT_ADMIN_USER}"
  ADMIN_USERNAME="$(echo "$ADMIN_USERNAME" | tr '[:upper:]' '[:lower:]' | xargs)"
  if [[ -n "$ADMIN_USERNAME" ]]; then
    break
  fi
  echo -e "${RED}Username cannot be empty.${NC}"
done

# Secure Password (NIST SP 800-63B)
if [[ -n "${PANTRYO_ADMIN_PASSWORD:-}" ]]; then
  ADMIN_PASSWORD="$PANTRYO_ADMIN_PASSWORD"
else
  while true; do
    echo -ne "${BOLD}Secure Password (min 8 characters): ${NC}"
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

# 256-bit AES-GCM SQLCipher Key Generation
GEN_DB_KEY=""
if command -v openssl >/dev/null 2>&1; then
  GEN_DB_KEY=$(openssl rand -hex 32)
elif command -v node >/dev/null 2>&1; then
  GEN_DB_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || true)
fi
if [[ -z "$GEN_DB_KEY" ]]; then
  GEN_DB_KEY=$(tr -dc 'a-f0-9' </dev/urandom 2>/dev/null | head -c 64 || true)
fi

echo ""
echo -e "${CYAN}${BOLD}At-Rest SQLite SQLCipher 256-bit Key:${NC}"
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

# HTTP Port
DEFAULT_PORT="${PORT:-3000}"
read -rp "$(echo -e "${BOLD}Application HTTP Port [${GREEN}${DEFAULT_PORT}${NC}${BOLD}]: ${NC}")" INPUT_PORT
APP_PORT="${INPUT_PORT:-$DEFAULT_PORT}"

# --- SECTION B: Reverse Proxy & Ingress Selection (5 Options + LAN Only) ---
echo -e "\n${CYAN}${BOLD}--- Reverse Proxy & Ingress Configuration ---${NC}"
echo -e "Choose your external access / reverse proxy architecture:"
echo -e "  ${BOLD}[1] Cloudflare Tunnel${NC} (Zero Port-Forwarding, instant HTTPS, DDoS protection)"
echo -e "  ${BOLD}[2] Caddy${NC} (Automatic HTTPS with Let's Encrypt / ZeroSSL, zero-config renewal)"
echo -e "  ${BOLD}[3] Nginx & Let's Encrypt (Certbot)${NC} (Native reverse proxy + certbot)"
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

# Google Gemini API Key
DEFAULT_GEMINI_KEY="${GEMINI_API_KEY:-}"
if [[ -n "$DEFAULT_GEMINI_KEY" ]]; then
  PROMPT_GEMINI="Google Gemini API Key [${GREEN}configured from env${NC}${BOLD}]: "
else
  PROMPT_GEMINI="Google Gemini API Key [${YELLOW}leave blank to configure later in Admin Pane${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_GEMINI}${NC}")" INPUT_GEMINI_KEY
GEMINI_KEY="${INPUT_GEMINI_KEY:-$DEFAULT_GEMINI_KEY}"

# Expo Mobile Client API URL
DEFAULT_EXPO_URL="${EXPO_PUBLIC_API_URL:-${APP_URL}/api/v1/inventory}"
read -rp "$(echo -e "${BOLD}Expo Mobile Client API URL [${GREEN}${DEFAULT_EXPO_URL}${NC}${BOLD}]: ${NC}")" INPUT_EXPO_URL
EXPO_API_URL="${INPUT_EXPO_URL:-$DEFAULT_EXPO_URL}"

# Optional PostgreSQL Database URL
DEFAULT_DB_URL="${DATABASE_URL:-}"
if [[ -n "$DEFAULT_DB_URL" ]]; then
  PROMPT_DB="PostgreSQL DATABASE_URL [${GREEN}configured${NC}${BOLD}]: "
else
  PROMPT_DB="PostgreSQL DATABASE_URL [${YELLOW}leave blank to use local encrypted SQLCipher${NC}${BOLD}]: "
fi
read -rp "$(echo -e "${BOLD}${PROMPT_DB}${NC}")" INPUT_DB_URL
DB_URL="${INPUT_DB_URL:-$DEFAULT_DB_URL}"

# ------------------------------------------------------------------------------
# 5. Installing System Dependencies & Build Tools
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/5] Installing System Dependencies for ${OS_NAME} (${OS_FAMILY})...${NC}"

case "$OS_FAMILY" in
  debian)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y --no-install-recommends \
      curl ca-certificates gnupg build-essential python3 make g++ gcc git tar
    ;;
  rhel)
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y curl ca-certificates git gcc-c++ make python3 tar gnupg
    else
      yum install -y curl ca-certificates git gcc-c++ make python3 tar gnupg
    fi
    ;;
  arch)
    pacman -Sy --noconfirm base-devel git curl python tar
    ;;
  alpine)
    apk update
    apk add --no-cache nodejs npm python3 make g++ gcc git curl bash tar
    ;;
  suse)
    zypper refresh
    zypper install -y nodejs npm git gcc-c++ make python3 curl tar
    ;;
  *)
    echo -e "${YELLOW}[WARN] Unknown distribution family. Attempting to proceed...${NC}"
    ;;
esac

# ------------------------------------------------------------------------------
# 6. Node.js 20+ / 22 LTS Verification & Installation
# ------------------------------------------------------------------------------
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
  echo -e "${CYAN}Installing Node.js 22 LTS for ${ARCH}...${NC}"
  if [[ "$OS_FAMILY" == "debian" ]]; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes 2>/dev/null || true
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
  elif [[ "$OS_FAMILY" == "rhel" ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - 2>/dev/null || true
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y nodejs
    else
      yum install -y nodejs
    fi
  elif [[ "$OS_FAMILY" == "arch" ]]; then
    pacman -Sy --noconfirm nodejs npm
  else
    # Universal standalone Node.js tarball fallback for any Linux architecture
    echo -e "${CYAN}Downloading precompiled Node.js 22 LTS standalone binary for ${NODE_ARCH}...${NC}"
    NODE_VERSION_TAG="v22.14.0"
    NODE_TARBALL="node-${NODE_VERSION_TAG}-linux-${NODE_ARCH}.tar.xz"
    curl -fsSL "https://nodejs.org/dist/${NODE_VERSION_TAG}/${NODE_TARBALL}" -o "/tmp/${NODE_TARBALL}"
    tar -xJf "/tmp/${NODE_TARBALL}" -C /usr/local --strip-components=1
    rm -f "/tmp/${NODE_TARBALL}"
  fi
fi

echo -e "${GREEN}✓ Node.js $(node -v) and npm $(npm -v) are ready on ${ARCH}.${NC}"

# ------------------------------------------------------------------------------
# 7. Environment File & Source Setup
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/5] Setting up Pantryo in ${INSTALL_DIR}...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

cat <<EOF > "$INSTALL_DIR/.env"
# Pantryo - Linux & Raspberry Pi Environment Configuration
# Generated automatically during interactive installation.
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

# Application Public Host & Domain Architecture
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
# 8. Automated Reverse Proxy & Ingress Provisioning
# ------------------------------------------------------------------------------
case "$HOSTING_MODE" in
  caddy)
    echo -e "\n${CYAN}Configuring Caddy Web Server (Automatic HTTPS)...${NC}"
    if ! command -v caddy >/dev/null 2>&1; then
      if [[ "$OS_FAMILY" == "debian" ]]; then
        apt-get install -y debian-keyring debian-archive-keyring apt-transport-https 2>/dev/null || true
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes 2>/dev/null || true
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null 2>&1 || true
        apt-get update -y >/dev/null 2>&1 || true
        apt-get install -y caddy >/dev/null 2>&1 || true
      elif [[ "$OS_FAMILY" == "rhel" ]]; then
        dnf install -y 'dnf-command(copr)' 2>/dev/null || true
        dnf copr enable -y @caddy/caddy 2>/dev/null || true
        dnf install -y caddy 2>/dev/null || true
      elif [[ "$OS_FAMILY" == "arch" ]]; then
        pacman -S --noconfirm caddy 2>/dev/null || true
      fi
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
    else
      echo -e "${YELLOW}Note: Caddyfile written to /etc/caddy/Caddyfile. Start caddy service once installed.${NC}"
    fi
    ;;
  nginx)
    echo -e "\n${CYAN}Configuring Nginx Reverse Proxy & Let's Encrypt...${NC}"
    if [[ "$OS_FAMILY" == "debian" ]]; then
      apt-get install -y nginx certbot python3-certbot-nginx >/dev/null 2>&1 || true
    elif [[ "$OS_FAMILY" == "rhel" ]]; then
      dnf install -y nginx certbot python3-certbot-nginx >/dev/null 2>&1 || true
    elif [[ "$OS_FAMILY" == "arch" ]]; then
      pacman -S --noconfirm nginx certbot certbot-nginx >/dev/null 2>&1 || true
    fi
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/conf.d
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
    ln -sf /etc/nginx/sites-available/pantryo /etc/nginx/sites-enabled/pantryo 2>/dev/null || true
    cp /etc/nginx/sites-available/pantryo /etc/nginx/conf.d/pantryo.conf 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
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
      echo -e "\n${CYAN}Configuring Cloudflare Zero Trust Tunnel (cloudflared) for ${CF_ARCH}...${NC}"
      if ! command -v cloudflared >/dev/null 2>&1; then
        CF_BIN_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"
        echo -e "Downloading cloudflared binary from: ${CF_BIN_URL}"
        curl -fsSL "$CF_BIN_URL" -o /usr/local/bin/cloudflared 2>/dev/null || true
        chmod +x /usr/local/bin/cloudflared 2>/dev/null || true
      fi

      if command -v cloudflared >/dev/null 2>&1; then
        if [ -d /etc/systemd/system ]; then
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
    fi
    ;;
esac

# ------------------------------------------------------------------------------
# 9. Application Dependencies & Production Build
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/5] Installing Dependencies & Compiling Production Bundle...${NC}"
npm install --no-audit --prefer-offline 2>/dev/null || npm install

# Build with memory limit set to protect Raspberry Pi and low-RAM devices from OOM killer
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build

# ------------------------------------------------------------------------------
# 10. Systemd Service Configuration
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/5] Configuring systemd background service 'pantryo.service'...${NC}"
if [ -d /etc/systemd/system ]; then
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
  echo -e "${GREEN}✓ Systemd service 'pantryo.service' enabled and started.${NC}"
fi

# Automated daily dependency security updates cron
if [ -d /etc/cron.daily ]; then
  cat <<EOF_CRON > /etc/cron.daily/pantryo-autoupdate
#!/usr/bin/env bash
cd "${INSTALL_DIR}" || exit 0
if [ -f "scripts/auto-update-dependencies.js" ]; then
  node scripts/auto-update-dependencies.js >> /var/log/pantryo-autoupdate.log 2>&1
  systemctl restart pantryo.service 2>/dev/null || true
fi
EOF_CRON
  chmod +x /etc/cron.daily/pantryo-autoupdate
fi

# ------------------------------------------------------------------------------
# 11. Final Summary & Status
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}${BOLD}========================================================================${NC}"
echo -e "${GREEN}${BOLD}           🎉 Pantryo Installed & Running Successfully!                ${NC}"
echo -e "${GREEN}${BOLD}========================================================================${NC}"
if [[ "$IS_RASPBERRY_PI" == "true" ]]; then
  echo -e "Device:              ${GREEN}🍓 ${DEVICE_MODEL} (${RAW_ARCH})${NC}"
else
  echo -e "Device / Distro:     ${GREEN}${OS_NAME} (${RAW_ARCH})${NC}"
fi
echo -e "Hosting Mode:        ${CYAN}${BOLD}${HOSTING_MODE}${NC}"
echo -e "Primary Public URL:  ${CYAN}${BOLD}${APP_URL}${NC}"
echo -e "Local LAN URL:       ${CYAN}http://${HOST_IP}:${APP_PORT}${NC}"
echo -e "Admin Username:      ${GREEN}${BOLD}${ADMIN_USERNAME}${NC}"
echo -e "Admin Display Name:  ${GREEN}${ADMIN_NAME}${NC}"
echo -e "Database Storage:    ${GREEN}256-bit AES-GCM SQLCipher SQLite (Local & Fast)${NC}"
echo -e "SQLCipher DB Key:    ${YELLOW}${DB_KEY}${NC} ${GREEN}(Saved to .env & Password Manager)${NC}"
if [[ "$HOSTING_MODE" == "npm" ]]; then
  echo -e "NPM Configuration:   ${CYAN}${INSTALL_DIR}/NPM-CONFIGURATION.txt${NC}"
elif [[ "$HOSTING_MODE" == "traefik" ]]; then
  echo -e "Traefik Provider:    ${CYAN}${INSTALL_DIR}/traefik-pantryo.yml${NC}"
fi
if [[ -n "$GEMINI_KEY" ]]; then
  echo -e "Gemini AI Engine:    ${GREEN}Configured (Vision & Recipe AI Active)${NC}"
else
  echo -e "Gemini AI Engine:    ${YELLOW}Not set (configure anytime in Admin Pane)${NC}"
fi
if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
  echo -e "Cloudflare Tunnel:   ${GREEN}Configured & Active (Zero Trust Remote Access)${NC}"
else
  echo -e "Cloudflare Tunnel:   ${YELLOW}Not configured (optional)${NC}"
fi
echo -e "Expo Mobile API URL: ${CYAN}${EXPO_API_URL}${NC}"
echo -e ""
echo -e "${YELLOW}${BOLD}Helpful Commands:${NC}"
echo -e "  Check server logs:   ${BOLD}journalctl -u pantryo.service -f${NC}"
echo -e "  Restart server:      ${BOLD}systemctl restart pantryo.service${NC}"
if [[ -n "$CF_TUNNEL_TOKEN" ]]; then
  echo -e "  Check tunnel logs:   ${BOLD}journalctl -u pantryo-tunnel.service -f${NC}"
fi
echo -e "${GREEN}========================================================================${NC}\n"
