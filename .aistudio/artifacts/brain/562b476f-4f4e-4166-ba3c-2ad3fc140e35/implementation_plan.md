# Recipe Cards Culinary Redesign

Redesign the recipe cards in the Recipes & Cooking tab from cramped single-line rows into spacious, appetizing two-row cards featuring expanded food imagery, readable full titles, clean unboxed pantry-match indicators, and an ergonomic bottom action bar.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification:
> - **Card Architecture**: Two-row layout with larger food photo and bottom action bar.
> - **Inventory Stock Display**: Clean unboxed stock match text with colored status indicator dot (`· ● 85% in stock`).

- **Confirmed Decision 1**: Transition from the cramped 1-row table layout (where 4 action buttons forced titles into "Sheet-Pa...") to a structured 2-row card layout.
- **Confirmed Decision 2**: Replace nested candy pills ("Ricardo" pink capsule, "0% in stock" light blue pill, "70°C" pill) with clean typography adhering to the Zero-Pill design guidelines.
- **Recommended Default**: Retain one-tap access to all 4 key actions (Bookmark, Plan Meal, Cook/Resume, and Details expand) across the bottom bar with touch targets $\ge 40\text{px}$.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the visual presentation of recipes across the catalog. Each recipe displays an appetizing, high-resolution thumbnail, an unclipped recipe title, quick culinary metadata (prep time, servings, food safety internal cooking temp), live kitchen stock status, and a full-width bottom action bar.
- **Target Audience / Persona**: Home cooks navigating on smartphones or tablets who need to quickly browse recipes, verify what they can make with ingredients on hand, and plan or cook meals with one-handed thumb taps.
- **Key Value**: Eliminates title truncation and button clustering on narrow screens; elevates visual appeal with generous food photography and clear information hierarchy.

---

## 2. User Experience & Visual Design

### Component Architecture & Spatial Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ┌────────────┐   Ricardo · ● 75% in stock                             │
│  │            │   Sheet-Pan Salmon with Asparagus                      │
│  │   PHOTO    │   25 mins · 4 servings · 70°C Safe Temp                │
│  │   76x76    │                                                        │
│  └────────────┘                                                        │
│ ────────────────────────────────────────────────────────────────────── │
│  [🔖 Save]         [📅 + Plan Meal]         [🍳 Cook]       [Details ▾]│
└────────────────────────────────────────────────────────────────────────┘
```

- **Top Section (Content)**:
  - **Thumbnail**: 76×76px (`sm:w-20 sm:h-20`), `rounded-2xl` with soft border and curated photo fallback.
  - **Source & Availability Kicker**: Quiet, unboxed text display: e.g. `Ricardo · ● 80% in kitchen` or `Jamie Oliver · ● All in stock` with color-coded dot indicator (emerald for $\ge 70\%$, amber for $\ge 40\%$, slate for $< 40\%$).
  - **Recipe Title**: Prominent bold typography (`text-sm sm:text-base font-bold text-[#0D3B37]`), using `line-clamp-2` so titles never truncate to 8 characters.
  - **Metadata Strip**: Natural inline text (`Clock` 25 mins `·` `Users` 4 servings `·` `Thermometer` 70°C).
- **Hairline Divider**: Subtle separator line (`border-t border-[var(--md-sys-color-outline-variant)]/60`) providing clear structural rhythm.
- **Bottom Section (Thumb-Friendly Action Bar)**:
  - **Bookmark Trigger**: Tap to save in My Recipes with filled amber indicator when active.
  - **+ Plan Meal Button**: Soft teal pill button to schedule directly to the meal planner calendar.
  - **Cook / Resume Button**: Dominant forest green CTA (`#004D36`) with utensils icon, switching seamlessly to active cooking resume when an in-progress session exists.
  - **Details Disclosure**: Clean chevron toggle to expand ingredients checklist, step-by-step directions, and YouTube embed.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Two-Row Card vs. Hero Header Card**
  - *Chosen Approach*: Two-row card with thumbnail on the left and actions across the bottom.
  - *Why*: Allows rapid vertical scanning of 14+ recipes in list view without occupying excessive vertical scroll height, while giving titles 100% of horizontal text width.
  - *Alternatives Considered*: Full-width hero photo on top takes ~220px per card, showing only 1.5 cards on mobile screens.
- **Decision 2: Stock Match Indication**
  - *Chosen Approach*: Clean colored status indicator with text (`● 80% in stock`) rather than heavy pill capsules.
  - *Why*: Adheres strictly to Zero-Pill metadata guidelines and eliminates visual clutter.

---

## 4. Technical Implementation & Verification Plan

### Technical Strategy
- Update the minimized recipe card render block in `src/components/CookingIdeasView.tsx`.
- Ensure all event handlers (`handleToggleSaveRecipe`, `handleOpenPlanMeal`, `handleLaunchCooking`, `resumeCooking`, `setExpandedRecipeId`) remain fully functional and stop event propagation where appropriate.
- Maintain responsive behavior across mobile viewports (360px–430px) and desktop layouts.
- Verify full internationalization support for French (`FR`) and English (`EN`).

### Verification Steps
1. Run `compile_applet` to confirm successful Vite bundling.
2. Run `lint_applet` (`tsc --noEmit`) to ensure zero TypeScript errors.
3. Verify responsive layout rendering without horizontal scroll or truncated titles.
