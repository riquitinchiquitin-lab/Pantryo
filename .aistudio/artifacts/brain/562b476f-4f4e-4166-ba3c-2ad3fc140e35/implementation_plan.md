# Implementation Plan - Multi-Website Recipe Import Engine & Bilingual Parser

## Overview
Improve the recipe import workflow so recipes imported from any website—including Filipino culinary portals (Panlasang Pinoy, Kawaling Pinoy, Yummy.ph, Foxy Folksy, Simpol), Quebec & French favorites (Ricardo Cuisine, Marmiton, 750g), and international sites (Allrecipes, Food Network, Serious Eats, food blogs)—are extracted with high fidelity, cleanly separated fields, automatic English and French bilingual translations, accurate measurement/unit parsing, and automated storage zone assignment (Fridge, Pantry, Freezer).

---

## Root Causes of Current Issues
1. **Premature Fallback in `geminiRecipeParser.js`:** The backend URL import handler checked `if (!apiKey)` before attempting to fetch the webpage or parse embedded Schema.org JSON-LD. When the Gemini API key was not configured or unavailable, it completely abandoned the URL and generated generic mock data (e.g. olive oil and garlic) rather than extracting the real recipe data from the website.
2. **Missing Deterministic Schema.org / Microdata Extractor:** Nearly all top recipe portals (Ricardo Cuisine, Panlasang Pinoy, Kawaling Pinoy, Allrecipes, Marmiton) embed Schema.org `Recipe` JSON-LD with exact ingredients, instructions, cooking times, yields, and images. The system did not have a robust standalone parser for this data that works independently or alongside Gemini.
3. **Ingredient String Clutter:** Raw ingredients like `"1 1/2 lbs pork belly (liempo) cut into cubes"` had amounts, units, notes, and names jumbled together in the name field, rather than being parsed cleanly into `amount: "1.5"`, `unit: "lb"`, `name: "Pork belly (liempo)"`, and `storage: "fridge"`.
4. **Lack of Filipino Ingredient Vocabulary & Bilingual Mapping:** Ingredients common in Filipino cuisine (*patis*, *calamansi*, *bagoong*, *sinigang mix*, *liempo*, *kangkong*, *sitaw*, *chicharon*, *gata*, *toyo*, *suka*) were unrecognized by the food translator and fell back to generic placeholders.
5. **Storage Zone Defaults:** Storage locations defaulted to 'pantry' without intelligent classification into `FRIDGE`, `FREEZER`, and `PANTRY` based on ingredient category and perishability.

---

## Proposed Changes

### 1. Robust Server-Side Multi-Website Recipe Scraper & JSON-LD Parser (`server/src/services/geminiRecipeParser.js` & `server/src/services/recipeScraper.js`)
- **Direct Schema.org JSON-LD and Microdata Extraction:**
  - Before or alongside AI parsing, fetch the page HTML with browser headers.
  - Parse `<script type="application/ld+json">` to detect `@type: "Recipe"` (handling nested arrays, `@graph`, and multiple scripts).
  - Extract:
    - Title / Name
    - Description
    - Recipe ingredients (`recipeIngredient` array)
    - Recipe instructions (`recipeInstructions` as text steps, `HowToStep`, or `HowToSection`)
    - Prep time (`prepTime` ISO 8601 e.g. `PT15M` -> `15 mins`)
    - Cook time (`cookTime` ISO 8601 e.g. `PT30M` -> `30 mins`)
    - Total time (`totalTime`)
    - Yield / Servings (`recipeYield`)
    - High-res Image URL (`image` string or ImageObject)
    - Source website domain & author
- **Gemini Hybrid Intelligence with Fallback to Deterministic Parser:**
  - If Gemini API is available: Run structured extraction and high-quality bilingual translation (English + French), retaining original Filipino and local culinary terms with helpful culinary explanations.
  - If Gemini API is unavailable or rate-limited: The deterministic parser extracts the exact real recipe from Schema.org JSON-LD / HTML, runs the bilingual dictionary engine, and cleanly populates every single field.

