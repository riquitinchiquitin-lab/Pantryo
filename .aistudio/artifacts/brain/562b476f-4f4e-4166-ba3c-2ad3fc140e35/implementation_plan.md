# In-App Feature Showcase & GitHub Self-Hosting Installation Hub

Build a comprehensive, publication-grade documentation suite for GitHub and an interactive in-app Feature Showcase & Self-Hosting Hub covering Proxmox VE, universal Linux distributions (Debian, Ubuntu, Fedora, Arch, Raspberry Pi), Cloudflare Zero Trust, and custom domains, with instant French/English language toggling.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been synthesized from your clarifying answers:
> - **Dual Accessibility**: Providing both a responsive, interactive in-app Feature Showcase & Installation Hub and complete, publication-ready GitHub markdown files (`README.md`, `INSTALLATION.md`, `FEATURES.md`) in the repository.
> - **Comprehensive Scope**: Covering the full stack—AI vision & recipe intelligence, grocery & meal planning, 256-bit AES SQLCipher & FIDO2 security, Proxmox VE LXC automation, Raspberry Pi ARM64/ARM32 optimization, and Cloudflare/Reverse-Proxy networking.
> - **Instant Bilingual Support**: Full French (FR) and English (EN) language parity with a persistent toggle across both the in-app view and documentation guides.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. **In-App Interactive Feature Showcase & Documentation Hub (`FeatureShowcaseModal.tsx`)**: A responsive, full-screen/modal documentation center directly accessible from the app's desktop header, mobile simulator drawer, and admin settings. Includes live copyable terminal commands, tabbed guides for Proxmox and Linux, and visual breakdowns of the 399-class produce vision model, meal planner, and security architecture.
  2. **GitHub Repository Documentation Suite**:
     - `README.md`: Modern repository landing page with visual badges, architectural diagrams, feature highlights, hardware matrix, quickstart commands, and environmental variable reference.
     - `INSTALLATION.md`: Exhaustive self-hosting runbook with step-by-step instructions for Proxmox VE 7/8 (unprivileged LXC container), Raspberry Pi OS / DietPi / Armbian (memory-swap tuning for 1GB/2GB SBCs), Docker Compose, Cloudflare Zero Trust tunnels, and Nginx/Caddy/NPM reverse proxies with Let's Encrypt SSL.
     - `FEATURES.md`: In-depth product specification and feature tour showcasing AI vision OCR, on-device MobileNetV2 produce recognition, FIDO2 biometric authentication, and SQLCipher at-rest encryption.
  3. **Desktop App Navigation Header (`App.tsx`)**: A top bar meeting the *Top Bar Contract* (Wordmark, single-line navigation links to "Features", "Install Guide", "Admin Console", and "GitHub Docs", plus a bilingual language toggle and install action).

- **Target Audience**: Homelab enthusiasts, self-hosters running Proxmox VE or Raspberry Pi, families seeking privacy-first kitchen inventory management, and open-source contributors reviewing the repository on GitHub.
- **Key Value**: Bridges the gap between complex self-hosted server deployment and everyday kitchen utility by giving users immediate, clear instructions and copy-paste commands without leaving the application.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Discovering Capabilities**: A visitor or homelab administrator clicks **"Fonctionnalités & Guide" / "Features & Docs"** in the top navigation or from the household sync view. The interactive showcase opens with a clean segmented navigation bar:
   - `✨ Présentation & Fonctionnalités (Features Showcase)`
   - `📦 Proxmox VE LXC (Proxmox Guide)`
   - `🍓 Raspberry Pi & Linux (Linux & SBC Guide)`
   - `🌐 Cloudflare & Domaine (Domain & Networking)`
   - `🛡️ Sécurité & Chiffrement (Security & SQLCipher)`
2. **Executing 1-Click Proxmox Deployment**: The user navigates to the Proxmox tab, reviews the hardware requirements (512MB RAM, 4GB disk), copies the 1-line script (`curl -fsSL https://.../install-proxmox.sh | bash`), pastes it into their PVE node shell, and watches their unprivileged Debian 12 LXC container provision automatically.
3. **Deploying on a Raspberry Pi**: A user with a Raspberry Pi 4 or Zero 2W views the Linux tab, copies `curl -fsSL https://.../install.sh | sudo bash`, and benefits from automatic 1GB swap configuration, Node.js 22 LTS installation, and systemd service creation.
4. **Exporting Documentation for GitHub**: Users or developers can download or inspect the formatted markdown documents directly from the app or read them in the root repository.

### Visual Identity & Theme
- **Aesthetic Direction**: Clean utilitarian homelab editorial aesthetic matching Pantryo’s natural culinary theme: warm parchment canvas (`#FAF7EE`), deep forest teal accents (`#0D3B37`, `#0E766E`), crisp white content cards with hairline borders (`#E0D9C8`), and dark slate terminal blocks (`#0F172A`).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans`, tight tracking, balanced headline wrapping (`text-wrap: balance`).
  - Body Text: High-legibility sans-serif with 1.6 line height and comfortable measure (65–75ch).
  - Code & Commands: Monospace font (`JetBrains Mono`, `IBM Plex Mono`) with syntax-highlighted tokens and clean copy triggers.
- **Anti-Slop Discipline**:
  - No fake version tags or code-comment prefixes (`// 01 ARCHITECTURE`).
  - No pill-badge sandwiches on feature cards; clean inline typographic metadata (`ARM64 · 120MB RAM · SQLite`).
  - No decorative pulsing dots or non-functional status widgets.
  - Exactly one dominant visual anchor per view.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Presentation (In-App Modal View + Root Markdown Files)**
  - *Chosen Approach*: Deliver both interactive React components in the web app and static GitHub-compliant markdown files in the workspace root.
  - *Why*: Users testing the web app inside an iframe or browser need immediate, interactive access to copy commands and test endpoints. Meanwhile, developers cloning the repository expect standard, rich `README.md` and `INSTALLATION.md` files formatted with GitHub Flavored Markdown (GFM).
  - *Alternatives Considered*: Markdown-only was rejected because in-browser users would have to dig through raw files; in-app only was rejected because GitHub visitors need a proper repository landing page.

