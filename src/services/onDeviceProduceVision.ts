/**
 * Open-Source On-Device Produce Vision Classifier
 * 
 * Uses MobileNet & TensorFlow.js running 100% locally in the browser via WebGL/WASM.
 * Cross-references ImageNet & Fruits-360 labels with the Canadian Nutrient File (CNF)
 * and IFPS Global PLU produce standards.
 */

/**
 * Open-Source On-Device Produce Vision Classifier & PLU Identifier
 * 
 * Uses MobileNet & TensorFlow.js running 100% locally in the browser via WebGL/WASM,
 * augmented with real-time Canvas color/chroma histogram heuristics and optical PLU detection.
 * Cross-referenced with the Canadian Nutrient File (CNF - Health Canada) and
 * the IFPS Global PLU produce standards used across Canadian supermarkets (Metro, IGA, Super C, Maxi, Loblaws).
 */

export interface ProduceAlternative {
  name: string;
  nameFr: string;
  nameEn: string;
  pluCode?: string;
  confidence: number;
  location: 'Fridge' | 'Pantry' | 'Freezer';
  shelfLife: number;
}

export interface ProduceClassificationResult {
  detectedLabel: string;
  confidence: number;
  isProduce: boolean;
  sourceMethod: 'mobilenet' | 'plu_sticker' | 'color_chroma' | 'keyword';
  item: {
    name: string;
    nameFr: string;
    nameEn: string;
    pluCode?: string;
    category: string;
    categoryEn: string;
    recommendedLocation: 'Fridge' | 'Pantry' | 'Freezer';
    estimatedShelfLifeDays: number;
    monthsFrozenShelfLife: number;
    brand: string;
    gradeOrigin: string;
    packagingFormat: string;
    dietaryBadges: string[];
    storageTip: string;
    storageReason: string;
    freezerTip: string;
    calories?: number;
    nutritionSummary?: string;
  } | null;
  alternatives: ProduceAlternative[];
}

export interface ProduceDetails {
  nameFr: string;
  nameEn: string;
  pluCode?: string;
  location: 'Fridge' | 'Pantry' | 'Freezer';
  shelfLife: number;
  originFr: string;
  originEn: string;
  storageTipFr: string;
  storageTipEn: string;
  freezerTipFr: string;
  freezerTipEn: string;
  calories: number;
  category: 'Produce';
  targetHueRange?: [number, number]; // approx HSV hue 0-360
  keywords?: string[];
}

