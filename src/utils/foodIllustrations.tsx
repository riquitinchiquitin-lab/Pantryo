import React, { useState } from 'react';

export interface FoodCategoryVisual {
  key: string;
  emoji: string;
  labelEn: string;
  labelFr: string;
  bgGradient: string;
  borderClass: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export const FOOD_CATEGORY_VISUALS: Record<string, FoodCategoryVisual> = {
  produce: {
    key: 'produce',
    emoji: '🥦',
    labelEn: 'Produce & Veggies',
    labelFr: 'Fruits & Légumes',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderClass: 'border-emerald-200',
    accentColor: '#10B981',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  fruit: {
    key: 'fruit',
    emoji: '🍎',
    labelEn: 'Fruits & Berries',
    labelFr: 'Fruits Frais',
    bgGradient: 'from-rose-50 to-amber-50',
    borderClass: 'border-rose-200',
    accentColor: '#F43F5E',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
  },
  dairy: {
    key: 'dairy',
    emoji: '🥛',
    labelEn: 'Dairy & Eggs',
    labelFr: 'Produits Laitiers & Œufs',
    bgGradient: 'from-amber-50 to-yellow-50',
    borderClass: 'border-amber-200',
    accentColor: '#F59E0B',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  meat: {
    key: 'meat',
    emoji: '🥩',
    labelEn: 'Fresh Meat & Poultry',
    labelFr: 'Viandes & Volailles',
    bgGradient: 'from-red-50 to-orange-50',
    borderClass: 'border-red-200',
    accentColor: '#EF4444',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
  },
  seafood: {
    key: 'seafood',
    emoji: '🐟',
    labelEn: 'Fish & Seafood',
    labelFr: 'Poissons & Fruits de Mer',
    bgGradient: 'from-sky-50 to-cyan-50',
    borderClass: 'border-sky-200',
    accentColor: '#0EA5E9',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
  },
  bakery: {
    key: 'bakery',
    emoji: '🥖',
    labelEn: 'Bakery & Bread',
    labelFr: 'Boulangerie & Pains',
    bgGradient: 'from-amber-50 to-orange-50',
    borderClass: 'border-amber-200',
    accentColor: '#D97706',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
  },
  pantry: {
    key: 'pantry',
    emoji: '🍝',
    labelEn: 'Pantry & Dry Goods',
    labelFr: 'Garde-Manger & Épicerie',
    bgGradient: 'from-stone-50 to-amber-50/40',
    borderClass: 'border-stone-200',
    accentColor: '#78716C',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-800',
  },
  frozen: {
    key: 'frozen',
    emoji: '🧊',
    labelEn: 'Frozen Foods',
    labelFr: 'Surgelés & Glaces',
    bgGradient: 'from-cyan-50 to-blue-50',
    borderClass: 'border-cyan-200',
    accentColor: '#06B6D4',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
  },
  spices: {
    key: 'spices',
    emoji: '🧂',
    labelEn: 'Spices & Seasoning',
    labelFr: 'Épices & Assaisonnements',
    bgGradient: 'from-orange-50 to-amber-50',
    borderClass: 'border-orange-200',
    accentColor: '#EA580C',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
  },
  condiments: {
    key: 'condiments',
    emoji: '🍯',
    labelEn: 'Condiments & Sauces',
    labelFr: 'Sauces & Condiments',
    bgGradient: 'from-yellow-50 to-amber-50',
    borderClass: 'border-yellow-200',
    accentColor: '#CA8A04',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
  },
  beverages: {
    key: 'beverages',
    emoji: '☕',
    labelEn: 'Beverages & Drinks',
    labelFr: 'Boissons & Cafés',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderClass: 'border-emerald-200',
    accentColor: '#0D9488',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
  },
  meal_prep: {
    key: 'meal_prep',
    emoji: '🍱',
    labelEn: 'Meal Prep & Prepared Dishes',
    labelFr: 'Plats Préparés & Batch Cooking',
    bgGradient: 'from-indigo-50 to-teal-50',
    borderClass: 'border-indigo-200',
    accentColor: '#6366F1',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
  },
};

/**
 * Resolves the best category visual configuration for a given item by its category or food name
 */
export function getFoodCategoryVisual(categoryName?: string, foodName?: string): FoodCategoryVisual {
  const text = `${categoryName || ''} ${foodName || ''}`.toLowerCase();

  if (/meal prep|batch cook|lunchbox|prepared|plat pr[ée]par[ée]|plat cuisin[ée]|contenant/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.meal_prep;
  }
  if (/fish|salmon|tuna|seafood|shrimp|crevette|poisson|saumon|morue|truite|clam|mussel|crab|homard/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.seafood;
  }
  if (/beef|chicken|poulet|boeuf|bœuf|pork|porc|steak|meat|viande|bacon|veal|veau|turkey|dinde|sausage|saucisse/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.meat;
  }
  if (/milk|lait|cheese|fromage|cheddar|yogourt|yogurt|butter|beurre|cr[èe]me|cream|egg|oeuf|œuf/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.dairy;
  }
  if (/apple|pomme|banana|banane|orange|berry|berries|fraise|strawberry|blueberry|bleuet|raspberry|framboise|citron|lemon|lime|grape|raisin|fruit/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.fruit;
  }
  if (/legume|vegetable|produce|spinach|[ée]pinard|carrot|carotte|potato|pomme de terre|onion|oignon|garlic|ail|tomato|tomate|pepper|poivron|broccoli|brocoli|lettuce|salade|cucumber|concombre/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.produce;
  }
  if (/bread|pain|baguette|croissant|brioche|muffin|pastry|p[âa]tisserie|tortilla|pita|bagel|bakery|boulangerie/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.bakery;
  }
  if (/frozen|surgel[ée]|glace|ice cream|popsicle|congel/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.frozen;
  }
  if (/spice|[ée]pice|salt|sel|pepper|poivre|cinnamon|cannelle|paprika|cumin|oregano|herbe|herb|thyme|thym|basil|basilic/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.spices;
  }
  if (/sauce|condiment|ketchup|mustard|moutarde|mayo|mayonnaise|vinegar|vinaigre|oil|huile|dressing|vinaigrette|honey|miel|jam|confiture|syrup|sirop/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.condiments;
  }
  if (/beverage|drink|boisson|coffee|caf[ée]|tea|th[ée]|juice|jus|wine|vin|beer|bi[èe]re|soda|water|eau/i.test(text)) {
    return FOOD_CATEGORY_VISUALS.beverages;
  }
  return FOOD_CATEGORY_VISUALS.pantry;
}

interface FoodItemImageProps {
  src?: string | null;
  name: string;
  category?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCategoryPill?: boolean;
}

/**
 * Universal component that displays a food photo, or a curated category illustration with clean accents
 */
export const FoodItemImage: React.FC<FoodItemImageProps> = ({
  src,
  name,
  category,
  className = '',
  size = 'md',
  showCategoryPill = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const visual = getFoodCategoryVisual(category, name);

  const sizeClasses = {
    xs: 'w-7 h-7 text-sm rounded-lg',
    sm: 'w-10 h-10 text-xl rounded-xl',
    md: 'w-14 h-14 text-2xl rounded-2xl',
    lg: 'w-20 h-20 text-3xl rounded-2xl',
    xl: 'w-full h-44 text-5xl rounded-3xl',
  }[size];

  const hasValidPhoto = Boolean(src && typeof src === 'string' && src.trim().length > 5 && !hasError);

  if (hasValidPhoto && src) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 shrink-0 ${sizeClasses} ${className}`}>
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {showCategoryPill && (
          <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${visual.badgeBg} ${visual.badgeText} shadow-xs backdrop-blur-xs`}>
            {visual.emoji}
          </span>
        )}
      </div>
    );
  }

  // Curated Generic Category Illustration
  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${visual.bgGradient} border ${visual.borderClass} shadow-2xs select-none shrink-0 overflow-hidden ${sizeClasses} ${className}`}
      title={`${name} (${visual.labelEn})`}
    >
      {/* Decorative background radial pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 75% 25%, ${visual.accentColor} 10%, transparent 60%)`,
        }}
      />
      {/* Category Cut Icon Emoji */}
      <span className="relative drop-shadow-xs transform transition-transform hover:scale-110 duration-200">
        {visual.emoji}
      </span>
      {showCategoryPill && (
        <span className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${visual.badgeBg} ${visual.badgeText} shadow-xs`}>
          {visual.key}
        </span>
      )}
    </div>
  );
};
