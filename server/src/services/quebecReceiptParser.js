/**
 * Specialized Supermarket & Grocery Receipt Parser
 * Handles Canadian/Quebec (Super C, Metro, IGA, Maxi, Provigo, Costco)
 * and international receipts with department headers, discounts, weight scales, and brand decoding.
 */

const DEPARTMENT_HEADERS = {
  // French headers
  "EPICERIE": { category: "Garde-manger", categoryEn: "Pantry Staples", location: "Pantry", shelfLife: 60, unit: "pcs" },
  "ÉPICERIE": { category: "Garde-manger", categoryEn: "Pantry Staples", location: "Pantry", shelfLife: 60, unit: "pcs" },
  "CHARCUTERIE": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 7, unit: "pack" },
  "FRUIT/LEGUME": { category: "Produits frais", categoryEn: "Produce", location: "Fridge", shelfLife: 7, unit: "pcs" },
  "FRUITS/LEGUMES": { category: "Produits frais", categoryEn: "Produce", location: "Fridge", shelfLife: 7, unit: "pcs" },
  "FRUITS ET LEGUMES": { category: "Produits frais", categoryEn: "Produce", location: "Fridge", shelfLife: 7, unit: "pcs" },
  "VIANDE": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 4, unit: "pack" },
  "BOUCHERIE": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 4, unit: "pack" },
  "PRODUIT LAIT": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 14, unit: "tub" },
  "PRODUITS LAIT": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 14, unit: "tub" },
  "PRODUITS LAITIERS": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 14, unit: "tub" },
  "LAITERIE": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 14, unit: "tub" },
  "BOUL COMMERC": { category: "Boulangerie", categoryEn: "Bakery", location: "Pantry", shelfLife: 6, unit: "pack" },
  "BOULANGERIE": { category: "Boulangerie", categoryEn: "Bakery", location: "Pantry", shelfLife: 6, unit: "loaf" },
  "PATISSERIE": { category: "Boulangerie", categoryEn: "Bakery", location: "Pantry", shelfLife: 5, unit: "pack" },
  "PÂTISSERIE": { category: "Boulangerie", categoryEn: "Bakery", location: "Pantry", shelfLife: 5, unit: "pack" },
  "VIANDE SURG.": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "VIANDE SURG": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "SURGELES": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "SURGELÉS": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "CONGELÉS": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "POISSONNERIE": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 3, unit: "fillet" },
  "FROMAGERIE": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 21, unit: "block" },
  "BREUVAGES": { category: "Boissons", categoryEn: "Beverages", location: "Pantry", shelfLife: 45, unit: "bottle" },
  "BOISSONS": { category: "Boissons", categoryEn: "Beverages", location: "Pantry", shelfLife: 45, unit: "bottle" },

  // English headers
  "GROCERY": { category: "Garde-manger", categoryEn: "Pantry Staples", location: "Pantry", shelfLife: 60, unit: "pcs" },
  "DELI": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 7, unit: "pack" },
  "PRODUCE": { category: "Produits frais", categoryEn: "Produce", location: "Fridge", shelfLife: 7, unit: "pcs" },
  "MEAT": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 4, unit: "pack" },
  "DAIRY": { category: "Produits laitiers & œufs", categoryEn: "Dairy & Eggs", location: "Fridge", shelfLife: 14, unit: "carton" },
  "BAKERY": { category: "Boulangerie", categoryEn: "Bakery", location: "Pantry", shelfLife: 6, unit: "loaf" },
  "FROZEN": { category: "Surgelés", categoryEn: "Frozen Meals", location: "Freezer", shelfLife: 180, unit: "box" },
  "SEAFOOD": { category: "Viandes & Poissons", categoryEn: "Meat & Seafood", location: "Fridge", shelfLife: 3, unit: "fillet" },
  "BEVERAGES": { category: "Boissons", categoryEn: "Beverages", location: "Pantry", shelfLife: 45, unit: "bottle" },
};

