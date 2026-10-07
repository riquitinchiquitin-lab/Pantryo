/**
 * Pantryo - Client-side Bilingual Food & Grocery Translator Utility
 * Guarantees that all imports (Flyer deals, Receipts, Recipes, Barcodes, Leftovers)
 * are translated into both French and English.
 */

import {
  EN_TO_FR_DICTIONARY,
  FR_TO_EN_DICTIONARY,
  translateFoodItem,
  getBilingualNames,
  translateRecipeIngredients,
  isTextFrench,
} from '../../server/src/services/foodTranslator.js';

export {
  EN_TO_FR_DICTIONARY,
  FR_TO_EN_DICTIONARY,
  translateFoodItem,
  getBilingualNames,
  translateRecipeIngredients,
  isTextFrench,
};

/**
 * Returns the localized item display name according to the active language.
 * Guarantees that in English mode, French text is never displayed, and in French mode,
 * English text is translated to French.
 */
export function getItemDisplayName(
  item: { name?: string | null; nameFr?: string | null; nameEn?: string | null } | null | undefined,
  lang: 'EN' | 'FR'
): string {
  if (!item) return '';
  const raw = (item.name || '').trim();
  const fr = (item.nameFr || '').trim();
  const en = (item.nameEn || '').trim();

  if (lang === 'FR') {
    // 1. If explicit French name exists and is French
    if (fr && isTextFrench(fr)) return fr;
    // 2. If raw is French
    if (raw && isTextFrench(raw)) return raw;
    // 3. If explicit French name exists
    if (fr && fr.length > 0) return fr;
    // 4. Translate English or raw to French
    if (en && en.length > 0) return translateFoodItem(en, 'FR');
    if (raw && raw.length > 0) return translateFoodItem(raw, 'FR');
    return '';
  }

  // English mode
  // 1. If explicit English name exists and is NOT French
  if (en && en.length > 0 && !isTextFrench(en)) return en;
  // 2. If raw name is NOT French
  if (raw && raw.length > 0 && !isTextFrench(raw)) return raw;
  // 3. If en exists (even if it had French words from import), translate it
  if (en && en.length > 0) {
    const tr = translateFoodItem(en, 'EN');
    if (tr && tr.length > 0) return tr;
  }
  // 4. If fr exists, translate it to English
  if (fr && fr.length > 0) {
    const tr = translateFoodItem(fr, 'EN');
    if (tr && tr.length > 0) return tr;
  }
  // 5. If raw exists, translate it to English
  if (raw && raw.length > 0) {
    const tr = translateFoodItem(raw, 'EN');
    if (tr && tr.length > 0) return tr;
  }
  return en || raw || fr || '';
}

/**
 * Universal bilingual quantity & unit formatter.
 * Handles "1 1 unité" bugs, plurals, metric volumes, and bilingual translations.
 */
