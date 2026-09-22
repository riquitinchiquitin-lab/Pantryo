/**
 * Canadian (Health Canada / CFIA / MAPAQ) and European (EFSA)
 * Safe Internal Cooking Temperatures and Food Safety Guidelines
 */

export interface SafeCookingRule {
  category: string;
  categoryFr: string;
  minTempC: number;
  minTempF: number;
  restTimeMinutes?: number;
  restingTipEn?: string;
  restingTipFr?: string;
  standardOrg: string; // e.g., 'Health Canada / CFIA & EFSA'
  keySafetyNotesEn: string;
  keySafetyNotesFr: string;
  color: string;
}

export const SAFE_COOKING_GUIDELINES: Record<string, SafeCookingRule> = {
  poultry_whole: {
    category: 'Whole Poultry (Chicken, Turkey, Duck)',
    categoryFr: 'Volaille entière (Poulet, Dinde, Canard)',
    minTempC: 82,
    minTempF: 180,
    restTimeMinutes: 10,
    restingTipEn: 'Insert thermometer into thickest part of inner thigh avoiding bone. Rest 10-15 mins covered.',
    restingTipFr: 'Insérer le thermomètre dans la partie la plus épaisse de la cuisse sans toucher l\'os. Repos 10-15 min sous papier alu.',
    standardOrg: 'Health Canada / MAPAQ / EFSA',
    keySafetyNotesEn: 'Essential to eliminate Salmonella and Campylobacter bacteria throughout all muscle tissue.',
    keySafetyNotesFr: 'Indispensable pour détruire Salmonella et Campylobacter au cœur des chairs.',
    color: 'rose',
  },
  poultry_cuts: {
    category: 'Poultry Cuts (Breasts, Thighs, Wings) & Ground Poultry',
    categoryFr: 'Morceaux de volaille (Poitrines, Cuisses, Ailes) et Haché',
    minTempC: 74,
    minTempF: 165,
    restTimeMinutes: 5,
    restingTipEn: 'Check thickest piece at the center. Rest 3-5 minutes.',
    restingTipFr: 'Vérifier la pièce la plus épaisse au centre. Laisser reposer 3 à 5 minutes.',
    standardOrg: 'Health Canada & EFSA Standard',
    keySafetyNotesEn: 'Cook until juices run completely clear and center reaches a minimum of 74°C (165°F).',
    keySafetyNotesFr: 'Cuire jusqu\'à ce que le jus soit clair et que le centre atteigne au moins 74°C (165°F).',
    color: 'rose',
  },
  ground_meat: {
    category: 'Ground Beef, Pork, Veal & Lamb',
    categoryFr: 'Bœuf, Porc, Veau et Agneau hachés',
    minTempC: 71,
    minTempF: 160,
    restTimeMinutes: 3,
    restingTipEn: 'Ensure uniform gray/brown color throughout with zero red/pink traces for maximum safety.',
    restingTipFr: 'S\'assurer d\'une couleur uniforme sans trace rosée au cœur pour une sécurité maximale.',
    standardOrg: 'Health Canada / CFIA',
    keySafetyNotesEn: 'Grinding mixes surface bacteria into the meat core; thorough cooking to 71°C kills E. coli.',
    keySafetyNotesFr: 'Le hachage disperse les bactéries de surface au centre; une cuisson à 71°C élimine E. coli.',
    color: 'red',
  },
  beef_pork_whole: {
    category: 'Whole Beef, Pork Steaks, Roasts & Chops',
    categoryFr: 'Bœuf, Porc (Steaks, Rôtis, Côtelettes en pièces entières)',
    minTempC: 63,
    minTempF: 145,
    restTimeMinutes: 3,
    restingTipEn: 'Mandatory 3-minute rest allows heat distribution and moisture re-absorption.',
    restingTipFr: 'Le temps de repos de 3 minutes permet d\'égaliser la température et de conserver le jus.',
    standardOrg: 'CFIA & Health Canada Standards',
    keySafetyNotesEn: 'Medium-rare: 63°C (145°F). Medium: 71°C (160°F). Well-done: 77°C (170°F).',
    keySafetyNotesFr: 'Mi-saignant : 63°C (145°F). À point : 71°C (160°F). Bien cuit : 77°C (170°F).',
    color: 'amber',
  },
  fish_seafood: {
    category: 'Fish Fillets & Shellfish',
    categoryFr: 'Filets de poisson et fruits de mer',
    minTempC: 70,
    minTempF: 158,
    restTimeMinutes: 2,
    restingTipEn: 'Flesh must become opaque and flake easily with a fork. Shells of clams/mussels must open.',
    restingTipFr: 'La chair doit être opaque et s\'effilocher facilement à la fourchette. Les coquillages doivent s\'ouvrir.',
    standardOrg: 'Health Canada & EFSA Standard',
    keySafetyNotesEn: 'Destroys Vibrio and aquatic parasites. Discard any shellfish that remain closed.',
    keySafetyNotesFr: 'Détruit les parasites et bactéries Vibrio. Jeter les mollusques non ouverts après cuisson.',
    color: 'teal',
  },
  egg_dishes: {
    category: 'Egg Dishes, Quiches & Casseroles',
    categoryFr: 'Plats aux œufs, Quiches et Frittatas',
    minTempC: 74,
    minTempF: 165,
    restTimeMinutes: 5,
    restingTipEn: 'Bake until a knife inserted into the center comes out clean and eggs are completely firm.',
    restingTipFr: 'Cuire jusqu\'à ce que la lame d\'un couteau insérée au centre ressorte propre.',
    standardOrg: 'Health Canada & EFSA',
    keySafetyNotesEn: 'Yolks and whites must be completely firm in mixed casseroles to destroy Salmonella.',
    keySafetyNotesFr: 'Le jaune et le blanc doivent être bien pris dans les casseroles pour éliminer Salmonella.',
    color: 'amber',
  },
  leftovers_reheat: {
    category: 'Reheated Leftovers, Stews & Sauces',
    categoryFr: 'Restes réchauffés, Sauces et Ragoûts',
    minTempC: 74,
    minTempF: 165,
    restTimeMinutes: 2,
    restingTipEn: 'Bring soups and liquid sauces to a rolling boil. Stir solids mid-way for even heating.',
    restingTipFr: 'Porter soupes et sauces à ébullition vive. Remuer à mi-cuisson pour une chaleur homogène.',
    standardOrg: 'CFIA / MAPAQ & EFSA Standard',
    keySafetyNotesEn: 'Always reheat leftovers steaming hot to at least 74°C (165°F) throughout before serving.',
    keySafetyNotesFr: 'Toujours réchauffer les restes jusqu\'à émission de vapeur et au moins 74°C (165°F) à cœur.',
    color: 'indigo',
  },
};

