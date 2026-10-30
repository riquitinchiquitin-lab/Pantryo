/**
 * Global Packaged Goods Catalog & Container Standards
 * 
 * Comprehensive preloaded database of kitchen staples spanning:
 *  - 🇨🇦/🇺🇸 North America (National brands + Canadian store brands + metric standards)
 *  - 🌎 South America (Goya, Harina P.A.N., Dulce de Leche, Yerba Maté, Yoki, Aji Amarillo)
 *  - 🇨🇳 China (Lee Kum Kee, Lao Gan Ma, Pearl River Bridge, Chinkiang, Shao Hsing, Sichuan)
 *  - 🇯🇵 Japan (Kikkoman, Kewpie, S&B Golden Curry, Hon-Dashi, Miso, Panko, Nori)
 *  - 🇵🇭 Philippines (Datu Puti, Mama Sita's, UFC Banana Ketchup, Silver Swan, Lucky Me!)
 */

export type PackageRegion =
  | 'NORTH_AMERICA'
  | 'SOUTH_AMERICA'
  | 'CHINA'
  | 'JAPAN'
  | 'PHILIPPINES'
  | 'GLOBAL';

export type ContainerType =
  | 'CAN'       // Boîte de conserve / Canette
  | 'BOX'       // Boîte de carton
  | 'BAG'       // Sachet / Sac
  | 'JAR'       // Bocal en verre / Pot
  | 'CARTON'    // Brique aseptique / Carton (Tetra Pak)
  | 'BOTTLE'    // Bouteille
  | 'TUB'       // Bac / Pot plastique
  | 'TRAY';     // Barquette / Panier

export interface GlobalPackageItem {
  id: string;
  region: PackageRegion;
  brand: string;
  nameFr: string;
  nameEn: string;
  originalScript?: string;      // Native script (e.g., 李锦记, キユーピー, Datu Puti)
  romanization?: string;        // Pinyin / Romaji / Pronunciation
  containerType: ContainerType;
  standardNetQuantity: string;  // e.g. "540 ml", "796 ml", "454 g", "1 kg", "210 g"
  category: string;             // Category name
  categoryEn: string;
  defaultLocation: 'Pantry' | 'Fridge' | 'Freezer';
  shelfLifeDays: number;
  monthsFrozenShelfLife?: number;
  keywords: string[];
  barcodes?: string[];
  notes?: string;
  storageTip?: string;
  storageTipFr?: string;
}

export interface MetricContainerStandard {
  containerType: ContainerType;
  volumeOrWeight: string;
  commonUsageFr: string;
  commonUsageEn: string;
  defaultShelfLifeDays: number;
}

/**
 * Standard Canadian & International Metric Packaging Sizes
 */
export const METRIC_CONTAINER_STANDARDS: MetricContainerStandard[] = [
  { containerType: 'CAN', volumeOrWeight: '284 ml', commonUsageFr: 'Soupes condensées (Campbell, Habitant, Aylmer)', commonUsageEn: 'Condensed soups', defaultShelfLifeDays: 730 },
  { containerType: 'CAN', volumeOrWeight: '398 ml', commonUsageFr: 'Maïs en grains, haricots verts, fèves au lard', commonUsageEn: 'Kernel corn, green beans, baked beans', defaultShelfLifeDays: 730 },
  { containerType: 'CAN', volumeOrWeight: '540 ml', commonUsageFr: 'Légumineuses canadiennes (pois chiches, haricots noirs, lentilles)', commonUsageEn: 'Standard Canadian legumes (chickpeas, beans)', defaultShelfLifeDays: 730 },
  { containerType: 'CAN', volumeOrWeight: '796 ml', commonUsageFr: 'Grosses tomates broyées, en dés ou purée', commonUsageEn: 'Large diced, crushed or puréed tomatoes', defaultShelfLifeDays: 730 },
  { containerType: 'CAN', volumeOrWeight: '170 g', commonUsageFr: 'Thon émietté ou saumon en boîte (Clover Leaf)', commonUsageEn: 'Flaked tuna or canned salmon', defaultShelfLifeDays: 1095 },
  { containerType: 'CAN', volumeOrWeight: '400 ml', commonUsageFr: 'Lait de coco ou crème de coco', commonUsageEn: 'Coconut milk or cream', defaultShelfLifeDays: 730 },
  { containerType: 'BOX', volumeOrWeight: '225 g', commonUsageFr: 'Kraft Dinner (KD) & macaroni au fromage', commonUsageEn: 'Kraft Dinner & mac and cheese', defaultShelfLifeDays: 365 },
  { containerType: 'BOX', volumeOrWeight: '454 g', commonUsageFr: 'Pâtes alimentaires standards (1 lb - Catelli, Barilla)', commonUsageEn: 'Standard dry pasta box (1 lb)', defaultShelfLifeDays: 730 },
  { containerType: 'BOX', volumeOrWeight: '900 g', commonUsageFr: 'Grand format pâtes alimentaires ou riz', commonUsageEn: 'Large pasta or rice box', defaultShelfLifeDays: 730 },
  { containerType: 'BOX', volumeOrWeight: '1 kg', commonUsageFr: 'Flocons d\'avoine rapide (Quaker Oats)', commonUsageEn: 'Quick rolled oats box', defaultShelfLifeDays: 365 },
  { containerType: 'CARTON', volumeOrWeight: '900 ml', commonUsageFr: 'Bouillon prêt à servir (poulet, bœuf, légumes)', commonUsageEn: 'Ready-to-use broth (chicken, beef, veggie)', defaultShelfLifeDays: 365 },
  { containerType: 'CARTON', volumeOrWeight: '946 ml', commonUsageFr: 'Boisson végétale (amande, avoine, soja)', commonUsageEn: 'Plant-based milk (almond, oat, soy)', defaultShelfLifeDays: 270 },
  { containerType: 'CARTON', volumeOrWeight: '2 L', commonUsageFr: 'Lait frais canadien (Natrel, Québon, Lactantia)', commonUsageEn: 'Fresh dairy milk carton', defaultShelfLifeDays: 18 },
  { containerType: 'BAG', volumeOrWeight: '200 g', commonUsageFr: 'Croustilles / Chips de pommes de terre (Miss Vickie\'s)', commonUsageEn: 'Potato chips snack bag', defaultShelfLifeDays: 90 },
  { containerType: 'BAG', volumeOrWeight: '750 g', commonUsageFr: 'Légumes ou petits fruits surgelés', commonUsageEn: 'Frozen vegetables or berries bag', defaultShelfLifeDays: 365 },
  { containerType: 'BAG', volumeOrWeight: '2 kg', commonUsageFr: 'Sac de riz basmati ou jasmin', commonUsageEn: 'Basmati or jasmine rice bag', defaultShelfLifeDays: 730 },
  { containerType: 'BAG', volumeOrWeight: '2.5 kg', commonUsageFr: 'Farine tout usage (Five Roses, Robin Hood)', commonUsageEn: 'All-purpose Canadian flour bag', defaultShelfLifeDays: 365 },
  { containerType: 'JAR', volumeOrWeight: '650 ml', commonUsageFr: 'Sauce pour pâtes & marinara (Stefano Faita, Classico)', commonUsageEn: 'Pasta & marinara sauce jar', defaultShelfLifeDays: 540 },
  { containerType: 'JAR', volumeOrWeight: '1 kg', commonUsageFr: 'Beurre d\'arachide crémeux ou croquant (Kraft)', commonUsageEn: 'Peanut butter jar', defaultShelfLifeDays: 365 },
  { containerType: 'JAR', volumeOrWeight: '1 L', commonUsageFr: 'Cornichons à l\'aneth (Bick\'s, Vlasic)', commonUsageEn: 'Dill pickles jar', defaultShelfLifeDays: 730 },
];

