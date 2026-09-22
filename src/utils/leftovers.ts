/**
 * Leftover Food Safety & Smart Expiration Engine
 * Based on Canadian Standards (Health Canada, CFIA, MAPAQ) & European Standards (EFSA, ANSES)
 *
 * Canadian & European Guidelines:
 * - Refrigerator temperature maintained strictly at ≤ 4°C (40°F)
 * - Danger Zone: 4°C to 60°C (40°F to 140°F) - chill within 2 hours of cooking
 * - Reheat thoroughly to at least 74°C (165°F) internal temperature, or bring soups to a rolling boil
 * - Cooked rice & pasta: 3 days max (EFSA/Santé Canada warning on Bacillus cereus spore germination)
 * - Cooked seafood & fish: 2 days max (Strict European ANSES/EFSA limit)
 * - Cooked poultry & meats: 3 to 4 days max in refrigerator
 * - Freezer (≤ -18°C / 0°F): 2 to 4 months for prepared meals
 */

export interface LeftoverCategory {
  id: string;
  nameEn: string;
  nameFr: string;
  fridgeDays: number;
  freezerMonths: number;
  reheatTemp: string;
  iconName: string;
  canadianRuleEn: string;
  canadianRuleFr: string;
  europeanRuleEn: string;
  europeanRuleFr: string;
  tipEn: string;
  tipFr: string;
  keywords: string[];
}