/**
 * Detect matching safety rule from recipe ingredients and instructions text
 */
export function detectSafeCookingRule(recipe: {
  title?: string;
  titleFr?: string;
  ingredients?: Array<{ name: string; nameFr?: string; category?: string }>;
  tags?: string[];
  descriptionEn?: string;
  descriptionFr?: string;
}): SafeCookingRule | null {
  const combined = [
    recipe.title || '',
    recipe.titleFr || '',
    (recipe.tags || []).join(' '),
    (recipe.ingredients || []).map((i) => `${i.name} ${i.nameFr || ''} ${i.category || ''}`).join(' '),
    recipe.descriptionEn || '',
    recipe.descriptionFr || '',
  ].join(' ').toLowerCase();

  // 1. Poultry
  if (/chicken breast|ground chicken|ground turkey|poulet haché|dinde hachée|wings|thighs|cuisses de poulet|filets de poulet|poitrine de poulet/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.poultry_cuts;
  }
  if (/whole chicken|whole turkey|poulet entier|dinde entière|roast duck|canard/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.poultry_whole;
  }
  if (/chicken|poulet|turkey|dinde|poultry|volaille/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.poultry_cuts;
  }

  // 2. Ground meat (beef, pork, lamb)
  if (/ground beef|bœuf haché|boeuf haché|ground pork|porc haché|minced meat|viande hachée|meatball|boulette|bolognese|taco/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.ground_meat;
  }

  // 3. Whole cuts of beef / pork / lamb
  if (/steak|roast beef|rôti de bœuf|pork chop|côtelette de porc|tenderloin|filet mignon|ribeye|entrecôte|bavette/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.beef_pork_whole;
  }

  // 4. Fish and Seafood
  if (/salmon|saumon|trout|truite|cod|morue|halibut|flétan|shrimp|crevette|scallop|pétoncle|fish|poisson|tilapia|tuna|thon/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.fish_seafood;
  }

  // 5. Egg casseroles or quiches
  if (/quiche|frittata|omelet|omelette|egg scramble|brouillade|casserole/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.egg_dishes;
  }

  // Default general cooked food
  if (/stew|ragoût|sauce|bake|simmer|roast|cuire|four/.test(combined)) {
    return SAFE_COOKING_GUIDELINES.leftovers_reheat;
  }

  return null;
}