// Comprehensive catalog of Canadian grocery fresh produce (fruits, vegetables, herbs)
export const PRODUCE_MAPPING: Record<string, ProduceDetails> = {
  // --- TROPICAL FRUITS & MANGOES ---
  mango: {
    nameFr: 'Mangue rouge fraîche (Tommy Atkins / Kent)',
    nameEn: 'Fresh Red Mango (Tommy Atkins / Kent)',
    pluCode: '4051',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'No. 1 • Pastille PLU #4051 (Mexique / Brésil)',
    originEn: 'No. 1 • PLU Sticker #4051 (Imported)',
    storageTipFr: 'Mûrir à température ambiante sur le comptoir. Transférer au réfrigérateur une fois souple et parfumée.',
    storageTipEn: 'Ripen at room temperature on counter. Move to fridge once aromatic and yielding to gentle touch.',
    freezerTipFr: 'Peler, trancher la chair en dés autour du noyau plat et congeler sur une plaque pour smoothies.',
    freezerTipEn: 'Peel, dice flesh around flat stone, and freeze flat on a parchment tray for smoothies.',
    calories: 60,
    category: 'Produce',
    targetHueRange: [15, 55],
    keywords: ['mango', 'mangue', 'tommy', 'kent', '4051'],
  },
  'honey mango': {
    nameFr: 'Mangue Ataulfo (Mangue miel dorée)',
    nameEn: 'Ataulfo Honey Mango',
    pluCode: '4312',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'No. 1 • Pastille PLU #4312 (Mexique)',
    originEn: 'No. 1 • PLU Sticker #4312 (Mexico)',
    storageTipFr: 'Prête à déguster lorsque la peau devient dorée et légèrement plissée.',
    storageTipEn: 'Ready when skin turns deep golden yellow and slightly wrinkles.',
    freezerTipFr: 'Couper en dés sans fibres et congeler en portions.',
    freezerTipEn: 'Dice fiber-free flesh and freeze in individual smoothie pouches.',
    calories: 62,
    category: 'Produce',
    targetHueRange: [38, 55],
    keywords: ['ataulfo', 'honey mango', 'mangue miel', 'champagne mango', '4312'],
  },
  banana: {
    nameFr: 'Bananes jaunes fraîches',
    nameEn: 'Fresh Yellow Bananas',
    pluCode: '4011',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'No. 1 • Pastille PLU #4011 (Cavendish)',
    originEn: 'No. 1 • PLU Sticker #4011 (Cavendish)',
    storageTipFr: 'Garder sur le comptoir à l’air libre. Ne pas réfrigérer entière pour éviter le noircissement de la peau.',
    storageTipEn: 'Store at room temperature. Do not refrigerate whole peel to avoid dark skin.',
    freezerTipFr: 'Peler et congeler en rondelles pour crème glacée minute ou pain aux bananes.',
    freezerTipEn: 'Peel and freeze in slices for smoothies or banana bread.',
    calories: 89,
    category: 'Produce',
    targetHueRange: [45, 65],
    keywords: ['banana', 'banane', 'cavendish', '4011'],
  },
  pineapple: {
    nameFr: 'Ananas frais doré (Golden Ripe)',
    nameEn: 'Fresh Golden Pineapple',
    pluCode: '4430',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'No. 1 • Pastille PLU #4430 (Costa Rica)',
    originEn: 'No. 1 • PLU Sticker #4430 (Costa Rica)',
    storageTipFr: 'Conserver sur le comptoir. Réfrigérer immédiatement après découpe dans un contenant hermétique.',
    storageTipEn: 'Keep on counter stem-down until cut, then refrigerate in airtight container.',
    freezerTipFr: 'Couper en cubes et congeler à plat pour smoothies et brochettes.',
    freezerTipEn: 'Cut into cubes and freeze flat on parchment for smoothies.',
    calories: 50,
    category: 'Produce',
    targetHueRange: [30, 55],
    keywords: ['pineapple', 'ananas', '4430'],
  },
  avocado: {
    nameFr: 'Avocats Hass frais',
    nameEn: 'Fresh Hass Avocados',
    pluCode: '4046',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'No. 1 • Pastille PLU #4046 (Mexique)',
    originEn: 'No. 1 • PLU Sticker #4046 (Mexico)',
    storageTipFr: 'Mûrir sur le comptoir. Une fois la peau foncée et souple, transférer au frigo pour stopper le mûrissement.',
    storageTipEn: 'Ripen on counter. Once dark and slightly soft, transfer to fridge to pause ripening.',
    freezerTipFr: 'Écraser la chair avec un filet de jus de lime et congeler en sachet hermétique sans air.',
    freezerTipEn: 'Mash with a splash of lime juice and freeze in an airtight bag.',
    calories: 160,
    category: 'Produce',
    targetHueRange: [70, 120],
    keywords: ['avocado', 'avocat', 'guacamole', 'hass', '4046', '4225'],
  },

  // --- APPLES & PEARS ---
  apple: {
    nameFr: 'Pommes McIntosh du Québec',
    nameEn: 'Fresh Quebec McIntosh Apples',
    pluCode: '4152',
    location: 'Fridge',
    shelfLife: 30,
    originFr: 'Vergers du Québec • Aliments du Québec • PLU #4152',
    originEn: 'Quebec Orchards • Canadian Grown • PLU #4152',
    storageTipFr: 'Conserver au réfrigérateur dans le bac à faible humidité pour préserver le croquant.',
    storageTipEn: 'Keep refrigerated in the low-humidity crisper drawer.',
    freezerTipFr: 'Cuire en compote ou congeler tranchée avec du citron pour tartes et croustades.',
    freezerTipEn: 'Cook into compote or freeze in slices with lemon for apple crisp.',
    calories: 52,
    category: 'Produce',
    targetHueRange: [340, 20],
    keywords: ['apple', 'pomme', 'mcintosh', '4152'],
  },
  'gala apple': {
    nameFr: 'Pommes Gala fraîches',
    nameEn: 'Fresh Gala Apples',
    pluCode: '4133',
    location: 'Fridge',
    shelfLife: 28,
    originFr: 'Canada No. 1 • Pastille PLU #4133',
    originEn: 'Canada No. 1 • PLU #4133',
    storageTipFr: 'Conserver au frais pour préserver le croquant sucré.',
    storageTipEn: 'Refrigerate to preserve natural crisp sweetness.',
    freezerTipFr: 'Épépiner, trancher et congeler à plat.',
    freezerTipEn: 'Core, slice and freeze flat on parchment.',
    calories: 52,
    category: 'Produce',
    targetHueRange: [10, 35],
    keywords: ['gala', '4133'],
  },
  'honeycrisp apple': {
    nameFr: 'Pommes Honeycrisp de l’Ontario / Québec',
    nameEn: 'Honeycrisp Apples',
    pluCode: '4173',
    location: 'Fridge',
    shelfLife: 35,
    originFr: 'Vergers canadiens • Pastille PLU #4173',
    originEn: 'Canadian Orchards • PLU #4173',
    storageTipFr: 'Pomme extra croquante et juteuse. Réfrigérer en permanence.',
    storageTipEn: 'Extra crisp and juicy. Keep constantly chilled in crisper.',
    freezerTipFr: 'Tranches arrosées de jus de citron avant congélation.',
    freezerTipEn: 'Toss slices with lemon juice before freezing.',
    calories: 57,
    category: 'Produce',
    keywords: ['honeycrisp', '4173'],
  },
  'granny smith': {
    nameFr: 'Pommes vertes Granny Smith',
    nameEn: 'Granny Smith Green Apples',
    pluCode: '4017',
    location: 'Fridge',
    shelfLife: 30,
    originFr: 'No. 1 • Pastille PLU #4017',
    originEn: 'No. 1 • PLU Sticker #4017',
    storageTipFr: 'Conserver au bac à légumes du réfrigérateur pour préserver le croquant acidulé.',
    storageTipEn: 'Store in refrigerator crisper drawer to maintain crisp tartness.',
    freezerTipFr: 'Peler, épépiner et trancher avec un filet de jus de citron avant de congeler pour tartes.',
    freezerTipEn: 'Peel, core, slice and toss with lemon juice before freezing for pies.',
    calories: 52,
    category: 'Produce',
    targetHueRange: [80, 120],
    keywords: ['granny smith', 'green apple', 'pomme verte', '4017'],
  },
  pear: {
    nameFr: 'Poires Bartlett / Bosc fraîches',
    nameEn: 'Fresh Bartlett / Bosc Pears',
    pluCode: '4409',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Canada No. 1 • Pastille PLU #4409',
    originEn: 'Canada No. 1 • PLU #4409',
    storageTipFr: 'Mûrir sur le comptoir jusqu’à ce que le collet cède légèrement sous le pouce, puis réfrigérer.',
    storageTipEn: 'Ripen at room temperature until neck yields to pressure, then chill.',
    freezerTipFr: 'Peler, pocher dans un sirop léger et congeler.',
    freezerTipEn: 'Peel, core, poach lightly in syrup and freeze.',
    calories: 57,
    category: 'Produce',
    keywords: ['pear', 'poire', 'bartlett', 'bosc', '4409'],
  },

  // --- CITRUS ---
  lemon: {
    nameFr: 'Citrons jaunes frais',
    nameEn: 'Fresh Yellow Lemons',
    pluCode: '4053',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'No. 1 • Pastille PLU #4053',
    originEn: 'No. 1 • PLU Sticker #4053',
    storageTipFr: 'Au réfrigérateur dans un sac fermé pour préserver tout le jus jusqu’à 3 semaines.',
    storageTipEn: 'Refrigerate in a sealed zip bag to keep juicy for up to 3 weeks.',
    freezerTipFr: 'Presser le jus dans des bacs à glaçons et zester l’écorce avant de congeler.',
    freezerTipEn: 'Freeze freshly squeezed juice in ice cube trays and zest rind.',
    calories: 29,
    category: 'Produce',
    targetHueRange: [50, 65],
    keywords: ['lemon', 'citron', '4053'],
  },
  lime: {
    nameFr: 'Limes fraîches (Citrons verts)',
    nameEn: 'Fresh Limes',
    pluCode: '4048',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'No. 1 • Pastille PLU #4048 (Mexique)',
    originEn: 'No. 1 • PLU Sticker #4048',
    storageTipFr: 'Garder au bac à légumes pour éviter le durcissement de l’écorce.',
    storageTipEn: 'Keep in crisper drawer to avoid skin drying out.',
    freezerTipFr: 'Congeler le jus en cubes ou les demi-limes pour cocktails.',
    freezerTipEn: 'Freeze lime juice in cubes for cocktails and cooking.',
    calories: 30,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['lime', 'citron vert', '4048'],
  },
  orange: {
    nameFr: 'Oranges Navel douces sans pépins',
    nameEn: 'Navel Sweet Oranges',
    pluCode: '4012',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'No. 1 • Pastille PLU #4012',
    originEn: 'No. 1 • PLU Sticker #4012',
    storageTipFr: 'Conserver au réfrigérateur pour prolonger la fraîcheur.',
    storageTipEn: 'Store chilled in fruit crisper for longer life.',
    freezerTipFr: 'Peler à vif, séparer les suprêmes et congeler à plat.',
    freezerTipEn: 'Peel, segment, and freeze flat for fruit smoothies.',
    calories: 47,
    category: 'Produce',
    targetHueRange: [20, 40],
    keywords: ['orange', 'navel', 'clementine', 'mandarin', '4012'],
  },

  // --- BERRIES & MELONS ---
  strawberry: {
    nameFr: 'Fraises fraîches sucrées',
    nameEn: 'Fresh Sweet Strawberries',
    pluCode: '4249',
    location: 'Fridge',
    shelfLife: 4,
    originFr: 'Île d’Orléans / Québec • Pastille PLU #4249',
    originEn: 'Canadian Berries • PLU #4249',
    storageTipFr: 'Conserver au frigo non lavées avec un papier absorbant dans le contenant ajouré.',
    storageTipEn: 'Store unwashed with paper towel in original vented clamshell.',
    freezerTipFr: 'Équeuter et congeler entières sur une plaque pour smoothies et desserts.',
    freezerTipEn: 'Hull stems and freeze whole on a sheet pan.',
    calories: 32,
    category: 'Produce',
    targetHueRange: [345, 15],
    keywords: ['strawberry', 'fraise', '4249'],
  },
  blueberry: {
    nameFr: 'Bleuets frais du Lac-Saint-Jean',
    nameEn: 'Fresh Wild Blueberries',
    pluCode: '4240',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Bleuets du Lac-Saint-Jean, Québec • PLU #4240',
    originEn: 'Product of Quebec / Canada • PLU #4240',
    storageTipFr: 'Conserver au frigo sans laver avant consommation.',
    storageTipEn: 'Keep refrigerated and dry until ready to eat.',
    freezerTipFr: 'Congeler directement tels quels sans laver pour qu’ils restent intacts.',
    freezerTipEn: 'Freeze directly on tray unwashed, pack in bags.',
    calories: 57,
    category: 'Produce',
    targetHueRange: [220, 260],
    keywords: ['blueberry', 'bleuet', 'myrtille', '4240'],
  },
  watermelon: {
    nameFr: 'Pastèque entière sans pépins (Melon d’eau)',
    nameEn: 'Seedless Watermelon',
    pluCode: '4032',
    location: 'Pantry',
    shelfLife: 10,
    originFr: 'No. 1 • Pastille PLU #4032',
    originEn: 'No. 1 • PLU #4032',
    storageTipFr: 'Conserver entière à température ambiante. Réfrigérer immédiatement après découpe.',
    storageTipEn: 'Store whole at room temperature. Refrigerate sliced wedges in airtight wrap.',
    freezerTipFr: 'Couper en cubes sans pépins et congeler pour granités ou cocktails.',
    freezerTipEn: 'Cube flesh and freeze for slushies or drinks.',
    calories: 30,
    category: 'Produce',
    keywords: ['watermelon', 'melon', 'pastèque', '4032'],
  },
  cantaloupe: {
    nameFr: 'Cantaloup frais (Melon brodé)',
    nameEn: 'Fresh Cantaloupe',
    pluCode: '4050',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'No. 1 • Pastille PLU #4050',
    originEn: 'No. 1 • PLU #4050',
    storageTipFr: 'Mûrir sur le comptoir. Réfrigérer dès qu’il dégage un parfum sucré.',
    storageTipEn: 'Countertop until fragrant, then refrigerate.',
    freezerTipFr: 'Boules ou cubes de melon congelés pour smoothies.',
    freezerTipEn: 'Freeze melon balls on baking sheet.',
    calories: 34,
    category: 'Produce',
    keywords: ['cantaloupe', 'cantaloup', '4050'],
  },

  // --- VEGETABLES ---
  tomato: {
    nameFr: 'Tomates de serre sur vigne (Savoura / Mirabel)',
    nameEn: 'Fresh Greenhouse Vine Tomatoes',
    pluCode: '4065',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Serres du Québec • Aliments du Québec • PLU #4065',
    originEn: 'Canadian Greenhouse • PLU #4065',
    storageTipFr: 'Conserver sur le comptoir à température ambiante pour préserver toute la saveur juteuse. Ne jamais réfrigérer crue.',
    storageTipEn: 'Store stem-side up on counter. Never refrigerate raw vine tomatoes to preserve texture.',
    freezerTipFr: 'Congeler entières lavées : la peau se détache facilement à l’eau tiède pour les sauces.',
    freezerTipEn: 'Freeze whole; skins will slip off easily under warm water for sauces.',
    calories: 18,
    category: 'Produce',
    targetHueRange: [350, 15],
    keywords: ['tomato', 'tomate', 'savoura', 'mirabel', '4065', '4087'],
  },
  cucumber: {
    nameFr: 'Concombre anglais sans pépins',
    nameEn: 'English Seedless Cucumber',
    pluCode: '4062',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Serres du Québec / Ontario • Pastille PLU #4062',
    originEn: 'Canadian Greenhouse • PLU #4062',
    storageTipFr: 'Garder dans sa pellicule d’origine dans la partie médiane du réfrigérateur.',
    storageTipEn: 'Keep in original plastic wrap in the middle fridge shelf.',
    freezerTipFr: 'Ne se congèle pas entier en raison de sa haute teneur en eau.',
    freezerTipEn: 'Not recommended for freezing due to high water content.',
    calories: 15,
    category: 'Produce',
    targetHueRange: [90, 140],
    keywords: ['cucumber', 'concombre', '4062'],
  },
  'bell pepper': {
    nameFr: 'Poivrons doux rouges / variés',
    nameEn: 'Sweet Bell Peppers',
    pluCode: '4088',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Canada No. 1 • Pastille PLU #4088',
    originEn: 'Canada No. 1 • PLU #4088',
    storageTipFr: 'Conserver bien sec dans le bac à légumes.',
    storageTipEn: 'Store completely dry in crisper drawer.',
    freezerTipFr: 'Couper en lanières et congeler cru pour fajitas ou sautés (sans blanchir).',
    freezerTipEn: 'Slice into strips and freeze raw for stir-fries and fajitas without blanching.',
    calories: 31,
    category: 'Produce',
    targetHueRange: [0, 60],
    keywords: ['bell pepper', 'poivron', 'pepper', '4088', '4688'],
  },
  broccoli: {
    nameFr: 'Couronnes de brocoli frais',
    nameEn: 'Fresh Broccoli Crowns',
    pluCode: '4060',
    location: 'Fridge',
    shelfLife: 6,
    originFr: 'Produit du Canada • Pastille PLU #4060',
    originEn: 'Product of Canada • PLU #4060',
    storageTipFr: 'Conserver non lavé dans un sac plastique entrouvert au réfrigérateur.',
    storageTipEn: 'Keep unwashed in a loose plastic bag in crisper drawer.',
    freezerTipFr: 'Blanchir les fleurons 3 minutes dans l’eau bouillante avant de congeler.',
    freezerTipEn: 'Blanch florets for 3 minutes in boiling water before freezing.',
    calories: 34,
    category: 'Produce',
    targetHueRange: [85, 140],
    keywords: ['broccoli', 'brocoli', '4060'],
  },
  cauliflower: {
    nameFr: 'Chou-fleur blanc frais',
    nameEn: 'Fresh White Cauliflower',
    pluCode: '4079',
    location: 'Fridge',
    shelfLife: 9,
    originFr: 'Canada No. 1 • Pastille PLU #4079',
    originEn: 'Canada No. 1 • PLU Sticker #4079',
    storageTipFr: 'Conserver tige vers le haut au réfrigérateur pour éviter l’humidité.',
    storageTipEn: 'Store stem-side up in fridge to prevent moisture accumulation.',
    freezerTipFr: 'Blanchir 3 minutes puis congeler à plat sur une plaque.',
    freezerTipEn: 'Blanch for 3 minutes, then freeze flat on a tray.',
    calories: 25,
    category: 'Produce',
    keywords: ['cauliflower', 'chou-fleur', '4079'],
  },
  carrot: {
    nameFr: 'Carottes fraîches du Québec',
    nameEn: 'Fresh Quebec Carrots',
    pluCode: '4562',
    location: 'Fridge',
    shelfLife: 25,
    originFr: 'Québec, Canada • Aliments du Québec • PLU #4562',
    originEn: 'Product of Quebec, Canada • PLU #4562',
    storageTipFr: 'Conserver au bac à légumes bien fermé dans un sachet perforé pour éviter le ramollissement.',
    storageTipEn: 'Store in vegetable crisper in closed plastic bag to retain moisture.',
    freezerTipFr: 'Couper en rondelles et blanchir 2 minutes avant de congeler.',
    freezerTipEn: 'Slice and blanch for 2 minutes before freezing.',
    calories: 41,
    category: 'Produce',
    targetHueRange: [20, 42],
    keywords: ['carrot', 'carotte', '4562'],
  },
  potato: {
    nameFr: 'Pommes de terre Russet / jaunes du Québec',
    nameEn: 'Quebec Yellow / Russet Potatoes',
    pluCode: '4072',
    location: 'Pantry',
    shelfLife: 35,
    originFr: 'Québec, Canada • Pastille PLU #4072',
    originEn: 'Quebec, Canada • PLU #4072',
    storageTipFr: 'Garder dans un endroit frais, sombre et aéré. Ne pas réfrigérer pour éviter la transformation de l’amidon en sucre.',
    storageTipEn: 'Store in a cool, dark, dry pantry away from onions. Never refrigerate.',
    freezerTipFr: 'Cuire ou blanchir avant de congeler (les pommes de terre crues noircissent).',
    freezerTipEn: 'Cook or parboil before freezing; raw potatoes do not freeze well.',
    calories: 77,
    category: 'Produce',
    keywords: ['potato', 'pomme de terre', 'patate', 'russet', '4072'],
  },
  onion: {
    nameFr: 'Oignons jaunes du Québec',
    nameEn: 'Fresh Yellow Onions',
    pluCode: '4093',
    location: 'Pantry',
    shelfLife: 30,
    originFr: 'Québec, Canada • Aliments du Québec • PLU #4093',
    originEn: 'Quebec Grown • PLU #4093',
    storageTipFr: 'Endroit sec, frais et bien ventilé. Éloigner des pommes de terre.',
    storageTipEn: 'Dry, cool, ventilated pantry. Keep separate from potatoes.',
    freezerTipFr: 'Hacher et congeler cru dans des sacs hermétiques.',
    freezerTipEn: 'Chop and freeze raw in portioned bags.',
    calories: 40,
    category: 'Produce',
    keywords: ['onion', 'oignon', '4093', '4082'],
  },
  zucchini: {
    nameFr: 'Courgettes vertes (Zucchini)',
    nameEn: 'Green Zucchini',
    pluCode: '4067',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Canada No. 1 • Pastille PLU #4067',
    originEn: 'Canada No. 1 • PLU Sticker #4067',
    storageTipFr: 'Conserver au bac à légumes sans emballage étanche.',
    storageTipEn: 'Store in crisper drawer in loose wrap.',
    freezerTipFr: 'Râper et presser l’excédent d’eau avant de congeler pour pains et muffins.',
    freezerTipEn: 'Grate and squeeze out excess moisture before freezing for baking.',
    calories: 17,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['zucchini', 'courgette', '4067'],
  },
  mushroom: {
    nameFr: 'Champignons blancs frais',
    nameEn: 'Fresh White Mushrooms',
    pluCode: '4085',
    location: 'Fridge',
    shelfLife: 6,
    originFr: 'Champignons du Québec / Ontario • PLU #4085',
    originEn: 'Canadian Grown • PLU #4085',
    storageTipFr: 'Conserver dans un sac en papier brun au réfrigérateur.',
    storageTipEn: 'Store in a breathable brown paper bag in fridge.',
    freezerTipFr: 'Faire sauter dans un peu d’huile avant de congeler.',
    freezerTipEn: 'Sauté lightly in oil before freezing for optimal texture.',
    calories: 22,
    category: 'Produce',
    keywords: ['mushroom', 'champignon', 'agaric', '4085'],
  },
  corn: {
    nameFr: 'Maïs frais en épi (Blé d’Inde du Québec)',
    nameEn: 'Fresh Sweet Corn on the Cob',
    pluCode: '4078',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Québec, Canada (Blé d’Inde frais) • PLU #4078',
    originEn: 'Canadian Sweet Corn • PLU #4078',
    storageTipFr: 'Conserver dans ses feuilles au réfrigérateur pour préserver les sucres naturels.',
    storageTipEn: 'Keep husks on in fridge to prevent sugar converting to starch.',
    freezerTipFr: 'Blanchir 4 minutes, égrener et congeler en grains sous vide.',
    freezerTipEn: 'Blanch for 4 minutes, cut kernels off cob, and freeze in bags.',
    calories: 86,
    category: 'Produce',
    keywords: ['corn', 'maïs', 'blé dinde', '4078'],
  },
  // Classes from Marcus Klasson GroceryStoreDataset (WACV 2019)
  eggplant: {
    nameFr: 'Aubergine fraîche (Eggplant)',
    nameEn: 'Fresh Eggplant (Aubergine)',
    pluCode: '4081',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Canada No. 1 • Pastille PLU #4081',
    originEn: 'Canada No. 1 • PLU Sticker #4081',
    storageTipFr: 'Conserver dans le bac à légumes à 10°C ou au frigo dans un sac aéré.',
    storageTipEn: 'Keep in crisper drawer in breathable bag.',
    freezerTipFr: 'Trancher, cuire ou griller avant de congeler.',
    freezerTipEn: 'Slice and roast before freezing for cooked dishes.',
    calories: 25,
    category: 'Produce',
    keywords: ['eggplant', 'aubergine', '4081'],
  },
  beetroot: {
    nameFr: 'Betteraves rouges fraîches',
    nameEn: 'Fresh Red Beetroot',
    pluCode: '4539',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'Légume racine du Québec • PLU #4539',
    originEn: 'Fresh Root Vegetable • PLU #4539',
    storageTipFr: 'Couper les fanes et conserver les racines au bac à légumes.',
    storageTipEn: 'Trim greens and store root globes in fridge crisper.',
    freezerTipFr: 'Cuire à la vapeur, peler, trancher et congeler.',
    freezerTipEn: 'Steam, peel, slice and freeze.',
    calories: 43,
    category: 'Produce',
    keywords: ['beet', 'beetroot', 'betterave', '4539'],
  },
  leek: {
    nameFr: 'Poireaux frais',
    nameEn: 'Fresh Leeks',
    pluCode: '4629',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Poireaux du Québec • PLU #4629',
    originEn: 'Fresh Leeks • PLU #4629',
    storageTipFr: 'Conserver non lavé au réfrigérateur dans un sac plastique perforé.',
    storageTipEn: 'Store unwashed in fridge in loosely wrapped bag.',
    freezerTipFr: 'Émincer, bien rincer le sable, blanchir 1 minute et congeler.',
    freezerTipEn: 'Slice, wash grit, blanch 1 min and freeze.',
    calories: 61,
    category: 'Produce',
    keywords: ['leek', 'poireau', '4629'],
  },
  pomegranate: {
    nameFr: 'Grenade fraîche entière',
    nameEn: 'Fresh Whole Pomegranate',
    pluCode: '4445',
    location: 'Pantry',
    shelfLife: 14,
    originFr: 'Pastille PLU #4445 (Importée)',
    originEn: 'PLU Sticker #4445 (Imported)',
    storageTipFr: 'Garder sur le comptoir à l’abri du soleil ou au frigo jusqu’à 1 mois.',
    storageTipEn: 'Keep at room temperature away from direct sunlight, or fridge up to 1 month.',
    freezerTipFr: 'Égrener et congeler les arilles sur une plaque.',
    freezerTipEn: 'Extract seeds (arils) and freeze loose on tray.',
    calories: 83,
    category: 'Produce',
    keywords: ['pomegranate', 'grenade', '4445'],
  },
  'passion fruit': {
    nameFr: 'Fruit de la passion (Maracuja)',
    nameEn: 'Fresh Passion Fruit',
    pluCode: '4397',
    location: 'Pantry',
    shelfLife: 10,
    originFr: 'Pastille PLU #4397 (Exotique)',
    originEn: 'PLU Sticker #4397 (Exotic)',
    storageTipFr: 'Conserver à température ambiante jusqu’à ce que la peau se ride.',
    storageTipEn: 'Store at room temperature until skin is dimpled and wrinkled.',
    freezerTipFr: 'Évider la pulpe et congeler dans un bac à glaçons.',
    freezerTipEn: 'Scoop out pulp and freeze in ice cube trays.',
    calories: 97,
    category: 'Produce',
    keywords: ['passion fruit', 'fruit de la passion', 'maracuja', '4397'],
  },
  'conference pear': {
    nameFr: 'Poires Conférence',
    nameEn: 'Conference Pears',
    pluCode: '4414',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Pastille PLU #4414',
    originEn: 'PLU Sticker #4414',
    storageTipFr: 'Mûrir sur le comptoir. Déplacer au réfrigérateur une fois le col souple.',
    storageTipEn: 'Ripen at room temperature; refrigerate once neck yields.',
    freezerTipFr: 'Peler, couper en quartiers avec un peu de jus de citron et congeler.',
    freezerTipEn: 'Peel, core, toss with lemon juice, and freeze.',
    calories: 57,
    category: 'Produce',
    keywords: ['conference pear', 'poire conference', '4414'],
  },
  'golden delicious apple': {
    nameFr: 'Pommes Golden Delicious',
    nameEn: 'Golden Delicious Apples',
    pluCode: '4020',
    location: 'Fridge',
    shelfLife: 28,
    originFr: 'Canada No. 1 • Pastille PLU #4020',
    originEn: 'Canada No. 1 • PLU Sticker #4020',
    storageTipFr: 'Conserver au bac à légumes pour garder leur texture croquante et douce.',
    storageTipEn: 'Store in crisper drawer to maintain sweet crispness.',
    freezerTipFr: 'Peler, trancher avec un filet de citron et congeler.',
    freezerTipEn: 'Peel, slice, and freeze for pies or crisps.',
    calories: 52,
    category: 'Produce',
    keywords: ['golden delicious', 'pomme jaune', '4020'],
  },
  'pink lady apple': {
    nameFr: 'Pommes Pink Lady (Cripps Pink)',
    nameEn: 'Pink Lady Apples',
    pluCode: '4128',
    location: 'Fridge',
    shelfLife: 30,
    originFr: 'Canada No. 1 • Pastille PLU #4128',
    originEn: 'Canada No. 1 • PLU Sticker #4128',
    storageTipFr: 'Garder au frais au réfrigérateur.',
    storageTipEn: 'Keep cold in the refrigerator.',
    freezerTipFr: 'Peler et congeler en tranches.',
    freezerTipEn: 'Peel and freeze in slices.',
    calories: 54,
    category: 'Produce',
    keywords: ['pink lady', 'cripps pink', '4128'],
  },
};

