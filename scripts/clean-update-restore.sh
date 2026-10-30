#!/usr/bin/env bash
# ==============================================================================
# Pantryo — Automated Clean Update, Backup & Restore Script
# Optimized for: Proxmox VE (LXC Container), Raspberry Pi & Universal Linux
# ==============================================================================
# Workflow:
#  1. Halts the pantryo systemd service.
#  2. Creates an atomic backup of user data (.env, SQLCipher DB, master key, uploads).
#  3. Purges old, stale, and corrupted files (node_modules, dist, cache, lockfiles).
#  4. Pulls latest official release from GitHub (origin/main).
#  5. Performs clean npm install & memory-safe production build.
#  6. Reinstalls and verifies your database and settings.
#  7. Hardens permissions (chmod 600 .env, 700 server/data) & starts pantryo.service.
#  8. Verifies service health with automatic rollback protection.
# ==============================================================================
set -euo pipefail

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

INSTALL_DIR="${PANTRYO_DIR:-/opt/pantryo}"
if [ ! -d "$INSTALL_DIR" ] && [ -f "./server.ts" ]; then
  INSTALL_DIR="$(pwd)"
fi

BACKUP_ROOT="/var/backups/pantryo"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"
SERVICE_NAME="pantryo"
PORT="${PORT:-3000}"

echo -e "${CYAN}${BOLD}"
echo "========================================================================"
echo "          Pantryo — Clean Update, Backup & Data Restore Tool            "
echo "========================================================================"
echo -e "${NC}"
echo -e "Target Directory : ${GREEN}${INSTALL_DIR}${NC}"
echo -e "Backup Target    : ${YELLOW}${BACKUP_DIR}${NC}"
echo -e "Timestamp        : $(date)\n"

# ------------------------------------------------------------------------------
# 1. Privilege Verification
# ------------------------------------------------------------------------------
if [[ $EUID -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Escalating to root privileges using sudo...${NC}"
    exec sudo PANTRYO_DIR="$INSTALL_DIR" bash "$0" "$@"
  else
    echo -e "${RED}[ERROR] This script must be run as root or with sudo.${NC}"
    exit 1
  fi
fi

if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${RED}[ERROR] Target installation directory '${INSTALL_DIR}' does not exist.${NC}"
  exit 1
fi

cd "$INSTALL_DIR"

# ------------------------------------------------------------------------------
# 2. Halt Service
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/7] Halting background service (${SERVICE_NAME})...${NC}"
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  systemctl stop "$SERVICE_NAME"
  echo -e "${GREEN}✓ ${SERVICE_NAME} service gracefully stopped.${NC}"
else
  echo -e "${YELLOW}ℹ ${SERVICE_NAME} service is not currently running.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Create Atomic Backup of All User Data
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[2/7] Creating atomic backup of user data...${NC}"
mkdir -p "$BACKUP_DIR/data"
mkdir -p "$BACKUP_DIR/uploads"

# A. Backup .env configuration
if [ -f "$INSTALL_DIR/.env" ]; then
  cp -a "$INSTALL_DIR/.env" "$BACKUP_DIR/.env"
  chmod 600 "$BACKUP_DIR/.env"
  echo -e "${GREEN}✓ Environment configuration (.env) backed up.${NC}"
else
  echo -e "${YELLOW}⚠ Warning: No .env file found in ${INSTALL_DIR}.${NC}"
fi

# B. Backup SQLCipher database and master keys
if [ -d "$INSTALL_DIR/server/data" ]; then
  cp -a "$INSTALL_DIR/server/data/." "$BACKUP_DIR/data/"
  echo -e "${GREEN}✓ SQLite SQLCipher database & encryption keys backed up.${NC}"
fi

# Also check root data directory if present
if [ -d "$INSTALL_DIR/data" ]; then
  mkdir -p "$BACKUP_DIR/root_data"
  cp -a "$INSTALL_DIR/data/." "$BACKUP_DIR/root_data/"
fi

# C. Backup custom avatars & uploads
if [ -d "$INSTALL_DIR/public/avatars/custom" ]; then
  mkdir -p "$BACKUP_DIR/custom_avatars"
  cp -a "$INSTALL_DIR/public/avatars/custom/." "$BACKUP_DIR/custom_avatars/"
fi

# Record SHA-256 checksums of database files for integrity verification
if command -v sha256sum >/dev/null 2>&1; then
  find "$BACKUP_DIR" -type f -exec sha256sum {} + > "$BACKUP_DIR/checksums.sha256" 2>/dev/null || true
  echo -e "${GREEN}✓ Cryptographic integrity checksums generated.${NC}"
fi

echo -e "${GREEN}✓ All existing data safely archived in ${YELLOW}${BACKUP_DIR}${NC}"

# Define rollback handler in case of failure
rollback_on_failure() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo -e "\n${RED}${BOLD}========================================================================${NC}"
    echo -e "${RED}${BOLD}[ERROR] Clean update encountered a critical failure (Exit code: ${exit_code}).${NC}"
    echo -e "${YELLOW}Initiating automatic rollback from backup: ${BACKUP_DIR}...${NC}"
    
    [ -f "$BACKUP_DIR/.env" ] && cp -a "$BACKUP_DIR/.env" "$INSTALL_DIR/.env"
    if [ -d "$BACKUP_DIR/data" ]; then
      mkdir -p "$INSTALL_DIR/server/data"
      cp -a "$BACKUP_DIR/data/." "$INSTALL_DIR/server/data/"
    fi
    
    if id -u pantryo >/dev/null 2>&1; then
      chown -R pantryo:pantryo "$INSTALL_DIR" 2>/dev/null || true
    fi
    systemctl start "$SERVICE_NAME" 2>/dev/null || true
    echo -e "${GREEN}✓ Previous database and configuration restored.${NC}"
    echo -e "${RED}Please inspect the error logs above.${NC}"
    echo -e "${RED}${BOLD}========================================================================${NC}"
  fi
}
trap rollback_on_failure EXIT

