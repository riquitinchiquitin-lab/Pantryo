import { Macros, NutritionCalculationMethod, RecipeIngredientNutrition, RecipeNutritionSummary, PlannedMeal, DailyNutritionGoals, MealType } from '../types';

/**
 * Standard Nutritional Database for Core Kitchen Ingredients
 * Provides realistic macronutrients per 100g (or standard baseline serving)
 * Caloric density: Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
 */
interface IngredientNutrientRef {
  keywords: string[];
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultUnitWeightGrams?: Record<string, number>;
}

export const INGREDIENT_NUTRITION_DATABASE: IngredientNutrientRef[] = [
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
  {
    keywords: ['turkey', 'dinde'],
    kcalPer100g: 189,
    proteinPer100g: 29,
    carbsPer100g: 0,
    fatPer100g: 7,
  },

  // Seafood & Fish
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
  {
    keywords: ['cod', 'morue', 'tilapia', 'white fish', 'poisson blanc'],
    kcalPer100g: 82,
    proteinPer100g: 18,
    carbsPer100g: 0,
    fatPer100g: 0.7,
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
    keywords: ['greek yogurt', 'yogourt grec', 'yaourt grec', 'yogurt'],
    kcalPer100g: 73,
    proteinPer100g: 10,
    carbsPer100g: 4,
    fatPer100g: 1.5,
    defaultUnitWeightGrams: { cup: 245, pot: 175, tbsp: 20 },
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
  {
    keywords: ['heavy cream', 'crème', 'creme', 'whipping cream', 'sour cream'],
    kcalPer100g: 345,
    proteinPer100g: 2.1,
    carbsPer100g: 2.8,
    fatPer100g: 36,
    defaultUnitWeightGrams: { tbsp: 15, cup: 240, ml: 1 },
  },

  // Grains, Rice, Pasta, Bakery
  {
    keywords: ['pasta', 'pâtes', 'spaghetti', 'penne', 'macaroni', 'noodles'],
    kcalPer100g: 371, // Dry weight
    proteinPer100g: 13,
    carbsPer100g: 75,
    fatPer100g: 1.5,
    defaultUnitWeightGrams: { g: 1, cup: 100, portion: 85 },
  },
  {
    keywords: ['rice', 'riz', 'basmati', 'jasmine rice', 'brown rice'],
    kcalPer100g: 360, // Dry weight
    proteinPer100g: 7.5,
    carbsPer100g: 79,
    fatPer100g: 0.7,
    defaultUnitWeightGrams: { g: 1, cup: 185, tasse: 185 },
  },
  {
    keywords: ['bread', 'pain', 'baguette', 'toast', 'sourdough'],
    kcalPer100g: 265,
    proteinPer100g: 9,
    carbsPer100g: 49,
    fatPer100g: 3.2,
    defaultUnitWeightGrams: { slice: 35, tranche: 35, unit: 70 },
  },
  {
    keywords: ['oats', 'flocons d\'avoine', 'avoine', 'rolled oats'],
    kcalPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    defaultUnitWeightGrams: { cup: 80, tasse: 80, tbsp: 10 },
  },
  {
    keywords: ['flour', 'farine'],
    kcalPer100g: 364,
    proteinPer100g: 10,
    carbsPer100g: 76,
    fatPer100g: 1,
    defaultUnitWeightGrams: { cup: 125, tasse: 125, tbsp: 15 },
  },

  // Legumes & Plant Proteins
  {
    keywords: ['tofu'],
    kcalPer100g: 144,
    proteinPer100g: 15.5,
    carbsPer100g: 2.8,
    fatPer100g: 8.7,
    defaultUnitWeightGrams: { block: 350, portion: 150 },
  },
  {
    keywords: ['chickpeas', 'pois chiches', 'lentils', 'lentilles', 'black beans', 'haricots noirs', 'beans', 'haricots'],
    kcalPer100g: 164, // Cooked
    proteinPer100g: 9,
    carbsPer100g: 27,
    fatPer100g: 2.6,
    defaultUnitWeightGrams: { cup: 165, can: 240, boite: 240 },
  },

  // Oils & Fats
  {
    keywords: ['olive oil', 'huile d\'olive', 'oil', 'huile', 'canola', 'vegetable oil'],
    kcalPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    defaultUnitWeightGrams: { tbsp: 14, tsp: 4.5, c_a_soupe: 14, c_a_the: 4.5, ml: 0.92 },
  },
  {
    keywords: ['avocado', 'avocat'],
    kcalPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
    defaultUnitWeightGrams: { unit: 150, piece: 150 },
  },
  {
    keywords: ['peanut butter', 'beurre d\'arachide', 'almond butter', 'nuts', 'noix', 'amandes', 'almonds'],
    kcalPer100g: 588,
    proteinPer100g: 25,
    carbsPer100g: 20,
    fatPer100g: 50,
    defaultUnitWeightGrams: { tbsp: 16, c_a_soupe: 16, cup: 140 },
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
    keywords: ['broccoli', 'brocoli', 'cauliflower', 'chou-fleur'],
    kcalPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 6.6,
    fatPer100g: 0.4,
    defaultUnitWeightGrams: { head: 400, cup: 90 },
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
    keywords: ['bell pepper', 'poivron', 'poivrons'],
    kcalPer100g: 26,
    proteinPer100g: 1,
    carbsPer100g: 6,
    fatPer100g: 0.2,
    defaultUnitWeightGrams: { unit: 120, piece: 120 },
  },
  {
    keywords: ['carrot', 'carotte', 'carottes'],
    kcalPer100g: 41,
    proteinPer100g: 0.9,
    carbsPer100g: 9.6,
    fatPer100g: 0.2,
    defaultUnitWeightGrams: { unit: 60, piece: 60 },
  },
  {
    keywords: ['potato', 'pomme de terre', 'patate', 'sweet potato', 'patate douce'],
    kcalPer100g: 77,
    proteinPer100g: 2,
    carbsPer100g: 17.5,
    fatPer100g: 0.1,
    defaultUnitWeightGrams: { unit: 170, piece: 170 },
  },

  // Fruits
  {
    keywords: ['apple', 'pomme', 'pommes'],
    kcalPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 13.8,
    fatPer100g: 0.2,
    defaultUnitWeightGrams: { unit: 180, piece: 180 },
  },
  {
    keywords: ['banana', 'banane', 'bananes'],
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    fatPer100g: 0.3,
    defaultUnitWeightGrams: { unit: 118, piece: 118 },
  },
  {
    keywords: ['berries', 'bleuets', 'fraises', 'blueberries', 'strawberries', 'framboises', 'raspberries'],
    kcalPer100g: 50,
    proteinPer100g: 0.7,
    carbsPer100g: 12,
    fatPer100g: 0.3,
    defaultUnitWeightGrams: { cup: 150, tasse: 150 },
  },

  // Condiments, Broths, Sugars
  {
    keywords: ['sugar', 'sucre', 'honey', 'miel', 'maple syrup', 'sirop d\'érable'],
    kcalPer100g: 387,
    proteinPer100g: 0,
    carbsPer100g: 100,
    fatPer100g: 0,
    defaultUnitWeightGrams: { tbsp: 15, tsp: 5, c_a_soupe: 15, c_a_the: 5, cup: 200 },
  },
  {
    keywords: ['broth', 'bouillon', 'stock', 'fond'],
    kcalPer100g: 15,
    proteinPer100g: 1.5,
    carbsPer100g: 1.2,
    fatPer100g: 0.5,
    defaultUnitWeightGrams: { cup: 240, ml: 1, l: 1000 },
  },
  {
    keywords: ['soy sauce', 'sauce soja', 'tamari'],
    kcalPer100g: 53,
    proteinPer100g: 8,
    carbsPer100g: 4.9,
    fatPer100g: 0.1,
    defaultUnitWeightGrams: { tbsp: 15, tsp: 5 },
  },
];

/**
 * Standard Daily Default Nutrition Goals
 */
export const DEFAULT_DAILY_NUTRITION_GOALS: DailyNutritionGoals = {
  calorieTarget: 2000,
  proteinGramsTarget: 130, // ~26% of energy
  carbsGramsTarget: 220,   // ~44% of energy
  fatGramsTarget: 65,      // ~29% of energy
};

/**
 * Helper: Parses numeric quantity and unit from free-form string
 * e.g. "500g", "2 tbsp", "1/2 cup", "3 fillets (600g)"
 */
export function parseIngredientQtyAndGrams(amountStr: string | number, unitStr: string = ''): {
  parsedAmount: number;
  parsedUnit: string;
  estimatedWeightGrams: number;
} {
  const rawAmt = typeof amountStr === 'number' ? `${amountStr}` : (amountStr || '1').trim();
  const rawUnit = (unitStr || '').trim().toLowerCase();

  // Handle fractions like "1/2" or "3/4" or "1 1/2"
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
    // Extract first number
    const match = rawAmt.match(/[\d.]+/);
    parsedAmount = match ? parseFloat(match[0]) : 1;
    if (isNaN(parsedAmount) || parsedAmount <= 0) parsedAmount = 1;
  }

  // Determine unit
  let unit = rawUnit;
  if (!unit) {
    const unitMatch = rawAmt.match(/[a-zA-Z]+/g);
    if (unitMatch) {
      unit = unitMatch.join(' ').toLowerCase();
    } else {
      unit = 'unit';
    }
  }

  // Estimate weight in grams
  let estimatedWeightGrams = 100; // default baseline

  if (unit.includes('kg')) {
    estimatedWeightGrams = parsedAmount * 1000;
  } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
    estimatedWeightGrams = parsedAmount;
  } else if (unit.includes('lb') || unit.includes('pound')) {
    estimatedWeightGrams = parsedAmount * 454;
  } else if (unit.includes('oz') || unit.includes('ounce')) {
    estimatedWeightGrams = parsedAmount * 28.35;
  } else if (unit.includes('tbsp') || unit.includes('c. à soupe') || unit.includes('c_a_soupe')) {
    estimatedWeightGrams = parsedAmount * 15;
  } else if (unit.includes('tsp') || unit.includes('c. à thé') || unit.includes('c_a_the')) {
    estimatedWeightGrams = parsedAmount * 5;
  } else if (unit.includes('cup') || unit.includes('tasse')) {
    estimatedWeightGrams = parsedAmount * 220; // liquid/medium density average
  } else if (unit.includes('ml')) {
    estimatedWeightGrams = parsedAmount; // approx 1g/ml
  } else if (unit.includes('l') || unit.includes('litre')) {
    estimatedWeightGrams = parsedAmount * 1000;
  } else if (unit.includes('pinch') || unit.includes('pincée')) {
    estimatedWeightGrams = 1;
  } else if (unit.includes('to_taste') || unit.includes('au goût')) {
    estimatedWeightGrams = 5;
  } else {
    // Single unit or item
    estimatedWeightGrams = parsedAmount * 100;
  }

  return {
    parsedAmount,
    parsedUnit: unit,
    estimatedWeightGrams,
  };
}

