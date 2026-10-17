# Implementation Plan: Proxmox Script Hardening, Fix Root Build Error & Tailscale Funnel

Automate all container security hardening directly inside `install-proxmox.sh`, fix the `/root/package.json` missing directory error, streamline ingress options to **Local Network (LAN)**, **Cloudflare Zero Trust Tunnel**, and **Tailscale Funnel** (removing Caddy, Nginx, NPM, and Traefik), and provide comprehensive setup instructions.

---

## 1. Problem Analysis & Root Cause

1. **`npm error enoent Could not read package.json: open '/root/package.json'`**:
   - In `install-proxmox.sh`, line 144 had `INSTALL_DIR="${INSTALL_DIR:-$(pwd)}"`.
   - When a user executes the 1-line script (`bash -c "$(curl -fsSL ...)"`) in their Proxmox LXC shell as `root`, `pwd` is `/root`.
   - The script did not clone or extract the Pantryo repository into `/root`, leading `npm install` and `npm run build` at step 4/5 to fail looking for `/root/package.json`.
   - **Fix**: Guarantee `INSTALL_DIR="/opt/pantryo"`. If `package.json` is not present, install `git` and clone `https://github.com/riquitinchiquitin-lab/Pantryo.git` into `/opt/pantryo`. Always `cd "$INSTALL_DIR"` and verify `package.json` before any npm invocation.

2. **Automated Security Hardening**:
   - The script will now automatically apply all security hardening steps during installation:
     - Install `unattended-upgrades` and enable daily automated security patching via `/etc/cron.daily/pantryo-security-updates`.
     - Create a dedicated unprivileged system user (`pantryo`) with `nologin` shell.
     - Set strict permissions: `chmod 600 /opt/pantryo/.env`, `chmod 700 /opt/pantryo/server/data`, and ownership `pantryo:pantryo`.
     - Configure `pantryo.service` systemd unit with `User=pantryo`, `Group=pantryo`, and full system sandboxing (`NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=full`, `ProtectHome=true`, `ProtectKernelTunables=true`, `ProtectControlGroups=true`, `RestrictRealtime=true`, `LockPersonality=true`).
     - Auto-run `scripts/security-harden-container.sh` to ensure 0 pending OS CVEs.

3. **Streamline Ingress Options**:
   - Remove deprecated options: **Caddy**, **Nginx & Let's Encrypt (Certbot)**, **Nginx Proxy Manager (NPM GUI)**, and **Traefik v2/v3**.
   - Provide 3 clear options:
     - **Option 1: Local Network Only (LAN Access)** (`http://<ip>:3000` — zero external exposure, ideal for local-only homelabs).
     - **Option 2: Cloudflare Zero Trust Tunnel** (Zero port-forwarding, automatic SSL, DDoS protection).
     - **Option 3: Tailscale Funnel** (Direct zero-config HTTPS via Tailscale Funnel, with automated CLI detection and step-by-step setup commands + auth URL).

---

## 2. Proposed Changes

### Shell Installation Scripts
- **`install-proxmox.sh`**:
  - Fix working directory and repository cloning: default `INSTALL_DIR="/opt/pantryo"`, clone repo if absent, and cd into it.
  - Update reverse proxy menu: [1] Local Network Only, [2] Cloudflare Tunnel, [3] Tailscale Funnel.
  - Add Tailscale Funnel configuration handler: displays step-by-step instructions, detects if `tailscale` is installed (or prompts to run installer), provides the exact `tailscale up` and `tailscale funnel 3000` commands.
  - Implement unprivileged user creation (`pantryo`), directory ownership, and sandboxed systemd service.
  - Automatically invoke hardening routines.
- **`proxmox-lxc.sh`**:
  - Update banner and description to reflect Local Network, Cloudflare Tunnel, and Tailscale Funnel.
- **`install.sh`**:
  - Sync options with `install-proxmox.sh` (Local Network, Cloudflare Tunnel, Tailscale Funnel).

### Documentation & Runbooks
- **`INSTALLATION.md`**:
  - Remove Caddy, Nginx, NPM, and Traefik sections.
  - Add dedicated **Local Network (LAN Only)** setup section with IP reservation and browser bookmark guidance.
  - Add comprehensive **Tailscale Funnel** setup guide:
    - What is Tailscale Funnel & how it routes external HTTPS to Pantryo port 3000.
    - Prerequisites: Tailscale account, MagicDNS enabled, Funnel enabled in Tailscale Admin Console.
    - Commands: `curl -fsSL https://tailscale.com/install.sh | sh`, `tailscale up`, `tailscale funnel --bg 3000`.
    - Generating persistent URLs and configuring `.env` `APP_URL`.
  - Update Proxmox 1-line installer command and troubleshooting FAQ.

### In-App UI Guides
- **`src/components/DocumentationModal.tsx`**:
  - Update the "Reverse Proxy & Accès Distant" tab:
    - Replace Caddy/Nginx tabs with **Local Network (LAN)** and **Tailscale Funnel**.
    - Provide interactive copyable command cards for Tailscale Funnel (`tailscale up`, `tailscale funnel 3000`).
- **`src/components/AdminManagementModal.tsx`**:
  - Update the Admin Panel Ingress/Domain configuration tab to guide admins on Local Network, Cloudflare Tunnel, and Tailscale Funnel.

---

## 3. Verification & Testing

1. **Syntax & Shellcheck Validation**:
   - Run `bash -n install-proxmox.sh`, `bash -n install.sh`, and `bash -n proxmox-lxc.sh` to ensure 0 syntax errors.
2. **Directory Resolution Test**:
   - Verify that simulated execution from `/root` clones/pulls to `/opt/pantryo` and locates `package.json`.
3. **Application Build & Lint**:
   - Run `compile_applet` to confirm all TypeScript components build cleanly with 0 errors.
4. **Dev Server Verification**:
   - Restart dev server and verify in-app DocumentationModal and AdminManagementModal reflect the updated setup options.
