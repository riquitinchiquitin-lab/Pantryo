# Proxmox LXC & Reverse Proxy Interactive Installer Suite

Comprehensive upgrade to the Pantryo Proxmox VE LXC installer and universal Linux setup scripts, introducing interactive container root password provisioning, auto-generated SQLCipher 256-bit encryption keys for password managers, and a 5-way reverse proxy configuration menu (Cloudflare Tunnel, Caddy, Nginx + Let's Encrypt, Nginx Proxy Manager, Traefik).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following choices were confirmed during Phase 1 clarification:
> - **Container Root Password**: Interactive prompt during container creation with option to press Enter to auto-generate a secure 20-character password, which is then formatted for easy copying into a password manager.
> - **Reverse Proxy Selection**: Interactive numbered menu during installation presenting all 5 external access / reverse proxy options (Cloudflare Tunnel, Caddy, Nginx & Certbot, NPM, Traefik) plus a LAN-only option.

---

## 1. Overview & Core Concept

When deploying self-hosted software like Pantryo on Proxmox VE or Linux bare-metal, system administrators require seamless onboarding for:
1. **Container Security & Credentials**: Explicitly setting or securely generating the container's `root` password and SQLite SQLCipher database encryption key, avoiding ambiguous defaults and ensuring credentials can be stored in password managers (Bitwarden, 1Password, KeePass).
2. **Flexible Ingress / Reverse Proxy**: Every homelab uses different networking infrastructure. Providing pre-configured, battle-tested templates for Cloudflare Zero Trust, Caddy (automatic ACME HTTPS), Nginx with Certbot, Nginx Proxy Manager, and Traefik eliminates manual configuration friction.

---

## 2. User Experience & Wizard Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│               Pantryo - Proxmox VE LXC Installer                       │
│        Smart Kitchen Food Inventory, Receipts & Meal Planning          │
└────────────────────────────────────────────────────────────────────────┘

[Step 1: Container Provisioning & Credentials]
  ├─ Container ID [206]: 
  ├─ Container Hostname [pantryo]: 
  ├─ RAM Allocation [1024 MB]: 
  ├─ Disk Allocation [8 GB]: 
  └─ Container Root Password:
     [Enter for auto-generated 20-char secure password, or type custom]
     ► Generated Password:  X9$mK#2pL8vN!4qR7wY0
     (Displayed in copy-friendly format for password managers)

[Step 2: SQLite SQLCipher 256-bit Encryption Key]
  ├─ Auto-generated 256-bit AES-GCM Key:
  │  27f76ac5ffba8d8497dec5374687f317132443edc16e8c624c175e25edf48ea1
  └─ [Saved to /opt/pantryo/.env as DB_ENCRYPTION_KEY]

[Step 3: Web Admin Account]
  ├─ Full Name / Display Name [Alex]:
  ├─ Username [alex]:
  └─ Password (min 8 chars, NIST SP 800-63B compliant):

[Step 4: Reverse Proxy & Ingress Selection]
  ┌──────────────────────────────────────────────────────────────┐
  │ 1) Cloudflare Tunnel (Zero port forwarding, instant HTTPS)   │
  │ 2) Caddy (Automatic HTTPS via Let's Encrypt / Zero-config)   │
  │ 3) Nginx & Let's Encrypt Certbot (Native systemd + renewal)  │
  │ 4) Nginx Proxy Manager (NPM GUI - upstream setup guidelines) │
  │ 5) Traefik v2 / v3 (Dynamic file provider configuration)     │
  │ 6) LAN Only (HTTP on port 3000, no reverse proxy)            │
  └──────────────────────────────────────────────────────────────┘
  Select option [1-6]: 
