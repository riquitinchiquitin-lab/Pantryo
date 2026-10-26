# Auto-Prompt Depleted Items to Grocery List with "(Out of Stock)" Label

Prompt users whenever a food or pantry item is depleted (consumed, cooked, or reduced to 0 quantity) with an instant interactive toast allowing one-tap addition to the Grocery List with a dedicated **(Out of stock) / (Rupture de stock)** badge.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were answered in Phase 1:
> - **Trigger Scope**: Trigger on all item depletion events: quick-consume checkmark, recipe cooking depletion, and setting quantity to 0.
> - **Prompt Style**: An instant interactive toast banner with a direct one-tap **"Add to List" / "Ajouter à l'épicerie"** action button (7-second comfortable touch window).
> - **Label Styling**: A dedicated high-visibility amber badge **`(Out of stock)` / `(Rupture de stock)`** positioned right beside the product title in the grocery list.

---

## 1. Overview & Core Concept

When busy home cooks finish the last egg, can of crushed tomatoes, or bag of potatoes, they need a frictionless way to prevent forgetting to restock. Instead of forcing manual navigation to the Shopping tab, Pantryo automatically detects when any item reaches zero quantity and surfaces an actionable prompt:

1. **Detection**: Whenever an item is consumed via the quick-check circle, depleted through cooking a planned recipe, or saved with 0 quantity.
2. **Instant Prompt**: An alert toast with an actionable button:
   - *FR*: `« Lait » est épuisé ! Voulez-vous l'ajouter à votre liste ?` ➔ `[+ Ajouter (Rupture)]`
   - *EN*: `"${item.name}" is used up! Add to your grocery list?` ➔ `[+ Add (Out of stock)]`
3. **Dedicated Grocery Tagging**: Adding from this prompt attaches the `outOfStock: true` metadata flag. The grocery list displays a dedicated, warm amber badge:
   - ⚠️ **Rupture de stock** (FR) / **Out of stock** (EN)
   - Preserves original unit, category, and storage aisle.

---

## 2. User Experience & Visual Design

### Depletion Flow & Tactile Feedback

```
  [ Inventory View ] 
          │
    User clicks ○ Check / Cooks Recipe / Sets Qty = 0
          │
          ▼
   Item status -> CONSUMED (removed from active shelf)
          │
          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 🔔 « Pommes de terre grelots » est épuisé !                 │
  │    Voulez-vous l'ajouter à votre liste de courses ?         │
  │                                                             │
  │               [+ Ajouter (Rupture)]   [✕]                   │
  └─────────────────────────────────────────────────────────────┘
          │ User taps "+ Ajouter (Rupture)"
          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 🛒 Ajouté à la liste avec l'étiquette (Rupture de stock)    │
  └─────────────────────────────────────────────────────────────┘
          │
          ▼
  [ Grocery List Tab ]
  ┌─────────────────────────────────────────────────────────────┐
  │ [ ] 🥔 Pommes de terre grelots  [ ⚠️ Rupture de stock ]     │
  │     1 sac · Maraîchers                                      │
  └─────────────────────────────────────────────────────────────┘
```

### Visual Specifications
- **Badge Styling**: Soft amber background (`bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60`), rounded-md, with a subtle alert icon.
- **Touch-Friendly Action Target**: Toast button meets the $\ge 44\text{px}$ touch target guideline with bold, clear micro-copy.
- **Zero Pill AI-Slop Violation**: The badge is placed cleanly beside the food title, complementing rather than overwhelming the aisle layout.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale |
| :--- | :--- | :--- |
| **Prompt Delivery** | Non-modal Interactive Toast (`AlertToastContext`) with explicit Action button | Does not block the screen like a modal dialog, allowing fast uninterrupted cooking, while remaining immediately accessible for 7 seconds. |
| **Data Representation** | `outOfStock: boolean` on `GroceryCartItem` & localized notes | Allows filtering, sorting, visual badging, and seamless persistence across local storage and cloud sync. |
| **Depletion Triggers** | Centralized `promptDepletedItem(item)` handler | Reusable across `handleConsumeItem`, recipe deduction outcomes (`wasFullyDepleted`), and `AddEditItemModal` zero-quantity saves. |

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MobileSimulator.tsx                           │
│                                                                         │
│  handleConsumeItem() ──────┐                                            │
│  handleCookMealAndDeduct()─┼──> promptDepletedItem(item)                │
│  handleItemSaved(qty <= 0) ┘         │                                  │
│                                      ▼                                  │
│                             showToast({                                 │
│                               message: "...",                           │
│                               actionLabel: "+ Ajouter (Rupture)",       │
│                               onAction: () => handleAddOutOfStock(...)  │
│                             })                                          │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           GroceryListView.tsx                           │
│                                                                         │
│  GroceryCartItem {                                                      │
│    ...                                                                  │
│    outOfStock: true,                                                    │
│    notes: "Rupture de stock / Out of stock"                             │
│  }                                                                      │
│                                                                         │
│  Renders:                                                               │
│  <span className="bg-amber-100 text-amber-900 border-amber-300...">     │
│    ⚠️ Rupture de stock                                                  │
│  </span>                                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Files to Modify
1. `src/components/GroceryListView.tsx`:
   - Add `outOfStock?: boolean` to `GroceryCartItem` interface.
   - Render the dedicated `(Rupture de stock)` / `(Out of stock)` badge next to `getItemDisplayName`.
2. `src/components/MobileSimulator.tsx`:
   - Implement `promptDepletedItem(item: InventoryItem)` helper function.
   - Hook into:
     - `handleConsumeItem`: when item is consumed.
     - `handleCookMealAndDeduct` & `handleCookRecipeDirectly`: when ingredients have `d.wasFullyDepleted === true`.
     - `handleItemSaved`: when an item is saved with `quantity <= 0`.
   - Implement `handleAddOutOfStockItem(item: InventoryItem)` which creates a `GroceryCartItem` with `outOfStock: true` and defaults quantity to 1.
3. `src/utils/i18n.tsx`:
   - Add translation keys for French and English prompts, button labels, and badging.

---

## 5. Verification Plan
- **Quick Consume**: Click circle check on an inventory item ➔ verify toast prompt appears with action button.
- **One-Tap Addition**: Click the button in the toast ➔ switch to Grocery tab and verify the item appears with the `(Out of stock)` badge.
- **Recipe Cooking**: Cook a recipe that exhausts an inventory item ➔ verify prompt triggers for depleted ingredient.
- **Full Build Test**: Run `lint_applet` and `compile_applet` to confirm 0 compilation errors.