export function formatLocalizedQuantityUnit(
  quantity: number | string | undefined | null,
  unit: string | undefined | null,
  lang: 'EN' | 'FR'
): string {
  const isFr = lang === 'FR';
  let qty = typeof quantity === 'number' ? quantity : parseFloat(String(quantity || 1));
  if (isNaN(qty) || qty <= 0) qty = 1;

  let rawUnit = String(unit || '').trim();

  // If unit is blank, default to "unit" / "unité"
  if (!rawUnit) {
    return isFr ? (qty > 1 ? `${qty} unités` : `${qty} unité`) : (qty > 1 ? `${qty} units` : `${qty} unit`);
  }

  // Normalize repeated numbers like "1 1", "1 1 unité", "1 1 1", etc.
  rawUnit = rawUnit.replace(/^(?:1\s+)+1$/i, '').trim();
  rawUnit = rawUnit.replace(/^(?:1\s+)+(unit[ée]?s?|units?|mcx|pcs?)$/i, '$1').trim();

  if (!rawUnit || rawUnit === '1') {
    return isFr ? (qty > 1 ? `${qty} unités` : `${qty} unité`) : (qty > 1 ? `${qty} units` : `${qty} unit`);
  }

  // Strip leading redundant number if it exactly matches qty AND remainder is a container/unit word
  // e.g. qty=1, unit="1 can" -> "can", qty=2, unit="2 cans" -> "cans"
  // BUT NOT for metric size like "341 ml", "540 mL", "750 g"
  const containerMatch = rawUnit.match(/^(\d+(?:\.\d+)?)\s*(cans?|bo[îi]tes?|conserves?|sacs?|bags?|sachets?|bouteilles?|bottles?|paquets?|packs?|pots?|jars?|bocaux|unit[ée]?s?|units?|mcx|pcs?|tranches?|slices?|portions?)$/i);
  if (containerMatch) {
    const numInUnit = parseFloat(containerMatch[1]);
    if (numInUnit === qty || numInUnit === 1) {
      rawUnit = containerMatch[2].trim();
    }
  }

  const lower = rawUnit.toLowerCase();

  // Unit / piece variations
  if (/^(?:unit[ée]?s?|mcx|pcs?|pieces?|pi[èe]ces?|morceaux?|items?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} unités` : `${qty} unité`
      : qty > 1 ? `${qty} units` : `${qty} unit`;
  }

  // Portion variations
  if (/^portions?$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} portions` : `${qty} portion`
      : qty > 1 ? `${qty} portions` : `${qty} portion`;
  }

  // Cans / Boîtes
  if (/^(?:cans?|bo[îi]tes?|conserves?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} boîtes` : `${qty} boîte`
      : qty > 1 ? `${qty} cans` : `${qty} can`;
  }

  // Bags / Sacs
  if (/^(?:bags?|sacs?|sachets?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} sacs` : `${qty} sac`
      : qty > 1 ? `${qty} bags` : `${qty} bag`;
  }

  // Bottles / Bouteilles
  if (/^(?:bottles?|bouteilles?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} bouteilles` : `${qty} bouteille`
      : qty > 1 ? `${qty} bottles` : `${qty} bottle`;
  }

  // Bunches / Bottes
  if (/^(?:bunches?|bottes?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} bottes` : `${qty} botte`
      : qty > 1 ? `${qty} bunches` : `${qty} bunch`;
  }

  // Packs / Paquets
  if (/^(?:packs?|packages?|paquets?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} paquets` : `${qty} paquet`
      : qty > 1 ? `${qty} packs` : `${qty} pack`;
  }

  // Boxes / Boîtes de carton
  if (/^(?:box(?:es)?|cartons?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} boîtes` : `${qty} boîte`
      : qty > 1 ? `${qty} boxes` : `${qty} box`;
  }

  // Jars / Bocaux / Pots / Tubs
  if (/^(?:jars?|pots?|bocaux|bocal|tubs?|barquettes?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} pots` : `${qty} pot`
      : qty > 1 ? `${qty} jars` : `${qty} jar`;
  }

  // Slices / Tranches
  if (/^(?:slices?|tranches?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} tranches` : `${qty} tranche`
      : qty > 1 ? `${qty} slices` : `${qty} slice`;
  }

  // Cups / Tasses
  if (/^(?:cups?|tasses?)$/i.test(lower)) {
    return isFr
      ? qty > 1 ? `${qty} tasses` : `${qty} tasse`
      : qty > 1 ? `${qty} cups` : `${qty} cup`;
  }

  // Tablespoons / c. à soupe
  if (/^(?:tbsp|c\.?\s*[àa]\s*soupe|cuill[èe]res?\s*[àa]\s*soupe)$/i.test(lower)) {
    return isFr ? `${qty} c. à soupe` : `${qty} tbsp`;
  }

  // Teaspoons / c. à thé
  if (/^(?:tsp|c\.?\s*[àa]\s*th[ée]|cuill[èe]res?\s*[àa]\s*th[ée])$/i.test(lower)) {
    return isFr ? `${qty} c. à thé` : `${qty} tsp`;
  }

  // If rawUnit contains numeric metric size like "398 ml", "540 mL", "1 kg", "750 g"
  if (/^\d+(?:\.\d+)?\s*(?:ml|l|g|kg|oz|lb|lbs|mg|cl)$/i.test(rawUnit)) {
    const formattedUnit = rawUnit.replace(/\bml\b/i, 'mL').replace(/\bl\b/i, 'L');
    if (qty === 1) return formattedUnit;
    return `${qty} × ${formattedUnit}`;
  }

  // Standard metric abbreviations without number (g, kg, ml, mL, l, L, oz, lb, lbs)
  if (/^(?:g|kg|ml|l|oz|lb|lbs|mg|cl)$/i.test(lower)) {
    const formattedUnit = lower === 'ml' ? 'mL' : lower === 'l' ? 'L' : lower;
    return `${qty} ${formattedUnit}`;
  }

  // General fallback
  const cleanedFallback = rawUnit.replace(/^1\s+1\s*/, '1 ').trim();
  return `${qty} ${cleanedFallback}`;
}

/**
 * Bidirectional translation for dietary and product feature badges.
 */
