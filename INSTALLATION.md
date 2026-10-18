# 📦 Pantryo — Self-Hosting & Installation Runbook
*Guide Complet d'Installation & d'Hébergement Autonome (Proxmox VE, Linux, Raspberry Pi, Docker & Cloudflare)*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Tested on Proxmox 7/8](https://img.shields.io/badge/Proxmox%20VE-7.x%20%2F%208.x-orange.svg)](#1-proxmox-ve-lxc-installation-recommended)
[![Tested on Raspberry Pi 3/4/5/Zero2W](https://img.shields.io/badge/Raspberry%20Pi-3%20%7C%204%20%7C%205%20%7C%20Zero2W-red.svg)](#2-raspberry-pi--universal-linux-installation)
[![Docker Multi-Arch](https://img.shields.io/badge/Docker-amd64%20%7C%20arm64%20%7C%20armv7-blue.svg)](#3-docker--docker-compose-deployment)
[![Bilingual: EN / FR](https://img.shields.io/badge/Language-English%20%7C%20Fran%C3%A7ais-purple.svg)](#)

---

---

## 📑 Summary / Sommaire

1. [Default Passwords & Zero-Trust Security Model (FAQ)](#default-passwords--zero-trust-security-model)
2. [System Requirements & Sizing / Prérequis Matériels](#system-requirements--sizing)
3. [Method 1: Proxmox VE (Automated LXC Container)](#1-proxmox-ve-lxc-installation-recommended)
4. [Method 2: Raspberry Pi & Universal Linux (Bare-Metal / VM)](#2-raspberry-pi--universal-linux-installation)
5. [Method 3: Docker & Docker Compose](#3-docker--docker-compose-deployment)
6. [Method 4: Manual Git & Node.js 22 LTS Installation](#4-manual-git--nodejs-22-lts-installation)
7. [Access & Networking Architecture (3 Streamlined Options)](#5-access--networking-architecture)
   - [Option A: Local Network Setup (Access to Local Network Only)](#option-a-local-network-setup-access-to-local-network-only)
   - [Option B: Cloudflare Zero Trust Tunnel (Zero Port-Forwarding)](#option-b-cloudflare-zero-trust-tunnel-recommended)
   - [Option C: Tailscale Funnel (Zero-Config HTTPS & Funnel Routing)](#option-c-tailscale-funnel-zero-config-https)
8. [Environment Variables Reference (`.env`)](#6-environment-variables-reference)
9. [Database Backup & SQLCipher 256-bit Encryption](#7-backup-restore--sqlcipher-encryption)
10. [Troubleshooting & FAQ / Dépannage](#8-troubleshooting--faq)

---

## 🔐 Default Passwords & Zero-Trust Security Model

### Where are the default passwords?

> [!IMPORTANT]
> **Pantryo has NO static default passwords by design.**
> In strict compliance with **NIST SP 800-63B** digital identity standards and modern zero-trust homelab security, hardcoded credentials (such as `admin` / `admin` or `root` / `root`) are never included. Hardcoded default passwords are the #1 attack vector in self-hosted environments.

All passwords and encryption keys are either **interactively created by you** or **cryptographically generated on the fly** with a copy-paste summary formatted for your password manager:

| Credential Type | Default Value | Provisioning Flow | Where It Is Stored |
| :--- | :--- | :--- | :--- |
| **Proxmox Container Root Password** | *None* | Interactive prompt during container creation. Press **Enter** to auto-generate a secure 20-character password, or enter your own. | Set via `pct create --password` / `/etc/shadow`. Save to Bitwarden/1Password. |
| **SQLCipher Database Encryption Key** | *None* | Auto-generated 64-hex key (256-bit AES-GCM) with copy box for password managers. | `/opt/pantryo/.env` (`DB_ENCRYPTION_KEY`, permissions `chmod 600`). |
| **Pantryo Web Administrator** | *None* | Interactively prompted during setup (Display Name, Username/Email, min 8-character password). | Stored with Argon2id memory-hard hashing inside encrypted SQLite database. |
| **Session Secret Key** | *Auto-generated* | Generated via `openssl rand -hex 32`. | `/opt/pantryo/.env` (`SESSION_SECRET`). |

#### 🔑 Saving Credentials to Password Managers (Bitwarden, 1Password, KeePass)
During both `install-proxmox.sh` and `install.sh`, the terminal displays formatted credential cards:
```text
========================================================================
        🔐 Container Root Credentials for Password Manager             
========================================================================
Container ID:            206
Container Hostname:      pantryo
Container Root Username: root
Container Root Password: X9$mK#2pL8vN!4qR7wY0
► [Auto-generated 20-char password - save in Bitwarden / 1Password / KeePass]
Container IP Address:    192.168.1.145
========================================================================
```

#### 🔄 How to Reset or Audit Passwords
- **Container Root Password**: On the Proxmox host shell, run `pct enter <CTID>` and then `passwd root`.
- **Database Encryption Key**: Inspect `/opt/pantryo/.env` (requires root: `sudo cat /opt/pantryo/.env | grep DB_ENCRYPTION_KEY`).
- **Web Administrator & Settings**: Open the web application, log in, and click the **Admin Pane** (shield icon in the navbar) to audit and update App URLs, Reverse Proxy settings, Gemini AI API keys, or user roles.

---

## System Requirements & Sizing

Pantryo is designed with an embedded, zero-dependency architecture. It does not require external database clusters like PostgreSQL or Redis; all data is managed via an embedded SQLite database encrypted at rest using **256-bit AES SQLCipher**.

| Metric | Minimum (SBC / Zero 2W) | Recommended (Proxmox LXC / Pi 4/5) | Heavy Multi-User (10+ Users) |
| :--- | :--- | :--- | :--- |
| **CPU Architecture** | ARMv7l, ARM64, or x86_64 (1 Core) | ARM64 or x86_64 (2 vCPU) | x86_64 or ARM64 (4 vCPU) |
| **RAM** | 512 MB (+ 1 GB Swapfile) | 1024 MB (1 GB) | 2048 MB (2 GB) |
| **Active Memory Usage** | ~110 MB – 160 MB | ~140 MB – 190 MB | ~180 MB – 240 MB |
| **Storage (Root)** | 3 GB free space | 6 GB SSD / NVMe | 15 GB SSD / NVMe |
| **Operating System** | Debian 11/12, Ubuntu 22+, Raspberry Pi OS, DietPi | Debian 12 Bookworm (LXC), Ubuntu 24.04 LTS | Proxmox VE 8.x, Debian 12, Alpine 3.19 |
| **Network Port** | TCP `3000` (Internal LAN or behind reverse proxy) | TCP `3000` | TCP `3000` |

---

## 1. Proxmox VE (LXC Installation - Recommended)

Running Pantryo in a lightweight, unprivileged **Linux Container (LXC)** on Proxmox VE provides bare-metal performance with microsecond boot times, snapshot rollbacks, and zero virtualization overhead.

### 🚀 1-Line Automated Proxmox Installer

1. Open your Proxmox VE Web GUI (`https://your-pve-ip:8006`).
2. Select your Proxmox Node and open the **Shell** (or SSH into your PVE host).
3. Paste and execute the following automated provisioner:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install-proxmox.sh)"
```

### 📋 What the Proxmox Installer Does Automatically

1. Validates Proxmox VE 7.x or 8.x host environment and root privileges.
2. Prompts interactively for:
   - **Container ID** (default: `206` or lowest available).
   - **Hostname** (default: `pantryo`).
   - **RAM Allocation** (default: `1024 MB`).
   - **Swap Allocation** (default: `512 MB`).
   - **Disk Size** (default: `4 GB`).
   - **Network Bridge** (default: `vmbr0` with DHCP or static IP).
   - **Hosting Mode** (Cloudflare Tunnel, Custom Domain, or LAN-only).
3. Downloads the official `debian-12-standard` LXC template.
4. Creates an **unprivileged** container for maximum host security.
5. Boots the LXC container, installs Node.js 22 LTS, clones Pantryo, sets up dependencies, generates random 256-bit encryption keys, and creates a systemd service.
6. Starts Pantryo automatically on boot.

### 🛠️ Manual Proxmox LXC Creation (CLI Alternative)

If you prefer to configure your container manually without the interactive wizard:

```bash
# 1. Download Debian 12 template
pveam update
pveam download local debian-12-standard_12.7-1_amd64.tar.zst

# 2. Create the LXC container (ID 206, 1GB RAM, 4GB disk, unprivileged)
pct create 206 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname pantryo \
  --cores 2 \
  --memory 1024 \
  --swap 512 \
  --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=1 \
  --features nesting=1 \
  --unprivileged 1 \
  --onboot 1

# 3. Start the container and open its console
pct start 206
pct enter 206

# 4. Inside the LXC container, run the universal Linux installer
curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install.sh | bash
```

---

## 2. Raspberry Pi & Universal Linux Installation

The universal installer works across all major Linux distributions:
- **Raspberry Pi OS** (32-bit `armv7l` and 64-bit `aarch64`)
- **DietPi** & **Armbian**
- **Debian 11 (Bullseye)** & **Debian 12 (Bookworm)**
- **Ubuntu 20.04**, **22.04**, and **24.04 LTS**
- **Fedora**, **Rocky Linux**, & **AlmaLinux**
- **Arch Linux** & **Manjaro**

### 🚀 1-Line Universal Linux Installer

Log into your Raspberry Pi or Linux server via SSH, then execute:

```bash
curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install.sh | sudo bash
```

### 🧠 Intelligent Single-Board Computer (SBC) Optimizations

When running on single-board computers like the **Raspberry Pi 3B+**, **Raspberry Pi 4 (1GB)**, or **Raspberry Pi Zero 2W**, the installer automatically:
- Detects available RAM; if less than 1.5 GB, it provisions a **1 GB high-priority swapfile** (`/swapfile_pantryo`) with `vm.swappiness=20`. This prevents Linux Out-Of-Memory (`oom-killer`) crashes during builds and receipt OCR processing.
- Configures Node.js memory limits (`--max-old-space-size=512`).
- Installs Node.js 22 LTS directly via official NodeSource binaries.
- Generates a hardened systemd service (`/etc/systemd/system/pantryo.service`) with auto-restart on failure.

### 📋 Managing the Pantryo Systemd Service

```bash
# Check running status and uptime
sudo systemctl status pantryo

# Restart the server
sudo systemctl restart pantryo

# Stop the server
sudo systemctl stop pantryo

# Inspect live application logs
sudo journalctl -u pantryo -f -n 100
```

---

## 3. Docker & Docker Compose Deployment

For containerized environments running Docker, Podman, TrueNAS SCALE, or Unraid.

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  pantryo:
    image: ghcr.io/riquitinchiquitin-lab/pantryo:latest
    container_name: pantryo
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/data/pantryo.sqlite
      # Generate with: openssl rand -hex 32
      - SESSION_SECRET=c2e8a15993e7f4c029b384f67c30e219fae298114f6b1e5a8729381710928374
      # Default admin password for the first login
      - ADMIN_DEFAULT_PASSWORD=ChangeMeNowSecure2026!
      # Optional: Cloudflare Tunnel token
      # - CLOUDFLARE_TUNNEL_TOKEN=eyJh...
    volumes:
      # Persistent storage for encrypted database, uploaded receipts & avatars
      - ./data:/data
    networks:
      - pantryo-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/v1/auth/setup-status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

networks:
  pantryo-network:
    driver: bridge
```

Run with:

```bash
docker compose up -d
```

---

## 4. Manual Git & Node.js 22 LTS Installation

For power users wishing to deploy Pantryo manually into `/opt/pantryo`:

```bash
# 1. Update OS packages and install essentials
sudo apt update && sudo apt install -y curl git build-essential sqlite3

# 2. Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone repository
sudo git clone https://github.com/riquitinchiquitin-lab/Pantryo.git /opt/pantryo
cd /opt/pantryo

# 4. Install production & dev dependencies
sudo npm install

# 5. Build production client bundle
sudo npm run build

# 6. Configure environment
sudo cp .env.example .env
sudo nano .env

# 7. Create dedicated system user
sudo useradd -r -s /bin/false pantryo
sudo chown -R pantryo:pantryo /opt/pantryo

# 8. Create systemd unit file
sudo tee /etc/systemd/system/pantryo.service > /dev/null <<EOF
[Unit]
Description=Pantryo Smart Kitchen OS
After=network.target

[Service]
Type=simple
User=pantryo
WorkingDirectory=/opt/pantryo
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 9. Enable & start service
sudo systemctl daemon-reload
sudo systemctl enable --now pantryo
```

---

## 5. Updating Pantryo on Proxmox VE (LXC or VM)

Pantryo preserves your encrypted SQLite database (`/opt/pantryo/server/data/pantryo.sqlite`) and your configuration (`/opt/pantryo/.env`) safely across updates.

### Method 1: Automated 1-Click Update (Inside LXC Console)

Log into your LXC container console or SSH and run:

```bash
cd /opt/pantryo && sudo ./update.sh
```

Or run the update directly from the **Proxmox Node Host Shell** (replace `<CT_ID>` with your container number, e.g. `105`):

```bash
pct exec <CT_ID> -- bash -c "cd /opt/pantryo && ./update.sh"
```

### Method 2: Manual Step-by-Step Update

If you prefer to inspect each command manually:

```bash
# 1. Navigate to application folder
cd /opt/pantryo

# 2. Pull latest code (preserves .env and server/data/)
git pull --rebase || git pull

# 3. Install new dependencies & recompile native SQLite bindings
npm install --no-audit

# 4. Build production bundle (Vite frontend + esbuild server)
npm run build

# 5. Fix permissions for the unprivileged system user
sudo chown -R pantryo:pantryo /opt/pantryo
sudo chmod 700 /opt/pantryo/server/data
sudo chmod 600 /opt/pantryo/.env

# 6. Restart the systemd service
sudo systemctl restart pantryo

# 7. Verify the service is active and running
systemctl status pantryo
```

---

## 6. Access & Networking Architecture

Pantryo supports 3 streamlined, secure access models:

### Option A: Local Network Setup (Access to Local Network Only)

If you only plan to access Pantryo inside your home Wi-Fi network:

- **Zero External Exposure**: No ports are opened on your router, and no traffic leaves your local area network.
- **Direct LAN Access**: Pantryo listens on port `3000`. Access the web application directly at:
  ```text
  http://<your-server-ip>:3000
  (e.g., http://192.168.1.145:3000 or http://pantryo.local:3000)
  ```
- **Static DHCP Recommendation**: In your home router or Proxmox network settings, assign a static DHCP reservation to the Pantryo host or container so the local IP address never changes.
- **PWA / Mobile Access**: Bookmark `http://<your-server-ip>:3000` on your iPhone or Android phone, or tap **Add to Home Screen** to install the Pantryo Progressive Web App locally.

---

### Option B: Cloudflare Zero Trust Tunnel (Recommended)

Cloudflare Zero Trust tunnels securely connect your local Pantryo instance to Cloudflare's global edge without port-forwarding or exposing your home IP:

1. Sign up for a free [Cloudflare](https://dash.cloudflare.com/) account and add your domain.
2. In the Cloudflare Zero Trust Dashboard, go to **Networks > Tunnels > Create Tunnel** (choose `cloudflared`).
3. Select your server architecture (`arm64` for RPi 4/5, `amd64` for x86_64/Proxmox) and copy the installation token command:

```bash
# Install cloudflared on your server
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bullseye main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Run tunnel as a persistent service
sudo cloudflared service install <YOUR_CLOUDFLARE_TUNNEL_TOKEN>
```

4. In the Cloudflare Zero Trust dashboard (**Networks ➔ Tunnels ➔ Public Hostname**), configure your routing:
   - **Public Hostname**: e.g., `pantryo` under `yourdomain.com` (creates `https://pantryo.yourdomain.com`)
   - **Service Type**: `HTTP`
   - **URL Configuration Matrix**:

| Deployment Type | Correct Service URL | Why |
| :--- | :--- | :--- |
| **Proxmox LXC / Raspberry Pi / Bare Metal Linux** | **`localhost:3000`** *(or `127.0.0.1:3000`)* | `cloudflared` runs directly on the OS and communicates via local loopback. |
| **Docker / Docker Compose** | **`app:3000`** | `cloudflared` runs as a sibling container in the internal Docker network. |

> [!WARNING]
> If you set `app:3000` inside a Proxmox LXC container or VM, Cloudflare will fail with `Unable to reach the origin service...app:3000` because `app` only resolves inside Docker networks. Always use `localhost:3000` for LXC and Linux VMs.

#### 5. Verify Tunnel Status & Real-Time Logs
```bash
# Check tunnel service status:
systemctl status pantryo-tunnel.service

# View live tunnel connection events:
journalctl -u pantryo-tunnel.service -f

# Verify backend application is running on port 3000:
curl -I http://127.0.0.1:3000
```

#### 🛠️ Cloudflare Tunnel Troubleshooting
| Error / Symptom | Root Cause | Fix |
| :--- | :--- | :--- |
| `ERR Unable to reach origin ... app:3000` | Hostname set to `app:3000` in LXC/Linux | In Cloudflare Dashboard ➔ Tunnels ➔ Edit Hostname ➔ change URL to `localhost:3000`. |
| `curl: (7) Failed to connect ... port 443 after 0 ms` | Container lacking IPv6 gateway | Container queried Cloudflare's IPv6 record first without an IPv6 route. Test with `curl -4` or open directly in your phone/PC browser. |
| `Cloudflare Error 502 Bad Gateway` | `pantryo.service` is stopped | Run `systemctl start pantryo.service` inside the container. |
| `Cloudflare Error 1033` | Tunnel daemon is offline | Run `systemctl restart pantryo-tunnel.service` and verify token. |

---

### Option C: Tailscale Funnel (Zero-Config HTTPS & Remote Access)

[Tailscale Funnel](https://tailscale.com/kb/1223/funnel) allows you to route public internet HTTPS traffic (or restricted Tailnet-only traffic) directly to your Pantryo container with automated Let's Encrypt certificates and zero router configuration.

> [!IMPORTANT]
> **Container vs Host:** Always run Tailscale commands **inside the Pantryo container** (`pct enter <CTID>`), NOT on the Proxmox hypervisor host. Running inside the container connects Tailscale directly to Pantryo running on `localhost:3000`.

#### 1. Install Tailscale inside the Container
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

#### 2. Enable Userspace Mode (Crucial for Unprivileged Containers)
Unprivileged LXC containers may block `/dev/net/tun` kernel access. Enable Tailscale's high-compatibility userspace mode:
```bash
echo 'FLAGS="--tun=userspace-networking"' >> /etc/default/tailscaled
systemctl enable --now tailscaled
```

#### 3. Authenticate with your Tailscale Account
```bash
tailscale up --operator=pantryo
```
Open the generated authentication URL in your browser and approve the machine node.

#### 4. Configure Tailscale Admin Access Controls (One-Time Setup)
Tailscale requires an ACL policy allowing the `funnel` attribute before it publishes public internet DNS records:
1. Open [Tailscale Access Controls](https://login.tailscale.com/admin/acls).
2. Ensure `nodeAttrs` contains the `funnel` grant:
```json
"nodeAttrs": [
  {
    "target": ["autogroup:member"],
    "attr": ["funnel"]
  }
]
```
3. In [Tailscale DNS Settings](https://login.tailscale.com/admin/dns), make sure **MagicDNS** and **HTTPS Certificates** are toggled **ON**.

#### 5. Expose Pantryo on Port 3000
Run the background Funnel command targeting port `3000`:
```bash
# Public HTTPS on the internet (accessible anywhere, e.g. at the grocery store):
tailscale funnel --bg 3000

# OR: Private Tailnet-only access (accessible only when connected to Tailscale VPN):
tailscale serve --bg 3000
```

#### 6. Issue SSL Certificate & Publish Public DNS
Run this command to force immediate Let's Encrypt certificate issuance and public DNS record publication:
```bash
tailscale cert <your-container-hostname>.<your-tailnet-name>.ts.net
```

#### 7. Verify Status & Access
Check your live public routing:
```bash
tailscale funnel status
```
Your public URL will look like:
```text
https://pantryo2.<your-tailnet-name>.ts.net
```
In `/opt/pantryo/.env`, set `APP_URL=https://pantryo2.<your-tailnet-name>.ts.net` and restart: `systemctl restart pantryo.service`.

#### 📱 Mobile App (PWA) Installation
When opening your HTTPS URL on your smartphone:
- **iPhone (Safari)**: Tap the **Share** icon (square with arrow) ➔ **Add to Home Screen**.
- **Android (Chrome)**: Tap the **three dots** menu ➔ **Add to Home Screen** / **Install app**.
This enables full-screen application mode, native camera barcode scanning, and instant home inventory access.

#### 🛠️ Tailscale Funnel Troubleshooting
| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `modprobe: FATAL: module tun not found` | Container lacks `/dev/net/tun` | Run `echo 'FLAGS="--tun=userspace-networking"' >> /etc/default/tailscaled && systemctl restart tailscaled`. |
| `DNS_PROBE_FINISHED_NXDOMAIN` in browser | Browser or ISP cached negative DNS | Clear Chrome host cache at `chrome://net-internals/#dns` or test in an Incognito / Private window. |
| `nslookup <domain> 8.8.8.8` returns `No answer` | Tailscale ACL lacks `funnel` attribute | Add `"nodeAttrs": [{"target": ["autogroup:member"], "attr": ["funnel"]}]` to `https://login.tailscale.com/admin/acls` and save. |
| Status shows `(tailnet only)` | `tailscale serve` was run instead of `funnel` | Run `tailscale funnel --bg 3000` to re-enable public internet routing. |

---

## 7. Environment Variables Reference

Copy `.env.example` to `.env` and configure according to your infrastructure:

```bash
# -------------------------------------------------------------
# PANTRYO SERVER CONFIGURATION
# -------------------------------------------------------------

# Environment mode: 'production' or 'development'
NODE_ENV=production

# HTTP Port the server listens on
PORT=3000

# Path to the encrypted SQLite database file
DATABASE_PATH=./data/pantryo.sqlite

# Secret key used for cryptographic session signature and token verification (minimum 64 hex characters)
# Generate via: openssl rand -hex 32
SESSION_SECRET=e798f98a287b469c8a41147076a54d682496d07e66df423ad43209849201a0bc

# Default password for the initial administrator user on first boot
ADMIN_DEFAULT_PASSWORD=YourSecurePassword2026!

# Public URL used for OAuth/FIDO2 WebAuthn Origin validation and Expo Mobile sync
# Example: https://pantry.yourdomain.com or http://192.168.1.100:3000
PUBLIC_APP_URL=https://pantry.yourdomain.com

# -------------------------------------------------------------
# EXPO MOBILE & PWA CLIENT VARIABLES (Client-side exposed)
# -------------------------------------------------------------
# Base backend endpoint for the native iOS/Android Expo application
EXPO_PUBLIC_API_URL=https://pantry.yourdomain.com
```

---

## 8. Backup, Restore & SQLCipher Encryption

### 🔒 Verifying Database Encryption

Pantryo's database is encrypted with SQLCipher 256-bit AES. If someone copies `pantryo.sqlite` without your decryption key, reading it returns garbage:

```bash
# Attempt to inspect encrypted file directly with standard sqlite3 (fails safely)
sqlite3 /opt/pantryo/data/pantryo.sqlite "SELECT count(*) FROM items;"
# Error: file is not a database (or encrypted)
```

### 📦 Automated Nightly Backups (Cron)

Create an automated daily backup script:

```bash
sudo tee /usr/local/bin/pantryo-backup.sh > /dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="/var/backups/pantryo"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# 1. Vacuum & snapshot active database
sqlite3 /opt/pantryo/data/pantryo.sqlite ".backup '$BACKUP_DIR/pantryo_$TIMESTAMP.sqlite'"

# 2. Archive configuration and uploads
tar -czf "$BACKUP_DIR/pantryo_assets_$TIMESTAMP.tar.gz" -C /opt/pantryo .env public/uploads 2>/dev/null || true

# 3. Retain only last 14 backups
find "$BACKUP_DIR" -type f -mtime +14 -delete
EOF

sudo chmod +x /usr/local/bin/pantryo-backup.sh

# Add to root crontab to run daily at 03:00 AM
(sudo crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/pantryo-backup.sh >/dev/null 2>&1") | sudo crontab -
```

---

## 9. Troubleshooting & FAQ

### Q1: The server crashes during `npm install` on Raspberry Pi 3B+ / Zero 2W.
- **Cause**: Node.js ran out of RAM when compiling native bindings.
- **Solution**: Run `sudo dphys-swapfile swapoff && sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile && sudo dphys-swapfile setup && sudo dphys-swapfile swapon`. The automated `install.sh` script does this automatically.

### Q2: Port 3000 is already in use by another homelab app (e.g., Gitea, Grafana).
- **Solution**: Change `PORT=3050` in `/opt/pantryo/.env`, then run `sudo systemctl restart pantryo`.

### Q3: In Proxmox VE, receipt images fail to upload.
- **Cause**: LXC unprivileged container filesystem permissions or proxy upload limits.
- **Solution**: In LXC, ensure user `pantryo` owns `/opt/pantryo/public/uploads` (`sudo chown -R pantryo:pantryo /opt/pantryo/public/uploads`). The built-in Express server allows payloads up to 50MB.

### Q4: FIDO2 WebAuthn Passkeys fail to register on custom domains.
- **Cause**: WebAuthn requires a secure origin (`https://` or `localhost`).
- **Solution**: Ensure your domain is served over HTTPS via Cloudflare Tunnel or Tailscale Funnel with a valid SSL certificate. In `.env`, ensure `APP_URL` matches your exact domain with `https://`.

### Q5: My Antivirus / Container Scanner (Defender, CrowdStrike, Bitdefender, Trivy, Snyk) reports vulnerabilities.
- **Cause**: Newly spawned LXC templates or Docker base images ship with frozen package lists that lack the latest security patches, have world-readable file permissions on `.env` (`644`), or expose raw database ports to `0.0.0.0`.
- **Solution**: Run Pantryo's built-in 1-command security hardening script inside your container or host:

```bash
# Inside your LXC container or VM:
cd /opt/pantryo && sudo ./scripts/security-harden-container.sh
```

Or execute directly from your host shell:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/scripts/security-harden-container.sh)"
```

For **Docker & Docker Compose** users:
```bash
# Rebuild image with latest Debian Bookworm security patches and zero-CVE runner:
docker compose build --no-cache && docker compose up -d
```

**What is automatically enforced:**
1. **Full OS Security Patches**: Executes `apt-get dist-upgrade -y` to eliminate all pending Debian/Ubuntu base CVEs.
2. **Zero-CVE Minimal Container Runner**: The production runner stage strips build tools and unnecessary packages (uses Node 22 native `fetch()` instead of `curl` to eliminate curl CVE vectors).
3. **Non-Root Execution**: Runs strictly as unprivileged user `node` (UID 1000) with strict `700` directory permissions on `/app/server/data`.
4. **Capability Drop & Process Isolation**: Enforces `cap_drop: [ALL]`, `no-new-privileges: true`, and `pids_limit: 150` in `docker-compose.yml`.
5. **NPM Dependency Audit**: `npm audit` verified with **0 vulnerabilities**.
6. **Information Disclosure Prevention**: Express `x-powered-by` header disabled (prevents CWE-200 flags).
7. **Automated Daily Security Updates**: Enables `unattended-upgrades` via `/etc/cron.daily/pantryo-security-updates`.
8. **File Permission Lockdown**: Enforces `chmod 600 .env` (accessible by owner only).
9. **Network Port Isolation**: Binds PostgreSQL strictly to `127.0.0.1:5432` loopback only.
10. **Web UI Verification**: Open the **Admin Panel** (shield icon) > **Sécurité & Mises à Jour / Security & Updates** to view real-time audit status and trigger 1-click package updates.

---

*Pantryo is built with ❤️ for the open-source homelab community.*
