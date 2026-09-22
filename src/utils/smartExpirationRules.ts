/**
 * Smart Expiration & Food Shelf-Life Standards
 * Grounded in Canadian (CFIA / MAPAQ) and European (EFSA) food safety standards.
 * Provides scientifically supported shelf-life estimates by food category, cut, and storage location.
 */

export interface FoodShelfLifeRule {
  categoryId: string;
  categoryNames: string[]; // keywords in EN and FR
  itemKeywords: string[];   // specific food keywords to match
  fridgeDays: number;
  pantryDays: number;
  freezerMonths: number;
  cfiaStandardFr: string;
  cfiaStandardEn: string;
  efsaStandardFr: string;
  efsaStandardEn: string;
  foodSafetyAgency: 'CFIA/MAPAQ & EFSA' | 'CFIA/MAPAQ' | 'EFSA';
  storageRecommendationEn: string;
  storageRecommendationFr: string;
}

export const SMART_SHELF_LIFE_RULES: FoodShelfLifeRule[] = [
  // 1. Fresh Poultry (Chicken, Turkey, Duck)
  {
    categoryId: 'poultry_fresh',
    categoryNames: ['Meat & Seafood', 'Poultry', 'Viande', 'Volaille'],
    itemKeywords: ['chicken', 'poulet', 'turkey', 'dinde', 'duck', 'canard', 'wings', 'ailes', 'thigh', 'cuisse', 'breast', 'poitrine'],
    fridgeDays: 2, // CFIA: 1-2 days
    pantryDays: 0,
    freezerMonths: 9, // CFIA pieces: 9 months, whole: 12 months
    cfiaStandardFr: 'ACIA/MAPAQ : Volaille fraîche au réfrigérateur max 1 à 2 jours (≤ 4°C). Au congélateur max 9 mois.',
    cfiaStandardEn: 'CFIA/MAPAQ: Fresh raw poultry max 1-2 days in fridge (≤ 4°C). Up to 9 months frozen.',
    efsaStandardFr: 'EFSA : Risque élevé de Campylobacter & Salmonella. Cuire à cœur (74°C / 165°F).',
    efsaStandardEn: 'EFSA: High risk of Campylobacter & Salmonella. Cook thoroughly to 74°C (165°F).',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Store on the bottom shelf in a sealed container to prevent cross-contamination.',
    storageRecommendationFr: 'Conserver sur l\'étagère du bas dans un plat étanche pour éviter toute contamination croisée.',
  },

  // 2. Ground Meat (Beef, Pork, Poultry)
  {
    categoryId: 'ground_meat',
    categoryNames: ['Meat & Seafood', 'Viande', 'Bœuf', 'Beef'],
    itemKeywords: ['ground', 'haché', 'mince', 'minced', 'sausage', 'saucisse', 'burgers', 'steaks hachés'],
    fridgeDays: 2, // CFIA: 1-2 days
    pantryDays: 0,
    freezerMonths: 4, // CFIA: 3-4 months
    cfiaStandardFr: 'ACIA/MAPAQ : Viande hachée crue max 1 à 2 jours au réfrigérateur. 3 à 4 mois au congélateur.',
    cfiaStandardEn: 'CFIA/MAPAQ: Raw ground meat max 1-2 days refrigerated. 3-4 months frozen.',
    efsaStandardFr: 'EFSA : Surface de contact élevée. Consommer très rapidement ou congeler immédiatement.',
    efsaStandardEn: 'EFSA: High surface exposure. Consume quickly or freeze immediately.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Freeze immediately if not cooking within 48 hours.',
    storageRecommendationFr: 'Congeler immédiatement si non cuisiné dans les 48 heures.',
  },

  // 3. Fresh Red Meat (Steaks, Chops, Roasts)
  {
    categoryId: 'fresh_red_meat',
    categoryNames: ['Meat & Seafood', 'Viande', 'Beef', 'Pork', 'Lamb', 'Bœuf', 'Porc', 'Agneau'],
    itemKeywords: ['steak', 'bœuf', 'beef', 'pork', 'porc', 'lamb', 'agneau', 'chop', 'côtelette', 'roast', 'rôti', 'veal', 'veau'],
    fridgeDays: 3, // CFIA: 3-5 days (conservative: 3)
    pantryDays: 0,
    freezerMonths: 10, // CFIA: 8-12 months
    cfiaStandardFr: 'ACIA/MAPAQ : Bœuf, porc et agneau en pièces entières : 3 à 4 jours au frigo (≤ 4°C). 8 à 12 mois au congélateur.',
    cfiaStandardEn: 'CFIA/MAPAQ: Steaks, chops, and roasts: 3-4 days in fridge (≤ 4°C). 8-12 months frozen.',
    efsaStandardFr: 'EFSA : Maintenir la chaîne du froid stricte à ≤ 4°C.',
    efsaStandardEn: 'EFSA: Strict cold chain maintenance at ≤ 4°C.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Keep wrapped in original butcher wrap or vacuum bag.',
    storageRecommendationFr: 'Garder emballé hermétiquement dans le tiroir à viande le plus froid.',
  },

  // 4. Fresh Fish & Seafood
  {
    categoryId: 'fresh_fish',
    categoryNames: ['Meat & Seafood', 'Fish', 'Seafood', 'Poisson', 'Fruits de mer'],
    itemKeywords: ['fish', 'poisson', 'salmon', 'saumon', 'tuna', 'thon', 'trout', 'truite', 'cod', 'morue', 'shrimp', 'crevette', 'scallop', 'pétoncle', 'mussel', 'moule'],
    fridgeDays: 2, // CFIA: 1-2 days
    pantryDays: 0,
    freezerMonths: 6, // Lean fish 6m, fatty fish 2-3m
    cfiaStandardFr: 'ACIA/MAPAQ : Poissons et fruits de mer frais : max 1 à 2 jours au frigo. 2 à 6 mois au congélateur.',
    cfiaStandardEn: 'CFIA/MAPAQ: Fresh fish and shellfish: max 1-2 days in fridge. 2-6 months frozen.',
    efsaStandardFr: 'EFSA : Conserver sur lit de glace ou dans la zone la plus froide (0-2°C).',
    efsaStandardEn: 'EFSA: Store in coldest compartment (0-2°C).',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Cook within 24-48 hours of purchase or freeze promptly.',
    storageRecommendationFr: 'Cuisiner dans les 24-48h suivant l\'achat ou congeler sans tarder.',
  },

  // 5. Fresh Milk & Cream
  {
    categoryId: 'milk_dairy',
    categoryNames: ['Dairy & Eggs', 'Produits laitiers'],
    itemKeywords: ['milk', 'lait', 'cream', 'crème', 'half and half', 'crème 15%', 'crème 35%'],
    fridgeDays: 7, // CFIA: 7-10 days after opening
    pantryDays: 0,
    freezerMonths: 3,
    cfiaStandardFr: 'ACIA/MAPAQ : Lait pasteurisé ouvert : 7 à 10 jours au réfrigérateur. Ne pas stocker dans la porte.',
    cfiaStandardEn: 'CFIA/MAPAQ: Opened pasteurized milk: 7-10 days refrigerated. Avoid refrigerator door.',
    efsaStandardFr: 'EFSA : Maintenir à ≤ 4°C pour stopper la prolifération bactérienne.',
    efsaStandardEn: 'EFSA: Maintain at ≤ 4°C to prevent bacterial growth.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Store on middle/lower shelf where temperature is steady, not in the door rack.',
    storageRecommendationFr: 'Placer sur une étagère centrale plutôt que dans la contre-porte où la température varie.',
  },

  // 6. Yogurt & Soft Cheeses
  {
    categoryId: 'yogurt_cheese_soft',
    categoryNames: ['Dairy & Eggs', 'Produits laitiers', 'Fromage'],
    itemKeywords: ['yogurt', 'yogourt', 'yaourt', 'ricotta', 'cottage', 'brie', 'camembert', 'mozzarella', 'goat cheese', 'chèvre'],
    fridgeDays: 14,
    pantryDays: 0,
    freezerMonths: 2,
    cfiaStandardFr: 'ACIA/MAPAQ : Yogourt et fromages frais : 1 à 3 semaines après ouverture au réfrigérateur.',
    cfiaStandardEn: 'CFIA/MAPAQ: Yogurt and soft cheeses: 1-3 weeks refrigerated after opening.',
    efsaStandardFr: 'EFSA : Jeter les fromages à pâte molle dès l\'apparition de moisissures non désirées.',
    efsaStandardEn: 'EFSA: Discard soft cheeses if unexpected mold appears.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Keep containers tightly sealed; use a clean spoon every time.',
    storageRecommendationFr: 'Refermer hermétiquement après chaque utilisation avec une cuillère propre.',
  },

  // 7. Hard Cheeses (Cheddar, Parmesan, Swiss)
  {
    categoryId: 'hard_cheese',
    categoryNames: ['Dairy & Eggs', 'Produits laitiers', 'Fromage'],
    itemKeywords: ['cheddar', 'parmesan', 'swiss', 'gruyère', 'gouda', 'manchego', 'fromage fort'],
    fridgeDays: 45,
    pantryDays: 0,
    freezerMonths: 6,
    cfiaStandardFr: 'ACIA/MAPAQ : Fromages à pâte ferme : 4 à 8 semaines au frigo. Moins d\'humidité = meilleure conservation.',
    cfiaStandardEn: 'CFIA/MAPAQ: Firm/hard cheeses: 4-8 weeks refrigerated. Low moisture permits longer safe shelf life.',
    efsaStandardFr: 'EFSA : En cas de petite moisissure superficielle sur fromage dur, découper à 2 cm autour.',
    efsaStandardEn: 'EFSA: For surface mold on hard cheese, cut off 2cm around and below the spot.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Wrap in parchment/wax paper then loose plastic wrap to breathe without drying out.',
    storageRecommendationFr: 'Emballer dans du papier ciré/parchemin puis dans un sac hermétique.',
  },

  // 8. Fresh Eggs
  {
    categoryId: 'eggs',
    categoryNames: ['Dairy & Eggs', 'Œufs'],
    itemKeywords: ['egg', 'eggs', 'œuf', 'oeuf', 'œufs', 'oeufs'],
    fridgeDays: 35, // CFIA: 3-5 weeks from pack date
    pantryDays: 0, // In Canada eggs must be refrigerated
    freezerMonths: 0, // Don't freeze whole eggs in shell
    cfiaStandardFr: 'ACIA/MAPAQ : Conserver au réfrigérateur dans leur boîte d\'origine pendant 3 à 5 semaines.',
    cfiaStandardEn: 'CFIA/MAPAQ: Keep in carton on refrigerator shelf for 3-5 weeks from purchase.',
    efsaStandardFr: 'EFSA : Température constante recommandée (≤ 4°C au Canada; chaîne du froid constante).',
    efsaStandardEn: 'EFSA: Constant temperature recommended (≤ 4°C in North America).',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Leave in original carton to protect from odors and temperature swings.',
    storageRecommendationFr: 'Laisser dans la boîte en carton d\'origine pour protéger des odeurs et variations.',
  },

  // 9. Leafy Greens & Berries (Delicate produce)
  {
    categoryId: 'delicate_produce',
    categoryNames: ['Produce', 'Fruits & Vegetables', 'Fruits', 'Légumes'],
    itemKeywords: ['spinach', 'épinard', 'lettuce', 'laitue', 'salad', 'salade', 'arugula', 'roquette', 'berry', 'berries', 'strawberry', 'fraise', 'raspberry', 'framboise', 'blueberry', 'bleuet'],
    fridgeDays: 5,
    pantryDays: 1,
    freezerMonths: 8,
    cfiaStandardFr: 'ACIA/MAPAQ : Légumes feuilles et petits fruits : 3 à 6 jours au frigo. Laver uniquement avant consommation.',
    cfiaStandardEn: 'CFIA/MAPAQ: Leafy greens and berries: 3-6 days in crisper. Wash only right before eating.',
    efsaStandardFr: 'EFSA : L\'excès d\'humidité favorise les moisissures (Botrytis). Absorber l\'eau avec du papier essuie-tout.',
    efsaStandardEn: 'EFSA: Excess moisture accelerates mold growth. Add a dry paper towel to the container.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Line container with a paper towel and avoid washing until ready to eat.',
    storageRecommendationFr: 'Glisser un essuie-tout dans le bac à légumes et ne laver qu\'au moment de servir.',
  },

  // 10. Hearty Vegetables (Carrots, Potatoes, Onions, Cabbage)
  {
    categoryId: 'hearty_produce',
    categoryNames: ['Produce', 'Fruits & Vegetables', 'Fruits', 'Légumes'],
    itemKeywords: ['carrot', 'carotte', 'potato', 'pomme de terre', 'onion', 'oignon', 'garlic', 'ail', 'cabbage', 'chou', 'beet', 'betterave', 'squash', 'courge'],
    fridgeDays: 21,
    pantryDays: 14,
    freezerMonths: 12,
    cfiaStandardFr: 'ACIA/MAPAQ : Légumes racines et courges : 2 à 4 semaines au frais et à l\'obscurité.',
    cfiaStandardEn: 'CFIA/MAPAQ: Root vegetables and squash: 2-4 weeks in cool, dark, well-ventilated space.',
    efsaStandardFr: 'EFSA : Conserver pommes de terre et oignons séparément pour éviter le mûrissement précoce.',
    efsaStandardEn: 'EFSA: Store potatoes and onions separately to prevent premature sprouting.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Store potatoes, onions, and garlic in a cool, dark, dry pantry away from light.',
    storageRecommendationFr: 'Garder les pommes de terre et oignons dans un endroit frais, sec et sombre.',
  },

  // 11. Cooked Leftovers (Prepared meals)
  {
    categoryId: 'cooked_leftovers',
    categoryNames: ['Leftovers', 'Cooked', 'Restes'],
    itemKeywords: ['leftover', 'reste', 'cooked', 'cuit', 'meal', 'repas', 'stew', 'soup', 'soupe', 'casserole', 'pasta sauce'],
    fridgeDays: 3, // CFIA 3-4 days max
    pantryDays: 0,
    freezerMonths: 3,
    cfiaStandardFr: 'ACIA/MAPAQ : Restes de repas cuisinés : max 3 à 4 jours au frigo (≤ 4°C). Réfrigérer dans les 2 heures suivant la cuisson.',
    cfiaStandardEn: 'CFIA/MAPAQ: Cooked leftovers: max 3-4 days in fridge (≤ 4°C). Refrigerate within 2 hours of cooking.',
    efsaStandardFr: 'EFSA : Règle des 2 heures. Réchauffer à au moins 74°C (165°F) avant de consommer.',
    efsaStandardEn: 'EFSA: 2-hour cooling rule. Reheat thoroughly to 74°C (165°F) before eating.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Cool down quickly in shallow containers and consume within 3-4 days.',
    storageRecommendationFr: 'Diviser en contenants peu profonds pour refroidir vite et consommer sous 3-4 jours.',
  },

  // 12. Bread & Bakery
  {
    categoryId: 'bread_bakery',
    categoryNames: ['Bakery', 'Boulangerie', 'Pain'],
    itemKeywords: ['bread', 'pain', 'bagel', 'croissant', 'tortilla', 'pita', 'buns', 'brioche', 'sourdough', 'levain'],
    fridgeDays: 7, // Dries out bread but slows mold
    pantryDays: 5,
    freezerMonths: 3,
    cfiaStandardFr: 'ACIA/MAPAQ : Pain frais : 3 à 5 jours au garde-manger. Congeler en tranches jusqu\'à 3 mois.',
    cfiaStandardEn: 'CFIA/MAPAQ: Fresh bread: 3-5 days in pantry. Slice and freeze for up to 3 months.',
    efsaStandardFr: 'EFSA : Éviter le réfrigérateur qui rétrograde l\'amidon et assèche la mie plus vite.',
    efsaStandardEn: 'EFSA: Avoid the fridge as starch retrogrades faster, drying out the crumb.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'Keep in breadbox or slice and freeze for easy toasting on demand.',
    storageRecommendationFr: 'Garder dans une huche à pain ou trancher et congeler pour griller au besoin.',
  },

  // 13. Dry Goods & Canned Staples (Pantry)
  {
    categoryId: 'pantry_staples',
    categoryNames: ['Pantry', 'Garde-manger', 'Canned Goods', 'Conserves'],
    itemKeywords: ['canned', 'can', 'conserve', 'pasta', 'pâtes', 'rice', 'riz', 'beans', 'haricots', 'flour', 'farine', 'oil', 'huile', 'sugar', 'sucre'],
    fridgeDays: 180,
    pantryDays: 365,
    freezerMonths: 12,
    cfiaStandardFr: 'ACIA/MAPAQ : Produits secs et conserves non ouvertes : 1 à 2 ans dans un endroit frais et sec.',
    cfiaStandardEn: 'CFIA/MAPAQ: Unopened dry goods and canned food: 1-2 years in a cool, dry pantry.',
    efsaStandardFr: 'EFSA : Une fois une boîte de conserve ouverte, transférer impérativement les restes dans un récipient en verre ou plastique.',
    efsaStandardEn: 'EFSA: Once opened, never store food in the original tin can—transfer to glass or plastic container.',
    foodSafetyAgency: 'CFIA/MAPAQ & EFSA',
    storageRecommendationEn: 'After opening cans, transfer contents to glass or airtight plastic container.',
    storageRecommendationFr: 'Après ouverture, toujours transvaser les conserves dans un contenant hermétique.',
  }
];