export function getLocalizedBadge(badge: string, lang: 'EN' | 'FR'): string {
  if (!badge) return '';
  const trimmed = badge.trim();
  const lower = trimmed.toLowerCase();

  // Keep Nutri-Score & Eco-Score as universal badges
  if (/^nutri-score/i.test(lower) || /^eco-score/i.test(lower)) {
    return trimmed;
  }

  // NOVA Group
  const novaMatch = trimmed.match(/^NOVA\s+(?:Groupe|Group)\s*(\d+)$/i);
  if (novaMatch) {
    return lang === 'FR' ? `NOVA Groupe ${novaMatch[1]}` : `NOVA Group ${novaMatch[1]}`;
  }

  const BADGE_MAP_TO_EN: Record<string, string> = {
    'marché canadien': 'Canadian Market',
    'marche canadien': 'Canadian Market',
    'biologique': 'Organic',
    'certifié biologique': 'Certified Organic',
    'certifie biologique': 'Certified Organic',
    'produits frais': 'Fresh Produce',
    'produit frais': 'Fresh Produce',
    'sans emballage': 'Packaging-Free',
    'aliment du québec': 'Food of Quebec',
    'aliment du quebec': 'Food of Quebec',
    'produit du canada': 'Product of Canada',
    'aliment préparé au québec': 'Prepared in Quebec',
    'aliment prepare au quebec': 'Prepared in Quebec',
    'sans gluten': 'Gluten-Free',
    'sans produits laitiers': 'Dairy-Free',
    'végétarien': 'Vegetarian',
    'vegetarien': 'Vegetarian',
    'végétalien': 'Vegan',
    'vegetalien': 'Vegan',
    'faible en sodium': 'Low Sodium',
    'riche en protéines': 'High Protein',
    'riche en proteines': 'High Protein',
    'sans sucre ajouté': 'No Added Sugar',
    'sans sucre ajoute': 'No Added Sugar',
    'érable pur': 'Pure Maple',
    'erable pur': 'Pure Maple',
    'format familial': 'Family Size',
    'local / québec': 'Local / Quebec',
    'local / quebec': 'Local / Quebec',
    '100% lait canadien': '100% Canadian Milk',
    'produits laitiers frais': 'Fresh Dairy',
    'produit du québec': 'Product of Quebec',
    'produit du quebec': 'Product of Quebec',
    'sans agent de conservation': 'Preservative-Free',
    'faible en gras': 'Low Fat',
  };

  const BADGE_MAP_TO_FR: Record<string, string> = {
    'canadian market': 'Marché canadien',
    'organic': 'Biologique',
    'certified organic': 'Certifié Biologique',
    'fresh produce': 'Produits frais',
    'packaging-free': 'Sans emballage',
    'no packaging': 'Sans emballage',
    'food of quebec': 'Aliment du Québec',
    'product of canada': 'Produit du Canada',
    'product of quebec': 'Produit du Québec',
    'prepared in quebec': 'Aliment préparé au Québec',
    'gluten-free': 'Sans gluten',
    'dairy-free': 'Sans produits laitiers',
    'vegetarian': 'Végétarien',
    'vegan': 'Végétalien',
    'low sodium': 'Faible en sodium',
    'high protein': 'Riche en protéines',
    'no added sugar': 'Sans sucre ajouté',
    'pure maple': 'Érable pur',
    'family size': 'Format familial',
    'local / quebec': 'Local / Québec',
    '100% canadian milk': '100% Lait canadien',
    'fresh dairy': 'Produits laitiers frais',
    'preservative-free': 'Sans agent de conservation',
    'low fat': 'Faible en gras',
  };

  if (lang === 'EN') {
    return BADGE_MAP_TO_EN[lower] || (isTextFrench(trimmed) ? translateFoodItem(trimmed, 'EN') : trimmed);
  }
  return BADGE_MAP_TO_FR[lower] || (!isTextFrench(trimmed) ? translateFoodItem(trimmed, 'FR') : trimmed);
}

/**
 * Bidirectional translation for packaging format descriptions.
 */