export const LEFTOVER_CATEGORIES: LeftoverCategory[] = [
  {
    id: 'red_meat',
    nameEn: 'Cooked Pork & Red Meat (Lechon, Roasts, Stews)',
    nameFr: 'Porc & Viande rouge cuits (Lechon, Rôtis, Mijotés)',
    fridgeDays: 4,
    freezerMonths: 3,
    reheatTemp: '74°C (165°F)',
    iconName: 'Beef',
    canadianRuleEn: 'Health Canada / MAPAQ: Safe for 3-4 days in fridge (≤ 4°C). Reheat to 74°C (165°F).',
    canadianRuleFr: 'Santé Canada / MAPAQ : 3 à 4 jours max au frigo (≤ 4°C). Réchauffer à 74°C à cœur.',
    europeanRuleEn: 'EFSA / ANSES: Store sealed at ≤ 4°C. Consume within 72-96h; freeze up to 3 months.',
    europeanRuleFr: 'EFSA / ANSES : Conserver fermé à ≤ 4°C. Consommer sous 72-96h; congeler 3 mois max.',
    tipEn: 'Canadian & EU standard: Store in shallow airtight container within 2 hours. Reheat piping hot.',
    tipFr: 'Normes Canada & UE : Placer en boîte hermétique sous 2h max. Réchauffer fumant à 74°C.',
    keywords: [
      'lechon', 'lechón', 'pork', 'porc', 'beef', 'bœuf', 'boeuf', 'steak', 'lamb', 'agneau',
      'meatball', 'boulette', 'meatloaf', 'ham', 'jambon', 'bacon', 'roast', 'rôti', 'veal',
      'veau', 'lumpia', 'sisig', 'carnitas', 'ribs', 'côtes'
    ],
  },
  {
    id: 'rice_grains',
    nameEn: 'Cooked Rice & Grains (Jasmine, Fried Rice, Quinoa)',
    nameFr: 'Riz cuit & Féculents (Jasmin, Riz frit, Quinoa)',
    fridgeDays: 3,
    freezerMonths: 2,
    reheatTemp: '74°C (165°F)',
    iconName: 'Wheat',
    canadianRuleEn: 'Health Canada / CFIA: Cool within 2h to prevent Bacillus cereus toxin. Safe 3 days max.',
    canadianRuleFr: 'Santé Canada / ACIA : Refroidir sous 2h pour éviter la toxine Bacillus cereus. 3 jours max.',
    europeanRuleEn: 'EFSA / FSA: High biological risk. Keep at ≤ 4°C and consume within 48 to 72 hours.',
    europeanRuleFr: 'EFSA / ANSES : Risque bactérien accru. Conserver à ≤ 4°C et consommer sous 48 à 72 heures.',
    tipEn: 'Crucial: Never leave cooked rice at room temp. Health Canada & EFSA recommend eating within 3 days.',
    tipFr: 'Essentiel : Ne jamais laisser le riz à température ambiante. Consommer sous 3 jours max.',
    keywords: [
      'rice', 'riz', 'jasmin', 'jasmine', 'sinangag', 'basmati', 'grain', 'quinoa', 'couscous',
      'barley', 'orge', 'risotto', 'fried rice', 'riz frit', 'paella', 'bulgur', 'polenta'
    ],
  },
  {
    id: 'pasta_noodles',
    nameEn: 'Cooked Noodles & Pasta (Pancit, Lasagna, Spaghetti)',
    nameFr: 'Nouilles & Pâtes cuites (Pancit, Lasagne, Spaghetti)',
    fridgeDays: 4,
    freezerMonths: 2,
    reheatTemp: '74°C (165°F)',
    iconName: 'Utensils',
    canadianRuleEn: 'Health Canada: Keep refrigerated (≤ 4°C) for 3-4 days. Freeze in airtight container up to 2 months.',
    canadianRuleFr: 'Santé Canada : Conserver au frais (≤ 4°C) 3-4 jours. Congeler jusqu’à 2 mois.',
    europeanRuleEn: 'EFSA: Consume within 3-4 days when stored below 4°C.',
    europeanRuleFr: 'EFSA / ANSES : À consommer dans les 3 à 4 jours max conservé à moins de 4°C.',
    tipEn: 'Pancit, lasagna, and pasta dishes keep well for 3-4 days. Reheat until steaming hot.',
    tipFr: 'Le pancit, lasagnes et pâtes se gardent 3-4 jours. Réchauffer jusqu’à ce que la vapeur s’échappe.',
    keywords: [
      'pancit', 'bihon', 'canton', 'pasta', 'pâtes', 'pates', 'spaghetti', 'lasagna', 'lasagne',
      'macaroni', 'noodle', 'nouille', 'penne', 'fettuccine', 'ramen', 'carbonara', 'bolognese', 'pad thai'
    ],
  },
  {
    id: 'poultry',
    nameEn: 'Cooked Poultry (Chicken Adobo, Roast Turkey)',
    nameFr: 'Volaille cuite (Poulet Adobo, Rôti de dinde)',
    fridgeDays: 3,
    freezerMonths: 4,
    reheatTemp: '74°C (165°F)',
    iconName: 'Drumstick',
    canadianRuleEn: 'Health Canada / MAPAQ: Maximum 3 to 4 days in refrigerator (≤ 4°C). Reheat to 74°C (165°F).',
    canadianRuleFr: 'Santé Canada / MAPAQ : 3 à 4 jours max au frigo (≤ 4°C). Réchauffer à 74°C à cœur.',
    europeanRuleEn: 'EFSA / ANSES: Sensitive protein. Recommended 3 days (72h) at 4°C.',
    europeanRuleFr: 'EFSA / ANSES : Protéine sensible. Recommandé 3 jours (72h) à 4°C.',
    tipEn: 'Poultry should always be brought to 74°C (165°F) throughout when reheating.',
    tipFr: 'Toute volaille doit être réchauffée à au moins 74°C à cœur avant consommation.',
    keywords: [
      'adobo', 'chicken', 'poulet', 'turkey', 'dinde', 'poultry', 'volaille', 'wing', 'aile',
      'thigh', 'cuisse', 'breast', 'blanc de poulet', 'nugget', 'duck', 'canard', 'tinola'
    ],
  },
  {
    id: 'fish_seafood',
    nameEn: 'Cooked Fish & Seafood (Salmon, Shrimp, Calamari)',
    nameFr: 'Poissons & Fruits de mer cuits (Saumon, Crevettes)',
    fridgeDays: 2,
    freezerMonths: 2,
    reheatTemp: '74°C (165°F)',
    iconName: 'Fish',
    canadianRuleEn: 'Health Canada: Consume within 3 days. Discard if smelling overly fishy or sour.',
    canadianRuleFr: 'Santé Canada : Consommer sous 3 jours max. Jeter en cas d’odeur inhabituelle.',
    europeanRuleEn: 'EFSA / ANSES: Strict 48h (2 days) rule for cooked seafood due to histamine and bacterial risk.',
    europeanRuleFr: 'EFSA / ANSES : Règle stricte de 48h (2 jours max) en raison des risques d’histamine.',
    tipEn: 'European EFSA standard is strict: Eat within 2 days (48 hours) for optimal safety.',
    tipFr: 'Norme européenne stricte : Consommer sous 2 jours (48h) pour une sécurité absolue.',
    keywords: [
      'fish', 'poisson', 'salmon', 'saumon', 'shrimp', 'crevette', 'tuna', 'thon',
      'cod', 'morue', 'crab', 'crabe', 'lobster', 'homard', 'seafood', 'fruits de mer',
      'scallop', 'pétoncle', 'halibut', 'flétan', 'calamari', 'calmar', 'bangus', 'tilapia'
    ],
  },
  {
    id: 'soups_stews',
    nameEn: 'Soups, Broths & Stews (Sinigang, Chili, Bouillon)',
    nameFr: 'Soupes, Bouillons & Ragoûts (Sinigang, Chili, Ragoût)',
    fridgeDays: 4,
    freezerMonths: 3,
    reheatTemp: 'Rolling boil',
    iconName: 'Soup',
    canadianRuleEn: 'Health Canada / MAPAQ: 3-4 days in fridge. Bring soups and stews to a full rolling boil.',
    canadianRuleFr: 'Santé Canada / MAPAQ : 3-4 jours au frigo. Porter les soupes à ébullition complète.',
    europeanRuleEn: 'EFSA: Keep covered at ≤ 4°C for 3-4 days; freeze up to 3 months.',
    europeanRuleFr: 'EFSA : Conserver couvert à ≤ 4°C pendant 3-4 jours; congélation 3 mois.',
    tipEn: 'Reheat soups to a rolling boil before serving. Freezes exceptionally well for up to 3 months.',
    tipFr: 'Porter à vive ébullition au réchauffage. Se congèle à merveille jusqu’à 3 mois.',
    keywords: [
      'sinigang', 'nilaga', 'kare-kare', 'soup', 'soupe', 'stew', 'ragoût', 'ragout', 'chili',
      'broth', 'bouillon', 'chowder', 'potage', 'velouté', 'minestrone', 'goulash', 'bulalo'
    ],
  },
  {
    id: 'cooked_veggies',
    nameEn: 'Cooked Vegetables & Sides (Pinakbet, Roasted Veggies)',
    nameFr: 'Légumes cuits & Accompagnements (Pinakbet, Légumes rôtis)',
    fridgeDays: 4,
    freezerMonths: 6,
    reheatTemp: 'Warm thoroughly',
    iconName: 'Carrot',
    canadianRuleEn: 'Health Canada: Safe for 3-4 days at ≤ 4°C. Excellent for repurposing into stir-fries.',
    canadianRuleFr: 'Santé Canada : 3-4 jours à ≤ 4°C. Idéal à réutiliser dans un sauté.',
    europeanRuleEn: 'EFSA / ANSES: Consume within 4 days. Store in clean glass or food-grade plastic.',
    europeanRuleFr: 'EFSA / ANSES : Consommer sous 4 jours. Conserver en contenant en verre ou plastique alimentaire.',
    tipEn: 'Cooked vegetables hold up well for 3-4 days in the fridge.',
    tipFr: 'Les légumes cuits se conservent très bien 3-4 jours au réfrigérateur.',
    keywords: [
      'pinakbet', 'vegetable', 'légume', 'legume', 'veggie', 'broccoli', 'brocoli', 'carrot',
      'carotte', 'ratatouille', 'potato', 'pomme de terre', 'purée', 'spinach', 'épinard', 'chopsuey'
    ],
  },
  {
    id: 'casseroles',
    nameEn: 'Casseroles, Gratins & Pies (Tourtière, Shepherd’s Pie)',
    nameFr: 'Gratins, Tourtières & Plats au four (Pâté chinois)',
    fridgeDays: 4,
    freezerMonths: 3,
    reheatTemp: '74°C (165°F)',
    iconName: 'Layers',
    canadianRuleEn: 'Health Canada: Cooked mixed casseroles safe 3-4 days in fridge, 2-3 months frozen.',
    canadianRuleFr: 'Santé Canada : Plats combinés cuits au four sûrs 3-4 jours au frigo, 2-3 mois congelés.',
    europeanRuleEn: 'EFSA: Reheat to center temperature of 74°C. Consume within 72-96 hours.',
    europeanRuleFr: 'EFSA : Réchauffer à 74°C à cœur. Consommer sous 72 à 96 heures.',
    tipEn: 'Tourtières, shepherd’s pies and baked gratins stay delicious for 3-4 days.',
    tipFr: 'Les tourtières, pâtés chinois et gratins se conservent 3-4 jours sans perdre leur saveur.',
    keywords: [
      'casserole', 'gratin', 'pie', 'tarte', 'tourtière', 'tourtiere', 'pâté chinois', 'pate chinois',
      'shepherd', 'hachis parmentier', 'parmentier', 'bake', 'moussaka', 'crumble', 'empanada'
    ],
  },
  {
    id: 'egg_dishes',
    nameEn: 'Egg Dishes, Quiche & Frittata',
    nameFr: 'Plats aux œufs, Quiche & Frittata',
    fridgeDays: 3,
    freezerMonths: 2,
    reheatTemp: '74°C (165°F)',
    iconName: 'Egg',
    canadianRuleEn: 'Health Canada: Refrigerate egg dishes within 2 hours. Eat within 3-4 days.',
    canadianRuleFr: 'Santé Canada : Mettre au frigo sous 2h. Consommer dans les 3-4 jours.',
    europeanRuleEn: 'EFSA / ANSES: Salmonella risk: Maximum 72 hours (3 days) at ≤ 4°C.',
    europeanRuleFr: 'EFSA / ANSES : Prévention salmonelle : 72h max (3 jours) à ≤ 4°C.',
    tipEn: 'Egg-based dishes are perishable: Keep at ≤ 4°C and eat within 3 days.',
    tipFr: 'Les plats à base d’œufs sont délicats : Conserver à ≤ 4°C et consommer en 3 jours.',
    keywords: [
      'egg', 'œuf', 'oeuf', 'quiche', 'frittata', 'omelet', 'omelette',
      'scrambled', 'brouillés', 'tortilla'
    ],
  },
  {
    id: 'curries_sauces',
    nameEn: 'Curries, Gravy & Sauces',
    nameFr: 'Currys, Sauces & Jus mijotés',
    fridgeDays: 4,
    freezerMonths: 3,
    reheatTemp: 'Rolling boil',
    iconName: 'Sparkles',
    canadianRuleEn: 'Health Canada: Keep 3-4 days refrigerated. Reheat to boiling.',
    canadianRuleFr: 'Santé Canada : 3-4 jours au frigo. Réchauffer jusqu’à bouillonnement.',
    europeanRuleEn: 'EFSA: Sauces with dairy or coconut milk keep 3-4 days maximum at ≤ 4°C.',
    europeanRuleFr: 'EFSA : Les sauces au lait ou coco se conservent 3-4 jours max à ≤ 4°C.',
    tipEn: 'Curries and simmered sauces often taste even better the next day!',
    tipFr: 'Les currys et sauces mijotées sont souvent encore meilleurs le lendemain !',
    keywords: [
      'curry', 'sauce', 'gravy', 'jus', 'tikka', 'korma', 'curry sauce',
      'mole', 'pesto', 'salsa', 'bolognaise', 'caldereta', 'afritada'
    ],
  },
];

