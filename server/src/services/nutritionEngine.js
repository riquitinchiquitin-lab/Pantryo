/**
 * Nutritional Database for Kitchen Komrade / Pantryo
 * Node.js Server-side Nutrition Engine
 */
export const INGREDIENT_NUTRITION_DATABASE = [
  // Poultry & Meat
  {
    keywords: ['chicken breast', 'poitrine de poulet', 'poulet', 'chicken'],
    kcalPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    defaultUnitWeightGrams: { g: 1, kg: 1000, breast: 180, piece: 180, portion: 180 },
  },
  {
    keywords: ['chicken thigh', 'cuisse de poulet', 'haut de cuisse'],
    kcalPer100g: 209,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 10.9,
    defaultUnitWeightGrams: { g: 1, kg: 1000, thigh: 120, piece: 120 },
  },
  {
    keywords: ['ground beef', 'boeuf haché', 'bœuf haché', 'beef', 'steak', 'bavette', 'boeuf'],
    kcalPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15,
    defaultUnitWeightGrams: { g: 1, kg: 1000, lb: 454, lbs: 454 },
  },
  {
    keywords: ['pork', 'porc', 'pork chop', 'longe de porc', 'bacon', 'lardons'],
    kcalPer100g: 242,
    proteinPer100g: 27,
    carbsPer100g: 0,
    fatPer100g: 14,
    defaultUnitWeightGrams: { g: 1, kg: 1000, chop: 150, slice: 25 },
  },
  // Seafood
  {
    keywords: ['salmon', 'saumon', 'wild salmon'],
    kcalPer100g: 208,
    proteinPer100g: 22,
    carbsPer100g: 0,
    fatPer100g: 13,
    defaultUnitWeightGrams: { g: 1, kg: 1000, fillet: 170, pave: 170 },
  },
  {
    keywords: ['tuna', 'thon'],
    kcalPer100g: 130,
    proteinPer100g: 28,
    carbsPer100g: 0,
    fatPer100g: 1,
    defaultUnitWeightGrams: { can: 160, boite: 160 },
  },
  {
    keywords: ['shrimp', 'crevettes', 'crevette', 'prawn'],
    kcalPer100g: 99,
    proteinPer100g: 24,
    carbsPer100g: 0.2,
    fatPer100g: 0.3,
    defaultUnitWeightGrams: { g: 1, kg: 1000 },
  },
  // Eggs & Dairy
  {
    keywords: ['egg', 'oeuf', 'œuf', 'oeufs', 'œufs'],
    kcalPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fatPer100g: 9.5,
    defaultUnitWeightGrams: { egg: 50, unit: 50, piece: 50, pcs: 50 },
  },
  {
    keywords: ['milk', 'lait', '2% milk', 'whole milk'],
    kcalPer100g: 50,
    proteinPer100g: 3.4,
    carbsPer100g: 4.8,
    fatPer100g: 2,
    defaultUnitWeightGrams: { ml: 1, l: 1000, cup: 245, tasse: 245, tbsp: 15 },
  },
  {
    keywords: ['cheddar', 'fromage', 'cheese', 'mozzarella', 'parmesan'],
    kcalPer100g: 402,
    proteinPer100g: 25,
    carbsPer100g: 1.3,
    fatPer100g: 33,
    defaultUnitWeightGrams: { g: 1, slice: 25, cup: 110, tbsp: 15 },
  },
  {
    keywords: ['butter', 'beurre'],
    kcalPer100g: 717,
    proteinPer100g: 0.9,
    carbsPer100g: 0.1,
    fatPer100g: 81,
    defaultUnitWeightGrams: { tbsp: 14, tsp: 5, c_a_soupe: 14, c_a_the: 5 },
  },
  // Grains
  {
    keywords: ['pasta', 'pâtes', 'spaghetti', 'penne', 'macaroni', 'noodles'],
    kcalPer100g: 371,
    proteinPer100g: 13,
    carbsPer100g: 75,
    fatPer100g: 1.5,
    defaultUnitWeightGrams: { g: 1, cup: 100, portion: 85 },
  },
  {
    keywords: ['rice', 'riz', 'basmati', 'jasmine rice', 'brown rice'],
    kcalPer100g: 360,
    proteinPer100g: 7.5,
    carbsPer100g: 79,
    fatPer100g: 0.7,
    defaultUnitWeightGrams: { g: 1, cup: 185, tasse: 185 },
  },
  // Oils
  {
    keywords: ['olive oil', 'huile d\'olive', 'oil', 'huile', 'canola', 'vegetable oil'],
    kcalPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    defaultUnitWeightGrams: { tbsp: 14, tsp: 4.5, c_a_soupe: 14, c_a_the: 4.5, ml: 0.92 },
  },
  // Vegetables
  {
    keywords: ['spinach', 'épinards', 'epinards', 'kale', 'lettuce', 'salade'],
    kcalPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 3.6,
    fatPer100g: 0.4,
    defaultUnitWeightGrams: { cup: 30, handful: 40, poignee: 40 },
  },
  {
    keywords: ['onion', 'oignon', 'oignons', 'shallot', 'échalote'],
    kcalPer100g: 40,
    proteinPer100g: 1.1,
    carbsPer100g: 9.3,
    fatPer100g: 0.1,
    defaultUnitWeightGrams: { unit: 110, piece: 110 },
  },
  {
    keywords: ['garlic', 'ail'],
    kcalPer100g: 149,
    proteinPer100g: 6.4,
    carbsPer100g: 33,
    fatPer100g: 0.5,
    defaultUnitWeightGrams: { clove: 3, gousse: 3, tsp: 3 },
  },
  {
    keywords: ['tomato', 'tomate', 'tomates', 'canned tomatoes', 'tomates en dés'],
    kcalPer100g: 18,
    proteinPer100g: 0.9,
    carbsPer100g: 3.9,
    fatPer100g: 0.2,
    defaultUnitWeightGrams: { unit: 120, can: 400, cup: 150 },
  },
  {
    keywords: ['potato', 'pomme de terre', 'patate', 'sweet potato', 'patate douce'],
    kcalPer100g: 77,
    proteinPer100g: 2,
    carbsPer100g: 17.5,
    fatPer100g: 0.1,
    defaultUnitWeightGrams: { unit: 170, piece: 170 },
  },
];

