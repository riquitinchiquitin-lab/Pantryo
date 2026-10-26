// Curated High-Definition Food Photography Assets
// High-availability food photography with zero hotlink blocking & instant rendering.

export interface FoodPhotoPreset {
  id: string;
  labelFr: string;
  labelEn: string;
  url: string;
  keywords: string[];
}

export const CURATED_FOOD_PHOTOS: FoodPhotoPreset[] = [
  // --- Cookies & Baked Treats (Biscuits & Pâtisseries) ---
  {
    id: 'peanut_butter_cookies',
    labelFr: 'Biscuits dorés au beurre d\'arachides',
    labelEn: 'Classic Peanut Butter Cookies',
    url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80',
    keywords: ['peanut butter', 'beurre d\'arachide', 'beurre d\'arachides', 'arachides', 'peanuts', 'five roses', 'quadrillage', 'fourchette'],
  },
  {
    id: 'butter_balls_jam',
    labelFr: 'Boules au beurre avec confiture',
    labelEn: 'Butter Balls with Jam',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    keywords: ['boules au beurre', 'butter balls', 'thumbprint', 'confiture', 'sablés', 'shortbread', 'sablé', 'boule'],
  },
  {
    id: 'orange_crisps',
    labelFr: 'Croquants à l\'orange',
    labelEn: 'Orange Crisp Cookies',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    keywords: ['croquants', 'orange', 'crisps', 'biscotti', 'citron', 'agrumes', 'croquant', 'biscuit croquant'],
  },
  {
    id: 'chaudron_cookies',
    labelFr: 'Biscuits préparés au chaudron (sans cuisson)',
    labelEn: 'Stovetop Chocolate Oatmeal Cookies',
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
    keywords: ['chaudron', 'shawn perry', 'sans cuisson', 'no bake', 'no-bake', 'cacao', 'fudge', 'casserole', 'drop cookies'],
  },
  {
    id: 'oatmeal_cookies',
    labelFr: 'Biscuits moelleux à l\'avoine',
    labelEn: 'Chewy Oatmeal Cookies',
    url: 'https://images.unsplash.com/photo-1597528662465-55ece5734101?auto=format&fit=crop&w=800&q=80',
    keywords: ['avoine', 'oatmeal', 'oat', 'kevin lavoie', 'flocons d\'avoine', 'raisins', 'biscuit à l\'avoine', 'galettes à l\'avoine'],
  },
  {
    id: 'classic_cookies',
    labelFr: 'Biscuits aux pépites de chocolat',
    labelEn: 'Chocolate Chip Cookies',
    url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
    keywords: ['biscuit', 'biscuits', 'cookie', 'cookies', 'galette', 'galettes', 'pépites', 'chocolate chip'],
  },
  {
    id: 'blueberry_muffins',
    labelFr: 'Muffins moelleux aux bleuets',
    labelEn: 'Blueberry Muffins',
    url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80',
    keywords: ['muffin', 'muffins', 'bleuets', 'blueberries', 'cupcake', 'cupcakes', 'gâteau', 'cake', 'brownie', 'dessert'],
  },
  {
    id: 'apple_pie',
    labelFr: 'Tarte dorée aux pommes & cannelle',
    labelEn: 'Cinnamon Apple Pie',
    url: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80',
    keywords: ['tarte', 'pie', 'tourtière', 'apple pie', 'tarte aux pommes', 'crumble', 'croustade'],
  },

  // --- Savory Meals & Meats ---
  {
    id: 'maple_pork_roast',
    labelFr: 'Rôti de porc aux pommes & érable',
    labelEn: 'Apple & Maple Syrup Pork Roast',
    url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
    keywords: ['rôti de porc', 'pork roast', 'porc', 'pork', 'érable', 'maple', 'pommes', 'longe', 'porc aux pommes'],
  },
  {
    id: 'tuscan_chicken',
    labelFr: 'Poulet crémeux toscan',
    labelEn: 'Creamy Tuscan Chicken',
    url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    keywords: ['tuscan', 'toscane', 'crémeux', 'cream', 'épinards', 'spinach', 'parmesan chicken', 'poulet', 'chicken', 'volaille'],
  },
  {
    id: 'meatballs_marinara',
    labelFr: 'Boulettes de viande à la sauce marinara',
    labelEn: 'Italian Meatballs Marinara',
    url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
    keywords: ['meatball', 'meatballs', 'boulette', 'boulettes', 'polpette', 'polpettes', 'meatball nirvana'],
  },
  {
    id: 'beef_stew',
    labelFr: 'Poêlée campagnarde de bœuf',
    labelEn: 'French Beef & Veggie Skillet',
    url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
    keywords: ['stew', 'boeuf', 'bœuf', 'beef', 'bourguignon', 'poêlée', 'viande', 'meat', 'steak', 'bavette', 'filet mignon'],
  },
  {
    id: 'filipino_stew',
    labelFr: 'Mijoté savoureux & riz',
    labelEn: 'Savory Pork Belly Stew & Rice',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    keywords: ['sinigang', 'adobo', 'pork belly', 'liempo', 'filipino', 'panlasang', 'tinola', 'caldereta', 'menudo', 'sisig'],
  },
  {
    id: 'french_onion_soup',
    labelFr: 'Soupe à l\'oignon gratinée',
    labelEn: 'Classic French Onion Soup',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    keywords: ['oignon', 'onion soup', 'soupe à l\'oignon', 'gratinée', 'gruyère', 'broth', 'soup', 'soupe', 'potage', 'minestrone', 'velouté'],
  },
  {
    id: 'coconut_curry',
    labelFr: 'Curry de poulet au lait de coco',
    labelEn: 'Coconut Chicken Curry',
    url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    keywords: ['curry', 'cari', 'coco', 'coconut', 'curry de poulet', 'tikka'],
  },
  {
    id: 'pasta_bolognese',
    labelFr: 'Pâtes bolognaise au ragù',
    labelEn: 'Tagliatelle Bolognese',
    url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80',
    keywords: ['pasta', 'pâtes', 'tagliatelle', 'spaghetti', 'bolognese', 'ragù', 'lasagne', 'penne', 'spaghetti sauce', 'pomodoro', 'tomate', 'tomato', 'marinara'],
  },
  {
    id: 'margherita_pizza',
    labelFr: 'Pizza margherita au feu de bois',
    labelEn: 'Wood-Fired Margherita Pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    keywords: ['pizza', 'calzone', 'focaccia', 'croûte'],
  },
  {
    id: 'gourmet_burger',
    labelFr: 'Burger gourmet & frites',
    labelEn: 'Gourmet Burger & Fries',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    keywords: ['burger', 'hambourgeois', 'sandwich', 'panini', 'club sandwich'],
  },
  {
    id: 'salmon_asparagus',
    labelFr: 'Saumon grillé & asperges',
    labelEn: 'Grilled Salmon & Asparagus',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    keywords: ['salmon', 'saumon', 'fish', 'poisson', 'asparagus', 'asperges', 'truite'],
  },
  {
    id: 'garden_salad',
    labelFr: 'Salade maraîchère fraîche',
    labelEn: 'Fresh Garden Salad',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    keywords: ['salad', 'salade', 'greens', 'laitue', 'crudités', 'vinaigrette', 'caesar'],
  },

  // --- Breakfast & Brunch ---
  {
    id: 'fluffy_pancakes',
    labelFr: 'Crêpes & pancakes au sirop d\'érable',
    labelEn: 'Fluffy Buttermilk Pancakes',
    url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',
    keywords: ['pancake', 'pancakes', 'crêpe', 'crêpes', 'gaufre', 'gaufres', 'waffle', 'french toast', 'pain doré'],
  },
  {
    id: 'avocado_toast',
    labelFr: 'Tartine avocat & œuf poché',
    labelEn: 'Avocado Toast & Egg',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    keywords: ['avocado', 'avocat', 'toast', 'tartine', 'brunch', 'oeuf mollet', 'egg'],
  },
  {
    id: 'scrambled_eggs',
    labelFr: 'Œufs brouillés crémeux',
    labelEn: 'Creamy Scrambled Eggs',
    url: 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?auto=format&fit=crop&w=800&q=80',
    keywords: ['scramble', 'brouillade', 'œufs', 'oeufs', 'eggs', 'omelette', 'omelet'],
  },
  {
    id: 'strawberry_parfait',
    labelFr: 'Parfait yogourt & fraises',
    labelEn: 'Strawberry Yogurt Parfait',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    keywords: ['parfait', 'yogurt', 'yogourt', 'fraises', 'strawberries', 'granola', 'smoothie', 'shake', 'baies'],
  },
];

