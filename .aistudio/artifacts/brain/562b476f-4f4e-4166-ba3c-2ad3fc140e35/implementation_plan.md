# Automated Dependency & System Package Lifecycle Architecture

Continuous, automated update framework for Pantryo, keeping both npm application dependencies and Debian OS packages current, resilient against breaking changes, and audited against security advisories.

---

### User Confirmed Decisions

> [!IMPORTANT]
> The following parameters were confirmed during the interactive interview:
> - **Package Scope**: Both **npm application dependencies** and **Debian OS system packages** will be continuously updated.
> - **Upgrade Aggressiveness**: **Auto-update minor and patch versions** automatically (within semver constraints and security advisories), with **major version alerts & notifications** surfaced in the admin panel to prevent breaking changes.
> - **Update Trigger & Schedule**: Automated execution via **daily background cron** and **on server startup** (with idempotency to avoid redundant builds).

---

### 1. Overview & Core Concept

Pantryo runs across self-hosted Proxmox LXCs, universal Linux VMs, and Docker environments. Keeping all dependencies updated is vital for defense against CVEs, performance optimizations, and API compatibility.

This implementation provides:
1. **Dual-Scope Auto-Update Engine**:
   - **npm Application Dependencies**: Automated `npm update` and `npm audit fix`, keeping packages at latest minor/patch semver releases while verifying build integrity.
   - **Debian System Packages**: Automated `apt-get update` and `unattended-upgrades` for the host and container base OS (glibc, OpenSSL, ca-certificates).
2. **Dual-Trigger Execution**:
   - **On Server Startup**: A non-blocking background initialization check that verifies dependency freshness and patches any critical CVEs if not checked within the past 24 hours.
   - **Daily Automated Schedule**: Configured both via `/etc/cron.daily/pantryo-security-updates` (system-level) and an internal 24-hour scheduler in Node.js (for standalone container environments).
3. **Major Version Detection & Admin Visibility**:
   - Real-time `npm outdated` evaluation that categorizes updates into **Applied Minor/Patch** vs. **Available Major Releases**.
   - Admin UI dashboard showing package status, last automated update timestamp, and 1-click on-demand manual update.

---

### 2. User Experience & Visual Design

Following the **SaaS & Dashboard Design Guidelines** (`frontend-design` constitution):
- **Location**: Admin Management Suite (`Sécurité, FIDO2 & Audit CIS` / `Maintenance & Mises à Jour` tab).
- **Status Cards**: High-density flat card showing:
  - **Automated Update Status**: Active indicator (Daily at 04:00 + On Startup).
  - **npm Dependencies Health**: Count of up-to-date packages and 0 critical/high CVEs.
  - **Major Version Advisory**: Uncluttered badge showing major releases available (e.g., Motion v14, Vite PWA v2) with semver change notes.
  - **Debian OS Package Health**: Status of unattended-upgrades.
- **Actions**:
  - `Update Packages Now` (with live spinner and build verification output).
  - Monospace CLI command snippet for terminal sysadmins: `sudo ./scripts/auto-update-all.sh`.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Safe Semver Auto-Update vs. Unconstrained Breaking Updates**
  - *Chosen Approach*: Automatically upgrade all patch (`~`) and minor (`^`) releases and security fixes (`npm audit fix`). Detect major breaking changes via `npm outdated` and surface them in the Admin Panel with manual upgrade controls.
  - *Why*: Direct automatic installation of major version bumps (like Vite 5 to 6 or better-sqlite3 12 to 13) can silently introduce breaking API changes that take down household kitchen servers.
- **Decision 2: Startup Background Check with 24-Hour Idempotency Cooldown**
  - *Chosen Approach*: On server launch (`server.ts`), check `lastUpdateTimestamp` stored in `server/data/update-status.json`. If older than 24 hours (or first run), execute in background without blocking server boot or HTTP request listening.
  - *Why*: Guarantees instant server startup and port 3000 responsiveness while ensuring freshly restarted containers automatically pull security patches.
- **Decision 3: Unified Script (`scripts/auto-update-all.sh`)**
  - *Chosen Approach*: Create a single executable script that coordinates Debian apt updates, unattended-upgrades, npm update, and build verification.

---

### 4. Technical Architecture & File Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTOMATED UPDATE SCHEDULER                            │
│  - System Cron: /etc/cron.daily/pantryo-security-updates                    │
│  - Server Startup: non-blocking background check with 24h debounce          │
│  - In-App Manual: POST /api/v1/admin/security/auto-update                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    UNIFIED UPDATE ENGINE (dual-scope)                       │
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │       DEBIAN SYSTEM PACKAGES        │  │   NPM APPLICATION PACKAGES   │  │
│  │ - apt-get update -q                 │  │ - npm update (minor/patch)   │  │
│  │ - unattended-upgrades               │  │ - npm audit fix (security)   │  │
│  │ - debsums verification              │  │ - npm outdated (major alerts)│  │
│  └──────────────────┬──────────────────┘  └──────────────┬───────────────┘  │
│                     │                                    │                  │
│  ┌──────────────────▼────────────────────────────────────▼───────────────┐  │
│  │                      VERIFICATION & PERSISTENCE                       │  │
│  │  - npm run build (guarantees zero compilation regressions)            │  │
│  │  - Save status to server/data/update-status.json                      │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│               IN-APP ADMIN VISIBILITY & CONTROLS (React)                    │
│  - Displays automated update schedule, last run time, & pending majors      │
│  - 1-click "Update Packages Now" button with realtime feedback              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Implementation Steps

1. **Enhance Auto-Update Scripts (`scripts/auto-update-dependencies.js` & `scripts/auto-update-all.sh`)**:
   - Update `scripts/auto-update-dependencies.js` to parse `npm outdated` and report minor/patch updates applied and major versions available.
   - Create unified `scripts/auto-update-all.sh` that checks/updates Debian OS packages and runs the Node.js dependency updater with build verification.
2. **Server Background Startup & Daily Interval (`server.ts`)**:
   - Add non-blocking background startup routine that checks `update-status.json`.
   - Set up daily background interval (24h) to ensure standalone containers without host cron run updates.
3. **Backend API Endpoints (`server/src/routes/admin.js`)**:
   - Enhance `GET /api/v1/admin/security/audit` to return detailed package freshness (latest versions, minor updates applied, major alerts).
   - Ensure `POST /api/v1/admin/security/auto-update` executes the unified script and returns real-time progress.
4. **Admin UI Updates (`src/components/AdminManagementModal.tsx`)**:
   - Surface the automated update status, major release alerts, and last update timestamp with clear badges and French/English localization.
5. **Install & Crontab Updates (`install-proxmox.sh` & `INSTALLATION.md`)**:
   - Ensure the daily cron job executes `scripts/auto-update-all.sh`.
   - Document automated update mechanisms and commands.