/**
 * Preloaded Global Package Database (kitchen staples across 5 regions)
 */
export const GLOBAL_PACKAGE_CATALOG: GlobalPackageItem[] = [
  // ==========================================
  // 🇨🇦 / 🇺🇸 NORTH AMERICA (Canada & US)
  // ==========================================
  {
    id: 'na_habitant_pea_soup',
    region: 'NORTH_AMERICA',
    brand: 'Habitant',
    nameFr: 'Soupe aux pois jaunes à l\'ancienne',
    nameEn: 'Traditional French-Canadian Yellow Pea Soup',
    containerType: 'CAN',
    standardNetQuantity: '796 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['habitant', 'soupe', 'pois', 'jaunes', 'french', 'canadian', 'yellow', 'pea', 'soup', '796ml'],
    storageTipFr: 'Conserver dans un garde-manger frais et sec. Réfrigérer après ouverture.',
  },
  {
    id: 'na_furlani_texas_toast',
    region: 'NORTH_AMERICA',
    brand: 'Furlani',
    nameFr: 'Pain à l\'ail Texas Toast Ail et parmesan Furlani (16 tranches)',
    nameEn: 'Furlani Garlic Parm Texas Toast (16 slices)',
    containerType: 'BAG',
    standardNetQuantity: '638 g',
    category: 'Frozen Meals',
    categoryEn: 'Frozen Foods',
    defaultLocation: 'Freezer',
    shelfLifeDays: 240,
    monthsFrozenShelfLife: 9,
    keywords: ['furlani', 'texas', 'toast', 'toaste', 'joaste', 'garlic', 'parm', 'ail', 'parmesan', 'pain a l ail', 'pain à l\'ail', '638g', '16 slices', '16 tranches'],
    storageTipFr: 'Conserver au congélateur à -18°C. Ne pas décongeler avant de cuire : 5 minutes au four à 220°C (425°F).',
  },
  {
    id: 'na_st_methode_grand_pere_avoine',
    region: 'NORTH_AMERICA',
    brand: 'St-Méthode',
    nameFr: 'Pain style Grand-Père à l\'avoine La Récolte de St-Méthode',
    nameEn: 'St-Méthode La Récolte Grand-Père Oat Bread',
    containerType: 'BAG',
    standardNetQuantity: '600 g',
    category: 'Bakery',
    categoryEn: 'Bakery',
    defaultLocation: 'Pantry',
    shelfLifeDays: 7,
    monthsFrozenShelfLife: 3,
    keywords: ['st-methode', 'st-méthode', 'methode', 'grand-pere', 'grand-père', 'avoine', 'oat', 'recolte', 'récolte', 'home style bread', 'pain'],
    storageTipFr: 'Garder à température ambiante au garde-manger. Ne pas réfrigérer. Se congèle très bien.',
  },
  {
    id: 'na_attitude_fraiche_echalotes',
    region: 'NORTH_AMERICA',
    brand: 'Attitude Fraîche',
    nameFr: 'Échalotes françaises Attitude Fraîche (Panier 350 g)',
    nameEn: 'Fresh Attitude Dry French Shallots (350 g basket)',
    containerType: 'TRAY',
    standardNetQuantity: '350 g',
    category: 'Produce',
    categoryEn: 'Produce',
    defaultLocation: 'Pantry',
    shelfLifeDays: 35,
    monthsFrozenShelfLife: 8,
    keywords: ['attitude', 'fraiche', 'fraîche', 'fresh', 'echalote', 'échalote', 'echalotes', 'échalotes', 'shallot', 'shallots', 'francaises', 'françaises', 'dry shallots', '350g', '350 g', '12.3 oz'],
    storageTipFr: 'Garder dans son panier carton aéré au garde-manger. Ne jamais réfrigérer entière. Éloigner des pommes de terre.',
  },
  {
    id: 'na_ail_frais_filet_3_tetes',
    region: 'NORTH_AMERICA',
    brand: 'Sélection',
    nameFr: 'Filet de 3 têtes d\'ail blanc frais',
    nameEn: 'Fresh White Garlic (3-pack mesh sleeve)',
    containerType: 'BAG',
    standardNetQuantity: '3 têtes / 3 bulbs',
    category: 'Produce',
    categoryEn: 'Produce',
    defaultLocation: 'Pantry',
    shelfLifeDays: 45,
    monthsFrozenShelfLife: 10,
    keywords: ['ail', 'garlic', 'filet d ail', 'filet d\'ail', 'tete d ail', 'tête d\'ail', 'garlic ail', 'mesh sleeve', 'ail blanc', '3 tetes', '3 têtes', 'a ot'],
    storageTipFr: 'Conserver la tête entière dans son filet ou panier aéré au garde-manger. Éviter le frigo qui stimule la germination.',
  },
  {
    id: 'na_campbells_tomato_soup',
    region: 'NORTH_AMERICA',
    brand: "Campbell's",
    nameFr: 'Soupe condensée aux tomates',
    nameEn: 'Condensed Tomato Soup',
    containerType: 'CAN',
    standardNetQuantity: '284 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['campbells', 'campbell', 'tomato', 'tomate', 'condensed', 'condensee', 'soup', 'soupe', '284ml'],
  },
  {
    id: 'na_compliments_chickpeas',
    region: 'NORTH_AMERICA',
    brand: 'Compliments',
    nameFr: 'Pois chiches sans sel ajouté',
    nameEn: 'Chickpeas No Salt Added',
    containerType: 'CAN',
    standardNetQuantity: '540 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['compliments', 'pois', 'chiches', 'chickpeas', 'garbanzo', '540ml', 'sobeys', 'iga'],
  },
  {
    id: 'na_pc_black_beans',
    region: 'NORTH_AMERICA',
    brand: "President's Choice",
    nameFr: 'Haricots noirs Choix du Président',
    nameEn: "President's Choice Black Beans",
    containerType: 'CAN',
    standardNetQuantity: '540 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['pc', 'presidents choice', 'choix du president', 'haricots', 'noirs', 'black', 'beans', '540ml'],
  },
  {
    id: 'na_chocolats_favoris_fondue_lait',
    region: 'NORTH_AMERICA',
    brand: 'Chocolats Favoris',
    nameFr: 'Fondue au chocolat au lait Classique Lait',
    nameEn: 'Original Milk Chocolate Fondue',
    containerType: 'CAN',
    standardNetQuantity: '215 g',
    category: 'Sweets & Desserts',
    categoryEn: 'Sweets & Desserts',
    defaultLocation: 'Pantry',
    shelfLifeDays: 540,
    keywords: ['chocolats favoris', 'favoris', 'fondue', 'chocolat', 'lait', 'milk chocolate', 'classique lait', 'original milk', '215g', 'cacao durable'],
    storageTipFr: 'Chauffer la boîte sans couvercle au bain-marie ou au micro-ondes. Conserver à température ambiante.',
    storageTip: 'Heat can directly in hot water bath or microwave without lid. Store at room temperature.',
  },
  {
    id: 'na_selection_mayo_olive_canola',
    region: 'NORTH_AMERICA',
    brand: 'Selection',
    nameFr: "Mayonnaise à l'huile de canola et d'olive extra vierge",
    nameEn: 'Mayonnaise made with Canola Oil & Extra Virgin Olive Oil',
    containerType: 'BOTTLE',
    standardNetQuantity: '750 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 180,
    keywords: ['selection', 'mayonnaise', 'canola', 'olive extra vierge', 'extra virgin olive oil', 'oeufs entiers', 'whole eggs', '750ml', 'metro', 'super c'],
    storageTipFr: 'Garder au garde-manger avant ouverture, puis réfrigérer dès ouverture.',
    storageTip: 'Store in pantry unopened, refrigerate promptly after opening.',
  },
  {
    id: 'na_selection_tomato_sauce_680ml',
    region: 'NORTH_AMERICA',
    brand: 'Selection',
    nameFr: 'Sauce Tomate Selection',
    nameEn: 'Selection Tomato Sauce',
    containerType: 'CAN',
    standardNetQuantity: '680 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['selection', 'tomato sauce', 'sauce tomate', '680ml', 'metro', 'super c'],
    storageTipFr: 'Conserver dans un endroit frais et sec. Transférer dans un bocal en verre au frigo après ouverture.',
    storageTip: 'Store in cool dry pantry. Transfer to glass or plastic container in fridge after opening.',
  },
  {
    id: 'na_selection_diced_tomatoes',
    region: 'NORTH_AMERICA',
    brand: 'Selection',
    nameFr: 'Tomates en dés avec épices italiennes',
    nameEn: 'Diced Tomatoes with Italian Spices',
    containerType: 'CAN',
    standardNetQuantity: '796 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['selection', 'metro', 'super c', 'tomates', 'des', 'diced', 'tomatoes', '796ml'],
  },
  {
    id: 'na_aylmer_crushed_tomatoes',
    region: 'NORTH_AMERICA',
    brand: 'Aylmer',
    nameFr: 'Tomates broyées Aylmer',
    nameEn: 'Aylmer Crushed Tomatoes',
    containerType: 'CAN',
    standardNetQuantity: '796 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['aylmer', 'tomates', 'broyees', 'crushed', 'tomatoes', '796ml'],
  },
  {
    id: 'na_dare_maple_creme_cookies_300g',
    region: 'NORTH_AMERICA',
    brand: 'Dare',
    nameFr: "Dare Ultimate™ Biscuits à la crème d'érable du Québec",
    nameEn: 'Dare Ultimate™ Real Quebec Maple Crème Cookies',
    containerType: 'BOX',
    standardNetQuantity: '300 g',
    category: 'Sweets & Desserts',
    categoryEn: 'Sweets & Desserts',
    defaultLocation: 'Pantry',
    shelfLifeDays: 270,
    keywords: [
      'dare',
      'ultimate',
      'maple',
      'creme',
      'crème',
      'erable',
      'érable',
      'biscuit',
      'biscuits',
      'cookies',
      '300g',
      'peanut free',
      'sans arachides',
      'made better',
      'quebec maple syrup',
      'sirop d erable',
      'aliments dare',
    ],
    storageTipFr: "Conserver dans un endroit frais et sec. Après ouverture, refermer hermétiquement pour garder le croquant des biscuits feuille d'érable.",
    storageTip: 'Store in a cool dry pantry. Keep sealed in an airtight container once opened to preserve crisp maple leaf texture.',
  },
  {
    id: 'na_kraft_dinner',
    region: 'NORTH_AMERICA',
    brand: 'KD (Kraft Dinner)',
    nameFr: 'KD Original - Macaroni et fromage',
    nameEn: 'KD Original - Macaroni and Cheese',
    containerType: 'BOX',
    standardNetQuantity: '200 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: [
      'kd',
      'kraft',
      'dinner',
      'macaroni',
      'fromage',
      'cheese',
      'original',
      '200g',
      '225g',
      'prepare au canada',
      'prepared in canada',
      'kraft heinz',
    ],
    storageTipFr: 'Garder au garde-manger dans un endroit sec et frais. Cuire les macaronis 7 à 8 min, égoutter, puis incorporer 1/3 tasse de lait et 1-2 c. à soupe de margarine ou beurre avec la sauce.',
    storageTip: 'Store in cool dry pantry. Boil macaroni 7-8 minutes, drain, stir in 1/3 cup milk and 1-2 tbsp margarine/butter with cheese sauce mix.',
  },
  {
    id: 'na_catelli_spaghetti',
    region: 'NORTH_AMERICA',
    brand: 'Catelli',
    nameFr: 'Spaghetti Catelli Classique',
    nameEn: 'Catelli Classic Spaghetti',
    containerType: 'BOX',
    standardNetQuantity: '454 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['catelli', 'spaghetti', 'pates', 'pasta', '454g', '1lb'],
  },
  {
    id: 'na_barilla_penne',
    region: 'NORTH_AMERICA',
    brand: 'Barilla',
    nameFr: 'Penne Rigate Barilla',
    nameEn: 'Barilla Penne Rigate',
    containerType: 'BOX',
    standardNetQuantity: '454 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['barilla', 'penne', 'rigate', 'pasta', 'pates', '454g'],
  },
  {
    id: 'na_quaker_rolled_oats',
    region: 'NORTH_AMERICA',
    brand: 'Quaker',
    nameFr: 'Flocons d\'avoine à cuisson rapide Quaker',
    nameEn: 'Quaker Quick 1-Minute Rolled Oats',
    containerType: 'BOX',
    standardNetQuantity: '1 kg',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['quaker', 'avoine', 'oats', 'quick', 'flocons', 'rolled', '1kg'],
  },
  {
    id: 'na_st_hubert_chicken_broth',
    region: 'NORTH_AMERICA',
    brand: 'St-Hubert',
    nameFr: 'Bouillon de poulet authentique St-Hubert',
    nameEn: 'St-Hubert Authentic Chicken Broth',
    containerType: 'CARTON',
    standardNetQuantity: '900 ml',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['st hubert', 'st-hubert', 'bouillon', 'poulet', 'broth', 'chicken', '900ml', 'carton', 'tetra'],
  },
  {
    id: 'na_clover_leaf_tuna',
    region: 'NORTH_AMERICA',
    brand: 'Clover Leaf',
    nameFr: 'Thon blanc germon entier dans l\'eau',
    nameEn: 'Clover Leaf Solid White Albacore Tuna in Water',
    containerType: 'CAN',
    standardNetQuantity: '170 g',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 1095,
    keywords: ['clover leaf', 'thon', 'tuna', 'albacore', 'germon', 'eau', 'water', '170g'],
  },
  {
    id: 'na_five_roses_flour',
    region: 'NORTH_AMERICA',
    brand: 'Five Roses',
    nameFr: 'Farine tout usage enrichie blanchie Five Roses',
    nameEn: 'Five Roses All-Purpose Bleached Enriched Flour',
    containerType: 'BAG',
    standardNetQuantity: '2.5 kg',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['five roses', 'farine', 'flour', 'tout usage', 'all purpose', '2.5kg', 'ble'],
  },
  {
    id: 'na_heinz_ketchup',
    region: 'NORTH_AMERICA',
    brand: 'Heinz',
    nameFr: 'Ketchup aux tomates Heinz',
    nameEn: 'Heinz Tomato Ketchup',
    containerType: 'BOTTLE',
    standardNetQuantity: '1 L',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['heinz', 'ketchup', 'tomate', 'tomato', 'bouteille', 'bottle', '1l'],
  },
  {
    id: 'na_kraft_peanut_butter',
    region: 'NORTH_AMERICA',
    brand: 'Kraft',
    nameFr: 'Beurre d\'arachide crémeux Kraft avec les oursons',
    nameEn: 'Kraft Smooth Creamy Peanut Butter',
    containerType: 'JAR',
    standardNetQuantity: '1 kg',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['kraft', 'peanut', 'butter', 'arachide', 'cremeux', 'smooth', 'oursons', '1kg'],
  },
  {
    id: 'na_little_potato_co_yellows',
    region: 'NORTH_AMERICA',
    brand: 'The Little Potato Company',
    nameFr: 'Pommes de terre grelots Petites Jaunes™ Format familial',
    nameEn: 'Little Yellows™ Creamer Potatoes Family Size',
    containerType: 'BAG',
    standardNetQuantity: '1.36 kg',
    category: 'Produce',
    categoryEn: 'Fresh Produce',
    defaultLocation: 'Pantry',
    shelfLifeDays: 28,
    keywords: [
      'little potato company',
      'little potato co',
      'little yellows',
      'petites jaunes',
      'patates',
      'pommes de terre',
      'grelots',
      'creamer potatoes',
      'family size',
      'format familial',
      'potatoes',
      'mini potatoes',
      'fresh potatoes',
      'canada',
    ],
    storageTip: 'Store in a cool, dark, dry, and well-ventilated pantry. Keep away from direct light to prevent greening. Do not refrigerate raw potatoes.',
    storageTipFr: 'Conserver au garde-manger dans un endroit frais, sec, sombre et bien aéré. Éviter la lumière pour empêcher le verdissement et ne pas réfrigérer crues.',
  },

  // ==========================================
  // 🌎 SOUTH AMERICA (Latin America & Caribbean)
  // ==========================================
  {
    id: 'sa_harina_pan_white',
    region: 'SOUTH_AMERICA',
    brand: 'P.A.N.',
    nameFr: 'Farine de maïs blanc précuite pour Arepas (Harina P.A.N.)',
    nameEn: 'P.A.N. Precooked White Corn Meal for Arepas',
    originalScript: 'Harina P.A.N. Blanca',
    romanization: 'Harina PAN Blanca Precocida',
    containerType: 'BAG',
    standardNetQuantity: '1 kg',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['pan', 'harina', 'harina pan', 'arepas', 'mais', 'corn', 'precooked', 'blanca', '1kg'],
    notes: 'Ingrédient essentiel pour les arepas, empanadas et hallacas vénézuéliennes et colombiennes.',
  },
  {
    id: 'sa_harina_pan_yellow',
    region: 'SOUTH_AMERICA',
    brand: 'P.A.N.',
    nameFr: 'Farine de maïs jaune précuite (Harina P.A.N. Amarilla)',
    nameEn: 'P.A.N. Precooked Yellow Corn Meal',
    originalScript: 'Harina P.A.N. Amarilla',
    romanization: 'Harina PAN Amarilla',
    containerType: 'BAG',
    standardNetQuantity: '1 kg',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['pan', 'harina pan', 'amarilla', 'jaune', 'yellow', 'corn', 'arepas', '1kg'],
  },
  {
    id: 'sa_goya_black_beans',
    region: 'SOUTH_AMERICA',
    brand: 'Goya',
    nameFr: 'Haricots noirs assaisonnés Goya (Frijoles Negros)',
    nameEn: 'Goya Black Beans in Sauce (Frijoles Negros)',
    originalScript: 'Goya Frijoles Negros',
    romanization: 'Goya Frijoles Negros',
    containerType: 'CAN',
    standardNetQuantity: '439 g',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['goya', 'frijoles', 'negros', 'black', 'beans', 'haricots', 'noirs', 'can', '439g', '15.5oz'],
  },
  {
    id: 'sa_goya_adobo',
    region: 'SOUTH_AMERICA',
    brand: 'Goya',
    nameFr: 'Assaisonnement Adobo tout usage Goya avec poivre',
    nameEn: 'Goya Adobo All-Purpose Seasoning with Pepper',
    originalScript: 'Goya Adobo con Pimienta',
    romanization: 'Goya Adobo con Pimienta',
    containerType: 'BOTTLE',
    standardNetQuantity: '226 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['goya', 'adobo', 'seasoning', 'assaisonnement', 'pimienta', 'pepper', 'spices'],
  },
  {
    id: 'sa_goya_sazon',
    region: 'SOUTH_AMERICA',
    brand: 'Goya',
    nameFr: 'Sazón Goya avec coriandre et achiote',
    nameEn: 'Sazón Goya with Coriander & Annatto (Culantro y Achiote)',
    originalScript: 'Sazón Goya con Culantro y Achiote',
    romanization: 'Sazon Goya con Culantro y Achiote',
    containerType: 'BOX',
    standardNetQuantity: '100 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['goya', 'sazon', 'culantro', 'achiote', 'annatto', 'coriander', 'packets', 'sachets'],
  },
  {
    id: 'sa_dulce_de_leche',
    region: 'SOUTH_AMERICA',
    brand: 'San Ignacio',
    nameFr: 'Confiture de lait traditionnelle argentine (Dulce de Leche)',
    nameEn: 'San Ignacio Traditional Argentine Dulce de Leche',
    originalScript: 'Dulce de Leche San Ignacio',
    romanization: 'Dulce de Leche Tradicional',
    containerType: 'JAR',
    standardNetQuantity: '450 g',
    category: 'Sweets & Desserts',
    categoryEn: 'Sweets & Desserts',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['san ignacio', 'dulce', 'leche', 'confiture', 'lait', 'manjar', 'arequipe', 'argentina', '450g'],
  },
  {
    id: 'sa_yerba_mate_taragui',
    region: 'SOUTH_AMERICA',
    brand: 'Taragüi',
    nameFr: 'Yerba Maté traditionnelle avec tige (Taragüi con palo)',
    nameEn: 'Taragüi Yerba Mate with Stems (Con Palo)',
    originalScript: 'Taragüi Yerba Mate con Palo',
    romanization: 'Taragui Yerba Mate',
    containerType: 'BAG',
    standardNetQuantity: '1 kg',
    category: 'Beverages',
    categoryEn: 'Beverages',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['taragui', 'yerba', 'mate', 'con palo', 'argentina', 'the', 'tea', 'infusion', '1kg'],
  },
  {
    id: 'sa_yoki_polvilho_doce',
    region: 'SOUTH_AMERICA',
    brand: 'Yoki',
    nameFr: 'Fécule de manioc douce pour Pão de Queijo (Polvilho Doce)',
    nameEn: 'Yoki Sweet Cassava Starch (Polvilho Doce)',
    originalScript: 'Yoki Polvilho Doce',
    romanization: 'Yoki Polvilho Doce',
    containerType: 'BAG',
    standardNetQuantity: '500 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['yoki', 'polvilho', 'doce', 'cassava', 'tapioca', 'manioc', 'pao de queijo', 'brasil', '500g'],
  },
  {
    id: 'sa_dona_isabel_aji_amarillo',
    region: 'SOUTH_AMERICA',
    brand: 'Doña Isabel',
    nameFr: 'Pâte de piment jaune péruvien (Pasta de Ají Amarillo)',
    nameEn: 'Doña Isabel Peruvian Yellow Pepper Paste',
    originalScript: 'Pasta de Ají Amarillo Doña Isabel',
    romanization: 'Pasta de Aji Amarillo',
    containerType: 'JAR',
    standardNetQuantity: '297 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['dona isabel', 'aji', 'amarillo', 'piment', 'jaune', 'peru', 'pasta', 'paste', 'sauce'],
  },
  {
    id: 'sa_guarana_antarctica',
    region: 'SOUTH_AMERICA',
    brand: 'Antarctica',
    nameFr: 'Boisson pétillante au guarana brésilienne (Guaraná Antarctica)',
    nameEn: 'Guaraná Antarctica Brazilian Sparkling Soda',
    originalScript: 'Guaraná Antarctica Refrigerante',
    romanization: 'Guarana Antarctica',
    containerType: 'CAN',
    standardNetQuantity: '355 ml',
    category: 'Beverages',
    categoryEn: 'Beverages',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['guarana', 'antarctica', 'soda', 'boisson', 'bresil', 'brazil', 'can', 'canette', '355ml'],
  },

  // ==========================================
  // 🇨🇳 CHINA (East Asian / Chinese Cuisine)
  // ==========================================
  {
    id: 'cn_lee_kum_kee_oyster_sauce',
    region: 'CHINA',
    brand: 'Lee Kum Kee (李锦记)',
    nameFr: 'Sauce d\'huître de qualité supérieure',
    nameEn: 'Lee Kum Kee Premium Oyster Sauce',
    originalScript: '李锦记 旧庄特级蚝油',
    romanization: 'Lǐ Jǐn Jì Jiù Zhuāng Tè Jí Háo Yóu',
    containerType: 'BOTTLE',
    standardNetQuantity: '510 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 730,
    keywords: ['lee kum kee', 'lkk', 'oyster', 'sauce', 'huitre', 'huitres', '李锦记', '蚝油', '510g'],
    storageTipFr: 'Bien réfrigérer après ouverture pour préserver la saveur umami et la texture riche.',
  },
  {
    id: 'cn_laoganma_crispy_chili_oil',
    region: 'CHINA',
    brand: 'Lao Gan Ma (老干妈)',
    nameFr: 'Piment croustillant dans l\'huile (Lao Gan Ma)',
    nameEn: 'Lao Gan Ma Spicy Crispy Chili in Oil',
    originalScript: '老干妈 香辣脆油辣椒',
    romanization: 'Lǎo Gān Mā Xiāng Là Cuì Yóu Là Jiāo',
    containerType: 'JAR',
    standardNetQuantity: '210 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 540,
    keywords: ['lao gan ma', 'laoganma', 'chili', 'crispy', 'oil', 'piment', 'croustillant', '老干妈', '香辣脆', '210g'],
  },
  {
    id: 'cn_laoganma_black_bean_chili',
    region: 'CHINA',
    brand: 'Lao Gan Ma (老干妈)',
    nameFr: 'Sauce chili aux haricots noirs fermentés (Lao Gan Ma)',
    nameEn: 'Lao Gan Ma Black Bean Chili Sauce',
    originalScript: '老干妈 风味豆豉油制辣椒',
    romanization: 'Lǎo Gān Mā Fēng Wèi Dòu Chǐ Yóu Zhì Là Jiāo',
    containerType: 'JAR',
    standardNetQuantity: '280 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 540,
    keywords: ['lao gan ma', 'black bean', 'douchi', 'haricots noirs', '老干妈', '豆豉', 'chili'],
  },
  {
    id: 'cn_lee_kum_kee_sesame_oil',
    region: 'CHINA',
    brand: 'Lee Kum Kee (李锦记)',
    nameFr: 'Huile de sésame pure 100% grillée',
    nameEn: 'Lee Kum Kee 100% Pure Roasted Sesame Oil',
    originalScript: '李锦记 纯正芝麻油',
    romanization: 'Lǐ Jǐn Jì Chún Zhèng Zhī Ma Yóu',
    containerType: 'BOTTLE',
    standardNetQuantity: '207 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['lee kum kee', 'sesame', 'oil', 'sesame oil', 'huile de sesame', '李锦记', '芝麻油'],
  },
  {
    id: 'cn_pearl_river_bridge_light_soy',
    region: 'CHINA',
    brand: 'Pearl River Bridge (珠江桥牌)',
    nameFr: 'Sauce soya claire supérieure (Sheng Chou)',
    nameEn: 'Pearl River Bridge Superior Light Soy Sauce',
    originalScript: '珠江桥牌 生抽王',
    romanization: 'Zhū Jiāng Qiáo Pái Shēng Chōu Wáng',
    containerType: 'BOTTLE',
    standardNetQuantity: '500 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['pearl river bridge', 'light soy', 'soya claire', 'shengchou', '珠江桥牌', '生抽', '500ml'],
  },
  {
    id: 'cn_pearl_river_bridge_dark_soy',
    region: 'CHINA',
    brand: 'Pearl River Bridge (珠江桥牌)',
    nameFr: 'Sauce soya foncée aux champignons (Lao Chou)',
    nameEn: 'Pearl River Bridge Mushroom Flavored Dark Soy Sauce',
    originalScript: '珠江桥牌 草菇老抽',
    romanization: 'Zhū Jiāng Qiáo Pái Cǎo Gū Lǎo Chōu',
    containerType: 'BOTTLE',
    standardNetQuantity: '500 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['pearl river bridge', 'dark soy', 'soya foncee', 'laochou', 'champignons', '珠江桥牌', '老抽'],
  },
  {
    id: 'cn_chinkiang_black_vinegar',
    region: 'CHINA',
    brand: 'Hengshun (恒顺)',
    nameFr: 'Vinaigre noir de Chinkiang traditionnel fermenté',
    nameEn: 'Hengshun Chinkiang Black Rice Vinegar',
    originalScript: '恒顺 镇江香醋',
    romanization: 'Héng Shùn Zhèn Jiāng Xiāng Cù',
    containerType: 'BOTTLE',
    standardNetQuantity: '550 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 1095,
    keywords: ['chinkiang', 'black vinegar', 'vinaigre noir', 'hengshun', 'zhenjiang', '恒顺', '镇江香醋', '550ml'],
  },
  {
    id: 'cn_shaoxing_cooking_wine',
    region: 'CHINA',
    brand: 'Pagoda Brand (塔牌)',
    nameFr: 'Vin de cuisine de riz Shao Hsing traditionnel',
    nameEn: 'Shao Hsing Traditional Rice Cooking Wine',
    originalScript: '塔牌 绍兴料酒 / 花雕酒',
    romanization: 'Tǎ Pái Shào Xīng Liào Jiǔ',
    containerType: 'BOTTLE',
    standardNetQuantity: '640 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['shaoxing', 'shao hsing', 'cooking wine', 'vin de cuisine', 'riz', '绍兴', '料酒', '花雕酒', '640ml'],
  },
  {
    id: 'cn_pixian_doubanjiang',
    region: 'CHINA',
    brand: 'Juan Cheng (鹃城牌)',
    nameFr: 'Pâte de fèves et piments du Sichuan de Pixian (Doubanjiang)',
    nameEn: 'Pixian Broad Bean Paste with Chili (Doubanjiang)',
    originalScript: '鹃城牌 郫县豆瓣酱',
    romanization: 'Juān Chéng Pái Pí Xiàn Dòu Bàn Jiàng',
    containerType: 'TUB',
    standardNetQuantity: '500 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 540,
    keywords: ['pixian', 'doubanjiang', 'sichuan', 'broad bean', 'feves', 'piment', '鹃城牌', '郫县豆瓣', 'mapo'],
  },
  {
    id: 'cn_sichuan_peppercorns',
    region: 'CHINA',
    brand: 'Sichuan Red Peppercorn',
    nameFr: 'Poivre du Sichuan rouge authentique (Hua Jiao)',
    nameEn: 'Authentic Sichuan Red Peppercorns (Hua Jiao)',
    originalScript: '四川 特级大红袍花椒',
    romanization: 'Sì Chuān Dà Hóng Páo Huā Jiāo',
    containerType: 'BAG',
    standardNetQuantity: '100 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['sichuan', 'peppercorn', 'poivre', 'hua jiao', 'huajiao', '花椒', '大红袍', 'engourdissant'],
  },
  {
    id: 'cn_dried_shiitake',
    region: 'CHINA',
    brand: 'Golden Flower',
    nameFr: 'Champignons Shiitake séchés entiers (Dong Gu)',
    nameEn: 'Dried Whole Shiitake Black Mushrooms (Dong Gu)',
    originalScript: '精选 花菇 / 冬菇',
    romanization: 'Jīng Xuǎn Huā Gū / Dōng Gū',
    containerType: 'BAG',
    standardNetQuantity: '200 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['shiitake', 'mushrooms', 'champignons', 'seches', 'dried', 'donggu', 'huagu', '花菇', '冬菇', '200g'],
  },

  // ==========================================
  // 🇯🇵 JAPAN (Japanese Cuisine)
  // ==========================================
  {
    id: 'jp_kikkoman_soy_sauce',
    region: 'JAPAN',
    brand: 'Kikkoman (キッコーマン)',
    nameFr: 'Sauce soya japonaise brassée naturellement',
    nameEn: 'Kikkoman Naturally Brewed Japanese Soy Sauce',
    originalScript: 'キッコーマン 特選 丸大豆しょうゆ',
    romanization: 'Kikkōman Tokusen Marudaizu Shōyu',
    containerType: 'BOTTLE',
    standardNetQuantity: '500 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['kikkoman', 'soy sauce', 'sauce soya', 'shoyu', 'しょうゆ', 'キッコーマン', '500ml', '1l'],
  },
  {
    id: 'jp_kewpie_mayo',
    region: 'JAPAN',
    brand: 'Kewpie (キユーピー)',
    nameFr: 'Mayonnaise japonaise originale aux jaunes d\'œufs (Kewpie)',
    nameEn: 'Kewpie Original Japanese Egg Yolk Mayonnaise',
    originalScript: 'キユーピー マヨネーズ',
    romanization: 'Kyūpī Mayonēzu',
    containerType: 'BOTTLE',
    standardNetQuantity: '450 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['kewpie', 'mayo', 'mayonnaise', 'japanese', 'japonaise', 'キユーピー', 'マヨネーズ', 'squeeze', '450g'],
    storageTipFr: 'Conserver au réfrigérateur après ouverture. Ne pas congeler (les jaunes d\'œufs se sépareraient).',
  },
  {
    id: 'jp_kewpie_sesame_dressing',
    region: 'JAPAN',
    brand: 'Kewpie (キユーピー)',
    nameFr: 'Vinaigrette crémeuse au sésame grillé (Kewpie Deep-Roasted)',
    nameEn: 'Kewpie Deep-Roasted Sesame Dressing',
    originalScript: 'キユーピー 焙煎胡麻ドレッシング',
    romanization: 'Kyūpī Baisen Goma Doresshingu',
    containerType: 'BOTTLE',
    standardNetQuantity: '380 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 270,
    keywords: ['kewpie', 'sesame', 'dressing', 'vinaigrette', 'goma', 'baisen', '焙煎胡麻', 'キユーピー', '380ml'],
  },
  {
    id: 'jp_sb_golden_curry',
    region: 'JAPAN',
    brand: 'S&B (エスビー)',
    nameFr: 'Roux de cari japonais Golden Curry (Moyen-Piquant)',
    nameEn: 'S&B Golden Curry Japanese Curry Roux (Medium Hot)',
    originalScript: 'エスビー ゴールデンカレー 中辛',
    romanization: 'Esubī Gōruden Karē Chūkara',
    containerType: 'BOX',
    standardNetQuantity: '220 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['s&b', 'golden curry', 'curry', 'cari', 'japonais', 'roux', 'ゴールデンカレー', 'エスビー', '220g'],
  },
  {
    id: 'jp_sb_wasabi_tube',
    region: 'JAPAN',
    brand: 'S&B (エスビー)',
    nameFr: 'Pâte de wasabi râpé en tube',
    nameEn: 'S&B Prepared Wasabi Paste in Tube',
    originalScript: 'エスビー おろし生わさび',
    romanization: 'Esubī Oroshi Nama Wasabi',
    containerType: 'TUB',
    standardNetQuantity: '43 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['wasabi', 's&b', 'paste', 'pate', 'tube', 'おろし生わさび', 'エスビー', '43g'],
  },
  {
    id: 'jp_ajinomoto_hondashi',
    region: 'JAPAN',
    brand: 'Ajinomoto (味の素)',
    nameFr: 'Bouillon dashi de bonite séchée instantané (Hon-Dashi)',
    nameEn: 'Ajinomoto Hon-Dashi Bonito Fish Soup Stock',
    originalScript: '味の素 ほんだし 鰹だし',
    romanization: 'Ajinomoto Hondashi Katsuo Dashi',
    containerType: 'BOX',
    standardNetQuantity: '120 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['ajinomoto', 'hondashi', 'hon-dashi', 'dashi', 'bonite', 'bonito', 'ほんだし', '味の素', '120g'],
  },
  {
    id: 'jp_marukome_miso_paste',
    region: 'JAPAN',
    brand: 'Marukome (マルコメ)',
    nameFr: 'Pâte de miso rouge ou blanc Ryotei no Aji avec dashi',
    nameEn: 'Marukome Ryotei no Aji Miso Paste with Dashi',
    originalScript: 'マルコメ 料亭の味 味噌',
    romanization: 'Marukome Ryōtei no Aji Miso',
    containerType: 'TUB',
    standardNetQuantity: '375 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 365,
    keywords: ['marukome', 'miso', 'paste', 'pate miso', 'soupe miso', 'マルコメ', '料亭の味', '375g', '750g'],
  },
  {
    id: 'jp_nissin_cup_noodles',
    region: 'JAPAN',
    brand: 'Nissin (日清)',
    nameFr: 'Nouilles ramen instantanées Cup Noodles originales',
    nameEn: 'Nissin Original Cup Noodles Instant Ramen',
    originalScript: '日清 カップヌードル',
    romanization: 'Nisshin Kappu Nūdoru',
    containerType: 'TUB',
    standardNetQuantity: '75 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['nissin', 'cup noodles', 'ramen', 'nouilles', 'instant', '日清', 'カップヌードル', '75g'],
  },
  {
    id: 'jp_shirakiku_panko',
    region: 'JAPAN',
    brand: 'Shirakiku',
    nameFr: 'Chapelure japonaise croustillante Panko',
    nameEn: 'Shirakiku Japanese Style Panko Bread Crumbs',
    originalScript: 'パン粉 Panko',
    romanization: 'Panko Bread Crumbs',
    containerType: 'BAG',
    standardNetQuantity: '200 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['panko', 'shirakiku', 'chapelure', 'bread crumbs', 'croustillant', 'tonkatsu', 'パン粉', '200g'],
  },
  {
    id: 'jp_nagatanien_furikake',
    region: 'JAPAN',
    brand: 'Nagatanien (永谷園)',
    nameFr: 'Assaisonnement pour riz Furikake au sésame et nori',
    nameEn: 'Nagatanien Nori Fumi Furikake Rice Seasoning',
    originalScript: '永谷園 海苔ふりかけ',
    romanization: 'Nagatanien Nori Furikake',
    containerType: 'JAR',
    standardNetQuantity: '50 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['furikake', 'nagatanien', 'nori', 'riz', 'rice seasoning', '永谷園', 'ふりかけ', '50g'],
  },
  {
    id: 'jp_yamamotoyama_nori',
    region: 'JAPAN',
    brand: 'Yamamotoyama',
    nameFr: 'Feuilles d\'algues grillées pour sushis (Nori)',
    nameEn: 'Yamamotoyama Roasted Seaweed Nori Sheets',
    originalScript: '山本山 焼き海苔 Sushi Nori',
    romanization: 'Yamamotoyama Yaki Nori',
    containerType: 'BAG',
    standardNetQuantity: '10 sheets (28 g)',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['nori', 'seaweed', 'algues', 'sushi', 'yaki nori', 'yamamotoyama', '山本山', '焼き海苔'],
  },

  // ==========================================
  // 🇵🇭 PHILIPPINES (Filipino Cuisine)
  // ==========================================
  {
    id: 'ph_datu_puti_vinegar',
    region: 'PHILIPPINES',
    brand: 'Datu Puti',
    nameFr: 'Vinaigre de canne à sucre pur (Sukang Maasim)',
    nameEn: 'Datu Puti Pure Cane Vinegar (Sukang Maasim)',
    originalScript: 'Datu Puti Sukang Maasim',
    romanization: 'Datu Puti Sukang Maasim',
    containerType: 'BOTTLE',
    standardNetQuantity: '1 L',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 1095,
    keywords: ['datu puti', 'vinegar', 'vinaigre', 'suka', 'sukang maasim', 'cane vinegar', 'philippines', '1l'],
    notes: 'Ingrédient de base essentiel pour le Chicken/Pork Adobo et le Kinilaw.',
  },
  {
    id: 'ph_datu_puti_soy_sauce',
    region: 'PHILIPPINES',
    brand: 'Datu Puti',
    nameFr: 'Sauce soya philippine traditionnelle (Toyo)',
    nameEn: 'Datu Puti Premium Soy Sauce (Toyo)',
    originalScript: 'Datu Puti Toyo',
    romanization: 'Datu Puti Toyo',
    containerType: 'BOTTLE',
    standardNetQuantity: '1 L',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['datu puti', 'toyo', 'soy sauce', 'sauce soya', 'adobo', 'philippines', '1l'],
  },
  {
    id: 'ph_datu_puti_patis',
    region: 'PHILIPPINES',
    brand: 'Datu Puti',
    nameFr: 'Sauce de poisson fermentée philippine (Patis)',
    nameEn: 'Datu Puti Premium Fish Sauce (Patis)',
    originalScript: 'Datu Puti Patis',
    romanization: 'Datu Puti Patis',
    containerType: 'BOTTLE',
    standardNetQuantity: '750 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['datu puti', 'patis', 'fish sauce', 'sauce poisson', 'philippines', '750ml'],
  },
  {
    id: 'ph_silver_swan_soy',
    region: 'PHILIPPINES',
    brand: 'Silver Swan',
    nameFr: 'Sauce soya spéciale Silver Swan',
    nameEn: 'Silver Swan Special Soy Sauce',
    originalScript: 'Silver Swan Special Toyo',
    romanization: 'Silver Swan Special Toyo',
    containerType: 'BOTTLE',
    standardNetQuantity: '1 L',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['silver swan', 'toyo', 'soy sauce', 'sauce soya', 'philippines', '1l'],
  },
  {
    id: 'ph_ufc_banana_sauce',
    region: 'PHILIPPINES',
    brand: 'UFC',
    nameFr: 'Sauce ketchup de banane épicée-douce (Tamang Tamis-Anghang)',
    nameEn: 'UFC Sweet & Spicy Banana Sauce / Banana Ketchup',
    originalScript: 'UFC Tamang Tamis-Anghang Banana Sauce',
    romanization: 'UFC Banana Sauce Tamang Tamis-Anghang',
    containerType: 'BOTTLE',
    standardNetQuantity: '550 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 540,
    keywords: ['ufc', 'banana', 'sauce', 'ketchup', 'banane', 'tamang tamis', 'anghang', 'philippines', '550g'],
  },
  {
    id: 'ph_mama_sitas_sinigang',
    region: 'PHILIPPINES',
    brand: "Mama Sita's",
    nameFr: 'Mélange de bouillon acidulé au tamarin pour Sinigang (Sinigang sa Sampalok)',
    nameEn: "Mama Sita's Tamarind Seasoning Soup Mix (Sinigang sa Sampalok)",
    originalScript: "Mama Sita's Sinigang sa Sampalok",
    romanization: 'Mama Sitas Sinigang sa Sampalok',
    containerType: 'BAG',
    standardNetQuantity: '50 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['mama sitas', 'sinigang', 'sampalok', 'tamarind', 'tamarin', 'soupe', 'soup', 'philippines', '50g'],
    notes: 'Le plat national réconfortant philippin aux légumes, crevettes ou porc.',
  },
  {
    id: 'ph_mama_sitas_caldereta',
    region: 'PHILIPPINES',
    brand: "Mama Sita's",
    nameFr: 'Mélange pour ragoût épicé Caldereta (Mama Sita\'s)',
    nameEn: "Mama Sita's Spicy Sauce Mix for Caldereta Stew",
    originalScript: "Mama Sita's Caldereta Mix",
    romanization: 'Mama Sitas Caldereta Mix',
    containerType: 'BAG',
    standardNetQuantity: '50 g',
    category: 'Spices & Seasonings',
    categoryEn: 'Spices & Seasonings',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['mama sitas', 'caldereta', 'kaldereta', 'stew', 'ragout', 'epice', 'spicy', '50g'],
  },
  {
    id: 'ph_lucky_me_pancit_canton_calamansi',
    region: 'PHILIPPINES',
    brand: 'Lucky Me!',
    nameFr: 'Nouilles sautées Pancit Canton à la lime calamansi (Lucky Me!)',
    nameEn: 'Lucky Me! Pancit Canton Instant Noodles Kalamansi Flavor',
    originalScript: 'Lucky Me! Instant Pancit Canton Kalamansi',
    romanization: 'Lucky Me Pancit Canton Kalamansi',
    containerType: 'BAG',
    standardNetQuantity: '80 g',
    category: 'Pantry Staples',
    categoryEn: 'Pantry Staples',
    defaultLocation: 'Pantry',
    shelfLifeDays: 365,
    keywords: ['lucky me', 'pancit canton', 'pancit', 'canton', 'kalamansi', 'calamansi', 'nouilles', 'noodles', '80g'],
  },
  {
    id: 'ph_mang_tomas_sarsa',
    region: 'PHILIPPINES',
    brand: 'Mang Tomas',
    nameFr: 'Sauce savoureuse tout usage pour rôti et porc croustillant (Sarsa ng Lechon)',
    nameEn: 'Mang Tomas All-Around Lechon Sauce for Pork & Roasts',
    originalScript: 'Mang Tomas All-Around Sarsa',
    romanization: 'Mang Tomas Sarsa ng Lechon',
    containerType: 'BOTTLE',
    standardNetQuantity: '550 g',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Fridge',
    shelfLifeDays: 540,
    keywords: ['mang tomas', 'sarsa', 'lechon', 'sauce', 'pork', 'porc', 'philippines', '550g'],
  },
  {
    id: 'ph_century_tuna_flakes',
    region: 'PHILIPPINES',
    brand: 'Century Tuna',
    nameFr: 'Thon émietté dans l\'huile de soya Century Tuna (Flakes in Oil)',
    nameEn: 'Century Tuna Flakes in Oil with Omega 3 DHA',
    originalScript: 'Century Tuna Flakes in Oil',
    romanization: 'Century Tuna Flakes in Oil',
    containerType: 'CAN',
    standardNetQuantity: '180 g',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 1095,
    keywords: ['century tuna', 'tuna', 'thon', 'flakes in oil', 'philippines', 'can', '180g'],
  },
  {
    id: 'ph_aroy_d_coconut_milk',
    region: 'PHILIPPINES',
    brand: 'Aroy-D',
    nameFr: 'Lait de coco 100% pur sans agent de conservation (Gata)',
    nameEn: 'Aroy-D 100% Pure Coconut Milk (Gata)',
    originalScript: 'Aroy-D 100% Pure Coconut Milk',
    romanization: 'Aroy-D Coconut Milk',
    containerType: 'CARTON',
    standardNetQuantity: '400 ml',
    category: 'Canned Goods',
    categoryEn: 'Canned Goods',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: ['aroy-d', 'aroy d', 'coconut', 'milk', 'lait de coco', 'gata', 'tetra', 'carton', '400ml'],
  },
  {
    id: 'ph_knorr_liquid_seasoning_250ml',
    region: 'PHILIPPINES',
    brand: 'Knorr',
    nameFr: 'Assaisonnement liquide Original Knorr',
    nameEn: 'Knorr Original Liquid Seasoning',
    originalScript: 'Knorr Liquid Seasoning',
    romanization: 'Knorr Liquid Seasoning',
    containerType: 'BOTTLE',
    standardNetQuantity: '250 ml',
    category: 'Condiments',
    categoryEn: 'Condiments',
    defaultLocation: 'Pantry',
    shelfLifeDays: 730,
    keywords: [
      'knorr',
      'liquid seasoning',
      'assaisonnement liquide',
      'assaisonnement',
      'liquide',
      'original',
      '250ml',
      'philippines',
      'dipping',
      'marinating',
      'seasoning',
      'trempettes',
      'marinades',
      'cuisiner',
      'vegetarians',
      'vegetariens',
      'bouteille',
      'bottle',
      'unilever',
    ],
    storageTipFr: 'Conserver dans un endroit frais et sec. Peut être gardé au garde-manger ou au réfrigérateur après ouverture ; bien refermer le bouchon verseur pour éviter les résidus.',
    storageTip: 'Store in a cool dry cupboard. Can be kept in pantry or fridge after opening; ensure the red dispenser flip-cap is snapped tightly shut.',
  },
];

