import express from "express";
import { analyzeFoodImage, analyzeReceiptText, analyzeReceiptImage } from "../services/geminiVision.js";
import { dbStore } from "../services/dbStore.js";

const router = express.Router();

/**
 * Household Storage with AES-256-GCM Encrypted Disk Persistence
 */

// Multi-User Household (Yan & Kriz)
const SEED_HOUSEHOLD_ID = "hh_yan_kriz_01";
const USERS = dbStore.users;

const LOCATIONS = [
  { id: "loc_fridge", name: "Fridge", type: "FRIDGE", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_pantry", name: "Pantry", type: "PANTRY", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_freezer", name: "Freezer", type: "FREEZER", householdId: SEED_HOUSEHOLD_ID },
];

const CATEGORIES = [
  {
    id: "cat_produce",
    name: "Produce",
    icon: "Apple",
    color: "#DCFCE7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
    description: "Fresh vegetables, fruits, salad greens & herbs",
  },
  {
    id: "cat_dairy",
    name: "Dairy & Eggs",
    icon: "Milk",
    color: "#E0F2FE",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    description: "Milk, butter, cheeses, yogurt & farm eggs",
  },
  {
    id: "cat_meat",
    name: "Meat & Seafood",
    icon: "Beef",
    color: "#FEE2E2",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80",
    description: "Beef, poultry, pork, salmon & fresh seafood",
  },
  {
    id: "cat_bakery",
    name: "Bakery",
    icon: "Wheat",
    color: "#FEF3C7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    description: "Artisanal sourdough, baguettes, bread & pastries",
  },
  {
    id: "cat_pantry",
    name: "Pantry Staples",
    icon: "Package",
    color: "#F3E8FF",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
    description: "Pasta, grains, legumes, rice, flour & spices",
  },
  {
    id: "cat_frozen",
    name: "Frozen Meals",
    icon: "Snowflake",
    color: "#E0E7FF",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    description: "Frozen pizzas, dumplings, waffles & frozen veggies",
  },
  {
    id: "cat_beverages",
    name: "Beverages",
    icon: "Coffee",
    color: "#CCFBF1",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    description: "Coffee, tea, matcha, natural juices & sparkling drinks",
  },
  {
    id: "cat_snacks",
    name: "Snacks",
    icon: "Cookie",
    color: "#FFEDD5",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
    description: "Mixed roasted nuts, crisps, dried fruits & crackers",
  },
  {
    id: "cat_condiments",
    name: "Condiments",
    icon: "Soup",
    color: "#FEF9C3",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
    description: "Olive oil, balsamic vinegar, hot sauces & dressings",
  },
  {
    id: "cat_deli",
    name: "Deli & Prepared",
    icon: "Sandwich",
    color: "#FEF3C7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80",
    description: "Charcuterie, cured meats, prepared salads & dips",
  },
  {
    id: "cat_canned",
    name: "Canned Goods",
    icon: "Package",
    color: "#FFE4E6",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    description: "Canned tomatoes, soups, broths & preserved beans",
  },
  {
    id: "cat_sweets",
    name: "Sweets & Desserts",
    icon: "IceCream",
    color: "#FCE7F3",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    description: "Fine chocolates, gourmet pastries, honey & desserts",
  },
];

// Helper to calculate target ISO date string relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const getMonthsAgoDate = (offsetMonths) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonths);
  return d.toISOString();
};

// Clean install: no default inventory items on new install
let itemsStore = [];

let activityLogs = [];

/**
 * POST /api/v1/inventory/scan
 * Handles photo upload (base64 string or multipart), calls Gemini Vision service,
 * and returns auto-populated JSON fields for the UI entry form.
 */
