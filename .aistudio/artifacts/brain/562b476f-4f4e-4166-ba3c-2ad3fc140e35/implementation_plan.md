# Email Receipt Pasting, Food Category Illustrations, Recipe Portion Scaler & Batch Cooking

Implement email/store receipt text pasting, curated generic category illustrations for photo-less food items, real-time recipe portion scaling by number of people eating, and a Batch Cooking mode that auto-generates freezer meal-prep containers.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification:
> - **Receipt Paste Tool**: Available **both** inside the Smart Scanner modal and directly on the main Inventory screen.
> - **Batch Cooking Organization**: Scaled batch cooking with **auto-generated freezer meal prep containers** saved directly into inventory with reheat instructions and expiration dates.
> - **Generic Food Images**: Curated food category illustrations and cut icons for any food item without a user-uploaded photo.
> - **Recipe Portion Adjustment**: Real-time ingredient and nutrition scaling based on number of people eating / portions.

---

## 1. Overview of Features

### Feature 1: Email & Store Receipt Text Pasting
- **Access Points**:
  1. Main Inventory screen header: `[📋 Paste Email Receipt]` quick-action button.
  2. Smart Scanner modal: Dedicated `[📋 Paste Text]` tab alongside Camera, Flyer, and Barcode.
- **Functionality**:
  - Accepts raw text copied from store emails (Costco, Walmart, Super C, Maxi, Metro, IGA, Amazon, etc.).
  - Backend `/api/v1/inventory/scan-receipt-text` extracts store name, purchase date, item names, quantities, unit prices, and storage zones (FRIDGE, FREEZER, PANTRY).
  - Shows preview modal with checkable items before 1-click adding to kitchen inventory.

### Feature 2: Curated Generic Food Category Illustrations & Visual Cut Icons
- **Asset Dictionary (`src/utils/foodIllustrations.ts`)**:
  - Provides curated SVG illustrations and high-fidelity food icons for all food categories:
    - 🥦 Produce & Vegetables
    - 🍎 Fruits & Berries
    - 🥛 Dairy & Eggs
    - 🥩 Fresh Meat & Poultry
    - 🐟 Seafood & Fish
    - 🥖 Bakery & Breads
    - 🍝 Pantry, Grains & Canned Goods
    - 🧊 Frozen Foods & Ice Cream
    - 🧂 Spices, Seasonings & Condiments
    - ☕ Beverages & Drinks
    - 🍲 Prepared Meals & Meal Prep Containers
- **Universal Fallback**:
  - Applied across Inventory cards, Grocery Shopping list, Recipe ingredients, and Meal Planner. When `!item.imageUrl`, renders the curated category illustration with vibrant accents.

### Feature 3: Real-Time Recipe Portion Scaler (Number of People Eating)
- **Interactive Portion Controller**:
  - In `CookingIdeasView.tsx`, recipe preview modals, and `AddRecipeModal.tsx`:
  - Quick buttons: `[-]` and `[+]` plus direct number input (1 to 24 people).
  - Fraction & metric scaling helper (`scaleIngredientQuantity(amount, baseServings, targetServings)`):
    - Example: `1/2 cup` for 4 people $\to$ `3/4 cup` for 6 people, `1 cup` for 8 people.
    - Example: `200g` for 2 people $\to$ `600g` for 6 people.
  - Dynamically updates recipe calories, macros, and displays a *"Scaled for X people (Original: Y)"* badge.

### Feature 4: Batch Cooking Mode with Auto-Generated Freezer Containers
- **Batch Cook Toolbar**:
  - Quick multipliers: `2x Batch`, `3x Batch`, `4x Batch` or custom container count (e.g. `8 containers`).
  - Cooking pot capacity advice (e.g., "Requires 6L+ Dutch Oven or Stockpot").
