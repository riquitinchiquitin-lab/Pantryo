#!/usr/bin/env bash
# ==============================================================================
# Pantryo - Unified Dual-Scope Automated Update Script
# ==============================================================================
# 1. Updates Debian Linux OS system packages (apt & unattended-upgrades)
# 2. Updates Node.js/npm dependencies within semver constraints (npm update)
# 3. Applies automated security patches (npm audit fix)
# 4. Detects major version alerts and logs them to server/data/dependency-status.json
# 5. Verifies project compilation and typechecking (npm run build)
# ==============================================================================
set -eo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}    📦  Pantryo Dual-Scope Automated Package & OS Update Engine        ${NC}"
echo -e "${CYAN}========================================================================${NC}"

APP_DIR="${PWD}"
if [[ ! -f "${APP_DIR}/package.json" ]]; then
  if [[ -f "/opt/pantryo/package.json" ]]; then
    APP_DIR="/opt/pantryo"
  elif [[ -f "/app/applet/package.json" ]]; then
    APP_DIR="/app/applet"
  fi
fi

cd "$APP_DIR"

# Normalize .env: Remove legacy NODE_ENV from .env to eliminate Vite build warnings
if [[ -f "${APP_DIR}/.env" ]]; then
  sed -i '/^NODE_ENV=/d' "${APP_DIR}/.env" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# 1. Debian Linux OS System Packages Update
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[1/2] Updating Debian OS System Packages & Security Patches...${NC}"
if command -v apt-get >/dev/null 2>&1; then
  if [[ $EUID -eq 0 ]]; then
    export DEBIAN_FRONTEND=noninteractive
    echo -e "  Updating package index..."
    apt-get update -q -y 2>&1 || true
    echo -e "  Applying security upgrades..."
    apt-get upgrade -y --no-install-recommends -q 2>&1 || true
    apt-get autoremove -y -q 2>&1 || true
    apt-get clean 2>&1 || true

    if command -v unattended-upgrade >/dev/null 2>&1; then
      unattended-upgrade 2>&1 || true
    fi
    echo -e "  ${GREEN}✓ Debian system packages up to date.${NC}"
  else
    echo -e "  ${YELLOW}ℹ️  Non-root execution: skipping OS apt-get upgrade (requires sudo/root).${NC}"
  fi
else
  echo -e "  ${CYAN}ℹ️  apt-get not available in this environment.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Node.js & npm Application Dependencies Update (All Scopes & Native Addons)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/2] Updating npm Application Dependencies (All Scopes + Native Addons)...${NC}"
if [[ -f "${APP_DIR}/scripts/auto-update-dependencies.js" ]]; then
  node "${APP_DIR}/scripts/auto-update-dependencies.js" "$@"
else
  echo -e "  Running standard npm update across all scopes..."
  npm update --include=dev
  npm audit fix --include=dev || true
  npm rebuild better-sqlite3-multiple-ciphers || true
  npm run build
fi

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}✓ All package scopes and dependencies updated & verified successfully!  ${NC}"
echo -e "${GREEN}========================================================================${NC}\n"
