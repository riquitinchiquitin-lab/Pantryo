import React from 'react';
import {
  Apple,
  Carrot,
  Milk,
  Egg,
  Beef,
  Fish,
  Wheat,
  Croissant,
  Coffee,
  Package,
  Soup,
  Cookie,
  Utensils,
  Snowflake,
  Flame,
  Salad,
  Grape,
  Citrus,
  Cherry,
  Sandwich,
  Pizza,
  Drumstick,
  IceCream,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface FoodTypeVisual {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
  defaultImage: string;
  badgeLabel: string;
}

// Category mapping with theme colors, Lucide icons, and curated food photos
export const FOOD_CATEGORY_VISUALS: Record<string, FoodTypeVisual> = {
  'Dairy & Eggs': {
    icon: Milk,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    defaultImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Dairy & Eggs',
  },
  Produce: {
    icon: Apple,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    defaultImage: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Produce',
  },
  'Meat & Seafood': {
    icon: Beef,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    defaultImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Meat & Seafood',
  },
  Bakery: {
    icon: Wheat,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    defaultImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Bakery',
  },
  'Pantry Staples': {
    icon: Package,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    defaultImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Pantry Staples',
  },
  'Frozen Meals': {
    icon: Snowflake,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Frozen Meals',
  },
  Beverages: {
    icon: Coffee,
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    defaultImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Beverages',
  },
  Snacks: {
    icon: Cookie,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    defaultImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Snacks',
  },
  Condiments: {
    icon: Soup,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    defaultImage: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=300&q=80',
    badgeLabel: 'Condiments',
  },
};

// Granular item name matching for specific foods
export function getFoodVisual(itemName: string = '', categoryName: string = ''): FoodTypeVisual {
  const lowerName = itemName.toLowerCase();

  // Specific food visual overrides based on item name keywords
  if (lowerName.includes('milk') || lowerName.includes('oat milk')) {
    return {
      icon: Milk,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-200',
      defaultImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Dairy & Milk',
    };
  }
  if (lowerName.includes('strawberr') || lowerName.includes('berr')) {
    return {
      icon: Cherry,
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      defaultImage: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Berries',
    };
  }
  if (lowerName.includes('salmon') || lowerName.includes('fish') || lowerName.includes('seafood')) {
    return {
      icon: Fish,
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-700',
      borderColor: 'border-cyan-200',
      defaultImage: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Seafood',
    };
  }
  if (lowerName.includes('beef') || lowerName.includes('steak') || lowerName.includes('meat')) {
    return {
      icon: Beef,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      defaultImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Red Meat',
    };
  }
  if (lowerName.includes('chicken') || lowerName.includes('poultry') || lowerName.includes('turkey')) {
    return {
      icon: Drumstick,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      defaultImage: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Poultry',
    };
  }
  if (lowerName.includes('egg')) {
    return {
      icon: Egg,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      defaultImage: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Fresh Eggs',
    };
  }
  if (lowerName.includes('yogurt')) {
    return {
      icon: Milk,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      defaultImage: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Yogurt',
    };
  }
  if (lowerName.includes('tomato') || lowerName.includes('canned')) {
    return {
      icon: Soup,
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      defaultImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Canned Goods',
    };
  }
  if (lowerName.includes('bread') || lowerName.includes('sourdough') || lowerName.includes('flour')) {
    return {
      icon: Wheat,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      defaultImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Bakery',
    };
  }
  if (lowerName.includes('spinach') || lowerName.includes('salad') || lowerName.includes('lettuce')) {
    return {
      icon: Salad,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-200',
      defaultImage: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Greens',
    };
  }
  if (lowerName.includes('cheese') || lowerName.includes('feta') || lowerName.includes('cheddar')) {
    return {
      icon: Milk,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-200',
      defaultImage: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=300&q=80',
      badgeLabel: 'Cheese',
    };
  }

  // Fallback to category mapping if available
  if (FOOD_CATEGORY_VISUALS[categoryName]) {
    return FOOD_CATEGORY_VISUALS[categoryName];
  }

  // Generic fallback
  return {
    icon: Utensils,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    badgeLabel: categoryName || 'Kitchen Item',
  };
}
