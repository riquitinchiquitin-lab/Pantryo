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
