# Local-First OCR & Gemini Dual-Stage Recipe Pipeline

Transform the recipe photo ingestion pipeline to run **Local OCR first** for immediate, offline-resilient recipe extraction, followed by **Gemini AI double-checking** to correct typos, standardize fractions/measurements, enrich bilingual descriptions, and categorize ingredients.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions**:
> 1. **Local OCR First as the Baseline**:
>    - Every photo scan immediately runs through local high-speed OCR (`Tesseract.js`).
>    - This guarantees zero failure on cloud outages, zero HTTP 503 high-demand errors, and immediate initial recipe display without waiting on remote network calls.
> 2. **Gemini AI Double-Check & Refinement Stage**:
>    - Once local OCR extracts the raw recipe text, Pantryo sends the text and layout to Gemini (`gemini-3.8-flash` with instant `gemini-3.1-flash-lite` cascade).
>    - Gemini acts as the culinary editor: fixing broken OCR glyphs (e.g. `l` vs `1`, `O` vs `0`, split fractions `1/2` vs `½`), normalizing cooking units (tablespoons, teaspoons, ounces, grams), classifying optimal storage (`FRIDGE`, `PANTRY`, `FREEZER`, `SPICE_RACK`), and generating bilingual French/English instructions.
> 3. **Non-Blocking User Experience**:
>    - The user sees the recipe populated immediately from local OCR.
>    - While the user reviews the recipe, Gemini runs in the background. Once the double-check completes, a subtle toast and highlighted improvements appear with a 1-click "Apply Gemini Enhancements" toggle, or applied automatically based on user preference.
>    - If Gemini is unreachable (503 demand spike or offline), the local OCR recipe remains 100% functional and ready to save.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces the fragile "cloud vision first, fallback to OCR" model with a robust "local OCR baseline first, Gemini AI double-check & refine" dual-stage pipeline.
- **Target Audience**: Home cooks digitizing physical cookbooks, handwritten family cards, printed magazine clippings, or index card boxes who want fast, reliable scanning without cloud bottlenecks.
- **Key Value**: Never lose a recipe scan to server 503 errors or gateway timeouts. Local OCR captures the recipe text in seconds, while Gemini elevates it into a pristine, structured, bilingual culinary record.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Snap / Upload Recipe Photo]
             │
             ▼
[Stage 1: Local OCR Engine (Tesseract)] ──── Instant (1-3s)
             │
             ├─────────────────────────────────────────────┐
             ▼                                             ▼
[Recipe Editor Populates Immediately]          [Stage 2: Gemini Double-Check]
- Title, Ingredients, Steps ready              - Corrects OCR typos
- User can edit or save immediately            - Normalizes units & fractions
             │                                 - Categorizes fridge/pantry zones
             │                                 - Generates French/English text
             │                                             │
             ▼                                             ▼
[Toast: "✨ Double-Checked by Gemini AI"] ◄─────────────────┘
- Highlights refined ingredients & steps
- User saves to kitchen with 1 click
```

### Visual Identity & Interface Refinements
- **Dual-Stage Status Indicator**: A clean inline status indicator below the photo preview showing:
  - Phase 1: `📄 Local OCR Extracted` (with extracted line count)
  - Phase 2: `✨ Gemini AI Verified & Refined` (with count of typos corrected or units standardized)
- **Zero-Pill Restraint**: Recipe metadata (servings, prep time, difficulty, tags) is displayed with quiet typographic rhythm and clean text dividers (`·`), completely avoiding cluttered candy badge enclosures.
- **Manual "Re-check with Gemini" Button**: Located in the recipe editor header so users can re-trigger AI validation at any time if they make manual text changes.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Local OCR as Ground Truth vs. Cloud First**
  - *Chosen Approach*: Run local OCR first on every photo, then pass the extracted text to Gemini for correction and structuring.
  - *Why*: Eliminates the single point of failure where a busy Google AI server (503 high demand) prevents the user from capturing their recipe. The user always gets their recipe digitized regardless of network or API quotas.
  - *Alternatives Considered*: Cloud-only vision (causes 503 errors and gateway timeouts during peak hours) or OCR-only (misses culinary context and fails on broken fractions).

- **Decision 2: Text-Based Gemini Refinement vs. Full-Image Re-upload**
  - *Chosen Approach*: Send the local OCR text along with the compressed thumbnail to Gemini for culinary editing.
  - *Why*: Sending text requires 90% fewer tokens and network bandwidth than 10MB raw image buffers, drastically cutting response time from 15s to under 2s and preventing payload limits or timeout disconnects.

- **Decision 3: Seamless Non-Blocking Review**
  - *Chosen Approach*: Display the locally parsed recipe as soon as OCR finishes, while Gemini refines it in the background.
  - *Why*: Users experience near-zero latency. They can start reading or adjusting ingredients immediately rather than staring at a loading spinner.

---

## 4. Technical Architecture & Data Strategy

### System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Browser (PWA)                          │
│                                                                        │
│   ┌────────────────────┐          ┌────────────────────────────────┐   │
│   │ Camera / File Pick │ ───────► │ Local Canvas Image Optimizer   │   │
│   └────────────────────┘          └───────────────┬────────────────┘   │
│                                                   │                    │
│                                                   ▼                    │
│                                   ┌────────────────────────────────┐   │
│                                   │ Client / Server Tesseract OCR  │   │
│                                   │ (Raw Text Extraction)          │   │
│                                   └───────────────┬────────────────┘   │
│                                                   │                    │
│                                    Parsed Recipe  │ Raw OCR Text       │
│                                                   ▼                    │
│                                   ┌────────────────────────────────┐   │
│                                   │ Recipe Editor View (Immediate) │   │
│                                   └───────────────┬────────────────┘   │
└───────────────────────────────────────────────────┼────────────────────┘
                                                    │
                                                    ▼ POST /api/v1/recipes/ai-refine
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Backend & AI Tier                       │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Gemini Culinary Editor Service                                 │   │
│   │ (gemini-3.8-flash -> gemini-3.1-flash-lite cascade)            │   │
│   │                                                                │   │
│   │ • Corrects OCR misreads (1/2 cup vs 12 cup, flour vs f1our)    │   │
│   │ • Normalizes units (ml, g, oz, tbsp, tsp)                      │   │
│   │ • Assigns storage locations (PANTRY, FRIDGE, FREEZER)          │   │
│   │ • Bilingual translation (French/English)                       │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│                                   ▼ Enhanced Structured Recipe         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ SQLCipher Database Store (Local Persistence)                   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key API & Component Enhancements

1. **New Refinement Endpoint**:
   - `POST /api/v1/recipes/ai-refine`: Accepts extracted raw OCR text, language preference, and optional image thumbnail. Uses Gemini with a specialized proofreading & culinary standardization prompt.
2. **Local OCR Pipeline Priority**:
   - Updates `parseRecipeFromPhoto` to execute local OCR first, construct the baseline recipe model, and dispatch the background double-check to Gemini.
3. **Editor Component Upgrade**:
   - Updates `AddRecipeModal.tsx` to handle the dual-stage progression: showing instant OCR extraction, displaying an animated validation indicator, and applying Gemini corrections cleanly.
