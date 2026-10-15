# Implementation Plan: Bilingual Cooking Instructions for Suggested Recipe Imports

Harmonize the mechanism of importing recipes via suggestions (both Website Discovery and Smart Meal Suggestions) with pasting a link, guaranteeing complete step-by-step cooking instructions in French and English, opening the full recipe review screen, and using AI synthesis as a robust fallback.

## User Requirements & Clarifications
1. **Identical Import Mechanics**: Adding a recipe from suggestions must follow the same pipeline as pasting a link—parsing the source, generating structured bilingual ingredients and step-by-step cooking instructions (`instructionsEn` & `instructionsFr`), and transitioning to the parsed recipe review screen.
2. **Accessible Everywhere**: Available both in **Website Discovery** (`AddRecipeModal`) and **Smart Meal Suggestions** (`SmartMealSuggestionsModal` & `MealPlannerView`).
3. **Bilingual Completeness**: Guarantee that French (`instructionsFr`) and English (`instructionsEn`) cooking instructions are fully populated with proper timings, temperatures, and techniques.
4. **Resilient AI Synthesis**: If a source link is slow, paywalled, or blocked, automatically synthesize complete bilingual cooking steps via Gemini AI instead of leaving instructions empty.

---

## Proposed Changes

### 1. Backend: Recipe Parsing & Bilingual Step Synthesis
#### `server/src/services/geminiRecipeParser.js` & `server/src/routes/recipes.js`
- **Ensure Website Discovery Output Includes Instructions**:
  - Update `lookThroughWebsiteContent` prompt to extract or synthesize initial bilingual instruction steps (`instructionsEn` and `instructionsFr`) for each discovered recipe.
- **Ensure Smart Meal Suggestions Always Have Instructions**:
  - Audit and update `generateSmartMealSuggestions` and all fallback meals so `instructions` (EN) and `instructionsFr` (FR) are always populated with realistic, clear step-by-step instructions.
- **New or Enhanced Endpoint `/api/v1/recipes/synthesize-steps` (or fallback in `/import-url`)**:
  - When importing a suggested recipe, if the `sourceUrl` cannot be scraped or is invalid, the backend automatically uses the recipe's title, ingredients, and description to synthesize complete, high-quality cooking instructions in both English and French.

---

### 2. Frontend: `AddRecipeModal.tsx`
#### Website Discovery Tab Harmonization
- Replace `handleConvertDiscoveredToParsed`'s placeholder logic (which set `instructionsEn: []` and `instructionsFr: []`).
- When a user clicks **"Importer cette recette"** on a discovered website recipe:
  - If it has a `sourceUrl`, trigger the full import pipeline (`/api/v1/recipes/import-url` or dedicated suggestion importer) with interactive progress stages:
    1. *"Connecting to source..."* / *"Connexion au site culinaire..."*
    2. *"Extracting ingredients & bilingual steps..."* / *"Extraction des ingrédients et étapes bilingues..."*
    3. *"Finalizing recipe review..."* / *"Préparation de la fiche recette..."*
  - If scraping returns empty steps or fails, fall back smoothly to the AI bilingual step synthesis pipeline.
  - Automatically load the resulting `ParsedRecipe` (with full `instructionsEn` and `instructionsFr`, ingredients, prep/cook times, servings, macros) into the **Review Step** (`parsedRecipe` modal view).
  - The user can review the French and English tabs, edit any step, and save the recipe to custom recipes with 1 click.

---

### 3. Frontend: `SmartMealSuggestionsModal.tsx` & `MealPlannerView.tsx`
#### Direct Recipe Import & Bilingual Step Review
- Add a new action button to meal suggestion cards: **"Importer dans mes recettes" / "Import to My Recipes"** alongside the existing "Planifier ce repas" button.
- Add prop `onImportRecipe?: (recipe: Partial<Recipe>) => void` from parent components (`MealPlannerView`, `CookingIdeasView`).
- When clicked:
  - Runs the recipe import synthesis flow to ensure complete English & French cooking instructions.
  - Opens the recipe review modal so the user can verify bilingual steps and save to their cookbook.
- When planning a suggested meal (`handleSelectAndPlan`):
  - Ensure the planned meal's underlying recipe data contains full bilingual instructions so that launching the **Guided Cooking Modal** (`GuidedCookingModal`) will immediately offer full step-by-step bilingual cooking guidance.

---

## Verification Plan

### Automated Checks
- Run `compile_applet` to verify TypeScript types, component props, and API request schemas.
- Run `lint_applet` to ensure code style, imports, and syntax cleanliness.

### Manual Verification Steps
1. **Website Discovery Test**:
   - Open Add Recipe modal -> Discovery tab -> Search/crawl recipes.
   - Click "Importer cette recette" on a discovered item.
   - Verify the loading progress indicator appears.
   - Verify it lands on the recipe review screen with **both French and English cooking instructions fully populated**.
2. **Smart Meal Suggestions Test**:
   - Open Smart Meal Suggestions from Meal Planner.
   - Click "Importer dans mes recettes" on any suggestion card.
   - Verify full bilingual instructions are generated and presented in the review editor.
3. **Save and Cook Verification**:
   - Save the imported recipe and open it in the cooking ideas / recipe detail view.
   - Switch language between French and English; confirm cooking steps change dynamically.
   - Launch "Start Cooking" (`GuidedCookingModal`) to confirm step-by-step cooking timers and instructions work in both languages.