/**
 * Normalizes text for fast token search (strips accents, lowercases, removes non-alphanumeric except spaces)
 */
export function normalizePackageText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns region badge metadata (flag + label)
 */
export function getRegionBadge(region: PackageRegion, lang: 'FR' | 'EN' = 'FR'): { flag: string; label: string } {
  switch (region) {
    case 'NORTH_AMERICA':
      return { flag: '🇨🇦 / 🇺🇸', label: lang === 'FR' ? 'Amérique du Nord' : 'North America' };
    case 'SOUTH_AMERICA':
      return { flag: '🌎', label: lang === 'FR' ? 'Amérique du Sud' : 'South America' };
    case 'CHINA':
      return { flag: '🇨🇳', label: lang === 'FR' ? 'Chine' : 'China' };
    case 'JAPAN':
      return { flag: '🇯🇵', label: lang === 'FR' ? 'Japon' : 'Japan' };
    case 'PHILIPPINES':
      return { flag: '🇵🇭', label: lang === 'FR' ? 'Philippines' : 'Philippines' };
    default:
      return { flag: '🌐', label: lang === 'FR' ? 'International' : 'Global' };
  }
}

/**
 * Returns visual icon and localized title for container type
 */
export function getContainerTypeInfo(containerType: ContainerType, lang: 'FR' | 'EN' = 'FR'): { icon: string; label: string; short: string } {
  switch (containerType) {
    case 'CAN':
      return { icon: '🥫', label: lang === 'FR' ? 'Boîte de conserve' : 'Canned Goods', short: lang === 'FR' ? 'Boîte' : 'Can' };
    case 'BOX':
      return { icon: '📦', label: lang === 'FR' ? 'Boîte en carton' : 'Cardboard Box', short: lang === 'FR' ? 'Boîte' : 'Box' };
    case 'BAG':
      return { icon: '🛍️', label: lang === 'FR' ? 'Sachet ou sac' : 'Bag or Pouch', short: lang === 'FR' ? 'Sac' : 'Bag' };
    case 'JAR':
      return { icon: '🫙', label: lang === 'FR' ? 'Bocal en verre' : 'Glass Jar', short: lang === 'FR' ? 'Bocal' : 'Jar' };
    case 'CARTON':
      return { icon: '🧃', label: lang === 'FR' ? 'Brique Tetra Pak' : 'Tetra Pak Carton', short: lang === 'FR' ? 'Carton' : 'Carton' };
    case 'BOTTLE':
      return { icon: '🍾', label: lang === 'FR' ? 'Bouteille' : 'Bottle', short: lang === 'FR' ? 'Bouteille' : 'Bottle' };
    case 'TUB':
      return { icon: '🥣', label: lang === 'FR' ? 'Pot plastique' : 'Plastic Tub', short: lang === 'FR' ? 'Pot' : 'Tub' };
    default:
      return { icon: '📦', label: lang === 'FR' ? 'Emballage' : 'Package', short: lang === 'FR' ? 'Emballage' : 'Package' };
  }
}

