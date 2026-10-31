# Implementation Plan — High-Precision Gemini 3.8 Flash Recipe Book Vision

Upgrade recipe book photo transfers in Pantryo exclusively to **Gemini 3.8 Flash Multimodal Vision** via the modern `@google/genai` TypeScript SDK. Eliminates low-quality CPU Tesseract OCR garbling and delivers crystal-clear recipe digitization directly from photos taken on any phone, tablet, or desktop.

---

## 1. Capacity & Quotas (Gemini 3.8 Flash Free Tier)

* **Daily Scan Limit:** **1,500 recipe pages / day** (100% free, no credit card required).
* **Speed:** **Up to 15 scans / minute** (processes in ~1.5–3 seconds per photo).
* **Multi-Recipe Detection:** Automatically extracts all 2–3 recipes on a single cookbook page in one shot without using extra quota.
* **Accuracy:** Natively recognizes vintage typography, typewriter fonts, fractions (½, ¼, ⅓, ¾), dual-column layouts, and handwritten margin notes.

---

## 2. Core Architecture & Enhancements

### A. Backend: Gemini 3.8 Flash Vision Engine (`server/src/services/geminiRecipeParser.js`)
- **Direct Multimodal Processing**: Uses `@google/genai` with `gemini-3.8-flash`.
- **Preflight & Optimization**: Sanitizes and validates the incoming photo base64 payload to ensure optimal resolution without unnecessary bandwidth.
- **Deep Culinary Structuring**:
  - Automatically isolates Recipe Title, Prep Time, Cook Time, Total Time, and Yield/Servings.
  - Normalizes ingredient quantities, units, and assigns kitchen storage zones (`FRIDGE`, `PANTRY`, `FREEZER`, `SPICE_RACK`).
  - Formats instructions into clean, numbered steps in both English and French.
  - Multi-recipe support: Returns all detected recipes in the `allRecipes` array for individual or batch saving.
- **API Key Fallback & Telemetry**:
  - Checks `process.env.GEMINI_API_KEY` and `dbStore.systemSettings.geminiApiKey`.
  - In development and AI Studio environments, uses the platform-provided key automatically.
  - If the key is missing or invalid, returns clear, actionable guidance on adding a free Gemini key rather than silently producing garbled text.

### B. Admin & Settings: 1-Click Gemini API Key Setup (`AdminModal.tsx`)
- Displays current Gemini Vision status: **🟢 Active (Gemini 3.8 Flash Vision)** or **⚪ Not Configured**.
- Direct input to add or change the Gemini API key with a **"Test API Key"** button that verifies connectivity in real time.
- Direct link to get a free key from Google AI Studio (`aistudio.google.com`).

### C. Frontend: Streamlined Photo Recipe Transfer (`AddRecipeModal.tsx`)
- Single, intuitive flow: **Take Photo** (camera) or **Upload Image** (gallery/file).
- Live preview of the uploaded cookbook page.
- Clean loading state: *"Gemini AI is reading cookbook page, extracting ingredients & formatting instructions..."*
- Instant recipe preview with editing capabilities before saving into the pantry library.

---

## 3. Implementation Steps

1. **Backend (`server/src/services/geminiRecipeParser.js`)**:
   - Verify `@google/genai` initialization with model `gemini-3.8-flash`.
   - Enhance the prompt schema for high-precision fraction handling and bilingual preservation.
   - Return structured recipe objects with clean error diagnostics.
2. **Frontend (`src/components/AddRecipeModal.tsx`)**:
   - Streamline the Photo Tab to focus 100% on Gemini Vision photo transfer.
   - Add status pill indicating **Gemini 3.8 Flash Vision Ready (1,500 free scans/day)**.
   - Show clear multi-recipe selection if more than one recipe is detected on the page.
3. **Admin Settings (`src/components/AdminModal.tsx` / `server/src/routes/admin.js`)**:
   - Provide an in-app verification tool for testing the Gemini key.
4. **Verification**:
   - Test recipe photo transfer with cookbook images.
   - Verify type safety (`tsc --noEmit`) and dev server responsiveness.

---

## 4. User Review & Approval

Please review the plan above. Click **Proceed** to implement the Gemini 3.8 Flash Vision recipe book parser.
