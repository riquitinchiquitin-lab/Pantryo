# 🌿 Pantryo — Self-Hosted Smart Kitchen & Pantry OS

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Platform: Proxmox | Linux | Raspberry Pi | Docker](https://img.shields.io/badge/Platform-Proxmox%20%7C%20Linux%20%7C%20RPi%20%7C%20Docker-0D3B37.svg)](#hardware--platform-compatibility)
[![Encryption: 256--bit AES SQLCipher](https://img.shields.io/badge/Security-256--bit%20AES%20SQLCipher-emerald.svg)](#security--privacy-architecture)
[![Auth: FIDO2 / WebAuthn](https://img.shields.io/badge/Auth-FIDO2%20Passkeys-blue.svg)](#fido2-biometric-authentication)
[![PWA: Offline Ready](https://img.shields.io/badge/PWA-Offline%20First-amber.svg)](#progressive-web-app--mobile)
[![Language: Bilingual FR / EN](https://img.shields.io/badge/Language-FR%20%7C%20EN-purple.svg)](#bilingual-experience)

> **Pantryo** is a privacy-first, self-hosted kitchen inventory, meal planning, and grocery operating system. Built for homelabs, Proxmox VE clusters, Raspberry Pi SBCs, and local home servers, Pantryo eliminates grocery waste through on-device AI vision, intelligent shelf-life tracking, and seamless family synchronization without relying on third-party cloud surveillance.

---

## 📑 Table of Contents

- [✨ Key Highlights](#-key-highlights)
- [🏗️ System Architecture](#️-system-architecture)
- [⚡ Quickstart (60 Seconds)](#-quickstart-60-seconds)
  - [Option A: Proxmox VE (Automated LXC Container)](#option-a-proxmox-ve-automated-lxc-container)
  - [Option B: Raspberry Pi & Universal Linux](#option-b-raspberry-pi--universal-linux)
  - [Option C: Docker & Docker Compose](#option-c-docker--docker-compose)
  - [Option D: Local Development](#option-d-local-development)
- [🖥️ Hardware & Platform Compatibility](#️-hardware--platform-compatibility)
- [🛡️ Security & Privacy Architecture](#️-security--privacy-architecture)
- [🌐 Cloudflare Tunnel & Custom Domains](#-cloudflare-tunnel--custom-domains)
- [📱 Progressive Web App & Expo Mobile](#-progressive-web-app--expo-mobile)
- [📚 Documentation Index](#-documentation-index)
- [📄 License](#-license)

---

## ✨ Key Highlights

- **🍓 Ultra-Lightweight (~120–180 MB RAM)**: Runs effortlessly on a Raspberry Pi 3B+, 4, 5, Zero 2W, or an unprivileged Proxmox LXC container with 512 MB of memory.
- **👁️ On-Device AI Vision & Scanner**:
  - 399-class produce vision classifier (MobileNetV2) running locally in your browser/device.
  - Optical receipt character recognition (OCR) with automatic shelf-life and zone categorization.
  - Barcode lookup with OpenFoodFacts integration and local offline caching.
- **📦 Four Temperature Storage Zones**: Granular tracking for **Fridge**, **Pantry**, **Freezer**, and **Spice Rack** with expiration countdowns and visual spoilage alerts.
- **👨‍🍳 Dynamic Recipe & Culinary Engine**: Generates recipes based strictly on what is about to expire in your kitchen, minimizing food waste and saving hundreds of dollars monthly.
- **🔒 Zero-Knowledge Local Encryption**: Embedded SQLite database encrypted with **256-bit AES SQLCipher** at rest. Argon2id password hashing and mandatory **FIDO2 WebAuthn Passkeys** (Touch ID, Face ID, YubiKey).
- **🌐 Cloudflare Zero Trust or Custom Domain**: One-click configuration for Cloudflare tunnels (zero open ports) or reverse proxies (Caddy, Nginx, NPM, Traefik) with automatic HTTPS.
- **🇫🇷 / 🇬🇧 100% Bilingual**: Instant real-time language toggle between French and English throughout the web application, mobile simulator, and installation tooling.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Clients & Edge Devices                          │
│   iOS / Safari PWA    Android Chrome PWA    Desktop Web Browser (1080p)│
│   Expo React Native   Kitchen Touch Display (Kiosk Mode Raspberry Pi)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS / mTLS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Zero-Trust Edge / Reverse Proxy                      │
│   Cloudflare Zero Trust Tunnel   OR   Caddy / Nginx / Traefik / NPM    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Local Network :3000
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Pantryo Node.js Full-Stack Server                    │
│ ┌───────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │  Express REST & Static Engine │  │  Vite Server-Side Middleware    │ │
│ │  - /api/v1/items              │  │  - PWA Manifest & Service Worker│ │
│ │  - /api/v1/auth (FIDO2)       │  │  - Dynamic Asset Bundling       │ │
│ │  - /api/v1/admin (Backup/Sync)│  │  - Installer Scripts Serving    │ │
│ └──────────────┬────────────────┘  └─────────────────────────────────┘ │
│                │                                                       │
│                ▼                                                       │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │           Encrypted SQLite Database Engine (SQLCipher)             │ │
│ │   - 256-bit AES-GCM at-rest encryption                             │ │
│ │   - Argon2id password key derivation                               │ │
│ │   - WAL Mode (Write-Ahead Logging) for high concurrency            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart (60 Seconds)

### Option A: Proxmox VE (Automated LXC Container)

In the Proxmox VE node shell (PVE 7.x or 8.x), paste the automated 1-line installer:

```bash
# Automated Proxmox LXC provisioner (Debian 12 Bookworm, unprivileged, 512MB RAM)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install-proxmox.sh)"
```

*The installer asks for your desired container ID (default `206`), hostname (`pantryo`), RAM (`1024MB`), and root disk size (`4GB`), downloads the template, and boots Pantryo automatically.*

### Option B: Raspberry Pi & Universal Linux

Supports **Raspberry Pi OS**, **DietPi**, **Armbian**, **Debian**, **Ubuntu**, **Fedora**, **Rocky**, and **Arch Linux**:

```bash
# Automated multi-distro installer with systemd service & auto-swap tuning
curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/install.sh | sudo bash
```

*Automatically configures a 1 GB swapfile on low-memory single-board computers (RPi 3B+ / Zero 2W), installs Node.js 22 LTS, sets up systemd auto-restart (`pantryo.service`), and starts the server on port `3000`.*

### Option C: Docker & Docker Compose

Create a `docker-compose.yml` file on your server:

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
      - SESSION_SECRET=ReplaceWithYourSecureRandom64CharSecretHere
      - ADMIN_DEFAULT_PASSWORD=YourSecureAdminPassword2026!
    volumes:
      - ./pantryo-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/auth/setup-status"]
      interval: 30s
      timeout: 5s
      retries: 3
```

Start the container:

```bash
docker compose up -d
```

### Option D: Local Development

```bash
# 1. Clone repository
git clone https://github.com/riquitinchiquitin-lab/Pantryo.git
cd pantryo

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Start full-stack development server (Hot Module Replacement enabled)
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🖥️ Hardware & Platform Compatibility

| Target Hardware / Hypervisor | Min Specs | Recommended Specs | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Proxmox VE (LXC Container)** | 1 vCPU · 512 MB RAM · 3 GB Disk | 2 vCPU · 1024 MB RAM · 6 GB Disk | 🟢 Production | Unprivileged LXC container; near-zero overhead. |
| **Raspberry Pi 5** | 1 GB RAM · 8 GB microSD | 4 GB RAM · NVMe SSD | 🟢 Production | Blazing fast OCR & AI inference; instant boot. |
| **Raspberry Pi 4 / 400** | 1 GB RAM · 8 GB microSD | 2 GB+ RAM · Class 10 A2 card | 🟢 Production | Automated swap allocation handles concurrent clients. |
| **Raspberry Pi 3B+ / Zero 2W** | 512 MB RAM · 8 GB microSD | 1 GB RAM · 16 GB microSD | 🟢 Verified | Automated 1 GB swapfile setup by `install.sh`. |
| **x86_64 Home Server / Mini PC** | 1 Core · 512 MB RAM · 4 GB Disk | 2 Cores · 2 GB RAM · 10 GB Disk | 🟢 Production | Intel N100, NUC, Dell OptiPlex, HP EliteDesk. |
| **Docker / Podman** | 512 MB Memory Limit | 1024 MB Memory Limit | 🟢 Production | Multi-arch images for `amd64`, `arm64`, and `armv7l`. |

---

## 🛡️ Security & Privacy Architecture

Pantryo was engineered from day one around **Zero Trust** and **Privacy-by-Design**:

1. **At-Rest Database Encryption (SQLCipher)**:
   - All pantry items, receipt images, custom recipes, household member records, and audit logs are encrypted using **256-bit AES in GCM mode**.
   - Database key is derived using memory-hard **Argon2id**.
2. **FIDO2 WebAuthn Passwordless Authentication**:
   - Zero credentials stored in cleartext.
   - Support for platform authenticators (Apple Touch ID, Face ID, Windows Hello, Android Biometrics) and roaming hardware tokens (YubiKey 5 Series).
3. **Zero External Tracking**:
   - No Google Analytics, no telemetry beacons, no external third-party CDN scripts.
   - AI vision processing and produce classification run 100% locally on the device or inside your private LAN.
4. **Encrypted Backups**:
   - Download or restore encrypted JSON snapshot backups with custom decryption passphrases right from the Admin Console.

---

## 🌐 Cloudflare Tunnel & Custom Domains

Run Pantryo on your own domain with end-to-end SSL encryption without punching holes in your firewall:

### 1. Cloudflare Zero Trust Tunnel (Recommended)
```bash
# Install cloudflared daemon on your server
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bullseye main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Authenticate & route to your Pantryo instance
cloudflared tunnel login
cloudflared tunnel create pantryo
cloudflared tunnel route dns pantryo pantry.yourdomain.com
cloudflared tunnel run --url http://localhost:3000 pantryo
```

### 2. Caddy Reverse Proxy (Automatic Let's Encrypt SSL)
```caddy
pantry.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
}
```

### 3. Tailscale Funnel (Zero-Port-Forwarding & Automatic SSL)
Run inside your Pantryo container:
```bash
# 1. Install & configure userspace mode for unprivileged containers
curl -fsSL https://tailscale.com/install.sh | sh
echo 'FLAGS="--tun=userspace-networking"' >> /etc/default/tailscaled && systemctl enable --now tailscaled

# 2. Authenticate & expose publicly
tailscale up --operator=pantryo
tailscale funnel --bg 3000
tailscale cert <hostname>.<tailnet>.ts.net
```
Ensure your [Tailscale ACLs](https://login.tailscale.com/admin/acls) include `"nodeAttrs": [{"target": ["autogroup:member"], "attr": ["funnel"]}]`.

---

## 📱 Progressive Web App & Expo Mobile

- **PWA (Progressive Web App)**: Add Pantryo to your iPhone, iPad, or Android home screen with a single tap. Works offline with client-side Service Worker caching for instant pantry lookups inside grocery stores without mobile reception.
- **Expo Mobile Client**: Point the `EXPO_PUBLIC_API_URL` environment variable to your server's domain to run the native iOS/Android client.

---

## 📚 Documentation Index

- 📘 [Comprehensive Installation Runbook (INSTALLATION.md)](INSTALLATION.md) — Detailed steps for Proxmox VE, Debian/Ubuntu, Arch, Fedora, Docker, and Nginx.
- 📙 [Complete Feature Specification (FEATURES.md)](FEATURES.md) — Exhaustive guide on AI Vision, SQLCipher, Meal Planning, and Household Sync.
- 📗 [Environment Configuration Guide (.env.example)](.env.example) — Complete reference of server and client environment variables.

---

## 📄 License

Pantryo is released under the **MIT License**. Free and open-source for personal, homelab, and commercial use.
