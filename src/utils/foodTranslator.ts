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
 */
export function getItemDisplayName(
  item: { name: string; nameFr?: string | null; nameEn?: string | null },
  lang: 'EN' | 'FR'
): string {
  if (!item) return '';
  if (lang === 'FR') {
    return item.nameFr || translateFoodItem(item.name, 'FR') || item.name;
  }
  return item.nameEn || translateFoodItem(item.name, 'EN') || item.name;
}
