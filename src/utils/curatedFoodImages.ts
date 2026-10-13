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
  {
    id: 'salmon_asparagus',
    labelFr: 'Saumon grillé & asperges',
    labelEn: 'Grilled Salmon & Asparagus',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    keywords: ['salmon', 'saumon', 'fish', 'poisson', 'asparagus', 'asperges', 'truite'],
  },
  {
    id: 'pasta_bolognese',
    labelFr: 'Pâtes bolognaise au ragù',
    labelEn: 'Tagliatelle Bolognese',
    url: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80',
    keywords: ['pasta', 'pâtes', 'tagliatelle', 'spaghetti', 'bolognese', 'ragù', 'lasagne', 'penne', 'spaghetti sauce'],
  },
  {
    id: 'pasta_pomodoro',
    labelFr: 'Pâtes tomate & basilic',
    labelEn: 'Tomato & Basil Pasta',
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    keywords: ['pomodoro', 'tomate', 'tomato', 'ail', 'garlic', 'marinara', 'italian'],
  },
  {
    id: 'french_toast',
    labelFr: 'Pain doré aux petits fruits',
    labelEn: 'Berry French Toast',
    url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',
    keywords: ['french toast', 'pain doré', 'pain', 'toast', 'compote', 'berries', 'érable', 'maple', 'pancake', 'crepe', 'crêpe'],
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
    keywords: ['scramble', 'brouillade', 'œufs', 'oeufs', 'eggs', 'omelette', 'omelet', 'ramsay'],
  },
  {
    id: 'beef_tacos',
    labelFr: 'Tacos au bœuf & légumes',
    labelEn: 'Beef Tacos Skillet',
    url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    keywords: ['taco', 'tacos', 'mexican', 'mexicaine', 'fajita', 'burrito', 'quesadilla', 'skillet'],
  },
  {
    id: 'salmon_poke_bowl',
    labelFr: 'Bol zen saumon & avocat',
    labelEn: 'Salmon Avocado Poke Bowl',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    keywords: ['bowl', 'poke', 'zen', 'sésame', 'riz', 'rice bowl', 'salade de saumon'],
  },
  {
    id: 'beef_stew',
    labelFr: 'Poêlée campagnarde de bœuf',
    labelEn: 'French Beef & Veggie Skillet',
    url: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
    keywords: ['stew', 'boeuf', 'bœuf', 'beef', 'bourguignon', 'poêlée', 'viande', 'meat', 'steak', 'marmiton'],
  },
  {
    id: 'filipino_stew',
    labelFr: 'Mijoté savoureux & riz',
    labelEn: 'Savory Pork Belly Stew & Rice',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    keywords: ['sinigang', 'adobo', 'pork belly', 'liempo', 'filipino', 'panlasang', 'tinola', 'caldereta', 'menudo', 'sisig'],
  },
  {
    id: 'hummus_pita',
    labelFr: 'Trempette houmous & pain pita',
    labelEn: 'Herbed Pita & Chickpea Dip',
    url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    keywords: ['hummus', 'houmous', 'dip', 'trempette', 'pita', 'chickpea', 'pois chiches'],
  },
  {
    id: 'strawberry_parfait',
    labelFr: 'Parfait yogourt & fraises',
    labelEn: 'Strawberry Yogurt Parfait',
    url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    keywords: ['parfait', 'yogurt', 'yogourt', 'fraises', 'strawberries', 'granola', 'dessert'],
  },
  {
    id: 'salmon_veggies',
    labelFr: 'Pavé de saumon aux légumes',
    labelEn: 'Salmon & Steamed Veggies',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    keywords: ['legumes', 'légumes', 'steamed', 'healthy', 'filet de saumon'],
  },
  {
    id: 'garden_salad',
    labelFr: 'Salade maraîchère fraîche',
    labelEn: 'Fresh Garden Salad',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    keywords: ['salad', 'salade', 'greens', 'laitue', 'crudités', 'vinaigrette', 'caesar'],
  },
  {
    id: 'veggie_soup',
    labelFr: 'Soupe rustique aux légumes',
    labelEn: 'Rustic Minestrone Soup',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    keywords: ['soup', 'soupe', 'minestrone', 'potage', 'bouillon', 'velouté'],
  },
  {
    id: 'smoothie_bowl',
    labelFr: 'Bol de smoothie aux baies',
    labelEn: 'Antioxidant Berry Smoothie',
    url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
    keywords: ['smoothie', 'shake', 'baies', 'fruits', 'açaí', 'acai', 'breakfast bowl'],
  },
  {
    id: 'chicken_fajitas',
    labelFr: 'Poulet rôti ou fajitas',
    labelEn: 'Roasted Chicken Skillet',
    url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    keywords: ['chicken', 'poulet', 'volaille', 'fajitas', 'curry de poulet', 'afritada'],
  },
];

/**
 * Returns a high-definition food photograph matching title, keywords, or meal slot type.
 */
export function getCuratedMealPhoto(title?: string, mealType?: string): string {
  if (!title) {
    if (mealType === 'BREAKFAST') return CURATED_FOOD_PHOTOS[4].url; // Avocado toast
    if (mealType === 'LUNCH') return CURATED_FOOD_PHOTOS[1].url; // Pasta bolognese
    if (mealType === 'SNACK') return CURATED_FOOD_PHOTOS[11].url; // Strawberry parfait
    return CURATED_FOOD_PHOTOS[0].url; // Salmon & asparagus
  }

  const lower = title.toLowerCase();

  for (const preset of CURATED_FOOD_PHOTOS) {
    if (preset.keywords.some((k) => lower.includes(k))) {
      return preset.url;
    }
  }

  // Fallback by meal slot type
  if (mealType === 'BREAKFAST' || lower.includes('déjeuner') || lower.includes('breakfast')) {
    return CURATED_FOOD_PHOTOS[5].url; // Scrambled eggs
  }
  if (mealType === 'SNACK' || lower.includes('collation') || lower.includes('snack')) {
    return CURATED_FOOD_PHOTOS[11].url; // Strawberry parfait
  }
  if (mealType === 'LUNCH' || lower.includes('midi') || lower.includes('lunch')) {
    return CURATED_FOOD_PHOTOS[7].url; // Poke bowl
  }

  // General dinner fallback: pasta or salmon
  return CURATED_FOOD_PHOTOS[1].url; // Tagliatelle bolognese
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