const IGNORE_PATTERNS = [
  /^(?:bienvenue\s+chez|welcome\s+to)/i,
  /^programme\s+moi/i,
  /^num[eé]ro\s+de\s+carte/i,
  /^carte\s+moi/i,
  /^points?\s+moi/i,
  /^sous[- ]?total/i,
  /^sub[- ]?total/i,
  /^total\b/i,
  /^tps\b/i,
  /^tvq\b/i,
  /^gst\b/i,
  /^pst\b/i,
  /^hst\b/i,
  /^taxe?s?\b/i,
  /^rabais\b/i,
  /^epargne\b/i,
  /^épargne\b/i,
  /^economie\b/i,
  /^économie\b/i,
  /^discount\b/i,
  /^coupon\b/i,
  /^savings?\b/i,
  /^vous\s+avez\s+[ée]pargn[ée]/i,
  /^you\s+saved\b/i,
  /^visa\b/i,
  /^mastercard\b/i,
  /^amex\b/i,
  /^debit\b/i,
  /^d[ée]bit\b/i,
  /^cash\b/i,
  /^comptant\b/i,
  /^monnaie\b/i,
  /^change\b/i,
  /^balance\b/i,
  /^solde\b/i,
  /^merci\b/i,
  /^thank\s+you/i,
  /^au\s+plaisir/i,
  /^gatineau\b/i,
  /^montr[eé]al\b/i,
  /^qu[eé]bec\b/i,
  /^ottawa\b/i,
  /^\d{3,}[- ]\d{3,}[- ]\d{4}/, // Phone numbers
  /^tel\s*:/i,
  /^order\s*#?/i,
  /^commande\s*#?/i,
  /^trans\s*#?/i,
  /^caisse\b/i,
  /^caissi[eè]re?\b/i,
  /^terminal\b/i,
  /^marchand\b/i,
  /^magasin\b/i,
  /^store\b/i,
  /^auth\s*#?/i,
  /^ref\s*#?/i,
];

// Dictionary of known supermarket abbreviation expansions (Quebec, Canadian, US)
const ABBREVIATION_EXPANSIONS = [
  // Super C / Metro / Moi / Selection abbreviations
  { pattern: /\bHAIKU\s+NOUIL-RIZ\b/i, name: "Nouilles de riz Haïku", nameEn: "Haiku Rice Noodles", brand: "Haïku", category: "Garde-manger", location: "Pantry", shelfLife: 180, unit: "pack" },
  { pattern: /\bBIO\.?\s*BOUIL\.?\s*POU(?:\.MO)?\b/i, name: "Bouillon de poulet biologique Moi", nameEn: "Moi Organic Chicken Broth", brand: "Moi", category: "Garde-manger", location: "Pantry", shelfLife: 60, unit: "carton" },
  { pattern: /\bM(?:\s*ET|\-ET)?\.?\s*BOUIL\.?\s*BOE(?:\.M)?\b/i, name: "Bouillon de bœuf Sélection", nameEn: "Selection Beef Broth", brand: "Sélection", category: "Garde-manger", location: "Pantry", shelfLife: 60, unit: "carton" },
  { pattern: /\bIRRS\.?\s*CAF\.?\s*CAP\.?\s*COL\b/i, name: "Café en capsules Colombie Irrésistibles", nameEn: "Irresistibles Colombian Coffee Pods", brand: "Irrésistibles", category: "Garde-manger", location: "Pantry", shelfLife: 120, unit: "box" },
  { pattern: /\bM(?:\s*ET|\-ET)?\.?\s*TARTINADE\s*\d*\b/i, name: "Tartinade aux noisettes Sélection", nameEn: "Selection Hazelnut Spread", brand: "Sélection", category: "Garde-manger", location: "Pantry", shelfLife: 90, unit: "pot" },
  { pattern: /\bSE\s+JAMB\.?\s*FUME\s+FOR\b/i, name: "Jambon fumé Forêt-Noire Sélection", nameEn: "Selection Black Forest Smoked Ham", brand: "Sélection", category: "Viandes & Poissons", location: "Fridge", shelfLife: 7, unit: "pack" },
  { pattern: /\bCHAMPIGNON\s+BLANC\b/i, name: "Champignons blancs frais", nameEn: "Fresh White Mushrooms", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 6, unit: "barquette" },
  { pattern: /\bPOIVRON\s+VRT\b/i, name: "Poivrons verts doux", nameEn: "Green Bell Peppers", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 8, unit: "pcs" },
  { pattern: /\bCAROTTES\b/i, name: "Carottes fraîches", nameEn: "Fresh Carrots", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 21, unit: "sac" },
  { pattern: /\bLAITUE\s+FEUIL\s+VRT\b/i, name: "Laitue en feuilles vertes", nameEn: "Green Leaf Lettuce", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 5, unit: "pcs" },
  { pattern: /\bPOIRE\s+ASIA\.?\s*JAUNE\b/i, name: "Poires asiatiques jaunes", nameEn: "Yellow Asian Pears", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 10, unit: "pcs" },
  { pattern: /\bCHOU\s+NAPPA\b/i, name: "Chou nappa frais", nameEn: "Fresh Nappa Cabbage", brand: null, category: "Produits frais", location: "Fridge", shelfLife: 14, unit: "pcs" },
  { pattern: /\bPOITRINE\s+POULET\b/i, name: "Poitrines de poulet fraîches", nameEn: "Fresh Chicken Breasts", brand: null, category: "Viandes & Poissons", location: "Fridge", shelfLife: 3, unit: "pack" },
  { pattern: /\bACTIVIA\s+YOG\.?\s*PRO\.?\b/i, name: "Yogourt probiotique Activia", nameEn: "Activia Probiotic Yogurt", brand: "Activia", category: "Produits laitiers & œufs", location: "Fridge", shelfLife: 14, unit: "pack" },
  { pattern: /\bMEDIT\.?\s*YOG\.?\s*FROM\.?\s*C\b/i, name: "Yogourt Méditerranée fromage à la crème", nameEn: "Méditerranée Cream Cheese Style Yogurt", brand: "Méditerranée", category: "Produits laitiers & œufs", location: "Fridge", shelfLife: 14, unit: "pot" },
  { pattern: /\bPAIN\s+AVOINE\b/i, name: "Pain à l'avoine tranché", nameEn: "Oat Sliced Bread", brand: null, category: "Boulangerie", location: "Pantry", shelfLife: 6, unit: "pain" },
  { pattern: /\bPETITS\s+PAINS\s+PAN\b/i, name: "Petits pains panini", nameEn: "Panini Sandwich Rolls", brand: null, category: "Boulangerie", location: "Pantry", shelfLife: 5, unit: "pack" },
  { pattern: /\bSE\s+FONDUE\s+BOEUF\b/i, name: "Viande à fondue de bœuf Sélection", nameEn: "Selection Beef Fondue Slices", brand: "Sélection", category: "Surgelés", location: "Freezer", shelfLife: 180, unit: "pack" },
  { pattern: /\b(?:LC|LACAGE)\s+AILE\s+POUL(?:ET)?(?:\s+P)?\b/i, name: "Ailes de poulet assaisonnées La Cage", nameEn: "La Cage Seasoned Chicken Wings", brand: "La Cage", category: "Surgelés", location: "Freezer", shelfLife: 180, unit: "boîte" },
];