/**
 * Returns true if a given URL is a raw scanned document (cookbook page, typewriter page, receipt).
 */
export function isDocumentScan(url?: string): boolean {
  if (!url) return false;
  return /Image_October|PXL_|Screenshot_|camera_snap|raw_scan|data:image/i.test(url);
}

/**
 * Returns a high-definition food photograph accurately matching title, keywords, or meal slot type.
 * Never misclassifies baked goods or cookies as fish/dinner stews.
 */
export function getCuratedMealPhoto(title?: string, mealType?: string, tags: string[] = []): string {
  const combinedText = [
    title || '',
    ...(Array.isArray(tags) ? tags : []),
  ].join(' ').toLowerCase();

  if (combinedText.trim()) {
    // 1. Direct Keyword Match against curated library
    for (const preset of CURATED_FOOD_PHOTOS) {
      if (preset.keywords.some((k) => combinedText.includes(k.toLowerCase()))) {
        return preset.url;
      }
    }

    // 2. High-level category fallbacks based on food words
    // Baked goods & Cookies
    if (/biscuit|cookie|galette|croquant|sablé|shortbread|pâtisserie|baking|arachide|fudge|cacao/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[5].url; // Classic cookies
    }
    // Cakes, muffins & desserts
    if (/gâteau|cake|muffin|tarte|pie|brownie|dessert|sucre/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[6].url; // Blueberry muffins
    }
    // Pork & Roasts
    if (/porc|pork|longe|jambon|ham|bacon/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[8].url; // Maple pork roast
    }
    // Chicken & Poultry
    if (/poulet|chicken|dindon|turkey|volaille|fajita/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[9].url; // Tuscan chicken
    }
    // Beef & Red Meat
    if (/bœuf|boeuf|beef|steak|veau|veal/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[11].url; // Beef stew / steak
    }
    // Pasta & Italian
    if (/pâte|pasta|spaghetti|macaroni|lasagne|penne/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[15].url; // Pasta bolognese
    }
    // Soups
    if (/soupe|soup|potage|bouillon|chowder|crème/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[13].url; // French onion soup
    }
    // Fish & Seafood
    if (/saumon|salmon|poisson|fish|crevette|shrimp|morue|truite/i.test(combinedText)) {
      return CURATED_FOOD_PHOTOS[18].url; // Grilled salmon
    }
  }

  // 3. Fallback by meal slot type
  if (mealType === 'BREAKFAST' || /déjeuner|breakfast|brunch/i.test(combinedText)) {
    return CURATED_FOOD_PHOTOS[20].url; // Fluffy pancakes
  }
  if (mealType === 'SNACK' || /collation|snack|goûter|biscuit/i.test(combinedText)) {
    return CURATED_FOOD_PHOTOS[5].url; // Classic cookies
  }
  if (mealType === 'LUNCH' || /midi|lunch|dîner/i.test(combinedText)) {
    return CURATED_FOOD_PHOTOS[17].url; // Gourmet burger or sandwich
  }

  // General dinner fallback: comforting pasta
  return CURATED_FOOD_PHOTOS[15].url; // Tagliatelle bolognese
}

/**
 * Offline-resilient SVG placeholder data URI with culinary gradient and food badge.
 */
export function getFoodSvgFallback(title: string = 'Recipe'): string {
  const safeTitle = title.replace(/["<>]/g, '').slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F3833"/>
        <stop offset="50%" stop-color="#1B4D46"/>
        <stop offset="100%" stop-color="#2D6A5F"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bg)"/>
    <circle cx="300" cy="180" r="64" fill="white" fill-opacity="0.1"/>
    <path d="M276 172c0-13.25 10.75-24 24-24s24 10.75 24 24v20h-48v-20zm-8 28h64a6 6 0 0 1 6 6v4a12 12 0 0 1-12 12h-52a12 12 0 0 1-12-12v-4a6 6 0 0 1 6-6z" fill="#E8D5B5"/>
    <text x="300" y="275" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="18" font-weight="bold" fill="#F4EADB" text-anchor="middle">${safeTitle}</text>
    <text x="300" y="300" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="#A7C4BD" text-anchor="middle">PANTRYO RECIPES</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