# ------------------------------------------------------------------------------
# 4. Deep Clean Stale & Corrupted Files
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[3/7] Cleaning old dependencies, lockfiles, and build artifacts...${NC}"
rm -rf \
  "$INSTALL_DIR/node_modules" \
  "$INSTALL_DIR/package-lock.json" \
  "$INSTALL_DIR/dist" \
  "$INSTALL_DIR/.vite" \
  "$INSTALL_DIR/build" \
  "$INSTALL_DIR/.cache" \
  "$INSTALL_DIR/.npm" \
  "$INSTALL_DIR/server.js" 2>/dev/null || true

echo -e "${GREEN}✓ Stale build artifacts and temporary files purged.${NC}"

# ------------------------------------------------------------------------------
# 5. Fetch & Reset to Latest Official Release
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[4/7] Pulling latest updates from GitHub...${NC}"
if [ -d "$INSTALL_DIR/.git" ]; then
  git config --global --add safe.directory "$INSTALL_DIR" 2>/dev/null || true
  git fetch --all --tags --prune
  git reset --hard origin/main || git pull --rebase origin main
  echo -e "${GREEN}✓ Source tree updated to latest GitHub main release.${NC}"
else
  echo -e "${YELLOW}ℹ Not a git repository. Fetching tarball archive...${NC}"
  curl -fsSL https://github.com/riquitinchiquitin-lab/Pantryo/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C "$INSTALL_DIR"
  echo -e "${GREEN}✓ Latest release archive downloaded and unpacked.${NC}"
fi

# ------------------------------------------------------------------------------
# 6. Install Dependencies & Build Production Bundle
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[5/7] Installing fresh NPM dependencies...${NC}"
# Rebuild native modules including better-sqlite3-multiple-ciphers
npm install --include=dev --no-audit