/**
 * Parses raw grocery receipt text into clean, categorized, and scaled food items.
 *
 * @param {string} rawReceiptText - OCR or pasted text
 * @param {string} language - Target language ("FR" or "EN")
 * @returns {Array<Object>} List of structured food inventory items
 */
export function parseQuebecReceiptText(rawReceiptText, language = "FR") {
  if (!rawReceiptText || typeof rawReceiptText !== "string") return [];

  const rawLines = rawReceiptText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentDepartment = null;
  const items = [];
  const now = new Date();

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // 1. Skip meta lines (receipt headers, cards, totals, discounts)
    if (IGNORE_PATTERNS.some((pat) => pat.test(line))) {
      continue;
    }

    // 2. Check if this line is a department header
    const cleanHeaderKey = line.toUpperCase().replace(/\s+/g, " ");
    if (DEPARTMENT_HEADERS[cleanHeaderKey]) {
      currentDepartment = DEPARTMENT_HEADERS[cleanHeaderKey];
      continue;
    }

    // 3. Check if this line is a price / weight sub-line for the previous item
    // Examples:
    // "2 @ $1.49 2.98"
    // "0.315 kg @ $6.59/kg 2.08"
    // "2.460 kg @ $3.95/kg 9.72"
    const subMatch = line.match(/^(\d+(?:\.\d+)?)\s*(kg)?\s*@\s*[$€£]?\s*(\d+(?:\.\d+)?)(?:\/kg)?\s+([$€£]?\s*\d+[.,]\d{2})/i);
    if (subMatch && items.length > 0) {
      const lastItem = items[items.length - 1];
      const parsedQty = parseFloat(subMatch[1]);
      const hasKg = Boolean(subMatch[2] || line.toLowerCase().includes("kg"));
      if (hasKg) {
        lastItem.quantity = parsedQty;
        lastItem.unit = "kg";
      } else {
        lastItem.quantity = Math.round(parsedQty);
        lastItem.unit = "pcs";
      }
      const subPriceMatch = subMatch[4]?.match(/(\d+[.,]\d{2})/);
      if (subPriceMatch) {
        lastItem.price = parseFloat(subPriceMatch[1].replace(",", "."));
      }
      continue;
    }

    // 4. Extract price at end of line if present (e.g. "HAIKU NOUIL-RIZ 3.49")
    let itemPrice = undefined;
    const priceMatch = line.match(/[$€£]?\s*(\d+[.,]\d{2})(?:\s*[A-Za-z*])?$/i);
    if (priceMatch) {
      itemPrice = parseFloat(priceMatch[1].replace(",", "."));
    }

    let itemText = line.replace(/[$€£]?\s*\d+[.,]\d{2}(?:\s*[A-Za-z*])?$/i, "").trim();
    if (itemText.length < 2) continue;

    // 5. Extract quantity prefixes or suffixes:
    // e.g. "(2)BIO.BOUIL.POU.MO", "(2)SE FONDUE BOEUF", "POIVRON VRT 4UN", "2x POMMES"
    let itemQuantity = 1;
    let itemUnit = currentDepartment?.unit || "pcs";

    const parenQtyMatch = itemText.match(/^\((\d+)\)\s*(.*)/);
    if (parenQtyMatch) {
      itemQuantity = parseInt(parenQtyMatch[1], 10);
      itemText = parenQtyMatch[2].trim();
    } else {
      const leadQtyMatch = itemText.match(/^(\d+)\s*(?:x|@)?\s+(.*)/i);
      if (leadQtyMatch && leadQtyMatch[2].length > 2) {
        itemQuantity = parseInt(leadQtyMatch[1], 10);
        itemText = leadQtyMatch[2].trim();
      }
    }

    const unMatch = itemText.match(/\b(\d+)\s*UN\b/i);
    if (unMatch) {
      itemQuantity = parseInt(unMatch[1], 10);
      itemText = itemText.replace(/\b\d+\s*UN\b/i, "").trim();
      itemUnit = "pcs";
    }

    // 6. Check against specific known Quebec / Canadian abbreviation dictionary
    let matchedNameFr = null;
    let matchedNameEn = null;
    let matchedBrand = null;
    let matchedCategory = currentDepartment?.category || "Garde-manger";
    let matchedLocation = currentDepartment?.location || "Pantry";
    let matchedShelfLife = currentDepartment?.shelfLife || 30;

    for (const entry of ABBREVIATION_EXPANSIONS) {
      if (entry.pattern.test(itemText)) {
        matchedNameFr = entry.name;
        matchedNameEn = entry.nameEn;
        matchedBrand = entry.brand;
        if (entry.category) matchedCategory = entry.category;
        if (entry.location) matchedLocation = entry.location;
        if (entry.shelfLife) matchedShelfLife = entry.shelfLife;
        if (entry.unit) itemUnit = entry.unit;
        break;
      }
    }

    // 7. General cleanup if not in dictionary
    if (!matchedNameFr) {
      // Remove punctuation and clean
      let clean = itemText.replace(/[._]/g, " ").replace(/\s+/g, " ").trim();

      // Brand extractions
      if (/^SE\s+|\bSE\b/i.test(clean)) {
        matchedBrand = "Sélection";
        clean = clean.replace(/^SE\s+/i, "");
      } else if (/^IRRS\b|^IRRESISTIBLES\b/i.test(clean)) {
        matchedBrand = "Irrésistibles";
        clean = clean.replace(/^IRRS\s+/i, "").replace(/^IRRESISTIBLES\s+/i, "");
      } else if (/^LC\s+|\bLACAGE\b/i.test(clean)) {
        matchedBrand = "La Cage";
        clean = clean.replace(/^LC\s+/i, "").replace(/^LACAGE\s+/i, "");
      } else if (/^PC\s+|\bPRESIDENTS\s+CHOICE\b/i.test(clean)) {
        matchedBrand = "President's Choice";
        clean = clean.replace(/^PC\s+/i, "");
      }

      // Title case
      clean = clean
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      matchedNameFr = clean;
      matchedNameEn = clean;
    }

    // Assign final localized name
    const finalName = language === "FR" ? (matchedNameFr || matchedNameEn) : (matchedNameEn || matchedNameFr);
    const targetExp = new Date(now.getTime() + matchedShelfLife * 24 * 60 * 60 * 1000);

    items.push({
      name: finalName,
      nameFr: matchedNameFr || finalName,
      nameEn: matchedNameEn || finalName,
      brand: matchedBrand || undefined,
      category: matchedCategory,
      quantity: itemQuantity,
      unit: itemUnit,
      price: itemPrice,
      recommendedLocation: matchedLocation,
      storageReason: language === "FR"
        ? `Conserver au ${matchedLocation === "Fridge" ? "réfrigérateur" : matchedLocation === "Freezer" ? "congélateur" : "garde-manger"}.`
        : `Store in ${matchedLocation.toLowerCase()} for optimal shelf life.`,
      estimatedShelfLifeDays: matchedShelfLife,
      monthsFrozenShelfLife: matchedLocation === "Freezer" ? 6 : 4,
      confidence: 0.95,
      storageTip: language === "FR"
        ? `Garder scellé et au ${matchedLocation === "Fridge" ? "frais" : matchedLocation === "Freezer" ? "congélateur" : "sec"}.`
        : `Keep sealed in ${matchedLocation.toLowerCase()}.`,
      suggestedExpirationDate: targetExp.toISOString().split("T")[0],
      detectedText: line,
    });
  }

  return items;
}
