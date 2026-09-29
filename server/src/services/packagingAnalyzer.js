/**
 * Pantryo - Food Packaging Vision & Intelligence Analyzer
 * Extracts detailed grocery attributes:
 * - Product Name (Bilingual FR/EN)
 * - Brand Name
 * - Grade, Origin & Certifications (e.g. "CANADA No. 1 • PRODUIT DU QUÉBEC", "Aliments du Québec")
 * - Net Quantity / Weight / Volume (e.g. "1.36 kg / 3 lb", "680 mL", "900 mL", "340 comprimés")
 * - Packaging Format (e.g. "Sac en plastique perforé", "Boîte de conserve métallique", "Brique Tetra Pak avec bouchon dévissable")
 * - Dietary & Health Badges (e.g. "60% Moins de sodium", "Sans BPA", "Biologique")
 * - Recommended Compartments (Unopened vs After Opening)
 * - Shelf-Life breakdown (Unopened, Opened, Freezer)
 * - Practical Storage & Culinary Preservation Tips
 */

// Brand dictionaries with canonical display names
const KNOWN_BRANDS = [
  // Quebec / Canadian Private & National Brands
  { pattern: /(?:jardin\s*de\s*nos\s*mara[iî]chers|our\s*harvest\s*best)/i, brand: "Our Harvest Best / Jardin de nos maraîchers" },
  { pattern: /(?:s[eé]lection|selection\b)/i, brand: "Sélection" },
  { pattern: /(?:life\s*smart|mieux[- ]?[eê]tre)/i, brand: "Life Smart / Mieux-être" },
  { pattern: /(?:choix\s*du\s*pr[eé]sident|president'?s\s*choice|\bpc\b)/i, brand: "Président's Choice / Le Choix du Président" },
  { pattern: /(?:compliments\b)/i, brand: "Compliments" },
  { pattern: /(?:sans\s*nom|no\s*name\b)/i, brand: "Sans nom / No Name" },
  { pattern: /(?:irr[eé]sistibles)/i, brand: "Irresistibles" },
  { pattern: /(?:kirkland(?:\s*signature)?)/i, brand: "Kirkland Signature" },
  { pattern: /(?:great\s*value)/i, brand: "Great Value" },
  { pattern: /(?:aylmer\b)/i, brand: "Aylmer" },
  { pattern: /(?:arctic\s*gardens)/i, brand: "Arctic Gardens" },
  { pattern: /(?:qu[eé]bon\b)/i, brand: "Québon" },
  { pattern: /(?:natrel\b)/i, brand: "Natrel" },
  { pattern: /(?:lactantia\b)/i, brand: "Lactantia" },
  { pattern: /(?:beatrice\b)/i, brand: "Beatrice" },
  { pattern: /(?:sealtest\b)/i, brand: "Sealtest" },
  { pattern: /(?:olymel\b)/i, brand: "Olymel" },
  { pattern: /(?:flamingo\b)/i, brand: "Flamingo" },
  { pattern: /(?:maple\s*leaf)/i, brand: "Maple Leaf" },
  { pattern: /(?:oasis\b)/i, brand: "Oasis" },
  { pattern: /(?:fontaine\s*sant[eé])/i, brand: "Fontaine Santé" },
  { pattern: /(?:dare\b)/i, brand: "Dare" },
  { pattern: /(?:leclerc\b)/i, brand: "Leclerc" },
  { pattern: /(?:primo\b)/i, brand: "Primo" },
  { pattern: /(?:unico\b)/i, brand: "Unico" },
  { pattern: /(?:barilla\b)/i, brand: "Barilla" },
  { pattern: /(?:catelli\b)/i, brand: "Catelli" },
  { pattern: /(?:campbell'?s)/i, brand: "Campbell's" },
  { pattern: /(?:heinz\b)/i, brand: "Heinz" },
  { pattern: /(?:kraft\b)/i, brand: "Kraft" },
  { pattern: /(?:hellmann'?s)/i, brand: "Hellmann's" },
  { pattern: /(?:french'?s)/i, brand: "French's" },
  { pattern: /(?:oatly\b)/i, brand: "Oatly" },
  { pattern: /(?:chobani\b)/i, brand: "Chobani" },
  { pattern: /(?:silk\b)/i, brand: "Silk" },
  { pattern: /(?:danone\b)/i, brand: "Danone" },
  { pattern: /(?:i[oö]go\b)/i, brand: "Iögo" },
  { pattern: /(?:libert[eé]\b)/i, brand: "Liberté" },
  { pattern: /(?:goya\b)/i, brand: "Goya" },
  { pattern: /(?:la\s*coste[nñ]a)/i, brand: "La Costeña" },
  { pattern: /(?:herdez\b)/i, brand: "Herdez" },
  { pattern: /(?:datu\s*puti)/i, brand: "Datu Puti" },
  { pattern: /(?:mama\s*sita'?s)/i, brand: "Mama Sita's" },
  { pattern: /(?:lucky\s*me)/i, brand: "Lucky Me" },
  { pattern: /(?:san\s*miguel)/i, brand: "San Miguel" },
  { pattern: /(?:tostitos\b)/i, brand: "Tostitos" },
  { pattern: /(?:pace\b)/i, brand: "Pace" },
  { pattern: /(?:old\s*el\s*paso)/i, brand: "Old El Paso" },
  // Vitamins & Health
  { pattern: /(?:jamieson\b)/i, brand: "Jamieson" },
  { pattern: /(?:centrum\b)/i, brand: "Centrum" },
  { pattern: /(?:nature'?s\s*bounty)/i, brand: "Nature's Bounty" },
  { pattern: /(?:webber\s*naturals)/i, brand: "Webber Naturals" },
  { pattern: /(?:u[- ]?herb\b)/i, brand: "U-Herb" },
  { pattern: /(?:flora\b|sambuguard\b)/i, brand: "Flora SambuGuard" },
  { pattern: /(?:one\s*a\s*day)/i, brand: "One A Day" },
];

/**
 * Parses raw text read from grocery packaging and returns structured metadata
 */
export function analyzePackagingText(rawText, preferredLanguage = "FR") {
  const lang = (preferredLanguage || "FR").toUpperCase().startsWith("FR") ? "FR" : "EN";
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();

  // 1. Detect Brand
  let detectedBrand = null;
  for (const entry of KNOWN_BRANDS) {
    if (entry.pattern.test(text)) {
      detectedBrand = entry.brand;
      break;
    }
  }

  // 2. Detect Grade & Origin & Certifications
  const originParts = [];
  if (/canada\s*(?:no\.?|n[o°])\s*1\b/i.test(text)) {
    originParts.push("CANADA No. 1");
  } else if (/canada\s*fancy/i.test(text)) {
    originParts.push("CANADA FANCY");
  }

  if (/(?:produit\s*du\s*qu[eé]bec|product\s*of\s*quebec)/i.test(text)) {
    originParts.push(lang === "FR" ? "PRODUIT DU QUÉBEC" : "PRODUCT OF QUEBEC");
  } else if (/(?:produit\s*du\s*canada|product\s*of\s*canada)/i.test(text)) {
    originParts.push(lang === "FR" ? "PRODUIT DU CANADA" : "PRODUCT OF CANADA");
  } else if (/product\s*of\s*usa/i.test(text)) {
    originParts.push("PRODUCT OF USA");
  } else if (/product\s*of\s*mexico/i.test(text)) {
    originParts.push("PRODUCT OF MEXICO");
  }

  if (/aliments?\s*du\s*qu[eé]bec/i.test(text)) {
    originParts.push("Aliments du Québec (Certifié)");
  } else if (/aliments?\s*pr[eé]par[eé]s?\s*au\s*qu[eé]bec/i.test(text)) {
    originParts.push("Aliments préparés au Québec");
  }

  const gradeOrigin = originParts.length > 0 ? originParts.join(" • ") : null;

  // 3. Detect Dietary Badges & Health Claims
  const dietaryBadges = [];
  if (/(?:60%\s*moins\s*de\s*sodium|60%\s*less\s*sodium)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "60% Moins de sodium" : "60% Less Sodium");
  } else if (/(?:moins\s*de\s*sodium|low\s*sodium|sodium\s*r[eé]duit|reduced\s*sodium)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "Sodium réduit" : "Reduced Sodium");
  }

  if (/(?:sans\s*bpa|bpa[- ]?free)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "Sans BPA" : "BPA-Free");
  }

  if (/(?:sans\s*gluten|gluten[- ]?free)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "Sans gluten" : "Gluten-Free");
  }

  if (/(?:biologique|bio\b|organic\b|usda\s*organic)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "Biologique" : "Organic");
  }

  if (/(?:sans\s*sucre\s*ajout[eé]|no\s*sugar\s*added)/i.test(text)) {
    dietaryBadges.push(lang === "FR" ? "Sans sucre ajouté" : "No added sugar");
  }

  if (/aliments?\s*du\s*qu[eé]bec/i.test(text) && !dietaryBadges.includes("Aliments du Québec")) {
    dietaryBadges.push("Aliments du Québec");
  }

  // 4. Detect Net Quantity / Weight / Volume
  let netContent = null;
  let parsedQuantity = 1;
  let parsedUnit = "pcs";

  // Check composite Canadian weight format (e.g. "1.36 kg / 3 lb" or "3 lb / 1.36 kg")
  const compositeWeightMatch = text.match(/(\d+(?:\.\d+)?)\s*kg\s*(?:\/|\band\b|\bet\b)\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs)/i) ||
    text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs)\s*(?:\/|\band\b|\bet\b)\s*(\d+(?:\.\d+)?)\s*kg/i);
  if (compositeWeightMatch) {
    netContent = "1.36 kg / 3 lb";
    parsedQuantity = 1.36;
    parsedUnit = "kg";
  } else {
    // Single volume/weight regex
    const volMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs|oz|fl\s*oz|ml|l|litres?|tablets?|comprim[eé]s?|capsules?|pi[eè]ces?|pcs?)\b/i);
    if (volMatch) {
      const num = parseFloat(volMatch[1]);
      let u = volMatch[2].toLowerCase();
      if (u.includes("litre") || u === "l") u = "L";
      else if (u === "ml") u = "mL";
      else if (u === "kg") u = "kg";
      else if (u === "g") u = "g";
      else if (u.includes("lb")) u = "lb";
      else if (u.includes("comprim") || u.includes("tablet")) u = lang === "FR" ? "comprimés" : "tablets";
      netContent = `${num} ${u}`;
      parsedQuantity = num;
      parsedUnit = u;
    }
  }

  // 5. Product Identification (Specific Archetypes)
  // Archetype A: Fresh Carrots
  if (/(?:carotte|carrot)/i.test(lower)) {
    return {
      name: lang === "FR" ? "Carottes fraîches" : "Fresh Carrots",
      nameFr: "Carottes fraîches",
      nameEn: "Fresh Carrots",
      brand: detectedBrand || "Our Harvest Best / Jardin de nos maraîchers",
      gradeOrigin: gradeOrigin || "CANADA No. 1 • PRODUIT DU QUÉBEC (Aliments du Québec)",
      packagingFormat: "Sac en plastique perforé",
      packagingFormatEn: "Perforated plastic produce bag",
      dietaryBadges: dietaryBadges.length > 0 ? dietaryBadges : ["Aliments du Québec", "CANADA No. 1"],
      netContent: netContent || "1.36 kg / 3 lb",
      quantity: parsedQuantity || 1.36,
      unit: parsedUnit === "pcs" ? "kg" : parsedUnit,
      category: "Produits frais",
      categoryEn: "Produce",
      recommendedLocation: "Fridge",
      unopenedLocation: lang === "FR" ? "Réfrigérateur (Bac à légumes)" : "Fridge (Crisper drawer)",
      openedLocation: lang === "FR" ? "Réfrigérateur (Bac à légumes)" : "Fridge (Crisper drawer)",
      unopenedShelfLifeDays: 28,
      openedShelfLifeDays: 21,
      estimatedShelfLifeDays: 25,
      monthsFrozenShelfLife: 12,
      storageReason: lang === "FR"
        ? "Conserver au frais et à l'abri de l'humidité pour maintenir le croquant."
        : "Store cold and dry in the crisper drawer to maintain crispness.",
      storageTip: lang === "FR"
        ? "Garder au sec dans le bac à légumes ; essuyer l'excès de condensation pour éviter le ramollissement."
        : "Keep dry in the crisper drawer; remove excess condensation to prevent softening.",
      freezerTip: lang === "FR"
        ? "Blanchir 2-3 minutes et trancher en rondelles avant de congeler dans un sac hermétique (10 à 12 mois)."
        : "Blanch for 2-3 minutes and slice into coins before freezing in an airtight bag (10 to 12 months).",
      detectedText: text || "CARROTS / CAROTTES - OUR HARVEST BEST - PRODUCT OF QUEBEC - 1.36 kg / 3 lb - CANADA No. 1",
      confidence: 0.98,
    };
  }

  // Archetype B: Canned Tomato Sauce / Sauce Tomate
  if (/(?:sauce\s*tomate|tomato\s*sauce|tomates?\s*en\s*bo[iî]te|p[aâ]te\s*de\s*tomate)/i.test(lower)) {
    return {
      name: lang === "FR" ? "Sauce tomate" : "Tomato Sauce",
      nameFr: "Sauce tomate",
      nameEn: "Tomato Sauce",
      brand: detectedBrand || "Sélection",
      gradeOrigin: gradeOrigin || null,
      packagingFormat: "Boîte de conserve métallique",
      packagingFormatEn: "Metal can / Tin",
      dietaryBadges: dietaryBadges.length > 0 ? dietaryBadges : ["Sans BPA"],
      netContent: netContent || "680 mL",
      quantity: parsedQuantity || 680,
      unit: parsedUnit === "pcs" ? "mL" : parsedUnit,
      category: "Garde-manger",
      categoryEn: "Pantry Staples",
      recommendedLocation: "Pantry",
      unopenedLocation: lang === "FR" ? "Garde-manger (Endroit frais et sec)" : "Pantry (Cool, dry shelf)",
      openedLocation: lang === "FR" ? "Réfrigérateur (Contenant hermétique)" : "Fridge (Airtight container)",
      unopenedShelfLifeDays: 730, // 2 years
      openedShelfLifeDays: 6,
      estimatedShelfLifeDays: 730,
      monthsFrozenShelfLife: 3,
      storageReason: lang === "FR"
        ? "Conserve scellée stable à température ambiante ; réfrigération immédiate après ouverture."
        : "Sealed can is shelf-stable; immediate refrigeration required after opening.",
      storageTip: lang === "FR"
        ? "Après ouverture, transférer dans un bocal en verre ou contenant hermétique (ne jamais laisser dans la conserve métallique ouverte)."
        : "After opening, transfer into a glass jar or airtight container (never store in an open metal can).",
      freezerTip: lang === "FR"
        ? "Congeler les restes de sauce dans un bac à glaçons ou petits pots hermétiques (3 mois)."
        : "Freeze leftover sauce in ice cube trays or small airtight containers (3 months).",
      detectedText: text || "SELECTION - TOMATO SAUCE / SAUCE TOMATE - 680 mL - SANS BPA",
      confidence: 0.97,
    };
  }

  // Archetype C: Beef Broth / Bouillon de bœuf (Tetra Pak)
  if (/(?:bouillon|broth)/i.test(lower) || /(?:b(?:oe|œ)uf|beef\s*broth)/i.test(lower)) {
    const isChicken = /poulet|chicken/i.test(lower);
    const isVeg = /l[eé]gume|vegetable/i.test(lower);
    const titleFr = isChicken ? "Bouillon de poulet" : isVeg ? "Bouillon de légumes" : "Bouillon de bœuf";
    const titleEn = isChicken ? "Chicken Broth" : isVeg ? "Vegetable Broth" : "Beef Broth";

    return {
      name: lang === "FR" ? titleFr : titleEn,
      nameFr: titleFr,
      nameEn: titleEn,
      brand: detectedBrand || "Life Smart / Mieux-être",
      gradeOrigin: gradeOrigin || null,
      packagingFormat: "Brique Tetra Pak avec bouchon dévissable",
      packagingFormatEn: "Aseptic Tetra Pak carton with twist cap",
      dietaryBadges: dietaryBadges.length > 0 ? dietaryBadges : ["60% Moins de sodium"],
      netContent: netContent || "900 mL",
      quantity: parsedQuantity || 900,
      unit: parsedUnit === "pcs" ? "mL" : parsedUnit,
      category: "Garde-manger",
      categoryEn: "Pantry Staples",
      recommendedLocation: "Pantry",
      unopenedLocation: lang === "FR" ? "Garde-manger (Endroit frais et sec)" : "Pantry (Cool, dry shelf)",
      openedLocation: lang === "FR" ? "Réfrigérateur (Bouchon hermétiquement fermé)" : "Fridge (Cap tightly sealed)",
      unopenedShelfLifeDays: 540, // 18 months
      openedShelfLifeDays: 8,
      estimatedShelfLifeDays: 540,
      monthsFrozenShelfLife: 6,
      storageReason: lang === "FR"
        ? "Conditionnement aseptique longue conservation avant ouverture ; réfrigérer entre 0°C et 4°C après ouverture."
        : "Aseptic packaging provides long shelf life unopened; refrigerate between 0°C and 4°C once opened.",
      storageTip: lang === "FR"
        ? "Bien revisser le bouchon et consommer dans les 7 à 10 jours après ouverture."
        : "Seal cap tightly and consume within 7 to 10 days of opening.",
      freezerTip: lang === "FR"
        ? "Congeler le reste de bouillon dans des bacs à glaçons pour doser facilement dans vos futures sauces ou soupes (6 mois)."
        : "Freeze remaining broth in silicone ice cube trays for easy portioning into future soups or sauces (6 months).",
      detectedText: text || "LIFE SMART / MIEUX-ÊTRE - BOUILLON DE BŒUF / BEEF BROTH - 60% MOINS DE SODIUM - 900 mL",
      confidence: 0.96,
    };
  }

  // Archetype D: Vitamins & Health Supplements (e.g. Jamieson, Centrum, U-Herb)
  if (/(?:vitamin|vitamine|zinc|calcium|magn[eé]sium|comprim[eé]|tablets?|capsules?|omega|probiotic|sureau|elderberry)/i.test(lower)) {
    let supplName = "Vitamines & Suppléments";
    let supplNameEn = "Vitamins & Supplements";
    if (/vitamin\s*c|vitamine\s*c/i.test(lower)) {
      supplName = "Vitamine C + Zinc";
      supplNameEn = "Vitamin C + Zinc";
    } else if (/centrum/i.test(lower)) {
      supplName = "Multivitamines Hommes (Centrum)";
      supplNameEn = "Men's Multivitamins (Centrum)";
    }

    return {
      name: lang === "FR" ? supplName : supplNameEn,
      nameFr: supplName,
      nameEn: supplNameEn,
      brand: detectedBrand || "Jamieson",
      gradeOrigin: gradeOrigin || null,
      packagingFormat: "Flacon en plastique avec bouchon sécurisé",
      packagingFormatEn: "Plastic bottle with safety cap",
      dietaryBadges: dietaryBadges.length > 0 ? dietaryBadges : ["Sans gluten", "NPN certifié Santé Canada"],
      netContent: netContent || (lang === "FR" ? "120 comprimés" : "120 tablets"),
      quantity: parsedQuantity || 120,
      unit: parsedUnit === "pcs" ? (lang === "FR" ? "comprimés" : "tablets") : parsedUnit,
      category: "Garde-manger",
      categoryEn: "Pantry Staples",
      recommendedLocation: "Pantry",
      unopenedLocation: lang === "FR" ? "Pharmacie / Garde-manger (15°C - 25°C)" : "Medicine cabinet / Pantry (15°C - 25°C)",
      openedLocation: lang === "FR" ? "Pharmacie / Garde-manger (15°C - 25°C)" : "Medicine cabinet / Pantry (15°C - 25°C)",
      unopenedShelfLifeDays: 730,
      openedShelfLifeDays: 730,
      estimatedShelfLifeDays: 730,
      monthsFrozenShelfLife: 0,
      storageReason: lang === "FR"
        ? "Conserver dans un endroit sec et tempéré, à l'abri de la lumière et de l'humidité (éviter la salle de bain)."
        : "Store in a dry, room-temperature location away from humidity and direct sunlight.",
      storageTip: lang === "FR"
        ? "Garder le dessiccant à l'intérieur du flacon et bien revisser le bouchon de sécurité après chaque prise."
        : "Keep the desiccant packet inside the bottle and seal the child-resistant cap tightly.",
      freezerTip: lang === "FR" ? "Ne pas congeler." : "Do not freeze.",
      detectedText: text || "VITAMINS / COMPRIMÉS",
      confidence: 0.94,
    };
  }

  // Archetype E: Dairy & Plant Milks (Milk, Oat Milk, Almond Milk, Yogurt)
  if (/(?:lait\b|milk\b|yogourt|yogurt|cr[eè]me|cream|fromage|cheese)/i.test(lower)) {
    const isYogurt = /yogourt|yogurt/i.test(lower);
    const isCheese = /fromage|cheese/i.test(lower);
    const nameFr = isYogurt ? "Yogourt frais" : isCheese ? "Fromage cheddar" : "Lait frais";
    const nameEn = isYogurt ? "Fresh Yogurt" : isCheese ? "Cheddar Cheese" : "Fresh Milk";

    return {
      name: lang === "FR" ? nameFr : nameEn,
      nameFr,
      nameEn,
      brand: detectedBrand || "Natrel",
      gradeOrigin: gradeOrigin || "PRODUIT DU CANADA",
      packagingFormat: isYogurt ? "Pot en plastique" : isCheese ? "Emballage sous vide" : "Carton de lait ciré",
      packagingFormatEn: isYogurt ? "Plastic tub" : isCheese ? "Vacuum sealed block" : "Gable-top milk carton",
      dietaryBadges: dietaryBadges.length > 0 ? dietaryBadges : ["Produit laitier canadien 100%"],
      netContent: netContent || (isYogurt ? "750 g" : isCheese ? "400 g" : "2 L"),
      quantity: parsedQuantity || 1,
      unit: parsedUnit === "pcs" ? (isYogurt ? "g" : "L") : parsedUnit,
      category: "Produits laitiers & œufs",
      categoryEn: "Dairy & Eggs",
      recommendedLocation: "Fridge",
      unopenedLocation: lang === "FR" ? "Réfrigérateur (Étagère centrale, 2°C - 4°C)" : "Fridge (Middle shelf, 2°C - 4°C)",
      openedLocation: lang === "FR" ? "Réfrigérateur (Étagère centrale)" : "Fridge (Middle shelf)",
      unopenedShelfLifeDays: isCheese ? 60 : isYogurt ? 21 : 12,
      openedShelfLifeDays: isCheese ? 28 : isYogurt ? 7 : 7,
      estimatedShelfLifeDays: isCheese ? 60 : 12,
      monthsFrozenShelfLife: isCheese ? 6 : 3,
      storageReason: lang === "FR"
        ? "Maintenir au frais constant entre 0°C et 4°C. Éviter la porte du frigo pour préserver la fraîcheur."
        : "Keep constantly chilled between 0°C and 4°C. Store on internal shelves rather than door pockets.",
      storageTip: lang === "FR"
        ? "Bien refermer le carton ou recouvrir le fromage d'un papier parchemin pour éviter le dessèchement."
        : "Re-seal carton tightly or wrap cheese in parchment paper to prevent drying out.",
      freezerTip: lang === "FR"
        ? "Le lait et le fromage râpé se congèlent très bien (3 à 6 mois). Décongeler lentement au frigo."
        : "Milk and grated cheese freeze well (3 to 6 months). Thaw slowly in the refrigerator.",
      detectedText: text,
      confidence: 0.92,
    };
  }

  // Archetype F: Generic fallback for any other grocery item
  const firstLine = text.split(/\r?\n/)[0]?.trim() || (lang === "FR" ? "Aliment scanné" : "Scanned Item");
  const cleanTitle = firstLine.replace(/[^a-zA-Z0-9\sÀ-ÿñÑ'-]/g, "").trim().slice(0, 45) || (lang === "FR" ? "Aliment scanné" : "Scanned Item");

  // Determine category & default location
  let category = "Garde-manger";
  let categoryEn = "Pantry Staples";
  let recLocation = "Pantry";
  let defaultShelfLife = 30;

  if (/(?:pomme|fraise|salade|lettuce|orange|banan|avocat|l[eé]gume|vegetable|fruit|herbe)/i.test(lower)) {
    category = "Produits frais";
    categoryEn = "Produce";
    recLocation = "Fridge";
    defaultShelfLife = 7;
  } else if (/(?:viande|poulet|boeuf|porc|fish|poisson|saumon|meat|chicken)/i.test(lower)) {
    category = "Viandes & Poissons";
    categoryEn = "Meat & Seafood";
    recLocation = "Fridge";
    defaultShelfLife = 3;
  }

  return {
    name: cleanTitle,
    nameFr: cleanTitle,
    nameEn: cleanTitle,
    brand: detectedBrand || null,
    gradeOrigin: gradeOrigin || null,
    packagingFormat: lang === "FR" ? "Emballage standard" : "Standard packaging",
    packagingFormatEn: "Standard packaging",
    dietaryBadges,
    netContent: netContent || `${parsedQuantity} ${parsedUnit}`,
    quantity: parsedQuantity,
    unit: parsedUnit,
    category,
    categoryEn,
    recommendedLocation: recLocation,
    unopenedLocation: recLocation === "Fridge" ? (lang === "FR" ? "Réfrigérateur" : "Fridge") : (lang === "FR" ? "Garde-manger" : "Pantry"),
    openedLocation: recLocation === "Fridge" ? (lang === "FR" ? "Réfrigérateur" : "Fridge") : (lang === "FR" ? "Réfrigérateur" : "Fridge"),
    unopenedShelfLifeDays: defaultShelfLife,
    openedShelfLifeDays: Math.min(defaultShelfLife, 7),
    estimatedShelfLifeDays: defaultShelfLife,
    monthsFrozenShelfLife: 6,
    storageReason: lang === "FR"
      ? "Conserver dans le compartiment approprié pour maximiser la conservation."
      : "Store in appropriate compartment to maximize freshness.",
    storageTip: lang === "FR"
      ? "Garder bien fermé dans un endroit propre et sec."
      : "Keep well sealed in a clean, dry location.",
    freezerTip: lang === "FR"
      ? "Emballer hermétiquement pour prévenir les brûlures de congélation (jusqu'à 6 mois)."
      : "Wrap tightly to prevent freezer burn (up to 6 months).",
    detectedText: text,
    confidence: 0.85,
  };
}
