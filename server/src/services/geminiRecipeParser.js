import { GoogleGenAI, Type } from "@google/genai";

/**
 * Pantryo - Gemini Recipe Parser Service
 * Uses Google Gemini (gemini-3.8-flash via @google/genai) to parse recipes from:
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
  if (!apiKey) {
    return generateFallbackRecipe({
      rawText: text,
      youtubeUrl,
      youtubeId,
      source: youtubeUrl ? "YouTube" : source,
      language,
      reason: "Gemini API key not configured yet. Demo extraction populated.",
    });
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
    console.error("[Gemini Recipe Parser] Error parsing text:", error);
    // Graceful fallback on API error
    return generateFallbackRecipe({
      rawText: text,
      youtubeUrl,
      youtubeId,
      source: youtubeUrl ? "YouTube" : source,
      language,
      reason: `AI parsing note: ${error.message}. Generated structured fallback.`,
    });
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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateFallbackRecipe({
      rawText: notes || "Scanned Recipe Card",
      source: "Photo Import",
      language,
      reason: "Gemini API key pending in environment. Demo scan results populated.",
    });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
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

  try {
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
        imageUrl: imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
      }),
    };
  } catch (error) {
    console.error("[Gemini Recipe Parser] Error parsing photo:", error);
    return generateFallbackRecipe({
      rawText: notes || "Scanned Recipe",
      source: "Photo Import",
      language,
      reason: `AI Photo extraction notice: ${error.message}. Generated fallback.`,
    });
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
 * Generates an intelligent mock/fallback recipe when API key is missing or for instant testing
 */
function generateFallbackRecipe({
  rawText = "",
  youtubeUrl = null,
  youtubeId = null,
  source = "Personal",
  language = "EN",
  reason = "Demo parsed recipe",
}) {
  const isYoutube = Boolean(youtubeUrl || youtubeId);
  const title = isYoutube
    ? "Crispy Garlic Butter Steak Bites with Potatoes"
    : rawText.split("\n")[0]?.slice(0, 45) || "Grandma's Savory Herb Roasted Chicken";

  const fallback = {
    title,
    titleFr: isYoutube
      ? "Bouchées de bifteck au beurre à l'ail et pommes de terre croustillantes"
      : "Poulet rôti aux herbes savoureuses de grand-maman",
    descriptionEn: isYoutube
      ? "Tender steak cubes caramelized in fragrant garlic herb butter alongside crispy golden skillet potatoes."
      : "A timeless homestyle chicken dish seasoned with fragrant rosemary, thyme, garlic, and fresh lemon.",
    descriptionFr: isYoutube
      ? "Cubes de bœuf tendres caramélisés dans un beurre d'ail moussant avec des pommes de terre dorées."
      : "Un plat réconfortant assaisonné au romarin frais, au thym, à l'ail et au citron.",
    prepTime: "15 mins",
    cookTime: "20 mins",
    totalTime: "35 mins",
    servings: "4 servings",
    difficulty: "Easy",
    difficultyFr: "Facile",
    calories: "520 kcal",
    tags: [isYoutube ? "YouTube Recipe" : "Family Recipe", "Weeknight Dinner", "High-Protein", "Skillet Meal"],
    ingredients: isYoutube
      ? [
          { name: "Grass-Fed Ground Beef 85/15", nameFr: "Bœuf coupé en cubes", amount: "1.5 lbs (700g)", category: "Meat & Seafood", locationType: "FREEZER" },
          { name: "Baby Yellow Potatoes", nameFr: "Petites pommes de terre jaunes", amount: "1 lb halved", category: "Produce", locationType: "PANTRY" },
          { name: "Unsalted Butter", nameFr: "Beurre non salé", amount: "3 tbsp", category: "Dairy & Eggs", locationType: "FRIDGE" },
          { name: "Fresh Garlic Cloves", nameFr: "Gousses d'ail hachées", amount: "4 cloves minced", category: "Produce", locationType: "PANTRY" },
          { name: "Fresh Rosemary & Parsley", nameFr: "Romarin et persil frais", amount: "2 tbsp chopped", category: "Produce", locationType: "FRIDGE" },
          { name: "Olive Oil & Sea Salt", nameFr: "Huile d'olive et sel de mer", amount: "1 tbsp oil, 1 tsp salt", category: "Pantry", locationType: "PANTRY" },
        ]
      : [
          { name: "Whole Chicken or Thighs", nameFr: "Hauts de cuisse de poulet", amount: "4 portions (800g)", category: "Meat & Seafood", locationType: "FRIDGE" },
          { name: "Fresh Lemon & Garlic", nameFr: "Citron frais et ail", amount: "1 lemon, 4 cloves", category: "Produce", locationType: "PANTRY" },
          { name: "Olive Oil", nameFr: "Huile d'olive extra-vierge", amount: "2 tbsp", category: "Pantry", locationType: "PANTRY" },
          { name: "Baby Carrots & Potatoes", nameFr: "Petites carottes et pommes de terre", amount: "2 cups", category: "Produce", locationType: "FRIDGE" },
          { name: "Dried Thyme & Rosemary", nameFr: "Thym et romarin séchés", amount: "1 tsp each", category: "Pantry", locationType: "PANTRY" },
        ],
    instructionsEn: [
      "In a large cast iron skillet over medium-high heat, sear the meat cubes with a splash of olive oil until deep brown and caramelized on all sides (3-4 mins). Set aside on a warm plate.",
      "In the same hot skillet, add potatoes with 1 tbsp butter and a pinch of salt. Cook covered for 10-12 minutes until fork-tender and crispy golden.",
      "Reduce heat to medium. Return meat to skillet and toss with minced garlic, fresh herbs, and remaining butter until foaming and fragrant (2 mins).",
      "Remove from heat immediately, garnish with freshly cracked black pepper and parsley, and serve hot.",
    ],
    instructionsFr: [
      "Dans une grande poêle en fonte à feu vif, faire saisir les cubes de viande avec un filet d'huile jusqu'à ce qu'ils soient bien dorés (3-4 min). Réserver.",
      "Dans la même poêle, ajouter les pommes de terre et du beurre. Cuire à couvert 10 à 12 minutes jusqu'à tendreté.",
      "Baisser à feu moyen, remettre la viande avec l'ail haché et les herbes fraîches; mélanger 2 minutes.",
      "Garnir de persil frais et de poivre du moulin, puis servir chaud immédiatement.",
    ],
  };

  return {
    success: true,
    notice: reason,
    recipe: normalizeRecipeOutput(fallback, {
      youtubeUrl,
      youtubeId,
      source: isYoutube ? "YouTube" : source,
      imageUrl: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined,
    }),
  };
}
