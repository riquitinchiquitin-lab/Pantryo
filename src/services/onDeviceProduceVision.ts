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

import { findCatalogItemByClass } from './groceryModelCatalog';

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
    keywords: ['strawberry', 'strawberries', 'fraise', 'fraises', '4249', 'garden strawberry'],
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
    keywords: ['blueberry', 'blueberries', 'bleuet', 'bleuets', 'myrtille', 'myrtilles', '4240'],
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
    keywords: ['eggplant', 'talong', 'aubergine', '4081'],
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

  // --- COMPREHENSIVE PRODUCE ADDITIONS (Fruits, Berries, Stone Fruits, Greens, Roots & Herbs) ---
  raspberry: {
    nameFr: 'Framboises fraîches du Québec',
    nameEn: 'Fresh Sweet Raspberries',
    pluCode: '4252',
    location: 'Fridge',
    shelfLife: 3,
    originFr: 'Québec / Canada • Pastille PLU #4252',
    originEn: 'Product of Canada • PLU #4252',
    storageTipFr: 'Très délicates : conserver au frigo sur papier absorbant, consommer rapidement.',
    storageTipEn: 'Very delicate: store cold on paper towel, eat quickly.',
    freezerTipFr: 'Congeler à plat sur une plaque sans contact, puis ensacher hermétiquement.',
    freezerTipEn: 'Flash-freeze flat on sheet pan without touching, then transfer to bag.',
    calories: 52,
    category: 'Produce',
    targetHueRange: [340, 10],
    keywords: ['raspberry', 'raspberries', 'framboise', 'framboises', '4252'],
  },
  blackberry: {
    nameFr: 'Mûres fraîches juteuses',
    nameEn: 'Fresh Blackberries',
    pluCode: '4251',
    location: 'Fridge',
    shelfLife: 4,
    originFr: 'Importé / Canada • PLU #4251',
    originEn: 'Fresh Berries • PLU #4251',
    storageTipFr: 'Conserver au réfrigérateur non lavées dans leur barquette d’origine.',
    storageTipEn: 'Refrigerate unwashed in original ventilated clamshell.',
    freezerTipFr: 'Congeler entières sur plaque avant de mettre en sac.',
    freezerTipEn: 'Flash-freeze whole on tray before bagging.',
    calories: 43,
    category: 'Produce',
    targetHueRange: [270, 320],
    keywords: ['blackberry', 'blackberries', 'mure', 'mûre', 'mures', 'mûres', '4251'],
  },
  cherry: {
    nameFr: 'Cerises douces rouges fraîches',
    nameEn: 'Fresh Sweet Red Cherries',
    pluCode: '4045',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Colombie-Britannique / Canada No. 1 • PLU #4045',
    originEn: 'Sweet Cherries • PLU #4045',
    storageTipFr: 'Conserver au froid dans un sac entrouvert, laver juste avant de déguster.',
    storageTipEn: 'Keep cold in perforated bag, wash immediately before serving.',
    freezerTipFr: 'Équeuter, dénoyauter et congeler en portions.',
    freezerTipEn: 'Stem, pit, and freeze in single layer.',
    calories: 63,
    category: 'Produce',
    targetHueRange: [340, 15],
    keywords: ['cherry', 'cherries', 'cerise', 'cerises', 'bing', 'rainier', '4045'],
  },
  grape: {
    nameFr: 'Raisins frais sans pépins (Verts / Rouges)',
    nameEn: 'Fresh Seedless Grapes',
    pluCode: '4022',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'No. 1 • Pastille PLU #4022 / #4023',
    originEn: 'No. 1 • PLU #4022 / #4023',
    storageTipFr: 'Conserver au bac à légumes dans leur sachet d’origine ventilé. Ne pas laver avant de manger.',
    storageTipEn: 'Store unwashed in original vented plastic bag in crisper.',
    freezerTipFr: 'Égrener, laver, sécher et congeler entiers pour un bonbon glacé sain et rafraîchissant.',
    freezerTipEn: 'Wash, dry, and freeze loose grapes on a tray for frozen bite-size snacks.',
    calories: 69,
    category: 'Produce',
    keywords: ['grape', 'grapes', 'raisin', 'raisins', '4022', '4023'],
  },
  peach: {
    nameFr: 'Pêches fraîches juteuses',
    nameEn: 'Fresh Sweet Peaches',
    pluCode: '4038',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Ontario / Niagara • Canada No. 1 • PLU #4038',
    originEn: 'Fresh Peaches • PLU #4038',
    storageTipFr: 'Mûrir tige vers le bas à température ambiante. Réfrigérer dès que la chair devient souple.',
    storageTipEn: 'Ripen at room temperature stem-down. Move to fridge once soft.',
    freezerTipFr: 'Peler, couper en quartiers avec un filet de jus de citron et congeler.',
    freezerTipEn: 'Peel, slice into wedges with lemon juice, and freeze.',
    calories: 39,
    category: 'Produce',
    targetHueRange: [15, 45],
    keywords: ['peach', 'peaches', 'pêche', 'peche', 'pêches', '4038', '4044'],
  },
  nectarine: {
    nameFr: 'Nectarines fraîches sucrées',
    nameEn: 'Fresh Sweet Nectarines',
    pluCode: '4036',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Ontario / Californie • PLU #4036',
    originEn: 'Fresh Nectarines • PLU #4036',
    storageTipFr: 'Conserver sur le comptoir jusqu’à maturité parfumée, puis réfrigérer.',
    storageTipEn: 'Store on counter until fragrant, then refrigerate.',
    freezerTipFr: 'Couper en quartiers et congeler à plat.',
    freezerTipEn: 'Slice into wedges and freeze flat.',
    calories: 44,
    category: 'Produce',
    keywords: ['nectarine', 'nectarines', '4036'],
  },
  plum: {
    nameFr: 'Prunes fraîches (Rouges / Noires)',
    nameEn: 'Fresh Plums',
    pluCode: '4040',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Canada No. 1 • Pastille PLU #4040',
    originEn: 'Fresh Plums • PLU #4040',
    storageTipFr: 'Mûrir sur le comptoir. Transférer au réfrigérateur lorsqu’elles cèdent sous la pression.',
    storageTipEn: 'Ripen at room temperature, refrigerate when yielding to touch.',
    freezerTipFr: 'Couper en deux, dénoyauter et congeler à plat.',
    freezerTipEn: 'Halve, pit, and freeze cut-side down.',
    calories: 46,
    category: 'Produce',
    keywords: ['plum', 'plums', 'prune', 'prunes', '4040', '4042'],
  },
  apricot: {
    nameFr: 'Abricots frais veloutés',
    nameEn: 'Fresh Sweet Apricots',
    pluCode: '4218',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Canada / Importé • PLU #4218',
    originEn: 'Fresh Apricots • PLU #4218',
    storageTipFr: 'Mûrir à température ambiante, puis réfrigérer.',
    storageTipEn: 'Ripen at room temperature, then store in fridge.',
    freezerTipFr: 'Dénoyauter et congeler en moitiés.',
    freezerTipEn: 'Halve, remove pit, and freeze.',
    calories: 48,
    category: 'Produce',
    keywords: ['apricot', 'apricots', 'abricot', 'abricots', '4218'],
  },
  kiwi: {
    nameFr: 'Kiwis verts frais',
    nameEn: 'Fresh Green Kiwifruit',
    pluCode: '4030',
    location: 'Pantry',
    shelfLife: 14,
    originFr: 'No. 1 • Pastille PLU #4030',
    originEn: 'No. 1 • PLU Sticker #4030',
    storageTipFr: 'Mûrir à température ambiante avec une pomme, ou conserver au frigo jusqu’à 3 semaines.',
    storageTipEn: 'Ripen on counter or refrigerate up to 3 weeks.',
    freezerTipFr: 'Peler, trancher et congeler en rondelles pour smoothies.',
    freezerTipEn: 'Peel, slice, and freeze flat for blending.',
    calories: 61,
    category: 'Produce',
    targetHueRange: [75, 110],
    keywords: ['kiwi', 'kiwis', 'kiwifruit', '4030', '3279'],
  },
  grapefruit: {
    nameFr: 'Pamplemousse rose / rouge de Floride',
    nameEn: 'Florida Pink / Red Grapefruit',
    pluCode: '4282',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'No. 1 • Pastille PLU #4282',
    originEn: 'No. 1 • PLU #4282',
    storageTipFr: 'Conserver au réfrigérateur ou sur le comptoir jusqu’à 10 jours.',
    storageTipEn: 'Keep refrigerated or on counter up to 10 days.',
    freezerTipFr: 'Peler à vif, lever les suprêmes et congeler dans leur jus.',
    freezerTipEn: 'Segment into sections and freeze in juice.',
    calories: 42,
    category: 'Produce',
    keywords: ['grapefruit', 'pamplemousse', 'pomelo', '4282'],
  },
  clementine: {
    nameFr: 'Clémentines douces / Mandarines fraîches',
    nameEn: 'Sweet Clementines / Mandarins',
    pluCode: '4450',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Importé • Pastille PLU #4450',
    originEn: 'Imported • PLU #4450',
    storageTipFr: 'Conserver au frais au réfrigérateur ou dans une caissette aérée.',
    storageTipEn: 'Store in cool crisper drawer or ventilated box.',
    freezerTipFr: 'Peler, séparer les quartiers et congeler pour collations rafraîchissantes.',
    freezerTipEn: 'Peel, separate segments, and freeze on tray.',
    calories: 47,
    category: 'Produce',
    targetHueRange: [20, 45],
    keywords: ['clementine', 'clémentine', 'clementines', 'mandarin', 'mandarine', 'tangerine', '4450'],
  },
  papaya: {
    nameFr: 'Papaye fraîche douce',
    nameEn: 'Fresh Sweet Papaya',
    pluCode: '4394',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Exotique • Pastille PLU #4394',
    originEn: 'Exotic • PLU #4394',
    storageTipFr: 'Conserver sur le comptoir jusqu’à ce que la peau jaunisse, puis réfrigérer.',
    storageTipEn: 'Ripen at room temp until skin yellows, then refrigerate.',
    freezerTipFr: 'Couper en dés et congeler pour smoothies exotiques.',
    freezerTipEn: 'Cube flesh and freeze for smoothies.',
    calories: 43,
    category: 'Produce',
    keywords: ['papaya', 'papaye', '4394'],
  },
  fig: {
    nameFr: 'Figues fraîches Black Mission',
    nameEn: 'Fresh Black Mission Figs',
    pluCode: '4266',
    location: 'Fridge',
    shelfLife: 4,
    originFr: 'Pastille PLU #4266',
    originEn: 'PLU Sticker #4266',
    storageTipFr: 'Très périssables : conserver au réfrigérateur en une seule couche sur essuie-tout.',
    storageTipEn: 'Highly perishable: refrigerate in single layer on paper towel.',
    freezerTipFr: 'Congeler entières ou coupées en deux sur une plaque.',
    freezerTipEn: 'Freeze whole or halved on baking sheet.',
    calories: 74,
    category: 'Produce',
    keywords: ['fig', 'figs', 'figue', 'figues', '4266'],
  },
  lettuce: {
    nameFr: 'Laitue romaine fraîche / Cœurs de romaine',
    nameEn: 'Fresh Romaine Lettuce Hearts',
    pluCode: '4640',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Québec / Canada • Aliments du Québec • PLU #4640',
    originEn: 'Quebec / Canadian Grown • PLU #4640',
    storageTipFr: 'Conserver au bac à légumes avec un essuie-tout pour absorber l’humidité.',
    storageTipEn: 'Store in crisper drawer wrapped loosely with a paper towel.',
    freezerTipFr: 'Ne se congèle pas crue (salade).',
    freezerTipEn: 'Not suitable for raw salad freezing.',
    calories: 17,
    category: 'Produce',
    targetHueRange: [85, 135],
    keywords: ['lettuce', 'laitue', 'romaine', 'salade', '4640', '4061'],
  },
  iceberg: {
    nameFr: 'Laitue Iceberg croquante',
    nameEn: 'Crisp Iceberg Lettuce',
    pluCode: '4061',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'No. 1 • Pastille PLU #4061',
    originEn: 'No. 1 • PLU #4061',
    storageTipFr: 'Garder la tête entière au frigo dans son emballage plastique.',
    storageTipEn: 'Keep whole head in crisper drawer in wrap.',
    freezerTipFr: 'Ne pas congeler.',
    freezerTipEn: 'Do not freeze.',
    calories: 14,
    category: 'Produce',
    keywords: ['iceberg', '4061'],
  },
  spinach: {
    nameFr: 'Bébés épinards frais',
    nameEn: 'Fresh Baby Spinach',
    pluCode: '4090',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Québec / Ontario • PLU #4090',
    originEn: 'Canadian Grown • PLU #4090',
    storageTipFr: 'Conserver bien au sec dans un contenant hermétique avec papier absorbant.',
    storageTipEn: 'Keep completely dry in sealed container with paper towel.',
    freezerTipFr: 'Blanchir 1 minute et presser l’eau, ou congeler cru directement pour les smoothies.',
    freezerTipEn: 'Blanch 1 min or freeze raw leaves directly for smoothies.',
    calories: 23,
    category: 'Produce',
    targetHueRange: [90, 140],
    keywords: ['spinach', 'epinard', 'épinard', 'épinards', '4090'],
  },
  kale: {
    nameFr: 'Chou frisé / Kale vert frais',
    nameEn: 'Fresh Curly Green Kale',
    pluCode: '4627',
    location: 'Fridge',
    shelfLife: 9,
    originFr: 'Québec • Aliments du Québec • PLU #4627',
    originEn: 'Product of Canada • PLU #4627',
    storageTipFr: 'Conserver au bac à légumes dans un sachet plastique entrouvert.',
    storageTipEn: 'Store in crisper drawer in loose plastic bag.',
    freezerTipFr: 'Retirer les tiges dures, hacher les feuilles et congeler cru pour soupes et smoothies.',
    freezerTipEn: 'Strip leaves from tough stems, chop, and freeze raw.',
    calories: 49,
    category: 'Produce',
    targetHueRange: [90, 145],
    keywords: ['kale', 'chou frise', 'chou frisé', '4627'],
  },
  celery: {
    nameFr: 'Pied de céleri branche croquant',
    nameEn: 'Crisp Celery Stalk',
    pluCode: '4070',
    location: 'Fridge',
    shelfLife: 18,
    originFr: 'Canada No. 1 • Pastille PLU #4070',
    originEn: 'Canada No. 1 • PLU #4070',
    storageTipFr: 'Envelopper le pied entier dans du papier aluminium au frigo pour garder le croquant.',
    storageTipEn: 'Wrap whole head in aluminum foil in fridge to preserve moisture and crispness.',
    freezerTipFr: 'Hacher et congeler cru pour bases de sauces (mirepoix, soupes).',
    freezerTipEn: 'Chop and freeze raw for soup and mirepoix bases.',
    calories: 14,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['celery', 'celeri', 'céleri', '4070'],
  },
  asparagus: {
    nameFr: 'Asperges vertes fraîches',
    nameEn: 'Fresh Green Asparagus',
    pluCode: '4080',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Québec / Ontario • Canada No. 1 • PLU #4080',
    originEn: 'Product of Canada • PLU #4080',
    storageTipFr: 'Placer les tiges debout dans 2 cm d’eau au frigo comme un bouquet de fleurs.',
    storageTipEn: 'Stand upright in 1 inch of water in the fridge like fresh flowers.',
    freezerTipFr: 'Couper la base dure, blanchir 2 minutes et congeler.',
    freezerTipEn: 'Snap off woody ends, blanch 2 min, and freeze.',
    calories: 20,
    category: 'Produce',
    targetHueRange: [80, 135],
    keywords: ['asparagus', 'asperge', 'asperges', '4080'],
  },
  cabbage: {
    nameFr: 'Chou vert frais entier',
    nameEn: 'Fresh Green Cabbage',
    pluCode: '4069',
    location: 'Fridge',
    shelfLife: 30,
    originFr: 'Québec • Aliments du Québec • PLU #4069',
    originEn: 'Quebec Grown • PLU #4069',
    storageTipFr: 'Garder la tête entière au bac à légumes jusqu’à un mois.',
    storageTipEn: 'Keep whole head in crisper drawer up to a month.',
    freezerTipFr: 'Émincer, blanchir 1 minute et congeler.',
    freezerTipEn: 'Shred, blanch for 1 minute, and freeze.',
    calories: 25,
    category: 'Produce',
    keywords: ['cabbage', 'chou', 'chou vert', '4069', '4555'],
  },
  'bok choy': {
    nameFr: 'Bok choy / Pak choï frais',
    nameEn: 'Fresh Baby Bok Choy',
    pluCode: '4545',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Serres du Québec / Ontario • PLU #4545',
    originEn: 'Canadian Greenhouse • PLU #4545',
    storageTipFr: 'Conserver non lavé dans un sac plastique aéré au réfrigérateur.',
    storageTipEn: 'Store unwashed in perforated plastic bag in crisper.',
    freezerTipFr: 'Blanchir 2 minutes avant de congeler pour sautés asiatiques.',
    freezerTipEn: 'Blanch for 2 minutes before freezing for stir-fries.',
    calories: 13,
    category: 'Produce',
    targetHueRange: [85, 140],
    keywords: ['bok choy', 'pak choi', 'pak choy', 'bokchoy', '4545'],
  },
  'brussels sprouts': {
    nameFr: 'Choux de Bruxelles frais',
    nameEn: 'Fresh Brussels Sprouts',
    pluCode: '4550',
    location: 'Fridge',
    shelfLife: 12,
    originFr: 'Québec / Ontario • PLU #4550',
    originEn: 'Canadian Grown • PLU #4550',
    storageTipFr: 'Conserver au bac à légumes dans un contenant respirant.',
    storageTipEn: 'Store in crisper drawer in ventilated container.',
    freezerTipFr: 'Parer, blanchir 3 minutes et congeler à plat.',
    freezerTipEn: 'Trim stems, blanch for 3 minutes, and flash-freeze.',
    calories: 43,
    category: 'Produce',
    keywords: ['brussels sprouts', 'choux de bruxelles', 'chou de bruxelles', '4550'],
  },
  radish: {
    nameFr: 'Radis rouges croquants en botte',
    nameEn: 'Crisp Red Radishes',
    pluCode: '4089',
    location: 'Fridge',
    shelfLife: 12,
    originFr: 'Québec • Aliments du Québec • PLU #4089',
    originEn: 'Product of Quebec • PLU #4089',
    storageTipFr: 'Couper les fanes et immerger les radis dans un bocal d’eau au frigo pour un croquant parfait.',
    storageTipEn: 'Cut green tops off and store submerged in water jar in fridge for maximum crunch.',
    freezerTipFr: 'Ne se congèle pas cru en raison de la texture aqueuse.',
    freezerTipEn: 'Not recommended for freezing raw.',
    calories: 16,
    category: 'Produce',
    targetHueRange: [340, 15],
    keywords: ['radish', 'radis', '4089'],
  },
  turnip: {
    nameFr: 'Rutabaga / Navet jaune du Québec',
    nameEn: 'Yellow Rutabaga (Turnip)',
    pluCode: '4747',
    location: 'Pantry',
    shelfLife: 45,
    originFr: 'Québec • Aliments du Québec • PLU #4747',
    originEn: 'Quebec Yellow Rutabaga • PLU #4747',
    storageTipFr: 'Conserver dans un endroit frais et sombre (chambre froide ou bas du réfrigérateur).',
    storageTipEn: 'Store in cool, dark pantry or cellar.',
    freezerTipFr: 'Couper en dés, blanchir 3 minutes ou cuire en purée avant de congeler.',
    freezerTipEn: 'Cube, blanch 3 min or freeze as cooked mash.',
    calories: 37,
    category: 'Produce',
    keywords: ['turnip', 'rutabaga', 'navet', '4747'],
  },
  'sweet potato': {
    nameFr: 'Patates douces orangées (Yams)',
    nameEn: 'Fresh Sweet Potatoes (Yams)',
    pluCode: '4816',
    location: 'Pantry',
    shelfLife: 28,
    originFr: 'Canada No. 1 • Pastille PLU #4816',
    originEn: 'Canada No. 1 • PLU #4816',
    storageTipFr: 'Conserver dans un garde-manger frais, sec et sombre. Ne jamais réfrigérer crue.',
    storageTipEn: 'Store in cool, dark, dry pantry. Never refrigerate raw.',
    freezerTipFr: 'Cuire au four ou bouillir en purée avant de congeler.',
    freezerTipEn: 'Bake, roast, or mash before freezing.',
    calories: 86,
    category: 'Produce',
    targetHueRange: [15, 40],
    keywords: ['sweet potato', 'patate douce', 'yam', '4816'],
  },
  'butternut squash': {
    nameFr: 'Courge Butternut musquée',
    nameEn: 'Butternut Squash',
    pluCode: '4759',
    location: 'Pantry',
    shelfLife: 60,
    originFr: 'Québec • Aliments du Québec • PLU #4759',
    originEn: 'Canadian Squash • PLU #4759',
    storageTipFr: 'Conserver entière à température ambiante dans un endroit sec jusqu’à 3 mois.',
    storageTipEn: 'Keep whole at room temperature in dry spot up to 3 months.',
    freezerTipFr: 'Peler, couper en cubes et congeler cru ou rôti.',
    freezerTipEn: 'Peel, cube, and freeze raw or roasted.',
    calories: 45,
    category: 'Produce',
    targetHueRange: [30, 50],
    keywords: ['butternut', 'courge', 'courge butternut', '4759'],
  },
  'green bean': {
    nameFr: 'Haricots verts frais du Québec',
    nameEn: 'Fresh Green Beans',
    pluCode: '4066',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Québec • Aliments du Québec • PLU #4066',
    originEn: 'Canadian Green Beans • PLU #4066',
    storageTipFr: 'Conserver non lavés dans un sachet entrouvert au bac à légumes.',
    storageTipEn: 'Store unwashed in perforated bag in crisper.',
    freezerTipFr: 'Équeuter, blanchir 2 minutes et congeler à plat.',
    freezerTipEn: 'Trim ends, blanch for 2 minutes, and flash-freeze.',
    calories: 31,
    category: 'Produce',
    targetHueRange: [85, 135],
    keywords: ['green bean', 'green beans', 'haricot', 'haricots', 'haricots verts', '4066'],
  },
  'green onion': {
    nameFr: 'Oignons verts / Échalotes fraîches en botte',
    nameEn: 'Green Onions (Scallions)',
    pluCode: '4068',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Québec • Aliments du Québec • PLU #4068',
    originEn: 'Green Onions • PLU #4068',
    storageTipFr: 'Mettre les racines dans un petit verre avec 1 cm d’eau au frigo pour les garder ultra-croquants.',
    storageTipEn: 'Place roots in a small jar of water in the fridge to stay crisp.',
    freezerTipFr: 'Ciseler et congeler cru dans une bouteille ou un bocal en verre.',
    freezerTipEn: 'Chop and freeze raw in a clean glass jar for instant garnishes.',
    calories: 32,
    category: 'Produce',
    targetHueRange: [80, 140],
    keywords: ['green onion', 'scallion', 'scallions', 'echalote', 'échalote', 'oignon vert', '4068'],
  },
  garlic: {
    nameFr: 'Bulbe d’ail frais',
    nameEn: 'Fresh Garlic Bulb',
    pluCode: '4608',
    location: 'Pantry',
    shelfLife: 60,
    originFr: 'Ail du Québec / Importé • PLU #4608',
    originEn: 'Fresh Garlic • PLU #4608',
    storageTipFr: 'Conserver la tête entière dans un endroit sec, sombre et aéré à température ambiante.',
    storageTipEn: 'Keep whole head in cool, dry, dark pantry with good airflow. Never refrigerate.',
    freezerTipFr: 'Éplucher les gousses et congeler entières ou hachées dans de l’huile.',
    freezerTipEn: 'Peel cloves and freeze whole or minced.',
    calories: 149,
    category: 'Produce',
    keywords: ['garlic', 'ail', '4608'],
  },
  ginger: {
    nameFr: 'Racine de gingembre frais',
    nameEn: 'Fresh Ginger Root',
    pluCode: '4612',
    location: 'Fridge',
    shelfLife: 28,
    originFr: 'Importé • Pastille PLU #4612',
    originEn: 'Fresh Ginger • PLU #4612',
    storageTipFr: 'Conserver non pelé dans un sac hermétique sans air au bac à légumes.',
    storageTipEn: 'Store unpeeled in airtight plastic bag in crisper.',
    freezerTipFr: 'Congeler la racine entière : se râpe facilement congelée sans décongélation préalable.',
    freezerTipEn: 'Freeze root whole; gratings shred effortlessly while still frozen.',
    calories: 80,
    category: 'Produce',
    keywords: ['ginger', 'gingembre', '4612'],
  },
  basil: {
    nameFr: 'Basilic frais parfumé en pot ou bouquet',
    nameEn: 'Fresh Sweet Basil',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Herbes fraîches du Québec',
    originEn: 'Fresh Canadian Herbs',
    storageTipFr: 'Conserver les tiges dans un verre d’eau à température ambiante comme un bouquet. Ne pas réfrigérer (le froid noircit les feuilles).',
    storageTipEn: 'Keep stems in water jar on countertop like flowers. Do not refrigerate (cold blackens leaves).',
    freezerTipFr: 'Hacher et congeler dans de l’huile d’olive dans des bacs à glaçons.',
    freezerTipEn: 'Chop and freeze in olive oil in ice cube trays.',
    calories: 22,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['basil', 'basilic'],
  },
  parsley: {
    nameFr: 'Persil frais (Frisé / Italien)',
    nameEn: 'Fresh Parsley (Curly / Flat Leaf)',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Herbes fraîches locales',
    originEn: 'Fresh Local Herbs',
    storageTipFr: 'Tailler les tiges et placer dans un bocal d’eau couvert au frigo.',
    storageTipEn: 'Trim stems and keep upright in water jar covered with bag in fridge.',
    freezerTipFr: 'Hacher et congeler en bocal hermétique.',
    freezerTipEn: 'Chop and freeze in airtight container.',
    calories: 36,
    category: 'Produce',
    targetHueRange: [85, 140],
    keywords: ['parsley', 'persil'],
  },
  cilantro: {
    nameFr: 'Coriandre fraîche en botte',
    nameEn: 'Fresh Cilantro (Coriander)',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Herbes fraîches',
    originEn: 'Fresh Herbs',
    storageTipFr: 'Tiges dans un bocal d’eau au réfrigérateur couvert d’un sachet plastique.',
    storageTipEn: 'Stand stems in water jar covered loosely with plastic bag in fridge.',
    freezerTipFr: 'Ciseler et congeler dans de l’huile.',
    freezerTipEn: 'Chop and freeze in oil or butter cubes.',
    calories: 23,
    category: 'Produce',
    targetHueRange: [85, 140],
    keywords: ['cilantro', 'coriandre', 'coriander'],
  },

  // --- ASIAN & WORLD SPECIALTY PRODUCE ---
  'dragon fruit': {
    nameFr: 'Fruit du dragon / Pitaya frais (Chair blanche ou rouge)',
    nameEn: 'Fresh Dragon Fruit (Pitaya)',
    pluCode: '3040',
    location: 'Pantry',
    shelfLife: 8,
    originFr: 'Vietnam / Mexique • Pastille PLU #3040',
    originEn: 'Fresh Pitaya • PLU #3040',
    storageTipFr: 'Garder à température ambiante jusqu’à maturité souple, puis réfrigérer pour déguster bien frais.',
    storageTipEn: 'Store at room temperature until yielding slightly to gentle touch, then chill before eating.',
    freezerTipFr: 'Couper en dés sans la peau rose et congeler pour smoothies vibrants.',
    freezerTipEn: 'Scoop flesh out of pink rind, cube, and freeze for dragon fruit smoothie bowls.',
    calories: 60,
    category: 'Produce',
    targetHueRange: [320, 355],
    keywords: ['dragon fruit', 'dragonfruit', 'pitaya', 'fruit du dragon', '3040'],
  },
  lychee: {
    nameFr: 'Litchis frais sucrés',
    nameEn: 'Fresh Sweet Lychees',
    pluCode: '4303',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Asie / Madagascar • PLU #4303',
    originEn: 'Fresh Lychees • PLU #4303',
    storageTipFr: 'Envelopper dans du papier absorbant au réfrigérateur pour éviter le dessèchement de la coque.',
    storageTipEn: 'Wrap in paper towel in plastic bag in fridge to prevent shell drying out.',
    freezerTipFr: 'Peler, dénoyauter et congeler la pulpe translucide.',
    freezerTipEn: 'Peel, pit, and freeze juicy white flesh.',
    calories: 66,
    category: 'Produce',
    targetHueRange: [340, 15],
    keywords: ['lychee', 'litchi', 'litchis', '4303'],
  },
  longan: {
    nameFr: 'Longanes frais (Œil de dragon)',
    nameEn: 'Fresh Longan Fruit',
    pluCode: '4307',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Thaïlande / Vietnam • PLU #4307',
    originEn: 'Fresh Longan • PLU #4307',
    storageTipFr: 'Conserver au réfrigérateur dans un sachet perforé.',
    storageTipEn: 'Refrigerate in a perforated plastic bag.',
    freezerTipFr: 'Peler et congeler la pulpe dénoyautée.',
    freezerTipEn: 'Peel and freeze pitted sweet flesh.',
    calories: 60,
    category: 'Produce',
    keywords: ['longan', 'longane', 'longanes', 'dragon eye', '4307'],
  },
  rambutan: {
    nameFr: 'Ramboutan velu frais',
    nameEn: 'Fresh Rambutan',
    pluCode: '3042',
    location: 'Fridge',
    shelfLife: 6,
    originFr: 'Guatemala / Asie • PLU #3042',
    originEn: 'Fresh Rambutan • PLU #3042',
    storageTipFr: 'Conserver au réfrigérateur enveloppé pour préserver l’humidité des poils.',
    storageTipEn: 'Store refrigerated in a plastic bag to keep spines fresh.',
    freezerTipFr: 'Peler et congeler la chair sans noyau.',
    freezerTipEn: 'Peel and freeze pitted fruit.',
    calories: 68,
    category: 'Produce',
    keywords: ['rambutan', 'ramboutan', '3042'],
  },
  durian: {
    nameFr: 'Durian frais entier / en quartiers',
    nameEn: 'Fresh Whole / Sliced Durian',
    pluCode: '3041',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Thaïlande / Malaisie • PLU #3041',
    originEn: 'Fresh Durian • PLU #3041',
    storageTipFr: 'Conserver dans un endroit bien ventilé. Emballer très hermétiquement au frigo après ouverture.',
    storageTipEn: 'Store in ventilated area; wrap airtight in multiple layers if refrigerating cut pods.',
    freezerTipFr: 'Congeler les quartiers de chair crémeuse sous vide; texture de crème glacée parfaite.',
    freezerTipEn: 'Freeze creamy pods in vacuum-sealed bag; eats like natural custard.',
    calories: 147,
    category: 'Produce',
    keywords: ['durian', '3041'],
  },
  jackfruit: {
    nameFr: 'Fruit du jacquier frais (Jackfruit)',
    nameEn: 'Fresh Jackfruit',
    pluCode: '3428',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Importé tropical • PLU #3428',
    originEn: 'Tropical Jackfruit • PLU #3428',
    storageTipFr: 'Mûrir entier sur le comptoir. Réfrigérer les gousses jaunes dans un récipient étanche.',
    storageTipEn: 'Ripen whole at room temp; refrigerate yellow fruit pods in airtight container.',
    freezerTipFr: 'Congeler les gousses sans pépins pour currys ou desserts.',
    freezerTipEn: 'Freeze seedless bulbs for savory curries or sweet snacks.',
    calories: 95,
    category: 'Produce',
    keywords: ['jackfruit', 'jacquier', 'fruit du jacquier', '3428'],
  },
  starfruit: {
    nameFr: 'Carambole fraîche étoilée',
    nameEn: 'Fresh Starfruit (Carambola)',
    pluCode: '4259',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Importé tropical • PLU #4259',
    originEn: 'Fresh Starfruit • PLU #4259',
    storageTipFr: 'Mûrir sur le comptoir jusqu’à ce que les arêtes foncent, puis réfrigérer.',
    storageTipEn: 'Ripen on counter until ribs slightly amber/brown, then refrigerate.',
    freezerTipFr: 'Trancher en jolies étoiles et congeler à plat sur une plaque.',
    freezerTipEn: 'Slice into stars and freeze flat on parchment.',
    calories: 31,
    category: 'Produce',
    targetHueRange: [40, 70],
    keywords: ['starfruit', 'carambole', 'carambola', '4259'],
  },
  guava: {
    nameFr: 'Goyaves fraîches parfumées',
    nameEn: 'Fresh Sweet Guavas',
    pluCode: '4299',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Mexique / Brésil • PLU #4299',
    originEn: 'Fresh Guava • PLU #4299',
    storageTipFr: 'Garder sur le comptoir jusqu’à parfum intense et chair souple.',
    storageTipEn: 'Keep on counter until highly fragrant and yielding.',
    freezerTipFr: 'Peler, épépiner et congeler en purée ou en tranches.',
    freezerTipEn: 'Puree or slice and freeze for juices.',
    calories: 68,
    category: 'Produce',
    keywords: ['guava', 'goyave', 'goyaves', '4299'],
  },
  persimmon: {
    nameFr: 'Kakis Fuyu doux (Persimmon)',
    nameEn: 'Fresh Fuyu Persimmons',
    pluCode: '4427',
    location: 'Pantry',
    shelfLife: 14,
    originFr: 'Californie / Espagne • PLU #4427',
    originEn: 'Fuyu Persimmon • PLU #4427',
    storageTipFr: 'La variété Fuyu se mange croquante comme une pomme. Garder à température ambiante.',
    storageTipEn: 'Fuyu variety can be eaten firm and crisp like an apple. Store at room temperature.',
    freezerTipFr: 'Trancher ou réduire en purée avant de congeler.',
    freezerTipEn: 'Slice or puree and freeze for baking.',
    calories: 70,
    category: 'Produce',
    targetHueRange: [20, 45],
    keywords: ['persimmon', 'kaki', 'fuyu', 'hachiya', '4427'],
  },
  plantain: {
    nameFr: 'Bananes plantains (Vertes / Mûres)',
    nameEn: 'Fresh Cooking Plantains',
    pluCode: '4235',
    location: 'Pantry',
    shelfLife: 14,
    originFr: 'Équateur / Colombie • PLU #4235',
    originEn: 'Cooking Plantains • PLU #4235',
    storageTipFr: 'Conserver sur le comptoir. Se cuisine salée quand la peau est verte, ou sucrée quand elle devient noire.',
    storageTipEn: 'Store on counter. Cook green for savory tostones, yellow/black for sweet maduros.',
    freezerTipFr: 'Peler, couper en rondelles épaisses et congeler.',
    freezerTipEn: 'Peel, slice into thick rounds, and freeze.',
    calories: 122,
    category: 'Produce',
    keywords: ['plantain', 'banane plantain', 'platanos', '4235'],
  },
  'gai lan': {
    nameFr: 'Gai Lan frais (Brocoli chinois)',
    nameEn: 'Chinese Broccoli (Gai Lan)',
    pluCode: '4548',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Québec / Ontario • PLU #4548',
    originEn: 'Chinese Broccoli • PLU #4548',
    storageTipFr: 'Conserver au bac à légumes dans un sac entrouvert avec papier absorbant.',
    storageTipEn: 'Store in crisper drawer in loose plastic bag with paper towel.',
    freezerTipFr: 'Blanchir les tiges et feuilles 2 minutes dans l’eau bouillante avant de congeler.',
    freezerTipEn: 'Blanch stems and leaves for 2 minutes before freezing for stir-fries.',
    calories: 26,
    category: 'Produce',
    targetHueRange: [85, 140],
    keywords: ['gai lan', 'gailan', 'chinese broccoli', 'brocoli chinois', 'kai lan', '4548'],
  },
  'choy sum': {
    nameFr: 'Choy Sum frais (Yu Choy à fleurs jaunes)',
    nameEn: 'Fresh Choy Sum (Yu Choy)',
    pluCode: '4546',
    location: 'Fridge',
    shelfLife: 6,
    originFr: 'Ontario / Québec • PLU #4546',
    originEn: 'Choy Sum • PLU #4546',
    storageTipFr: 'Garder bien au frais dans le bac à légumes, consommer rapidement.',
    storageTipEn: 'Keep cold in crisper drawer and cook within 4-5 days.',
    freezerTipFr: 'Blanchir 90 secondes et refroidir dans l’eau glacée avant congélation.',
    freezerTipEn: 'Blanch 90 seconds, shock in ice water, drain, and freeze.',
    calories: 16,
    category: 'Produce',
    targetHueRange: [85, 135],
    keywords: ['choy sum', 'choysum', 'yu choy', 'yuchoy', '4546'],
  },
  'napa cabbage': {
    nameFr: 'Chou chinois Napa (Wong Bok)',
    nameEn: 'Napa Cabbage (Chinese Cabbage)',
    pluCode: '4552',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'Québec • Aliments du Québec • PLU #4552',
    originEn: 'Napa Cabbage • PLU #4552',
    storageTipFr: 'Envelopper serré dans du film plastique au frigo; se conserve 3 à 4 semaines.',
    storageTipEn: 'Wrap tightly in plastic wrap in fridge; keeps fresh for 3-4 weeks.',
    freezerTipFr: 'Émincer, blanchir 1 minute et congeler, ou fermenter en kimchi maison.',
    freezerTipEn: 'Shred and blanch 1 minute, or ferment into homemade kimchi.',
    calories: 16,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['napa cabbage', 'chou napa', 'chou chinois', 'wong bok', 'wombok', '4552'],
  },
  daikon: {
    nameFr: 'Radis Daikon blanc asiatique',
    nameEn: 'Fresh Daikon White Radish',
    pluCode: '4598',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'Québec / Ontario • PLU #4598',
    originEn: 'Daikon Radish • PLU #4598',
    storageTipFr: 'Conserver au réfrigérateur dans un sachet plastique pour garder la chair juteuse.',
    storageTipEn: 'Store in sealed plastic bag in crisper drawer to retain crisp juiciness.',
    freezerTipFr: 'Râper ou couper en cubes et congeler cru pour soupes ou mijotés.',
    freezerTipEn: 'Grate or cube and freeze raw for soups and braises.',
    calories: 18,
    category: 'Produce',
    keywords: ['daikon', 'radis blanc', 'radis daikon', 'mooli', '4598'],
  },
  'lotus root': {
    nameFr: 'Racine de lotus fraîche',
    nameEn: 'Fresh Lotus Root',
    pluCode: '4732',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Importé asiatique • PLU #4732',
    originEn: 'Lotus Root • PLU #4732',
    storageTipFr: 'Garder au réfrigérateur enveloppée d’un linge humide ou dans un sachet.',
    storageTipEn: 'Wrap in damp paper towel in plastic bag in the fridge.',
    freezerTipFr: 'Peler, trancher pour faire apparaître les alvéoles, blanchir dans de l’eau citronnée et congeler.',
    freezerTipEn: 'Peel, slice into wheel patterns, blanch in acidified water, and freeze.',
    calories: 74,
    category: 'Produce',
    keywords: ['lotus root', 'racine de lotus', 'lotus', 'renkon', '4732'],
  },
  'bitter melon': {
    nameFr: 'Melon amer frais (Bitter Melon / Goya / Margose)',
    nameEn: 'Fresh Bitter Melon (Goya)',
    pluCode: '4782',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Importé • PLU #4782',
    originEn: 'Bitter Melon • PLU #4782',
    storageTipFr: 'Conserver au réfrigérateur dans un sac en papier pour éviter la condensation.',
    storageTipEn: 'Store in a paper bag in the crisper drawer to avoid moisture rot.',
    freezerTipFr: 'Couper en deux, vider les graines spongieuses, trancher et blanchir 1 minute avant congélation.',
    freezerTipEn: 'Halve, scoop spongy seeds, slice, and blanch 1 min before freezing.',
    calories: 17,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['bitter melon', 'melon amer', 'ampalaya', 'goya', 'margose', 'karela', '4782'],
  },
  taro: {
    nameFr: 'Racine de taro fraîche',
    nameEn: 'Fresh Taro Root',
    pluCode: '4794',
    location: 'Pantry',
    shelfLife: 21,
    originFr: 'Importé • PLU #4794',
    originEn: 'Taro Root • PLU #4794',
    storageTipFr: 'Conserver dans un endroit frais, sec et sombre. Doit toujours être cuit avant dégustation.',
    storageTipEn: 'Keep in cool, dry, dark pantry. Must always be cooked thoroughly before eating.',
    freezerTipFr: 'Peler (avec des gants), couper en cubes, faire bouillir 10 minutes et congeler.',
    freezerTipEn: 'Peel with gloves, cube, boil 10 minutes, and freeze.',
    calories: 142,
    category: 'Produce',
    keywords: ['taro', 'racine de taro', 'gabi', 'arbi', '4794'],
  },
  enoki: {
    nameFr: 'Champignons Enoki frais (Enokitake)',
    nameEn: 'Fresh Enoki Mushrooms',
    pluCode: '4645',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Cultivé en serre • PLU #4645',
    originEn: 'Enoki Mushrooms • PLU #4645',
    storageTipFr: 'Conserver au réfrigérateur dans son emballage étanche d’origine jusqu’à utilisation.',
    storageTipEn: 'Keep refrigerated in original sealed pouch until ready to trim and cook.',
    freezerTipFr: 'Couper la base racinaire et congeler cru directement pour bouillons et ramen.',
    freezerTipEn: 'Trim base root, separate clusters, and freeze raw for instant hot pots.',
    calories: 37,
    category: 'Produce',
    keywords: ['enoki', 'enokitake', 'champignon enoki', '4645'],
  },
  shiitake: {
    nameFr: 'Champignons Shiitake frais',
    nameEn: 'Fresh Shiitake Mushrooms',
    pluCode: '4651',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Québec / Ontario • PLU #4651',
    originEn: 'Shiitake Mushrooms • PLU #4651',
    storageTipFr: 'Conserver au réfrigérateur dans un sac en papier brun pour préserver la fermeté du chapeau.',
    storageTipEn: 'Store in brown paper bag in fridge to prevent caps from turning slimy.',
    freezerTipFr: 'Trancher les chapeaux (garder les pieds pour bouillons) et congeler à plat.',
    freezerTipEn: 'Slice caps and freeze flat in single layer.',
    calories: 34,
    category: 'Produce',
    keywords: ['shiitake', 'shitake', 'champignon shiitake', '4651'],
  },
  'king oyster': {
    nameFr: 'Pleurote du panicaut (King Oyster / Trumpet)',
    nameEn: 'King Oyster Mushrooms',
    pluCode: '4652',
    location: 'Fridge',
    shelfLife: 12,
    originFr: 'Cultivé au Canada • PLU #4652',
    originEn: 'King Oyster • PLU #4652',
    storageTipFr: 'Conserver au frigo dans un sac en papier.',
    storageTipEn: 'Store in breathable paper bag in fridge.',
    freezerTipFr: 'Trancher en épaisses rondelles "pétoncles véganes", poêler et congeler.',
    freezerTipEn: 'Slice into thick medallions, sauté briefly, and freeze.',
    calories: 35,
    category: 'Produce',
    keywords: ['king oyster', 'pleurote du panicaut', 'king trumpet', 'eryngii', '4652'],
  },
  chayote: {
    nameFr: 'Christophine fraîche (Chayote / Chouchou)',
    nameEn: 'Fresh Chayote Squash',
    pluCode: '4761',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'Mexique / Costa Rica • PLU #4761',
    originEn: 'Chayote Squash • PLU #4761',
    storageTipFr: 'Conserver dans un sac plastique aéré au réfrigérateur jusqu’à un mois.',
    storageTipEn: 'Store in perforated plastic bag in crisper up to 4 weeks.',
    freezerTipFr: 'Peler, couper en dés ou lamelles, blanchir 2 minutes et congeler.',
    freezerTipEn: 'Peel, cube, blanch 2 minutes, and freeze.',
    calories: 19,
    category: 'Produce',
    targetHueRange: [75, 120],
    keywords: ['chayote', 'sayote', 'christophine', 'chouchou', 'chocho', '4761'],
  },
  jicama: {
    nameFr: 'Pois patate frais (Jicama croquant)',
    nameEn: 'Fresh Jicama (Mexican Yam Bean)',
    pluCode: '4626',
    location: 'Pantry',
    shelfLife: 21,
    originFr: 'Mexique • PLU #4626',
    originEn: 'Fresh Jicama • PLU #4626',
    storageTipFr: 'Conserver la racine entière au frais et au sec. Réfrigérer les bâtonnets tranchés dans de l’eau.',
    storageTipEn: 'Store whole root in dry cool pantry. Store cut sticks submerged in water in fridge.',
    freezerTipFr: 'Ne se congèle pas cru (perd son croquant signature).',
    freezerTipEn: 'Not recommended for freezing raw.',
    calories: 38,
    category: 'Produce',
    keywords: ['jicama', 'singkamas', 'pois patate', '4626'],
  },
  okra: {
    nameFr: 'Gombos frais (Okra)',
    nameEn: 'Fresh Okra (Gumbo)',
    pluCode: '4655',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Importé • PLU #4655',
    originEn: 'Fresh Okra • PLU #4655',
    storageTipFr: 'Conserver non lavé dans un sac en papier au bac à légumes pour éviter le noircissement.',
    storageTipEn: 'Store dry in a paper bag in crisper drawer to avoid slimy discoloration.',
    freezerTipFr: 'Blanchir entiers 3 minutes, sécher et congeler pour soupes gombo et ragoûts.',
    freezerTipEn: 'Blanch whole for 3 minutes, pat dry, and freeze.',
    calories: 33,
    category: 'Produce',
    targetHueRange: [80, 130],
    keywords: ['okra', 'gombo', 'gombos', 'lady finger', '4655'],
  },
  kabocha: {
    nameFr: 'Courge Kabocha japonaise',
    nameEn: 'Japanese Kabocha Squash',
    pluCode: '4769',
    location: 'Pantry',
    shelfLife: 90,
    originFr: 'Québec / Mexique • PLU #4769',
    originEn: 'Kabocha Squash • PLU #4769',
    storageTipFr: 'Conserver entière dans un endroit sec et aéré à température ambiante jusqu’à 3 mois.',
    storageTipEn: 'Store whole in cool dry place up to 3 months.',
    freezerTipFr: 'Couper en quartiers (la peau se mange), rôtir ou blanchir et congeler.',
    freezerTipEn: 'Chop (skin is edible), roast or blanch, and freeze.',
    calories: 40,
    category: 'Produce',
    targetHueRange: [90, 135],
    keywords: ['kabocha', 'courge kabocha', 'japanese squash', '4769'],
  },
  lemongrass: {
    nameFr: 'Bâtons de citronnelle fraîche',
    nameEn: 'Fresh Lemongrass Stalks',
    pluCode: '4894',
    location: 'Fridge',
    shelfLife: 18,
    originFr: 'Importé asiatique • PLU #4894',
    originEn: 'Fresh Lemongrass • PLU #4894',
    storageTipFr: 'Envelopper serré dans du film plastique au réfrigérateur.',
    storageTipEn: 'Wrap tightly in plastic wrap in crisper drawer.',
    freezerTipFr: 'Trancher ou écraser les tiges et congeler entières; s’utilise directement congelée.',
    freezerTipEn: 'Freeze whole stalks; slice directly from frozen for curries and soups.',
    calories: 99,
    category: 'Produce',
    keywords: ['lemongrass', 'citronnelle', '4894'],
  },
  'thai basil': {
    nameFr: 'Basilic thaï frais aux tiges pourpres',
    nameEn: 'Fresh Thai Basil',
    pluCode: '4886',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Herbes asiatiques fraîches • PLU #4886',
    originEn: 'Thai Basil • PLU #4886',
    storageTipFr: 'Conserver les tiges dans un verre d’eau sur le comptoir comme un bouquet.',
    storageTipEn: 'Keep stems in water glass on counter at room temperature.',
    freezerTipFr: 'Hacher et congeler dans de l’huile dans des bacs à glaçons.',
    freezerTipEn: 'Chop and freeze in neutral oil in ice cube trays.',
    calories: 23,
    category: 'Produce',
    keywords: ['thai basil', 'basilic thai', 'basilic thaï', 'horapa', '4886'],
  },
  mangosteen: {
    nameFr: 'Mangoustan pourpre frais (Reine des fruits)',
    nameEn: 'Fresh Purple Mangosteen',
    pluCode: '4430',
    location: 'Pantry',
    shelfLife: 8,
    originFr: 'Importé asiatique / Thaïlande • PLU #4430',
    originEn: 'Imported Mangosteen • PLU #4430',
    storageTipFr: 'Conserver à température ambiante fraîche (12°C). Ne pas trop refroidir au réfrigérateur.',
    storageTipEn: 'Store at cool room temp. Highly sensitive to cold damage.',
    freezerTipFr: 'Extraire les quartiers de pulpe blanche et congeler.',
    freezerTipEn: 'Extract white segments and freeze for desserts.',
    calories: 73,
    category: 'Produce',
    keywords: ['mangosteen', 'mangoustan', '4430'],
  },
  cassava: {
    nameFr: 'Manioc frais ciré (Yuca / Cassava)',
    nameEn: 'Fresh Cassava Root (Yuca)',
    pluCode: '4819',
    location: 'Pantry',
    shelfLife: 14,
    originFr: 'Costa Rica / Colombie • PLU #4819',
    originEn: 'Fresh Yuca / Cassava • PLU #4819',
    storageTipFr: 'Conserver au garde-manger au sec. Ne jamais consommer cru.',
    storageTipEn: 'Store in cool dry pantry. Must always be boiled or cooked thoroughly.',
    freezerTipFr: 'Peler l’épaisse écorce brune, couper en tronçons et congeler cru.',
    freezerTipEn: 'Peel thick bark, cut into chunks, and freeze raw.',
    calories: 160,
    category: 'Produce',
    keywords: ['cassava', 'manioc', 'yuca', 'yucca', '4819'],
  },
  'water spinach': {
    nameFr: 'Liseron d’eau frais (Ong Choy / Kang Kong)',
    nameEn: 'Fresh Water Spinach (Ong Choy)',
    pluCode: '4547',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Québec / Ontario • PLU #4547',
    originEn: 'Fresh Water Spinach • PLU #4547',
    storageTipFr: 'Envelopper dans du papier absorbant au bac à légumes.',
    storageTipEn: 'Wrap in paper towel in crisper drawer; use within days.',
    freezerTipFr: 'Blanchir 1 minute et congeler pour soupes et sautés.',
    freezerTipEn: 'Blanch 1 min and freeze for stir-fries.',
    calories: 19,
    category: 'Produce',
    keywords: ['water spinach', 'kangkong', 'ong choy', 'liseron d eau', 'liseron deau', 'kang kong', '4547'],
  },
  'pea shoots': {
    nameFr: 'Pousses de pois doux (Dou Miao)',
    nameEn: 'Fresh Pea Shoots (Dou Miao)',
    pluCode: '4549',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Serres du Québec / Ontario • PLU #4549',
    originEn: 'Fresh Pea Shoots • PLU #4549',
    storageTipFr: 'Garder dans son sac aéré au frigo; très tendre.',
    storageTipEn: 'Store in airy plastic bag in fridge; very tender.',
    freezerTipFr: 'Ne se congèle pas idéalement cru.',
    freezerTipEn: 'Best eaten fresh.',
    calories: 31,
    category: 'Produce',
    keywords: ['pea shoots', 'dou miao', 'pousses de pois', 'snow pea leaves', '4549'],
  },
  tomatillo: {
    nameFr: 'Tomatilles vertes avec enveloppe',
    nameEn: 'Fresh Husk Tomatillos',
    pluCode: '4801',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Mexique • PLU #4801',
    originEn: 'Fresh Tomatillos • PLU #4801',
    storageTipFr: 'Conserver avec leur enveloppe de papier dans un sac ouvert au frigo.',
    storageTipEn: 'Store in husks in open paper or plastic bag in fridge.',
    freezerTipFr: 'Retirer les enveloppes, rincer le résidu collant et congeler entières.',
    freezerTipEn: 'Remove husks, rinse sticky residue, and freeze whole.',
    calories: 32,
    category: 'Produce',
    keywords: ['tomatillo', 'tomatilles', 'tomatillos', '4801'],
  },
  shishito: {
    nameFr: 'Piments Shishito doux à griller',
    nameEn: 'Fresh Shishito Peppers',
    pluCode: '4690',
    location: 'Fridge',
    shelfLife: 10,
    originFr: 'Québec / Mexique • PLU #4690',
    originEn: 'Shishito Peppers • PLU #4690',
    storageTipFr: 'Conserver au bac à légumes du réfrigérateur.',
    storageTipEn: 'Store in crisper drawer of fridge.',
    freezerTipFr: 'Congeler entiers crus pour les faire cloquer plus tard à la poêle.',
    freezerTipEn: 'Freeze whole raw for pan-blistered appetizers.',
    calories: 20,
    category: 'Produce',
    keywords: ['shishito', 'piment shishito', 'padron', '4690'],
  },
  galangal: {
    nameFr: 'Racine de galanga frais',
    nameEn: 'Fresh Galangal Root',
    pluCode: '4895',
    location: 'Fridge',
    shelfLife: 21,
    originFr: 'Importé asiatique • PLU #4895',
    originEn: 'Fresh Galangal • PLU #4895',
    storageTipFr: 'Envelopper dans du film étirable au réfrigérateur.',
    storageTipEn: 'Wrap in cling film in fridge.',
    freezerTipFr: 'Trancher en rondelles et congeler; s’utilise directement dans les soupes tom yum.',
    freezerTipEn: 'Slice into coins and freeze; toss straight into broths.',
    calories: 71,
    category: 'Produce',
    keywords: ['galangal', 'galanga', 'lengkuas', '4895'],
  },
  breadfruit: {
    nameFr: 'Fruit à pain frais (Breadfruit)',
    nameEn: 'Fresh Breadfruit',
    pluCode: '4257',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Caraïbes / Pacifique • PLU #4257',
    originEn: 'Fresh Breadfruit • PLU #4257',
    storageTipFr: 'Conserver à température ambiante jusqu’à maturité, puis cuire (bouilli ou rôti).',
    storageTipEn: 'Keep at room temp. Must be cooked before consumption.',
    freezerTipFr: 'Cuire à la vapeur, couper en quartiers et congeler.',
    freezerTipEn: 'Steam, slice, and freeze.',
    calories: 103,
    category: 'Produce',
    keywords: ['breadfruit', 'fruit a pain', 'fruit à pain', '4257'],
  },

  // Filipino Produce & Tropical Specialties
  calamansi: {
    nameFr: 'Calamansi frais (Limette philippine / Calamondin)',
    nameEn: 'Fresh Calamansi (Philippine Lime)',
    pluCode: '4428',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Philippines / Asie • PLU #4428',
    originEn: 'Fresh Calamansi • PLU #4428',
    storageTipFr: 'Conserver au bac à légumes du réfrigérateur. Indispensable pour sauces sawsawan et sinigang.',
    storageTipEn: 'Store in crisper drawer in fridge. Staple for sawsawan and marinades.',
    freezerTipFr: 'Presser le jus et congeler dans un bac à glaçons.',
    freezerTipEn: 'Squeeze juice and freeze in ice cube trays.',
    calories: 12,
    category: 'Produce',
    targetHueRange: [40, 110],
    keywords: ['calamansi', 'kalamansi', 'calamondin', 'limette philippine', '4428', '4305'],
  },
  ube: {
    nameFr: 'Ube frais (Igname pourpre des Philippines)',
    nameEn: 'Fresh Purple Yam (Ube)',
    pluCode: '4814',
    location: 'Pantry',
    shelfLife: 21,
    originFr: 'Philippines • PLU #4814',
    originEn: 'Philippine Purple Yam • PLU #4814',
    storageTipFr: 'Garder dans un endroit sec, sombre et frais. Toujours faire bouillir ou cuire avant consommation.',
    storageTipEn: 'Keep in dry, dark pantry. Always boil or steam thoroughly.',
    freezerTipFr: 'Peler, bouillir, écraser en purée (Halaya) et congeler.',
    freezerTipEn: 'Peel, boil, mash into puree (Halaya), and freeze.',
    calories: 140,
    category: 'Produce',
    keywords: ['ube', 'purple yam', 'igname pourpre', 'halaya', '4814'],
  },
  'saba banana': {
    nameFr: 'Banane Saba fraîche (Banane à cuire philippine)',
    nameEn: 'Fresh Saba Cooking Bananas',
    pluCode: '4234',
    location: 'Pantry',
    shelfLife: 10,
    originFr: 'Philippines • PLU #4234',
    originEn: 'Saba Bananas • PLU #4234',
    storageTipFr: 'Garder sur le comptoir. Ingrédient vedette du Turon, Nilaga, Pochero et Halo-Halo.',
    storageTipEn: 'Store at room temperature. Key for Turon, Pochero, and Nilaga.',
    freezerTipFr: 'Peler, couper en biseau ou en rondelles et congeler.',
    freezerTipEn: 'Peel, slice, and freeze for cooked dishes.',
    calories: 120,
    category: 'Produce',
    keywords: ['saba', 'saba banana', 'cardaba', 'cooking banana', 'banane saba', '4234'],
  },
  sitaw: {
    nameFr: 'Sitaw frais (Haricots longs philippins / Yardlong beans)',
    nameEn: 'Fresh Yardlong Beans (Sitaw)',
    pluCode: '4880',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Serres / Importé • PLU #4880',
    originEn: 'Yardlong Beans • PLU #4880',
    storageTipFr: 'Conserver au bac à légumes dans un sachet entrouvert. Idéal pour Adobong Sitaw et Kare-Kare.',
    storageTipEn: 'Store in crisper in loose bag. Snap into segments for Adobong Sitaw.',
    freezerTipFr: 'Couper en tronçons de 5 cm, blanchir 2 minutes et congeler.',
    freezerTipEn: 'Cut 2-inch segments, blanch 2 min, and freeze.',
    calories: 47,
    category: 'Produce',
    targetHueRange: [80, 135],
    keywords: ['sitaw', 'sitaw beans', 'yardlong bean', 'snake bean', 'haricot long', '4880'],
  },
  malunggay: {
    nameFr: 'Malunggay frais (Feuilles de moringa philippines)',
    nameEn: 'Fresh Moringa Leaves (Malunggay)',
    pluCode: '4882',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Importé philippin • PLU #4882',
    originEn: 'Fresh Malunggay • PLU #4882',
    storageTipFr: 'Enlever les tiges ligneuses et conserver les petites feuilles dans du papier absorbant. Essentiel pour la soupe Tinola.',
    storageTipEn: 'Strip leaves from woody stems; keep in paper towel in crisper. Essential for Tinola.',
    freezerTipFr: 'Égrainer les feuilles et congeler cru en sachet hermétique.',
    freezerTipEn: 'Strip leaves and freeze raw in airtight freezer bags.',
    calories: 64,
    category: 'Produce',
    keywords: ['malunggay', 'moringa', 'moringa leaves', 'feuilles de moringa', '4882'],
  },
  'puso ng saging': {
    nameFr: 'Puso ng Saging (Fleur / Cœur de bananier)',
    nameEn: 'Banana Blossom (Puso ng Saging)',
    pluCode: '4883',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Philippines / Asie • PLU #4883',
    originEn: 'Banana Blossom • PLU #4883',
    storageTipFr: 'Garder au frigo dans un sac scellé. Tremper les tranches dans de l’eau salée citronnée avant cuisson pour Kare-Kare.',
    storageTipEn: 'Keep refrigerated. Soak sliced petals in salted lemon water to prevent browning. Key for Kare-Kare.',
    freezerTipFr: 'Émincer, blanchir 3 minutes dans l’eau citronnée et congeler.',
    freezerTipEn: 'Slice, blanch 3 mins in lemon water, and freeze.',
    calories: 51,
    category: 'Produce',
    keywords: ['puso ng saging', 'banana blossom', 'banana heart', 'coeur de bananier', 'fleur de bananier', '4883'],
  },
  guyabano: {
    nameFr: 'Guyabano frais (Corossol doux / Soursop)',
    nameEn: 'Fresh Soursop (Guyabano)',
    pluCode: '4298',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Philippines / Tropiques • PLU #4298',
    originEn: 'Fresh Guyabano / Soursop • PLU #4298',
    storageTipFr: 'Mûrir à température ambiante jusqu’à texture souple, puis réfrigérer.',
    storageTipEn: 'Ripen at room temp until soft to touch, then refrigerate.',
    freezerTipFr: 'Épépiner, réduire la pulpe en purée et congeler pour jus et desserts.',
    freezerTipEn: 'Deseed, puree creamy white pulp, and freeze.',
    calories: 66,
    category: 'Produce',
    keywords: ['guyabano', 'soursop', 'corossol', 'graviola', '4298'],
  },
  atis: {
    nameFr: 'Atis frais (Pomme cannelle / Sugar Apple)',
    nameEn: 'Fresh Sugar Apple (Atis)',
    pluCode: '4258',
    location: 'Pantry',
    shelfLife: 5,
    originFr: 'Philippines / Asie • PLU #4258',
    originEn: 'Sugar Apple (Atis) • PLU #4258',
    storageTipFr: 'Garder à température ambiante jusqu’à ce que les segments bosselés cèdent sous le doigt.',
    storageTipEn: 'Store at room temp until knobby segments yield softly.',
    freezerTipFr: 'Dépiauter la pulpe sucrée autour des graines et congeler.',
    freezerTipEn: 'Scoop sweet pulp and freeze.',
    calories: 94,
    category: 'Produce',
    keywords: ['atis', 'sugar apple', 'sweetsop', 'pomme cannelle', '4258'],
  },
  santol: {
    nameFr: 'Santol frais (Faux mangoustan / Cotton Fruit)',
    nameEn: 'Fresh Cotton Fruit (Santol)',
    pluCode: '3430',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Philippines • PLU #3430',
    originEn: 'Santol • PLU #3430',
    storageTipFr: 'Garder à température ambiante. Déguster les arilles doux ou cuisiner l’écorce au lait de coco (Ginataang Santol).',
    storageTipEn: 'Keep at room temp. Eat fresh white cotton arils or cook rind in coconut cream.',
    freezerTipFr: 'Râper l’écorce charnue et congeler pour le ginataan.',
    freezerTipEn: 'Grate thick rind and freeze for cooking.',
    calories: 50,
    category: 'Produce',
    keywords: ['santol', 'cotton fruit', 'faux mangoustan', '3430'],
  },
  chico: {
    nameFr: 'Chico frais (Sapotille philippine / Sapodilla)',
    nameEn: 'Fresh Sapodilla (Chico)',
    pluCode: '4261',
    location: 'Pantry',
    shelfLife: 6,
    originFr: 'Philippines / Mexique • PLU #4261',
    originEn: 'Sapodilla (Chico) • PLU #4261',
    storageTipFr: 'Mûrir à température ambiante jusqu’à consistance molle; saveur veloutée de cassonade.',
    storageTipEn: 'Ripen on counter until soft; distinct caramel brown sugar sweetness.',
    freezerTipFr: 'Peler, couper en quartiers et congeler.',
    freezerTipEn: 'Peel, wedge, and freeze for shakes.',
    calories: 83,
    category: 'Produce',
    keywords: ['chico', 'sapodilla', 'sapotille', '4261'],
  },
  lanzones: {
    nameFr: 'Lanzones frais (Langsat des Philippines)',
    nameEn: 'Fresh Lanzones (Langsat)',
    pluCode: '3432',
    location: 'Fridge',
    shelfLife: 7,
    originFr: 'Camiguin / Laguna, Philippines • PLU #3432',
    originEn: 'Philippine Lanzones • PLU #3432',
    storageTipFr: 'Conserver en grappe au réfrigérateur dans un sac perforé.',
    storageTipEn: 'Store clusters in perforated bag in fridge.',
    freezerTipFr: 'Peler et congeler les quartiers translucides.',
    freezerTipEn: 'Peel and freeze translucent segments.',
    calories: 57,
    category: 'Produce',
    keywords: ['lanzones', 'langsat', 'longkong', '3432'],
  },
  kamias: {
    nameFr: 'Kamias frais (Bilimbi acide philippin)',
    nameEn: 'Fresh Bilimbi (Kamias)',
    pluCode: '3435',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Philippines • PLU #3435',
    originEn: 'Fresh Kamias • PLU #3435',
    storageTipFr: 'Conserver au réfrigérateur. Fruit très acide utilisé dans le Sinigang et le Paksiw.',
    storageTipEn: 'Keep refrigerated. Very sour tropical fruit used to acidify Sinigang broths.',
    freezerTipFr: 'Congeler entier; trancher directement congelé dans les bouillons.',
    freezerTipEn: 'Freeze whole; drop straight into simmering broths.',
    calories: 10,
    category: 'Produce',
    keywords: ['kamias', 'bilimbi', 'iba', '3435'],
  },
  patola: {
    nameFr: 'Patola fraîche (Courge éponge philippine / Luffa)',
    nameEn: 'Fresh Sponge Gourd (Patola)',
    pluCode: '4762',
    location: 'Fridge',
    shelfLife: 8,
    originFr: 'Serres / Importé • PLU #4762',
    originEn: 'Sponge Gourd (Patola) • PLU #4762',
    storageTipFr: 'Peler les arêtes dures et couper en rondelles pour la soupe Miswa aux boulettes.',
    storageTipEn: 'Peel ridges and slice for traditional Miswa soup.',
    freezerTipFr: 'Peler, couper en rondelles, blanchir 1 minute et congeler.',
    freezerTipEn: 'Peel, slice, blanch 1 min, and freeze.',
    calories: 20,
    category: 'Produce',
    keywords: ['patola', 'luffa', 'sponge gourd', 'courge eponge', '4762'],
  },
  upo: {
    nameFr: 'Upo frais (Calebasse blanche / Bottle Gourd)',
    nameEn: 'Fresh Bottle Gourd (Upo)',
    pluCode: '4763',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Serres / Importé • PLU #4763',
    originEn: 'Bottle Gourd (Upo) • PLU #4763',
    storageTipFr: 'Conserver entier au frigo. Délicieux sauté à l’ail et aux crevettes (Ginisang Upo).',
    storageTipEn: 'Store whole in fridge. Classic for Ginisang Upo with garlic and shrimp.',
    freezerTipFr: 'Peler, épépiner, couper en cubes, blanchir 2 minutes et congeler.',
    freezerTipEn: 'Peel, cube, blanch 2 mins, and freeze.',
    calories: 14,
    category: 'Produce',
    keywords: ['upo', 'bottle gourd', 'calebasse', 'gourd', '4763'],
  },
  kalabasa: {
    nameFr: 'Courge Kalabasa philippine (Calabaza)',
    nameEn: 'Philippine Calabaza Squash (Kalabasa)',
    pluCode: '4768',
    location: 'Pantry',
    shelfLife: 60,
    originFr: 'Philippines / Amériques • PLU #4768',
    originEn: 'Calabaza Squash (Kalabasa) • PLU #4768',
    storageTipFr: 'Conserver entière au sec à température ambiante. Indispensable pour le Pinakbet authentique.',
    storageTipEn: 'Store whole at room temperature. Essential for Pinakbet and Ginisang Kalabasa.',
    freezerTipFr: 'Peler, couper en cubes et congeler cru ou cuit.',
    freezerTipEn: 'Peel, cube, and freeze raw or roasted.',
    calories: 36,
    category: 'Produce',
    keywords: ['kalabasa', 'calabaza', 'courge kalabasa', '4768'],
  },
  'talbos ng kamote': {
    nameFr: 'Talbos ng Kamote (Feuilles de patate douce)',
    nameEn: 'Sweet Potato Tops (Talbos ng Kamote)',
    pluCode: '4881',
    location: 'Fridge',
    shelfLife: 5,
    originFr: 'Serres maraîchères • PLU #4881',
    originEn: 'Camote Tops (Talbos) • PLU #4881',
    storageTipFr: 'Conserver au bac à légumes. Se blanchit quelques secondes pour salade aux tomates et calamansi.',
    storageTipEn: 'Store in crisper. Blanch briefly for traditional salad with tomatoes and calamansi.',
    freezerTipFr: 'Blanchir 30 secondes, refroidir dans l’eau glacée et congeler.',
    freezerTipEn: 'Blanch 30s, ice bath, and freeze.',
    calories: 41,
    category: 'Produce',
    keywords: ['talbos ng kamote', 'camote tops', 'feuilles de patate douce', 'sweet potato leaves', '4881'],
  },
  'siling labuyo': {
    nameFr: 'Siling Labuyo frais (Piment oiseau sauvage philippin)',
    nameEn: 'Fresh Siling Labuyo (Philippine Wild Chili)',
    pluCode: '4692',
    location: 'Fridge',
    shelfLife: 14,
    originFr: 'Philippines • PLU #4692',
    originEn: 'Philippine Siling Labuyo • PLU #4692',
    storageTipFr: 'Conserver au sec au réfrigérateur. Piment miniature très intense utilisé pour relever les sauces sawsawan.',
    storageTipEn: 'Store dry in fridge. Fiery small chili for dips and spiced vinegar.',
    freezerTipFr: 'Congeler les piments entiers dans un petit bocal en verre.',
    freezerTipEn: 'Freeze whole chilies in a small glass jar.',
    calories: 40,
    category: 'Produce',
    targetHueRange: [340, 20],
    keywords: ['siling labuyo', 'labuyo', 'piment oiseau philippin', 'bird eye chili', '4692'],
  },
  'carabao mango': {
    nameFr: 'Mangue Carabao des Philippines (Manila Super Mango)',
    nameEn: 'Philippine Carabao Mango (Manila Mango)',
    pluCode: '4312',
    location: 'Pantry',
    shelfLife: 7,
    originFr: 'Guimaras / Zambales, Philippines • PLU #4312',
    originEn: 'Philippine Carabao Mango • PLU #4312',
    storageTipFr: 'La mangue la plus sucrée au monde (Guinness). Mûrir sur le comptoir jusqu’à robe jaune dorée.',
    storageTipEn: 'Guinness World Record sweetest mango. Ripen on counter until deep golden yellow and intensely fragrant.',
    freezerTipFr: 'Couper les joues en dés et congeler pour le Mango Float.',
    freezerTipEn: 'Cube mango cheeks and freeze for Mango Float desserts.',
    calories: 60,
    category: 'Produce',
    targetHueRange: [35, 60],
    keywords: ['carabao mango', 'manila mango', 'mangue carabao', 'champagne mango', 'philippine mango', '4312'],
  },
};