router.post("/scan", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", language = "EN" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: imageBase64. Provide a base64 encoded image string.",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isApiKeyConfigured = Boolean(
      apiKey &&
      apiKey !== "MY_GEMINI_API_KEY" &&
      apiKey.trim().length > 0 &&
      !apiKey.startsWith("your_")
    );

    // If Gemini API Key is not yet configured, provide seamless demo candidates without throwing 500 error
    if (!isApiKeyConfigured) {
      console.info("[Inventory Route] GEMINI_API_KEY is not configured in environment. Returning demonstration scan items.");
      return res.status(200).json({
        success: true,
        summary: language === "FR"
          ? "Avis : Clé API Gemini en attente dans l'environnement. Résultats de numérisation de démonstration chargés."
          : "Notice: Gemini API Key pending in environment. Demonstration scan results loaded.",
        demoMode: true,
        itemsCount: 2,
        items: [
          {
            name: language === "FR" ? "Épinards frais bio" : "Organic Baby Spinach",
            nameFr: "Épinards frais bio",
            nameEn: "Organic Baby Spinach",
            brand: "Earthbound Farm",
            category: language === "FR" ? "Produits frais" : "Produce",
            quantity: 1,
            unit: language === "FR" ? "bac (500g)" : "box (500g)",
            recommendedLocation: "Fridge",
            storageReason: language === "FR"
              ? "Les jeunes pousses sensibles à l'humidité restent croquantes à 2°C."
              : "Moisture-sensitive leafy greens stay crisp at 36°F.",
            estimatedShelfLifeDays: 5,
            monthsFrozenShelfLife: 10,
            confidence: 0.94,
            storageTip: language === "FR"
              ? "Ajoutez un essuie-tout sec dans le bac pour absorber la condensation."
              : "Add a dry paper towel in the tub to absorb condensation.",
            suggestedExpirationDate: getRelativeDate(5).split("T")[0],
            detectedText: "ORGANIC BABY SPINACH 500G - UPC 032601000142",
            barcode: "032601000142",
            printedExpirationDate: getRelativeDate(5).split("T")[0],
          },
          {
            name: language === "FR" ? "Fromage Féta grecque en saumure" : "Greek Feta Cheese in Brine",
            nameFr: "Fromage Féta grecque en saumure",
            nameEn: "Greek Feta Cheese in Brine",
            brand: "Dodoni",
            category: language === "FR" ? "Produits laitiers & œufs" : "Dairy & Eggs",
            quantity: 1,
            unit: language === "FR" ? "bloc (200g)" : "block (200g)",
            recommendedLocation: "Fridge",
            storageReason: language === "FR"
              ? "La saumure préserve la texture et empêche le développement des moisissures."
              : "Submerged brine preserves texture and prevents mold.",
            estimatedShelfLifeDays: 14,
            monthsFrozenShelfLife: 3,
            confidence: 0.96,
            storageTip: language === "FR"
              ? "Assurez-vous que le fromage reste toujours entièrement immergé dans la saumure."
              : "Ensure cheese is always completely immersed in the brine.",
            suggestedExpirationDate: getRelativeDate(14).split("T")[0],
            detectedText: "AUTHENTIC GREEK FETA IN BRINE 200G - EAN 5201051001018",
            barcode: "5201051001018",
            printedExpirationDate: getRelativeDate(14).split("T")[0],
          }
        ],
        scannedAt: new Date().toISOString(),
      });
    }

    // Call the production Gemini Flash Vision service
    const result = await analyzeFoodImage(imageBase64, mimeType, language);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Inventory Route] /scan processing error:", error.message || error);

    return res.status(500).json({
      success: false,
      error: "AI Vision analysis failed",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/inventory/scan-receipt-text
 * Parses pasted grocery receipt text using Gemini 3.8 Flash,
 * extracting item names, categories, quantities, recommended locations, and shelf lives.
 */
router.post("/scan-receipt-text", async (req, res) => {
  try {
    const { receiptText, language = "EN" } = req.body;
    if (!receiptText || typeof receiptText !== "string" || receiptText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: receiptText. Paste the receipt text to parse.",
      });
    }

    const result = await analyzeReceiptText(receiptText, language);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Inventory Route] /scan-receipt-text error:", error.message || error);
    return res.status(500).json({
      success: false,
      error: "Receipt text parsing failed",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/inventory/scan-receipt-photo
 * Performs specialized OCR and parsing on a photograph of a grocery receipt
 * using Gemini Flash Vision.
 */
router.post("/scan-receipt-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", language = "EN" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: imageBase64. Provide a base64 encoded receipt photo.",
      });
    }

    const result = await analyzeReceiptImage(imageBase64, mimeType, language);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Inventory Route] /scan-receipt-photo error:", error.message || error);
    return res.status(500).json({
      success: false,
      error: "Receipt photo analysis failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/v1/inventory/barcode/:code
 * Resolves a UPC-A, UPC-E, or EAN barcode number.
 * First checks existing household inventory items for quick match.
 * Then looks up product details on Open Food Facts (global open product database).
 */
router.get("/barcode/:code", async (req, res) => {
  try {
    const rawCode = String(req.params.code || "").trim().replace(/[^0-9]/g, "");
    const language = String(req.query.language || "EN").toUpperCase();
    if (!rawCode || rawCode.length < 6) {
      return res.status(400).json({ success: false, error: "Invalid UPC/EAN barcode number." });
    }

    console.info(`[Pantryo Barcode] Looking up UPC/EAN: ${rawCode} (Language: ${language})`);

    // Check if an item in the household already has this barcode
    const existing = itemsStore.find(
      (item) => item.barcode && item.barcode.replace(/[^0-9]/g, "") === rawCode
    );

    if (existing) {
      const loc = LOCATIONS.find((l) => l.id === existing.locationId);
      const cat = CATEGORIES.find((c) => c.id === existing.categoryId);

      return res.status(200).json({
        success: true,
        source: "inventory_cache",
        barcode: rawCode,
        item: {
          name: existing.name,
          brand: null,
          category: cat ? cat.name : "Pantry Staples",
          quantity: existing.quantity,
          unit: existing.unit,
          recommendedLocation: loc ? (loc.type === "FREEZER" ? "Freezer" : loc.type === "PANTRY" ? "Pantry" : "Fridge") : "Fridge",
          estimatedShelfLifeDays: 14,
          monthsFrozenShelfLife: existing.monthsFrozenShelfLife || 6,
          barcode: rawCode,
          imageUrl: existing.imageUrl || null,
        },
      });
    }

    // Query Open Food Facts API (Open global food database)
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${rawCode}.json`;
    const offRes = await fetch(offUrl, {
      headers: {
        "User-Agent": "PantryoFoodTracker/1.0 (https://github.com/pantryo; support@pantryo.app)",
      },
    });

    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData && offData.status === 1 && offData.product) {
        const prod = offData.product;
        const brand = prod.brands ? prod.brands.split(",")[0].trim() : null;
        let nameFr = prod.product_name_fr || prod.generic_name_fr || null;
        let nameEn = prod.product_name_en || prod.generic_name_en || prod.product_name || "Food Product";
        
        if (brand) {
          if (nameFr && !nameFr.toLowerCase().includes(brand.toLowerCase())) {
            nameFr = `${brand} ${nameFr}`;
          }
          if (nameEn && !nameEn.toLowerCase().includes(brand.toLowerCase())) {
            nameEn = `${brand} ${nameEn}`;
          }
        }

        let name = language === "FR" ? (nameFr || nameEn) : (nameEn || nameFr);
        if (!nameFr) nameFr = name;
        if (!nameEn) nameEn = name;

        // Determine category mapping
        let category = "Pantry Staples";
        const catTags = (prod.categories_tags || []).join(" ").toLowerCase();
        if (catTags.includes("dairy") || catTags.includes("cheese") || catTags.includes("milk") || catTags.includes("yogurt") || catTags.includes("egg")) {
          category = "Dairy & Eggs";
        } else if (catTags.includes("meat") || catTags.includes("fish") || catTags.includes("seafood") || catTags.includes("poultry") || catTags.includes("beef") || catTags.includes("chicken")) {
          category = "Meat & Seafood";
        } else if (catTags.includes("fruit") || catTags.includes("vegetable") || catTags.includes("produce") || catTags.includes("salad")) {
          category = "Produce";
        } else if (catTags.includes("beverage") || catTags.includes("drink") || catTags.includes("juice") || catTags.includes("water") || catTags.includes("coffee") || catTags.includes("tea")) {
          category = "Beverages";
        } else if (catTags.includes("bread") || catTags.includes("bakery") || catTags.includes("pastry") || catTags.includes("cake") || catTags.includes("muffin")) {
          category = "Bakery";
        } else if (catTags.includes("sauce") || catTags.includes("condiment") || catTags.includes("dressing") || catTags.includes("mayo") || catTags.includes("ketchup")) {
          category = "Condiments";
        } else if (catTags.includes("snack") || catTags.includes("chip") || catTags.includes("cracker") || catTags.includes("cookie") || catTags.includes("chocolate") || catTags.includes("candy")) {
          category = "Snacks";
        } else if (catTags.includes("frozen")) {
          category = "Frozen Meals";
        }

        // Storage recommendation
        let recommendedLocation = "Pantry";
        if (["Dairy & Eggs", "Meat & Seafood", "Produce"].includes(category)) {
          recommendedLocation = "Fridge";
        } else if (category === "Frozen Meals") {
          recommendedLocation = "Freezer";
        }

        const quantityStr = prod.quantity || "1 item";

        return res.status(200).json({
          success: true,
          source: "open_food_facts",
          barcode: rawCode,
          item: {
            name: name.trim(),
            nameFr: nameFr ? nameFr.trim() : name.trim(),
            nameEn: nameEn ? nameEn.trim() : name.trim(),
            brand,
            category,
            quantity: 1,
            unit: quantityStr,
            recommendedLocation,
            estimatedShelfLifeDays: recommendedLocation === "Fridge" ? 10 : recommendedLocation === "Freezer" ? 180 : 45,
            monthsFrozenShelfLife: 6,
            barcode: rawCode,
            imageUrl: prod.image_front_url || prod.image_url || null,
            storageTip: prod.storage_instructions || `Store in ${recommendedLocation.toLowerCase()} for maximum freshness.`,
          },
        });
      }
    }

    // If not found in Open Food Facts, return generic candidate populated with the barcode
    return res.status(200).json({
      success: true,
      source: "unknown_barcode",
      barcode: rawCode,
      item: {
        name: `UPC Item #${rawCode.slice(-4)}`,
        brand: null,
        category: "Pantry Staples",
        quantity: 1,
        unit: "pcs",
        recommendedLocation: "Pantry",
        estimatedShelfLifeDays: 30,
        monthsFrozenShelfLife: 6,
        barcode: rawCode,
        storageTip: "Barcode detected. Confirm name and storage compartment.",
      },
    });
  } catch (err) {
    console.error("[Pantryo Barcode] Error looking up barcode:", err);
    return res.status(500).json({ success: false, error: "Failed to look up barcode." });
  }
});