/**
 * Reusable Leftover Saved Template
 * Allows saving favorite party dishes (e.g. Filipino party: Lechon, Rice, Pancit)
 * or recurring family meals so they can be selected easily the next time.
 */
export interface SavedLeftoverTemplate {
  id: string;
  nameEn: string;
  nameFr: string;
  categoryId: string;
  defaultLocation: 'FRIDGE' | 'FREEZER';
  defaultQuantity: number;
  defaultUnit: string;
  cuisineTag?: string;
  isCustom?: boolean;
}

export const INITIAL_SAVED_LEFTOVER_TEMPLATES: SavedLeftoverTemplate[] = [
  // Filipino Party & Festive Leftovers (Direct User Example)
  {
    id: 'tmpl-lechon',
    nameEn: 'Lechon (Crispy Roast Pork)',
    nameFr: 'Lechon (Rôti de porc croustillant philippin)',
    categoryId: 'red_meat',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 3,
    defaultUnit: 'portions',
    cuisineTag: '🇵🇭 Fête Philippine / Party',
  },
  {
    id: 'tmpl-steamed-rice',
    nameEn: 'Steamed Jasmine Rice',
    nameFr: 'Riz jasmin cuit vapeur',
    categoryId: 'rice_grains',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 4,
    defaultUnit: 'portions',
    cuisineTag: '🍚 Féculent / Base',
  },
  {
    id: 'tmpl-pancit',
    nameEn: 'Pancit Canton / Bihon (Stir-fried Noodles)',
    nameFr: 'Pancit Canton / Bihon (Nouilles sautées)',
    categoryId: 'pasta_noodles',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 3,
    defaultUnit: 'portions',
    cuisineTag: '🇵🇭 Fête Philippine / Party',
  },
  {
    id: 'tmpl-lumpia',
    nameEn: 'Lumpia (Spring Rolls)',
    nameFr: 'Lumpia (Rouleaux croustillants)',
    categoryId: 'red_meat',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 6,
    defaultUnit: 'rouleaux',
    cuisineTag: '🇵🇭 Fête Philippine / Party',
  },
  {
    id: 'tmpl-adobo',
    nameEn: 'Chicken Adobo',
    nameFr: 'Poulet Adobo mijoté',
    categoryId: 'poultry',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 2,
    defaultUnit: 'portions',
    cuisineTag: '🇵🇭 Fête Philippine / Party',
  },
  {
    id: 'tmpl-sinigang',
    nameEn: 'Sinigang (Tamarind Pork/Seafood Soup)',
    nameFr: 'Sinigang (Soupe aigrelette au tamarin)',
    categoryId: 'soups_stews',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 2,
    defaultUnit: 'portions',
    cuisineTag: '🇵🇭 Fête Philippine / Party',
  },

  // Classic Household & Canadian Favorites
  {
    id: 'tmpl-roast-chicken',
    nameEn: 'Roast Chicken & Gravy',
    nameFr: 'Poulet rôti & Sauce brune',
    categoryId: 'poultry',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 3,
    defaultUnit: 'portions',
    cuisineTag: '🍗 Fait maison / Classique',
  },
  {
    id: 'tmpl-lasagna',
    nameEn: 'Homemade Baked Lasagna',
    nameFr: 'Lasagne maison au four',
    categoryId: 'pasta_noodles',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 2,
    defaultUnit: 'portions',
    cuisineTag: '🍝 Pâtes & Gratins',
  },
  {
    id: 'tmpl-tourtiere',
    nameEn: 'Tourtière / Meat Pie',
    nameFr: 'Tourtière traditionnelle / Pâté à la viande',
    categoryId: 'casseroles',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 3,
    defaultUnit: 'pointes',
    cuisineTag: '🥧 Traditionnel Canadien',
  },
  {
    id: 'tmpl-shepherds-pie',
    nameEn: 'Shepherd’s Pie (Pâté chinois)',
    nameFr: 'Pâté chinois maison',
    categoryId: 'casseroles',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 2,
    defaultUnit: 'portions',
    cuisineTag: '🥧 Fait maison / Classique',
  },
  {
    id: 'tmpl-beef-stew',
    nameEn: 'Beef Stew / Bourguignon',
    nameFr: 'Ragoût de bœuf / Bœuf bourguignon',
    categoryId: 'soups_stews',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 3,
    defaultUnit: 'portions',
    cuisineTag: '🍲 Mijoté réconfortant',
  },
  {
    id: 'tmpl-cooked-salmon',
    nameEn: 'Cooked Salmon Fillet',
    nameFr: 'Pavé de saumon cuit',
    categoryId: 'fish_seafood',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 1,
    defaultUnit: 'portion',
    cuisineTag: '🐟 Poisson (48h max UE)',
  },
  {
    id: 'tmpl-veggie-curry',
    nameEn: 'Chickpea & Vegetable Curry',
    nameFr: 'Curry de pois chiches & Légumes',
    categoryId: 'curries_sauces',
    defaultLocation: 'FRIDGE',
    defaultQuantity: 2,
    defaultUnit: 'portions',
    cuisineTag: '🍛 Végétarien',
  },
];

