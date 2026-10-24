import { GoogleGenAI, Type } from "@google/genai";
import Tesseract from "tesseract.js";
import { validateSafeExternalUrl, safeFetch } from "./ssrfGuard.js";
import {
  getBilingualNames,
  translateFoodItem,
  parseIngredientString,
  detectIngredientStorage,
  translateCookingStepToFrench,
  translateCookingStepToEnglish,
  isTextFrench,
  isTextTagalog,
  translateTagalogToEnglish,
  translateTagalogToFrench,
  cleanDuplicatedNotes,
  translateRecipeTitleToEnglish,
  translateRecipeTitleToFrench,
  translateRecipeDescriptionToEnglish,
  translateRecipeDescriptionToFrench,
} from "./foodTranslator.js";
import { dbStore } from "./dbStore.js";
import { estimateRecipeNutrition } from "./nutritionEngine.js";

/**
 * Pantryo - Gemini Recipe Parser Service
 * Uses Google Gemini (gemini-3.8-flash via @google/genai) and Tesseract OCR to parse recipes from:
 * 1. YouTube video links / transcripts / descriptions
 * 2. Personal recipe text / notes
 * 3. Photos of cookbook pages, handwritten recipe cards, or magazine clippings
 */

let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.startsWith("your_")) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing. Please configure it in your environment or Settings > Secrets."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export function resetGeminiClient() {
  aiClient = null;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Parse recipe from Text or YouTube Context
 */
export async function parseRecipeFromText({
  text,
  youtubeUrl = null,
  source = "Personal",
  language = "EN",
}) {
  const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback demo parser if API key is not configured
  if (!apiKey || apiKey.length < 10) {
    const directRecipe = parseRecipeTextDirectly(text, {
      language,
      source: youtubeUrl ? "YouTube" : source,
      youtubeUrl,
      youtubeId,
    });
    return {
      success: true,
      recipe: directRecipe,
    };
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are Pantryo's master culinary archivist, bilingual chef, and recipe digitizer.
Your mission is to take raw recipe text, YouTube video information, or transcripts and transform them into a complete, structured recipe JSON.

Important instructions:
1. Extract or infer:
   - title: Clear, mouthwatering recipe name in English.
   - titleFr: French translation of the title.
   - descriptionEn: Appetizing 2-sentence summary of the dish.
   - descriptionFr: French 2-sentence summary.
   - prepTime: e.g., "15 mins"
   - cookTime: e.g., "25 mins"
   - totalTime: e.g., "40 mins"
   - servings: e.g., "4 servings"
   - difficulty: "Easy", "Medium", or "Advanced"
   - difficultyFr: "Facile", "Moyen", or "Avancé"
   - calories: e.g., "420 kcal"
   - tags: array of 3-5 tags (e.g., ["Weeknight", "High-Protein", "Comfort Food"])
2. Ingredients list:
   - name: clear ingredient name (e.g. "Wild Salmon Fillets", "Extra Virgin Olive Oil", "Garlic Cloves")
   - nameFr: French ingredient name
   - amount: exact quantity (e.g. "4 fillets (approx. 600g)", "2 tbsp", "3 cloves minced")
   - category: One of "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry", "Beverages", "Frozen Foods", "Condiments"
   - locationType: Optimal kitchen storage location: "FRIDGE", "FREEZER", or "PANTRY"
3. Instructions list:
   - instructionsEn: Detailed step-by-step numbered instructions.
   - instructionsFr: French translation of step-by-step instructions.
4. If this is from YouTube (${youtubeUrl ? `YouTube URL: ${youtubeUrl}` : "no URL"}), make sure the instructions are clear and complete.

Always output valid structured JSON conforming to the schema.`;

  const prompt = `Please parse and structure this recipe thoroughly into complete JSON:

${youtubeUrl ? `YouTube Source URL: ${youtubeUrl}` : ""}
Recipe Text & Details:
${text || "Classic homemade comfort recipe"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            titleFr: { type: Type.STRING },
            descriptionEn: { type: Type.STRING },
            descriptionFr: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            cookTime: { type: Type.STRING },
            totalTime: { type: Type.STRING },
            servings: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            difficultyFr: { type: Type.STRING },
            calories: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  nameFr: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  category: { type: Type.STRING },
                  locationType: { type: Type.STRING },
                },
                required: ["name", "amount", "category", "locationType"],
              },
            },
            instructionsEn: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            instructionsFr: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "title",
            "titleFr",
            "descriptionEn",
            "ingredients",
            "instructionsEn",
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Gemini returned empty response text");
    }

    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleanJson);

    return {
      success: true,
      recipe: normalizeRecipeOutput(parsed, {
        youtubeUrl,
        youtubeId,
        source: youtubeUrl ? "YouTube" : source,
      }),
    };
  } catch (error) {
    console.error("[Gemini Recipe Parser] Error parsing text via AI, falling back to direct culinary parser:", error);
    const directRecipe = parseRecipeTextDirectly(text, {
      language,
      source: youtubeUrl ? "YouTube" : source,
      youtubeUrl,
      youtubeId,
    });
    return {
      success: true,
      recipe: directRecipe,
    };
  }
}

/**
 * Parse recipe from an image (photo of cookbook, recipe card, or finished dish)
 */
