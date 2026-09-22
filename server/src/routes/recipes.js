import express from "express";
import {
  parseRecipeFromText,
  parseRecipeFromPhoto,
  parseRecipeFromUrl,
  translateRecipe,
  extractYouTubeId,
  generateSmartMealSuggestions,
  lookThroughWebsiteContent,
} from "../services/geminiRecipeParser.js";
import { dbStore } from "../services/dbStore.js";

const router = express.Router();

/**
 * In-memory custom recipe store
 * Persists user-added recipes across client views and reloads
 */
let customRecipesStore = [
  {
    id: "rec_sample_yt_01",
    title: "Crispy Garlic Butter Steak Bites & Golden Potatoes",
    titleFr: "Bouchées de steak au beurre d'ail et pommes de terre dorées",
    ricardoUrlEn: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    ricardoUrlFr: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    youtubeUrl: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    youtubeVideoId: "17XjG6x5g2I",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    time: "25 mins",
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: "4 servings",
    difficulty: "Easy",
    difficultyFr: "Facile",
    calories: "510 kcal",
    source: "YouTube",
    isRicardoOfficial: false,
    isCustom: true,
    descriptionEn: "Tender beef seared to caramelized perfection with foaming garlic herb butter and crispy potatoes.",
    descriptionFr: "Bœuf fondant saisi à point avec un beurre d'ail persillé moussant et des pommes de terre croustillantes.",
    tags: ["YouTube Recipe", "High-Protein", "20-Min Meal", "Skillet Favorite"],
    ingredients: [
      { name: "Grass-Fed Ground Beef 85/15", nameFr: "Cubes de bœuf frais", amount: "1.5 lbs (700g)", inKitchenItemName: "Grass-Fed Ground Beef 85/15", category: "Meat & Seafood", locationType: "FREEZER" },
      { name: "Unsalted Butter", nameFr: "Beurre doux", amount: "3 tbsp", category: "Dairy & Eggs", locationType: "FRIDGE" },
      { name: "Fresh Garlic Cloves", nameFr: "Gousses d'ail", amount: "4 cloves minced", category: "Produce", locationType: "PANTRY" },
      { name: "Baby Potatoes", nameFr: "Pommes de terre grelots", amount: "1 lb halved", category: "Produce", locationType: "PANTRY" },
      { name: "Fresh Rosemary & Parsley", nameFr: "Romarin et persil frais", amount: "2 tbsp", category: "Produce", locationType: "FRIDGE" },
    ],
    instructionsEn: [
      "Sear beef cubes in a hot cast-iron skillet with a splash of olive oil for 3-4 minutes until nicely browned. Transfer to a plate.",
      "Add halved baby potatoes to the skillet with a splash of water and butter. Cover and steam-fry for 10 minutes until golden and tender.",
      "Toss beef back into the skillet, add garlic, butter, and chopped herbs. Baste for 2 minutes until aromatic.",
      "Garnish with freshly cracked black pepper and sea salt; serve immediately.",
    ],
    instructionsFr: [
      "Saisir les cubes de bœuf dans une poêle en fonte chaude 3 à 4 minutes jusqu'à belle coloration. Réserver.",
      "Ajouter les pommes de terre grelots avec un peu d'eau et de beurre. Couvrir et cuire 10 minutes.",
      "Remettre la viande dans la poêle avec l'ail, le beurre et les herbes. Arroser 2 minutes.",
      "Garnir de poivre et de fleur de sel, servir sans attendre.",
    ],
    suggestedPantryNeeds: ["Baby Potatoes", "Fresh Rosemary"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * POST /api/v1/recipes/ai-parse
 * Parses a recipe from YouTube URL, raw text, or a photo using Gemini 3.8 Flash
 */
router.post("/ai-parse", async (req, res) => {
  try {
    const {
      mode = "text",
      text = "",
      youtubeUrl = null,
      imageBase64 = null,
      mimeType = "image/jpeg",
      notes = "",
      language = "EN",
    } = req.body;

    if (mode === "photo") {
      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "imageBase64 is required for photo recipe parsing.",
        });
      }

      const result = await parseRecipeFromPhoto({
        imageBase64,
        mimeType,
        notes,
        language,
      });

      return res.status(200).json(result);
    }

    // Handle Text or YouTube
    if (mode === "youtube" && !youtubeUrl && !text) {
      return res.status(400).json({
        success: false,
        error: "Please provide a YouTube video URL or video title/transcript.",
      });
    }

    if (mode === "text" && !text) {
      return res.status(400).json({
        success: false,
        error: "Please provide recipe text or ingredients/steps to parse.",
      });
    }

    const result = await parseRecipeFromText({
      text,
      youtubeUrl,
      source: mode === "youtube" ? "YouTube" : "Personal",
      language,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Recipes Route] /ai-parse failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to parse recipe with AI",
      details: error.message,
    });
  }
});