- **Decision 2: Universal Distro & Hardware Coverage**
  - *Chosen Approach*: Explicitly document and support Proxmox VE 7/8, Raspberry Pi OS, Debian 11/12, Ubuntu 22.04/24.04, Armbian, DietPi, Fedora/RHEL, Arch Linux, Alpine Linux, and Docker Compose.
  - *Why*: Self-hosters have varied environments; providing validated scripts for each prevents deployment failures.

- **Decision 3: Integrated Terminal Snippet Runners with Dynamic Origin**
  - *Chosen Approach*: The in-app documentation automatically substitutes the current `window.location.origin` (or public domain) into curl commands so users can copy ready-to-run commands customized for their exact host.
  - *Why*: Eliminates user confusion over `<YOUR_IP_HERE>` placeholders.

---

## 4. Technical Architecture & Data Strategy

### System & Documentation Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Pantryo Application                             │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Desktop Top Bar             │       Mobile Simulator              │
│  [Logo] [Features] [Install Hub] │  [Inventory] [Meals] [Family Sync]  │
│  [Admin Console] [Language]      │       ↳ Quick Link: "Guide & Docs"  │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│           Interactive In-App Documentation & Feature Showcase          │
│                    (src/components/DocumentationModal.tsx)             │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ ✨ Features Tour│ 📦 Proxmox VE    │ 🍓 Linux / RPi  │ 🌐 Cloudflare & │
│ - 399 Produce   │ - Unprivileged   │ - Auto-Swap 1GB │   Custom Domain │
│ - AI Receipt    │   Debian 12 LXC  │ - Node 22 LTS   │ - Zero Trust CF │
│ - Meal Planner  │ - 1-Line Curl    │ - systemd       │ - Caddy / Nginx │
│ - SQLCipher AES │ - 512MB RAM      │ - ARM64 / ARM32 │ - Traefik / NPM │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 GitHub Markdown Documentation Suite                    │
├──────────────────────────────────┬─────────────────────────────────────┤
│  README.md                       │  INSTALLATION.md                    │
│  - Badges, Architecture, Demo    │  - Proxmox VE LXC Walkthrough       │
│  - Quickstart in 60 seconds      │  - Raspberry Pi OS & Linux Guide    │
│  - Hardware Matrix & .env Spec   │  - Cloudflare & Reverse Proxy Setup │
├──────────────────────────────────┼─────────────────────────────────────┤
│  FEATURES.md                     │  Server Static Serving              │
│  - AI Vision, Produce & OCR      │  - GET /install.sh                  │
│  - SQLCipher 256-bit Security    │  - GET /install-proxmox.sh          │
│  - FIDO2 & Mobile Sync           │  - GET /README.md                   │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Component & File Mapping

1. `src/components/DocumentationModal.tsx`:
   - Interactive tabbed documentation component.
   - Tabs: Overview & Features, Proxmox VE LXC, Raspberry Pi & Linux, Cloudflare & Reverse Proxy, Security & Backup.
   - Dynamic command generator with 1-click clipboard copy (`navigator.clipboard.writeText`).
   - Full bilingual support (FR / EN) reacting to `useLanguage()`.
2. `src/App.tsx`:
   - Add clean Top Bar with Brand Wordmark, direct links to Features & Documentation, Language selector, and Admin Console trigger.
3. `src/components/FamilySyncView.tsx` & `AdminManagementModal.tsx`:
   - Connect "View Full Install Guide" buttons directly to the documentation modal.
4. `README.md`:
   - High-impact repository readme with project overview, feature matrix, hardware requirements, screenshots, Docker quickstart, and Proxmox 1-liner.
5. `INSTALLATION.md`:
   - Comprehensive self-hosting runbook with Proxmox, Debian/Ubuntu, Raspberry Pi, Docker, Cloudflare, and SSL reverse proxies.
6. `FEATURES.md`:
   - Detailed technical breakdown of all client-side and server-side features.
7. `server.ts`:
   - Ensure `/install.sh`, `/install-proxmox.sh`, and documentation assets are served with proper headers.

---

## 5. Verification & Testing Checklist

- [ ] Validate syntax and TypeScript compliance via `lint_applet`.
- [ ] Verify production compilation via `compile_applet`.
- [ ] Test in-app documentation modal opening from desktop header, mobile sync view, and admin settings.
- [ ] Test clipboard copy functionality across all command snippets.
- [ ] Verify both French and English translations across all sections.
- [ ] Verify `README.md`, `INSTALLATION.md`, and `FEATURES.md` adhere to GitHub Flavored Markdown standards.