export function parseIngredientQtyAndGrams(amountStr, unitStr = '') {
  const rawAmt = typeof amountStr === 'number' ? `${amountStr}` : (amountStr || '1').trim();
  const rawUnit = (unitStr || '').trim().toLowerCase();

  let parsedAmount = 1;
  if (rawAmt.includes('/')) {
    const parts = rawAmt.split(/\s+/);
    if (parts.length === 2 && parts[1].includes('/')) {
      const [num, den] = parts[1].split('/').map(Number);
      parsedAmount = (Number(parts[0]) || 0) + (num && den ? num / den : 0.5);
    } else {
      const [num, den] = parts[0].split('/').map(Number);
      parsedAmount = num && den ? num / den : 0.5;
    }
  } else {
    const match = rawAmt.match(/[\d.]+/);
    parsedAmount = match ? parseFloat(match[0]) : 1;
    if (isNaN(parsedAmount) || parsedAmount <= 0) parsedAmount = 1;
  }

  let unit = rawUnit;
  if (!unit) {
    const unitMatch = rawAmt.match(/[a-zA-Z]+/g);
    unit = unitMatch ? unitMatch.join(' ').toLowerCase() : 'unit';
  }

  let estimatedWeightGrams = 100;
  if (unit.includes('kg')) estimatedWeightGrams = parsedAmount * 1000;
  else if (unit === 'g' || unit === 'gram' || unit === 'grams') estimatedWeightGrams = parsedAmount;
  else if (unit.includes('lb')) estimatedWeightGrams = parsedAmount * 454;
  else if (unit.includes('oz')) estimatedWeightGrams = parsedAmount * 28.35;
  else if (unit.includes('tbsp') || unit.includes('c. à soupe')) estimatedWeightGrams = parsedAmount * 15;
  else if (unit.includes('tsp') || unit.includes('c. à thé')) estimatedWeightGrams = parsedAmount * 5;
  else if (unit.includes('cup') || unit.includes('tasse')) estimatedWeightGrams = parsedAmount * 220;
  else if (unit.includes('ml')) estimatedWeightGrams = parsedAmount;
  else if (unit.includes('l')) estimatedWeightGrams = parsedAmount * 1000;
  else estimatedWeightGrams = parsedAmount * 100;

  return { parsedAmount, parsedUnit: unit, estimatedWeightGrams };
}