- **1-Click Save to Freezer**:
  - Button: `[❄️ Save X Meal Prep Containers to Freezer]`.
  - Automatically provisions items in inventory:
    - Name: `🍲 [Recipe Name] (Meal Prep Container)`
    - Quantity: e.g. `8 units`
    - Location: `FREEZER`
    - Expiry Date: +90 days (freezer safe)
    - Notes: Reheat directions (e.g. "Reheat in microwave 3-4 mins or thaw overnight in fridge").

---

## 2. Technical Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Inventory View                        │
│   [📷 Camera Scan]  [📋 Paste Email Receipt]  [+ Manual]     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────▼─────────────┐
                │ PasteReceiptModal / Tab   │
                │ Parses email store receipt │
                │ Bulk review & save to stock│
                └──────────────┬─────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌──────────────────────────────┐      ┌──────────────────────────────┐
│  src/utils/foodIllustrations │      │ Recipe Portion & Batch Cook  │
│  Curated SVGs/icons for:     │      │ - Portion Scaler (2-24 ppl)  │
│  Produce, Dairy, Meat, etc.  │      │ - Batch Multipliers (2x-4x)  │
│  Used when imageUrl is null  │      │ - ❄️ Auto-generate Freezer   │
│                              │      │   Meal Prep Containers       │
└──────────────────────────────┘      └──────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Plan

### Step 1: Curated Generic Food Category Illustrations (`src/utils/foodIllustrations.ts`)
- Create `getFoodCategoryIllustration(categoryOrName, location)`:
  - Returns curated SVG food cuts and category graphics with optimized background colors.
  - Add fallback component `<FoodItemImage src={item.imageUrl} category={item.category} name={item.name} />`.
  - Integrate into `InventoryView.tsx`, `GroceryListView.tsx`, and `CookingIdeasView.tsx`.

### Step 2: Email Receipt Pasting Modal & Integration (`src/components/PasteReceiptModal.tsx`)
- Build a dedicated, user-friendly `PasteReceiptModal`:
  - Large text area with placeholder examples of Canadian/US grocery receipts.
  - Quick parse with `/api/v1/inventory/scan-receipt-text` (already supported in backend with Quebec/Canadian store recognition).
  - Interactive table allowing user to verify detected items, quantities, and storage zones before saving.
- Add trigger button to:
  - Main Inventory view toolbar (`[📋 Coller un reçu / Paste Receipt]`).
  - `CameraScannerModal.tsx` as a dedicated tab.

### Step 3: Recipe Portion Scaler (`src/utils/portionScaler.ts`)
- Create portion scaling utility with robust fraction handling (`1/4`, `1/3`, `1/2`, `3/4`, `1 1/2`, grams, ounces, tablespoons, teaspoons, cans).
- Embed portion scaler controls into `CookingIdeasView.tsx` recipe modal and active cooking step view.

### Step 4: Batch Cooking Mode & Auto-Generated Freezer Containers
- Add Batch Cooking drawer/panel in recipe view with container calculation (`Yield: X individual meal prep containers`).
- Implement `handleSaveBatchToFreezer(recipe, containerCount, targetLocation)`:
  - Adds items to inventory with category `"Prepared Meals"`, storage zone `"FREEZER"`, and 3-month shelf life.
  - Emits success toast: `[✓ X containers saved to Freezer!]`.

---

## 4. Verification & Testing Plan

1. **Email Receipt Pasting**:
   - Paste a sample store email receipt (Super C / Walmart / Costco format with items and prices) and verify that items parse cleanly and add to inventory.
2. **Generic Food Illustrations**:
   - Create a photo-less food item in inventory, recipe, and grocery list, verifying that the curated category illustration renders with crisp styling.
3. **Portion Scaling**:
   - Change a 4-serving recipe to 2 servings and 8 servings; verify all ingredient quantities scale proportionally and fractions remain clean.
4. **Batch Cooking**:
   - Click "Batch Cook 4x", verify meal-prep yield calculates to 8 or 16 containers, click "Save to Freezer", and verify container entries appear in the Freezer inventory tab.
5. **Build & Lint**:
   - Run `compile_applet` and `lint_applet` to ensure 0 errors.
