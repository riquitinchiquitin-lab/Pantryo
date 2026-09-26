import { GoogleGenAI, Type } from "@google/genai";
import Tesseract from "tesseract.js";

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
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
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. If Gemini API key is configured and appears valid, try Gemini Vision first
  if (apiKey && apiKey.trim().length > 15 && !apiKey.startsWith("your_")) {
    try {
      const ai = getGeminiClient();

      const systemInstruction = `You are Pantryo's OCR and AI vision culinary expert.
Your task is to inspect photos of handwritten family recipe cards, printed cookbook pages, magazine clippings, or food packaging.

1. Transcribe the text from the photo with extreme precision.
2. Structure the data into a clean, complete recipe JSON:
   - title: Descriptive title in English.
   - titleFr: French title.
   - descriptionEn: Brief summary of dish.
   - descriptionFr: French summary.
   - prepTime: Estimated prep time.
   - cookTime: Estimated cooking time.
   - totalTime: Total time.
   - servings: Number of servings.
   - difficulty: "Easy", "Medium", or "Advanced".
   - difficultyFr: "Facile", "Moyen", or "Avancé".
   - calories: Estimated calories per serving.
   - tags: Array of descriptive tags.
   - ingredients: Array with { name, nameFr, amount, category, locationType ("FRIDGE", "FREEZER", "PANTRY") }.
   - instructionsEn: Array of step-by-step instructions.
   - instructionsFr: French instructions.

Respond strictly in JSON following the schema.`;

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
              text: `Carefully read this recipe photo and convert it into a structured recipe JSON. Additional user context/notes: ${notes || "None"}.`,
            },
          ],
        },
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
          recipe: normalizeRecipeOutput(parsed, {
            source: "Photo Import",
            imageUrl,
          }),
        };
      }
    } catch (error) {
      console.warn("[Gemini Recipe Parser] Gemini Vision attempt failed, switching to local OCR & Parser:", error.message);
    }
  }

  // 2. High-precision Tesseract OCR fallback: reads actual handwritten cards & cookbook pages
  console.info("[Gemini Recipe Parser] Running Tesseract OCR on recipe image...");
  try {
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const ocrResult = await Tesseract.recognize(imageBuffer, "eng+fra");
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
      source: "Photo Import",
      imageUrl,
    });

    return {
      success: true,
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
 * Normalizes and validates the parsed recipe object
 */
function normalizeRecipeOutput(parsed, extra = {}) {
  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const youtubeId = extra.youtubeId || null;
  const youtubeUrl = extra.youtubeUrl || null;

  // Auto-generate YouTube thumbnail if available
  let imageUrl = extra.imageUrl;
  if (!imageUrl && youtubeId) {
    imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (!imageUrl) {
    imageUrl = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80";
  }

  const ingredients = (parsed.ingredients || []).map((ing) => {
    let loc = (ing.locationType || "PANTRY").toUpperCase();
    if (!["FRIDGE", "FREEZER", "PANTRY"].includes(loc)) {
      loc = "FRIDGE";
    }
    return {
      name: ing.name || "Ingredient",
      nameFr: ing.nameFr || ing.name || "Ingrédient",
      amount: ing.amount || "To taste",
      category: ing.category || "Pantry",
      locationType: loc,
    };
  });

  return {
    id,
    title: parsed.title || "Custom Homemade Recipe",
    titleFr: parsed.titleFr || parsed.title || "Recette maison personnalisée",
    ricardoUrlEn: youtubeUrl || "",
    ricardoUrlFr: youtubeUrl || "",
    youtubeUrl: youtubeUrl || null,
    youtubeVideoId: youtubeId || null,
    imageUrl,
    time: parsed.totalTime || parsed.cookTime || "30 mins",
    prepTime: parsed.prepTime || "10 mins",
    cookTime: parsed.cookTime || "20 mins",
    servings: parsed.servings || "4 servings",
    difficulty: parsed.difficulty || "Easy",
    difficultyFr: parsed.difficultyFr || "Facile",
    calories: parsed.calories || "400 kcal",
    source: extra.source || "Personal",
    isRicardoOfficial: false,
    isCustom: true,
    descriptionEn: parsed.descriptionEn || "Delicious custom recipe saved to your kitchen.",
    descriptionFr: parsed.descriptionFr || "Délicieuse recette personnalisée enregistrée dans votre cuisine.",
    tags: parsed.tags || [extra.source || "Personal", "Custom Recipe"],
    ingredients,
    instructionsEn: parsed.instructionsEn || ["Prepare ingredients according to recipe directions.", "Cook thoroughly and serve hot."],
    instructionsFr: parsed.instructionsFr || parsed.instructionsEn || ["Préparer les ingrédients selon les étapes.", "Bien cuire et servir chaud."],
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

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Extract Title candidate
  let titleCandidate = "";
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const l = lines[i];
    const prefixMatch = l.match(/^(?:recette|recipe|titre|title)\s*[:\-]\s*(.+)$/i);
    if (prefixMatch) {
      titleCandidate = prefixMatch[1].trim();
      break;
    }
  }

  // If no prefix, pick the first line that is not a generic header
  if (!titleCandidate) {
    for (let i = 0; i < Math.min(lines.length, 4); i++) {
      const l = lines[i];
      if (!/^(?:ingr|direct|instruct|step|étap|temps|time|serv|port|prep|cuiss)/i.test(l) && l.length > 2 && l.length < 70) {
        titleCandidate = l.replace(/^[-*•#\d.]+\s*/, "").trim();
        break;
      }
    }
  }
  if (!titleCandidate || titleCandidate.length < 3) {
    titleCandidate = language === "FR" ? "Recette maison scannée" : "Scanned Homemade Recipe";
  }

  // Extract prep/cook time and servings
  let prepTime = "15 mins";
  let cookTime = "25 mins";
  let servings = "4";

  for (const line of lines) {
    const prepMatch = line.match(/(?:prep(?:aration)?|prép(?:aration)?)\s*[:\-]?\s*(\d+\s*(?:min|m|h|hr|minutes?|heures?))/i);
    if (prepMatch) prepTime = prepMatch[1].trim();

    const cookMatch = line.match(/(?:cook(?:ing)?|cuisson)\s*[:\-]?\s*(\d+\s*(?:min|m|h|hr|minutes?|heures?))/i);
    if (cookMatch) cookTime = cookMatch[1].trim();

    const servMatch = line.match(/(?:servings?|portions?|pour)\s*[:\-]?\s*(\d+(?:\s*[-àa]\s*\d+)?\s*(?:personnes?|portions?|servings?)?)/i);
    if (servMatch) servings = servMatch[1].trim();
  }

  // Section splitting
  const ingredients = [];
  const instructions = [];
  let currentSection = "ingredients";

  const ingredientKeywords = /^(?:ingr[ée]dients?|composants?|what you need|items?|ingredients list)/i;
  const instructionKeywords = /^(?:instructions?|[ée]tapes?|directions?|pr[ée]paration|m[ée]thode|steps?|procedure|cooking steps|r[ée]alisation)/i;

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

    const isStepNumber = /^(\d+[\.\)]|step\s*\d+|étape\s*\d+)/i.test(line);
    const hasCookingAction = /\b(mélanger|cuire|faire chauffer|préchauffer|enfourner|verser|ajouter|assaisonner|battre|sauter|rôtir|mijoter|mix|cook|bake|heat|preheat|stir|pour|add|season|whisk|sauté|simmer|roast|fry)\b/i.test(line);

    if (isStepNumber || (hasCookingAction && line.length > 25)) {
      currentSection = "instructions";
    }

    if (currentSection === "ingredients") {
      const cleanLine = line.replace(/^[-*•+–—\s]+/, "").trim();
      if (cleanLine.length < 2) continue;

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
      } else if (/(chicken|poulet|beef|boeuf|bœuf|pork|porc|fish|poisson|shrimp|crevette|salmon|saumon|steak|meat|viande|bacon|dinde|turkey)/.test(lowerName)) {
        category = "Meat & Seafood";
        locationType = "FRIDGE";
      } else if (/(pomme|apple|onion|oignon|garlic|ail|tomate|tomato|spinach|épinard|carrot|carotte|potato|pomme de terre|citron|lemon|lime|herbe|herb|basil|parsley|persil|rosemary|romarin|salade|lettuce|poivron|pepper|champignon|mushroom)/.test(lowerName)) {
        category = "Produce";
        locationType = /(potato|pomme de terre|onion|oignon|garlic|ail)/.test(lowerName) ? "PANTRY" : "FRIDGE";
      } else if (/(ice cream|glace|congel|frozen|petits pois surgel)/.test(lowerName)) {
        category = "Frozen Foods";
        locationType = "FREEZER";
      } else if (/(pain|bread|baguette|croissant|tortilla|brioche|croûte|crust|pâte)/.test(lowerName)) {
        category = "Bakery";
        locationType = "PANTRY";
      } else if (/(flour|farine|sugar|sucre|oil|huile|vinegar|vinaigre|pasta|pâtes|rice|riz|salt|sel|poivre|pepper|bouillon|broth|sauce|spices|épices|vanilla|vanille|levure|yeast)/.test(lowerName)) {
        category = "Pantry";
        locationType = "PANTRY";
      }

      ingredients.push({
        name,
        nameFr: name,
        amount,
        category,
        locationType,
      });
    } else {
      const cleanStep = line.replace(/^[-*•\d.)\s]+/, "").trim();
      if (cleanStep.length > 5) {
        instructions.push(cleanStep);
      }
    }
  }

  if (ingredients.length === 0 && instructions.length > 0) {
    ingredients.push({
      name: titleCandidate,
      nameFr: titleCandidate,
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

  const recipeId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: recipeId,
    title: titleCandidate,
    titleFr: titleCandidate,
    ricardoUrlEn: youtubeUrl || "",
    ricardoUrlFr: youtubeUrl || "",
    youtubeUrl: youtubeUrl || null,
    youtubeVideoId: youtubeId || null,
    imageUrl: imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80"),
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
    descriptionEn: `Homemade ${titleCandidate} digitized from your personal recipe.`,
    descriptionFr: `${titleCandidate} maison numérisée à partir de votre fiche de recette.`,
    tags: [source, "Custom Recipe", "Home Cooking"],
    ingredients,
    instructionsEn: instructions,
    instructionsFr: instructions,
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
    const feedRes = await fetch(`${origin}/feed/`, {
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
    const pageRes = await fetch(cleanUrl, {
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
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
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

    return {
      id: `site_${domain}_${Date.now()}_${idx}`,
      ...recipe,
      source: recipe.source || domain,
      sourceUrl: recipe.sourceUrl || cleanUrl,
      matchPercentage,
      rescuedIngredients: recipe.rescuedIngredients?.length ? recipe.rescuedIngredients : rescued,
      ingredients: detailedIngredients,
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

  const cleanUrl = url.trim();
  let domain = "Web Recipe";
  try {
    const parsedUrl = new URL(cleanUrl);
    domain = parsedUrl.hostname.replace(/^www\./, "");
  } catch (e) {
    domain = "Web Recipe";
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateFallbackRecipe({
      rawText: `Imported Recipe from ${domain}\nURL: ${cleanUrl}`,
      source: domain,
      language,
      reason: `Gemini API key not configured. Generated demo recipe for ${domain}.`,
    });
  }

  const ai = getGeminiClient();

  // Try to fetch page content directly
  let pageContent = "";
  let jsonLdData = null;
  let pageTitle = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(cleanUrl, {
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
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
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
        pageContent = html
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
    console.warn(`[Gemini Recipe Parser] Direct fetch for ${cleanUrl} notice: ${err.message}. Using Gemini Search fallback.`);
  }

  const systemInstruction = `You are Pantryo's master bilingual culinary digitizer and international recipe archivist.
Your job is to accurately extract the complete recipe from this webpage (${cleanUrl}).

CRITICAL MANDATE - AUTOMATIC TRANSLATION:
Target primary language for this import: ${language === "FR" ? "French (Français)" : "English"}.
Regardless of the language of the source website (French, English, Italian, Spanish, etc.):
1. AUTOMATICALLY TRANSLATE ALL ELEMENTS into ${language === "FR" ? "French" : "English"} as requested!
2. Provide complete bilingual output for seamless switching:
   - title: English title
   - titleFr: French title
   - descriptionEn: Appetizing English summary
   - descriptionFr: Appetizing French summary
   - ingredients: array of {
       "name": clear English ingredient name,
       "nameFr": clear French ingredient name,
       "amount": measurement/quantity (e.g. "250g", "2 tbsp / 2 c. à soupe", "3 cloves / 3 gousses"),
       "category": One of "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Condiments", "Pantry Staples", "Frozen Meals", "Snacks",
       "locationType": "FRIDGE", "PANTRY", or "FREEZER"
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
   - source: Name of website (e.g. "Marmiton", "Ricardo Cuisine", "750g", "Serious Eats", "Allrecipes", "${domain}")
   - sourceUrl: "${cleanUrl}"
   - imageUrl: High-quality recipe food image URL from the page, or Unsplash if unavailable.

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

  try {
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
      imageUrl: parsed.imageUrl,
    });

    return {
      success: true,
      message:
        language === "FR"
          ? `Recette importée et traduite avec succès depuis ${domain} !`
          : `Recipe imported and translated successfully from ${domain}!`,
      recipe: normalized,
    };
  } catch (error) {
    console.error("[Gemini Recipe Parser] Error in parseRecipeFromUrl:", error);
    return generateFallbackRecipe({
      rawText: `Imported Recipe from ${domain}\nURL: ${cleanUrl}`,
      source: domain,
      language,
      reason: `AI URL Extraction note: ${error.message}. Generated fallback recipe.`,
    });
  }
}

/**
 * Translates an existing recipe into the target language (FR or EN)
 */
export async function translateRecipe({ recipe, targetLanguage = "FR" }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !recipe) {
    return { success: true, recipe };
  }

  const ai = getGeminiClient();
  const systemInstruction = `You are Pantryo's expert culinary translator.
Translate all elements of the recipe into ${targetLanguage === "FR" ? "French" : "English"}.
Return a JSON object containing:
- title
- titleFr
- descriptionEn
- descriptionFr
- ingredients: array of { name, nameFr, amount, category, locationType }
- instructionsEn
- instructionsFr
- difficulty
- difficultyFr
- tags`;

  try {
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
    return {
      success: true,
      recipe: {
        ...recipe,
        ...parsed,
      },
    };
  } catch (error) {
    console.error("[Gemini Recipe Parser] translateRecipe error:", error);
    return { success: false, error: error.message, recipe };
  }
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
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
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
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
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
              instructionsEn: r.instructionsEn || [],
              instructionsFr: r.instructionsFr || [],
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
function generateFallbackWebSuggestions({
  inventory = [],
  expiringItems = [],
  targetMealType = "DINNER",
  language = "EN",
}) {
  const topExpiringNames = expiringItems.map((i) => i.name);
  const heroItem = topExpiringNames[0] || (inventory[0] ? inventory[0].name : "Fresh Ingredients");
  const secondaryItem = topExpiringNames[1] || (inventory[1] ? inventory[1].name : "Herbs & Veggies");

  if (targetMealType === "BREAKFAST") {
    return [
      {
        id: "web_fallback_bfast_01",
        title: `Golden Zero-Waste Morning Hash with ${heroItem} & Fried Eggs`,
        titleFr: `Poêlée déjeuner dorée aux œufs et ${heroItem}`,
        source: "Ricardo Cuisine (Web)",
        sourceUrl: "https://www.ricardocuisine.com/en/recipes/breakfast-and-brunch",
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
        prepTime: "5 mins",
        cookTime: "12 mins",
        totalTime: "17 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Transforme votre ${heroItem} en un savoureux déjeuner nourrissant avant qu'il ne se perde.`
            : `Transforms your ${heroItem} into a satisfying morning skillet before it goes to waste.`,
        rescuedIngredients: [heroItem, secondaryItem].filter(Boolean),
        matchPercentage: 90,
        mealType: "BREAKFAST",
        suitableMealTypes: ["BREAKFAST"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "1.5 cups diced", inStock: true, category: "Produce" },
          { name: "Fresh Eggs", nameFr: "Œufs frais", amount: "4 eggs", inStock: true, category: "Dairy & Eggs" },
          { name: "Butter or Olive Oil", nameFr: "Beurre ou huile d'olive", amount: "1 tbsp", inStock: true, category: "Pantry" },
          { name: "Salt, Pepper & Paprika", nameFr: "Sel, poivre et paprika", amount: "To taste", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Dice ${heroItem} into small, uniform cubes for quick cooking.`,
          "Heat butter or oil in a heavy skillet over medium-high heat.",
          `Sauté ${heroItem} until tender and golden brown with crispy edges (8 mins).`,
          "Make two wells in the hash and crack the eggs directly inside. Cover for 3-4 minutes until whites are set.",
          "Season with salt, pepper, and paprika. Serve warm.",
        ],
        instructionsFr: [
          `Couper ${heroItem} en petits dés réguliers pour une cuisson rapide.`,
          "Faire chauffer le beurre ou l'huile dans une poêle à feu moyen-vif.",
          `Faire dorer ${heroItem} jusqu'à ce qu'il soit bien doré et croustillant (8 min).`,
          "Former des puits et casser les œufs directement dedans. Couvrir 3-4 minutes jusqu'à cuisson voulue.",
          "Assaisonner de sel, poivre et paprika. Servir bien chaud.",
        ],
        tags: ["BREAKFAST", "Anti-Gaspillage", "Quick Morning"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_bfast_02",
        title: `Fluffy Farmhouse Breakfast Omelette with ${heroItem}`,
        titleFr: `Omelette paysanne moelleuse au ${heroItem}`,
        source: "Marmiton (Web)",
        sourceUrl: "https://www.marmiton.org/recettes/recherche.aspx?aqt=omelette",
        imageUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
        prepTime: "5 mins",
        cookTime: "8 mins",
        totalTime: "13 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Une excellente manière d'utiliser ${heroItem} avec des œufs dès le réveil.`
            : `A delicious way to utilize ${heroItem} with wholesome eggs for breakfast.`,
        rescuedIngredients: [heroItem].filter(Boolean),
        matchPercentage: 85,
        mealType: "BREAKFAST",
        suitableMealTypes: ["BREAKFAST"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "1 cup chopped", inStock: true, category: "Produce" },
          { name: "Large Eggs", nameFr: "Gros œufs", amount: "4 eggs", inStock: true, category: "Dairy & Eggs" },
          { name: "Cheese or Milk", nameFr: "Fromage ou lait", amount: "2 tbsp", inStock: true, category: "Dairy & Eggs" },
        ],
        instructionsEn: [
          "Whisk eggs with a splash of milk, salt, and black pepper.",
          `Quickly cook ${heroItem} in a nonstick pan with butter until tender.`,
          "Pour eggs over top and cook gently, folding gently until fluffy and creamy.",
        ],
        instructionsFr: [
          "Battre les œufs avec une cuillère de lait, sel et poivre.",
          `Faire revenir rapidement ${heroItem} dans une poêle antiadhésive avec une noix de beurre.`,
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
        title: `Toasted Artisan Lunch Panini with ${heroItem}`,
        titleFr: `Panini artisanal grillé du midi au ${heroItem}`,
        source: "Serious Eats (Web)",
        sourceUrl: "https://www.seriouseats.com/sandwich-recipes",
        imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
        prepTime: "8 mins",
        cookTime: "6 mins",
        totalTime: "14 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Donne une seconde vie à votre ${heroItem} dans un sandwich chaud et croustillant.`
            : `Gives your ${heroItem} a second life inside a warm, golden pressed sandwich.`,
        rescuedIngredients: [heroItem].filter(Boolean),
        matchPercentage: 88,
        mealType: "LUNCH",
        suitableMealTypes: ["LUNCH"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "1 cup sliced", inStock: true, category: "Produce" },
          { name: "Crusty Bread or Ciabatta", nameFr: "Pain croûté ou ciabatta", amount: "4 slices", inStock: true, category: "Bakery" },
          { name: "Cheese slices", nameFr: "Tranches de fromage", amount: "2 slices", inStock: true, category: "Dairy & Eggs" },
          { name: "Mustard or Mayo", nameFr: "Moutarde ou mayo", amount: "1 tbsp", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          "Spread condiments over bread slices.",
          `Layer sliced cheese and cooked or roasted ${heroItem}.`,
          "Toast in a hot skillet or press with a touch of butter until golden and melted.",
        ],
        instructionsFr: [
          "Tartiner le pain avec vos condiments préférés.",
          `Garnir de tranches de fromage et de ${heroItem} émincé.`,
          "Griller dans une poêle chaude avec un peu de beurre jusqu'à ce que le fromage fonde.",
        ],
        tags: ["LUNCH", "Sandwich", "Anti-Gaspillage"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_lunch_02",
        title: `Fresh Mediterranean Power Lunch Bowl with ${heroItem}`,
        titleFr: `Bol repas méditerranéen du midi au ${heroItem}`,
        source: "Trois Fois Par Jour (Web)",
        sourceUrl: "https://www.troisfoisparjour.com",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        prepTime: "10 mins",
        cookTime: "0 mins",
        totalTime: "10 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Associe ${heroItem} et ${secondaryItem} dans une salade-repas fraîche et équilibrée.`
            : `Combines ${heroItem} and ${secondaryItem} in a crisp, balanced power bowl.`,
        rescuedIngredients: [heroItem, secondaryItem].filter(Boolean),
        matchPercentage: 85,
        mealType: "LUNCH",
        suitableMealTypes: ["LUNCH"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "1 cup chopped", inStock: true, category: "Produce" },
          { name: secondaryItem, nameFr: secondaryItem, amount: "1/2 cup", inStock: true, category: "Produce" },
          { name: "Greens or Cooked Grains", nameFr: "Salade verte ou grains", amount: "2 cups", inStock: true, category: "Produce" },
          { name: "Vinaigrette", nameFr: "Vinaigrette maison", amount: "2 tbsp", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          "Assemble grains or greens in serving bowls.",
          `Top with ${heroItem}, ${secondaryItem}, and pantry toppings.`,
          "Drizzle with vinaigrette and toss lightly before serving.",
        ],
        instructionsFr: [
          "Disposer la verdure ou les grains dans les bols.",
          `Garnir avec ${heroItem}, ${secondaryItem} et vos graines ou noix.`,
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
        title: `Crispy Herb & Spiced Roasted ${heroItem} Bites`,
        titleFr: `Bouchées croustillantes et épicées de ${heroItem} rôti`,
        source: "Allrecipes (Web)",
        sourceUrl: "https://www.allrecipes.com/recipes/76/appetizers-and-snacks",
        imageUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80",
        prepTime: "5 mins",
        cookTime: "12 mins",
        totalTime: "17 mins",
        servings: "2 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Idéal pour grignoter sans gaspiller vos surplus de ${heroItem}.`
            : `Perfect crispy snack that utilizes leftover ${heroItem}.`,
        rescuedIngredients: [heroItem].filter(Boolean),
        matchPercentage: 90,
        mealType: "SNACK",
        suitableMealTypes: ["SNACK"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "200g cut into bite sizes", inStock: true, category: "Produce" },
          { name: "Olive Oil & Salt", nameFr: "Huile d'olive et sel", amount: "1 tbsp oil, pinch salt", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Toss ${heroItem} with olive oil, salt, and favourite spices.`,
          "Roast in hot air fryer or oven at 400°F (200°C) until crispy and browned (10-12 mins).",
          "Cool slightly and enjoy warm.",
        ],
        instructionsFr: [
          `Mélanger ${heroItem} avec l'huile d'olive, le sel et vos épices préférées.`,
          "Cuire à l'air fryer ou au four à 200°C (400°F) jusqu'à consistance bien croustillante (10-12 min).",
          "Laisser tiédir et savourer comme collation.",
        ],
        tags: ["SNACK", "Collation", "Crispy"],
        isWebSearch: true,
      },
      {
        id: "web_fallback_snack_02",
        title: `Creamy Zero-Waste ${heroItem} Dip with Pita Chips`,
        titleFr: `Trempette crémeuse au ${heroItem} et croustilles de pita`,
        source: "Marmiton (Web)",
        sourceUrl: "https://www.marmiton.org/recettes/recherche.aspx?aqt=apero",
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
        prepTime: "8 mins",
        cookTime: "0 mins",
        totalTime: "8 mins",
        servings: "3 servings",
        difficulty: "Easy",
        difficultyFr: "Facile",
        zeroWasteReason:
          language === "FR"
            ? `Mixez ${heroItem} avec du yogourt ou fromage à la crème pour une superbe collation anti-gaspi.`
            : `Blend ${heroItem} with yogurt or cream cheese for an easy anti-waste dip.`,
        rescuedIngredients: [heroItem].filter(Boolean),
        matchPercentage: 85,
        mealType: "SNACK",
        suitableMealTypes: ["SNACK"],
        ingredients: [
          { name: heroItem, nameFr: heroItem, amount: "1 cup", inStock: true, category: "Produce" },
          { name: "Greek Yogurt or Cream Cheese", nameFr: "Yogourt grec ou fromage blanc", amount: "1/2 cup", inStock: true, category: "Dairy & Eggs" },
          { name: "Lemon juice & Garlic", nameFr: "Jus de citron et ail", amount: "1 tsp each", inStock: true, category: "Pantry" },
        ],
        instructionsEn: [
          `Blend or finely mash ${heroItem} with yogurt, lemon, and seasonings until smooth.`,
          "Serve in a bowl alongside crackers, pita, or raw veggies.",
        ],
        instructionsFr: [
          `Mixer ou écraser finement ${heroItem} avec le yogourt, le citron et les aromates.`,
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
      title: `Crispy Skillet Toss with ${heroItem} & Garlic Butter`,
      titleFr: `Poêlée croustillante au beurre d'ail avec ${heroItem}`,
      source: "Ricardo Cuisine (Web)",
      sourceUrl: "https://www.ricardocuisine.com/en/recipes/sheet-pan-dinners",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      prepTime: "10 mins",
      cookTime: "15 mins",
      totalTime: "25 mins",
      servings: "4 servings",
      difficulty: "Easy",
      difficultyFr: "Facile",
      zeroWasteReason:
        language === "FR"
          ? `Consomme directement votre ${heroItem} et ${secondaryItem} avant qu'ils ne se perdent.`
          : `Directly uses up your ${heroItem} and ${secondaryItem} to eliminate kitchen waste.`,
      rescuedIngredients: [heroItem, secondaryItem].filter(Boolean),
      matchPercentage: 90,
      mealType: "DINNER",
      suitableMealTypes: ["DINNER"],
      ingredients: [
        { name: heroItem, nameFr: heroItem, amount: "300g", inStock: true, category: "Produce" },
        { name: secondaryItem, nameFr: secondaryItem, amount: "1 cup", inStock: true, category: "Produce" },
        { name: "Garlic Cloves & Butter", nameFr: "Ail et beurre", amount: "2 tbsp butter, 3 cloves", inStock: true, category: "Dairy & Eggs" },
        { name: "Olive Oil & Seasonings", nameFr: "Huile d'olive et assaisonnements", amount: "1 tbsp oil, pinch of salt", inStock: true, category: "Pantry" },
      ],
      instructionsEn: [
        "Chop all ingredients into bite-sized pieces.",
        "Melt butter and olive oil in a large hot skillet over medium-high heat.",
        `Toss in ${heroItem} and cook until tender and slightly caramelized (8-10 mins).`,
        `Add ${secondaryItem} and minced garlic, tossing vigorously for 2 more minutes.`,
        "Season with fresh cracked black pepper and serve hot.",
      ],
      instructionsFr: [
        "Couper tous les ingrédients en morceaux réguliers.",
        "Faire fondre le beurre et l'huile dans une grande poêle chaude à feu moyen-vif.",
        `Faire sauter ${heroItem} jusqu'à tendreté et belle coloration dorée (8-10 min).`,
        `Ajouter ${secondaryItem} et l'ail haché, mélanger 2 minutes supplémentaires.`,
        "Assaisonner de poivre moulu et servir chaud immédiatement.",
      ],
      tags: ["DINNER", "Anti-Gaspillage", "Quick Skillet", "Web Recipe"],
      isWebSearch: true,
    },
    {
      id: "web_fallback_dinner_02",
      title: `Zero-Waste Chef's Frittata & Sheet-Pan Roast with ${heroItem}`,
      titleFr: `Frittata anti-gaspillage du chef au ${heroItem}`,
      source: "Serious Eats (Web)",
      sourceUrl: "https://www.seriouseats.com/easy-frittata-recipes",
      imageUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
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
      rescuedIngredients: [heroItem].filter(Boolean),
      matchPercentage: 85,
      mealType: "DINNER",
      suitableMealTypes: ["DINNER"],
      ingredients: [
        { name: heroItem, nameFr: heroItem, amount: "1.5 cups diced", inStock: true, category: "Produce" },
        { name: "Fresh Eggs", nameFr: "Œufs frais", amount: "6 large eggs", inStock: true, category: "Dairy & Eggs" },
        { name: "Grated Cheese", nameFr: "Fromage râpé", amount: "1/2 cup", inStock: true, category: "Dairy & Eggs" },
        { name: "Milk or Cream", nameFr: "Lait ou crème", amount: "1/4 cup", inStock: true, category: "Dairy & Eggs" },
      ],
      instructionsEn: [
        "Preheat oven to 375°F (190°C). Whisk eggs with milk, salt, and pepper in a medium bowl.",
        `Sauté ${heroItem} in an oven-safe skillet with a little oil until tender.`,
        "Pour whisked eggs evenly over the skillet and sprinkle with cheese.",
        "Bake for 14-18 minutes until puffed, golden, and set in the center.",
      ],
      instructionsFr: [
        "Préchauffer le four à 190°C (375°F). Battre les œufs avec le lait, le sel et le poivre.",
        `Faire revenir ${heroItem} dans une poêle allant au four avec un filet d'huile.`,
        "Verser les œufs battus uniformément et saupoudrer de fromage.",
        "Cuire au four 14 à 18 minutes jusqu'à ce que la frittata soit dorée et prise au centre.",
      ],
      tags: ["DINNER", "Anti-Gaspillage", "High-Protein", "Web Recipe"],
      isWebSearch: true,
    },
  ];
}