export function estimateIngredientNutrition(name, amount = 1, unit = 'g') {
  const cleanName = (name || '').toLowerCase().trim();
  const { parsedAmount, parsedUnit, estimatedWeightGrams } = parseIngredientQtyAndGrams(amount, unit);

  let matchedRef = null;
  for (const item of INGREDIENT_NUTRITION_DATABASE) {
    if (item.keywords.some((kw) => cleanName.includes(kw.toLowerCase()))) {
      matchedRef = item;
      break;
    }
  }

  if (!matchedRef) {
    const factor = estimatedWeightGrams / 100;
    return {
      name: name.trim(),
      amount: parsedAmount,
      unit: parsedUnit,
      estimatedKcal: Math.max(5, Math.round(120 * factor)),
      proteinGrams: Math.round(5 * factor * 10) / 10,
      carbsGrams: Math.round(15 * factor * 10) / 10,
      fatGrams: Math.round(4 * factor * 10) / 10,
    };
  }

  let actualWeightGrams = estimatedWeightGrams;
  if (matchedRef.defaultUnitWeightGrams) {
    const normalizedUnit = parsedUnit.replace(/[^a-z]/g, '');
    for (const [unitKey, weight] of Object.entries(matchedRef.defaultUnitWeightGrams)) {
      if (normalizedUnit.includes(unitKey) || cleanName.includes(unitKey)) {
        actualWeightGrams = parsedAmount * weight;
        break;
      }
    }
  }

  const factor = actualWeightGrams / 100;
  return {
    name: name.trim(),
    amount: parsedAmount,
    unit: parsedUnit,
    estimatedKcal: Math.max(5, Math.round(matchedRef.kcalPer100g * factor)),
    proteinGrams: Math.round(matchedRef.proteinPer100g * factor * 10) / 10,
    carbsGrams: Math.round(matchedRef.carbsPer100g * factor * 10) / 10,
    fatGrams: Math.round(matchedRef.fatPer100g * factor * 10) / 10,
  };
}

export function estimateRecipeNutrition(title, rawIngredients, servingsCount = 4) {
  const servings = Math.max(1, parseInt(servingsCount, 10) || 4);
  const ingredientNutritions = (rawIngredients || []).map((ing) =>
    estimateIngredientNutrition(ing.name, ing.amount || 1, ing.unit || 'g')
  );

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const ing of ingredientNutritions) {
    totalCalories += ing.estimatedKcal || 0;
    totalProtein += ing.proteinGrams || 0;
    totalCarbs += ing.carbsGrams || 0;
    totalFat += ing.fatGrams || 0;
  }

  if (totalCalories <= 0) {
    totalCalories = 440 * servings;
    totalProtein = 28 * servings;
    totalCarbs = 42 * servings;
    totalFat = 15 * servings;
  }

  const caloriesPerServing = Math.max(20, Math.round(totalCalories / servings));
  return {
    title,
    servings,
    caloriesPerServing,
    totalCalories,
    macrosPerServing: {
      proteinGrams: Math.max(1, Math.round(totalProtein / servings)),
      carbsGrams: Math.max(1, Math.round(totalCarbs / servings)),
      fatGrams: Math.max(1, Math.round(totalFat / servings)),
    },
    totalMacros: {
      proteinGrams: Math.round(totalProtein),
      carbsGrams: Math.round(totalCarbs),
      fatGrams: Math.round(totalFat),
    },
    ingredients: ingredientNutritions,
    calculationMethod: 'AI_ESTIMATED',
  };
}