/**
 * GET /api/v1/recipes/custom
 * Fetches saved user recipes
 */
router.get("/custom", (req, res) => {
  return res.status(200).json({
    success: true,
    recipes: dbStore.customRecipes,
    total: dbStore.customRecipes.length,
  });
});

/**
 * POST /api/v1/recipes/custom
 * Saves a new custom recipe to the backend store
 */
router.post("/custom", (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe || !recipe.title) {
      return res.status(400).json({ success: false, error: "Invalid recipe data" });
    }

    const recipeWithMeta = {
      ...recipe,
      id: recipe.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isCustom: true,
      createdAt: recipe.createdAt || new Date().toISOString(),
    };

    // Prepend to top of dbStore and persist
    dbStore.customRecipes.unshift(recipeWithMeta);
    dbStore.persistToEncryptedDisk();

    return res.status(201).json({
      success: true,
      message: `Recipe "${recipeWithMeta.title}" saved successfully!`,
      recipe: recipeWithMeta,
    });
  } catch (error) {
    console.error("[Recipes Route] POST /custom error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/recipes/custom/:id
 * Removes a custom recipe
 */
router.delete("/custom/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = customRecipesStore.length;
  customRecipesStore = customRecipesStore.filter((r) => r.id !== id);

  if (customRecipesStore.length === initialLength) {
    return res.status(404).json({ success: false, error: "Recipe not found" });
  }

  return res.status(200).json({
    success: true,
    message: "Recipe deleted successfully",
  });
});

/**
 * POST /api/v1/recipes/import-url
 * Scrapes and automatically translates a recipe from ANY website URL into French or English
 */
router.post("/import-url", async (req, res) => {
  try {
    const { url, language = "FR", autoTranslate = true } = req.body;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid recipe web URL starting with http:// or https://",
      });
    }

    const result = await parseRecipeFromUrl({
      url,
      language,
      autoTranslate,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Recipes Route] POST /import-url error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to import recipe from website URL",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/recipes/look-into-website
 * Actively inspects the live content of any culinary website or blog:
 * Fetches RSS/HTML, executes targeted site searches, extracts recipes, and matches with inventory.
 */
router.post("/look-into-website", async (req, res) => {
  try {
    const {
      url,
      domain,
      query = "",
      inventory = [],
      language = "FR",
      targetMealType,
    } = req.body;

    const target = url || domain;
    if (!target || typeof target !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid website URL or domain is required (e.g. 'marmiton.org' or 'https://budgetbytes.com')",
      });
    }

    const result = await lookThroughWebsiteContent({
      urlOrDomain: target,
      query,
      inventory,
      language,
      targetMealType,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Recipes Route] POST /look-into-website error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to inspect website content",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/recipes/translate
 * Translates all elements of a recipe into French or English
 */
router.post("/translate", async (req, res) => {
  try {
    const { recipe, targetLanguage = "FR" } = req.body;
    if (!recipe) {
      return res.status(400).json({ success: false, error: "Recipe data is required" });
    }

    const result = await translateRecipe({ recipe, targetLanguage });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Recipes Route] POST /translate error:", error);
    return res.status(500).json({
      success: false,
      error: "Recipe translation failed",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/recipes/smart-suggestions
 * Generates smart anti-waste meal recommendations based on:
 * 1. Current inventory & expiring ingredients (strictly zero-waste)
 * 2. User's saved recipes (ranked by match and rescued items)
 * 3. Live web search via Gemini 3.8 Flash with Google Search Grounding
 * 4. User's preferred recipe websites & automatic language translation
 */
router.post("/smart-suggestions", async (req, res) => {
  try {
    const {
      inventory = [],
      userRecipes = [],
      targetDate = new Date().toISOString().split("T")[0],
      targetMealType = "DINNER",
      language = "EN",
      query = "",
      preferredWebsites = [],
    } = req.body;

    // Merge in-memory custom recipes with any client-supplied recipes
    const combinedUserRecipes = [...customRecipesStore];
    const existingIds = new Set(combinedUserRecipes.map((r) => r.id));

    if (Array.isArray(userRecipes)) {
      for (const r of userRecipes) {
        if (r && r.id && !existingIds.has(r.id)) {
          combinedUserRecipes.push(r);
          existingIds.add(r.id);
        }
      }
    }

    const suggestions = await generateSmartMealSuggestions({
      inventory,
      userRecipes: combinedUserRecipes,
      targetDate,
      targetMealType,
      language,
      query,
      preferredWebsites,
    });

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("[Recipes Route] POST /smart-suggestions error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate smart suggestions",
    });
  }
});

export default router;
