# 🌟 Pantryo — Feature Specification & Technical Showcase
*Spécifications Détaillées des Fonctionnalités & Architecture Technique*

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![AI: MobileNetV2 + OCR](https://img.shields.io/badge/AI-On--Device%20Vision%20%2B%20OCR-orange.svg)](#1-on-device-ai-vision--produce-scanner)
[![Security: SQLCipher AES-256](https://img.shields.io/badge/Security-SQLCipher%20256--bit-emerald.svg)](#5-privacy-by-design--security-architecture)
[![Bilingual: French / English](https://img.shields.io/badge/Language-Bilingual%20FR%20%2F%20EN-purple.svg)](#7-bilingual-first-class-experience)

---

## 📑 Feature Map / Sommaire des Fonctionnalités

1. [On-Device AI Vision & Produce Scanner](#1-on-device-ai-vision--produce-scanner)
2. [Smart 4-Zone Inventory & Expiration Tracker](#2-smart-4-zone-inventory--expiration-tracker)
3. [Zero-Waste Culinary Engine & Meal Planner](#3-zero-waste-culinary-engine--meal-planner)
4. [Collaborative Household & Multi-Profile Sync](#4-collaborative-household--multi-profile-sync)
5. [Privacy-by-Design & Security Architecture](#5-privacy-by-design--security-architecture)
6. [Homelab & Single-Board Computer Optimizations](#6-homelab--single-board-computer-optimizations)
7. [Bilingual First-Class Experience (FR / EN)](#7-bilingual-first-class-experience)
8. [Progressive Web App (PWA) & Offline Mode](#8-progressive-web-app-pwa--offline-mode)
9. [Detailed Technical Specifications Table](#9-detailed-technical-specifications)

---

## 1. On-Device AI Vision & Produce Scanner

Pantryo replaces tedious manual typing with local visual intelligence:

### 🥦 399-Class Produce Classification (MobileNetV2)
- **Zero Cloud Latency**: A quantized MobileNetV2 neural network runs directly inside the client browser or local Node runtime.
- **Instant Recognition**: Point your phone camera or web camera at any whole fruit, vegetable, bakery item, or cheese to recognize it in under 80 milliseconds.
- **Pre-calibrated Shelf-Life**: Upon detection, Pantryo automatically suggests the optimal storage zone (e.g. *Avocados → Pantry until ripe, then Fridge*) and calculates default expiration windows.

### 🧾 Smart Receipt Optical Character Recognition (OCR)
- **Multi-Line Receipt Parser**: Upload or snap supermarket paper receipts. The OCR engine parses item names, weights, prices, and quantities.
- **Smart Category Mapping**: Parsed line items are automatically normalized (e.g., `ORG GALA APPL` becomes `Gala Apples`, categorized under `Produce`, assigned to `Fridge`).
- **Batch Inventory Import**: Add an entire week of groceries into your pantry in a single click.

---

## 2. Smart 4-Zone Inventory & Expiration Tracker

Organize your kitchen according to real-world culinary logistics:

```text
┌───────────────────────┬───────────────────────┐
│     🧊 FRIDGE         │     🥫 PANTRY         │
│  Dairy, Meats, Greens │  Dry Goods, Cans, Oils│
│  Avg Shelf: 3–14 days │  Avg Shelf: 30–365 d  │
├───────────────────────┼───────────────────────┤
│     ❄️ FREEZER        │     🌿 SPICE RACK     │
│  Batched Meals, Herbs │  Herbs, Salts, Spices │
│  Avg Shelf: 90–365 d  │  Avg Shelf: 180–720 d │
└───────────────────────┴───────────────────────┘
```

- **Visual Freshness Gauges**: Color-coded badges and circular progress rings instantly reveal items that are *Fresh* (green), *Expiring Soon* (amber, ≤3 days), or *Critical / Overdue* (rose).
- **FIFO (First In, First Out) Depletion**: When cooking or preparing meals, Pantryo automatically prompts you to use older batches first, preventing hidden spoilage at the back of the shelf.
- **Custom Spoilage Reminders**: Configurable push notices and visual alerts so you never discard unopened yogurt or forgotten spinach again.

---

## 3. Zero-Waste Culinary Engine & Meal Planner

Turn expiring groceries into delicious family meals:

- **Expiring-First Recipe Suggestions**: Pantryo scores recipe ideas by how many soon-to-expire ingredients they use up. A single recipe can rescue fresh cream, mushrooms, and leftover chicken at once.
- **Missing Ingredient Smart Shopping**: If a suggested recipe requires two missing spices or butter, tap a single button to dispatch them straight into the **Grocery List**.
- **Hands-Free Cooking Mode**: Full-screen, step-by-step cooking view with large typography, touch-friendly timers, and audio chimes, designed for kitchen counter tablets.

---

## 4. Collaborative Household & Multi-Profile Sync

Empower all members of the household without compromising individual preferences:

- **Shared Pantry State**: Every family member sees live inventory changes when items are checked off, consumed, or added.
- **Multi-User Profiles**: Each household member can have their own avatar, dietary tags (e.g. vegetarian, gluten-free, nut allergies), and permission tiers.
- **Admin & Member Roles**: Administrators control server settings, Cloudflare domains, backups, and user access; standard members enjoy full day-to-day inventory freedom.

---

## 5. Privacy-by-Design & Security Architecture

Your kitchen habits, dietary choices, and shopping receipts belong to you alone:

- **256-Bit AES SQLCipher Encryption**:
  - The SQLite database file (`pantryo.sqlite`) is encrypted at rest using industry-standard **AES-256-GCM**.
  - Without the server secret or passphrase, data dumps are unreadable pseudorandom bytes.
- **FIDO2 WebAuthn Passkeys**:
  - Eliminates vulnerable shared passwords.
  - Authenticate instantly using Apple Touch ID / Face ID, Windows Hello, Android Biometrics, or hardware YubiKeys.
- **Argon2id Key Derivation**: High-memory, time-tested key hashing protects all user authentication tokens against offline GPU brute-force attacks.
- **Zero Telemetry**: No third-party tracking scripts, analytics cookies, or phone-home beacons.

---

## 6. Homelab & Single-Board Computer Optimizations

Engineered specifically for self-hosters and home server enthusiasts:

- **Proxmox VE LXC Ready**: Automated 1-line script provisions an unprivileged Debian 12 container in under 30 seconds.
- **Raspberry Pi Memory Tuning**: Automatic 1 GB swap allocation on 1 GB / 512 MB devices (RPi 3B+, Zero 2W) avoids out-of-memory crashes while keeping footprint under 160 MB RAM.
- **Cloudflare Zero Trust Tunnel**: Expose your instance to your family securely over `https://pantry.yourdomain.com` without port forwarding or dynamic DNS gymnastics.
- **Reverse Proxy Compatibility**: Pre-configured configurations for Caddy, Nginx, Nginx Proxy Manager, and Traefik with HTTP/2 and WebSocket support.

---

## 7. Bilingual First-Class Experience (FR / EN)

Every aspect of Pantryo is fully translated and localized:

- **Instant Language Toggle**: Switch between French (`FR`) and English (`EN`) instantly with zero page reloads.
- **Bilingual Produce Catalog**: Database includes both French and English culinary terminology (`Courgettes` / `Zucchini`, `Aubergines` / `Eggplants`, `Crème fraîche` / `Heavy Cream`).
- **Bilingual Documentation**: All installation runbooks, terminal commands, and system notifications are provided with full French and English parity.

---

## 8. Progressive Web App (PWA) & Offline Mode

- **Add to Home Screen**: Install Pantryo as a native-like standalone app on iOS (Safari Share > Add to Home Screen) and Android (Chrome Install).
- **Offline Grocery Shopping**: Service Worker caches your current inventory and grocery list locally. Check items off inside grocery store basements with zero cellular connectivity; changes sync back as soon as you reconnect.
- **Fast Startup**: Optimized asset bundle loads in under 300 milliseconds on local Wi-Fi.

---

## 9. Detailed Technical Specifications

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | 19.x | Component-driven reactive user interface |
| **Styling & Theme** | Tailwind CSS v4 | 4.x | Utilitarian homelab editorial design system |
| **Server Engine** | Node.js + Express | 22.x LTS | REST API, static files, and PWA service worker delivery |
| **Database** | SQLite + SQLCipher | 3.4x | Local-first, 256-bit AES encrypted at-rest storage |
| **Vision Classification**| MobileNetV2 | ONNX / TFJS | 399 produce classes client-side neural inference |
| **Biometric Auth** | FIDO2 / WebAuthn | W3C Standard | Passkeys via Touch ID, Face ID, Windows Hello & YubiKey |
| **Key Derivation** | Argon2id | RFC 9106 | Password hashing & session token authentication |
| **PWA Engine** | Service Worker + CacheStorage | W3C Standard | Offline pantry lookups & grocery checklist storage |
| **Packaging & CI** | Docker, Bash, Systemd | Multi-Arch | Proxmox LXC, Raspberry Pi, Ubuntu, Debian, Docker |

---

*Pantryo — Engineered for privacy, sustainability, and delicious meals.*