/**
 * METHOD A: Auto-estimate nutrition for a single ingredient using the reference database
 */
export function estimateIngredientNutrition(
  name: string,
  amount: string | number = 1,
  unit: string = 'g'
): RecipeIngredientNutrition {
  const cleanName = (name || '').toLowerCase().trim();
  const { parsedAmount, parsedUnit, estimatedWeightGrams } = parseIngredientQtyAndGrams(amount, unit);

  // Search reference database
  let matchedRef: IngredientNutrientRef | null = null;
  for (const item of INGREDIENT_NUTRITION_DATABASE) {
    if (item.keywords.some((kw) => cleanName.includes(kw.toLowerCase()))) {
      matchedRef = item;
      break;
    }
  }

  // Fallback generic food (approx 120 kcal / 100g, balanced macros)
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

  // Check specific unit overrides (e.g. egg = 50g, breast = 180g)
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
  const estimatedKcal = Math.max(5, Math.round(matchedRef.kcalPer100g * factor));
  const proteinGrams = Math.round(matchedRef.proteinPer100g * factor * 10) / 10;
  const carbsGrams = Math.round(matchedRef.carbsPer100g * factor * 10) / 10;
  const fatGrams = Math.round(matchedRef.fatPer100g * factor * 10) / 10;

  return {
    name: name.trim(),
    amount: parsedAmount,
    unit: parsedUnit,
    estimatedKcal,
    proteinGrams,
    carbsGrams,
    fatGrams,
  };
}