/**
 * Detect smart shelf-life recommendation based on item name, category, and storage location.
 */
export function estimateSmartShelfLife(
  itemName: string,
  categoryName: string,
  locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY'
): {
  days: number;
  monthsFrozen: number;
  suggestedDate: string;
  matchedRule: FoodShelfLifeRule;
} {
  const normName = itemName.toLowerCase().trim();
  const normCat = categoryName.toLowerCase().trim();

  // 1. Try finding a specific item keyword match
  let matched = SMART_SHELF_LIFE_RULES.find((rule) =>
    rule.itemKeywords.some((kw) => normName.includes(kw.toLowerCase()))
  );

  // 2. Fallback to category match
  if (!matched) {
    matched = SMART_SHELF_LIFE_RULES.find((rule) =>
      rule.categoryNames.some((cat) => normCat.includes(cat.toLowerCase()))
    );
  }

  // 3. Fallback to general default
  if (!matched) {
    matched = locationType === 'PANTRY' 
      ? SMART_SHELF_LIFE_RULES.find((r) => r.categoryId === 'pantry_staples')! 
      : SMART_SHELF_LIFE_RULES.find((r) => r.categoryId === 'cooked_leftovers')!;
  }

  let days = matched.fridgeDays;
  if (locationType === 'FREEZER') {
    days = matched.freezerMonths * 30;
  } else if (locationType === 'PANTRY') {
    days = matched.pantryDays || matched.fridgeDays;
  }

  const targetDate = new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000);
  const suggestedDate = targetDate.toISOString().split('T')[0];

  return {
    days: Math.max(1, days),
    monthsFrozen: matched.freezerMonths,
    suggestedDate,
    matchedRule: matched,
  };
}
