# Implementation Plan — Clean Update, Backup & Restore Script for Proxmox VE LXC

Build a bulletproof, production-grade automated shell script (`scripts/clean-update-restore.sh`) designed for Proxmox VE LXC containers (and universal Linux hosts) that:
1. Pauses the Pantryo service.
2. Creates an atomic, timestamped backup of all user data (`.env`, SQLCipher database `pantryo.sqlite`, master encryption keys, and uploaded avatars/media) to `/var/backups/pantryo/`.
3. Purges old, stale, and corrupted files (`node_modules`, `package-lock.json`, `dist`, `.vite`, cache directories).
4. Pulls the latest official codebase from GitHub (`origin/main`).
5. Performs a fresh `npm install` and compiles the production bundle with memory-safe limits (`NODE_OPTIONS="--max-old-space-size=2048"`).
6. Restores the verified user data and enforces strict security permissions (`pantryo:pantryo`, `chmod 600` on `.env`, `chmod 700` on `server/data`).
7. Restarts the systemd service, performs an automated health check, and offers an automatic rollback if the service fails.

---

## 1. Architecture & Script Specifications

### Target Path
- **File:** `scripts/clean-update-restore.sh` (executable `chmod +x`)
- **Direct 1-line execution:**
  ```bash
  curl -fsSL https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main/scripts/clean-update-restore.sh | sudo bash
  ```
  *(or locally inside the LXC container: `sudo /opt/pantryo/scripts/clean-update-restore.sh`)*

### Data Assets to Preserve & Restore
- **Environment Configuration:** `/opt/pantryo/.env` (contains `PANTRYO_ADMIN_PASSWORD`, `DB_ENCRYPTION_KEY`, `APP_URL`, `CLOUDFLARE_TUNNEL_TOKEN`)
- **SQLCipher Encrypted Database:** `/opt/pantryo/server/data/pantryo.sqlite`
- **Master Encryption Key & Salting:** `/opt/pantryo/server/data/master.key` and any files in `server/data/`
- **Custom User Avatars & Uploads:** `/opt/pantryo/public/avatars/custom/` and `/opt/pantryo/server/uploads/` (if present)
- **Backup Destination:** `/var/backups/pantryo/backup_<YYYYMMDD_HHMMSS>/`

---

## 2. Step-by-Step Script Execution Flow

```text
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: Pre-Flight & Service Halt                          │
│  - Check root/sudo privileges                                │
│  - Detect /opt/pantryo directory                             │
│  - Stop pantryo.service (graceful connection draining)       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 2: Atomic Data Backup                                 │
│  - Create /var/backups/pantryo/backup_<TIMESTAMP>/           │
│  - Copy .env, server/data/*, and uploaded avatars            │
│  - Generate SHA-256 integrity checksums                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 3: Deep Clean of Stale Files                          │
│  - Remove node_modules, package-lock.json, dist, .vite       │
│  - Run git clean -dfX (excluding preserved data)             │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 4: Fresh Code Pull & Build                            │
│  - git fetch --all --tags && git reset --hard origin/main    │
│  - npm install (recompiles native better-sqlite3 bindings)   │
│  - NODE_OPTIONS="--max-old-space-size=2048" npm run build   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 5: Data Reinstallation & Permissions Hardening        │
│  - Restore .env, server/data/ files, and uploads             │
│  - Verify SHA-256 database checksum matches backup           │
│  - chown -R pantryo:pantryo /opt/pantryo                     │
│  - chmod 600 .env && chmod 700 server/data                   │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 6: Health Verification & Rollback Protection          │
│  - systemctl daemon-reload && systemctl start pantryo        │
│  - Poll http://localhost:3000/api/v1/auth/public-members     │
│  - If healthy: print success summary and backup location     │
│  - If failed: auto-restore from backup and alert admin       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Steps

1. **Create `scripts/clean-update-restore.sh`**:
   - Write complete, robust POSIX Bash script with `set -euo pipefail`.
   - Implement colored terminal output, spinner/progress logs, and safety checks.
   - Include rollback trap on unexpected error.
2. **Update `update.sh`**:
   - Add a `--clean` or `--fresh` flag to the existing root `update.sh` that delegates to `clean-update-restore.sh`.
3. **Update Documentation**:
   - Update `INSTALLATION.md` and `README.md` to document the 1-command clean update & restore runbook for Proxmox VE LXC.
4. **Verification**:
   - Run syntax and lint checks on the bash script (`bash -n scripts/clean-update-restore.sh`).
   - Validate file paths and permissions.

---

## 4. User Review & Approval

Please review the plan above. Click **Proceed** to implement the clean update, backup, and restore script.