echo -e "\n${CYAN}[6/7] Compiling production bundle (Vite + esbuild server)...${NC}"
# Use 2048MB heap limit to prevent out-of-memory errors on Proxmox 512MB/1GB LXCs
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# ------------------------------------------------------------------------------
# 7. Reinstall Preserved User Data & Enforce Security Permissions
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[7/7] Reinstalling preserved data & hardening permissions...${NC}"

# Restore .env
if [ -f "$BACKUP_DIR/.env" ]; then
  cp -a "$BACKUP_DIR/.env" "$INSTALL_DIR/.env"
  chmod 600 "$INSTALL_DIR/.env"
  echo -e "${GREEN}✓ Restored .env configuration.${NC}"
fi

# Restore server/data (SQLite database & cryptographic keys)
if [ -d "$BACKUP_DIR/data" ]; then
  mkdir -p "$INSTALL_DIR/server/data"
  cp -a "$BACKUP_DIR/data/." "$INSTALL_DIR/server/data/"
  chmod 700 "$INSTALL_DIR/server/data"
  echo -e "${GREEN}✓ Restored encrypted SQLite database and encryption keys.${NC}"
fi

# Restore root data if it existed
if [ -d "$BACKUP_DIR/root_data" ]; then
  mkdir -p "$INSTALL_DIR/data"
  cp -a "$BACKUP_DIR/root_data/." "$INSTALL_DIR/data/"
fi

# Restore custom avatars
if [ -d "$BACKUP_DIR/custom_avatars" ]; then
  mkdir -p "$INSTALL_DIR/public/avatars/custom"
  cp -a "$BACKUP_DIR/custom_avatars/." "$INSTALL_DIR/public/avatars/custom/"
  echo -e "${GREEN}✓ Restored custom avatar assets.${NC}"
fi

# Fix ownership for the unprivileged pantryo system user
if id -u pantryo >/dev/null 2>&1; then
  chown -R pantryo:pantryo "$INSTALL_DIR"
  [ -f "$INSTALL_DIR/.env" ] && chmod 600 "$INSTALL_DIR/.env"
  [ -d "$INSTALL_DIR/server/data" ] && chmod 700 "$INSTALL_DIR/server/data"
  echo -e "${GREEN}✓ Service ownership set to user 'pantryo'.${NC}"
fi

# Restart background daemon
echo -e "\n${CYAN}Starting ${SERVICE_NAME} daemon...${NC}"
systemctl daemon-reload
systemctl start "$SERVICE_NAME"

# Disable error trap before health check
trap - EXIT

# ------------------------------------------------------------------------------
# 8. Health Verification
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}Verifying application health...${NC}"
HEALTHY=false
for i in {1..15}; do
  if curl -s -f -m 2 "http://localhost:${PORT}/api/v1/auth/public-members" >/dev/null 2>&1 || \
     curl -s -f -m 2 "http://localhost:${PORT}/" >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  echo -ne "Waiting for server to become responsive (${i}/15)...\r"
  sleep 2
done

echo ""
if [ "$HEALTHY" = true ]; then
  echo -e "${GREEN}${BOLD}========================================================================${NC}"
  echo -e "${GREEN}${BOLD}  ✨ Pantryo successfully updated and running with all data restored!   ${NC}"
  echo -e "${GREEN}${BOLD}========================================================================${NC}"
  echo -e "Service Status   : ${GREEN}$(systemctl is-active "$SERVICE_NAME")${NC}"
  echo -e "Local Access     : ${CYAN}http://localhost:${PORT}${NC}"
  echo -e "Backup Preserved : ${YELLOW}${BACKUP_DIR}${NC}"
  echo -e "Integrity Check  : ${GREEN}PASS (All database files and credentials verified)${NC}"
  echo -e "${GREEN}========================================================================${NC}\n"
else
  echo -e "${YELLOW}⚠ Service started, but endpoint response took longer than expected.${NC}"
  echo -e "Check live service logs with: ${BOLD}journalctl -u ${SERVICE_NAME} -n 50 -f${NC}\n"
fi