/**
 * GET /api/v1/inventory/categories
 * Returns all food categories with their curated web photos and metadata.
 */
router.get("/categories", (req, res) => {
  res.json({
    success: true,
    categories: CATEGORIES,
  });
});

// Helper to sync items to encrypted storage
const syncItemsToEncryptedDisk = () => {
  dbStore.items = itemsStore;
  dbStore.persistToEncryptedDisk();
};

/**
 * GET /api/v1/inventory/household/:id
 * Returns structured inventory grouped by location and expiring-soon priority.
 * Computes live shelf-life metrics and freezer duration countdowns.
 */
router.get("/household/:id", (req, res) => {
  try {
    const householdId = req.params.id || SEED_HOUSEHOLD_ID;
    const now = new Date();

    // Ensure synchronized with dbStore
    itemsStore = dbStore.items;

    // Enrich items with live status, computed days, and member attribution
    const enrichedItems = itemsStore
      .filter((item) => item.householdId === householdId && item.status === "ACTIVE")
      .map((item) => {
        const location = LOCATIONS.find((l) => l.id === item.locationId) || { name: "Fridge", type: "FRIDGE" };
        const category = CATEGORIES.find((c) => c.id === item.categoryId) || {
          name: "Pantry Staples",
          icon: "Package",
          color: "#F3E8FF",
          imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
        };
        const addedBy = (dbStore.users || []).find((u) => u.id === item.addedById) || { name: "Household Member", avatarUrl: null };

        // Expiration calculation
        let daysUntilExpiration = null;
        let isExpiringSoon = false;
        let isExpired = false;

        if (item.expirationDate) {
          const expDate = new Date(item.expirationDate);
          const diffMs = expDate.getTime() - now.getTime();
          daysUntilExpiration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isExpiringSoon = daysUntilExpiration <= 3 && daysUntilExpiration >= 0;
          isExpired = daysUntilExpiration < 0;
        }

        // Freezer duration calculation
        let monthsFrozen = null;
        let frozenPercentage = null;
        let isFreezerWarning = false;

        if (location.type === "FREEZER" && item.frozenAt) {
          const frozenDate = new Date(item.frozenAt);
          const diffMonths = (now.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
          monthsFrozen = Math.max(0.1, Number(diffMonths.toFixed(1)));
          const maxMonths = item.monthsFrozenShelfLife || 6;
          frozenPercentage = Math.min(100, Math.round((monthsFrozen / maxMonths) * 100));
          isFreezerWarning = frozenPercentage >= 80;
        }

        return {
          ...item,
          imageUrl: item.imageUrl || category.imageUrl,
          locationName: location.name,
          locationType: location.type,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: category.color,
          categoryImageUrl: category.imageUrl,
          addedByName: addedBy.name,
          addedByAvatar: addedBy.avatarUrl,
          daysUntilExpiration,
          isExpiringSoon,
          isExpired,
          monthsFrozen,
          frozenPercentage,
          isFreezerWarning,
        };
      });

    // Grouping by location
    const fridge = enrichedItems.filter((i) => i.locationType === "FRIDGE");
    const pantry = enrichedItems.filter((i) => i.locationType === "PANTRY");
    const freezer = enrichedItems.filter((i) => i.locationType === "FREEZER");

    // Urgent / Expiring Soon priority list (sorted by least days remaining)
    const expiringSoon = enrichedItems
      .filter((i) => i.isExpiringSoon || i.isExpired)
      .sort((a, b) => (a.daysUntilExpiration ?? 99) - (b.daysUntilExpiration ?? 99));

    // Summary statistics
    const stats = {
      totalItems: enrichedItems.length,
      fridgeCount: fridge.length,
      pantryCount: pantry.length,
      freezerCount: freezer.length,
      expiringSoonCount: expiringSoon.length,
      freezerWarningCount: freezer.filter((i) => i.isFreezerWarning).length,
    };

    return res.status(200).json({
      success: true,
      household: {
        id: householdId,
        name: "The Yan & Kriz Kitchen",
        members: USERS,
      },
      stats,
      grouped: {
        fridge,
        pantry,
        freezer,
      },
      expiringSoon,
      allItems: enrichedItems,
    });
  } catch (error) {
    console.error("[Inventory Route] GET /household/:id error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve household inventory",
      details: error.message,
    });
  }
});