/**
 * Searches the preloaded global database using multi-token matching
 */
export function findGlobalPackageByTokens(rawText: string): { item: GlobalPackageItem; score: number } | null {
  if (!rawText || rawText.trim().length < 2) return null;
  const normalized = normalizePackageText(rawText);
  const inputTokens = normalized.split(' ').filter((t) => t.length >= 2);
  if (inputTokens.length === 0) return null;

  let bestMatch: { item: GlobalPackageItem; score: number } | null = null;
  let highestScore = 0;

  for (const item of GLOBAL_PACKAGE_CATALOG) {
    let score = 0;
    const normBrand = normalizePackageText(item.brand);
    const normNameFr = normalizePackageText(item.nameFr);
    const normNameEn = normalizePackageText(item.nameEn);
    const normKeywords = item.keywords.map(normalizePackageText);

    // Brand exact match bonus
    if (inputTokens.some((tok) => normBrand.includes(tok) && tok.length >= 3)) {
      score += 40;
    }

    // Keyword matches
    for (const tok of inputTokens) {
      if (normNameFr.includes(tok)) score += 15;
      if (normNameEn.includes(tok)) score += 15;
      if (normKeywords.some((kw) => kw.includes(tok) || tok.includes(kw))) score += 10;
    }

    // Native script match if rawText contains CJK or non-Latin
    if (item.originalScript && rawText.includes(item.originalScript.slice(0, 3))) {
      score += 60;
    }

    // Romanization match
    if (item.romanization) {
      const normRom = normalizePackageText(item.romanization);
      for (const tok of inputTokens) {
        if (normRom.includes(tok)) score += 20;
      }
    }

    if (score > highestScore && score >= 25) {
      highestScore = score;
      bestMatch = { item, score };
    }
  }

  return bestMatch;
}
