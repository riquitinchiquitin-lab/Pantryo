# Categorized & Alphabetical Grocery List with Responsive Add Bar

Organize the grocery shopping list into supermarket aisle categories with items sorted alphabetically, and fix the layout and alignment of the Quick Add form so the Add button and quantity inputs fit within mobile card boundaries.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification:
> - **Category Ordering**: Supermarket aisle progression (Produce, Dairy & Eggs, Meat & Seafood, Bakery, Pantry & Dry Goods, Frozen, Spices & Seasonings, Beverages, Snacks & Sweets, Household & Other).
> - **Checked Items Display**: Kept within their respective category section with strikethrough styling.

- **Confirmed Decision 1**: Group grocery items under clean category section headers (featuring domain icons and item count badges) rather than a flat unstructured list.
- **Confirmed Decision 2**: Sort items alphabetically ($A \to Z$) within each category using case-insensitive locale comparison (`localeCompare`), prioritizing active unchecked items first followed by completed items.
- **Confirmed Decision 3**: Fix the Add form row clipping by applying `min-w-0` to the item name input, optimizing quantity/unit widths, and ensuring the `+` button aligns with container padding.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the grocery shopping list into an aisle-organized shopping companion. Items automatically group into recognizable grocery store aisles (such as Produce, Dairy, Meat, Bakery, and Pantry) and sort alphabetically.
- **Target Audience / Persona**: Household shoppers using mobile devices in physical grocery stores who need to navigate aisles efficiently without backtracking or searching through a mixed list.
- **Key Value**: Streamlines physical shopping trips by mirroring store aisle flow, ensures easy item scanning via alphabetical order, and fixes mobile input overflow.

---

## 2. User Experience & Visual Design

### Categorized Section Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [ Add item to list...     ] [ 1 ] [ pcs ] [ + ]            │  <-- Perfectly aligned within card
└─────────────────────────────────────────────────────────────┘

  🥕 PRODUCE (2)
┌─────────────────────────────────────────────────────────────┐
│  [ ]  🍎  Apples                  3 pcs                [🗑️] │
│  [ ]  🥔  Potatoes                1 unit               [🗑️] │
└─────────────────────────────────────────────────────────────┘

  🥛 DAIRY & EGGS (1)
┌─────────────────────────────────────────────────────────────┐
│  [✓]  🧀  Cheddar Cheese          200 g                [🗑️] │
└─────────────────────────────────────────────────────────────┘
```

- **Category Header**:
  - Clean unboxed header with category icon, title in localized language (EN / FR), and count badge (e.g. `Produce · 2 items`).
  - Progress indicator per category if all items in that aisle are checked.
- **Item Ordering**:
  - Sorted alphabetically ($A \to Z$) by displayed name in current active language.
  - Active items appear first, followed by checked items with muted strikethrough styling.
- **Quick Add Bar Fix**:
  - Enclosed in `rounded-2xl bg-white border border-[#E5DFD0] p-2 sm:p-2.5 shadow-2xs`.
  - Item name input: `flex-1 min-w-0` with `text-xs rounded-xl`.
  - Quantity input: `w-12 text-center text-xs font-bold`.
  - Unit input: `w-13 text-center text-xs`.
  - Add button: `h-9 w-9 sm:w-auto sm:px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs`.
  - All elements remain within container boundaries on screens from 340px to 1440px.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Category Aisle Progression vs. Flat Alphabetical**
  - *Chosen Approach*: Supermarket aisle order (Produce $\to$ Dairy $\to$ Meat $\to$ Bakery $\to$ Pantry $\to$ Frozen $\to$ Spices $\to$ Beverages $\to$ Snacks $\to$ Other), with alphabetical sorting inside each aisle.
  - *Why*: Directly aligns with user choice and mirrors real-world shopping psychology so users don't jump back and forth across physical store aisles.
- **Decision 2: Checked Items Placement**
  - *Chosen Approach*: Kept within category group with subtle opacity and line-through.
  - *Why*: Allows the shopper to see at a glance what they have completed in that specific aisle before walking to the next.

---

## 4. Technical Implementation & Verification Plan

### Technical Strategy
- In `src/components/GroceryListView.tsx`:
  - Build helper `categorizeGroceryItem(item: GroceryCartItem): CategoryId` using `item.category`, `item.name`, and `ALL_FOOD_CATEGORIES`.
  - Group and sort items using `useMemo` for 60fps responsiveness.
  - Render categorized accordion/sections with smooth item transitions.
  - Refactor the Add Form JSX so `flex-1 min-w-0` and proportional widths prevent horizontal overflow.
- Internationalization: Support English (`EN`) and French (`FR`) category names and item counts.

### Verification Steps
1. Run `compile_applet` to verify Vite bundle builds cleanly.
2. Run `lint_applet` (`tsc --noEmit`) to verify strict type correctness.
3. Test with single items, multiple categorized items, and narrow 360px viewport to confirm alignment.