/**
 * POST /api/v1/inventory/item
 * Creates a new inventory item and attributes it to the logged-in user.
 */
router.post("/item", (req, res) => {
  try {
    const {
      name,
      quantity = 1,
      unit = "pcs",
      householdId = SEED_HOUSEHOLD_ID,
      locationId,
      locationName,
      categoryId,
      categoryName,
      addedById = "usr_yan",
      expirationDate,
      monthsFrozenShelfLife = 6,
      notes = "",
      barcode = null,
      imageUrl = null,
      isLeftover = false,
      leftoverFoodType = null,
      leftoverSourceMeal = null,
      prepDate = null,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Item name is required.",
      });
    }

    // Resolve location ID
    let resolvedLocationId = locationId;
    if (!resolvedLocationId && locationName) {
      const match = LOCATIONS.find(
        (l) => l.name.toLowerCase() === locationName.toLowerCase() || l.type.toLowerCase() === locationName.toLowerCase()
      );
      resolvedLocationId = match ? match.id : "loc_fridge";
    }
    if (!resolvedLocationId) {
      resolvedLocationId = "loc_fridge";
    }

    // Resolve category ID
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName) {
      const match = CATEGORIES.find((c) => c.name.toLowerCase().includes(categoryName.toLowerCase()));
      resolvedCategoryId = match ? match.id : "cat_produce";
    }
    if (!resolvedCategoryId) {
      resolvedCategoryId = "cat_produce";
    }

    const loc = LOCATIONS.find((l) => l.id === resolvedLocationId);
    const isFreezer = loc && loc.type === "FREEZER";

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit || "pcs",
      householdId,
      locationId: resolvedLocationId,
      categoryId: resolvedCategoryId,
      addedById,
      status: "ACTIVE",
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : getRelativeDate(7),
      frozenAt: isFreezer ? new Date().toISOString() : null,
      monthsFrozenShelfLife: Number(monthsFrozenShelfLife) || 6,
      defrostedAt: null,
      notes: notes || null,
      barcode: barcode || null,
      imageUrl: imageUrl || null,
      isLeftover: Boolean(isLeftover),
      leftoverFoodType: leftoverFoodType || null,
      leftoverSourceMeal: leftoverSourceMeal || null,
      prepDate: prepDate ? new Date(prepDate).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    itemsStore.unshift(newItem);
    syncItemsToEncryptedDisk();

    // Log the creation activity
    const user = USERS.find((u) => u.id === addedById);
    activityLogs.unshift({
      id: `log_${Date.now()}`,
      action: "ITEM_CREATED",
      details: {
        itemName: newItem.name,
        location: loc ? loc.name : "Fridge",
        addedBy: user ? user.name : "Yan",
      },
      itemId: newItem.id,
      userId: addedById,
      householdId,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: `"${newItem.name}" added to ${loc ? loc.name : "Fridge"} by ${user ? user.name : "Yan"}`,
      item: newItem,
    });
  } catch (error) {
    console.error("[Inventory Route] POST /item error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create inventory item",
      details: error.message,
    });
  }
});