// Singleton model reference cached in browser memory
let cachedModel: any = null;
let isModelInitializing = false;

/**
 * Initializes and caches the lightweight MobileNet model in memory
 */
export async function getProduceVisionModel(): Promise<any> {
  if (cachedModel) return cachedModel;
  if (isModelInitializing) {
    while (isModelInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return cachedModel;
  }

  isModelInitializing = true;
  try {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const mobilenet = await import('@tensorflow-models/mobilenet');
    
    // Load lightweight MobileNet v2 with alpha 0.5 (~4 MB, high speed on mobile/desktop)
    cachedModel = await mobilenet.load({
      version: 2,
      alpha: 0.5,
    });
    console.info('[ProduceVision] MobileNet on-device vision model loaded successfully.');
    return cachedModel;
  } catch (err) {
    console.warn('[ProduceVision] Error loading on-device MobileNet model:', err);
    throw err;
  } finally {
    isModelInitializing = false;
  }
}

/**
 * Samples center region of an image canvas to extract dominant HSV hue & saturation.
 * Used as a fast, robust visual fallback.
 */
export function extractProduceColorProfile(
  canvas: HTMLCanvasElement
): { hue: number; saturation: number; brightness: number; dominantColorName: string } {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { hue: 0, saturation: 0, brightness: 0, dominantColorName: 'unknown' };
  }

  // Sample central 50% of the image to ignore outer background
  const startX = Math.floor(canvas.width * 0.25);
  const startY = Math.floor(canvas.height * 0.25);
  const sampleW = Math.max(1, Math.floor(canvas.width * 0.5));
  const sampleH = Math.max(1, Math.floor(canvas.height * 0.5));

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  let totalR = 0, totalG = 0, totalB = 0;
  let count = 0;

  // Step by 4 pixels for performance
  for (let i = 0; i < data.length; i += 16) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    count++;
  }

  if (count === 0) return { hue: 0, saturation: 0, brightness: 0, dominantColorName: 'unknown' };

  const r = totalR / count / 255;
  const g = totalG / count / 255;
  const b = totalB / count / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = max === 0 ? 0 : (max - min) / max;
  let v = max;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = h / 6;
  }

  const hueDeg = Math.round(h * 360);
  const satPct = Math.round(s * 100);
  const briPct = Math.round(v * 100);

  let dominantColorName = 'unknown';
  if (satPct < 15) {
    dominantColorName = briPct > 60 ? 'white/pale' : 'neutral/grey';
  } else if (hueDeg >= 345 || hueDeg < 15) {
    dominantColorName = 'red';
  } else if (hueDeg >= 15 && hueDeg < 45) {
    dominantColorName = 'orange/amber';
  } else if (hueDeg >= 45 && hueDeg < 70) {
    dominantColorName = 'yellow';
  } else if (hueDeg >= 70 && hueDeg < 165) {
    dominantColorName = 'green';
  } else if (hueDeg >= 165 && hueDeg < 260) {
    dominantColorName = 'cyan/blue';
  } else {
    dominantColorName = 'purple';
  }

  return { hue: hueDeg, saturation: satPct, brightness: briPct, dominantColorName };
}

