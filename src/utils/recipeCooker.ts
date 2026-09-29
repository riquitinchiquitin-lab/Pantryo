import { InventoryItem, PlannedMealIngredient, SmartMealSuggestionIngredient } from '../types';

export interface IngredientToDeduct {
  name: string;
  nameFr?: string;
  amount?: string;
  quantity?: number;
  unit?: string;
}

export interface DeductionResult {
  inventoryItemId: string;
  inventoryItemName: string;
  originalQuantity: number;
  originalUnit: string;
  usedDisplay: string;
  remainingQuantity: number;
  remainingUnit: string;
  wasFullyDepleted: boolean;
  notes?: string;
}

export interface CookRecipeOutcome {
  recipeTitle: string;
  deductions: DeductionResult[];
  unmatchedIngredients: string[];
  updatedInventory: InventoryItem[];
  itemsToDelete: string[];
  itemsToUpdate: {
    id: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
}

// Common staple ingredient volume-to-weight densities (grams per 1 cup / 240ml)
const STAPLE_CUP_GRAMS: Record<string, number> = {
  flour: 125,
  farine: 125,
  sugar: 200,
  sucre: 200,
  brown_sugar: 220,
  cassonade: 220,
  butter: 227,
  beurre: 227,
  milk: 240,
  lait: 240,
  water: 240,
  eau: 240,
  oil: 218,
  huile: 218,
  rice: 185,
  riz: 185,
  oats: 90,
  avoine: 90,
  yogurt: 245,
  yogourt: 245,
  cream: 240,
  creme: 240,
  salt: 290,
  sel: 290,
  honey: 340,
  miel: 340,
  syrup: 312,
  sirop: 312,
};

/**
 * Parses numeric value from a string (handles fractions like "1/2", "1 1/2", "3/4", "0.5")
 */
export function parseQuantityFromString(str: string): number | null {
  if (!str) return null;
  const clean = str.trim();

  // Handle mixed fractions: "1 1/2" or "2 1/4"
  const mixedMatch = clean.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    return den !== 0 ? whole + num / den : whole;
  }

  // Handle simple fraction: "1/2", "3/4"
  const fracMatch = clean.match(/^(\d+)\/(\d+)/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    return den !== 0 ? num / den : null;
  }

