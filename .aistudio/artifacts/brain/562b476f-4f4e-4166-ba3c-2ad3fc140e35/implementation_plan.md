# Full-Stack Security Audit & Vulnerability Remediation Plan

Comprehensive security evaluation and hardened remediation blueprint for Pantryo across authentication flows, API access controls, SQLCipher database encryption at rest, session handling, and containerized deployment environments.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The security review identified **two Critical severity vulnerabilities** related to authentication bypass fallbacks that must be prioritized and patched immediately, especially now that the instance is exposed over Tailscale Funnel.

- **Confirmed Scope**: Full-stack audit covering API endpoints, database at rest, authentication/FIDO2, and container hardening.
- **Confirmed Action**: Deliver prioritized audit findings and immediately patch identified vulnerabilities across backend services.
- **Recommended Remediation Strategy**:
  1. **Immediate Critical Fix**: Strip all unauthenticated fallbacks (`req.headers["x-user-id"]`, `req.body.userId`, and default admin bypass) in `admin.js` and `inventory.js`.
  2. **Backdoor Elimination**: Disable or guard virtual simulation endpoints (`/simulate-auth` and `/simulate-enroll`) so they are unreachable in production.
  3. **Information Disclosure Prevention**: Remove email and private identifier leakage from the public member list `/public-members`.
  4. **Session Hardening**: Disallow tokens in URL query parameters (`?token=...`) to avoid log and Referer leaks; enforce `Authorization: Bearer` and secure cookie validation.
  5. **Credential Ownership Proof**: Require verification of `oldPassword` when users change passwords.

---

## 1. Executive Summary & Threat Model

| Metric | Assessment |
| :--- | :--- |
| **Target Application** | Pantryo Smart Kitchen OS (Full-Stack Node.js 22 LTS, Express, React, SQLCipher) |
| **Exposure Context** | Accessible on Local LAN, Tailscale Tailnet, and Public Tailscale Funnel HTTPS |
| **Audit Coverage** | 100% Backend Routes (`admin.js`, `authFido2.js`, `inventory.js`, `recipes.js`), Security Services (`dbStore.js`, `sessionTokenService.js`, `cryptoService.js`, `nistPasswordValidator.js`, `rateLimiter.js`, `ssrfGuard.js`), Server Middleware (`server.ts`), and Deployment Scripts (`proxmox-lxc.sh`, `install-proxmox.sh`, `install.sh`) |
| **Overall Posture** | **Medium-High Foundation with Critical Logic Bypass Flaws** (Strong cryptographic primitive usage such as Argon2id and AES-256-GCM, but undermined by permissive development fallbacks in route middleware) |

```
                       ATTACK SURFACE MAP & AUDIT BOUNDARIES
                       
  [ Internet / Tailscale Funnel ] 
                │
                ▼ (TLS Termination & Security Headers: HSTS, CSP, X-Frame)
        ┌──────────────────────────────────────────────────────────────┐
        │ Express Server (server.ts)                                   │
        │ - Rate Limiting (NIST SP 800-63B Progressive Delay)          │
        │ - JSON Body Limit (2MB Standard / 50MB Scans)                │
        │ - SSRF IP Filter Guard (Private Ranges & Cloud Metadata)     │
        └───────────────────────────────┬──────────────────────────────┘
                                        │
                ┌───────────────────────┴──────────────────────┐
                ▼                                              ▼
    ┌───────────────────────────┐                ┌───────────────────────────┐
    │ Public Auth Endpoints     │                │ Protected Endpoints       │
    │ /api/v1/auth/login        │                │ /api/v1/admin/*           │
    │ /api/v1/auth/fido2/*      │                │ /api/v1/inventory/*       │
    │ /api/v1/auth/public-mems  │                │ /api/v1/recipes/*         │
    └───────────┬───────────────┘                └─────────────┬─────────────┘
                │                                              │
                │ (CRITICAL: /simulate-auth bypass)            │ (CRITICAL: requireAdmin fallback)
                ▼                                              ▼
        ┌──────────────────────────────────────────────────────────────┐
        │ Session & Crypto Layer                                       │
        │ - Session Tokens: HMAC-SHA256 (Constant-time verification)   │
        │ - Database Store: SQLCipher 256-bit AES-GCM Encrypted Disk   │
        │ - NIST Password Policy: 15+ char entropy & common dictionary │
        └──────────────────────────────────────────────────────────────┘
```

---

## 2. Prioritized Vulnerability Findings (Vulnerability Register)

### Finding 1: Critical — Unauthenticated Fallback Grants Full Admin Access (CWE-287 / CWE-306)
- **Severity**: **CRITICAL (CVSS 9.8)**
- **Files**: `server/src/routes/admin.js` (lines 34–52, 68–84)
- **Vulnerability Mechanism**:
  In `requireAdmin` and `requireAuth`, if a request arrives with no `Authorization` or `x-auth-token` header, the code executes:
  ```javascript
  const defaultAdmin = dbStore.users.find((u) => u.role === "ADMIN") || dbStore.users[0];
  if (defaultAdmin && !req.headers["authorization"] && !req.headers["x-auth-token"]) {
    req.user = defaultAdmin;
    return next();
  }
  ```
  Additionally, any unauthenticated client sending an arbitrary `x-user-id` header or `{ "userId": "..." }` body parameter was automatically adopted as that user without cryptographic signature or token verification.
- **Exploitation Impact**: An anonymous internet user reaching `https://pantryo2.tail7f11fe.ts.net/api/v1/admin/users` or `/api/v1/admin/reset` without providing headers is instantly treated as the Administrator.
- **Remediation**:
  Completely excise lines 34–52 and 68–84. Enforce strict cryptographic validation via `getAuthenticatedUserFromRequest(req)` exclusively. If no valid session token exists, immediately return HTTP 401 Unauthorized.

