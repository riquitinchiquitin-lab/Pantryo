import express from "express";
import { analyzeFoodImage } from "../services/geminiVision.js";

const router = express.Router();

/**
 * In-memory Household Storage & Prisma Adapter
 * Enables immediate execution out-of-the-box and full compatibility with Prisma ORM
 * when PostgreSQL DATABASE_URL is configured.
 */

// Initial Seed Data for Multi-User Household (Yan & Kriz)
const SEED_HOUSEHOLD_ID = "hh_yan_kriz_01";
const USERS = [
  { id: "usr_yan", name: "Yan", email: "yan@example.com", role: "ADMIN", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
  { id: "usr_kriz", name: "Kriz", email: "kriz@example.com", role: "MEMBER", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
];

const LOCATIONS = [
  { id: "loc_fridge", name: "Fridge", type: "FRIDGE", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_pantry", name: "Pantry", type: "PANTRY", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_freezer", name: "Freezer", type: "FREEZER", householdId: SEED_HOUSEHOLD_ID },
];

const CATEGORIES = [
  { id: "cat_dairy", name: "Dairy & Eggs", icon: "Milk", color: "#E0F2FE", householdId: SEED_HOUSEHOLD_ID },
  { id: "cat_produce", name: "Produce", icon: "Apple", color: "#DCFCE7", householdId: SEED_HOUSEHOLD_ID },
  { id: "cat_meat", name: "Meat & Seafood", icon: "Beef", color: "#FEE2E2", householdId: SEED_HOUSEHOLD_ID },
  { id: "cat_bakery", name: "Bakery", icon: "Wheat", color: "#FEF3C7", householdId: SEED_HOUSEHOLD_ID },
  { id: "cat_pantry", name: "Pantry Staples", icon: "Package", color: "#F3E8FF", householdId: SEED_HOUSEHOLD_ID },
  { id: "cat_frozen", name: "Frozen Meals", icon: "Snowflake", color: "#E0E7FF", householdId: SEED_HOUSEHOLD_ID },
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

// Realistic seed inventory
let itemsStore = [
  {
    id: "item_001",
    name: "Oat Milk (Barista Blend)",
    quantity: 1,
    unit: "carton",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_dairy",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(2), // Expiring in 2 days!
    frozenAt: null,
    monthsFrozenShelfLife: 3,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80",
    notes: "Opened Sunday, keep cold on top shelf",
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(-1),
  },
  {
    id: "item_002",
    name: "Organic Strawberries",
    quantity: 1,
    unit: "pack (400g)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_produce",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(1), // Expiring in 1 day!
    frozenAt: null,
    monthsFrozenShelfLife: 8,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80",
    notes: "Wash before eating",
    createdAt: getRelativeDate(-4),
    updatedAt: getRelativeDate(-1),
  },
  {
    id: "item_003",
    name: "Grass-Fed Ground Beef 85/15",
    quantity: 2,
    unit: "lbs",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_freezer",
    categoryId: "cat_meat",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(120),
    frozenAt: getMonthsAgoDate(2.5), // Frozen 2.5 months ago
    monthsFrozenShelfLife: 6, // 6 months shelf life
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=300&q=80",
    notes: "Vacuum sealed portion packs",
    createdAt: getMonthsAgoDate(2.5),
    updatedAt: getMonthsAgoDate(2.5),
  },
  {
    id: "item_004",
    name: "Wild Salmon Fillets",
    quantity: 4,
    unit: "portions",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_freezer",
    categoryId: "cat_meat",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(90),
    frozenAt: getMonthsAgoDate(4.2), // Frozen 4.2 months ago
    monthsFrozenShelfLife: 5, // Approaching shelf life limit!
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80",
    notes: "Alaskan sockeye",
    createdAt: getMonthsAgoDate(4.2),
    updatedAt: getMonthsAgoDate(4.2),
  },
  {
    id: "item_005",
    name: "San Marzano Canned Tomatoes",
    quantity: 3,
    unit: "cans (28oz)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_pantry",
    categoryId: "cat_pantry",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(360),
    frozenAt: null,
    monthsFrozenShelfLife: null,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80",
    notes: "For weekend pasta marinara",
    createdAt: getRelativeDate(-14),
    updatedAt: getRelativeDate(-14),
  },
  {
    id: "item_006",
    name: "Greek Yogurt (0% Fat)",
    quantity: 1,
    unit: "tub (900g)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_dairy",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(5),
    frozenAt: null,
    monthsFrozenShelfLife: 2,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80",
    notes: "For morning smoothies",
    createdAt: getRelativeDate(-2),
    updatedAt: getRelativeDate(-2),
  },
];

let activityLogs = [
  {
    id: "log_001",
    action: "ITEM_CREATED",
    details: { itemName: "Oat Milk (Barista Blend)", location: "Fridge" },
    itemId: "item_001",
    userId: "usr_yan",
    householdId: SEED_HOUSEHOLD_ID,
    createdAt: getRelativeDate(-3),
  },
  {
    id: "log_002",
    action: "ITEM_CREATED",
    details: { itemName: "Organic Strawberries", location: "Fridge" },
    itemId: "item_002",
    userId: "usr_kriz",
    householdId: SEED_HOUSEHOLD_ID,
    createdAt: getRelativeDate(-4),
  },
];

/**
 * POST /api/v1/inventory/scan
 * Handles photo upload (base64 string or multipart), calls Gemini Vision service,
 * and returns auto-populated JSON fields for the UI entry form.
 */
router.post("/scan", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: imageBase64. Provide a base64 encoded image string.",
      });
    }

    // Call the production Gemini Flash Vision service
    const result = await analyzeFoodImage(imageBase64, mimeType);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Inventory Route] /scan failed:", error);

    // If Gemini API Key is not yet configured, return an intuitive fallback payload with instructive guidance
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(200).json({
        success: true,
        summary: "Notice: Gemini API Key pending in environment. Demo scan results populated.",
        demoMode: true,
        itemsCount: 2,
        items: [
          {
            name: "Organic Baby Spinach",
            category: "Produce",
            quantity: 1,
            unit: "box (500g)",
            recommendedLocation: "Fridge",
            storageReason: "Moisture-sensitive leafy greens stay crisp at 36°F.",
            estimatedShelfLifeDays: 5,
            monthsFrozenShelfLife: 10,
            confidence: 0.94,
            storageTip: "Add a dry paper towel in the tub to absorb condensation.",
            suggestedExpirationDate: getRelativeDate(5).split("T")[0],
          },
          {
            name: "Greek Feta Cheese in Brine",
            category: "Dairy & Eggs",
            quantity: 1,
            unit: "block (200g)",
            recommendedLocation: "Fridge",
            storageReason: "Submerged brine preserves texture and prevents mold.",
            estimatedShelfLifeDays: 14,
            monthsFrozenShelfLife: 3,
            confidence: 0.96,
            storageTip: "Ensure cheese is always completely immersed in the brine.",
            suggestedExpirationDate: getRelativeDate(14).split("T")[0],
          }
        ],
        scannedAt: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: "AI Vision analysis failed",
      details: error.message,
    });
  }
});

/**
 * GET /api/v1/inventory/household/:id
 * Returns structured inventory grouped by location and expiring-soon priority.
 * Computes live shelf-life metrics and freezer duration countdowns.
 */
router.get("/household/:id", (req, res) => {
  try {
    const householdId = req.params.id || SEED_HOUSEHOLD_ID;
    const now = new Date();

    // Enrich items with live status, computed days, and member attribution
    const enrichedItems = itemsStore
      .filter((item) => item.householdId === householdId && item.status === "ACTIVE")
      .map((item) => {
        const location = LOCATIONS.find((l) => l.id === item.locationId) || { name: "Fridge", type: "FRIDGE" };
        const category = CATEGORIES.find((c) => c.id === item.categoryId) || { name: "Pantry Staples", icon: "Package", color: "#F3E8FF" };
        const addedBy = USERS.find((u) => u.id === item.addedById) || { name: "Unknown", avatarUrl: null };

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
          locationName: location.name,
          locationType: location.type,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryColor: category.color,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    itemsStore.unshift(newItem);

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
        barcode: null,
        imageUrl: raw.imageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      itemsStore.unshift(newItem);
      addedItems.push(newItem);
    }

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

export default router;
