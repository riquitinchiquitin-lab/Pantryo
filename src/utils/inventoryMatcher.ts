/**
 * Shared live inventory matching utility for Recipes & Meal Planner.
 * Normalizes quantities, units, prep words, plurals, and EN/FR synonyms
 * so planned meals and recipes always reflect real-time household stock.
 */

export interface InventoryMatchCandidate {
  name: string;
  nameFr?: string | null;
  quantity?: number;
}

const PREP_WORDS = new Set([
  'fresh', 'frozen', 'dried', 'ground', 'minced', 'chopped', 'diced', 'sliced',
  'boneless', 'skinless', 'large', 'small', 'medium', 'whole', 'raw', 'cooked',
  'extra', 'virgin', 'organic', 'unsalted', 'salted', 'shredded', 'grated',
  'crushed', 'peeled', 'seeded', 'canned', 'packed', 'to', 'taste', 'of',
  'frais', 'fraiche', 'fraîche', 'surgele', 'surgelé', 'seche', 'séché',
  'moulu', 'hache', 'haché', 'coupe', 'coupé', 'tranche', 'tranché',
  'desosse', 'désossé', 'entier', 'entiere', 'entière', 'bio', 'rape', 'rapé',
  'de', 'du', 'des', 'la', 'le', 'les', 'd', 'l',
]);

const UNIT_PATTERN =
  /^(?:(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(?:-\s*\d+(?:[.,]\d+)?\s*)?)?(?:tablespoons?|tbsp|teaspoons?|tsp|cups?|ounces?|oz|pounds?|lbs?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|litres?|l|cloves?|cans?|jars?|bottles?|packages?|pkgs?|bags?|bunches?|slices?|pieces?|pcs?|pinch(?:es)?|dash(?:es)?|tasses?|c\.?\s*à\s*(?:s\.?|soupe|thé|café)|cuillères?\s*à\s*(?:soupe|café|thé)|gousses?|boîtes?|boites?|tranches?|morceaux?|paquets?|pincées?)\b\s*/i;

const SYNONYM_GROUPS: string[][] = [
  ['chicken', 'poulet', 'poultry', 'volaille'],
  ['beef', 'boeuf', 'bœuf', 'steak'],
  ['pork', 'porc', 'bacon', 'ham', 'jambon'],
  ['salmon', 'saumon'],
  ['fish', 'poisson', 'cod', 'morue', 'tilapia', 'tuna', 'thon'],
  ['shrimp', 'crevette', 'prawn'],
  ['garlic', 'ail'],
  ['onion', 'oignon', 'shallot', 'echalote', 'échalote'],
  ['potato', 'pomme de terre', 'patate'],
  ['tomato', 'tomate'],
  ['butter', 'beurre'],
  ['egg', 'oeuf', 'œuf'],
  ['milk', 'lait'],
  ['cheese', 'fromage', 'cheddar', 'mozzarella', 'parmesan'],
  ['yogurt', 'yogourt', 'yaourt'],
  ['spinach', 'epinard', 'épinard'],
  ['strawberry', 'fraise'],
  ['avocado', 'avocat'],
  ['bread', 'pain', 'sourdough', 'baguette'],
  ['olive oil', 'huile olive', "huile d'olive"],
  ['salt', 'sel'],
  ['pepper', 'poivre'],
  ['rice', 'riz'],
  ['pasta', 'pates', 'pâtes', 'spaghetti', 'penne', 'macaroni'],
  ['flour', 'farine'],
  ['sugar', 'sucre'],
  ['lemon', 'citron'],
  ['lime', 'limette', 'citron vert'],
  ['carrot', 'carotte'],
  ['broccoli', 'brocoli'],
  ['mushroom', 'champignon'],
  ['bell pepper', 'poivron'],
  ['cucumber', 'concombre'],
  ['lettuce', 'laitue', 'salade'],
  ['honey', 'miel'],
  ['cream', 'creme', 'crème'],
];

function singularizeWord(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) {
    return word.slice(0, -1);
  }
  return word;
}

export function normalizeIngredientText(raw: string): string {
  if (!raw) return '';
  let text = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[,;•·]/g, ' ')
    .trim();

  // Strip leading numeric quantity + optional unit (up to 2 passes for e.g. "2 cans (400ml) of ...")
  for (let i = 0; i < 2; i++) {
    text = text.replace(/^(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*/i, '').trim();
    text = text.replace(UNIT_PATTERN, '').trim();
  }

  const tokens = text
    .split(/[\s/'’-]+/)
    .map((t) => singularizeWord(t.replace(/[^a-z0-9]/g, '')))
    .filter((t) => t.length > 1 && !PREP_WORDS.has(t));

  return tokens.join(' ');
}

function getSynonymGroupIndices(normalized: string): number[] {
  const indices: number[] = [];
  for (let idx = 0; idx < SYNONYM_GROUPS.length; idx++) {
    const group = SYNONYM_GROUPS[idx];
    if (
      group.some((syn) => {
        const s = syn
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalized === s || normalized.includes(s) || s.includes(normalized);
      })
    ) {
      indices.push(idx);
    }
  }
  return indices;
}

export function findMatchingInventoryItem<T extends InventoryMatchCandidate>(
  ingredientName: string,
  inventoryItems: T[],
  mappedName?: string
): T | undefined {
  const targetRaw = (mappedName || ingredientName || '').trim();
  if (!targetRaw || inventoryItems.length === 0) return undefined;

  const targetNorm = normalizeIngredientText(targetRaw);
  if (!targetNorm) return undefined;

  const targetTokens = targetNorm.split(' ').filter(Boolean);
  const targetGroups = getSynonymGroupIndices(targetNorm);

  return inventoryItems.find((item) => {
    if (item.quantity !== undefined && item.quantity <= 0) return false;

    const candidates = [item.name, item.nameFr].filter((v): v is string => Boolean(v && v.trim()));
    for (const candidate of candidates) {
      const invNorm = normalizeIngredientText(candidate);
      if (!invNorm) continue;

      if (invNorm === targetNorm || invNorm.includes(targetNorm) || targetNorm.includes(invNorm)) {
        return true;
      }

      const invTokens = invNorm.split(' ').filter(Boolean);
      if (
        targetTokens.length > 0 &&
        invTokens.length > 0 &&
        (targetTokens.every((t) => invTokens.includes(t)) ||
          invTokens.every((t) => targetTokens.includes(t)))
      ) {
        return true;
      }

      if (targetGroups.length > 0) {
        const invGroups = getSynonymGroupIndices(invNorm);
        if (targetGroups.some((g) => invGroups.includes(g))) {
          return true;
        }
      }
    }

    return false;
  });
}

export function isIngredientInInventory(
  ingredientName: string,
  inventoryItems: InventoryMatchCandidate[],
  mappedName?: string
): boolean {
  return Boolean(findMatchingInventoryItem(ingredientName, inventoryItems, mappedName));
}