/**
 * Searches for a 4-digit IFPS PLU code in text (e.g. #4051, PLU 4011, 4046)
 */
export function extractPluCode(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\b(?:PLU\s*#?|#)?([3489]\d{3})\b/i);
  return match ? match[1] : null;
}

/**
 * Classifies an image element, video frame, or canvas on-device
 * and matches it with our Canadian & IFPS PLU produce catalog.
 */
export async function classifyProduceOnDevice(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  language = 'FR',
  stickerOcrText?: string
): Promise<ProduceClassificationResult> {
  const isFr = (language || 'FR').toUpperCase().startsWith('FR');

  // Check 1: Optical PLU sticker detection from OCR
  if (stickerOcrText) {
    const detectedPlu = extractPluCode(stickerOcrText);
    if (detectedPlu) {
      for (const [key, info] of Object.entries(PRODUCE_MAPPING)) {
        if (info.pluCode === detectedPlu) {
          return buildClassificationResult(key, info, 0.98, 'plu_sticker', isFr, []);
        }
      }
    }
  }

  // Check 2: MobileNet on-device inference
  try {
    const model = await getProduceVisionModel();
    if (model) {
      const predictions: Array<{ className: string; probability: number }> = await model.classify(imageSource, 8);
      if (predictions && predictions.length > 0) {
        console.info('[ProduceVision] Top Predictions:', predictions);

        const candidates: Array<{ key: string; info: ProduceDetails; prob: number; rawClass: string }> = [];

        for (const pred of predictions) {
          const lowerClass = pred.className.toLowerCase();

          for (const [key, info] of Object.entries(PRODUCE_MAPPING)) {
            const hasKeywordMatch = info.keywords?.some((kw) => lowerClass.includes(kw));
            if (lowerClass.includes(key) || key.includes(lowerClass.split(',')[0].trim()) || hasKeywordMatch) {
              if (!candidates.some((c) => c.key === key)) {
                candidates.push({ key, info, prob: pred.probability, rawClass: pred.className });
              }
            }
          }
        }

        if (candidates.length > 0) {
          // Sort by probability descending
          candidates.sort((a, b) => b.prob - a.prob);
          const best = candidates[0];

          // Require reasonable confidence threshold (>= 0.38) to avoid falsely misclassifying packaged foods (like yogurt) as produce
          if (best.prob >= 0.38) {
            const alternatives: ProduceAlternative[] = candidates.slice(1, 4).map((c) => ({
              name: isFr ? c.info.nameFr : c.info.nameEn,
              nameFr: c.info.nameFr,
              nameEn: c.info.nameEn,
              pluCode: c.info.pluCode,
              confidence: Math.round(c.prob * 100),
              location: c.info.location,
              shelfLife: c.info.shelfLife,
            }));

            return buildClassificationResult(best.key, best.info, best.prob, 'mobilenet', isFr, alternatives);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[ProduceVision] MobileNet inference error:', err);
  }

  // Not a fresh fruit or vegetable
  return {
    detectedLabel: 'Non identifié',
    confidence: 0,
    isProduce: false,
    sourceMethod: 'mobilenet',
    item: null,
    alternatives: [],
  };
}

function buildClassificationResult(
  key: string,
  info: ProduceDetails,
  confidence: number,
  method: 'mobilenet' | 'plu_sticker' | 'color_chroma' | 'keyword',
  isFr: boolean,
  alternatives: ProduceAlternative[]
): ProduceClassificationResult {
  const name = isFr ? info.nameFr : info.nameEn;
  const reason = method === 'plu_sticker'
    ? (isFr ? `Identifié via pastille PLU #${info.pluCode}` : `Identified via PLU sticker #${info.pluCode}`)
    : method === 'color_chroma'
    ? (isFr ? 'Identifié via profil chromatique & couleur' : 'Identified via color & chroma profile')
    : (isFr ? 'Identifié par vision IA locale MobileNet (Fruits & Légumes)' : 'Identified by on-device MobileNet vision (Produce)');

  return {
    detectedLabel: key,
    confidence,
    isProduce: true,
    sourceMethod: method,
    item: {
      name,
      nameFr: info.nameFr,
      nameEn: info.nameEn,
      pluCode: info.pluCode,
      category: isFr ? 'Produits frais' : 'Produce',
      categoryEn: 'Produce',
      recommendedLocation: info.location,
      estimatedShelfLifeDays: info.shelfLife,
      monthsFrozenShelfLife: 10,
      brand: info.originFr.includes('Québec') ? 'Produits du Québec' : 'Sélection Fruits Frais',
      gradeOrigin: isFr ? info.originFr : info.originEn,
      packagingFormat: isFr ? 'Fruit/légume frais en vrac' : 'Whole fresh loose produce',
      dietaryBadges: [
        'Produits frais',
        ...(info.pluCode ? [`Code PLU #${info.pluCode}`] : []),
        ...(info.originFr.includes('Québec') ? ['Aliments du Québec'] : []),
      ],
      storageTip: isFr ? info.storageTipFr : info.storageTipEn,
      storageReason: reason,
      freezerTip: isFr ? info.freezerTipFr : info.freezerTipEn,
      calories: info.calories,
      nutritionSummary: `${info.calories} kcal • 100% frais`,
    },
    alternatives,
  };
}