export async function parseRecipeFromPhoto({
  imageBase64,
  mimeType = "image/jpeg",
  notes = "",
  language = "EN",
}) {
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
  const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`;
  const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
  const localVisionUrl = (process.env.LOCAL_GEMMA_URL || dbStore?.systemSettings?.localVisionUrl || "").trim();
  const visionProvider = dbStore?.systemSettings?.aiVisionProvider || (localVisionUrl ? "local_gemma" : "gemini");

  // 1. If Local Open-Source Gemma / PaliGemma endpoint is configured and active, try it first
  if (visionProvider === "local_gemma" && localVisionUrl) {
    try {
      console.info(`[Gemma Vision] Attempting local open-source vision scan via ${localVisionUrl}...`);
      const gemmaResult = await parseWithLocalGemma({
        imageBase64: cleanBase64,
        endpoint: localVisionUrl,
        model: dbStore?.systemSettings?.localVisionModel || "paligemma",
        notes,
        language,
      });
      if (gemmaResult && gemmaResult.recipe) {
        return {
          success: true,
          provider: "local_gemma",
          recipe: normalizeRecipeOutput(gemmaResult.recipe, {
            source: "Local Gemma Vision",
            imageUrl,
            language,
          }),
        };
      }
    } catch (gemmaErr) {
      console.warn("[Gemma Vision] Local open-source Gemma scan failed, falling back to Gemini/Tesseract:", gemmaErr.message);
    }
  }

  // 2. If Gemini API key is configured and appears valid, run high-accuracy Gemini 3.8 Flash Vision
  if (apiKey && apiKey.length > 10 && !apiKey.startsWith("your_") && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = getGeminiClient();

      const systemInstruction = `You are Pantryo's master culinary archivist, high-precision OCR specialist, and bilingual chef.
Your mission is to inspect photos of printed cookbook pages, magazine clippings, recipe printouts, and handwritten family cards, and convert them into a complete structured recipe JSON.

CRITICAL INSTRUCTIONS FOR REAL-WORLD RECIPE PHOTOS:
1. PLASTIC SLEEVES & SPECULAR GLARE:
   The recipe may be inside a transparent plastic sheet protector, binder sleeve, or laminated film with harsh overhead light reflections, glares, or hot spots.
   Use the surrounding culinary context, sentence flow, ingredient patterns, and cooking techniques to deduce and extrapolate any partially obscured words or letters (e.g. "fineCooking", "Chinese Restaurant-Style", "all-purpose flour", "melt butter").

2. COLORED COOKBOOK PAPER & CURVED GUTTER SHADOWS:
   Pages may be printed on colored backgrounds (e.g., pale blue, deep amber, warm orange, yellow, or beige) with shadows along the book spine/gutter.
   Disregard page numbers (e.g., '220', '221', 'Page 1 of 1'), website URLs, print timestamps, and decorative book running headers. Focus strictly on the culinary recipe title, times, servings, ingredients, and instructions.

3. HANDWRITTEN PEN ANNOTATIONS & SUBSTITUTIONS:
   The recipe may have handwritten pen or pencil notes, additions, substitutions, or quantity corrections written in margins, next to ingredients, or between lines (for example: blue or purple ink notes like "- 3 slices", "- 3 cups", "1 or just either one 3/8 (6 tbsp)", "2 pcs").
   YOU MUST PRESERVE AND MERGE THESE HANDWRITTEN NOTES!
   - Merge the handwritten quantity or modification directly into the ingredient amount or name (e.g., "3/4 cup (3oz) shredded Cheddar cheese (note: 3 slices)", "6 to 8 cups beef broth (note: reduced to 3 cups)").
   - Set "hasHandwrittenNotes": true and summarize all detected pen/pencil additions in "handwrittenNotesSummary".

4. BILINGUAL EXCELLENCE (EN & FR):
   Provide titles, descriptions, ingredient names, and instructions in both English and French (title/titleFr, descriptionEn/descriptionFr, instructionsEn/instructionsFr).

5. INGREDIENT LOCATION & CATEGORIES:
   Assign each ingredient an optimal storage location ("FRIDGE", "FREEZER", "PANTRY") and category ("Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry", "Frozen Foods", "Condiments", "Beverages").`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: `Transcribe and digitize this recipe photo. Look carefully for any handwritten pen notes, plastic sleeve glare, or cookbook times/servings. User notes: ${notes || "None"}.`,
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              titleFr: { type: Type.STRING },
              descriptionEn: { type: Type.STRING },
              descriptionFr: { type: Type.STRING },
              prepTime: { type: Type.STRING },
              cookTime: { type: Type.STRING },
              totalTime: { type: Type.STRING },
              servings: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              difficultyFr: { type: Type.STRING },
              calories: { type: Type.STRING },
              hasHandwrittenNotes: { type: Type.BOOLEAN },
              handwrittenNotesSummary: { type: Type.STRING },
              recipeNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nameFr: { type: Type.STRING },
                    amount: { type: Type.STRING },
                    category: { type: Type.STRING },
                    locationType: { type: Type.STRING },
                  },
                  required: ["name", "amount", "category", "locationType"],
                },
              },
              instructionsEn: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              instructionsFr: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "descriptionEn", "ingredients", "instructionsEn"],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const parsed = JSON.parse(cleanJson);
        return {
          success: true,
          provider: "gemini_flash",
          recipe: normalizeRecipeOutput(parsed, {
            source: "Photo Import",
            imageUrl,
            language,
          }),
        };
      }
    } catch (error) {
      console.warn("[Gemini Recipe Parser] Gemini Vision attempt failed, switching to local OCR & Parser:", error.message);
    }
  }

  // 3. Embedded Local Tesseract OCR fallback: reads actual handwritten cards & cookbook pages
  console.info("[Gemini Recipe Parser] Running Tesseract OCR on recipe image (eng+fra+spa)...");
  try {
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    // Use stable languages: english, french, spanish (tagalog is not hosted on cdn and causes 404)
    const ocrResult = await Tesseract.recognize(imageBuffer, "eng+fra+spa");
    const ocrText = ocrResult?.data?.text?.trim() || "";
    console.info(`[Gemini Recipe Parser] Tesseract extracted ${ocrText.length} characters.`);

    const combinedText = (ocrText + (notes ? "\n" + notes : "")).trim();
    if (!combinedText || combinedText.length < 8) {
      throw new Error(
        language === "FR"
          ? "Aucun texte lisible détecté sur cette photo. Assurez-vous d'un bon éclairage et que la recette écrite est bien nette, ou entrez le texte dans l'onglet Texte / Notes."
          : "No readable recipe text was detected on this photo. Please ensure good lighting and clear handwriting/print, or enter the text in the Text tab."
      );
    }

    const structuredRecipe = parseRecipeTextDirectly(combinedText, {
      language,
      source: "Photo Import (OCR)",
      imageUrl,
    });

    return {
      success: true,
      provider: "tesseract_ocr",
      recipe: structuredRecipe,
      ocrText,
    };
  } catch (ocrError) {
    console.error("[Gemini Recipe Parser] OCR extraction failed:", ocrError.message);
    throw new Error(
      ocrError.message ||
        (language === "FR"
          ? "Impossible d'extraire la recette de cette photo. Vérifiez la netteté de l'image."
          : "Unable to extract recipe from this photo. Please check image clarity.")
    );
  }
}

/**
 * Open-source Gemma / PaliGemma local vision parser (supports Ollama and OpenAI-compatible vision servers)
 */
async function parseWithLocalGemma({ imageBase64, endpoint, model = "paligemma", notes = "", language = "EN" }) {
  const url = endpoint.replace(/\/+$/, "");
  const isOllamaNative = !url.endsWith("/v1");

  const prompt = `Transcribe this recipe photo into structured text including Title, Prep Time, Cook Time, Servings, Ingredients list with measurements and any handwritten pen notes, and step-by-step numbered Instructions. Notes: ${notes || "None"}.`;

  let extractedText = "";

  if (isOllamaNative) {
    // Ollama /api/generate endpoint
    const ollamaUrl = `${url}/api/generate`;
    const res = await safeFetch(ollamaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "paligemma",
        prompt,
        images: [imageBase64],
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama HTTP error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    extractedText = data.response || "";
  } else {
    // OpenAI-compatible /v1/chat/completions endpoint
    const chatUrl = `${url}/chat/completions`;
    const res = await safeFetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "paligemma",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI-compatible HTTP error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    extractedText = data.choices?.[0]?.message?.content || "";
  }

  if (!extractedText || extractedText.trim().length < 10) {
    throw new Error("Local Gemma returned empty OCR text");
  }

  const recipe = parseRecipeTextDirectly(extractedText, {
    language,
    source: "Local Gemma Vision",
  });

  return { recipe, rawText: extractedText };
}

/**
 * Normalizes and validates the parsed recipe object with full bilingual compliance
 */
function normalizeRecipeOutput(parsed, extra = {}) {
  const id = parsed.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const youtubeId = extra.youtubeId || parsed.youtubeVideoId || null;
  const youtubeUrl = extra.youtubeUrl || parsed.youtubeUrl || null;

  // Auto-generate YouTube thumbnail if available
  let imageUrl = extra.imageUrl || parsed.imageUrl;
  if (!imageUrl && youtubeId) {
    imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (!imageUrl) {
    imageUrl = "";
  }

  const servingsNum = parseInt(`${parsed.servings || "4"}`.replace(/\D/g, ""), 10) || 4;
  const appLang = (extra.language || parsed.language || "FR").toUpperCase() === "FR" ? "FR" : "EN";

  // Determine base recipe language
  const rawTitleCandidate = (parsed.title || parsed.titleFr || "").trim();
  const isTagalog = isTextTagalog(rawTitleCandidate) || (Array.isArray(parsed.tags) && parsed.tags.some(t => isTextTagalog(t)));
  const isFrench = !isTagalog && isTextFrench(parsed.titleFr || rawTitleCandidate);

  // Clean Titles
  let titleEn = (parsed.titleEn || (!isFrench ? (parsed.title || "") : "") || "").trim();
  let titleFr = (parsed.titleFr || (isFrench ? (parsed.title || "") : "") || "").trim();

  if (isTagalog) {
    if (!titleEn || isTextTagalog(titleEn)) {
      titleEn = cleanDuplicatedNotes(translateRecipeTitleToEnglish(rawTitleCandidate) || translateTagalogToEnglish(rawTitleCandidate) || rawTitleCandidate);
    }
    if (!titleFr || isTextTagalog(titleFr)) {
      titleFr = cleanDuplicatedNotes(translateRecipeTitleToFrench(rawTitleCandidate) || translateTagalogToFrench(rawTitleCandidate) || translateFoodItem(titleEn, "FR") || rawTitleCandidate);
    }
  } else if (isFrench) {
    if (!titleFr) titleFr = parsed.titleFr || rawTitleCandidate;
    if (!titleEn || (isTextFrench(titleEn) && titleEn.toLowerCase() === titleFr.toLowerCase())) {
      titleEn = cleanDuplicatedNotes(translateRecipeTitleToEnglish(titleFr) || translateFoodItem(titleFr, "EN") || rawTitleCandidate);
    }
  } else {
    // English
    if (!titleEn) titleEn = parsed.title || parsed.titleEn || rawTitleCandidate;
    if (!titleFr || !isTextFrench(titleFr) || titleFr.toLowerCase() === titleEn.toLowerCase()) {
      titleFr = cleanDuplicatedNotes(translateRecipeTitleToFrench(titleEn) || translateFoodItem(titleEn, "FR") || rawTitleCandidate);
    }
  }

  const rawIngredients = (parsed.ingredients || []).map((ing) => {
    let loc = (ing.locationType || "PANTRY").toUpperCase();
    if (!["FRIDGE", "FREEZER", "PANTRY", "SPICE_RACK"].includes(loc)) {
      loc = "FRIDGE";
    }

    const rawIngName = (ing.name || ing.nameFr || "Ingredient").trim();
    const rawIngFr = (ing.nameFr || "").trim();

    let ingEn = (ing.nameEn || (!isFrench ? (ing.name || "") : "") || "").trim();
    let ingFr = (ing.nameFr || (isFrench ? (ing.name || "") : "") || "").trim();

    if (ingEn && ingFr && ingEn.toLowerCase() !== ingFr.toLowerCase()) {
      // Both distinct and valid, preserve both
    } else if (isTextTagalog(rawIngName) || isTextTagalog(rawIngFr) || isTagalog) {
      const candidate = rawIngName || rawIngFr;
      if (!ingEn || isTextTagalog(ingEn)) ingEn = cleanDuplicatedNotes(translateTagalogToEnglish(candidate) || candidate);
      if (!ingFr || isTextTagalog(ingFr)) ingFr = cleanDuplicatedNotes(translateTagalogToFrench(candidate) || translateFoodItem(ingEn, "FR") || candidate);
    } else if (isFrench) {
      if (!ingFr) ingFr = rawIngFr || rawIngName;
      if (!ingEn || ingEn.toLowerCase() === ingFr.toLowerCase()) {
        ingEn = cleanDuplicatedNotes(translateFoodItem(ingFr, "EN") || ingFr);
      }
    } else {
      // English
      if (!ingEn) ingEn = ing.name || rawIngName;
      if (!ingFr || ingFr.toLowerCase() === ingEn.toLowerCase()) {
        ingFr = cleanDuplicatedNotes(translateFoodItem(ingEn, "FR") || ingEn);
      }
    }

    const activeIngName = appLang === "FR" ? (ingFr || ingEn || "Ingrédient") : (ingEn || ingFr || "Ingredient");
    return {
      name: activeIngName,
      nameEn: ingEn || "Ingredient",
      nameFr: ingFr || "Ingrédient",
      amount: ing.amount || "1",
      unit: ing.unit || "",
      category: ing.category || "Pantry",
      locationType: loc,
      storage: ing.storage || (loc === "SPICE_RACK" ? "spices" : loc.toLowerCase()),
      prepNotes: ing.prepNotes || "",
    };
  });

  // Calculate Method A: AI Auto-Estimation nutrition
  const recipeTitle = titleEn || "Custom Homemade Recipe";
  const nutrition = estimateRecipeNutrition(recipeTitle, rawIngredients, servingsNum);

  // Attach estimatedKcal and macros to ingredients
  const ingredients = rawIngredients.map((ing, idx) => {
    const nut = nutrition.ingredients && nutrition.ingredients[idx];
    return {
      ...ing,
      estimatedKcal: nut ? nut.estimatedKcal : 80,
      proteinGrams: nut ? nut.proteinGrams : 5,
      carbsGrams: nut ? nut.carbsGrams : 10,
      fatGrams: nut ? nut.fatGrams : 3,
    };
  });

  // Instructions translation
  const rawStepsEn = Array.isArray(parsed.instructionsEn) ? parsed.instructionsEn : (Array.isArray(parsed.instructions) && !isFrench ? parsed.instructions : []);
  const rawStepsFr = Array.isArray(parsed.instructionsFr) ? parsed.instructionsFr : (Array.isArray(parsed.instructions) && isFrench ? parsed.instructions : []);

  let instructionsEn = [];
  let instructionsFr = [];

  if (isTagalog) {
    const sourceSteps = rawStepsEn.length > 0 ? rawStepsEn : rawStepsFr;
    instructionsEn = rawStepsEn.length > 0 && !rawStepsEn.every(s => isTextTagalog(s))
      ? rawStepsEn
      : sourceSteps.map(s => translateCookingStepToEnglish(s) || s);
    instructionsFr = rawStepsFr.length > 0 && !rawStepsFr.every(s => isTextTagalog(s))
      ? rawStepsFr
      : sourceSteps.map(s => translateCookingStepToFrench(s) || s);
  } else if (isFrench) {
    instructionsFr = rawStepsFr.length > 0 ? rawStepsFr : rawStepsEn;
    if (rawStepsEn.length > 0 && !rawStepsEn.every(s => isTextFrench(s))) {
      instructionsEn = rawStepsEn;
    } else {
      instructionsEn = instructionsFr.map(s => translateCookingStepToEnglish(s) || s);
    }
  } else {
    // English
    instructionsEn = rawStepsEn.length > 0 ? rawStepsEn : rawStepsFr;
    if (rawStepsFr.length > 0 && rawStepsFr.some(s => isTextFrench(s))) {
      instructionsFr = rawStepsFr;
    } else {
      instructionsFr = instructionsEn.map(s => translateCookingStepToFrench(s) || s);
    }
  }

  if (instructionsEn.length === 0) {
    instructionsEn = ["Prepare ingredients according to recipe directions.", "Cook thoroughly and serve hot."];
  }
  if (instructionsFr.length === 0) {
    instructionsFr = ["Préparer les ingrédients selon les étapes indiquées.", "Bien cuire et servir chaud."];
  }

  const activeTitle = appLang === "FR" ? (titleFr || titleEn) : (titleEn || titleFr);
  return {
    id,
    title: activeTitle,
    titleEn,
    titleFr,
    ricardoUrlEn: youtubeUrl || "",
    ricardoUrlFr: youtubeUrl || "",
    youtubeUrl: youtubeUrl || null,
    youtubeVideoId: youtubeId || null,
    imageUrl,
    time: parsed.totalTime || parsed.cookTime || "30 mins",
    prepTime: parsed.prepTime || "10 mins",
    cookTime: parsed.cookTime || "20 mins",
    servings: parsed.servings || `${servingsNum} servings`,
    difficulty: parsed.difficulty || "Easy",
    difficultyFr: parsed.difficultyFr || "Facile",
    calories: `${nutrition.caloriesPerServing} kcal`,
    caloriesPerServing: nutrition.caloriesPerServing,
    totalCalories: nutrition.totalCalories,
    macrosPerServing: nutrition.macrosPerServing,
    totalMacros: nutrition.totalMacros,
    calculationMethod: "AI_ESTIMATED",
    nutrition,
    source: extra.source || parsed.source || "Personal",
    isRicardoOfficial: false,
    isCustom: true,
    descriptionEn: parsed.descriptionEn || `Delicious ${titleEn} saved to your kitchen.`,
    descriptionFr: parsed.descriptionFr || `Délicieuse recette de ${titleFr} enregistrée dans votre cuisine.`,
    tags: parsed.tags || [extra.source || "Personal", "Custom Recipe"],
    ingredients,
    instructionsEn,
    instructionsFr,
    suggestedPantryNeeds: ingredients.filter((i) => i.locationType === "PANTRY").map((i) => i.name).slice(0, 3),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Intelligent parser that converts text or OCR output into a structured RicardoRecipe
 */
export function parseRecipeTextDirectly(text, { language = "EN", source = "Personal", imageUrl = null, youtubeUrl = null, youtubeId = null, reason = "" } = {}) {
  const clean = (text || "").trim();
  if (!clean || clean.length < 5) {
    throw new Error(
      language === "FR"
        ? "Texte ou photo insuffisants pour extraire une recette. Veuillez fournir une photo nette ou du texte plus détaillé."
        : "Insufficient text or photo to extract a recipe. Please provide a clear photo or more detailed text."
    );
  }

  const rawLines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Filter out OCR border/binder-ring noise, print timestamps, and URLs
  const lines = rawLines.filter((l) => {
    // Drop URLs or page numbers
    if (/^https?:\/\/|www\./i.test(l)) return false;
    if (/^page\s+\d+\s+of\s+\d+/i.test(l) || /^\d{4}-\d{2}-\d{2}.*\d{1,2}:\d{2}/i.test(l)) return false;
    // Drop binder edge artifacts with high symbol count
    const symbolMatches = l.match(/[|!\\\/\[\]{}~*_=+^#<>;]/g);
    if (symbolMatches && symbolMatches.length > l.length * 0.2) return false;
    // Drop lines with high concentration of short 1-2 character words (typical of binder rings / margin OCR artifacts)
    const words = l.split(/\s+/).filter(Boolean);
    if (words.length >= 3) {
      const shortWords = words.filter((w) => w.length <= 2);
      if (shortWords.length / words.length >= 0.45) return false;
    }
    // Drop lines that are pure uppercase non-title noise
    if (words.length >= 4 && words.every((w) => w === w.toUpperCase() && w.length <= 4)) return false;
    return true;
  });

  // Extract Title candidate
  let titleCandidate = "";
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i];
    const prefixMatch = l.match(/^(?:recette|recipe|titre|title)\s*[:\-]\s*(.+)$/i);
    if (prefixMatch) {
      titleCandidate = prefixMatch[1].trim();
      break;
    }
  }

  // If no prefix, pick the first line that is a recognizable dish name
  if (!titleCandidate) {
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const l = lines[i];
      // Skip meta indicators like Course, Cuisine, Author, Rating
      if (/^(?:ingr|direct|instruct|step|étap|temps|time|serv|port|prep|cuiss|course|cuisine|author|calories|star|rating)/i.test(l)) {
        continue;
      }
      const words = l.split(/\s+/).filter(Boolean);
      // Skip if line looks like header noise
      if (words.length >= 2 && words.filter((w) => w.length <= 2).length / words.length > 0.4) {
        continue;
      }
      if (l.length >= 4 && l.length <= 80 && /[aeiouy]/i.test(l)) {
        titleCandidate = l.replace(/^[-*•#\d.]+\s*/, "").trim();
        break;
      }
    }
  }
  if (!titleCandidate || titleCandidate.length < 3) {
    titleCandidate = language === "FR" ? "Recette maison numérisée" : "Scanned Homemade Recipe";
  }

  // Extract prep/cook time, servings, and calories
  let prepTime = "10 mins";
  let cookTime = "20 mins";
  let servings = "4";

  for (const line of lines) {
    const prepMatch = line.match(/(?:prep(?:aration)?|prép(?:aration)?)\s*[:\-]?\s*(\d+\s*(?:min|m|h|hr|minutes?|heures?))/i);
    if (prepMatch) prepTime = prepMatch[1].trim();

    const cookMatch = line.match(/(?:cook(?:ing)?|cuisson)\s*[:\-]?\s*(\d+\s*(?:min|m|h|hr|minutes?|heures?))/i);
    if (cookMatch) cookTime = cookMatch[1].trim();

    const totalMatch = line.match(/(?:total(?:\s*time)?|durée\s*totale)\s*[:\-]?\s*(\d+\s*(?:min|m|h|hr|minutes?|heures?))/i);
    if (totalMatch && !cookMatch) cookTime = totalMatch[1].trim();

    const servMatch = line.match(/(?:servings?|portions?|pour)\s*[:\-]?\s*(\d+(?:\s*[-àa]\s*\d+)?\s*(?:personnes?|portions?|servings?)?)/i);
    if (servMatch) servings = servMatch[1].trim();
  }

  // Section splitting
  const ingredients = [];
  const instructions = [];
  let descriptionLines = [];
  let tags = [source, "Custom Recipe"];
  let hasHandwrittenNotes = false;
  let handwrittenNotesList = [];
  let currentSection = "header";

  const ingredientKeywords = /^(?:ingr[ée]dients?|composants?|what you need|items?|ingredients list)\b/i;
  const instructionKeywords = /^(?:instructions?|[ée]tapes?|directions?|pr[ée]paration|m[ée]thode|steps?|procedure|cooking steps|r[ée]alisation)\b/i;
  const notesOrNutritionKeywords = /^(?:notes?|remarques?|nutrition|calories?)\b/i;

  for (const line of lines) {
    if (line === titleCandidate || line.toLowerCase().startsWith("title:") || line.toLowerCase().startsWith("titre:")) {
      continue;
    }

    if (ingredientKeywords.test(line)) {
      currentSection = "ingredients";
      continue;
    }
    if (instructionKeywords.test(line)) {
      currentSection = "instructions";
      continue;
    }
    if (notesOrNutritionKeywords.test(line)) {
      currentSection = "notes";
      continue;
    }

    // In header/intro area before Ingredients
    if (currentSection === "header") {
      const courseMatch = line.match(/(?:course|service|type)\s*[:\-]\s*(.+)$/i);
      if (courseMatch) {
        tags.push(...courseMatch[1].split(/[,/]/).map((t) => t.trim()).filter(Boolean));
        continue;
      }
      const cuisineMatch = line.match(/(?:cuisine|pays)\s*[:\-]\s*(.+)$/i);
      if (cuisineMatch) {
        tags.push(cuisineMatch[1].trim());
        continue;
      }
      // If line is descriptive text (e.g. "This fabulous creamy homemade cheese sauce...")
      if (!/^(?:author|prep|cook|serv|total|calor)/i.test(line) && line.length > 20) {
        descriptionLines.push(line);
        continue;
      }
      // Check if line looks like an ingredient bullet even if header was missed
      if (/^[-*•]\s*\d+/.test(line)) {
        currentSection = "ingredients";
      } else {
        continue;
      }
    }

    const isStepNumber = /^(\d+[\.\)]|step\s*\d+|étape\s*\d+)/i.test(line);
    const hasCookingAction = /\b(mélanger|cuire|faire chauffer|préchauffer|enfourner|verser|ajouter|assaisonner|battre|sauter|rôtir|mijoter|mix|cook|bake|heat|preheat|stir|pour|add|season|whisk|sauté|simmer|roast|fry)\b/i.test(line);

    if (currentSection !== "instructions" && (isStepNumber || (hasCookingAction && line.length > 30))) {
      currentSection = "instructions";
    }

    if (currentSection === "ingredients") {
      const cleanLine = line.replace(/^[-*•+–—\s]+/, "").trim();
      if (cleanLine.length < 2) continue;

      // Detect handwritten additions / annotations (e.g. "- 3 slices", "1 or just either one", "- 3 cups", "2 pcs")
      const noteMatch = cleanLine.match(/[-–—]\s*(\d+\s*(?:slices?|cups?|tasses?|tranches?|pcs?|morceaux?|tbsp|c\.\s*à\s*s\.|g|oz)|(?:or\s+just\s+either\s+one|ou\s+l'un\s+des\s+deux))/i);
      if (noteMatch) {
        hasHandwrittenNotes = true;
        handwrittenNotesList.push(cleanLine);
      }

      const amountRegex = /^((?:\d+(?:[.,/]\d+)?(?:\s*-\s*\d+)?|\d+\/\d+|\d+\s+\d+\/\d+|un|une|one|a|half|demi)\s*(?:c\.\s*à\s*(?:soupe|café|thé)|cuill[eè]res?\s*à\s*(?:soupe|café|thé)|tbsp|tsp|tbs|t|c\.|cups?|tasses?|ml|cl|dl|l|litres?|liters?|g|gr|kg|kilos?|oz|ounces?|lbs?|livres?|pinc[ée]es?|pinch|gousses?|cloves?|tranches?|slices?|bo[iî]tes?|cans?|paquets?|packets?|sachets?|morceaux?|pieces?)?)\s*(?:de\s+|d'|of\s+)?(.*)$/i;
      const match = cleanLine.match(amountRegex);

      let amount = "To taste";
      let name = cleanLine;

      if (match && match[1] && match[2] && match[2].trim().length > 1) {
        amount = match[1].trim();
        name = match[2].trim();
      }

      const lowerName = name.toLowerCase();
      let category = "Pantry";
      let locationType = "PANTRY";

      if (/(beurre|butter|lait|milk|cream|crème|cheese|fromage|egg|oeuf|œuf|yogourt|yogurt)/.test(lowerName)) {
        category = "Dairy & Eggs";
        locationType = "FRIDGE";
      } else if (/(chicken|poulet|beef|boeuf|bœuf|pork|porc|fish|poisson|shrimp|crevette|salmon|saumon|steak|meat|viande|bacon|dinde|turkey|veal|veau)/.test(lowerName)) {
        category = "Meat & Seafood";
        locationType = "FRIDGE";
      } else if (/(pomme|apple|onion|oignon|garlic|ail|tomate|tomato|spinach|épinard|carrot|carotte|potato|pomme de terre|citron|lemon|lime|herbe|herb|basil|parsley|persil|rosemary|romarin|salade|lettuce|poivron|pepper|champignon|mushroom|beans|haricots?|bok choy|scallion|thyme|thym)/.test(lowerName)) {
        category = "Produce";
        locationType = /(potato|pomme de terre|onion|oignon|garlic|ail)/.test(lowerName) ? "PANTRY" : "FRIDGE";
      } else if (/(ice cream|glace|congel|frozen|petits pois surgel)/.test(lowerName)) {
        category = "Frozen Foods";
        locationType = "FREEZER";
      } else if (/(pain|bread|baguette|croissant|tortilla|brioche|croûte|crust|pâte)/.test(lowerName)) {
        category = "Bakery";
        locationType = "PANTRY";
      } else if (/(flour|farine|sugar|sucre|oil|huile|vinegar|vinaigre|pasta|pâtes|rice|riz|salt|sel|poivre|pepper|bouillon|broth|sauce|spices|épices|vanilla|vanille|levure|yeast|wine|vin|honey|miel|cayenne)/.test(lowerName)) {
        category = "Pantry";
        locationType = "PANTRY";
      }

      const biling = getBilingualNames(name, language);
      const activeIng = language === "FR" && biling.nameFr ? biling.nameFr : (biling.nameEn || name);
      ingredients.push({
        name: activeIng,
        nameEn: biling.nameEn || name,
        nameFr: biling.nameFr || name,
        amount,
        category,
        locationType,
      });
    } else if (currentSection === "instructions") {
      const cleanStep = line.replace(/^[-*•\d.)\s]+/, "").trim();
      if (cleanStep.length > 5) {
        instructions.push(cleanStep);
      }
    }
  }

  const titleBiling = getBilingualNames(titleCandidate, language);
  const resolvedTitleEn = titleBiling.nameEn || titleCandidate;
  const resolvedTitleFr = titleBiling.nameFr || titleCandidate;

  if (ingredients.length === 0 && instructions.length > 0) {
    ingredients.push({
      name: resolvedTitleEn,
      nameFr: resolvedTitleFr,
      amount: "1 portion",
      category: "Pantry",
      locationType: "PANTRY",
    });
  }
  if (instructions.length === 0) {
    instructions.push(
      language === "FR"
        ? "Préparer tous les ingrédients selon la recette. Cuire et servir chaud."
        : "Prepare all ingredients according to recipe directions. Cook and serve hot."
    );
  }

  const isFrench = language === "FR" || isTextFrench(titleCandidate) || isTextFrench(clean);
  const recipeId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const directActiveTitle = language === "FR" && resolvedTitleFr ? resolvedTitleFr : (resolvedTitleEn || resolvedTitleFr);
  return {
    id: recipeId,
    title: directActiveTitle,
    titleEn: resolvedTitleEn,
    titleFr: resolvedTitleFr,
    ricardoUrlEn: youtubeUrl || "",
    ricardoUrlFr: youtubeUrl || "",
    youtubeUrl: youtubeUrl || null,
    youtubeVideoId: youtubeId || null,
    imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ""),
    time: cookTime,
    prepTime,
    cookTime,
    servings,
    difficulty: "Easy",
    difficultyFr: "Facile",
    calories: "450 kcal",
    source,
    isRicardoOfficial: false,
    isCustom: true,
    descriptionEn: descriptionLines.length > 0 ? descriptionLines.join(" ") : `Homemade ${titleCandidate} digitized from your personal recipe.`,
    descriptionFr: descriptionLines.length > 0 ? descriptionLines.join(" ") : `${titleCandidate} maison numérisée à partir de votre fiche de recette.`,
    tags: Array.from(new Set(tags)),
    hasHandwrittenNotes,
    handwrittenNotesSummary: hasHandwrittenNotes ? handwrittenNotesList.join("; ") : undefined,
    ingredients,
    instructionsEn: isFrench ? instructions.map(s => translateCookingStepToEnglish(s) || s) : instructions,
    instructionsFr: isFrench ? instructions : instructions.map(s => translateCookingStepToFrench(s) || s),
    suggestedPantryNeeds: ingredients.filter((i) => i.locationType === "PANTRY").map((i) => i.name).slice(0, 3),
    rawOcrText: clean,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generates an intelligent recipe by parsing rawText directly instead of returning static mock data
 */
function generateFallbackRecipe({
  rawText = "",
  youtubeUrl = null,
  youtubeId = null,
  source = "Personal",
  language = "EN",
  reason = "Demo parsed recipe",
}) {
  const directRecipe = parseRecipeTextDirectly(rawText || "Homemade Family Dish\n1 cup flour\nMix and bake", {
    language,
    source: youtubeUrl ? "YouTube" : source,
    youtubeUrl,
    youtubeId,
    reason,
  });

  return {
    success: true,
    notice: reason,
    recipe: directRecipe,
  };
}

/**
 * Helper to extract Schema.org Recipe JSON-LD
 */
function findRecipeInJsonLd(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const res = findRecipeInJsonLd(item);
      if (res) return res;
    }
    return null;
  }
  if (typeof data === "object") {
    if (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe"))) {
      return data;
    }
    if (data["@graph"] && Array.isArray(data["@graph"])) {
      return findRecipeInJsonLd(data["@graph"]);
    }
  }
  return null;
}

/**
 * Helper to extract lists of recipes from Schema.org ItemList or Graph
 */
function extractRecipesFromJsonLdList(data) {
  const results = [];
  if (!data) return results;
  if (Array.isArray(data)) {
    for (const d of data) results.push(...extractRecipesFromJsonLdList(d));
    return results;
  }
  if (typeof data === "object") {
    if (data["@type"] === "Recipe" || (Array.isArray(data["@type"]) && data["@type"].includes("Recipe"))) {
      results.push({
        title: data.name || data.headline,
        url: data.url,
        image: typeof data.image === "string" ? data.image : data.image?.url || data.image?.[0],
        description: data.description,
      });
    }
    if (data.itemListElement && Array.isArray(data.itemListElement)) {
      for (const it of data.itemListElement) {
        if (it.item) results.push(...extractRecipesFromJsonLdList(it.item));
        else if (it.url) results.push({ title: it.name, url: it.url, image: it.image });
      }
    }
    if (data["@graph"] && Array.isArray(data["@graph"])) {
      for (const g of data["@graph"]) results.push(...extractRecipesFromJsonLdList(g));
    }
  }
  return results;
}

/**
 * Fetches live HTML and RSS feed from a website to discover actual recipes published on that site
 */
export async function fetchLiveWebsiteRecipes(urlOrDomain, query = "") {
  let cleanUrl = (urlOrDomain || "").trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }
  cleanUrl = await validateSafeExternalUrl(cleanUrl);
  let domain = "recipe website";
  let origin = cleanUrl;
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname.replace(/^www\./, "");
    origin = parsed.origin;
  } catch (e) {
    domain = cleanUrl.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
    origin = `https://${domain}`;
  }

  const discoveredItems = [];
  const seenUrls = new Set();

  // 1. Try RSS feed /feed/ or /rss
  try {
    const feedController = new AbortController();
    const feedTimeout = setTimeout(() => feedController.abort(), 4500);
    const feedRes = await safeFetch(`${origin}/feed/`, {
      signal: feedController.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(feedTimeout);
    if (feedRes.ok) {
      const feedXml = await feedRes.text();
      const itemMatches = [
        ...feedXml.matchAll(
          /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>(?:[\s\S]*?<description>(.*?)<\/description>)?/gi
        ),
      ];
      for (const it of itemMatches.slice(0, 10)) {
        const title = it[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim();
        const link = it[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
        const desc = it[3]
          ? it[3].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim().slice(0, 250)
          : "";
        if (title && link && !seenUrls.has(link)) {
          seenUrls.add(link);
          discoveredItems.push({
            title,
            url: link,
            description: desc,
            source: domain,
          });
        }
      }
    }
  } catch (err) {
    // RSS feed check optional
  }

  // 2. Fetch page HTML
  let pageTitle = "";
  try {
    const pageController = new AbortController();
    const pageTimeout = setTimeout(() => pageController.abort(), 6000);
    const pageRes = await safeFetch(cleanUrl, {
      signal: pageController.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(pageTimeout);

    if (pageRes.ok) {
      const html = await pageRes.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      // Check Schema.org ItemList or Recipe
      const jsonLdMatches = html.match(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      );
      if (jsonLdMatches) {
        for (const tag of jsonLdMatches) {
          const content = tag.replace(/<\/?script[^>]*>/gi, "").trim();
          try {
            const parsed = JSON.parse(content);
            const items = extractRecipesFromJsonLdList(parsed);
            for (const item of items) {
              if (item.url && !seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                discoveredItems.push({
                  title: item.title,
                  url: item.url,
                  image: item.image,
                  description: item.description || "",
                  source: domain,
                });
              }
            }
          } catch (e) {}
        }
      }

      // Check HTML links matching recipe patterns
      const linkMatches = [
        ...html.matchAll(
          /<a[^>]+href=["']([^"']*(?:recette|recipe|plat|repas|dish|cook|bake)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
        ),
      ];
      for (const m of linkMatches) {
        let href = m[1].trim();
        if (href.startsWith("/")) href = origin + href;
        if (!href.startsWith("http")) continue;
        const text = m[2].replace(/<[^>]+>/g, "").trim();
        if (text.length > 4 && text.length < 90 && !seenUrls.has(href)) {
          const lower = text.toLowerCase();
          if (
            !lower.includes("connexion") &&
            !lower.includes("login") &&
            !lower.includes("s'inscrire") &&
            !lower.includes("mentions") &&
            !lower.includes("contact") &&
            !lower.includes("newsletter") &&
            !lower.includes("privacy")
          ) {
            seenUrls.add(href);
            discoveredItems.push({
              title: text,
              url: href,
              source: domain,
            });
          }
        }
        if (discoveredItems.length >= 15) break;
      }
    }
  } catch (err) {
    console.warn(`[Gemini Recipe Parser] Live fetch for ${cleanUrl} notice: ${err.message}`);
  }

  return { domain, origin, cleanUrl, pageTitle, discoveredItems };
}

/**
 * Inspects and looks through the live content of any culinary website or blog
 * Extracts recipes from that website, matches them against pantry inventory,
 * and translates all fields to FR/EN.
 */
export async function lookThroughWebsiteContent({
  urlOrDomain,
  query = "",
  inventory = [],
  language = "FR",
  targetMealType = "",
}) {
  const { domain, origin, cleanUrl, pageTitle, discoveredItems } =
    await fetchLiveWebsiteRecipes(urlOrDomain, query);

  const apiKey = process.env.GEMINI_API_KEY;
  let parsedRecipes = [];

  const expiringItems = (inventory || []).filter(
    (i) =>
      i.isExpiringSoon ||
      (i.daysUntilExpiration !== null &&
        i.daysUntilExpiration !== undefined &&
        i.daysUntilExpiration <= 4)
  );

  const inventorySummary = (inventory || [])
    .slice(0, 15)
    .map((i) => i.name)
    .join(", ");

  const expiringSummary =
    expiringItems.length > 0
      ? expiringItems.map((i) => i.name).join(", ")
      : "No urgent expiring items";

  if (apiKey) {
    try {
      const ai = getGeminiClient();

      const promptArticles =
        discoveredItems.length > 0
          ? `LIVE RECIPES / ARTICLES FOUND DIRECTLY ON ${domain}:\n` +
            discoveredItems
              .slice(0, 8)
              .map((d, i) => `${i + 1}. "${d.title}" -> ${d.url}${d.description ? ` (${d.description})` : ""}`)
              .join("\n")
          : `No direct RSS feed found. Use targeted search "site:${domain}" to inspect content published on ${domain}.`;

      const mealQuery = targetMealType ? `${targetMealType.toLowerCase()} ${query || "recipe"}` : (query || "recipe");

      const systemInstruction = `You are Pantryo's web recipe researcher and culinary content extractor.
Your job is to look into the culinary website "${domain}" (${cleanUrl}) and extract 3 to 4 authentic recipes published directly on this website.

CRITICAL INSTRUCTIONS:
1. Focus strictly on recipes from ${domain}. Use targeted Google Search: "site:${domain} ${mealQuery}"
2. If live discovered articles are provided from ${domain}, prioritize extracting them with their authentic URLs!
${targetMealType ? `3. The user specifically requests ${targetMealType} recipes. Prioritize ${targetMealType} dishes (e.g. breakfast/brunch for Breakfast, sandwiches/salads/bowls for Lunch, full entrees for Dinner, bites/dips for Snacks) from ${domain}!` : ""}
4. Target display language: ${language === "FR" ? "French (Français)" : "English"}.
5. Always provide complete bilingual fields for both English and French (title, titleFr, descriptionEn, descriptionFr, ingredients with name and nameFr, instructionsEn, instructionsFr, zeroWasteReason).
6. Format your output strictly as a JSON array inside a \`\`\`json ... \`\`\` block.`;

      const prompt = `Inspect the content of ${domain} (${cleanUrl}) and return 3 to 4 wonderful recipes from this website.

${promptArticles}

USER INVENTORY (FOR ZERO-WASTE MATCHING):
- Expiring items to rescue: ${expiringSummary}
- In-stock pantry/fridge ingredients: ${inventorySummary || "Assorted kitchen items"}
- Search query/preferences: ${query || (targetMealType ? `Delicious ${targetMealType.toLowerCase()} recipes from this website` : "Popular, delicious recipes from this website")}
${targetMealType ? `- Target Meal Category: ${targetMealType}` : ""}

Output a JSON array of 3 to 4 recipe objects inside a \`\`\`json\`\`\` code block with:
- "title": English recipe name
- "titleFr": French recipe name
- "source": "${domain}"
- "sourceUrl": Direct URL to this recipe on ${domain} (use authentic URL from the discovered items if available)
- "imageUrl": Recipe photo URL
- "prepTime": e.g. "15 mins"
- "cookTime": e.g. "20 mins"
- "totalTime": e.g. "35 mins"
- "servings": e.g. "4 servings"
- "difficulty": "Easy", "Medium", or "Advanced"
- "difficultyFr": "Facile", "Moyen", ou "Avancé"
- "zeroWasteReason": One sentence in ${language === "FR" ? "French" : "English"} explaining which kitchen items this recipe uses
- "rescuedIngredients": array of matched items from user's inventory
- "ingredients": array of { "name": string, "nameFr": string, "amount": string, "inStock": boolean, "category": string, "locationType": "FRIDGE"|"PANTRY"|"FREEZER" }
- "instructionsEn": array of step-by-step instructions in English
- "instructionsFr": array of step-by-step instructions in French
- "tags": array of 3 tags`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || "";
      let cleanJson = rawText.trim();
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        parsedRecipes = parsed;
      }
    } catch (err) {
      console.warn(`[lookThroughWebsiteContent] Gemini model search error:`, err.message);
    }
  }

  // Fallback if Gemini returned 0 or was not configured, but we found items on the website
  if (parsedRecipes.length === 0 && discoveredItems.length > 0) {
    parsedRecipes = discoveredItems.slice(0, 4).map((item, idx) => ({
      title: item.title,
      titleFr: item.title,
      source: domain,
      sourceUrl: item.url,
      imageUrl:
        item.image ||
        "",
      prepTime: "15 mins",
      cookTime: "25 mins",
      totalTime: "40 mins",
      servings: "4 servings",
      difficulty: "Easy",
      difficultyFr: "Facile",
      zeroWasteReason:
        language === "FR"
          ? `Recette découverte directement sur ${domain}.`
          : `Recipe discovered directly on ${domain}.`,
      rescuedIngredients: [],
      ingredients: [
        { name: "Fresh ingredients", nameFr: "Ingrédients frais", amount: "Selon recette", inStock: true, category: "Produce", locationType: "FRIDGE" },
        { name: "Pantry seasonings", nameFr: "Assaisonnements", amount: "Au goût", inStock: true, category: "Pantry", locationType: "PANTRY" },
      ],
      instructionsEn: [
        `Visit ${item.url} for complete details.`,
        "Prepare fresh ingredients according to directions.",
        "Cook and serve warm.",
      ],
      instructionsFr: [
        `Consultez la recette complète sur ${item.url}.`,
        "Préparer les ingrédients selon les étapes indiquées.",
        "Cuire et déguster chaud.",
      ],
      tags: [domain, "Web Recipe"],
    }));
  }

  // Score matchPercentage and inStock against user inventory
  const finalRecipes = parsedRecipes.map((recipe, idx) => {
    let inStockCount = 0;
    const rescued = [];

    const detailedIngredients = (recipe.ingredients || []).map((ing) => {
      const ingName = (ing.name || "").toLowerCase();
      const matched = (inventory || []).find((inv) => {
        const invName = (inv.name || "").toLowerCase();
        return invName.includes(ingName) || ingName.includes(invName);
      });

      const inStock = Boolean(matched);
      if (inStock) {
        inStockCount++;
        if (
          matched.isExpiringSoon ||
          (matched.daysUntilExpiration !== null && matched.daysUntilExpiration <= 4)
        ) {
          rescued.push(matched.name);
        }
      }

      return {
        ...ing,
        inStock,
      };
    });

    const matchPercentage =
      recipe.ingredients && recipe.ingredients.length > 0
        ? Math.round((inStockCount / recipe.ingredients.length) * 100)
        : 80;

    let instructionsEn = Array.isArray(recipe.instructionsEn) ? recipe.instructionsEn.filter(s => s && !s.startsWith("Visit http")) : [];
    let instructionsFr = Array.isArray(recipe.instructionsFr) ? recipe.instructionsFr.filter(s => s && !s.startsWith("Consultez")) : [];

    if (instructionsEn.length === 0 || instructionsFr.length === 0) {
      const hero = detailedIngredients[0]?.name || recipe.title || "ingredients";
      const heroFr = detailedIngredients[0]?.nameFr || recipe.titleFr || recipe.title || "ingrédients";
      const sec = detailedIngredients[1]?.name || "fresh vegetables and seasonings";
      const secFr = detailedIngredients[1]?.nameFr || "légumes frais et assaisonnements";

      if (instructionsEn.length === 0) {
        instructionsEn = [
          `Prepare ${hero} and ${sec}, washing and chopping them into uniform portions.`,
          "Heat olive oil or butter in a skillet or pot over medium heat.",
          `Add ${hero} and cook for 6 to 8 minutes until fragrant and golden brown.`,
          `Stir in ${sec}, cover and simmer gently for 5 to 7 minutes until flavors combine.`,
          "Season to taste with salt, black pepper, and herbs. Serve warm.",
        ];
      }
      if (instructionsFr.length === 0) {
        instructionsFr = [
          `Préparer ${heroFr} et ${secFr}, laver et découper en portions régulières.`,
          "Faire chauffer un filet d'huile d'olive ou du beurre dans une poêle à feu moyen.",
          `Ajouter ${heroFr} et faire dorer 6 à 8 minutes jusqu'à belle coloration parfumée.`,
          `Incorporer ${secFr}, couvrir et laisser mijoter 5 à 7 minutes pour marier les saveurs.`,
          "Assaisonner selon vos goûts de sel, poivre et herbes. Servir bien chaud.",
        ];
      }
    }

    return {
      id: `site_${domain}_${Date.now()}_${idx}`,
      ...recipe,
      source: recipe.source || domain,
      sourceUrl: recipe.sourceUrl || cleanUrl,
      matchPercentage,
      rescuedIngredients: recipe.rescuedIngredients?.length ? recipe.rescuedIngredients : rescued,
      ingredients: detailedIngredients,
      instructionsEn,
      instructionsFr,
      isWebSearch: true,
    };
  });

  return {
    success: true,
    website: {
      domain,
      name: domain,
      url: cleanUrl,
      pageTitle: pageTitle || domain,
      discoveredItemsCount: discoveredItems.length,
    },
    totalFound: finalRecipes.length,
    recipes: finalRecipes,
  };
}

/**
 * Parses and automatically translates a recipe from ANY external website URL
 * Supports Ricardo, Marmiton, 750g, Cuisine AZ, Serious Eats, BBC Good Food, Allrecipes, etc.
/**
 * Helper to parse ISO 8601 duration string (e.g. PT20M, PT1H, PT1H30M, P0DT45M) into human readable time
 */
export function parseIsoDuration(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return "";
  const str = durationStr.trim();
  if (/^\d+\s*(mins?|minutes?|hours?|hrs?|h|m)/i.test(str)) return str;

  const match = str.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return str;

  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);

  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(" ") : str;
}

/**
 * Parses Schema.org Recipe JSON-LD data into a full, high-precision RicardoRecipe object.
 */

/**
 * Asynchronously translates text using high-accuracy translation with culinary fallback
 */
export async function translateTextAsync(text, targetLang = "EN") {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length < 2) return trimmed;

  const target = targetLang.toUpperCase() === "FR" ? "fr" : "en";
  try {
    const q = encodeURIComponent(trimmed);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${q}`;
    const res = await safeFetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((s) => s[0]).join("");
        if (translated && translated.trim().length > 0) {
          return translated.trim();
        }
      }
    }
  } catch (err) {}

  return target === "fr" ? translateRecipeDescriptionToFrench(trimmed) : translateRecipeDescriptionToEnglish(trimmed);
}

export async function parseRecipeFromJsonLd(
  jsonLdData,
  { cleanUrl, domain, language = "FR", pageTitle = "", rawHtml = "", alternateLangJsonLd = null, alternateLangUrl = null } = {}
) {
  if (!jsonLdData) return null;

  // Title
  let rawTitle = jsonLdData.name || jsonLdData.headline || pageTitle || `Recipe from ${domain}`;
  if (typeof rawTitle !== "string") rawTitle = `${rawTitle}`;
  rawTitle = rawTitle
    .replace(/\s*[-|–—]\s*(Ricardo|Panlasang Pinoy|Kawaling Pinoy|Marmiton|750g|Allrecipes|Food Network|Serious Eats|Yummy\.ph|Foxy Folksy|Simpol).*$/i, "")
    .trim();

  // Bilingual Title
  let titleEn = "";
  let titleFr = "";
  const isSourceFrench = isTextFrench(rawTitle);

  if (alternateLangJsonLd && alternateLangJsonLd.name) {
    let cleanAlt = `${alternateLangJsonLd.name}`
      .replace(/\s*[-|–—]\s*(Ricardo|Panlasang Pinoy|Kawaling Pinoy|Marmiton|750g|Allrecipes|Food Network|Serious Eats|Yummy\.ph|Foxy Folksy|Simpol).*$/i, "")
      .trim();
    if (isSourceFrench) {
      titleFr = rawTitle;
      titleEn = cleanAlt;
    } else {
      titleEn = rawTitle;
      titleFr = cleanAlt;
    }
  } else if (isTextTagalog(rawTitle)) {
    titleEn = await translateTextAsync(rawTitle, "EN");
    titleFr = await translateTextAsync(rawTitle, "FR");
  } else if (isSourceFrench) {
    titleFr = rawTitle;
    titleEn = translateRecipeTitleToEnglish(rawTitle);
    if (!titleEn || isTextFrench(titleEn) || titleEn.toLowerCase() === rawTitle.toLowerCase()) {
      titleEn = await translateTextAsync(rawTitle, "EN");
    }
  } else {
    titleEn = rawTitle;
    titleFr = translateRecipeTitleToFrench(rawTitle);
    if (!titleFr || !isTextFrench(titleFr) || titleFr.toLowerCase() === rawTitle.toLowerCase()) {
      titleFr = await translateTextAsync(rawTitle, "FR");
    }
  }

  // Times
  const prepTime = parseIsoDuration(jsonLdData.prepTime) || "15 mins";
  const cookTime = parseIsoDuration(jsonLdData.cookTime) || "25 mins";
  const totalTime = parseIsoDuration(jsonLdData.totalTime) || (cookTime ? cookTime : "40 mins");

  // Servings / Yield
  let servings = "4 servings";
  if (jsonLdData.recipeYield) {
    if (Array.isArray(jsonLdData.recipeYield)) {
      servings = `${jsonLdData.recipeYield[0]}`.includes("serving")
        ? `${jsonLdData.recipeYield[0]}`
        : `${jsonLdData.recipeYield[0]} servings`;
    } else {
      const yStr = `${jsonLdData.recipeYield}`;
      servings = yStr.includes("serving") || yStr.includes("portion") ? yStr : `${yStr} servings`;
    }
  }

  // Description
  const rawDesc = jsonLdData.description || `Authentic ${rawTitle} imported from ${domain}.`;
  let descriptionEn = "";
  let descriptionFr = "";
  if (alternateLangJsonLd && alternateLangJsonLd.description) {
    if (isSourceFrench) {
      descriptionFr = rawDesc;
      descriptionEn = alternateLangJsonLd.description.trim();
    } else {
      descriptionEn = rawDesc;
      descriptionFr = alternateLangJsonLd.description.trim();
    }
  } else if (isTextTagalog(rawDesc)) {
    descriptionEn = await translateTextAsync(rawDesc, "EN");
    descriptionFr = await translateTextAsync(rawDesc, "FR");
  } else if (isSourceFrench) {
    descriptionFr = rawDesc;
    descriptionEn = await translateTextAsync(rawDesc, "EN");
  } else {
    descriptionEn = rawDesc;
    descriptionFr = await translateTextAsync(rawDesc, "FR");
  }

  // Image
  let imageUrl = "";
  if (typeof jsonLdData.image === "string") {
    imageUrl = jsonLdData.image;
  } else if (Array.isArray(jsonLdData.image) && jsonLdData.image.length > 0) {
    imageUrl = typeof jsonLdData.image[0] === "string" ? jsonLdData.image[0] : jsonLdData.image[0]?.url;
  } else if (jsonLdData.image && typeof jsonLdData.image === "object") {
    imageUrl = jsonLdData.image.url || jsonLdData.image.contentUrl || "";
  }
  // Fallback to og:image from rawHtml
  if (!imageUrl && rawHtml) {
    const ogMatch = rawHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogMatch) imageUrl = ogMatch[1];
  }

  // Ingredients (recipeIngredient)
  const rawIngredientsList = Array.isArray(jsonLdData.recipeIngredient)
    ? jsonLdData.recipeIngredient
    : [];
  const altIngredientsList = alternateLangJsonLd && Array.isArray(alternateLangJsonLd.recipeIngredient)
    ? alternateLangJsonLd.recipeIngredient
    : [];

  const parsedIngredients = [];
  for (let idx = 0; idx < rawIngredientsList.length; idx++) {
    const rawIng = rawIngredientsList[idx];
    const baseSourceLang = isSourceFrench ? "FR" : "EN";
    const parsedBase = parseIngredientString(rawIng, baseSourceLang);
    let altIngString = altIngredientsList[idx] || null;
    let finalEn = "";
    let finalFr = "";

    if (isSourceFrench) {
      finalFr = parsedBase.nameFr || parsedBase.name;
      if (altIngString) {
        const altParsed = parseIngredientString(altIngString, "EN");
        finalEn = altParsed.name || altParsed.nameEn;
      } else {
        finalEn = await translateTextAsync(finalFr, "EN");
      }
    } else {
      finalEn = parsedBase.name || parsedBase.nameEn;
      if (altIngString) {
        const altParsed = parseIngredientString(altIngString, "FR");
        finalFr = altParsed.nameFr || altParsed.name;
      } else {
        finalFr = await translateTextAsync(finalEn, "FR");
      }
    }

    parsedIngredients.push({
      ...parsedBase,
      name: language === "FR" ? (finalFr || finalEn) : (finalEn || finalFr),
      nameEn: finalEn,
      nameFr: finalFr,
    });
  }

  // Instructions (recipeInstructions)
  let instructionsEn = [];
  let instructionsFr = [];

  const rawInstructions = jsonLdData.recipeInstructions;
  const altInstructions = alternateLangJsonLd?.recipeInstructions;

  const extractAllSteps = (instructions) => {
    const list = [];
    if (!instructions) return list;
    if (typeof instructions === "string") {
      return instructions.split(/\r?\n+/).map((s) => s.trim()).filter((s) => s.length > 5);
    }
    if (Array.isArray(instructions)) {
      for (const item of instructions) {
        list.push(...extractAllSteps(item));
      }
      return list;
    }
    if (typeof instructions === "object") {
      if (Array.isArray(instructions.itemListElement)) {
        return extractAllSteps(instructions.itemListElement);
      }
      if (instructions.text && typeof instructions.text === "string" && instructions.text.trim().length > 3) {
        return [instructions.text.trim()];
      }
      if (
        instructions.name &&
        typeof instructions.name === "string" &&
        instructions.name.trim().length > 3 &&
        !instructions["@type"]?.includes("HowToSection")
      ) {
        return [instructions.name.trim()];
      }
    }
    return list;
  };

  const extractedSteps = extractAllSteps(rawInstructions);
  const altSteps = altInstructions ? extractAllSteps(altInstructions) : [];

  if (altSteps.length > 0) {
    if (isSourceFrench) {
      instructionsFr = extractedSteps;
      instructionsEn = altSteps;
    } else {
      instructionsEn = extractedSteps;
      instructionsFr = altSteps;
    }
  } else {
    for (const stepText of extractedSteps) {
      if (stepText && stepText.length > 3) {
        if (isTextTagalog(stepText)) {
          instructionsEn.push(await translateTextAsync(stepText, "EN"));
          instructionsFr.push(await translateTextAsync(stepText, "FR"));
        } else if (isTextFrench(stepText)) {
          instructionsFr.push(stepText);
          instructionsEn.push(await translateTextAsync(stepText, "EN"));
        } else {
          instructionsEn.push(stepText);
          instructionsFr.push(await translateTextAsync(stepText, "FR"));
        }
      }
    }
  }

  if (instructionsEn.length === 0) {
    instructionsEn.push(`Follow directions from original recipe at ${cleanUrl}`);
    instructionsFr.push(`Suivre les étapes indiquées sur le site original : ${cleanUrl}`);
  }

  const recipeId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const recipeObject = {
    id: recipeId,
    title: language === "FR" ? (titleFr || titleEn) : (titleEn || titleFr),
    titleEn,
    titleFr,
    descriptionEn,
    descriptionFr,
    prepTime,
    cookTime,
    totalTime,
    servings,
    difficulty: "Easy",
    difficultyFr: "Facile",
    calories: "450 kcal",
    source: domain,
    sourceUrl: cleanUrl,
    imageUrl: imageUrl || "",
    isRicardoOfficial: domain.includes("ricardocuisine.com"),
    isCustom: true,
    tags: [domain, "Web Recipe", "Imported"],
    ingredients: parsedIngredients,
    instructionsEn,
    instructionsFr,
    suggestedPantryNeeds: parsedIngredients.filter((i) => i.locationType === "PANTRY").map((i) => i.name).slice(0, 3),
    createdAt: new Date().toISOString(),
  };

  return normalizeRecipeOutput(recipeObject, {
    source: domain,
    sourceUrl: cleanUrl,
    imageUrl: imageUrl || "",
    language,
  });
}

/**
 * Parses and automatically translates a recipe from ANY external website URL
 * Supports Ricardo, Panlasang Pinoy, Kawaling Pinoy, Yummy.ph, Marmiton, 750g, Allrecipes, etc.
 * Automatically translates all fields (title, ingredients, instructions) to FR or EN on import.
 */
export async function parseRecipeFromUrl({
  url,
  language = "FR",
  autoTranslate = true,
}) {
  if (!url || typeof url !== "string") {
    throw new Error("A valid recipe URL is required.");
  }

  const cleanUrl = await validateSafeExternalUrl(url);
  let domain = "Web Recipe";
  try {
    const parsedUrl = new URL(cleanUrl);
    domain = parsedUrl.hostname.replace(/^www\./, "");
  } catch (e) {
    domain = "Web Recipe";
  }

  // 1. Fetch webpage safely
  let pageContent = "";
  let jsonLdData = null;
  let pageTitle = "";
  let rawHtml = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await safeFetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      rawHtml = await res.text();
      const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      const jsonLdMatches = rawHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const tag of jsonLdMatches) {
          const content = tag.replace(/<\/?script[^>]*>/gi, "").trim();
          try {
            const parsed = JSON.parse(content);
            const found = findRecipeInJsonLd(parsed);
            if (found) {
              jsonLdData = found;
              break;
            }
          } catch (e) {
            // Ignore parse errors in scripts
          }
        }
      }

      if (!jsonLdData) {
        pageContent = rawHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 15000);
      }
    }
  } catch (err) {
    console.warn(`[Gemini Recipe Parser] Direct fetch for ${cleanUrl} notice: ${err.message}.`);
  }

  // Check for bilingual alternate page link (e.g., Ricardo Cuisine has official alternate link)
  let alternateLangJsonLd = null;
  let alternateLangUrl = null;
  if (rawHtml) {
    const isSourceFr = cleanUrl.includes("/recettes/") || /hreflang=["']fr["']/i.test(rawHtml);
    const targetAltLang = isSourceFr ? "en" : "fr";
    const altRegex = new RegExp(`<link[^>]+(?:href=["']([^"']+)["'][^>]+hreflang=["']${targetAltLang}["']|hreflang=["']${targetAltLang}["'][^>]+href=["']([^"']+)["'])`, "i");
    const altMatch = rawHtml.match(altRegex);
    const altCandidate = altMatch ? (altMatch[1] || altMatch[2]) : null;
    if (altCandidate && altCandidate.startsWith("http")) {
      alternateLangUrl = altCandidate;
      try {
        const altSafe = await validateSafeExternalUrl(altCandidate);
        const altRes = await safeFetch(altSafe, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        if (altRes.ok) {
          const altHtml = await altRes.text();
          const altJsonMatches = altHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
          if (altJsonMatches) {
            for (const tag of altJsonMatches) {
              const content = tag.replace(/<\/?script[^>]*>/gi, "").trim();
              try {
                const parsed = JSON.parse(content);
                const found = findRecipeInJsonLd(parsed);
                if (found) {
                  alternateLangJsonLd = found;
                  break;
                }
              } catch (e) {}
            }
          }
        }
      } catch (altErr) {
        console.warn(`[Gemini Recipe Parser] Alternate scrape notice:`, altErr.message);
      }
    }
  }

  // 2. If Schema.org Recipe was extracted, produce clean deterministic recipe
  let deterministicRecipe = null;
  if (jsonLdData) {
    try {
      deterministicRecipe = await parseRecipeFromJsonLd(jsonLdData, {
        cleanUrl,
        domain,
        language,
        pageTitle,
        rawHtml,
        alternateLangJsonLd,
        alternateLangUrl,
      });
    } catch (detErr) {
      console.warn(`[parseRecipeFromJsonLd error]:`, detErr.message);
    }
  }

  // 3. If Gemini is available, attempt AI enhancement & translation
  const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
  const hasGemini = Boolean(apiKey && apiKey.length > 10 && apiKey !== "MY_GEMINI_API_KEY");

  if (hasGemini) {
    try {
      const ai = getGeminiClient();

      const systemInstruction = `You are Pantryo's master bilingual culinary digitizer and international recipe archivist.
Your job is to accurately extract and polish the complete recipe from this webpage (${cleanUrl}).

CRITICAL MANDATE - AUTOMATIC TRANSLATION & STORAGE ZONING:
Target primary language for this import: ${language === "FR" ? "French (Français)" : "English"}.
1. AUTOMATICALLY TRANSLATE ALL ELEMENTS into ${language === "FR" ? "French" : "English"}!
2. Provide complete bilingual output for seamless switching:
   - title: English title
   - titleFr: French title
   - descriptionEn: Appetizing English summary
   - descriptionFr: Appetizing French summary
   - ingredients: array of {
       "name": clear English ingredient name (without prep instructions),
       "nameFr": clear French ingredient name,
       "amount": measurement/quantity (e.g. "250g", "2 tbsp / 2 c. à soupe", "3 cloves / 3 gousses"),
       "category": One of "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Condiments", "Pantry Staples", "Frozen Foods", "Spices & Seasonings",
       "locationType": "FRIDGE", "PANTRY", "FREEZER", or "SPICE_RACK"
     }
   - instructionsEn: Complete step-by-step instructions in English
   - instructionsFr: Complete step-by-step instructions in French
   - prepTime: e.g. "15 mins"
   - cookTime: e.g. "30 mins"
   - totalTime: e.g. "45 mins"
   - servings: e.g. "4 servings"
   - difficulty: "Easy", "Medium", or "Advanced"
   - difficultyFr: "Facile", "Moyen", ou "Avancé"
   - calories: e.g. "450 kcal"
   - tags: array of 3-5 tags
   - source: Name of website ("${domain}")
   - sourceUrl: "${cleanUrl}"
   - imageUrl: High-quality recipe food image URL from the page.

Always output strictly valid JSON conforming to the schema.`;

      const prompt = jsonLdData
        ? `Extract and translate this recipe from ${cleanUrl}.
Schema.org JSON-LD from page:
${JSON.stringify(jsonLdData).slice(0, 9000)}`
        : pageContent
        ? `Extract and translate the recipe from webpage (${cleanUrl}):
Title: ${pageTitle}
Page Text:
${pageContent.slice(0, 10000)}`
        : `Please search for, extract and translate the recipe at this URL using Google Search: ${cleanUrl}`;

      const config = {
        systemInstruction,
        temperature: 0.2,
      };

      if (!jsonLdData && !pageContent) {
        config.tools = [{ googleSearch: {} }];
      } else {
        config.responseMimeType = "application/json";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config,
      });

      const rawText = response.text || "";
      let cleanJson = rawText.trim();
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(cleanJson);
      const normalized = normalizeRecipeOutput(parsed, {
        source: parsed.source || domain,
        sourceUrl: cleanUrl,
        imageUrl: parsed.imageUrl || deterministicRecipe?.imageUrl,
      });

      return {
        success: true,
        message:
          language === "FR"
            ? `Recette importée et traduite avec succès depuis ${domain} !`
            : `Recipe imported and translated successfully from ${domain}!`,
        recipe: normalized,
      };
    } catch (aiError) {
      console.warn(`[Gemini Recipe Parser] Gemini API failed, falling back to deterministic:`, aiError.message);
      if (deterministicRecipe) {
        return {
          success: true,
          notice: `Imported via direct Schema.org parser (${aiError.message})`,
          recipe: deterministicRecipe,
        };
      }
    }
  }

  // 4. Return deterministic recipe if we parsed JSON-LD
  if (deterministicRecipe) {
    return {
      success: true,
      message:
        language === "FR"
          ? `Recette importée avec succès depuis ${domain} !`
          : `Recipe imported successfully from ${domain}!`,
      recipe: deterministicRecipe,
    };
  }

  // 5. If no JSON-LD but we have page text, parse text directly
  if (pageContent) {
    const directRecipe = parseRecipeTextDirectly(pageContent, {
      language,
      source: domain,
    });
    return {
      success: true,
      recipe: directRecipe,
    };
  }

  // 6. Last resort fallback
  return generateFallbackRecipe({
    rawText: `Imported Recipe from ${domain}\nURL: ${cleanUrl}`,
    source: domain,
    language,
    reason: `Could not reach ${cleanUrl} directly. Generated demo recipe for ${domain}.`,
  });
}

/**
 * Translates an existing recipe into the target language (FR or EN)
 *
 * EXACT SPECIFIED LOGIC:
 * 1. If it's French: translate to English ONLY for the English app version (preserve French for French app version).
 * 2. If it's English: translate to French for the French app version (preserve English for English app version).
 * 3. If it's Tagalog: translate to BOTH English and French!
 */
export async function translateRecipe({ recipe, targetLanguage = "FR" }) {
  if (!recipe) {
    return { success: false, error: "Missing recipe data" };
  }

  const targetLang = (targetLanguage || "FR").toUpperCase() === "FR" ? "FR" : "EN";

  // 1. If Gemini API key is configured, attempt AI culinary translation
  const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
  const hasGemini = Boolean(apiKey && apiKey.length > 10 && apiKey !== "MY_GEMINI_API_KEY");

  if (hasGemini) {
    try {
      const ai = getGeminiClient();
      const systemInstruction = `You are Pantryo's master bilingual culinary translator.
Translate this recipe into ${targetLang === "FR" ? "French" : "English"}.
If source is French: preserve French in titleFr/instructionsFr/nameFr and supply English in title/instructionsEn/name.
If source is English: preserve English in title/instructionsEn/name and supply French in titleFr/instructionsFr/nameFr.
If source is Tagalog: translate to BOTH English and French!
Return a JSON object containing:
- title: English title
- titleFr: French title
- descriptionEn
- descriptionFr
- ingredients: array of { name, nameFr, amount, unit, category, locationType, storage }
- instructionsEn
- instructionsFr
- difficulty
- difficultyFr
- tags`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Translate this recipe:\n${JSON.stringify(recipe)}`,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text.trim());
      const normalized = normalizeRecipeOutput({
        ...recipe,
        ...parsed,
      });

      return {
        success: true,
        recipe: {
          ...normalized,
          title: targetLang === "FR" && normalized.titleFr ? normalized.titleFr : normalized.title,
        },
      };
    } catch (error) {
      console.warn("[Gemini Recipe Parser] Gemini translateRecipe failed, applying deterministic translation:", error.message);
    }
  }

  // 2. High-precision Deterministic Bilingual Translation
  const rawTitle = (recipe.title || recipe.titleFr || recipe.titleEn || recipe.name || "").trim();
  const rawDesc = (recipe.description || recipe.descriptionFr || recipe.descriptionEn || recipe.zeroWasteReason || "").trim();

  let titleEn = recipe.titleEn || "";
  let titleFr = recipe.titleFr || "";
  let descEn = recipe.descriptionEn || "";
  let descFr = recipe.descriptionFr || "";

  if (targetLang === "EN") {
    if (!titleEn || isTextFrench(titleEn)) {
      titleEn = cleanDuplicatedNotes(translateRecipeTitleToEnglish(titleFr || rawTitle) || await translateTextAsync(titleFr || rawTitle, "EN"));
    }
    if (!descEn || isTextFrench(descEn)) {
      descEn = cleanDuplicatedNotes(await translateTextAsync(descFr || rawDesc, "EN"));
    }
    titleFr = titleFr || rawTitle;
    descFr = descFr || rawDesc;
  } else {
    if (!titleFr || !isTextFrench(titleFr)) {
      titleFr = cleanDuplicatedNotes(translateRecipeTitleToFrench(titleEn || rawTitle) || await translateTextAsync(titleEn || rawTitle, "FR"));
    }
    if (!descFr || !isTextFrench(descFr)) {
      descFr = cleanDuplicatedNotes(await translateTextAsync(descEn || rawDesc, "FR"));
    }
    titleEn = titleEn || rawTitle;
    descEn = descEn || rawDesc;
  }

  const activeTitle = targetLang === "FR" ? (titleFr || titleEn || rawTitle) : (titleEn || titleFr || rawTitle);

  // Ingredients translation
  const rawIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const translatedIngredients = await Promise.all(
    rawIngredients.map(async (ing) => {
      let ingEn = ing.nameEn || ing.name || "";
      let ingFr = ing.nameFr || "";

      if (targetLang === "EN") {
        if (!ingEn || isTextFrench(ingEn)) {
          ingEn = await translateTextAsync(ingFr || ing.name, "EN");
        }
      } else {
        if (!ingFr || !isTextFrench(ingFr)) {
          ingFr = await translateTextAsync(ingEn || ing.name, "FR");
        }
      }

      const activeName = targetLang === "FR" ? (ingFr || ingEn) : (ingEn || ingFr);
      return {
        ...ing,
        name: activeName,
        nameEn: ingEn,
        nameFr: ingFr,
      };
    })
  );

  // Instructions translation
  const rawStepsEn = Array.isArray(recipe.instructionsEn) ? recipe.instructionsEn : (Array.isArray(recipe.instructions) ? recipe.instructions : []);
  const rawStepsFr = Array.isArray(recipe.instructionsFr) ? recipe.instructionsFr : [];

  let instructionsEn = [...rawStepsEn];
  let instructionsFr = [...rawStepsFr];

  if (targetLang === "EN") {
    const src = rawStepsFr.length > 0 ? rawStepsFr : rawStepsEn;
    instructionsEn = await Promise.all(src.map((s) => translateTextAsync(s, "EN")));
    if (instructionsFr.length === 0) instructionsFr = src;
  } else {
    const src = rawStepsEn.length > 0 ? rawStepsEn : rawStepsFr;
    instructionsFr = await Promise.all(src.map((s) => translateTextAsync(s, "FR")));
    if (instructionsEn.length === 0) instructionsEn = src;
  }

  return {
    success: true,
    recipe: {
      ...recipe,
      title: activeTitle,
      titleEn,
      titleFr,
      descriptionEn: descEn,
      descriptionFr: descFr,
      ingredients: translatedIngredients,
      instructionsEn,
      instructionsFr,
      difficulty: recipe.difficulty || "Easy",
      difficultyFr: recipe.difficultyFr || (recipe.difficulty === "Advanced" ? "Avancé" : recipe.difficulty === "Medium" ? "Moyen" : "Facile"),
    },
  };
}

/**
 * Infers appropriate meal types (BREAKFAST, LUNCH, DINNER, SNACK) for a recipe
 * based on explicit tags, titles, and descriptions.
 */
export function inferRecipeMealTypes(recipe) {
  if (Array.isArray(recipe.mealTypes) && recipe.mealTypes.length > 0) {
    return recipe.mealTypes;
  }
  const text = [
    recipe.title || "",
    recipe.titleFr || "",
    Array.isArray(recipe.tags) ? recipe.tags.join(" ") : "",
    recipe.descriptionEn || "",
    recipe.descriptionFr || "",
    recipe.mealType || "",
  ].join(" ").toLowerCase();

  const types = [];

  if (
    /breakfast|déjeuner|dejeuner|brunch|pancake|waffle|gaufre|oat|avoine|porridge|parfait|french toast|pain doré|pain dore|egg|oeuf|œuf|scramble|brouillade|frittata|omelet|omelette|smoothie|granola|muffin|crepe|crêpe|shakshuka|tartine|toast|bacon/.test(
      text
    )
  ) {
    types.push("BREAKFAST");
  }

  if (
    /lunch|dîner|diner|sandwich|wrap|salad|salade|soup|potage|quiche|tartine|toast|bowl|croque|panini|taco|burger|flatbread/.test(
      text
    )
  ) {
    types.push("LUNCH");
  }

  if (
    /dinner|souper|stew|ragout|ragoût|roast|rôti|curry|casserole|pasta|pâtes|pates|spaghetti|bolognese|lasagna|lasagne|salmon|saumon|beef|bœuf|boeuf|chicken|poulet|pork|porc|steak|sheet-pan|plaque|skillet|poêlée|poelee|grill|bake|stir-fry|saute/.test(
      text
    )
  ) {
    types.push("DINNER");
  }

  if (
    /snack|collation|parfait|bites|bouchée|bouchee|dip|trempette|chips|crisps|hummus|smoothie|bar|barre|cookie|biscuit|popcorn|nuts|noix|fruit|granola|muffin/.test(
      text
    )
  ) {
    types.push("SNACK");
  }

  if (types.length === 0) {
    types.push("DINNER", "LUNCH");
  }

  return types;
}

/**
 * Smart Anti-Waste Meal Planning Suggestions
 * Combines:
 * 1. User's on-hand & expiring inventory (to strictly prevent food waste)
 * 2. User's saved & favorite recipes (ranked by ingredient match and expiring items saved)
 * 3. Live Web Search via Gemini 3.8 Flash with Google Search Grounding to find online recipes
 * 4. User's preferred recipe websites & automatic language translation
 */
export async function generateSmartMealSuggestions({
  inventory = [],
  userRecipes = [],
  targetDate = new Date().toISOString().split("T")[0],
  targetMealType = "DINNER",
  language = "EN",
  query = "",
  preferredWebsites = [],
}) {
  const expiringItems = (inventory || []).filter(
    (i) =>
      i.isExpiringSoon ||
      (i.daysUntilExpiration !== null &&
        i.daysUntilExpiration !== undefined &&
        i.daysUntilExpiration <= 4)
  );

  const inventoryNames = (inventory || []).map((i) => i.name.toLowerCase());

  // 1. Process User's Saved Recipes locally against inventory and targetMealType
  const processedUserRecipes = (userRecipes || []).map((recipe) => {
    const ingredients = recipe.ingredients || [];
    let inStockCount = 0;
    const rescued = [];

    const detailedIngredients = ingredients.map((ing) => {
      const ingName = (ing.name || "").toLowerCase();
      const matchedItem = (inventory || []).find((inv) => {
        const invName = (inv.name || "").toLowerCase();
        return (
          invName.includes(ingName) ||
          ingName.includes(invName) ||
          (ing.inKitchenItemName &&
            invName.includes(ing.inKitchenItemName.toLowerCase()))
        );
      });

      const inStock = Boolean(matchedItem);
      if (inStock) {
        inStockCount++;
        if (
          matchedItem.isExpiringSoon ||
          (matchedItem.daysUntilExpiration !== null &&
            matchedItem.daysUntilExpiration <= 4)
        ) {
          rescued.push(matchedItem.name);
        }
      }

      return {
        name: ing.name,
        nameFr: ing.nameFr || ing.name,
        amount: ing.amount || "1 portion",
        inStock,
        category: ing.category || "Pantry",
      };
    });

    const matchPercentage =
      ingredients.length > 0
        ? Math.round((inStockCount / ingredients.length) * 100)
        : 100;

    const zeroWasteReason =
      rescued.length > 0
        ? language === "FR"
          ? `Sauve ${rescued.slice(0, 2).join(" et ")} qui doivent être consommés rapidement !`
          : `Rescues ${rescued.slice(0, 2).join(" and ")} before expiration!`
        : language === "FR"
        ? `Utilise ${inStockCount} ingrédient(s) déjà dans votre cuisine.`
        : `Uses ${inStockCount} ingredient(s) already in your kitchen.`;

    const suitableMealTypes = inferRecipeMealTypes(recipe);
    const matchesTargetMeal = suitableMealTypes.includes(targetMealType);

    return {
      id: recipe.id || `user_rec_${Math.random().toString(36).substring(2, 7)}`,
      title: recipe.title,
      titleFr: recipe.titleFr || recipe.title,
      source: recipe.source || "Personal",
      sourceUrl: recipe.ricardoUrlEn || recipe.youtubeUrl || "",
      imageUrl:
        recipe.imageUrl ||
        "",
      prepTime: recipe.prepTime || "15 mins",
      cookTime: recipe.cookTime || "20 mins",
      totalTime: recipe.time || "35 mins",
      servings: recipe.servings || "4 servings",
      difficulty: recipe.difficulty || "Easy",
      difficultyFr: recipe.difficultyFr || "Facile",
      zeroWasteReason,
      rescuedIngredients: rescued,
      matchPercentage,
      ingredients: detailedIngredients,
      instructionsEn: recipe.instructionsEn || [],
      instructionsFr: recipe.instructionsFr || [],
      tags: recipe.tags || ["My Recipe"],
      mealType: targetMealType,
      suitableMealTypes,
      matchesTargetMeal,
      isFromMyRecipes: true,
    };
  });

  // Filter so that user recipes matching targetMealType are prioritized
  const exactMealMatches = processedUserRecipes.filter((r) => r.matchesTargetMeal);
  const userRecipeMatches = exactMealMatches.length > 0 ? exactMealMatches : processedUserRecipes;

  // Sort user recipes: highest expiring items rescued first, then match percentage
  userRecipeMatches.sort((a, b) => {
    if (b.rescuedIngredients.length !== a.rescuedIngredients.length) {
      return b.rescuedIngredients.length - a.rescuedIngredients.length;
    }
    return b.matchPercentage - a.matchPercentage;
  });

  // 2. Fetch Live Web Recommendations with Gemini 3.8 Flash + Google Search Grounding
  let webSuggestions = [];
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = getGeminiClient();

      const expiringPromptList =
        expiringItems.length > 0
          ? expiringItems
              .map(
                (i) =>
                  `- ${i.name} (Expiring in ${
                    i.daysUntilExpiration !== null ? i.daysUntilExpiration + " days" : "soon"
                  }, location: ${i.location || "fridge"})`
              )
              .join("\n")
          : "- No items in immediate expiration; focus on items in stock";

      const otherInventoryList = (inventory || [])
        .slice(0, 15)
        .map((i) => `- ${i.name} (${i.category || "Stock"})`)
        .join("\n");

      // Active crawl/feed check of preferred websites to discover real recipes and exact URLs
      let liveDiscoveredContent = [];
      if (preferredWebsites && preferredWebsites.length > 0) {
        try {
          const siteFetches = await Promise.allSettled(
            preferredWebsites.slice(0, 3).map((site) => fetchLiveWebsiteRecipes(site))
          );
          for (const res of siteFetches) {
            if (res.status === "fulfilled" && res.value?.discoveredItems?.length > 0) {
              liveDiscoveredContent.push(
                ...res.value.discoveredItems
                  .slice(0, 4)
                  .map((d) => `[Source: ${res.value.domain}] "${d.title}" -> ${d.url}`)
              );
            }
          }
        } catch (err) {
          console.warn("[Smart Suggestions] Error pre-fetching live website recipes:", err.message);
        }
      }

      const siteSearchQueries =
        preferredWebsites && preferredWebsites.length > 0
          ? preferredWebsites
              .map(
                (s) =>
                  `"site:${s.replace(/^https?:\/\//, "").replace(/^www\./, "")} recipe"`
              )
              .join(", ")
          : "";

      const websitesDirective =
        preferredWebsites && preferredWebsites.length > 0
          ? `USER'S PREFERRED RECIPE WEBSITES / SOURCES:
You MUST search specifically on and extract recipes from these websites: ${preferredWebsites.join(", ")}.
Execute Google Search targeted site queries: ${siteSearchQueries}
${
  liveDiscoveredContent.length > 0
    ? `ACTUAL LIVE RECIPES CURRENTLY PUBLISHED ON THESE WEBSITES (Use these real URLs and titles if applicable):\n${liveDiscoveredContent.join("\n")}`
    : ""
}
Ensure at least 2 of your returned recipes come directly from these preferred websites, with authentic titles and source URLs!`
          : `RECOMMENDED CULINARY SOURCES:
Search top culinary portals such as Marmiton, Ricardo Cuisine, 750g, Cuisine AZ, Trois Fois Par Jour, Serious Eats, Allrecipes, BBC Good Food.`;

      const mealTypeGuidelines = {
        BREAKFAST: `CRITICAL MEAL TYPE REQUIREMENT: BREAKFAST / DÉJEUNER ONLY.
The suggestions MUST be genuine morning breakfast dishes (e.g., egg scrambles, morning omelettes, potato/veggie breakfast hashes with eggs, shakshuka, breakfast frittatas, wholesome oatmeal/porridge, smoothies, breakfast sandwiches/burritos, or pain doré/pancakes). Under NO circumstances return dinner pasta, heavy stews, or nighttime entrees!`,
        LUNCH: `CRITICAL MEAL TYPE REQUIREMENT: LUNCH / DÎNER (MIDI) ONLY.
The suggestions MUST be delicious midday lunches (e.g., loaded artisan sandwiches, paninis, crisp lunch bowls, nourishing salads, quiches, light wraps, tartines, or lunch soups). Under NO circumstances return heavy multi-course dinners!`,
        DINNER: `CRITICAL MEAL TYPE REQUIREMENT: DINNER / SOUPER ONLY.
The suggestions MUST be hearty evening dinner entrees (e.g., sheet-pan bakes, casseroles, curries, savory pasta dishes, skillet roasts, or warm evening entrees).`,
        SNACK: `CRITICAL MEAL TYPE REQUIREMENT: SNACK / COLLATION ONLY.
The suggestions MUST be quick bites, snacks, dips, smoothies, muffins, energy bars, or finger foods. Under NO circumstances return full meal entrees!`
      };

      const mealConstraint = mealTypeGuidelines[targetMealType] || `Suggestions must be appropriate for ${targetMealType}.`;

      const systemInstruction = `You are Pantryo's zero-waste culinary assistant and bilingual web recipe researcher.
Your primary directive is to ELIMINATE FOOD WASTE by finding authentic recipes on the web that make delicious, creative use of the user's expiring ingredients and on-hand pantry stock.
${websitesDirective}

STRICT MEAL CATEGORY CONSTRAINT:
${mealConstraint}
Every single recipe MUST match the meal slot: "${targetMealType}".

CRITICAL REQUIREMENT - AUTOMATIC TRANSLATION:
User's preferred language: ${language === "FR" ? "French (Français)" : "English"}.
Whatever the language of the source website, automatically translate every element into ${language === "FR" ? "French" : "English"}!
Provide complete bilingual fields for both English and French (title, titleFr, ingredients with name and nameFr, instructionsEn, instructionsFr, zeroWasteReason).
Format your final response strictly as a JSON array inside a \`\`\`json ... \`\`\` block.`;

      const prompt = `Search the web for 3 to 4 fantastic, waste-preventing ${targetMealType.toLowerCase()} recipes.

${mealConstraint}

URGENT / EXPIRING ITEMS TO RESCUE:
${expiringPromptList}

OTHER INGREDIENTS IN KITCHEN:
${otherInventoryList}

USER PREFERENCE / SEARCH: ${query ? `${query} (${targetMealType})` : `Easy, wholesome, zero-waste ${targetMealType.toLowerCase()}`}
${websitesDirective}
PREFERRED DISPLAY LANGUAGE: ${language}

REQUIREMENTS:
1. STRICT MEAL CATEGORY: Every recipe must be an authentic ${targetMealType} recipe!
2. Prioritize using the expiring items above so they are not thrown away.
3. Return a JSON array with 3 to 4 recipe objects inside a \`\`\`json\`\`\` code block.
Each recipe object must have:
- "title": English title of the dish
- "titleFr": French title of the dish
- "mealType": "${targetMealType}"
- "suitableMealTypes": ["${targetMealType}"]
- "source": Name of website or publication (e.g. "Ricardo Cuisine", "Marmiton", "750g", "Serious Eats", "Allrecipes")
- "sourceUrl": Direct URL to the recipe on the web
- "imageUrl": A high-quality food image URL (Unsplash or direct source image)
- "prepTime": e.g. "15 mins"
- "cookTime": e.g. "20 mins"
- "totalTime": e.g. "35 mins"
- "servings": e.g. "4 servings"
- "difficulty": "Easy", "Medium", or "Advanced"
- "difficultyFr": "Facile", "Moyen", ou "Avancé"
- "zeroWasteReason": One concise sentence explaining which expiring ingredients this recipe rescues (in ${language === "FR" ? "French" : "English"})
- "rescuedIngredients": Array of the specific expiring item names from user's inventory used in this dish
- "ingredients": Array of { "name": string, "nameFr": string, "amount": string, "inStock": boolean, "category": string }
- "instructionsEn": Array of 3 to 5 step-by-step instructions in English
- "instructionsFr": Array of 3 to 5 step-by-step instructions in French
- "tags": Array of 3 tags including "${targetMealType}" (e.g. ["${targetMealType}", "Anti-Gaspillage", "Web Recipe"])`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text || "";
      let cleanJson = rawText.trim();
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      // Extract search grounding chunks for citation and links
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webLinks = groundingChunks
        .map((c) => c.web)
        .filter(Boolean);

      try {
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          webSuggestions = parsed.map((r, idx) => {
            // Assign fallback web source link if model output was generic
            const matchedLink = webLinks[idx] || webLinks[0];
            const sourceUrl =
              r.sourceUrl && r.sourceUrl.startsWith("http")
                ? r.sourceUrl
                : matchedLink?.uri || "https://www.ricardocuisine.com";

            const source =
              r.source ||
              (matchedLink?.title ? matchedLink.title.split(" - ")[0] : "Web Recipe");

            // Recalculate accurate inStock based on current inventory
            const checkedIngredients = (r.ingredients || []).map((ing) => {
              const ingName = (ing.name || "").toLowerCase();
              const found = (inventory || []).some((it) => {
                const itName = it.name.toLowerCase();
                return itName.includes(ingName) || ingName.includes(itName);
              });
              return {
                ...ing,
                inStock: found,
              };
            });

            const inStockCount = checkedIngredients.filter((i) => i.inStock).length;
            const matchPercentage =
              checkedIngredients.length > 0
                ? Math.round((inStockCount / checkedIngredients.length) * 100)
                : 75;

            return {
              id: `web_rec_${Date.now()}_${idx}`,
              title: r.title || "Smart Zero-Waste Meal",
              titleFr: r.titleFr || r.title || "Repas anti-gaspillage",
              source: `${source} (Web)`,
              sourceUrl,
              imageUrl:
                r.imageUrl ||
                "",
              prepTime: r.prepTime || "15 mins",
              cookTime: r.cookTime || "20 mins",
              totalTime: r.totalTime || "35 mins",
              servings: r.servings || "4 servings",
              difficulty: r.difficulty || "Easy",
              difficultyFr: r.difficultyFr || "Facile",
              zeroWasteReason:
                r.zeroWasteReason ||
                (language === "FR"
                  ? "Idéal pour utiliser vos ingrédients frais sans rien jeter."
                  : "Specially tailored to use up your fresh items without waste."),
              rescuedIngredients: Array.isArray(r.rescuedIngredients)
                ? r.rescuedIngredients
                : expiringItems.slice(0, 2).map((i) => i.name),
              matchPercentage,
              ingredients: checkedIngredients,
              instructionsEn: Array.isArray(r.instructionsEn) && r.instructionsEn.length > 0
                ? r.instructionsEn
                : [
                    `Prepare ${checkedIngredients[0]?.name || r.title || 'ingredients'}, washing and slicing into neat portions.`,
                    "Heat olive oil or butter in a skillet or pot over medium-high heat.",
                    `Cook ${checkedIngredients[0]?.name || 'main ingredients'} until fragrant, golden, and tender (6-8 mins).`,
                    `Stir in ${checkedIngredients[1]?.name || 'remaining ingredients'}, reduce heat, and simmer gently for 5 minutes.`,
                    "Season to taste with salt, pepper, and fresh herbs. Serve hot and fresh.",
                  ],
              instructionsFr: Array.isArray(r.instructionsFr) && r.instructionsFr.length > 0
                ? r.instructionsFr
                : [
                    `Préparer ${checkedIngredients[0]?.nameFr || r.titleFr || r.title || 'les ingrédients'}, laver et découper soigneusement.`,
                    "Faire chauffer l'huile d'olive ou le beurre dans une poêle à feu moyen-vif.",
                    `Faire revenir ${checkedIngredients[0]?.nameFr || 'les ingrédients principaux'} 6 à 8 minutes jusqu'à belle coloration dorée.`,
                    `Incorporer ${checkedIngredients[1]?.nameFr || 'le reste des ingrédients'}, baisser le feu et laisser mijoter 5 minutes.`,
                    "Assaisonner de sel, poivre et herbes aromatiques. Servir chaud et savoureux.",
                  ],
              tags: r.tags || [targetMealType, "Web Recipe", "Zero-Waste"],
              mealType: targetMealType,
              suitableMealTypes: r.suitableMealTypes || [targetMealType],
              isWebSearch: true,
            };
          });
        }
      } catch (parseErr) {
        console.warn("[Smart Meal Suggestions] JSON parse failed, using web fallbacks:", parseErr);
      }
    } catch (apiErr) {
      console.error("[Smart Meal Suggestions] Gemini search failed:", apiErr);
    }
  }

  // 3. Fallback Dynamic Web Suggestions if Gemini API was offline or returned 0
  if (webSuggestions.length === 0) {
    webSuggestions = generateFallbackWebSuggestions({
      inventory,
      expiringItems,
      targetMealType,
      language,
    });
  }

  // Combined suggestions
  const allSuggestions = [...webSuggestions, ...userRecipeMatches].sort((a, b) => {
    if (b.rescuedIngredients.length !== a.rescuedIngredients.length) {
      return b.rescuedIngredients.length - a.rescuedIngredients.length;
    }
    return b.matchPercentage - a.matchPercentage;
  });

  return {
    success: true,
    targetDate,
    targetMealType,
    expiringItemsCount: expiringItems.length,
    expiringItems: expiringItems.map((i) => ({
      name: i.name,
      daysUntilExpiration: i.daysUntilExpiration,
    })),
    webSuggestions,
    userRecipeMatches,
    allSuggestions,
  };
}

/**
 * Generates tailored fallback web suggestions when API key is pending
 * Strictly specialized for BREAKFAST, LUNCH, DINNER, or SNACK
 */
/**
 * Generates tailored fallback web suggestions when API key is pending
 * Strictly specialized for BREAKFAST, LUNCH, DINNER, or SNACK
 */
function generateFallbackWebSuggestions({
  inventory = [],
  expiringItems = [],
  targetMealType = "DINNER",
  language = "EN",
}) {
  const topExpiringNames = expiringItems.map((i) => i.name);
  const heroRaw = topExpiringNames[0] || (inventory[0] ? inventory[0].name : "Fresh Ingredients");
  const secondaryRaw = topExpiringNames[1] || (inventory[1] ? inventory[1].name : "Herbs & Veggies");

  const heroBiling = getBilingualNames(heroRaw, language);
  const heroEn = heroBiling.nameEn || heroRaw;
  const heroFr = heroBiling.nameFr || heroRaw;

  const secBiling = getBilingualNames(secondaryRaw, language);
  const secEn = secBiling.nameEn || secondaryRaw;
  const secFr = secBiling.nameFr || secondaryRaw;

  if (targetMealType === "BREAKFAST") {
    return [
      {
        id: "web_fallback_bfast_01",
        title: `Golden Zero-Waste Morning Hash with ${heroEn} & Fried Eggs`,
        titleFr: `Poêlée déjeuner dorée aux œufs et ${heroFr}`,
        source: "Ricardo Cuisine (Web)",
        sourceUrl: "https://www.ricardocuisine.com/en/recipes/breakfast-and-brunch",
        imageUrl: "https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?auto=format&fit=crop&w=800&q=80",
        prepTime: "5 mins",
        cookTime: "12 mins",
        totalTime: "17 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Transforme votre ${heroFr} en un savoureux déjeuner nourrissant avant qu'il ne se perde.`
            : `Transforms your ${heroEn} into a satisfying morning skillet before it goes to waste.`,
        rescuedIngredients: [heroRaw, secondaryRaw].filter(Boolean),
        matchPercentage: 90,
        mealType: "BREAKFAST",
        suitableMealTypes: ["BREAKFAST"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "1.5 cups diced", inStock: true, category: "Produce" },
          { name: "Fresh Eggs", nameFr: "Œufs frais", amount: "4 eggs", inStock: true, category: "Dairy & Eggs" },
          { name: "Butter or Olive Oil", nameFr: "Beurre ou huile d'olive", amount: "1 tbsp", inStock: true, category: "Pantry" },
          { name: "Salt, Pepper & Paprika", nameFr: "Sel, poivre et paprika", amount: "To taste", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Dice ${heroEn} into small, uniform cubes for quick cooking.`,
          "Heat butter or oil in a heavy skillet over medium-high heat.",
          `Sauté ${heroEn} until tender and golden brown with crispy edges (8 mins).`,
          "Make two wells in the hash and crack the eggs directly inside. Cover for 3-4 minutes until whites are set.",
          "Season with salt, pepper, and paprika. Serve warm.",
        ],
        instructionsFr: [
          `Couper ${heroFr} en petits dés réguliers pour une cuisson rapide.`,
          "Faire chauffer le beurre ou l'huile dans une poêle à feu moyen-vif.",
          `Faire dorer ${heroFr} jusqu'à ce qu'il soit bien doré et croustillant (8 min).`,
          "Former des puits et casser les œufs directement dedans. Couvrir 3-4 minutes jusqu'à cuisson voulue.",
          "Assaisonner de sel, poivre et paprika. Servir bien chaud.",
        ],
        tags: ["BREAKFAST", "Anti-Gaspillage", "Quick Morning"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_bfast_02",
        title: `Fluffy Farmhouse Breakfast Omelette with ${heroEn}`,
        titleFr: `Omelette paysanne moelleuse au ${heroFr}`,
        source: "Marmiton (Web)",
        sourceUrl: "https://www.marmiton.org/recettes/recherche.aspx?aqt=omelette",
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
        prepTime: "5 mins",
        cookTime: "8 mins",
        totalTime: "13 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Une excellente manière d'utiliser ${heroFr} avec des œufs dès le réveil.`
            : `A delicious way to utilize ${heroEn} with wholesome eggs for breakfast.`,
        rescuedIngredients: [heroRaw].filter(Boolean),
        matchPercentage: 85,
        mealType: "BREAKFAST",
        suitableMealTypes: ["BREAKFAST"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "1 cup chopped", inStock: true, category: "Produce" },
          { name: "Large Eggs", nameFr: "Gros œufs", amount: "4 eggs", inStock: true, category: "Dairy & Eggs" },
          { name: "Cheese or Milk", nameFr: "Fromage ou lait", amount: "2 tbsp", inStock: true, category: "Dairy & Eggs" },
        ],
        instructionsEn: [
          "Whisk eggs with a splash of milk, salt, and black pepper.",
          `Quickly cook ${heroEn} in a nonstick pan with butter until tender.`,
          "Pour eggs over top and cook gently, folding gently until fluffy and creamy.",
        ],
        instructionsFr: [
          "Battre les œufs avec une cuillère de lait, sel et poivre.",
          `Faire revenir rapidement ${heroFr} dans une poêle antiadhésive avec une noix de beurre.`,
          "Verser les œufs et cuire doucement en pliant pour une texture moelleuse et baveuse.",
        ],
        tags: ["BREAKFAST", "Omelette", "High-Protein"],
        isWebSearch: true,
      },
    ];
  }

  if (targetMealType === "LUNCH") {
    return [
      {
        id: "web_fallback_lunch_01",
        title: `Toasted Artisan Lunch Panini with ${heroEn}`,
        titleFr: `Panini artisanal grillé du midi au ${heroFr}`,
        source: "Serious Eats (Web)",
        sourceUrl: "https://www.seriouseats.com/sandwich-recipes",
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
        prepTime: "8 mins",
        cookTime: "6 mins",
        totalTime: "14 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Donne une seconde vie à votre ${heroFr} dans un sandwich chaud et croustillant.`
            : `Gives your ${heroEn} a second life inside a warm, golden pressed sandwich.`,
        rescuedIngredients: [heroRaw].filter(Boolean),
        matchPercentage: 88,
        mealType: "LUNCH",
        suitableMealTypes: ["LUNCH"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "1 cup sliced", inStock: true, category: "Produce" },
          { name: "Crusty Bread or Ciabatta", nameFr: "Pain croûté ou ciabatta", amount: "4 slices", inStock: true, category: "Bakery" },
          { name: "Cheese slices", nameFr: "Tranches de fromage", amount: "2 slices", inStock: true, category: "Dairy & Eggs" },
          { name: "Mustard or Mayo", nameFr: "Moutarde ou mayo", amount: "1 tbsp", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          "Spread condiments over bread slices.",
          `Layer sliced cheese and cooked or roasted ${heroEn}.`,
          "Toast in a hot skillet or press with a touch of butter until golden and melted.",
        ],
        instructionsFr: [
          "Tartiner le pain avec vos condiments préférés.",
          `Garnir de tranches de fromage et de ${heroFr} émincé.`,
          "Griller dans une poêle chaude avec un peu de beurre jusqu'à ce que le fromage fonde.",
        ],
        tags: ["LUNCH", "Sandwich", "Anti-Gaspillage"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_lunch_02",
        title: `Fresh Mediterranean Power Lunch Bowl with ${heroEn}`,
        titleFr: `Bol repas méditerranéen du midi au ${heroFr}`,
        source: "Trois Fois Par Jour (Web)",
        sourceUrl: "https://www.troisfoisparjour.com",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        prepTime: "10 mins",
        cookTime: "0 mins",
        totalTime: "10 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Associe ${heroFr} et ${secFr} dans une salade-repas fraîche et équilibrée.`
            : `Combines ${heroEn} and ${secEn} in a crisp, balanced power bowl.`,
        rescuedIngredients: [heroRaw, secondaryRaw].filter(Boolean),
        matchPercentage: 85,
        mealType: "LUNCH",
        suitableMealTypes: ["LUNCH"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "1 cup chopped", inStock: true, category: "Produce" },
          { name: secEn, nameFr: secFr, amount: "1/2 cup", inStock: true, category: "Produce" },
          { name: "Greens or Cooked Grains", nameFr: "Salade verte ou grains", amount: "2 cups", inStock: true, category: "Produce" },
          { name: "Vinaigrette", nameFr: "Vinaigrette maison", amount: "2 tbsp", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          "Assemble grains or greens in serving bowls.",
          `Top with ${heroEn}, ${secEn}, and pantry toppings.`,
          "Drizzle with vinaigrette and toss lightly before serving.",
        ],
        instructionsFr: [
          "Disposer la verdure ou les grains dans les bols.",
          `Garnir avec ${heroFr}, ${secFr} et vos graines ou noix.`,
          "Arroser de vinaigrette et mélanger avant de déguster.",
        ],
        tags: ["LUNCH", "Salad Bowl", "Fresh"],
        isWebSearch: true,
      },
    ];
  }

  if (targetMealType === "SNACK") {
    return [
      {
        id: "web_fallback_snack_01",
        title: `Crispy Herb & Spiced Roasted ${heroEn} Bites`,
        titleFr: `Bouchées croustillantes et épicées de ${heroFr} rôti`,
        source: "Allrecipes (Web)",
        sourceUrl: "https://www.allrecipes.com/recipes/76/appetizers-and-snacks",
        imageUrl: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80",
        prepTime: "5 mins",
        cookTime: "12 mins",
        totalTime: "17 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Idéal pour grignoter sans gaspiller vos surplus de ${heroFr}.`
            : `Perfect crispy snack that utilizes leftover ${heroEn}.`,
        rescuedIngredients: [heroRaw].filter(Boolean),
        matchPercentage: 90,
        mealType: "SNACK",
        suitableMealTypes: ["SNACK"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "200g cut into bite sizes", inStock: true, category: "Produce" },
          { name: "Olive Oil & Salt", nameFr: "Huile d'olive et sel", amount: "1 tbsp oil, pinch salt", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Toss ${heroEn} with olive oil, salt, and favourite spices.`,
          "Roast in hot air fryer or oven at 400°F (200°C) until crispy and browned (10-12 mins).",
          "Cool slightly and enjoy warm.",
        ],
        instructionsFr: [
          `Mélanger ${heroFr} avec l'huile d'olive, le sel et vos épices préférées.`,
          "Cuire à l'air fryer ou au four à 200°C (400°F) jusqu'à consistance bien croustillante (10-12 min).",
          "Laisser tiédir et savourer comme collation.",
        ],
        tags: ["SNACK", "Collation", "Crispy"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_snack_02",
        title: `Creamy Zero-Waste ${heroEn} Dip with Pita Chips`,
        titleFr: `Trempette crémeuse au ${heroFr} et croustilles de pita`,
        source: "Marmiton (Web)",
        sourceUrl: "https://www.marmiton.org/recettes/recherche.aspx?aqt=apero",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
        prepTime: "8 mins",
        cookTime: "0 mins",
        totalTime: "8 mins",
        servings: "3 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Mixez ${heroFr} avec du yogourt ou fromage à la crème pour une superbe collation anti-gaspi.`
            : `Blend ${heroEn} with yogurt or cream cheese for an easy anti-waste dip.`,
        rescuedIngredients: [heroRaw].filter(Boolean),
        matchPercentage: 85,
        mealType: "SNACK",
        suitableMealTypes: ["SNACK"],
        ingredients: [
          { name: heroEn, nameFr: heroFr, amount: "1 cup", inStock: true, category: "Produce" },
          { name: "Greek Yogurt or Cream Cheese", nameFr: "Yogourt grec ou fromage blanc", amount: "1/2 cup", inStock: true, category: "Dairy & Eggs" },
          { name: "Lemon juice & Garlic", nameFr: "Jus de citron et ail", amount: "1 tsp each", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Blend or finely mash ${heroEn} with yogurt, lemon, and seasonings until smooth.`,
          "Serve in a bowl alongside crackers, pita, or raw veggies.",
        ],
        instructionsFr: [
          `Mixer ou écraser finement ${heroFr} avec le yogourt, le citron et les aromates.`,
          "Servir dans un bol avec des craquelins, des pitas ou des crudités.",
        ],
        tags: ["SNACK", "Dip", "Apéro"],
        isWebSearch: true,
      },
    ];
  }

  // Default: DINNER
  return [
    {
      id: "web_fallback_dinner_01",
      title: `Crispy Skillet Toss with ${heroEn} & Garlic Butter`,
      titleFr: `Poêlée croustillante au beurre d'ail avec ${heroFr}`,
      source: "Ricardo Cuisine (Web)",
      sourceUrl: "https://www.ricardocuisine.com/en/recipes/sheet-pan-dinners",
      imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
      prepTime: "10 mins",
      cookTime: "15 mins",
      totalTime: "25 mins",
      servings: "4 servings",
      difficulty: "Easy",
      difficultyFr: "Facile",
      zeroWasteReason:
        language === "FR"
          ? `Consomme directement votre ${heroFr} et ${secFr} avant qu'ils ne se perdent.`
          : `Directly uses up your ${heroEn} and ${secEn} to eliminate kitchen waste.`,
      rescuedIngredients: [heroRaw, secondaryRaw].filter(Boolean),
      matchPercentage: 90,
      mealType: "DINNER",
      suitableMealTypes: ["DINNER"],
      ingredients: [
        { name: heroEn, nameFr: heroFr, amount: "300g", inStock: true, category: "Produce" },
        { name: secEn, nameFr: secFr, amount: "1 cup", inStock: true, category: "Produce" },
        { name: "Garlic Cloves & Butter", nameFr: "Ail et beurre", amount: "2 tbsp butter, 3 cloves", inStock: true, category: "Dairy & Eggs" },
        { name: "Olive Oil & Seasonings", nameFr: "Huile d'olive et assaisonnements", amount: "1 tbsp oil, pinch of salt", inStock: true, category: "Pantry" },
      ],
      instructionsEn: [
        "Chop all ingredients into bite-sized pieces.",
        "Melt butter and olive oil in a large hot skillet over medium-high heat.",
        `Toss in ${heroEn} and cook until tender and slightly caramelized (8-10 mins).`,
        `Add ${secEn} and minced garlic, tossing vigorously for 2 more minutes.`,
        "Season with fresh cracked black pepper and serve hot.",
      ],
      instructionsFr: [
        "Couper tous les ingrédients en morceaux réguliers.",
        "Faire fondre le beurre et l'huile dans une grande poêle chaude à feu moyen-vif.",
        `Faire sauter ${heroFr} jusqu'à tendreté et belle coloration dorée (8-10 min).`,
        `Ajouter ${secFr} et l'ail haché, mélanger 2 minutes supplémentaires.`,
        "Assaisonner de poivre moulu et servir chaud immédiatement.",
      ],
      tags: ["DINNER", "Anti-Gaspillage", "Quick Skillet", "Web Recipe"],
      isWebSearch: true,
    },
    {
      id: "web_fallback_dinner_02",
      title: `Zero-Waste Chef's Frittata & Sheet-Pan Roast with ${heroEn}`,
      titleFr: `Frittata anti-gaspillage du chef au ${heroFr}`,
      source: "Serious Eats (Web)",
      sourceUrl: "https://www.seriouseats.com/easy-frittata-recipes",
      imageUrl: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80",
      prepTime: "10 mins",
      cookTime: "20 mins",
      totalTime: "30 mins",
      servings: "4 servings",
      difficulty: "Easy",
      difficultyFr: "Facile",
      zeroWasteReason:
        language === "FR"
          ? `La méthode reine anti-gaspillage : transforme vos restes de frigo en un savoureux souper doré.`
          : `The gold-standard zero-waste method: transforms fridge odds and ends into a golden, fluffy dinner.`,
      rescuedIngredients: [heroRaw].filter(Boolean),
      matchPercentage: 85,
      mealType: "DINNER",
      suitableMealTypes: ["DINNER"],
      ingredients: [
        { name: heroEn, nameFr: heroFr, amount: "1.5 cups diced", inStock: true, category: "Produce" },
        { name: "Fresh Eggs", nameFr: "Œufs frais", amount: "6 large eggs", inStock: true, category: "Dairy & Eggs" },
        { name: "Grated Cheese", nameFr: "Fromage râpé", amount: "1/2 cup", inStock: true, category: "Dairy & Eggs" },
        { name: "Milk or Cream", nameFr: "Lait ou crème", amount: "1/4 cup", inStock: true, category: "Dairy & Eggs" },
      ],
      instructionsEn: [
        "Preheat oven to 375°F (190°C). Whisk eggs with milk, salt, and pepper in a medium bowl.",
        `Sauté ${heroEn} in an oven-safe skillet with a little oil until tender.`,
        "Pour whisked eggs evenly over the skillet and sprinkle with cheese.",
        "Bake for 14-18 minutes until puffed, golden, and set in the center.",
      ],
      instructionsFr: [
        "Préchauffer le four à 190°C (375°F). Battre les œufs avec le lait, le sel et le poivre.",
        `Faire revenir ${heroFr} dans une poêle allant au four avec un filet d'huile.`,
        "Verser les œufs battus uniformément et saupoudrer de fromage.",
        "Cuire au four 14 à 18 minutes jusqu'à ce que la frittata soit dorée et prise au centre.",
      ],
      tags: ["DINNER", "Anti-Gaspillage", "High-Protein", "Web Recipe"],
      isWebSearch: true,
    },
  ];
}

/**
 * Synthesizes complete, delicious, authentic step-by-step cooking instructions
 * in both English and French for any recipe (from suggestions, web URLs, or scratch).
 * Uses Gemini AI if available with automatic culinary heuristic fallback.
 */
export async function synthesizeCookingSteps({
  title = "Homemade Recipe",
  titleFr = "",
  ingredients = [],
  mealType = "DINNER",
  sourceUrl = "",
  language = "FR",
  description = "",
}) {
  const cleanTitle = title || "Savory Dish";
  const cleanTitleFr = titleFr || title || "Plat Savoureux";

  const ingNamesEn = (ingredients || [])
    .map((i) => i.nameEn || i.name || "")
    .filter(Boolean);
  const ingNamesFr = (ingredients || [])
    .map((i) => i.nameFr || i.name || "")
    .filter(Boolean);

  const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
  const hasGemini = Boolean(apiKey && apiKey.length > 10 && apiKey !== "MY_GEMINI_API_KEY");

  if (hasGemini) {
    try {
      const ai = getGeminiClient();
      const prompt = `You are an expert bilingual chef and culinary instructor.
Generate 4 to 6 authentic, delicious, step-by-step cooking instructions in BOTH English and French for this recipe:

Recipe Title (EN): ${cleanTitle}
Recipe Title (FR): ${cleanTitleFr}
Meal Category: ${mealType}
${description ? `Description: ${description}` : ""}
${sourceUrl ? `Source: ${sourceUrl}` : ""}
Ingredients List: ${ingNamesEn.join(", ") || "Fresh kitchen ingredients"}

Requirements:
1. Provide realistic culinary instructions with preparation, cooking temperatures, timing, and plating.
2. Output JSON strictly with:
{
  "instructionsEn": ["Step 1...", "Step 2...", "Step 3...", "Step 4...", "Step 5..."],
  "instructionsFr": ["Étape 1...", "Étape 2...", "Étape 3...", "Étape 4...", "Étape 5..."],
  "prepTime": "15 mins",
  "cookTime": "20 mins",
  "totalTime": "35 mins"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text || "";
      let clean = text.trim();
      if (clean.includes("```json")) {
        clean = clean.split("```json")[1].split("```")[0].trim();
      } else if (clean.includes("```")) {
        clean = clean.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(clean);
      if (
        Array.isArray(parsed.instructionsEn) &&
        parsed.instructionsEn.length > 0 &&
        Array.isArray(parsed.instructionsFr) &&
        parsed.instructionsFr.length > 0
      ) {
        return {
          success: true,
          instructionsEn: parsed.instructionsEn,
          instructionsFr: parsed.instructionsFr,
          prepTime: parsed.prepTime || "15 mins",
          cookTime: parsed.cookTime || "25 mins",
          totalTime: parsed.totalTime || "40 mins",
        };
      }
    } catch (err) {
      console.warn("[synthesizeCookingSteps] Gemini synthesis warning, falling back to culinary rules:", err.message);
    }
  }

  // Culinary rules-based synthesis fallback
  const heroFr = ingNamesFr[0] || "ingrédients principaux";
  const heroEn = ingNamesEn[0] || "main ingredients";
  const secFr = ingNamesFr[1] || "légumes et assaisonnements";
  const secEn = ingNamesEn[1] || "vegetables and seasonings";

  const lower = cleanTitle.toLowerCase();
  const isBake = /bake|cake|muffin|bread|pie|tart|gratin|quiche|pizza|cookie|four|gâteau/i.test(lower);
  const isSoup = /soup|stew|broth|potage|velouté|soupe|mijoté/i.test(lower);
  const isSalad = /salad|salade|slaw|vinaigrette/i.test(lower);
  const isPasta = /pasta|spaghetti|penne|linguine|pâtes|lasagn/i.test(lower);

  let stepsEn = [];
  let stepsFr = [];

  if (isBake) {
    stepsEn = [
      "Preheat your oven to 375°F (190°C) and lightly grease or line your baking dish or pan.",
      `Prepare ${heroEn} and ${secEn}, chopping or measuring them into clean prep bowls.`,
      "Combine wet and dry ingredients gently in a large mixing bowl until just incorporated.",
      "Transfer into the prepared dish and bake for 25-30 minutes until golden and cooked through.",
      "Allow to cool for 5 minutes on a wire rack before slicing and serving.",
    ];
    stepsFr = [
      "Préchauffer le four à 190°C (375°F) et beurrer ou tapisser un plat ou une plaque de cuisson.",
      `Préparer ${heroFr} et ${secFr}, en les coupant ou les dosant dans des bols de préparation.`,
      "Mélanger délicatement les ingrédients dans un grand saladier jusqu'à consistance homogène.",
      "Transférer dans le plat et enfourner 25 à 30 minutes jusqu'à ce que la surface soit dorée et cuite à cœur.",
      "Laisser tiédir 5 minutes sur une grille avant de découper et servir.",
    ];
  } else if (isSoup) {
    stepsEn = [
      "Wash and chop all vegetables into bite-sized pieces; mince garlic and fresh herbs.",
      `Heat a drizzle of olive oil or butter in a large pot over medium heat. Sauté ${heroEn} and aromatics for 5-7 minutes.`,
      `Add ${secEn} along with broth or water until ingredients are covered. Bring to a gentle boil.`,
      "Reduce heat to low, cover with a lid, and simmer for 20 minutes until tender and flavorful.",
      "Season with salt, black pepper, and fresh herbs. Serve piping hot with crusty bread.",
    ];
    stepsFr = [
      "Laver et couper tous les légumes en morceaux réguliers; émincer l'ail et les herbes fraîches.",
      `Faire chauffer un filet d'huile d'olive ou une noix de beurre dans une marmite. Faire suer ${heroFr} et les aromates 5 à 7 minutes.`,
      `Ajouter ${secFr} ainsi que le bouillon ou de l'eau pour couvrir les ingrédients. Porter à frémissement.`,
      "Baisser le feu, couvrir et laisser mijoter 20 minutes jusqu'à ce que les saveurs soient bien développées.",
      "Ajuster l'assaisonnement avec sel, poivre et herbes. Servir bien chaud accompagné de pain croustillant.",
    ];
  } else if (isSalad) {
    stepsEn = [
      "Thoroughly wash and spin dry greens and fresh produce.",
      `Slice or dice ${heroEn} and ${secEn} into uniform, attractive pieces.`,
      "Whisk together extra virgin olive oil, vinegar or lemon juice, salt, and pepper in a small bowl for the dressing.",
      "Toss the fresh ingredients together in a large salad bowl with the dressing until evenly coated.",
      "Garnish with toasted nuts, seeds, or cheese if desired and serve fresh.",
    ];
    stepsFr = [
      "Bien laver et essorer la verdure et les légumes frais.",
      `Couper ${heroFr} et ${secFr} en morceaux harmonieux et réguliers.`,
      "Fouetter l'huile d'olive extra vierge avec du vinaigre ou jus de citron, sel et poivre pour la vinaigrette.",
      "Mélanger délicatement les ingrédients dans un grand saladier avec la vinaigrette pour bien les enrober.",
      "Garnir de graines, noix grillées ou fromage au choix et servir bien frais.",
    ];
  } else if (isPasta) {
    stepsEn = [
      "Bring a large pot of salted water to a rolling boil and cook pasta until al dente.",
      `In a skillet over medium heat, heat olive oil and sauté ${heroEn} with garlic until aromatic.`,
      `Add ${secEn} and a ladleful of starchy pasta water; simmer gently to create a silky sauce.`,
      "Drain pasta and toss immediately into the skillet with the sauce over low heat for 1 minute.",
      "Finish with freshly grated cheese, cracked black pepper, and fresh herbs before serving.",
    ];
    stepsFr = [
      "Porter une grande casserole d'eau salée à ébullition et cuire les pâtes jusqu'à ce qu'elles soient al dente.",
      `Dans une poêle à feu moyen, chauffer l'huile d'olive et faire revenir ${heroFr} avec l'ail jusqu'à coloration parfumée.`,
      `Ajouter ${secFr} et une louche d'eau de cuisson des pâtes; laisser frémir pour lier la sauce.`,
      "Égoutter les pâtes et les verser directement dans la poêle avec la sauce à feu doux pendant 1 minute.",
      "Garnir de fromage fraîchement râpé, poivre du moulin et herbes fraîches avant de servir.",
    ];
  } else {
    stepsEn = [
      `Prepare ${heroEn} and ${secEn}, chopping vegetables and seasoning any proteins with salt and pepper.`,
      "Heat olive oil or butter in a wide skillet or pan over medium-high heat.",
      `Add ${heroEn} and cook for 6 to 8 minutes, stirring occasionally until golden brown and fragrant.`,
      `Stir in ${secEn} and lower the heat to medium; cover and simmer for 5 to 7 minutes to meld flavors.`,
      "Taste and adjust seasoning with salt, pepper, and fresh herbs. Serve immediately warm.",
    ];
    stepsFr = [
      `Préparer ${heroFr} et ${secFr}, émincer les légumes et assaisonner les protéines avec sel et poivre.`,
      "Faire chauffer l'huile d'olive ou le beurre dans une grande poêle à feu moyen-vif.",
      `Ajouter ${heroFr} et faire dorer 6 à 8 minutes en remuant de temps en temps jusqu'à belle coloration.`,
      `Incorporer ${secFr} et réduire le feu à moyen; couvrir et laisser mijoter 5 à 7 minutes pour marier les saveurs.`,
      "Goûter et rectifier l'assaisonnement en sel, poivre et herbes fraîches. Servir aussitôt bien chaud.",
    ];
  }

  return {
    success: true,
    instructionsEn: stepsEn,
    instructionsFr: stepsFr,
    prepTime: "15 mins",
    cookTime: "20 mins",
    totalTime: "35 mins",
  };
}
