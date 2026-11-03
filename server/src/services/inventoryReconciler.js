/**
 * Pantryo - Local Database Inventory & Food Catalog Reconciler
 * 
 * Compares food items extracted by Gemini Vision AI (or offline OCR fallback)
 * against the local SQLite / Encrypted Household Database:
 * 1. Active Household Inventory: detects duplicates, checks current stock,
 *    and supports 1-click "+1 Add to existing stock" or "Add as separate batch".
 * 2. Canonical Canadian Food & Packaging Catalog: calibrates shelf-life (e.g. 730 days
 *    for canned goods, 365 days for shelf-stable broths), standardizes bilingual
 *    names (French/English), assigns optimal storage locations (Pantry vs Fridge).
 */

import { dbStore } from "./dbStore.js";
import { getBilingualNames, translateFoodItem, isTextFrench } from "./foodTranslator.js";
import { QUEBEC_GROCERY_CATALOG, KNOWN_BRANDS, findCatalogMatch } from "./packagingAnalyzer.js";

/**
 * Normalizes text for resilient fuzzy comparison:
 * Strips accents, punctuation, common articles, and collapses whitespace.
 */
export function normalizeFoodString(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(?:le|la|les|un|une|des|du|de|d|the|a|an|in|en|aux|au|and|et|pour|for|with|avec)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates word-overlap similarity score between two strings (0.0 to 1.0)
 */
export function calculateSimilarity(str1, str2) {
  const norm1 = normalizeFoodString(str1);
  const norm2 = normalizeFoodString(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.88;

  const words1 = new Set(norm1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(norm2.split(" ").filter((w) => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Reconciles an extracted item against the local database
 * 
 * @param {Object} extractedItem - Item extracted from Gemini Vision or fallback OCR
 * @param {string} language - Preferred language ("FR" or "EN")
 * @returns {Object} Reconciled item with attached reconciliation metadata
 */
export function reconcileItemWithLocalDb(extractedItem, language = "FR") {
  if (!extractedItem || typeof extractedItem !== "object") {
    return extractedItem;
  }

  const isFr = (language || "FR").toUpperCase().startsWith("FR");
  const extractedName = extractedItem.name || extractedItem.nameFr || extractedItem.nameEn || "";
  const extractedBrand = extractedItem.brand || "";
  const rawBarcode = extractedItem.barcode ? String(extractedItem.barcode).replace(/[^0-9]/g, "") : null;

  // 1. Query Current Active Household Inventory
  const activeItems = (dbStore.items || []).filter(
    (item) => item.status === "ACTIVE"
  );

  let bestInventoryMatch = null;
  let matchConfidence = 0;
  let matchReason = "";

  // A. Barcode Exact Match (Highest Authority)
  if (rawBarcode && rawBarcode.length >= 8) {
    const barcodeMatch = activeItems.find(
      (item) => item.barcode && item.barcode.replace(/[^0-9]/g, "") === rawBarcode
    );
    if (barcodeMatch) {
      bestInventoryMatch = barcodeMatch;
      matchConfidence = 1.0;
      matchReason = isFr ? `Code-barres UPC #${rawBarcode} identique` : `Exact UPC #${rawBarcode} match`;
    }
  }

  // B. Name & Brand Fuzzy Match in Active Inventory
  if (!bestInventoryMatch && extractedName) {
    for (const invItem of activeItems) {
      // Check brand alignment
      const brandSimilarity = (extractedBrand && invItem.brand)
        ? calculateSimilarity(extractedBrand, invItem.brand)
        : 0.5;

      const titleSimFr = calculateSimilarity(extractedName, invItem.nameFr || invItem.name);
      const titleSimEn = calculateSimilarity(extractedName, invItem.nameEn || invItem.name);
      const titleSimDirect = calculateSimilarity(extractedName, invItem.name);

      const maxTitleSim = Math.max(titleSimFr, titleSimEn, titleSimDirect);

      // Weighted score
      const combinedScore = (maxTitleSim * 0.75) + (brandSimilarity * 0.25);

      if (combinedScore > 0.65 && combinedScore > matchConfidence) {
        matchConfidence = combinedScore;
        bestInventoryMatch = invItem;
        matchReason = isFr
          ? `Correspondance de nom (${Math.round(combinedScore * 100)}%) avec le stock existant`
          : `Name similarity match (${Math.round(combinedScore * 100)}%) with existing stock`;
      }
    }
  }

  // 2. Query Canonical Local Food & Packaging Catalog (Health Canada & Quebec Grocery)
  const searchCorpus = `${extractedName} ${extractedBrand} ${extractedItem.detectedText || ""}`.toLowerCase();
  const catalogMatch = findCatalogMatch(searchCorpus);

  // Calibrate shelf-life & locations from catalog or heuristics
  let calibratedShelfLife = extractedItem.estimatedShelfLifeDays;
  let calibratedUnopenedShelfLife = extractedItem.unopenedShelfLifeDays;
  let calibratedOpenedShelfLife = extractedItem.openedShelfLifeDays;
  let calibratedLocation = extractedItem.recommendedLocation;
  let calibratedCategory = extractedItem.category;
  let calibratedBrand = extractedBrand;

  if (catalogMatch) {
    calibratedShelfLife = catalogMatch.estimatedShelfLifeDays || calibratedShelfLife;
    calibratedUnopenedShelfLife = catalogMatch.unopenedShelfLifeDays || calibratedUnopenedShelfLife;
    calibratedOpenedShelfLife = catalogMatch.openedShelfLifeDays || calibratedOpenedShelfLife;
    calibratedLocation = catalogMatch.recommendedLocation || calibratedLocation;
    calibratedCategory = isFr ? catalogMatch.categoryFr : catalogMatch.categoryEn;
    if (!calibratedBrand && catalogMatch.brand) {
      calibratedBrand = catalogMatch.brand;
    }
  } else {
    // Intelligent category-based calibration
    const lowerName = extractedName.toLowerCase();
    if (lowerName.includes("sauce") || lowerName.includes("tomate") || lowerName.includes("can") || lowerName.includes("conserve")) {
      calibratedShelfLife = Math.max(calibratedShelfLife || 0, 730);
      calibratedUnopenedShelfLife = Math.max(calibratedUnopenedShelfLife || 0, 730);
      calibratedOpenedShelfLife = 5;
      calibratedLocation = "Pantry";
      calibratedCategory = isFr ? "Garde-manger / Conserves" : "Canned Goods";
    } else if (lowerName.includes("bouillon") || lowerName.includes("broth")) {
      calibratedShelfLife = Math.max(calibratedShelfLife || 0, 365);
      calibratedUnopenedShelfLife = Math.max(calibratedUnopenedShelfLife || 0, 365);
      calibratedOpenedShelfLife = 7;
      calibratedLocation = "Pantry";
      calibratedCategory = isFr ? "Garde-manger" : "Pantry Staples";
    }
  }

  // If brand is recognized from known Canadian brands
  if (!calibratedBrand) {
    for (const kb of KNOWN_BRANDS) {
      if (kb.pattern.test(searchCorpus)) {
        calibratedBrand = kb.brand;
        break;
      }
    }
  }

  // 3. Construct Unified Reconciliation Metadata
  const now = new Date();
  let daysRemainingInStock = null;
  if (bestInventoryMatch && bestInventoryMatch.expirationDate) {
    const expDate = new Date(bestInventoryMatch.expirationDate);
    daysRemainingInStock = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const reconciliation = {
    isAlreadyInInventory: Boolean(bestInventoryMatch),
    matchConfidence: Number(matchConfidence.toFixed(2)),
    matchReason,
    existingItem: bestInventoryMatch
      ? {
          id: bestInventoryMatch.id,
          name: bestInventoryMatch.name,
          nameFr: bestInventoryMatch.nameFr,
          nameEn: bestInventoryMatch.nameEn,
          quantity: bestInventoryMatch.quantity,
          unit: bestInventoryMatch.unit,
          locationId: bestInventoryMatch.locationId,
          categoryId: bestInventoryMatch.categoryId,
          expirationDate: bestInventoryMatch.expirationDate,
          daysRemaining: daysRemainingInStock,
          notes: bestInventoryMatch.notes,
        }
      : null,
    currentStock: bestInventoryMatch ? bestInventoryMatch.quantity : 0,
    suggestedAction: bestInventoryMatch ? "increment_quantity" : "add_new",
    canonicalBrand: calibratedBrand || null,
    calibratedCategory,
    calibratedShelfLifeDays: calibratedShelfLife,
    calibratedStorageLocation: calibratedLocation || "Pantry",
    catalogMatched: Boolean(catalogMatch),
    reconciledAt: now.toISOString(),
  };

  // Reconciled bilingual naming
  const biling = getBilingualNames(extractedName, language);
  const resolvedNameFr = extractedItem.nameFr || (catalogMatch ? catalogMatch.nameFr : null) || biling.nameFr || extractedName;
  const resolvedNameEn = extractedItem.nameEn || (catalogMatch ? catalogMatch.nameEn : null) || biling.nameEn || extractedName;

  return {
    ...extractedItem,
    name: isFr ? resolvedNameFr : resolvedNameEn,
    nameFr: resolvedNameFr,
    nameEn: resolvedNameEn,
    brand: calibratedBrand || extractedItem.brand || null,
    category: calibratedCategory || extractedItem.category,
    recommendedLocation: calibratedLocation || extractedItem.recommendedLocation || "Pantry",
    estimatedShelfLifeDays: calibratedShelfLife || extractedItem.estimatedShelfLifeDays || 7,
    unopenedShelfLifeDays: calibratedUnopenedShelfLife || extractedItem.unopenedShelfLifeDays,
    openedShelfLifeDays: calibratedOpenedShelfLife || extractedItem.openedShelfLifeDays,
    reconciliation,
  };
}

/**
 * Reconciles an array of extracted items
 */
export function reconcileItemsWithLocalDb(items, language = "FR") {
  if (!Array.isArray(items)) return [];
  return items.map((it) => reconcileItemWithLocalDb(it, language));
}