  // Handle simple numbers: "1", "2.5", "500"
  const numMatch = clean.match(/^(\d+(\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  return null;
}

/**
 * Extracts quantity, unit, and item name from an ingredient string or object
 */
export function parseIngredientDetails(ingredient: IngredientToDeduct): {
  quantity: number;
  unit: string;
  normalizedName: string;
} {
  // If explicitly provided quantity
  if (typeof ingredient.quantity === 'number' && ingredient.quantity > 0) {
    return {
      quantity: ingredient.quantity,
      unit: (ingredient.unit || 'pcs').trim().toLowerCase(),
      normalizedName: cleanIngredientName(ingredient.name || ingredient.nameFr || ''),
    };
  }

  const rawAmount = ingredient.amount || '';
  const parsedQty = parseQuantityFromString(rawAmount);
  const qty = parsedQty !== null && parsedQty > 0 ? parsedQty : 1;

  // Detect unit in rawAmount
  const lowerAmount = rawAmount.toLowerCase();
  let unit = 'pcs';

  if (/(cup|cups|tasse|tasses)\b/.test(lowerAmount)) {
    unit = 'cup';
  } else if (/(tbsp|c\. à soupe|c\. a soupe|cuillère à soupe|càs)\b/.test(lowerAmount)) {
    unit = 'tbsp';
  } else if (/(tsp|c\. à thé|c\. a the|cuillère à thé|càc)\b/.test(lowerAmount)) {
    unit = 'tsp';
  } else if (/\b(kg|kilogram|kilogramme)s?\b/.test(lowerAmount)) {
    unit = 'kg';
  } else if (/\b(g|gram|gramme)s?\b/.test(lowerAmount)) {
    unit = 'g';
  } else if (/\b(ml|milliliter|millilitre)s?\b/.test(lowerAmount)) {
    unit = 'ml';
  } else if (/\b(l|liter|litre)s?\b/.test(lowerAmount)) {
    unit = 'l';
  } else if (/\b(lb|lbs|pound|livre)s?\b/.test(lowerAmount)) {
    unit = 'lb';
  } else if (/\b(oz|ounce|once)s?\b/.test(lowerAmount)) {
    unit = 'oz';
  } else if (/\b(slice|slices|tranche|tranches)\b/.test(lowerAmount)) {
    unit = 'slice';
  } else if (/\b(fillet|fillets|pavé|pavés|filet|filets)\b/.test(lowerAmount)) {
    unit = 'fillet';
  } else if (/\b(egg|eggs|oeuf|oeufs|œuf|œufs)\b/.test(lowerAmount)) {
    unit = 'egg';
  } else if (/\b(can|cans|boîte|boîtes|conserve)\b/.test(lowerAmount)) {
    unit = 'can';
  } else if (/\b(bag|bags|sac|sacs|paquet|pkg)\b/.test(lowerAmount)) {
    unit = 'bag';
  }

  return {
    quantity: qty,
    unit,
    normalizedName: cleanIngredientName(ingredient.name || ingredient.nameFr || ''),
  };
}

/**
 * Strips measurements, adjectives, and punctuation to get the core ingredient name
 */
export function cleanIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b(organic|bio|biologique|fresh|frais|fraîche|raw|cooked|cuite|diced|sliced|chopped|extra virgin|all-purpose|tout usage|large|gros|grosse|thick|thin|minced|haché|lean|maigre|cold|warm|boneless|skinless)\b/gi, '')
    .replace(/[0-9/.]+/g, '')
    .replace(/[^a-zA-Z\u00C0-\u024F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines if a recipe ingredient matches an inventory item
 */
export function isIngredientMatch(recipeIngName: string, inventoryItemName: string): boolean {
  const rClean = cleanIngredientName(recipeIngName);
  const iClean = cleanIngredientName(inventoryItemName);

  if (rClean === iClean) return true;
  if (rClean.length > 2 && iClean.includes(rClean)) return true;
  if (iClean.length > 2 && rClean.includes(iClean)) return true;

  // Specific high-frequency staple synonyms
  const flourTerms = ['flour', 'farine'];
  if (flourTerms.some((t) => rClean.includes(t)) && flourTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const eggTerms = ['egg', 'oeuf', 'œuf'];
  if (eggTerms.some((t) => rClean.includes(t)) && eggTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const milkTerms = ['milk', 'lait'];
  if (milkTerms.some((t) => rClean.includes(t)) && milkTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const sugarTerms = ['sugar', 'sucre'];
  if (sugarTerms.some((t) => rClean.includes(t)) && sugarTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const butterTerms = ['butter', 'beurre'];
  if (butterTerms.some((t) => rClean.includes(t)) && butterTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const beefTerms = ['beef', 'boeuf', 'bœuf', 'steak'];
  if (beefTerms.some((t) => rClean.includes(t)) && beefTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const salmonTerms = ['salmon', 'saumon'];
  if (salmonTerms.some((t) => rClean.includes(t)) && salmonTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const tomatoTerms = ['tomato', 'tomate'];
  if (tomatoTerms.some((t) => rClean.includes(t)) && tomatoTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const avocadoTerms = ['avocado', 'avocat'];
  if (avocadoTerms.some((t) => rClean.includes(t)) && avocadoTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const breadTerms = ['bread', 'pain', 'sourdough', 'levain'];
  if (breadTerms.some((t) => rClean.includes(t)) && breadTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const oilTerms = ['oil', 'huile'];
  if (oilTerms.some((t) => rClean.includes(t)) && oilTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const strawberryTerms = ['strawberry', 'strawberries', 'fraise', 'fraises'];
  if (strawberryTerms.some((t) => rClean.includes(t)) && strawberryTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  const yogurtTerms = ['yogurt', 'yogourt', 'yaourt'];
  if (yogurtTerms.some((t) => rClean.includes(t)) && yogurtTerms.some((t) => iClean.includes(t))) {
    return true;
  }

  return false;
}

/**
 * Calculates remaining inventory quantity when deducting a needed recipe quantity.
 * Handles cross-unit conversions (e.g. 1 cup flour out of a 1kg bag or 2.5kg bag).
 */
export function calculateDeduction(
  inventoryItem: InventoryItem,
  neededQty: number,
  neededUnit: string
): {
  remainingQty: number;
  unit: string;
  usedDescription: string;
} {
  const invQty = Number(inventoryItem.quantity) || 1;
  const invUnit = (inventoryItem.unit || 'pcs').trim().toLowerCase();
  const nUnit = (neededUnit || 'pcs').trim().toLowerCase();
  const itemName = inventoryItem.name.toLowerCase();

  // Helper to identify staple density
  let stapleGramsPerCup = 150; // default generic solid
  for (const [key, grams] of Object.entries(STAPLE_CUP_GRAMS)) {
    if (itemName.includes(key)) {
      stapleGramsPerCup = grams;
      break;
    }
  }

  // 1. Same units: direct subtraction
  if (invUnit === nUnit) {
    const rem = Math.max(0, invQty - neededQty);
    return {
      remainingQty: Math.round(rem * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${inventoryItem.unit}`,
    };
  }

  // 2. Volume to Volume conversions
  // Standard ml mappings
  const volumeToMl: Record<string, number> = {
    ml: 1,
    l: 1000,
    liter: 1000,
    litre: 1000,
    cup: 240,
    tasse: 240,
    tbsp: 15,
    tsp: 5,
    fl_oz: 29.57,
  };

  if (volumeToMl[invUnit] && volumeToMl[nUnit]) {
    const invTotalMl = invQty * volumeToMl[invUnit];
    const needTotalMl = neededQty * volumeToMl[nUnit];
    const remMl = Math.max(0, invTotalMl - needTotalMl);
    const remOriginalUnit = remMl / volumeToMl[invUnit];
    return {
      remainingQty: Math.round(remOriginalUnit * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit} (~${Math.round(needTotalMl)} ml)`,
    };
  }

  // 3. Mass to Mass conversions
  const massToGrams: Record<string, number> = {
    g: 1,
    gram: 1,
    gramme: 1,
    kg: 1000,
    kilogram: 1000,
    lb: 453.6,
    lbs: 453.6,
    pound: 453.6,
    oz: 28.35,
  };

  if (massToGrams[invUnit] && massToGrams[nUnit]) {
    const invTotalGrams = invQty * massToGrams[invUnit];
    const needTotalGrams = neededQty * massToGrams[nUnit];
    const remGrams = Math.max(0, invTotalGrams - needTotalGrams);
    const remOriginalUnit = remGrams / massToGrams[invUnit];
    return {
      remainingQty: Math.round(remOriginalUnit * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit} (~${Math.round(needTotalGrams)} g)`,
    };
  }

  // 4. Volume (e.g. 1 cup) needed from Mass inventory (e.g. 1 kg / 2.5 kg / 500 g flour or sugar)
  if (volumeToMl[nUnit] && massToGrams[invUnit]) {
    // Convert needed volume to approximate grams based on staple density
    const cups = (neededQty * volumeToMl[nUnit]) / 240;
    const gramsNeeded = cups * stapleGramsPerCup;

    const invTotalGrams = invQty * massToGrams[invUnit];
    const remGrams = Math.max(0, invTotalGrams - gramsNeeded);
    const remOriginalUnit = remGrams / massToGrams[invUnit];

    return {
      remainingQty: Math.round(remOriginalUnit * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit} (~${Math.round(gramsNeeded)} g)`,
    };
  }

  // 5. Mass needed from Volume inventory (e.g. 200g yogurt needed from 1 L yogurt)
  if (massToGrams[nUnit] && volumeToMl[invUnit]) {
    const neededGrams = neededQty * massToGrams[nUnit];
    const neededCups = neededGrams / stapleGramsPerCup;
    const neededMl = neededCups * 240;

    const invTotalMl = invQty * volumeToMl[invUnit];
    const remMl = Math.max(0, invTotalMl - neededMl);
    const remOriginalUnit = remMl / volumeToMl[invUnit];

    return {
      remainingQty: Math.round(remOriginalUnit * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit} (~${Math.round(neededMl)} ml)`,
    };
  }

  // 6. Generic container/bag packaging (e.g. 1 bag of flour, 1 sac de farine, 1 box, 1 pack)
  const isContainerUnit = ['bag', 'sac', 'box', 'boite', 'boîte', 'pack', 'pkg', 'paquet', 'item', 'pcs', 'container'].includes(invUnit);
  if (isContainerUnit) {
    // Check if netContent or title indicates bag size: e.g. "2.5 kg" or "1 kg" or "5 lbs"
    let totalBagGrams = 1000; // default 1 kg bag of flour/sugar
    const netContentMatch = (inventoryItem.netContent || inventoryItem.name).match(/(\d+(\.\d+)?)\s*(kg|g|lb|lbs)/i);
    if (netContentMatch) {
      const num = parseFloat(netContentMatch[1]);
      const u = netContentMatch[3].toLowerCase();
      if (u === 'kg') totalBagGrams = num * 1000;
      else if (u === 'g') totalBagGrams = num;
      else if (u.includes('lb')) totalBagGrams = num * 453.6;
    }

    let gramsNeeded = 0;
    if (volumeToMl[nUnit]) {
      const cups = (neededQty * volumeToMl[nUnit]) / 240;
      gramsNeeded = cups * stapleGramsPerCup;
    } else if (massToGrams[nUnit]) {
      gramsNeeded = neededQty * massToGrams[nUnit];
    } else {
      // Small count deduction (e.g. 1 unit out of bag)
      gramsNeeded = totalBagGrams * 0.15;
    }

    // Fraction of bag consumed
    const fractionUsed = gramsNeeded / (totalBagGrams * invQty);
    const remainingFraction = Math.max(0, invQty - (fractionUsed * invQty));

    return {
      remainingQty: Math.max(0, Math.round(remainingFraction * 100) / 100),
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit} (~${Math.round(gramsNeeded)}g from ${inventoryItem.unit})`,
    };
  }

  // 7. Count / Units (e.g. eggs, fillets, cans, slices)
  if (['egg', 'fillet', 'slice', 'can', 'pcs', 'unit', 'portion', 'tranche'].includes(nUnit)) {
    const rem = Math.max(0, invQty - neededQty);
    return {
      remainingQty: Math.round(rem * 100) / 100,
      unit: inventoryItem.unit,
      usedDescription: `${neededQty} ${neededUnit}`,
    };
  }

  // Fallback: If recipe needs 1 portion/unit, reduce inventory by needed amount or 1
  const fallbackRem = Math.max(0, invQty - Math.min(invQty, neededQty));
  return {
    remainingQty: Math.round(fallbackRem * 100) / 100,
    unit: inventoryItem.unit,
    usedDescription: `${neededQty} ${neededUnit}`,
  };
}

/**
 * Main cooking deduction engine:
 * Evaluates recipe ingredients against kitchen inventory,
 * deducts used quantities, removes fully depleted items,
 * and preserves partially used items (e.g., flour bag keeps remaining portion).
 */
export function deductRecipeFromInventory(
  recipeIngredients: IngredientToDeduct[],
  currentInventory: InventoryItem[],
  recipeTitle: string = 'Recipe'
): CookRecipeOutcome {
  const updatedInventory = [...currentInventory];
  const deductions: DeductionResult[] = [];
  const unmatchedIngredients: string[] = [];
  const itemsToDelete: string[] = [];
  const itemsToUpdate: { id: string; quantity: number; unit: string; notes?: string }[] = [];

  const matchedInventoryIds = new Set<string>();

  for (const ing of recipeIngredients) {
    const parsed = parseIngredientDetails(ing);
    const originalName = ing.name || ing.nameFr || '';

    // Find best match in kitchen inventory
    const matchIndex = updatedInventory.findIndex(
      (item) => !matchedInventoryIds.has(item.id) && isIngredientMatch(originalName, item.name)
    );

    if (matchIndex === -1) {
      unmatchedIngredients.push(originalName);
      continue;
    }

    const matchedItem = updatedInventory[matchIndex];
    matchedInventoryIds.add(matchedItem.id);

    // Calculate deduction
    const { remainingQty, unit, usedDescription } = calculateDeduction(
      matchedItem,
      parsed.quantity,
      parsed.unit
    );

    const wasFullyDepleted = remainingQty <= 0.001;

    deductions.push({
      inventoryItemId: matchedItem.id,
      inventoryItemName: matchedItem.name,
      originalQuantity: matchedItem.quantity,
      originalUnit: matchedItem.unit,
      usedDisplay: usedDescription,
      remainingQuantity: remainingQty,
      remainingUnit: unit,
      wasFullyDepleted,
      notes: `Used in "${recipeTitle}"`,
    });

    if (wasFullyDepleted) {
      itemsToDelete.push(matchedItem.id);
      // Remove from active list
      updatedInventory.splice(matchIndex, 1);
    } else {
      // Update item quantity in-place
      const updatedItem: InventoryItem = {
        ...matchedItem,
        quantity: remainingQty,
        unit,
        updatedAt: new Date().toISOString(),
        notes: matchedItem.notes
          ? `${matchedItem.notes} • Used ${usedDescription} in "${recipeTitle}"`
          : `Used ${usedDescription} in "${recipeTitle}" on ${new Date().toLocaleDateString()}`,
      };

      updatedInventory[matchIndex] = updatedItem;
      itemsToUpdate.push({
        id: updatedItem.id,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        notes: updatedItem.notes || undefined,
      });
    }
  }

  return {
    recipeTitle,
    deductions,
    unmatchedIngredients,
    updatedInventory,
    itemsToDelete,
    itemsToUpdate,
  };
}
