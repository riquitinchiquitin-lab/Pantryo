# Implementation Plan: Gemini Vision Upgrade, Local DB Reconciliation & Canadian Packaging Fallback

Address poor food recognition on photo imports by integrating Gemini Vision (`gemini-2.5-flash` / `gemini-3.8-flash`), **comparing and reconciling extracted data against the local SQLite database**, and providing an enhanced Canadian packaging fallback for offline resilience.

---

## User Review Required

> [!IMPORTANT]
> **Key Enhancements in this Revision**:
> 1. **Post-Extraction Local DB Comparison & Reconciliation**:
>    - Once Gemini Vision extracts product metadata (Brand, Name, Quantity/Unit, Category, Barcode/UPC), it will immediately query the local SQLite database.
>    - **Inventory Matching**: Checks if the user already has this item in stock. If found, the scanner displays *"Already in Pantry (X units in stock)"* with a 1-click **"Add +1 to Existing"** or **"Add New Batch"** option.
>    - **Catalog & Canonical Data Reconciliation**: Cross-references local product references (Canadian grocery catalog, calibrated shelf lives, storage location defaults) to eliminate slight naming variations and guarantee accurate pantry tracking.
> 2. **Vision Engine & Model Resilience**:
>    - Connects Gemini Vision via configured Admin API Key with automatic retry on temporary 503 high-demand errors.
> 3. **Bilingual Canadian Packaging Fallback**:
>    - If the API key is not configured or network is unavailable, the local packaging analyzer recognizes Metro (`Selection`), Loblaws (`No Name`, `PC`), Sobeys (`Compliments`), and Pharmaprix (`Life Smart`) without OCR noise (`aad`).

---

## 1. Monitored Photo Benchmark & Extraction

Comparison based on the two real photos recently imported in `/server/data/monitored_photos/`:

| Photo / Item | Current OCR Output | Gemini Vision Extraction | Local DB Reconciled Match |
| :--- | :--- | :--- | :--- |
| **Photo 1: Can of Tomato Sauce**<br>`scan_1793717469131_g4ubp` | **"a Selection aad, SAUCE"**<br>*(34% conf, noisy gibberish)* | **"Sauce tomate Sélection / Selection Tomato Sauce"**<br>*Brand:* `Sélection`<br>*Size:* `398 mL`<br>*Category:* `Garde-manger / Conserves` | **Exact/Fuzzy Match in Local DB**<br>- Matches canonical `Sauce tomate (Sélection)`<br>- Standard storage: `Pantry`<br>- Default shelf life: `730 days`<br>- Action: If in inventory, shows *"+1 to current stock (2 available)"* |
| **Photo 2: Beef Broth Carton**<br>`scan_1793717493011_sg4xz` | **FAILED**<br>*(No food label detected)* | **"Bouillon de bœuf Life Smart / Mieux-être"**<br>*Brand:* `Life Smart`<br>*Size:* `946 mL`<br>*Category:* `Soupes & Bouillons` | **Catalog Enriched in Local DB**<br>- Matches `Bouillon de bœuf (Life Smart)`<br>- Storage: `Pantry` (refrigerate after opening)<br>- Default shelf life: `365 days` |

---

## 2. Technical Architecture & Implementation Steps

### Step 1: Gemini Vision AI Extraction Pipeline
- **File**: `server/src/services/geminiService.js` & `server/src/services/visionScanner.js`
- Read active Gemini API key from SQLite `system_settings` or `process.env.GEMINI_API_KEY`.
- Use `gemini-2.5-flash` with structured JSON output:
  ```json
  {
    "brand": "Sélection",
    "productName": "Sauce tomate",
    "fullName": "Sauce tomate Sélection / Selection Tomato Sauce",
    "quantity": 398,
    "unit": "mL",
    "category": "Canned Goods",
    "suggestedStorage": "pantry",
    "shelfLifeDays": 730,
    "barcode": null
  }
  ```
- Implement retry logic with exponential backoff for HTTP 503 / 429 errors.

### Step 2: Local Database Comparison & Reconciliation Engine
- **File**: `server/src/services/inventoryReconciler.js` (New Service)
- When Gemini Vision (or the fallback) produces an extracted item:
  1. **Query Current Inventory (`inventory` table)**:
     - Search by exact/fuzzy title match, brand match, or barcode (UPC).
     - If matched: return `existingItem: { id, name, quantity, unit, location, expiryDate, daysRemaining }`.
     - Flag `matchType: "existing_inventory" | "new_item"`.
  2. **Query Canonical Food Catalog (`food_catalog` / standard presets)**:
     - Calibrate expiry dates based on historical user data or Canadian pantry shelf-life tables.
     - Harmonize French/English naming to the user's preferred language.
     - Normalize storage location (`pantry`, `fridge`, `freezer`).
  3. **Return Combined Payload** in `/api/v1/inventory/scan`:
     ```json
     {
       "success": true,
       "extracted": { ... },
       "reconciliation": {
         "isAlreadyInInventory": true,
         "existingItemId": 14,
         "currentStock": 2,
         "suggestedAction": "increment_quantity",
         "canonicalName": "Sauce tomate Sélection",
         "matchedBrand": "Sélection"
       }
     }
     ```

### Step 3: Enhanced Canadian Packaging Fallback
- **File**: `server/src/services/packagingAnalyzer.js`
- Filter OCR noise tokens (e.g. `aad`, lone characters, misread punctuation).
- Add Canadian private label lexicon: Metro/Super C (`Selection`, `Irrésistibles`), Loblaw/Maxi (`No Name`, `Sans Nom`, `President's Choice`), Sobeys (`Compliments`), Pharmaprix (`Life Smart`).
- Fuzzy match curved and low-contrast labels against 250+ standard grocery terms.

### Step 4: Scanner UI Enhancements
- **Files**: `src/components/CameraInventoryScannerModal.tsx`, `src/components/ProduceScannerModal.tsx`
- **Reconciliation Banner**:
  - If item exists in inventory:
    - Display alert: *"🥫 You already have 2 cans of this in your Pantry (exp. Dec 2026)"*
    - Two clear action buttons: **[+1 Add to Existing]** (increments count instantly) vs **[Add as Separate Batch]** (new expiry date).
  - If new item:
    - Pre-filled form with Gemini's high-confidence brand, size (`398 mL`), and shelf-life preset ready for 1-tap confirmation.
- **Engine Status Pill**:
  - 🟢 *Gemini Vision Active + Local DB Match*
  - 🟡 *Canadian Packaging Matcher (Offline)*

---

## 3. Verification & Testing Plan

1. **Monitored Photos Test**:
   - Run verification test feeding `scan_1793717469131_g4ubp` and `scan_1793717493011_sg4xz` into the reconciliation pipeline.
   - Verify that tomato sauce matches existing pantry stock or correctly proposes catalog addition without `aad` noise.
2. **Build and Type Validation**:
   - Run `compile_applet` and `lint_applet` to verify TypeScript and server stability.
3. **End-to-End User Flow**:
   - Verify that scanning a known item triggers the "+1 to existing stock" prompt.
