# Debian 12 Deployment & Security Strategy for Pantryo

Confirming Debian 12 (Bookworm) as the recommended host distribution for Pantryo, maintaining current production systemd and Proxmox LXC scripts, and integrating an OS Architecture & Security Comparison into the Admin Center.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preference was confirmed during clarification:
> - **Deployment Path**: **Stay on Debian 12 and keep current systemd scripts**.

- **Technical Verdict 1: Can Pantryo run on Arch Linux?**
  Yes. Pantryo is a standard Node.js (v20/v22 LTS) + SQLite/SQLCipher + systemd application. It runs smoothly on Arch Linux with `pacman -S nodejs npm sqlcipher`.
- **Technical Verdict 2: Debian 12 vs. Arch Linux vs. Debian 13 (Trixie)**
  - **Debian 12 Bookworm (Recommended)**: Rock-solid stability, 5-year LTS cycle, AppArmor enabled by default, automated security patches via `unattended-upgrades`, and zero breaking system updates for a 24/7 home server.
  - **Arch Linux**: Bleeding-edge rolling release (`pacman -Syu`). Excellent for desktop enthusiasts, but introduces unexpected kernel, glibc, and Node native module (better-sqlite3) rebuild breakages on headless servers. Mandatory manual hardening (no default MAC/AppArmor enforcement).
  - **Debian 13 "Trixie"**: Currently the *testing* release. Debian's security team does not provide immediate security updates or guaranteed security SLAs for the testing suite until it is frozen and formally released as stable (expected mid-2025). Do not use Debian 13 for production data yet.
- **Technical Verdict 3: Is Arch Linux secure enough?**
  Arch Linux is inherently as secure as the administrator configures it, but out-of-the-box it does not enforce Mandatory Access Control (AppArmor/SELinux), lacks automated security backports, and exposes bleeding-edge upstream software before community vetting. Debian 12 provides a hardened, battle-tested baseline with CIS benchmark compliance built into Pantryo's audit suite.

---

## 1. Plan Overview

1. **Retain & Consolidate Debian 12 Systemd Scripts**:
   - Keep the hardened Debian 12 / Ubuntu systemd unit, automatic startup, sandboxing (`ProtectSystem=strict`, `PrivateTmp=true`, `ProtectHome=true`), and `unattended-upgrades` cron.
2. **Add In-App OS Guidance & Rationale**:
   - Enhance the **Host & Server Deployment** section in `AdminManagementModal.tsx` and `DocumentationModal.tsx` with a dedicated **"Debian 12 vs Arch Linux vs Debian 13"** advisory card in both English and French.
   - Clearly explain why Debian 12 Bookworm is the gold standard for Pantryo (AppArmor, 5-year LTS, unattended CVE patches, zero rolling downtime), while clarifying how Arch Linux or Docker can be used if ever desired.
3. **CIS Debian 12 Security Audit Compliance**:
   - Verify that all CIS Debian 12 benchmarks (`SEC-01` to `SEC-07`) in the Admin Center correctly validate file permissions (600 for `.env`, 700 for data directories) and systemd sandboxing.

---

## 2. Proposed UI Enhancements

In `src/components/AdminManagementModal.tsx` (Deployment / Host tab) and `src/components/DocumentationModal.tsx`:
- Add a visual distro badge component:
  - 🟢 **Debian 12 (Bookworm LTS)**: *Recommended Production Standard* (AppArmor, LTS stability, automatic security patches).
  - 🟡 **Arch Linux**: *Compatible but Not Recommended for 24/7 Headless* (Rolling updates risk native module breakages, manual security required).
  - 🔴 **Debian 13 (Trixie Testing)**: *Not Recommended for Production* (Testing branch lacks formal Debian Security Team SLAs until release).
- Provide a quick toggle/view for the user to see the exact security comparison table directly in the Admin Center.

---

## 3. Verification Plan

1. Verify that `AdminManagementModal.tsx` and `DocumentationModal.tsx` compile cleanly without TypeScript or React errors.
2. Confirm the language toggle (`FR` / `EN`) seamlessly renders the new OS comparison text.
3. Run `lint_applet` and `compile_applet` to ensure pristine production build.