export function getLocalizedPackaging(format: string | undefined | null, lang: 'EN' | 'FR'): string {
  if (!format) return '';
  const trimmed = format.trim();
  const lower = trimmed.toLowerCase();

  const PACKAGING_TO_EN: Record<string, string> = {
    'emballage commercial': 'Retail package',
    'fruit/légume frais en vrac': 'Whole fresh loose produce',
    'fruit/legume frais en vrac': 'Whole fresh loose produce',
    'en vrac': 'Loose produce',
    'boîte de conserve': 'Canned',
    'boite de conserve': 'Canned',
    'boîte': 'Canned',
    'boite': 'Canned',
    'conserve': 'Canned',
    'boîte métallique': 'Metal can',
    'boite metallique': 'Metal can',
    'bocal en verre': 'Glass jar',
    'bocal': 'Glass jar',
    'bouteille plastique': 'Plastic bottle',
    'bouteille': 'Bottle',
    'sac plastique': 'Plastic bag',
    'sac': 'Bag',
    'sachet': 'Pouch',
    'sachet refermable': 'Resealable pouch',
    'boîte de carton': 'Cardboard box',
    'boite de carton': 'Cardboard box',
    'carton': 'Carton',
    'emballage sous vide': 'Vacuum pack',
    'barquette refermable': 'Clamshell container',
    'barquette': 'Tray / Container',
    'pot de yogourt 650g - 750g': 'Yogurt tub 650g - 750g',
    'pot de yogourt': 'Yogurt tub',
    'pot en plastique recyclable': 'Recyclable plastic tub',
    'pot en plastique': 'Plastic tub',
    'pot': 'Tub / Jar',
    'sac ou barquette 3 unités sous pellicule': 'Bag or 3-pack overwrapped tray',
    'sac filet 5 ou 6 unités': '5 or 6 pack mesh bag',
  };

  const PACKAGING_TO_FR: Record<string, string> = {
    'retail package': 'Emballage commercial',
    'whole fresh loose produce': 'Fruit/légume frais en vrac',
    'loose produce': 'En vrac',
    'canned': 'Boîte de conserve',
    'metal can': 'Boîte métallique',
    'glass jar': 'Bocal en verre',
    'plastic bottle': 'Bouteille plastique',
    'bottle': 'Bouteille',
    'plastic bag': 'Sac plastique',
    'bag': 'Sac',
    'pouch': 'Sachet',
    'resealable pouch': 'Sachet refermable',
    'cardboard box': 'Boîte de carton',
    'carton': 'Carton',
    'vacuum pack': 'Emballage sous vide',
    'clamshell container': 'Barquette refermable',
    'yogurt tub 650g - 750g': 'Pot de yogourt 650g - 750g',
    'yogurt tub': 'Pot de yogourt',
    'recyclable plastic tub': 'Pot en plastique recyclable',
    'plastic tub': 'Pot en plastique',
  };

  if (lang === 'EN') {
    return PACKAGING_TO_EN[lower] || (isTextFrench(trimmed) ? translateFoodItem(trimmed, 'EN') : trimmed);
  }
  return PACKAGING_TO_FR[lower] || (!isTextFrench(trimmed) ? translateFoodItem(trimmed, 'FR') : trimmed);
}

/**
 * Bidirectional translation for storage and freshness tips.
 */
export function getLocalizedStorageTip(tip: string | undefined | null, lang: 'EN' | 'FR'): string {
  if (!tip) return '';
  const trimmed = tip.trim();
  const lower = trimmed.toLowerCase();

  if (lang === 'EN') {
    if (lower.includes('réfrigérateur') || lower.includes('refrigerateur')) {
      return 'Store in fridge for maximum freshness.';
    }
    if (lower.includes('garde-manger')) {
      return 'Store in pantry for maximum freshness.';
    }
    if (lower.includes('congélateur') || lower.includes('congelateur')) {
      return 'Store in freezer for maximum freshness.';
    }
    if (lower.includes('maraîchère') || lower.includes('maraichere')) {
      return 'Store according to fresh produce best practices.';
    }
    if (lower.includes('smoothies') || lower.includes('découper avant')) {
      return 'Chop or peel before freezing for smoothies or recipes.';
    }
    return trimmed;
  }

  // French mode
  if (lower.includes('fridge') || lower.includes('refrigerator')) {
    return 'Conserver au réfrigérateur pour une fraîcheur optimale.';
  }
  if (lower.includes('pantry')) {
    return 'Conserver au garde-manger pour une fraîcheur optimale.';
  }
  if (lower.includes('freezer')) {
    return 'Conserver au congélateur pour une fraîcheur optimale.';
  }
  if (lower.includes('best practices')) {
    return 'Conserver selon les recommandations de fraîcheur maraîchère.';
  }
  if (lower.includes('chop or peel')) {
    return 'Laver, peler ou découper avant de congeler pour smoothies ou cuisine.';
  }
  return trimmed;
}

/**
 * Bidirectional translation for origin / provenance labels.
 */
export function getLocalizedOrigin(origin: string | undefined | null, lang: 'EN' | 'FR'): string {
  if (!origin) return '';
  const trimmed = origin.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'canada') return 'Canada';
  if (lower === 'quebec' || lower === 'québec') return lang === 'FR' ? 'Québec' : 'Quebec';
  if (lower === 'usa' || lower === 'united states' || lower === 'états-unis' || lower === 'etats-unis') {
    return lang === 'FR' ? 'États-Unis' : 'United States';
  }
  if (lower === 'mexico' || lower === 'mexique') {
    return lang === 'FR' ? 'Mexique' : 'Mexico';
  }

  // Handle PLU pastille format: "Pastille PLU #1234 • Canada"
  const pluMatch = trimmed.match(/^(?:Pastille PLU|PLU Sticker)\s*#(\d+)\s*[•·-]\s*(.*)$/i);
  if (pluMatch) {
    const code = pluMatch[1];
    const country = getLocalizedOrigin(pluMatch[2], lang);
    return lang === 'FR' ? `Pastille PLU #${code} • ${country}` : `PLU Sticker #${code} • ${country}`;
  }

  return trimmed;
}

