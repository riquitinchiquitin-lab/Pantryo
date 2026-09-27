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
 * Custom recipe store initialized empty for clean install
 * Persists user-added recipes across client views and reloads
 */
let customRecipesStore = [];

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
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to parse recipe",
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
 * Saves or updates a custom recipe in the backend store
 */
router.post("/custom", (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe || (!recipe.title && !recipe.titleFr)) {
      return res.status(400).json({ success: false, error: "Invalid recipe data" });
    }

    const recipeId = recipe.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existingIndex = dbStore.customRecipes.findIndex((r) => r.id === recipeId);

    const recipeWithMeta = {
      ...recipe,
      id: recipeId,
      isCustom: true,
      createdAt: recipe.createdAt || (existingIndex >= 0 ? dbStore.customRecipes[existingIndex].createdAt : new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      dbStore.customRecipes[existingIndex] = recipeWithMeta;
    } else {
      dbStore.customRecipes.unshift(recipeWithMeta);
    }
    dbStore.persistToEncryptedDisk();

    return res.status(200).json({
      success: true,
      message: `Recipe "${recipeWithMeta.title || recipeWithMeta.titleFr}" saved successfully!`,
      recipe: recipeWithMeta,
    });
  } catch (error) {
    console.error("[Recipes Route] POST /custom error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/recipes/custom/:id
 * Updates an existing recipe by ID
 */
router.put("/custom/:id", (req, res) => {
  try {
    const { id } = req.params;
    const recipeUpdates = req.body;
    if (!recipeUpdates) {
      return res.status(400).json({ success: false, error: "Missing update payload" });
    }

    const existingIndex = dbStore.customRecipes.findIndex((r) => r.id === id);
    const existingRecipe = existingIndex >= 0 ? dbStore.customRecipes[existingIndex] : null;

    const updatedRecipe = {
      ...(existingRecipe || {}),
      ...recipeUpdates,
      id,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      createdAt: existingRecipe?.createdAt || recipeUpdates.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      dbStore.customRecipes[existingIndex] = updatedRecipe;
    } else {
      dbStore.customRecipes.unshift(updatedRecipe);
    }
    dbStore.persistToEncryptedDisk();

    return res.status(200).json({
      success: true,
      message: `Recipe "${updatedRecipe.title || updatedRecipe.titleFr}" updated successfully!`,
      recipe: updatedRecipe,
    });
  } catch (error) {
    console.error("[Recipes Route] PUT /custom/:id error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/recipes/custom/:id
 * Removes a custom recipe
 */
router.delete("/custom/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = dbStore.customRecipes.length;
  dbStore.customRecipes = dbStore.customRecipes.filter((r) => r.id !== id);
  customRecipesStore = customRecipesStore.filter((r) => r.id !== id);
  dbStore.persistToEncryptedDisk();

  if (dbStore.customRecipes.length === initialLength && customRecipesStore.length === initialLength) {
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
