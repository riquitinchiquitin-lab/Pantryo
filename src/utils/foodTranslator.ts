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
  TAGALOG_TO_EN_DICTIONARY,
  TAGALOG_TO_FR_DICTIONARY,
  isTextTagalog,
  translateTagalogToEnglish,
  translateTagalogToFrench,
  translateCookingStepToFrench,
  translateCookingStepToEnglish,
  cleanDuplicatedNotes,
  translateRecipeTitleToEnglish,
  translateRecipeTitleToFrench,
  translateRecipeDescriptionToEnglish,
  translateRecipeDescriptionToFrench,
} from './foodTranslatorCore.js';

export {
  EN_TO_FR_DICTIONARY,
  FR_TO_EN_DICTIONARY,
  TAGALOG_TO_EN_DICTIONARY,
  TAGALOG_TO_FR_DICTIONARY,
  translateFoodItem,
  getBilingualNames,
  translateRecipeIngredients,
  isTextFrench,
  isTextTagalog,
  translateTagalogToEnglish,
  translateTagalogToFrench,
  translateCookingStepToFrench,
  translateCookingStepToEnglish,
  cleanDuplicatedNotes,
  translateRecipeTitleToEnglish,
  translateRecipeTitleToFrench,
  translateRecipeDescriptionToEnglish,
  translateRecipeDescriptionToFrench,
};

/**
 * Returns the localized item display name according to the active language.
 * LOGIC:
 * 1. If it's French: translate to English ONLY for the English app version (preserve French for French app version).
 * 2. If it's English: translate to French for the French app version (preserve English for English app version).
 * 3. If it's Tagalog: translate to BOTH English and French!
 */
