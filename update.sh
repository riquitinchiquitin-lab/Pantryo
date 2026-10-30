#!/usr/bin/env bash
# ==============================================================================
# Pantryo - 1-Click Update Script for Proxmox VE LXC & Linux Installs
# ==============================================================================
set -euo pipefail

INSTALL_DIR="${PANTRYO_DIR:-/opt/pantryo}"

# Delegate to clean backup & restore script if requested
if [[ "${1:-}" =~ ^(--clean|--fresh|-c|-f|--backup-restore)$ ]]; then
  SCRIPT_PATH="$(dirname "$0")/scripts/clean-update-restore.sh"
  if [ -f "$SCRIPT_PATH" ]; then
    exec bash "$SCRIPT_PATH" "${@:2}"
  fi
fi

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}             Updating Pantryo in ${INSTALL_DIR}                        ${NC}"
echo -e "${CYAN}========================================================================${NC}"

if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${RED}[ERROR] Directory ${INSTALL_DIR} does not exist.${NC}"
  exit 1
fi

cd "$INSTALL_DIR"

# 1. Fetch latest code
if [ -d ".git" ]; then
  echo -e "\n${CYAN}1/4: Pulling latest changes from git...${NC}"
  git fetch --all --tags
  git reset --hard origin/main || git pull --rebase
else
  echo -e "\n${CYAN}1/4: Initializing git repository link...${NC}"
  git init
  git remote add origin https://github.com/riquitinchiquitin-lab/Pantryo.git 2>/dev/null || git remote set-url origin https://github.com/riquitinchiquitin-lab/Pantryo.git
  if git fetch --depth 1 origin main 2>/dev/null; then
    git reset --hard origin/main
    echo -e "${GREEN}✓ Git repository connected and updated to origin/main.${NC}"
  else
    echo -e "${YELLOW}Git remote fetch failed, falling back to release tarball...${NC}"
    curl -fsSL https://github.com/riquitinchiquitin-lab/Pantryo/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C "$INSTALL_DIR"
  fi
fi

# 2. Install dependencies & rebuild better-sqlite3-multiple-ciphers
echo -e "\n${CYAN}2/4: Installing NPM dependencies...${NC}"
npm install --no-audit

# 3. Build production bundle (Vite + esbuild server.cjs)
echo -e "\n${CYAN}3/4: Building production bundle (npm run build)...${NC}"
npm run build

# 4. Enforce strict permissions for the unprivileged pantryo user & data security
echo -e "\n${CYAN}4/4: Hardening permissions & restarting service...${NC}"
if id -u pantryo >/dev/null 2>&1; then
  chown -R pantryo:pantryo "$INSTALL_DIR"
  [ -d "$INSTALL_DIR/server/data" ] && chmod 700 "$INSTALL_DIR/server/data"
  [ -f "$INSTALL_DIR/.env" ] && chmod 600 "$INSTALL_DIR/.env"
fi

# Restart systemd service
if systemctl list-unit-files | grep -q "pantryo.service"; then
  systemctl restart pantryo
  echo -e "${GREEN}✓ pantryo.service restarted successfully.${NC}"
fi

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}✓ Pantryo has been successfully updated!${NC}"
echo -e "Check status: ${YELLOW}systemctl status pantryo${NC}"
echo -e "Live logs:    ${YELLOW}journalctl -u pantryo -f -n 30${NC}"
echo -e "${GREEN}========================================================================${NC}"