### 2. Comprehensive Ingredient Parsing & Storage Zoning Engine (`server/src/services/foodTranslator.js` & `src/components/AddRecipeModal.tsx`)
- **Advanced Quantity & Unit Parsing:**
  - Parse fractional amounts (`1/2`, `1 1/2`, `3/4`, `0.5`, `2-3`, `pinch`, `to taste / au goût`).
  - Standardize units: `g`, `kg`, `ml`, `l`, `tbsp / c. à soupe`, `tsp / c. à thé`, `cup / tasse`, `can / boîte`, `clove / gousse`, `slice / tranche`, `piece / morceau`, `bunch / botte`, `packet / sachet`, `pinch / pincée`.
  - Isolate ingredient name cleanly by removing leading quantities, units, and trailing preparation instructions (e.g., `"diced"`, `"minced"`, `"cut into cubes"`).
- **Automated Storage Zone Assignment:**
  - **FRIDGE:** Fresh meats, poultry, seafood, dairy, eggs, fresh leafy greens, herbs (*kangkong*, spinach, cilantro), fresh vegetables (*tomatoes*, *bell peppers*), condiments needing refrigeration.
  - **FREEZER:** Frozen meats, ice cream, frozen vegetables, frozen wrappers.
  - **PANTRY:** Oils, vinegars, soy sauce, fish sauce (*patis*), dried spices, garlic, onions, rice, pasta, canned goods, coconut milk (*gata*), bouillon / seasoning mixes (*sinigang mix*).
  - **SPICE RACK:** Salt, black pepper, paprika, oregano, bay leaves (*dahon ng laurel*), chili flakes.
- **Filipino Culinary Dictionary & Bilingual Translation:**
  - Add bilingual mappings for Filipino staples (*Adobo*, *Sinigang*, *Kare-Kare*, *Pancit*, *Lechon Kawali*, *Lumpia*, *Sisig*, *Tinola*, *Bicol Express*, *Halo-Halo*).
  - Map ingredients like *liempo* (pork belly / poitrine de porc), *patis* (fish sauce / sauce de poisson), *toyo* (soy sauce / sauce soja), *suka* (cane vinegar / vinaigre de canne), *kangkong* (water spinach / épinards d'eau), *calamansi* (Philippine lime / lime philippine), *gata* (coconut milk / lait de coco), *bagoong* (fermented shrimp paste / pâte de crevettes fermentée), *sitaw* (yardlong beans / haricots longs).

### 3. Frontend Recipe Import Modal Polish (`src/components/AddRecipeModal.tsx`)
- **Website Presets for Filipino & International Sites:**
  - Add quick-select pills / presets for Panlasang Pinoy, Kawaling Pinoy, Yummy.ph, Foxy Folksy, Ricardo Cuisine, Marmiton, 750g, Allrecipes.
- **Bilingual Field Display & Editing:**
  - Clean bilingual title inputs (`Title EN` & `Title FR`).
  - Bilingual description inputs.
  - Interactive language switcher toggle in the preview card to review the recipe in English or French before saving.
- **Storage Zone Badges & Quick Toggles:**
  - Clear visual storage tags (Fridge / Frigo, Pantry / Garde-manger, Freezer / Congélateur) on each imported ingredient row so users can adjust zoning with 1 click.
  - Clean separation into `Amount`, `Unit`, `Ingredient Name`, and `Storage Zone` fields.

---

## Verification Plan

### Automated & Manual Verification
1. **Ricardo Cuisine Test:** Test parsing `https://www.ricardocuisine.com/en/recipes/4512-apple-and-maple-syrup-pork-roast`. Verify title, prep time (15 mins), cook time (2 hrs 30 mins), ingredients, quantities, instructions, and storage zoning (pork roast -> Fridge, apples -> Fridge/Pantry, maple syrup -> Pantry, broth -> Pantry).
2. **Filipino Recipe Site Test:** Test parsing a recipe from Panlasang Pinoy or Kawaling Pinoy (e.g. Pork Sinigang or Chicken Adobo). Verify:
   - Extraction of ingredients without field corruption.
   - Clean separation of quantities (e.g., `2 lbs`, `1 packet`, `1/2 cup`) from ingredient names.
   - Translation to both English and French.
   - Appropriate storage locations: pork/chicken -> Fridge, fish sauce -> Pantry, spinach/kangkong -> Fridge.
3. **Bilingual Switching:** Toggle language between English and French in the review step and verify all fields display the appropriate translation.
4. **Lint and Build:** Run `npm run lint` and `compile_applet` to ensure zero compilation or type errors.