---

### Finding 2: Critical — Virtual FIDO2 Simulation Auth Bypass Backdoor (CWE-288 / CWE-306)
- **Severity**: **CRITICAL (CVSS 9.8)**
- **Files**: `server/src/routes/authFido2.js` (lines 324–361)
- **Vulnerability Mechanism**:
  The `/api/v1/auth/fido2/simulate-auth` endpoint checks only if `req.headers["x-pwa-standalone"] === "true"`. If that header is omitted, the caller can specify `{ "userId": "<any-user-id>" }` and the server responds with a signed session token for that user without validating any password, credential, or WebAuthn signature.
- **Exploitation Impact**: Any attacker can forge an authentication token for any household member or administrator in a single HTTP request.
- **Remediation**:
  Disable `/simulate-auth` and `/simulate-enroll` in production mode (`NODE_ENV === "production"`), or require an active authenticated Admin session to invoke any simulation utilities.

---

### Finding 3: High — User & Email Enumeration on Public Endpoints (CWE-200)
- **Severity**: **HIGH (CVSS 7.5)**
- **Files**: `server/src/routes/admin.js` (line 112, `/api/v1/auth/public-members`)
- **Vulnerability Mechanism**:
  The unauthenticated `/public-members` endpoint returns the `email` field for all household accounts, allowing external scanners to harvest usernames and email addresses.
- **Remediation**:
  Remove `email` from the returned JSON payload. Only expose `id`, `name`, `avatarUrl`, and 2FA capability flags required by the front-end login avatar selector.

---

### Finding 4: High — Session Token Leakage via URL Query Parameters (CWE-598)
- **Severity**: **HIGH (CVSS 7.1)**
- **Files**: `server/src/services/sessionTokenService.js` (lines 127–129)
- **Vulnerability Mechanism**:
  `getAuthenticatedUserFromRequest` checks `req.query.token`. When session tokens are transmitted in URLs, they are retained in browser histories, web server logs, reverse proxy logs (Tailscale, Cloudflare), and outbound `Referer` headers.
- **Remediation**:
  Remove query string token inspection for standard API routes; mandate `Authorization: Bearer <token>` or HTTP-only cookie headers.

---

### Finding 5: Medium — Hardcoded Fallback Master Encryption Key (CWE-798)
- **Severity**: **MEDIUM (CVSS 5.9)**
- **Files**: `server/src/services/dbStore.js` (line 57)
- **Vulnerability Mechanism**:
  If `DB_ENCRYPTION_KEY` is missing and `MASTER_KEY_FILE` cannot be read, `getActiveServerKey()` returns a hardcoded static string (`"pantryo-master-secret-key-2026-aes256gcm-secure"`).
- **Remediation**:
  Generate an ephemeral cryptographically secure 256-bit key at runtime if both are missing, log an audit alert, and write it to `MASTER_KEY_FILE` with `mode: 0o600`. Never fallback to a static string.

---

### Finding 6: Medium — Password Modification Without Current Password Challenge (CWE-620)
- **Severity**: **MEDIUM (CVSS 5.4)**
- **Files**: `server/src/routes/admin.js` (lines 950–990)
- **Vulnerability Mechanism**:
  Endpoints updating user passwords do not require the user to verify their current password, allowing account takeover if a session is left unattended.
- **Remediation**:
  Require `currentPassword` verification for non-admin self-service password updates.

---

## 3. Container & Operating System Hardening Audit

| Component | Audit Check | Current State | Recommendation |
| :--- | :--- | :--- | :--- |
| **LXC User Privilege** | Unprivileged container (`unprivileged 1`) | ✅ Verified | Container UID/GID 0 is mapped to unprivileged host subuid/subgid range. |
| **Process User** | Dedicated system service user | ✅ Verified | Runs under unprivileged user `pantryo` (`/usr/sbin/nologin`). |
| **Systemd Directives** | NIST/CIS hardening directives | ✅ Verified | `NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=full`, `ProtectKernelTunables=true`. |
| **File Permissions** | Secrets and Database isolation | ✅ Verified | `.env` is `chmod 600`, `server/data` is `chmod 700`, owned by `pantryo:pantryo`. |
| **TUN Device Passthrough** | LXC network isolation | ✅ Hardened | Configured specifically for `/dev/net/tun` with explicit cgroup allowances (`c 10:200 rwm`). |
| **Automated Updates** | OS and dependency vulnerability patching | ✅ Verified | Daily cron configured with `unattended-upgrades` in `/etc/cron.daily/`. |

---

## 4. Implementation & Patching Plan

### Phase 1: Authentication & Access Control Patches
1. **Patch `server/src/routes/admin.js`**:
   - Strip fallback admin/user logic from `requireAdmin` and `requireAuth`.
   - Strip `email` from `GET /api/v1/auth/public-members`.
   - Require `currentPassword` in user profile password updates.
2. **Patch `server/src/routes/authFido2.js`**:
   - Restrict `/simulate-auth` and `/simulate-enroll` to require active Admin authentication or disable entirely when `NODE_ENV === "production"`.
3. **Patch `server/src/services/sessionTokenService.js`**:
   - Disallow session token extraction from `req.query.token` to prevent query string leakage.
4. **Patch `server/src/services/dbStore.js`**:
   - Remove hardcoded static key fallback; dynamically generate and persist 256-bit key if missing.

### Phase 2: Verification & Test Validation
1. Verify API rejects unauthenticated requests to `/api/v1/admin/*` with HTTP 401.
2. Verify `/api/v1/auth/fido2/simulate-auth` cannot be abused to issue tokens in production.
3. Verify `/api/v1/auth/public-members` no longer returns user email addresses.
4. Run `compile_applet` to confirm clean compilation and zero regressions.