const SAVED_TEMPLATES_STORAGE_KEY = 'smart_kitchen_saved_leftover_templates_v2';

export function getSavedLeftoverTemplates(): SavedLeftoverTemplate[] {
  if (typeof window === 'undefined') return INITIAL_SAVED_LEFTOVER_TEMPLATES;
  try {
    const raw = localStorage.getItem(SAVED_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SAVED_TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_SAVED_LEFTOVER_TEMPLATES));
      return INITIAL_SAVED_LEFTOVER_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAVED_LEFTOVER_TEMPLATES;
  } catch (err) {
    console.warn('Failed to load saved leftover templates:', err);
    return INITIAL_SAVED_LEFTOVER_TEMPLATES;
  }
}

export function saveNewLeftoverTemplate(template: Omit<SavedLeftoverTemplate, 'id'>): SavedLeftoverTemplate {
  const current = getSavedLeftoverTemplates();
  const newTmpl: SavedLeftoverTemplate = {
    ...template,
    id: `custom-tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isCustom: true,
  };
  const updated = [newTmpl, ...current];
  try {
    localStorage.setItem(SAVED_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to persist leftover template:', e);
  }
  return newTmpl;
}

export function deleteSavedLeftoverTemplate(id: string): void {
  const current = getSavedLeftoverTemplates();
  const updated = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(SAVED_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to delete leftover template:', e);
  }
}

/**
 * Intelligent Leftover Category Detection
 * Analyzes meal title and ingredients to select the most safety-relevant food category.
 */
export function detectLeftoverCategory(dishName: string, ingredients: string[] = []): LeftoverCategory {
  const textToScan = [dishName, ...ingredients].join(' ').toLowerCase();

  const priorityOrder = [
    'fish_seafood',
    'rice_grains',
    'poultry',
    'egg_dishes',
    'red_meat',
    'soups_stews',
    'pasta_noodles',
    'curries_sauces',
    'casseroles',
    'cooked_veggies',
  ];

  for (const catId of priorityOrder) {
    const category = LEFTOVER_CATEGORIES.find((c) => c.id === catId);
    if (category) {
      for (const kw of category.keywords) {
        const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
        if (regex.test(textToScan) || textToScan.includes(kw.toLowerCase())) {
          return category;
        }
      }
    }
  }

  return LEFTOVER_CATEGORIES.find((c) => c.id === 'red_meat') || LEFTOVER_CATEGORIES[0];
}

/**
 * Smart Expiration Date Calculator
 * Computes exact ISO date and day counts according to Canadian & European standards.
 */
export function calculateSmartExpiration(
  categoryId: string,
  locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY',
  prepDateStr?: string
): {
  expirationDate: string; // YYYY-MM-DD
  expirationIso: string;
  daysRemaining: number;
  monthsFrozen: number;
  canadianRule: string;
  europeanRule: string;
  guidelineEn: string;
  guidelineFr: string;
  safeReheatTemp: string;
  standardNoticeEn: string;
  standardNoticeFr: string;
} {
  const category = LEFTOVER_CATEGORIES.find((c) => c.id === categoryId) || LEFTOVER_CATEGORIES[0];
  const baseDate = prepDateStr ? new Date(prepDateStr) : new Date();
  const validBaseDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const targetDate = new Date(validBaseDate);

  if (locationType === 'FREEZER') {
    const months = category.freezerMonths;
    targetDate.setMonth(targetDate.getMonth() + months);
    const diffTime = targetDate.getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      expirationDate: targetDate.toISOString().split('T')[0],
      expirationIso: targetDate.toISOString(),
      daysRemaining,
      monthsFrozen: months,
      canadianRule: `Santé Canada / CFIA : Congélation sûre jusqu’à ${months} mois à ≤ -18°C.`,
      europeanRule: `EFSA / ANSES : Conserver hermétiquement étiqueté pour 2 à ${months} mois.`,
      guidelineEn: `Canadian & European standards: Safe freezing at ≤ -18°C for up to ${months} months.`,
      guidelineFr: `Normes Canada & UE : Congélation sûre à ≤ -18°C jusqu’à ${months} mois.`,
      safeReheatTemp: category.reheatTemp,
      standardNoticeEn: `Based on Health Canada (CFIA) and European Food Safety Authority (EFSA) freezer guidelines.`,
      standardNoticeFr: `Conforme aux normes de Santé Canada (ACIA) et de l'Autorité européenne de sécurité des aliments (EFSA).`,
    };
  }

  // FRIDGE (≤ 4°C / 40°F)
  const days = category.fridgeDays;
  targetDate.setDate(targetDate.getDate() + days);

  const diffTime = targetDate.getTime() - new Date().getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    expirationDate: targetDate.toISOString().split('T')[0],
    expirationIso: targetDate.toISOString(),
    daysRemaining,
    monthsFrozen: 0,
    canadianRule: category.canadianRuleFr,
    europeanRule: category.europeanRuleFr,
    guidelineEn: `Canadian & EU safe window: ${days} days max in fridge at ≤ 4°C (${category.nameEn}). Reheat to ${category.reheatTemp}.`,
    guidelineFr: `Délai Santé Canada & UE : ${days} jours max au frigo à ≤ 4°C (${category.nameFr}). Réchauffer à ${category.reheatTemp}.`,
    safeReheatTemp: category.reheatTemp,
    standardNoticeEn: `Health Canada & EFSA Standards: Refrigerator kept ≤ 4°C, chill within 2 hours of serving, reheat thoroughly to 74°C (165°F).`,
    standardNoticeFr: `Normes Santé Canada (ACIA) & EFSA (UE) : Frigo maintenu à ≤ 4°C, réfrigérer sous 2h, réchauffer à cœur à 74°C.`,
  };
}