export function getItemDisplayName(
  item: { name?: string | null; nameFr?: string | null; nameEn?: string | null } | null | undefined,
  lang: 'EN' | 'FR'
): string {
  if (!item) return '';
  const raw = (item.name || '').trim();
  const fr = (item.nameFr || '').trim();
  const en = (item.nameEn || '').trim();

  // If item is Tagalog, translate to English or French based on app version
  if (isTextTagalog(raw) || isTextTagalog(en) || isTextTagalog(fr)) {
    const candidate = raw || en || fr;
    if (lang === 'FR') {
      return (fr && !isTextTagalog(fr)) ? fr : translateTagalogToFrench(candidate);
    } else {
      return (en && !isTextTagalog(en)) ? en : translateTagalogToEnglish(candidate);
    }
  }

  if (lang === 'FR') {
    // French app mode:
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

  // English app mode:
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
 * Resolves the display title of a recipe based on active app language.
 *
 * SPECIFIED LOGIC:
 * 1. If it's French: translate to English ONLY for the English app version (preserve French for French app version).
 * 2. If it's English: translate to French for the French app version (preserve English for English app version).
 * 3. If it's Tagalog: translate to BOTH English and French!
 */
export function getRecipeDisplayTitle(
  recipe: { title?: string | null; titleFr?: string | null; titleEn?: string | null; name?: string | null; tags?: string[] } | null | undefined,
  lang: 'EN' | 'FR'
): string {
  if (!recipe) return '';
  const rawTitle = (recipe.title || recipe.name || '').trim();
  const frTitle = (recipe.titleFr || '').trim();
  const enTitle = (recipe.titleEn || '').trim();

  // 1. Tagalog check
  const isTagalog =
    isTextTagalog(rawTitle) ||
    isTextTagalog(frTitle) ||
    isTextTagalog(enTitle) ||
    (Array.isArray(recipe.tags) && recipe.tags.some((t) => isTextTagalog(t)));

  if (isTagalog) {
    const candidate = rawTitle || frTitle || enTitle;
    if (lang === 'FR') {
      return frTitle && !isTextTagalog(frTitle) && isTextFrench(frTitle)
        ? frTitle
        : cleanDuplicatedNotes(translateTagalogToFrench(candidate));
    } else {
      return enTitle && !isTextTagalog(enTitle)
        ? enTitle
        : cleanDuplicatedNotes(translateTagalogToEnglish(candidate));
    }
  }

  // 2. French app version
  if (lang === 'FR') {
    // If an explicit French title exists and has French characteristics
    if (frTitle && isTextFrench(frTitle)) return frTitle;
    // If raw title is French
    if (rawTitle && isTextFrench(rawTitle)) return rawTitle;
    // If explicit French title exists and differs from English raw
    if (frTitle && frTitle.length > 0 && frTitle.toLowerCase() !== rawTitle.toLowerCase()) return frTitle;
    // Source is English -> Translate to French!
    const candidate = enTitle || rawTitle || frTitle;
    if (candidate) {
      const translated = cleanDuplicatedNotes(translateFoodItem(candidate, 'FR'));
      if (translated) return translated;
    }
    return frTitle || rawTitle || '';
  }

  // 3. English app version
  // Source is French -> Translate to English only!
  if (rawTitle && isTextFrench(rawTitle)) {
    if (enTitle && enTitle.length > 0 && !isTextFrench(enTitle)) return enTitle;
    const translated = cleanDuplicatedNotes(translateRecipeTitleToEnglish(rawTitle) || translateFoodItem(rawTitle, 'EN'));
    if (translated) return translated;
  }
  if (frTitle && isTextFrench(frTitle)) {
    if (enTitle && enTitle.length > 0 && !isTextFrench(enTitle)) return enTitle;
    if (rawTitle && !isTextFrench(rawTitle)) return rawTitle;
    const translated = cleanDuplicatedNotes(translateRecipeTitleToEnglish(frTitle) || translateFoodItem(frTitle, 'EN'));
    if (translated) return translated;
  }

  return enTitle || rawTitle || frTitle || '';
}

/**
 * Resolves the display description of a recipe based on active app language.
 */
export function getRecipeDisplayDescription(
  recipe: { description?: string | null; descriptionEn?: string | null; descriptionFr?: string | null; zeroWasteReason?: string | null } | null | undefined,
  lang: 'EN' | 'FR'
): string {
  if (!recipe) return '';
  const descFr = (recipe.descriptionFr || '').trim();
  const descEn = (recipe.descriptionEn || recipe.description || recipe.zeroWasteReason || '').trim();

  if (isTextTagalog(descFr) || isTextTagalog(descEn)) {
    const candidate = descEn || descFr;
    return lang === 'FR'
      ? cleanDuplicatedNotes(translateTagalogToFrench(candidate))
      : cleanDuplicatedNotes(translateTagalogToEnglish(candidate));
  }

  if (lang === 'FR') {
    if (descFr && isTextFrench(descFr)) return descFr;
    if (descFr && descFr.length > 0) return descFr;
    if (descEn) return cleanDuplicatedNotes(translateRecipeDescriptionToFrench(descEn) || translateFoodItem(descEn, 'FR'));
    return '';
  } else {
    if (descEn && !isTextFrench(descEn)) return descEn;
    if (descFr) return cleanDuplicatedNotes(translateRecipeDescriptionToEnglish(descFr));
    return descEn || '';
  }
}

/**
 * Resolves the display instructions of a recipe based on active app language.
 */
export function getRecipeDisplayInstructions(
  recipe: { instructions?: string[] | null; instructionsEn?: string[] | null; instructionsFr?: string[] | null } | null | undefined,
  lang: 'EN' | 'FR'
): string[] {
  if (!recipe) return [];
  const stepsFr = Array.isArray(recipe.instructionsFr) && recipe.instructionsFr.length > 0 ? recipe.instructionsFr : [];
  const stepsEn = Array.isArray(recipe.instructionsEn) && recipe.instructionsEn.length > 0
    ? recipe.instructionsEn
    : (Array.isArray(recipe.instructions) ? recipe.instructions : []);

  if (lang === 'FR') {
    if (stepsFr.length > 0 && stepsFr.some((s) => isTextFrench(s))) return stepsFr;
    if (stepsEn.length > 0) {
      return stepsEn.map((s) => translateCookingStepToFrench(s) || s);
    }
    return stepsFr;
  } else {
    if (stepsEn.length > 0 && stepsEn.some((s) => !isTextFrench(s))) return stepsEn;
    if (stepsFr.length > 0) {
      return stepsFr.map((s) => translateCookingStepToEnglish(s) || s);
    }
    return stepsEn;
  }
}

/**
 * Normalizes and guarantees that all bilingual fields of a recipe are populated
 * strictly following the 3 core rules:
 * - If French: translate to English ONLY for the English app version (preserve French for French app version).
 * - If English: translate to French for the French app version (preserve English for English app version).
 * - If Tagalog: translate to BOTH English and French!
 */
export function ensureBilingualRecipe<T extends Record<string, any>>(recipe: T, activeLang: 'EN' | 'FR' = 'FR'): T {
  if (!recipe) return recipe;
  const rawTitle = (recipe.title || recipe.name || '').trim();
  const rawTitleFr = (recipe.titleFr || '').trim();
  const rawTitleEn = (recipe.titleEn || '').trim();

  const isTagalog =
    isTextTagalog(rawTitle) ||
    isTextTagalog(rawTitleFr) ||
    (Array.isArray(recipe.tags) && recipe.tags.some((t: string) => isTextTagalog(t)));
  const isFrench = !isTagalog && isTextFrench(rawTitleFr || rawTitle);

  let titleEn = rawTitleEn || rawTitle;
  let titleFr = rawTitleFr;

  if (isTagalog) {
    const candidate = rawTitle || rawTitleFr || rawTitleEn;
    titleEn = cleanDuplicatedNotes(translateRecipeTitleToEnglish(candidate) || translateTagalogToEnglish(candidate) || candidate);
    titleFr = cleanDuplicatedNotes(translateRecipeTitleToFrench(candidate) || translateTagalogToFrench(candidate) || candidate);
  } else if (isFrench) {
    titleFr = rawTitleFr || rawTitle;
    if (!titleEn || (isTextFrench(titleEn) && titleEn.toLowerCase() === titleFr.toLowerCase())) {
      titleEn = cleanDuplicatedNotes(translateRecipeTitleToEnglish(titleFr) || translateFoodItem(titleFr, 'EN') || titleFr);
    }
  } else {
    // English
    titleEn = rawTitle || rawTitleEn;
    if (!titleFr || (!isTextFrench(titleFr) && titleFr.toLowerCase() === titleEn.toLowerCase())) {
      titleFr = cleanDuplicatedNotes(translateRecipeTitleToFrench(titleEn) || translateFoodItem(titleEn, 'FR') || titleEn);
    }
  }

  // Ensure ingredients
  const ingredients = (recipe.ingredients || []).map((ing: any, idx: number) => {
    const ingName = (ing.name || ing.nameFr || '').trim();
    const ingFr = (ing.nameFr || '').trim();
    const ingEn = (ing.nameEn || ing.name || '').trim();

    let resolvedEn = ingEn;
    let resolvedFr = ingFr;

    if (resolvedEn && resolvedFr && resolvedEn.toLowerCase() !== resolvedFr.toLowerCase()) {
      // Both distinct and valid, preserve both
    } else if (isTextTagalog(ingName) || isTextTagalog(ingFr)) {
      const c = ingName || ingFr;
      resolvedEn = cleanDuplicatedNotes(translateTagalogToEnglish(c) || c);
      resolvedFr = cleanDuplicatedNotes(translateTagalogToFrench(c) || translateFoodItem(resolvedEn, 'FR') || c);
    } else if (isFrench) {
      if (!resolvedFr) resolvedFr = ingFr || ingName;
      if (!resolvedEn || resolvedEn.toLowerCase() === resolvedFr.toLowerCase()) {
        resolvedEn = cleanDuplicatedNotes(translateFoodItem(resolvedFr, 'EN') || resolvedFr);
      }
    } else {
      if (!resolvedEn) resolvedEn = ingEn || ingName;
      if (!resolvedFr || resolvedFr.toLowerCase() === resolvedEn.toLowerCase()) {
        resolvedFr = cleanDuplicatedNotes(translateFoodItem(resolvedEn, 'FR') || resolvedEn);
      }
    }

    const displayName = activeLang === 'FR' ? (resolvedFr || resolvedEn) : (resolvedEn || resolvedFr);

    return {
      ...ing,
      id: ing.id || `ing-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: displayName,
      nameFr: resolvedFr,
      nameEn: resolvedEn,
    };
  });

  // Ensure instructions
  const rawStepsEn = Array.isArray(recipe.instructionsEn)
    ? recipe.instructionsEn
    : (Array.isArray(recipe.instructions) ? recipe.instructions : []);
  const rawStepsFr = Array.isArray(recipe.instructionsFr) ? recipe.instructionsFr : [];

  let instructionsEn = [...rawStepsEn];
  let instructionsFr = [...rawStepsFr];

  if (isTagalog) {
    const src = rawStepsEn.length > 0 ? rawStepsEn : rawStepsFr;
    instructionsEn = rawStepsEn.length > 0 && !rawStepsEn.every((s: string) => isTextTagalog(s))
      ? rawStepsEn
      : src.map((s: string) => translateCookingStepToEnglish(s) || s);
    instructionsFr = rawStepsFr.length > 0 && !rawStepsFr.every((s: string) => isTextTagalog(s))
      ? rawStepsFr
      : src.map((s: string) => translateCookingStepToFrench(s) || s);
  } else if (isFrench) {
    if (instructionsFr.length === 0 && instructionsEn.length > 0) instructionsFr = [...instructionsEn];
    if (instructionsEn.length > 0 && !instructionsEn.every((s: string) => isTextFrench(s))) {
      // Valid English instructions already present, preserve them!
    } else {
      instructionsEn = instructionsFr.map((s: string) => translateCookingStepToEnglish(s) || s);
    }
  } else {
    if (instructionsEn.length === 0 && instructionsFr.length > 0) instructionsEn = [...instructionsFr];
    if (instructionsFr.length > 0 && instructionsFr.some((s: string) => isTextFrench(s))) {
      // Valid French instructions already present, preserve them!
    } else {
      instructionsFr = instructionsEn.map((s: string) => translateCookingStepToFrench(s) || s);
    }
  }

  // Ensure descriptions
  let descEn = recipe.descriptionEn || recipe.description || '';
  let descFr = recipe.descriptionFr || '';
  if (isTagalog) {
    const c = descEn || descFr;
    descEn = cleanDuplicatedNotes(translateRecipeDescriptionToEnglish(c) || translateTagalogToEnglish(c));
    descFr = cleanDuplicatedNotes(translateRecipeDescriptionToFrench(c) || translateTagalogToFrench(c));
  } else if (isFrench) {
    descFr = descFr || descEn;
    if (!descEn || isTextFrench(descEn)) descEn = cleanDuplicatedNotes(translateRecipeDescriptionToEnglish(descFr));
  } else {
    descEn = descEn || descFr;
    if (!descFr || !isTextFrench(descFr)) descFr = cleanDuplicatedNotes(translateRecipeDescriptionToFrench(descEn));
  }

  return {
    ...recipe,
    title: activeLang === 'FR' ? (titleFr || titleEn) : (titleEn || titleFr),
    titleEn,
    titleFr,
    descriptionEn: descEn,
    descriptionFr: descFr,
    ingredients,
    instructionsEn,
    instructionsFr,
    difficultyFr:
      recipe.difficultyFr ||
      (recipe.difficulty === 'Advanced' ? 'Avancé' : recipe.difficulty === 'Medium' ? 'Moyen' : 'Facile'),
  };
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

