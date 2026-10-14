# Implementation Plan: Google Material 3 (Material You) Complete Application Overhaul

Transform Pantryo into a modern, tactile, and cohesive Google Material 3 (Material You / M3) application following the official guidelines at [m3.material.io](https://m3.material.io/).

---

## 1. User Design Directives & Core Choices
Based on user clarification:
- **Tonal Color Palette**: Culinary Green & Sage tonal system (`Primary: #2E6A4F`, `Secondary: #4D6357`, `Tertiary: #3E6374`, with complete tonal steps from 10 to 99).
- **Surface Geometry & Elevation**: M3 Tonal Surface Containers (Lowest, Low, Container, High, Highest) combined with gentle outline borders (`outline-variant`) rather than harsh artificial shadows.
- **Navigation & Actions**: M3 Navigation Bar with pill active indicators (`rounded-full` tonal capsule for active destination) and prominent M3 Extended FAB for quick scanning/adding actions.
- **Typography & Iconography**: Google Roboto typography paired with Google Material Symbols Rounded for authentic Material Design tactile polish.

---

## 2. Material 3 Design Foundations & Tokens

### A. Color System (Culinary Green & Sage M3 Scheme)
We will define CSS custom properties in `src/index.css` following the M3 role taxonomy:

| M3 Token | Hex Code | Role Description |
| :--- | :--- | :--- |
| `--md-sys-color-primary` | `#236A4E` | High-emphasis actions, active states, key FABs |
| `--md-sys-color-on-primary` | `#FFFFFF` | Text/icons on primary fill |
| `--md-sys-color-primary-container` | `#B0F1CD` | Filled active containers, navigation pill indicators |
| `--md-sys-color-on-primary-container` | `#002114` | High-contrast label on primary container |
| `--md-sys-color-secondary` | `#4E6356` | Secondary actions, filters, metadata accents |
| `--md-sys-color-on-secondary` | `#FFFFFF` | Text/icons on secondary fill |
| `--md-sys-color-secondary-container` | `#D1E8D7` | Tonal pill badges, segment backgrounds |
| `--md-sys-color-on-secondary-container` | `#0C1F15` | Text on secondary container |
| `--md-sys-color-tertiary` | `#3B6471` | Warm accent (zero-waste highlights, timers) |
| `--md-sys-color-tertiary-container` | `#BFE9F8` | Warm highlight containers |
| `--md-sys-color-surface` | `#F6FAF4` | Canvas base surface |
| `--md-sys-color-surface-dim` | `#D6DBD4` | Dimmed baseline |
| `--md-sys-color-surface-bright` | `#F6FAF4` | Elevated baseline |
| `--md-sys-color-surface-container-lowest` | `#FFFFFF` | Inset cards, input fields |
| `--md-sys-color-surface-container-low` | `#F0F5EE` | Standard list items, resting cards |
| `--md-sys-color-surface-container` | `#EAEFE8` | Card groups, sheet backgrounds |
| `--md-sys-color-surface-container-high` | `#E4E9E2` | Header bars, top app bar, elevated cards |
| `--md-sys-color-surface-container-highest` | `#DFE4DC` | Modal dialogs, popup menus |
| `--md-sys-color-outline` | `#707973` | Standard borders and divider lines |
| `--md-sys-color-outline-variant` | `#BFC9C1` | Gentle structural outlines |
| `--md-sys-color-error` | `#BA1A1A` | Expiration alerts, destructive actions |
| `--md-sys-color-error-container` | `#FFDAD6` | Expiry warning container |

### B. M3 Typography Scale (Roboto)
Add Google Font Roboto (400, 500, 700) and Material Symbols Rounded into `index.html`:
- **Display**: Large 57px, Medium 45px, Small 36px
- **Headline**: Large 32px, Medium 28px, Small 24px
- **Title**: Large 22px, Medium 16px, Small 14px
- **Body**: Large 16px, Medium 14px, Small 12px
- **Label**: Large 14px, Medium 12px, Small 11px (Buttons, navigation captions, chip labels)

### C. M3 Shapes & Corner Radii
- **Full**: `rounded-full` (M3 Navigation pills, Filter chips, Avatar, Circular buttons)
- **Extra Large**: `rounded-[28px]` (Dialogs, Modal sheets, Large Cards)
- **Large**: `rounded-[16px]` (Standard cards, FABs, Content panels)
- **Medium**: `rounded-[12px]` (Buttons, Segmented controls, Menus)
- **Small**: `rounded-[8px]` (Input fields, Inset badges)

---

## 3. Component Architecture & System Overhaul

### Step 1: Base Styles, Fonts & Tailwind Tokens
- Update `index.html` to load Roboto and Material Symbols Rounded with `display=swap`.
- Update `src/index.css` with CSS custom properties for all M3 color roles, typography utility classes, and tonal surface helper classes.
- Ensure dark mode and light mode both support the M3 tonal values cleanly.

### Step 2: Main Layout Shell & M3 Navigation Bar (`src/components/MobileSimulator.tsx`)
- **M3 Top App Bar**:
  - Restructure the top bar into an M3 Small/Medium Top App Bar (`h-16`, tonal container background `bg-[var(--md-sys-color-surface-container-high)]`, centered or left-aligned title with M3 Title Large font).
  - Clean account avatar icon and search trigger.
- **M3 Bottom Navigation Bar**:
  - Replace current nav bar with authentic M3 Navigation Bar: 80px container height, 5 destinations (Kitchen, Scanner, Recipes, Meal Plan, Grocery).
  - Active destination features an M3 pill indicator (`w-16 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center`).
  - Smooth label transition below with Label Medium typography.
- **M3 Extended Floating Action Button (FAB)**:
  - Add floating contextual Extended FAB (`h-14 px-5 rounded-[16px] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm hover:shadow-md active:scale-95 flex items-center gap-3 font-medium`) for primary screen actions (e.g. quick receipt scan / add item).

### Step 3: Inventory & Food Tracking View (`src/components/InventoryListItem.tsx`)
- **M3 Filter Chips**:
  - Convert compartment selectors (Fridge, Freezer, Pantry, Spice Rack) to M3 Filter Chips with optional leading icons, checked state checkmarks, and tonal pill outlines.
- **M3 Outlined/Elevated Cards**:
  - Food item rows styled as M3 Surface Container Low cards (`rounded-[16px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]`).
  - Expiration progress presented as clean M3 linear progress indicator (`h-2 rounded-full bg-surface-container-highest overflow-hidden`).
  - Quantity controls redesigned with M3 tonal rounded action buttons.

### Step 4: Recipe Discovery & Customization (`src/components/CookingIdeasView.tsx` & `src/components/AddRecipeModal.tsx`)
- **M3 Recipe Cards**:
  - Visual cards with 16px corner radii, surface container background, and tonal metadata labels.
  - Video and source chips replaced with unboxed M3 typographic kickers.
- **M3 Add/Edit Recipe Dialog**:
  - Full-screen modal refactored to M3 Full-Screen Dialog with M3 Top App Bar (`X` on leading edge, action button on trailing edge).
  - Source tabs styled as M3 Segmented Buttons with clean pill selection.
  - Ingredient and instruction list items styled with M3 input fields and drag/reorder handles.

### Step 5: Meal Planning & Grocery List (`src/components/MealPlannerView.tsx` & `src/components/GroceryListView.tsx`)
- **Calendar & Week Selector**:
  - Days of the week styled with M3 Date Picker day tokens (circular active selection pill).
- **Grocery Checklist**:
  - M3 Checkboxes (rounded-sm square with primary fill on checked).
  - Strike-through text and quick compartment grouping using M3 Subhead typography.

---

## 4. Verification & Testing Plan

### Build & Lint
- Run `npm run lint` and `npm run build` to guarantee zero syntax or TypeScript regressions.
- Verify that responsive viewport behavior holds across both mobile ($375\text{px}$–$430\text{px}$) and wide desktop displays without breaking layout.

### Visual & Interactive Review
- **Navigation Bar**: Test clicking between Kitchen, Scanner, Recipes, Meal Plan, and Grocery; confirm pill active animation and smooth switching.
- **FAB**: Confirm Extended FAB and standard FAB triggers open appropriate scanner or modal sheets.
- **Color Contrast**: Verify all text against tonal backgrounds meets WCAG AA standards (4.5:1 text contrast).
- **Touch Targets**: Confirm all interactive items maintain minimum $44 \times 44\text{px}$ touch targets.