```

---

## 3. Detailed Component Plan

### A. Proxmox VE Host Installer (`install-proxmox.sh`)
- **Proxmox VE Detection**: Recognizes when running directly on the hypervisor host (`pveversion`).
- **Interactive Container Password**:
  - Prompts: `Container Root Password [press Enter to auto-generate]:`
  - Generates high-entropy 20-character password using cryptographic randomness.
  - Passes `--password "$CT_PASSWORD"` to `pct create`.
  - Displays summary table with credentials ready for password manager entry.
- **Auto-Generated SQLCipher Encryption Key**:
  - Generates 64-character hex key (`openssl rand -hex 32`).
  - Sets `DB_ENCRYPTION_KEY` in `/opt/pantryo/.env`.
- **Reverse Proxy Ingress Handler**:
  - Sub-routine for each selected proxy:
    - **Cloudflare Tunnel**: Prompts for token, installs `cloudflared`, provisions systemd service.
    - **Caddy**: Prompts for domain, installs `caddy`, generates `/etc/caddy/Caddyfile` with WebSocket proxying, starts service.
    - **Nginx & Certbot**: Prompts for domain + email, installs `nginx` + `certbot`, creates virtual host with `/api/` streaming and WebSocket support, runs `certbot --nginx`.
    - **Nginx Proxy Manager**: Configures Pantryo on port 3000, displays exact NPM proxy host configuration parameters (Host, Port 3000, WebSockets Support enabled, Block Common Exploits).
    - **Traefik**: Creates `/etc/traefik/dynamic/pantryo.yml` configuration with routers and services.
    - **LAN Only**: Configures binding on `0.0.0.0:3000`.

### B. Universal Linux Installer (`install.sh`)
- Adds matching SQLCipher key display, interactive password manager prompts, and the 5-way reverse proxy configuration menu for bare-metal Debian, Ubuntu, Raspberry Pi, and Arch Linux deployments.

### C. In-App Documentation Modal (`src/components/DocumentationModal.tsx`)
- Updates the **Proxmox** and **Reverse Proxy** documentation tabs with copyable configuration snippets for all 5 reverse proxies (Cloudflare Tunnel, Caddy Caddyfile, Nginx vhost, NPM guide, and Traefik YAML).

### D. Documentation Files (`INSTALLATION.md` & `README.md`)
- Detailed step-by-step guides for each reverse proxy architecture.
- Full documentation on container root password management and SQLCipher database key recovery.

---

## 4. Technical Architecture & File Layout

```
                        ┌───────────────────────────────────────────┐
                        │ Proxmox VE Host or Linux Terminal         │
                        └─────────────────────┬─────────────────────┘
                                              │
                      curl -fsSL .../install-proxmox.sh | bash
                                              │
                         ┌────────────────────▼───────────────────┐
                         │   install-proxmox.sh / install.sh      │
                         │                                        │
                         │  1. Container Root Password Generator  │
                         │  2. SQLCipher 256-bit Key Generator    │
                         │  3. Admin Account Provisioner          │
                         │  4. Reverse Proxy Selector [1-5]       │
                         └────────────────────┬───────────────────┘
                                              │
         ┌───────────────┬────────────────────┼───────────────────┬───────────────┐
         │               │                    │                   │               │
         ▼               ▼                    ▼                   ▼               ▼
   [Cloudflare]      [Caddy]               [Nginx]              [NPM]         [Traefik]
   cloudflared     /etc/caddy/        /etc/nginx/sites-     NPM upstream     /etc/traefik/
   systemd svc     Caddyfile          available/pantryo     instructions      dynamic/
                   auto HTTPS         + certbot renewal                       pantryo.yml
```

---

## 5. Verification Plan

1. **Bash Syntax & Validation**: Run `bash -n install-proxmox.sh` and `bash -n install.sh` to guarantee syntax correctness across Debian/Ubuntu/Proxmox shells.
2. **Reverse Proxy Configuration Output Testing**: Verify generated Caddyfile, Nginx vhost, Traefik config, and Cloudflare systemd definitions.
3. **Applet Compilation**: Run `compile_applet` and `lint_applet` to ensure full TypeScript and React build integrity for `DocumentationModal.tsx`.
