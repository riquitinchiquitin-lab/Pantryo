# Global Language Switcher & iOS Mobile Zoom Prevention

Integrate an omnipresent EN/FR language toggle directly into the top navigation header on all screens, auto-detect device language on initial launch with persistent local storage, and eliminate iOS Safari auto-zooming issues by enforcing the 16px input font threshold and locking mobile viewport scaling.

## User Review & Critical Decisions

> [!IMPORTANT]
> All key product and architectural decisions have been clarified and confirmed:

- **Confirmed Decision 1 (Language Switcher Location)**: Placed in the top navigation header bar across all screens (both mobile viewports and desktop), making language switching accessible with 1 tap at all times.
- **Confirmed Decision 2 (iOS Zoom Prevention Approach)**: Fix input focus auto-zoom by enforcing a 16px font-size minimum on mobile touch inputs, set `-webkit-text-size-adjust: 100%`, and lock the mobile viewport scale (`maximum-scale=1.0, user-scalable=no, viewport-fit=cover`).
- **Confirmed Decision 3 (Default Language Detection)**: Auto-detect the browser/system language (`navigator.language`) on first launch (defaulting to French if French locale, otherwise English), and persist explicit user toggles across sessions in `localStorage`.

---

## 1. Overview & Core Concept

- **What It Does**: 
  1. Adds a visible, tactile **EN / FR** toggle button in the primary top app header across all views (Inventory, Meals, Grocery, Recipes, Family, and Modals).
  2. Resolves the long-standing iOS Safari issue where opening the app or tapping input fields causes Safari to uncontrollably zoom in and distort layout boundaries.
  3. Intelligently respects the user's phone locale on their very first visit while remembering any manual switch between French and English.
- **Target Audience**: Bilingual household members and mobile homelab users accessing Pantryo on iPhones, iPads, and touch devices.
- **Key Value**: Fluid bilingual usability with no hunting through sub-menus, and a rock-solid native app feel on iOS Safari and Home Screen PWAs with zero unwanted zoom or viewport drift.

---

## 2. User Experience & Visual Design

### Top Navigation Bar & Language Switcher
- **Header Placement**: Positioned in Zone 3 (Right Action Bar) of the top app bar in `MobileSimulator.tsx`, adjacent to the Quick Add and Camera Scanner buttons.
- **Styling & Touch Ergonomics**:
  - Compact segmented pill design conforming to Material 3 tokens.
  - Active locale (e.g., `FR` or `EN`) highlighted in high-contrast emerald (`bg-teal-700 text-white shadow-xs font-bold`) with subtle flag emoji indicators (`🇫🇷 FR` / `🇬🇧 EN`).
  - Inactive locale styled in muted teal-slate (`text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]/60`).
  - Tap target meets mobile accessibility standards ($\ge 44\text{px}$ touch hitbox).
  - Instant reactive translation across all active tabs, item cards, recipe lists, and modal titles without page reloads.

### iOS Viewport & Touch Ergonomic Optimization
- **Scale Stabilization**:
  - `index.html` viewport updated to: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
  - Disables iOS Safari double-tap gesture zooming and elastic viewport expansion while keeping smooth scrolling.
- **Input Font Threshold**:
  - CSS rule applied to all `<input>`, `<select>`, and `<textarea>` elements on screens $\le 820\text{px}$ guaranteeing `font-size: 16px !important`.
  - Prevents WebKit's automatic text magnification trigger on focus.
- **Text Size Adjust**:
  - Enforced `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` on `html` and `body` to prevent iOS orientation change scaling bugs.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Viewport Lock vs Pinch Zoom**
  - *Chosen Approach*: Lock mobile viewport scale with `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
  - *Why*: Pantryo is designed as a standalone touch PWA with its own responsive typography, bento grid layout, and bottom sheet dialogs. Uncontrolled pinch zooming breaks the bottom navigation bar and creates horizontal scroll spill.
  - *Alternatives Considered*: Allowing pinch zoom was rejected because iOS Safari frequently misinterprets rapid double-taps on item cards as zoom gestures.

- **Decision 2: Header-Level Language Switcher vs Settings Menu**
  - *Chosen Approach*: Direct header integration with compact footprint.
  - *Why*: Users frequently cook recipes or check groceries in either language or share devices between household members; burying language options inside deep modal menus causes friction.

- **Decision 3: Device Locale Detection with LocalStorage Precedence**
  - *Chosen Approach*: Check `localStorage` first; if empty, inspect `navigator.language` (if starts with `fr`, choose `FR`, otherwise `EN`); persist any user click immediately.
  - *Why*: Gives new visitors a seamless zero-configuration experience in their native language while never overwriting an explicit preference.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                       │
│  ┌───────────────┐     ┌────────────────┐    ┌────────────────┐ │
│  │ Pantryo Logo  │     │ Main Nav Links │    │ [FR | EN] 📷 + │ │
│  └───────────────┘     └────────────────┘    └───────┬────────┘ │
└──────────────────────────────────────────────────────┼──────────┘
                                                       │
                                        useLanguage() Context
                                                       │
                      ┌────────────────────────────────┴────────────────────────────────┐
                      ▼                                                                 ▼
         ┌─────────────────────────┐                                       ┌─────────────────────────┐
         │     localStorage        │                                       │   navigator.language    │
         │ ('pantryo_language_pref')│                                      │    (Fallback initial)   │
         └─────────────────────────┘                                       └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  iOS Safari Zoom Suppression Layer              │
│                                                                 │
│  • index.html: <meta name="viewport" content="...max-scale=1"> │
│  • index.css: -webkit-text-size-adjust: 100%                   │
│  • index.css: @media (max-width: 820px) { input: 16px }        │
└─────────────────────────────────────────────────────────────────┘
```

### Component & File Mapping:
1. `index.html`:
   - Update viewport meta tag for strict 1.0 scale lock and `viewport-fit=cover`.
2. `src/index.css`:
   - Add `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` to `html, body`.
   - Add responsive 16px input font-size guarantee for mobile/touch screens ($\le 820\text{px}$).
3. `src/utils/i18n.tsx`:
   - Enhance `LanguageProvider` initialization to inspect `navigator.language` on first visit.
   - Refine `LanguageSwitcher` to support compact header presentation (`compact={true}`).
4. `src/components/MobileSimulator.tsx`:
   - Add `LanguageSwitcher` directly to Zone 3 of the sticky top app header.