/**
 * METHOD A: AI Auto-Estimation (Primary Extraction)
 * Constructs complete structured JSON matching user specification:
 * {
 *   "title": "String",
 *   "servings": 4,
 *   "caloriesPerServing": 440,
 *   "totalCalories": 1760,
 *   "macrosPerServing": { "proteinGrams": 32, "carbsGrams": 18, "fatGrams": 24 },
 *   "ingredients": [ { "name": "Chicken breast", "amount": 500, "unit": "g", "estimatedKcal": 825 } ],
 *   "calculationMethod": "AI_ESTIMATED"
 * }
 */
export function estimateRecipeNutrition(
  title: string,
  rawIngredients: Array<{ name: string; amount?: string | number; unit?: string }>,
  servingsCount: number = 4
): RecipeNutritionSummary {
  const servings = Math.max(1, servingsCount || 4);
  const ingredientNutritions: RecipeIngredientNutrition[] = rawIngredients.map((ing) =>
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

  // Ensure minimum realistic values
  if (totalCalories <= 0) {
    totalCalories = 400 * servings;
    totalProtein = 25 * servings;
    totalCarbs = 45 * servings;
    totalFat = 14 * servings;
  }

  const caloriesPerServing = Math.max(20, Math.round(totalCalories / servings));
  const macrosPerServing: Macros = {
    proteinGrams: Math.max(1, Math.round(totalProtein / servings)),
    carbsGrams: Math.max(1, Math.round(totalCarbs / servings)),
    fatGrams: Math.max(1, Math.round(totalFat / servings)),
  };

  const totalMacros: Macros = {
    proteinGrams: Math.round(totalProtein),
    carbsGrams: Math.round(totalCarbs),
    fatGrams: Math.round(totalFat),
  };

  return {
    title,
    servings,
    caloriesPerServing,
    totalCalories,
    macrosPerServing,
    totalMacros,
    ingredients: ingredientNutritions,
    calculationMethod: 'AI_ESTIMATED',
    isManualOverride: false,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * METHOD B: Dynamic Aggregation (Ingredient & Portion Scaling)
 * Sums ingredient-level values when quantities change or portions are scaled.
 * Recalculates automatically using ingredient-level calories or per-serving macro ratios.
 */
export function recalculateDynamicNutrition(
  ingredients: Array<RecipeIngredientNutrition | { name: string; amount?: string | number; unit?: string; estimatedKcal?: number; proteinGrams?: number; carbsGrams?: number; fatGrams?: number }>,
  servingsCount: number = 4,
  currentSummary?: RecipeNutritionSummary | null
): RecipeNutritionSummary {
  const servings = Math.max(1, servingsCount || 4);

  // If ingredients already have estimatedKcal, sum them; otherwise calculate
  const ingredientNutritions: RecipeIngredientNutrition[] = ingredients.map((ing) => {
    if (typeof ing.estimatedKcal === 'number' && ing.estimatedKcal > 0) {
      return {
        name: ing.name,
        amount: ing.amount || 1,
        unit: ing.unit || 'g',
        estimatedKcal: ing.estimatedKcal,
        proteinGrams: ing.proteinGrams || 0,
        carbsGrams: ing.carbsGrams || 0,
        fatGrams: ing.fatGrams || 0,
      };
    }
    return estimateIngredientNutrition(ing.name, ing.amount || 1, ing.unit || 'g');
  });

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

  // If ingredient sum is zero but previous summary existed, scale previous total
  if (totalCalories <= 0 && currentSummary && currentSummary.caloriesPerServing > 0) {
    const prevPerServing = currentSummary.caloriesPerServing;
    totalCalories = prevPerServing * servings;
    totalProtein = (currentSummary.macrosPerServing?.proteinGrams || 20) * servings;
    totalCarbs = (currentSummary.macrosPerServing?.carbsGrams || 40) * servings;
    totalFat = (currentSummary.macrosPerServing?.fatGrams || 12) * servings;
  }

  const caloriesPerServing = Math.max(1, Math.round(totalCalories / servings));
  const macrosPerServing: Macros = {
    proteinGrams: Math.round(totalProtein / servings),
    carbsGrams: Math.round(totalCarbs / servings),
    fatGrams: Math.round(totalFat / servings),
  };

  const totalMacros: Macros = {
    proteinGrams: Math.round(totalProtein),
    carbsGrams: Math.round(totalCarbs),
    fatGrams: Math.round(totalFat),
  };

  return {
    title: currentSummary?.title,
    servings,
    caloriesPerServing,
    totalCalories,
    macrosPerServing,
    totalMacros,
    ingredients: ingredientNutritions,
    calculationMethod: 'DYNAMIC_AGGREGATED',
    isManualOverride: false,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * METHOD C: Manual Override
 * Allows users to explicitly lock and override calories & macros per serving or total.
 */
export function applyManualOverride(
  current: RecipeNutritionSummary | null | undefined,
  overrides: {
    caloriesPerServing?: number;
    totalCalories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    servings?: number;
  }
): RecipeNutritionSummary {
  const servings = Math.max(1, overrides.servings ?? current?.servings ?? 2);
  
  let caloriesPerServing = overrides.caloriesPerServing;
  let totalCalories = overrides.totalCalories;

  if (caloriesPerServing !== undefined && totalCalories === undefined) {
    totalCalories = Math.round(caloriesPerServing * servings);
  } else if (totalCalories !== undefined && caloriesPerServing === undefined) {
    caloriesPerServing = Math.round(totalCalories / servings);
  } else if (caloriesPerServing === undefined && totalCalories === undefined) {
    caloriesPerServing = current?.caloriesPerServing ?? 400;
    totalCalories = caloriesPerServing * servings;
  }

  const macrosPerServing: Macros = {
    proteinGrams: overrides.proteinGrams ?? current?.macrosPerServing?.proteinGrams ?? 25,
    carbsGrams: overrides.carbsGrams ?? current?.macrosPerServing?.carbsGrams ?? 35,
    fatGrams: overrides.fatGrams ?? current?.macrosPerServing?.fatGrams ?? 15,
  };

  const totalMacros: Macros = {
    proteinGrams: Math.round(macrosPerServing.proteinGrams * servings),
    carbsGrams: Math.round(macrosPerServing.carbsGrams * servings),
    fatGrams: Math.round(macrosPerServing.fatGrams * servings),
  };

  return {
    title: current?.title,
    servings,
    caloriesPerServing: caloriesPerServing!,
    totalCalories: totalCalories!,
    macrosPerServing,
    totalMacros,
    ingredients: current?.ingredients,
    calculationMethod: 'MANUAL_OVERRIDE',
    isManualOverride: true,
    lastCalculatedAt: new Date().toISOString(),
  };
}

/**
 * Energy Distribution Percentage Breakdown
 * 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
 */
export function calculateMacroEnergySplit(macros: Macros): {
  proteinKcal: number;
  carbsKcal: number;
  fatKcal: number;
  totalMacroKcal: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
} {
  const proteinKcal = (macros?.proteinGrams || 0) * 4;
  const carbsKcal = (macros?.carbsGrams || 0) * 4;
  const fatKcal = (macros?.fatGrams || 0) * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  if (totalMacroKcal <= 0) {
    return {
      proteinKcal: 0,
      carbsKcal: 0,
      fatKcal: 0,
      totalMacroKcal: 0,
      proteinPct: 30,
      carbsPct: 45,
      fatPct: 25,
    };
  }

  return {
    proteinKcal: Math.round(proteinKcal),
    carbsKcal: Math.round(carbsKcal),
    fatKcal: Math.round(fatKcal),
    totalMacroKcal: Math.round(totalMacroKcal),
    proteinPct: Math.round((proteinKcal / totalMacroKcal) * 100),
    carbsPct: Math.round((carbsKcal / totalMacroKcal) * 100),
    fatPct: Math.round((fatKcal / totalMacroKcal) * 100),
  };
}

/**
 * Daily Nutritional Aggregator
 * Computes daily totals, budget limits, remaining kcal, and slot badges for Meal Planner
 */
export interface DailyNutritionProgress {
  date: string;
  dailyCalorieBudget: number;
  totalPlannedCalories: number;
  remainingCalories: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  caloriePercent: number;
  status: 'OPTIMAL' | 'APPROACHING' | 'OVER_BUDGET';

  // Macros
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  proteinBudgetGrams: number;
  carbsBudgetGrams: number;
  fatBudgetGrams: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  macroSplit: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };

  // Slot Aggregates
  slots: Record<MealType, {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    mealCount: number;
  }>;
}

export function computeDailyNutritionProgress(
  plannedMeals: PlannedMeal[],
  targetDate: string,
  goals: DailyNutritionGoals = DEFAULT_DAILY_NUTRITION_GOALS
): DailyNutritionProgress {
  const dayMeals = plannedMeals.filter((m) => m.date === targetDate);

  const slots: DailyNutritionProgress['slots'] = {
    BREAKFAST: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, mealCount: 0 },
    LUNCH: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, mealCount: 0 },
    DINNER: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, mealCount: 0 },
    SNACK: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, mealCount: 0 },
  };

  let totalPlannedCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatGrams = 0;

  for (const meal of dayMeals) {
    const mealCalories = meal.calories ?? meal.caloriesPerServing ?? (meal.nutrition?.caloriesPerServing ?? 0);
    const protein = meal.macrosPerServing?.proteinGrams ?? (meal.nutrition?.macrosPerServing?.proteinGrams ?? 0);
    const carbs = meal.macrosPerServing?.carbsGrams ?? (meal.nutrition?.macrosPerServing?.carbsGrams ?? 0);
    const fat = meal.macrosPerServing?.fatGrams ?? (meal.nutrition?.macrosPerServing?.fatGrams ?? 0);

    totalPlannedCalories += mealCalories;
    totalProteinGrams += protein;
    totalCarbsGrams += carbs;
    totalFatGrams += fat;

    const slotType = meal.mealType || 'DINNER';
    if (slots[slotType]) {
      slots[slotType].calories += mealCalories;
      slots[slotType].proteinGrams += protein;
      slots[slotType].carbsGrams += carbs;
      slots[slotType].fatGrams += fat;
      slots[slotType].mealCount += 1;
    }
  }

  const calorieBudget = goals.calorieTarget || 2000;
  const remainingCalories = calorieBudget - totalPlannedCalories;
  const isOverBudget = remainingCalories < 0;
  const overBudgetAmount = isOverBudget ? Math.abs(remainingCalories) : 0;
  const caloriePercent = Math.min(100, Math.round((totalPlannedCalories / calorieBudget) * 100));

  let status: DailyNutritionProgress['status'] = 'OPTIMAL';
  if (isOverBudget) {
    status = 'OVER_BUDGET';
  } else if (caloriePercent >= 88) {
    status = 'APPROACHING';
  }

  const proteinBudget = goals.proteinGramsTarget || 130;
  const carbsBudget = goals.carbsGramsTarget || 220;
  const fatBudget = goals.fatGramsTarget || 65;

  const proteinPercent = Math.min(100, Math.round((totalProteinGrams / proteinBudget) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbsGrams / carbsBudget) * 100));
  const fatPercent = Math.min(100, Math.round((totalFatGrams / fatBudget) * 100));

  const macroSplit = calculateMacroEnergySplit({
    proteinGrams: totalProteinGrams,
    carbsGrams: totalCarbsGrams,
    fatGrams: totalFatGrams,
  });

  return {
    date: targetDate,
    dailyCalorieBudget: calorieBudget,
    totalPlannedCalories,
    remainingCalories,
    isOverBudget,
    overBudgetAmount,
    caloriePercent,
    status,
    totalProteinGrams: Math.round(totalProteinGrams),
    totalCarbsGrams: Math.round(totalCarbsGrams),
    totalFatGrams: Math.round(totalFatGrams),
    proteinBudgetGrams: proteinBudget,
    carbsBudgetGrams: carbsBudget,
    fatBudgetGrams: fatBudget,
    proteinPercent,
    carbsPercent,
    fatPercent,
    macroSplit: {
      proteinPct: macroSplit.proteinPct,
      carbsPct: macroSplit.carbsPct,
      fatPct: macroSplit.fatPct,
    },
    slots,
  };
}