/**
 * PUT /api/v1/inventory/item/:id/defrost
 * Moves an item from Freezer to Fridge and resets its expiration counter to exactly 3 days.
 */
router.put("/item/:id/defrost", (req, res) => {
  try {
    const { id } = req.params;
    const { userId = "usr_yan" } = req.body;

    const itemIndex = itemsStore.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Item with ID ${id} not found.`,
      });
    }

    const currentItem = itemsStore[itemIndex];
    const fridgeLoc = LOCATIONS.find((l) => l.type === "FRIDGE") || LOCATIONS[0];

    // Reset expiration counter to exactly 3 days from now (food safety guideline for defrosted proteins/meals)
    const defrostDate = new Date();
    const newExpirationDate = new Date(defrostDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const updatedItem = {
      ...currentItem,
      locationId: fridgeLoc.id,
      defrostedAt: defrostDate.toISOString(),
      expirationDate: newExpirationDate,
      updatedAt: defrostDate.toISOString(),
      notes: currentItem.notes
        ? `${currentItem.notes} (Defrosted on ${defrostDate.toLocaleDateString()})`
        : `Defrosted on ${defrostDate.toLocaleDateString()}`,
    };

    itemsStore[itemIndex] = updatedItem;
    syncItemsToEncryptedDisk();

    // Log defrost activity
    const user = USERS.find((u) => u.id === userId);
    activityLogs.unshift({
      id: `log_${Date.now()}`,
      action: "ITEM_DEFROSTED",
      details: {
        itemName: updatedItem.name,
        fromLocation: "Freezer",
        toLocation: "Fridge",
        newExpiration: "3 days",
        defrostedBy: user ? user.name : "Yan",
      },
      itemId: updatedItem.id,
      userId,
      householdId: updatedItem.householdId,
      createdAt: defrostDate.toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `"${updatedItem.name}" successfully moved to Fridge. Expiration safely reset to 3 days.`,
      item: updatedItem,
      newExpirationDate,
      daysRemaining: 3,
    });
  } catch (error) {
    console.error("[Inventory Route] PUT /item/:id/defrost error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to defrost item",
      details: error.message,
    });
  }
});

/**
 * PUT /api/v1/inventory/item/:id
 * Updates an existing inventory item (name, quantity, unit, location, category, expiration, notes)
 */
router.put("/item/:id", (req, res) => {
  try {
    const { id } = req.params;
    const itemIndex = itemsStore.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const currentItem = itemsStore[itemIndex];
    const {
      name,
      quantity,
      unit,
      locationName,
      locationId,
      categoryName,
      categoryId,
      expirationDate,
      notes,
      status,
      imageUrl,
      monthsFrozenShelfLife,
      isLeftover,
      leftoverFoodType,
      leftoverSourceMeal,
      prepDate,
      userId = "usr_yan",
    } = req.body;

    // Resolve location
    let resolvedLocationId = locationId || currentItem.locationId;
    if (locationName) {
      const match = LOCATIONS.find(
        (l) => l.name.toLowerCase() === locationName.toLowerCase() || l.type.toLowerCase() === locationName.toLowerCase()
      );
      if (match) resolvedLocationId = match.id;
    }

    // Resolve category
    let resolvedCategoryId = categoryId || currentItem.categoryId;
    if (categoryName) {
      const match = CATEGORIES.find((c) => c.name.toLowerCase().includes(categoryName.toLowerCase()));
      if (match) resolvedCategoryId = match.id;
    }

    const loc = LOCATIONS.find((l) => l.id === resolvedLocationId);
    const isFreezer = loc && loc.type === "FREEZER";

    const updatedItem = {
      ...currentItem,
      name: name !== undefined && name.trim().length > 0 ? name.trim() : currentItem.name,
      quantity: quantity !== undefined ? Number(quantity) : currentItem.quantity,
      unit: unit !== undefined ? unit : currentItem.unit,
      locationId: resolvedLocationId,
      categoryId: resolvedCategoryId,
      status: status || currentItem.status,
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : currentItem.expirationDate,
      notes: notes !== undefined ? notes : currentItem.notes,
      imageUrl: imageUrl !== undefined ? imageUrl : currentItem.imageUrl,
      isLeftover: isLeftover !== undefined ? Boolean(isLeftover) : currentItem.isLeftover,
      leftoverFoodType: leftoverFoodType !== undefined ? leftoverFoodType : currentItem.leftoverFoodType,
      leftoverSourceMeal: leftoverSourceMeal !== undefined ? leftoverSourceMeal : currentItem.leftoverSourceMeal,
      prepDate: prepDate !== undefined ? prepDate : currentItem.prepDate,
      monthsFrozenShelfLife: monthsFrozenShelfLife !== undefined ? Number(monthsFrozenShelfLife) : currentItem.monthsFrozenShelfLife,
      frozenAt: isFreezer ? (currentItem.frozenAt || new Date().toISOString()) : null,
      updatedAt: new Date().toISOString(),
    };

    itemsStore[itemIndex] = updatedItem;
    syncItemsToEncryptedDisk();

    const user = USERS.find((u) => u.id === userId);
    activityLogs.unshift({
      id: `log_${Date.now()}`,
      action: "ITEM_UPDATED",
      details: {
        itemName: updatedItem.name,
        location: loc ? loc.name : "Fridge",
        updatedBy: user ? user.name : "Yan",
      },
      itemId: updatedItem.id,
      userId,
      householdId: updatedItem.householdId,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: `Updated "${updatedItem.name}"`,
      item: updatedItem,
    });
  } catch (error) {
    console.error("[Inventory Route] PUT /item/:id error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update item",
      details: error.message,
    });
  }
});

/**
 * DELETE /api/v1/inventory/item/:id
 * Marks an item as consumed or discarded
 */
router.delete("/item/:id", (req, res) => {
  const { id } = req.params;
  const item = itemsStore.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: "Item not found" });
  }

  itemsStore = itemsStore.filter((i) => i.id !== id);
  syncItemsToEncryptedDisk();
  return res.status(200).json({ success: true, message: `Removed "${item.name}" from inventory.` });
});

/**
 * POST /api/v1/inventory/bulk-items
 * Adds multiple items purchased from the grocery cart into household inventory
 */
router.post("/bulk-items", (req, res) => {
  try {
    const { items = [], userId = "usr_yan", householdId = SEED_HOUSEHOLD_ID } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Items array is required" });
    }

    const addedItems = [];
    const user = USERS.find((u) => u.id === userId) || USERS[0];

    for (const raw of items) {
      if (!raw.name || !raw.name.trim()) continue;

      // Determine target location: FRIDGE, FREEZER, or PANTRY
      let targetLocType = (raw.locationType || "FRIDGE").toUpperCase();
      if (!["FRIDGE", "FREEZER", "PANTRY"].includes(targetLocType)) {
        targetLocType = "FRIDGE";
      }

      const loc = LOCATIONS.find((l) => l.type === targetLocType) || LOCATIONS[0];
      const isFreezer = targetLocType === "FREEZER";

      // Match category
      let matchedCat = CATEGORIES[0];
      if (raw.categoryName) {
        const found = CATEGORIES.find((c) =>
          c.name.toLowerCase().includes(raw.categoryName.toLowerCase())
        );
        if (found) matchedCat = found;
      }

      // Default shelf life based on location
      let days = 7;
      if (targetLocType === "PANTRY") days = 90;
      else if (targetLocType === "FREEZER") days = 180;
      else if (raw.categoryName?.toLowerCase().includes("dairy")) days = 10;
      else if (raw.categoryName?.toLowerCase().includes("produce")) days = 6;
      else if (raw.categoryName?.toLowerCase().includes("meat")) days = 4;

      const expirationDate = raw.expirationDate
        ? new Date(raw.expirationDate).toISOString()
        : getRelativeDate(days);

      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: raw.name.trim(),
        quantity: Number(raw.quantity) || 1,
        unit: raw.unit || "pcs",
        householdId,
        locationId: loc.id,
        categoryId: matchedCat.id,
        addedById: user.id,
        status: "ACTIVE",
        expirationDate,
        frozenAt: isFreezer ? new Date().toISOString() : null,
        monthsFrozenShelfLife: isFreezer ? 6 : null,
        defrostedAt: null,
        notes: raw.notes || `Stocked from grocery cart by ${user.name}`,
        barcode: raw.barcode || null,
        imageUrl: raw.imageUrl || null,
        isLeftover: Boolean(raw.isLeftover),
        leftoverFoodType: raw.leftoverFoodType || null,
        leftoverSourceMeal: raw.leftoverSourceMeal || null,
        prepDate: raw.prepDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      itemsStore.unshift(newItem);
      addedItems.push(newItem);
    }
    syncItemsToEncryptedDisk();

    // Record activity log for the shopping trip
    activityLogs.unshift({
      id: `log_${Date.now()}`,
      action: "GROCERY_CART_ADDED",
      details: {
        itemCount: addedItems.length,
        itemNames: addedItems.map((i) => i.name).slice(0, 3).join(", ") + (addedItems.length > 3 ? "..." : ""),
        addedBy: user.name,
      },
      userId: user.id,
      householdId,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: `Successfully stocked ${addedItems.length} items from grocery cart into your kitchen!`,
      addedCount: addedItems.length,
      items: addedItems,
    });
  } catch (error) {
    console.error("[Inventory Route] POST /bulk-items error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to stock grocery cart items",
      details: error.message,
    });
  }
});

/**
 * ============================================================================
 * MEAL PLANNING WITH CALENDAR ROUTES
 * ============================================================================
 */

function getIsoDateOffset(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Clean install: no default meals/recipes on new install
let plannedMealsStore = [];

// Helper to sync meals to encrypted storage
const syncMealsToEncryptedDisk = () => {
  dbStore.plannedMeals = plannedMealsStore;
  dbStore.persistToEncryptedDisk();
};

// GET /api/v1/inventory/household/:householdId/meals
router.get("/household/:householdId/meals", (req, res) => {
  const { householdId } = req.params;
  plannedMealsStore = dbStore.plannedMeals;
  const meals = plannedMealsStore
    .filter((m) => m.householdId === householdId)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  return res.json({
    success: true,
    count: meals.length,
    meals,
  });
});

// POST /api/v1/inventory/household/:householdId/meals
router.post("/household/:householdId/meals", (req, res) => {
  try {
    const { householdId } = req.params;
    const {
      title,
      date,
      mealType = "DINNER",
      recipeName,
      recipeUrl,
      imageUrl,
      servings = 2,
      prepTimeMinutes = 30,
      notes = "",
      ingredients = [],
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        error: "Title and date (YYYY-MM-DD) are required for meal planning.",
      });
    }

    const newMeal = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      householdId,
      title: title.trim(),
      date,
      mealType: (mealType || "DINNER").toUpperCase(),
      recipeName: recipeName ? recipeName.trim() : null,
      recipeUrl: recipeUrl || null,
      imageUrl: imageUrl || null,
      servings: Number(servings) || 2,
      prepTimeMinutes: Number(prepTimeMinutes) || 30,
      notes: notes || "",
      isCooked: false,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    plannedMealsStore.push(newMeal);
    syncMealsToEncryptedDisk();

    // Record activity log
    activityLogs.unshift({
      id: `log_${Date.now()}`,
      action: "MEAL_PLANNED",
      details: {
        mealTitle: newMeal.title,
        date: newMeal.date,
        mealType: newMeal.mealType,
      },
      userId: USERS[0].id,
      householdId,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: `Meal "${newMeal.title}" added to calendar for ${newMeal.date}`,
      meal: newMeal,
    });
  } catch (error) {
    console.error("[Inventory Route] POST meal error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to schedule meal",
      details: error.message,
    });
  }
});

// PUT /api/v1/inventory/meals/:mealId
router.put("/meals/:mealId", (req, res) => {
  const { mealId } = req.params;
  const index = plannedMealsStore.findIndex((m) => m.id === mealId);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Meal not found" });
  }

  const existing = plannedMealsStore[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    householdId: existing.householdId,
    updatedAt: new Date().toISOString(),
  };

  plannedMealsStore[index] = updated;
  syncMealsToEncryptedDisk();

  return res.json({
    success: true,
    message: "Meal plan updated successfully",
    meal: updated,
  });
});

// DELETE /api/v1/inventory/meals/:mealId
router.delete("/meals/:mealId", (req, res) => {
  const { mealId } = req.params;
  const initialLength = plannedMealsStore.length;
  plannedMealsStore = plannedMealsStore.filter((m) => m.id !== mealId);

  if (plannedMealsStore.length === initialLength) {
    return res.status(404).json({ success: false, error: "Meal not found" });
  }

  syncMealsToEncryptedDisk();

  return res.json({
    success: true,
    message: "Meal removed from calendar",
  });
});

export default router;