// Singleton model reference cached in browser memory
let cachedModel: any = null;
let isModelInitializing = false;
let customOnnxSession: any = null;
let customModel: any = null;
let customClasses: string[] = [];
let hasCheckedCustomModel = false;

/**
 * Checks if a custom Proxmox-trained model is deployed as either:
 * 1. Native ONNX (/models/grocery_model/grocery_model.onnx) - direct from PyTorch with ZERO conversion!
 * 2. TensorFlow.js (/models/grocery_model/model.json)
 */
export async function checkAndLoadCustomOfflineModel(): Promise<boolean> {
  if (hasCheckedCustomModel) return !!(customOnnxSession || customModel);
  hasCheckedCustomModel = true;

  // 1. Try native ONNX (direct from PyTorch)
  try {
    const onnxRes = await fetch('/models/grocery_model/grocery_model.onnx');
    if (onnxRes.ok) {
      const ort = await import('onnxruntime-web');
      const modelBuffer = await onnxRes.arrayBuffer();
      customOnnxSession = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
        executionProviders: ['wasm'],
      });
      const classRes = await fetch('/models/grocery_model/classes.txt');
      if (classRes.ok) {
        const text = await classRes.text();
        customClasses = text.split('\n').map((c) => c.trim()).filter(Boolean);
      }
      console.info('[ProduceVision] Native ONNX model loaded directly with', customClasses.length, 'classes!');
      return true;
    }
  } catch (err) {
    console.warn('[ProduceVision] ONNX load notice:', err);
    // ONNX model not present or failed, fallback to checking for TF.js
  }

  // 2. Try TensorFlow.js model
  try {
    const res = await fetch('/models/grocery_model/model.json', { method: 'HEAD' });
    if (res.ok) {
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      customModel = await tf.loadGraphModel('/models/grocery_model/model.json');

      const classRes = await fetch('/models/grocery_model/classes.txt');
      if (classRes.ok) {
        const text = await classRes.text();
        customClasses = text.split('\n').map((c) => c.trim()).filter(Boolean);
      }
      console.info('[ProduceVision] Custom offline Proxmox TF.js model loaded with', customClasses.length, 'classes!');
      return true;
    }
  } catch (_) {
    // Custom offline model not found; standard on-device MobileNet will be used
  }
  return false;
}

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

  // Check 1.5: If custom offline Proxmox model (ONNX or TF.js) is deployed, prioritize its predictions
  try {
    const hasCustom = await checkAndLoadCustomOfflineModel();
    if (hasCustom && customOnnxSession) {
      const ort = await import('onnxruntime-web');
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageSource, 0, 0, 224, 224);
        const imgData = ctx.getImageData(0, 0, 224, 224).data;
        const floatData = new Float32Array(3 * 224 * 224);
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];
        for (let i = 0; i < 224 * 224; i++) {
          const r = imgData[i * 4] / 255.0;
          const g = imgData[i * 4 + 1] / 255.0;
          const b = imgData[i * 4 + 2] / 255.0;
          floatData[i] = (r - mean[0]) / std[0];
          floatData[224 * 224 + i] = (g - mean[1]) / std[1];
          floatData[2 * 224 * 224 + i] = (b - mean[2]) / std[2];
        }
        const tensor = new ort.Tensor('float32', floatData, [1, 3, 224, 224]);
        const results = await customOnnxSession.run({ input: tensor });
        const output = results.output || results[Object.keys(results)[0]];
        const data = output.data as Float32Array;

        // Apply numerically stable softmax across 81 class logits
        let maxVal = -1e9;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > maxVal) maxVal = data[i];
        }
        let sumExp = 0;
        const exps = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
          exps[i] = Math.exp(data[i] - maxVal);
          sumExp += exps[i];
        }

        // Rank classes by descending probability
        const sortedIndices = Array.from({ length: data.length }, (_, i) => i)
          .sort((a, b) => exps[b] - exps[a]);

        const topIdx = sortedIndices[0];
        const topProb = sumExp > 0 ? exps[topIdx] / sumExp : 0.95;
        const topRawClass = customClasses[topIdx] || `Class_${topIdx}`;
        console.info(`[ProduceVision] Custom ONNX Top Class #${topIdx}:`, topRawClass, 'Prob:', topProb);

        // Strict confidence threshold (>= 0.40):
        // The custom offline model only has 81 grocery classes and does NOT include fresh berries (e.g. strawberries).
        // If an unrepresented item like strawberries is shown, topProb is tiny (~3-10%).
        // We MUST NOT force a decision if topProb < 0.40; instead, let it fall through to MobileNet vision.
        if (topProb >= 0.40) {
          const catalogItem = findCatalogItemByClass(topRawClass);
          if (catalogItem) {
            const alternatives: ProduceAlternative[] = sortedIndices.slice(1, 4).map((idx) => {
              const altRaw = customClasses[idx] || `Class_${idx}`;
              const altItem = findCatalogItemByClass(altRaw);
              const altProb = Math.round(((sumExp > 0 ? exps[idx] / sumExp : 0.1)) * 100);
              return {
                name: isFr ? (altItem?.nameFr || altRaw) : (altItem?.nameEn || altRaw),
                nameFr: altItem?.nameFr || altRaw,
                nameEn: altItem?.nameEn || altRaw,
                pluCode: altItem?.pluCode,
                confidence: Math.max(1, altProb),
                location: (altItem?.location || 'Pantry') as 'Fridge' | 'Pantry' | 'Freezer',
                shelfLife: altItem?.shelfLife || 7,
              };
            });

            const reason = isFr
              ? `Identifié par modèle IA entraîné Proxmox (${catalogItem.nameFr})`
              : `Identified by Proxmox trained AI model (${catalogItem.nameEn})`;

            return {
              detectedLabel: catalogItem.className,
              confidence: Math.max(0.60, Math.min(0.99, topProb)),
              isProduce: true,
              sourceMethod: 'mobilenet',
              item: {
                name: isFr ? catalogItem.nameFr : catalogItem.nameEn,
                nameFr: catalogItem.nameFr,
                nameEn: catalogItem.nameEn,
                pluCode: catalogItem.pluCode,
                category: isFr ? catalogItem.categoryFr : catalogItem.category,
                categoryEn: catalogItem.category,
                recommendedLocation: catalogItem.location,
                estimatedShelfLifeDays: catalogItem.shelfLife,
                monthsFrozenShelfLife: 10,
                brand: catalogItem.brand,
                gradeOrigin: isFr ? catalogItem.originFr : catalogItem.originEn,
                packagingFormat: isFr ? catalogItem.packagingFormatFr : catalogItem.packagingFormatEn,
                dietaryBadges: catalogItem.dietaryBadges,
                storageTip: isFr ? catalogItem.storageTipFr : catalogItem.storageTipEn,
                storageReason: reason,
                freezerTip: isFr ? catalogItem.freezerTipFr : catalogItem.freezerTipEn,
                calories: catalogItem.calories,
                nutritionSummary: catalogItem.nutritionSummary,
              },
              alternatives,
            };
          }

          // Fallback to PRODUCE_MAPPING
          const predictedLabel = topRawClass.toLowerCase().replace(/[-_]/g, ' ');
          for (const [key, info] of Object.entries(PRODUCE_MAPPING)) {
            if (predictedLabel.includes(key) || key.includes(predictedLabel)) {
              return buildClassificationResult(key, info, Math.max(0.60, topProb), 'mobilenet', isFr, []);
            }
          }
        } else {
          console.info(`[ProduceVision] Custom ONNX model top probability ${topProb.toFixed(3)} for ${topRawClass} is below 0.40 threshold. Falling through to general MobileNet & chroma vision.`);
        }
      }
    } else if (hasCustom && customModel) {
      const tf = await import('@tensorflow/tfjs');
      const tensor = tf.browser
        .fromPixels(imageSource)
        .resizeBilinear([224, 224])
        .toFloat()
        .sub([123.68, 116.78, 103.94])
        .div([58.4, 57.12, 57.38])
        .expandDims(0);

      const prediction = customModel.predict(tensor) as any;
      const data = await prediction.data();
      tensor.dispose();
      prediction.dispose();

      let maxIdx = 0;
      let maxVal = -1e9;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > maxVal) {
          maxVal = data[i];
          maxIdx = i;
        }
      }

      let sumExp = 0;
      for (let i = 0; i < data.length; i++) {
        sumExp += Math.exp(data[i] - maxVal);
      }
      const topProb = sumExp > 0 ? Math.exp(maxVal - maxVal) / sumExp : 0.05;

      if (topProb >= 0.40) {
        const topRawClass = customClasses[maxIdx] || `Class_${maxIdx}`;
        const catalogItem = findCatalogItemByClass(topRawClass);
        if (catalogItem) {
          return {
            detectedLabel: catalogItem.className,
            confidence: Math.max(0.60, Math.min(0.99, topProb)),
            isProduce: true,
            sourceMethod: 'mobilenet',
            item: {
              name: isFr ? catalogItem.nameFr : catalogItem.nameEn,
              nameFr: catalogItem.nameFr,
              nameEn: catalogItem.nameEn,
              pluCode: catalogItem.pluCode,
              category: isFr ? catalogItem.categoryFr : catalogItem.category,
              categoryEn: catalogItem.category,
              recommendedLocation: catalogItem.location,
              estimatedShelfLifeDays: catalogItem.shelfLife,
              monthsFrozenShelfLife: 10,
              brand: catalogItem.brand,
              gradeOrigin: isFr ? catalogItem.originFr : catalogItem.originEn,
              packagingFormat: isFr ? catalogItem.packagingFormatFr : catalogItem.packagingFormatEn,
              dietaryBadges: catalogItem.dietaryBadges,
              storageTip: isFr ? catalogItem.storageTipFr : catalogItem.storageTipEn,
              storageReason: isFr ? 'Identifié par modèle Proxmox TF.js' : 'Identified by Proxmox TF.js model',
              freezerTip: isFr ? catalogItem.freezerTipFr : catalogItem.freezerTipEn,
              calories: catalogItem.calories,
              nutritionSummary: catalogItem.nutritionSummary,
            },
            alternatives: [],
          };
        }
      } else {
        console.info(`[ProduceVision] Custom TF.js top probability ${topProb.toFixed(3)} is below threshold. Falling through to MobileNet.`);
      }
    }
  } catch (customErr) {
    console.warn('[ProduceVision] Custom offline model inference note:', customErr);
  }

  // Check 2: MobileNet on-device inference with optical chroma profile verification
  try {
    // Extract color profile to corroborate visual identification (e.g. vivid red for strawberries)
    let colorProfile: { hue: number; saturation: number; brightness: number; dominantColorName: string } | null = null;
    try {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 64;
      sampleCanvas.height = 64;
      const sCtx = sampleCanvas.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(imageSource, 0, 0, 64, 64);
        colorProfile = extractProduceColorProfile(sampleCanvas);
        console.info('[ProduceVision] Optical Chroma Profile:', colorProfile);
      }
    } catch (_) {}

    const isDominantRed = Boolean(
      colorProfile &&
      (colorProfile.dominantColorName === 'red' || colorProfile.hue >= 340 || colorProfile.hue <= 20) &&
      colorProfile.saturation >= 25
    );

    const model = await getProduceVisionModel();
    if (model) {
      const predictions: Array<{ className: string; probability: number }> = await model.classify(imageSource, 8);
      if (predictions && predictions.length > 0) {
        console.info('[ProduceVision] MobileNet Top Predictions:', predictions);

        const candidates: Array<{ key: string; info: ProduceDetails; prob: number; rawClass: string }> = [];

        for (const pred of predictions) {
          const lowerClass = pred.className.toLowerCase();

          for (const [key, info] of Object.entries(PRODUCE_MAPPING)) {
            const hasKeywordMatch = info.keywords?.some((kw) => lowerClass.includes(kw));
            if (lowerClass.includes(key) || key.includes(lowerClass.split(',')[0].trim()) || hasKeywordMatch) {
              if (!candidates.some((c) => c.key === key)) {
                let adjustedProb = pred.probability;
                // If this is strawberry and image chroma is vividly red, boost confidence
                if (key === 'strawberry' && isDominantRed) {
                  adjustedProb = Math.max(adjustedProb, 0.82);
                }
                candidates.push({ key, info, prob: adjustedProb, rawClass: pred.className });
              }
            }
          }
        }

        // Special check: If MobileNet directly identified 'strawberry' anywhere in top predictions
        const strawberryDirect = predictions.find((p) => p.className.toLowerCase().includes('strawberr'));
        if (strawberryDirect && PRODUCE_MAPPING.strawberry && !candidates.some((c) => c.key === 'strawberry')) {
          candidates.push({
            key: 'strawberry',
            info: PRODUCE_MAPPING.strawberry,
            prob: isDominantRed ? Math.max(strawberryDirect.probability, 0.85) : strawberryDirect.probability,
            rawClass: strawberryDirect.className,
          });
        }

        if (candidates.length > 0) {
          // Sort by probability descending
          candidates.sort((a, b) => b.prob - a.prob);
          const best = candidates[0];

          // Reasonable confidence threshold (0.22 if corroborated by red chroma, else 0.35)
          const minThreshold = (best.key === 'strawberry' && isDominantRed) ? 0.20 : 0.35;
          if (best.prob >= minThreshold) {
            const alternatives: ProduceAlternative[] = candidates.slice(1, 4).map((c) => ({
              name: isFr ? c.info.nameFr : c.info.nameEn,
              nameFr: c.info.nameFr,
              nameEn: c.info.nameEn,
              pluCode: c.info.pluCode,
              confidence: Math.round(c.prob * 100),
              location: c.info.location,
              shelfLife: c.info.shelfLife,
            }));

            const finalConfidence = Math.max(0.65, Math.min(0.98, best.prob));
            return buildClassificationResult(best.key, best.info, finalConfidence, 'mobilenet', isFr, alternatives);
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

