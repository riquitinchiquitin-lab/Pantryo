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

export interface FoodCategoryMeta {
  id: string;
  name: string;
  filterKey: string;
  imageUrl: string;
  icon: LucideIcon;
  badgeLabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export interface FoodSubcategoryMeta {
  id: string;
  parentCategoryId: string;
  name: string;
  keywords: string[];
  imageUrl: string;
  icon: LucideIcon;
  badgeLabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

// Complete catalog of specific food subcategories with web photography
export const ALL_SUB_CATEGORIES: FoodSubcategoryMeta[] = [
  // Meat & Poultry Subcategories
  {
    id: 'sub_beef_steak',
    parentCategoryId: 'cat_meat',
    name: 'Beef Steaks & Prime Cuts',
    keywords: ['steak', 'ribeye', 'sirloin', 't-bone', 'filet mignon', 'tenderloin', 'beef roast', 'flank steak', 'beef chuck'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Prime Beef',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Ribeye, sirloin, tenderloin, striploin & roasts',
  },
  {
    id: 'sub_ground_beef',
    parentCategoryId: 'cat_meat',
    name: 'Ground Beef & Minced Meat',
    keywords: ['ground beef', 'minced beef', 'minced meat', 'ground chuck', 'ground meat', 'bolognese meat', 'hamburger meat'],
    imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Ground Beef',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Ground beef, burger patties, minced chuck & veal',
  },
  {
    id: 'sub_chicken_breast',
    parentCategoryId: 'cat_meat',
    name: 'Chicken Breasts & Cutlets',
    keywords: ['chicken breast', 'chicken cutlet', 'chicken tender', 'boneless chicken', 'chicken fillet'],
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    icon: Drumstick,
    badgeLabel: 'Chicken Breast',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Lean boneless skinless chicken breasts and tenders',
  },
  {
    id: 'sub_chicken_cuts',
    parentCategoryId: 'cat_meat',
    name: 'Chicken Thighs & Wings',
    keywords: ['chicken thigh', 'chicken wing', 'drumstick', 'chicken leg', 'chicken thighs', 'chicken wings'],
    imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
    icon: Drumstick,
    badgeLabel: 'Chicken Cuts',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Juicy chicken thighs, drumsticks, and BBQ wings',
  },
  {
    id: 'sub_whole_chicken',
    parentCategoryId: 'cat_meat',
    name: 'Whole Roast Chicken',
    keywords: ['whole chicken', 'rotisserie chicken', 'roast chicken', 'cornish hen'],
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
    icon: Drumstick,
    badgeLabel: 'Whole Bird',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Whole roasting chicken and rotisserie fowl',
  },
  {
    id: 'sub_pork_chops',
    parentCategoryId: 'cat_meat',
    name: 'Pork Chops & Loins',
    keywords: ['pork chop', 'pork loin', 'pork tenderloin', 'pork roast', 'pork cutlet'],
    imageUrl: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Pork Cuts',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Bone-in pork chops, center-cut loins, and tenderloins',
  },
  {
    id: 'sub_bacon',
    parentCategoryId: 'cat_meat',
    name: 'Bacon & Pancetta',
    keywords: ['bacon', 'pancetta', 'lardons', 'pork belly', 'smoked bacon'],
    imageUrl: 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=600&q=80',
    icon: Flame,
    badgeLabel: 'Crispy Bacon',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Thick-cut applewood smoked bacon and cured pancetta',
  },
  {
    id: 'sub_pork_ribs',
    parentCategoryId: 'cat_meat',
    name: 'Pork Ribs & BBQ Cuts',
    keywords: ['ribs', 'baby back ribs', 'spareribs', 'pork ribs', 'st louis ribs'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Pork Ribs',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Baby back ribs, spareribs, and tender BBQ cuts',
  },
  {
    id: 'sub_lamb',
    parentCategoryId: 'cat_meat',
    name: 'Lamb & Mutton',
    keywords: ['lamb', 'lamb chop', 'lamb shank', 'mutton', 'rack of lamb', 'leg of lamb'],
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Lamb & Mutton',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Rosemary rack of lamb, braised shanks & cutlets',
  },
  {
    id: 'sub_turkey',
    parentCategoryId: 'cat_meat',
    name: 'Turkey & Game Birds',
    keywords: ['turkey', 'turkey breast', 'ground turkey', 'turkey drumstick'],
    imageUrl: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?auto=format&fit=crop&w=600&q=80',
    icon: Drumstick,
    badgeLabel: 'Turkey',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Roasted turkey breast, ground turkey, and cuts',
  },
  {
    id: 'sub_duck',
    parentCategoryId: 'cat_meat',
    name: 'Duck & Confit',
    keywords: ['duck', 'duck breast', 'confit', 'duck leg'],
    imageUrl: 'https://images.unsplash.com/photo-1514944298352-7b83321589d8?auto=format&fit=crop&w=600&q=80',
    icon: Drumstick,
    badgeLabel: 'Duck',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Seared duck breast, confit legs, and duck fat',
  },
  {
    id: 'sub_sausage',
    parentCategoryId: 'cat_meat',
    name: 'Sausages & Bratwurst',
    keywords: ['sausage', 'sausages', 'bratwurst', 'chorizo', 'hot dog', 'frankfurter', 'italian sausage', 'kielbasa'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    icon: Utensils,
    badgeLabel: 'Sausages',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    description: 'Artisanal bratwurst, spicy chorizo, and italian links',
  },
  {
    id: 'sub_charcuterie',
    parentCategoryId: 'cat_meat',
    name: 'Charcuterie & Deli Meats',
    keywords: ['prosciutto', 'salami', 'jamon', 'pastrami', 'ham', 'cured meat', 'pepperoni', 'deli meat', 'mortadella'],
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    icon: Sandwich,
    badgeLabel: 'Charcuterie',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Thinly sliced prosciutto di Parma, salami & deli ham',
  },

  // Fish & Seafood Subcategories
  {
    id: 'sub_salmon',
    parentCategoryId: 'cat_meat',
    name: 'Fresh Salmon Fillets',
    keywords: ['salmon', 'salmon fillet', 'salmon steak', 'atlantic salmon', 'sockeye salmon'],
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Fresh Salmon',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Wild sockeye and Atlantic salmon fillets with rich omega-3s',
  },
  {
    id: 'sub_smoked_salmon',
    parentCategoryId: 'cat_meat',
    name: 'Smoked Salmon & Lox',
    keywords: ['smoked salmon', 'lox', 'gravlax', 'smoked trout'],
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Smoked Lox',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Cold-smoked artisanal salmon slices and bagel lox',
  },
  {
    id: 'sub_white_fish',
    parentCategoryId: 'cat_meat',
    name: 'White Fish Fillets (Cod, Halibut, Tilapia)',
    keywords: ['cod', 'halibut', 'tilapia', 'sea bass', 'bass', 'haddock', 'sole', 'flounder', 'white fish', 'snapper', 'trout', 'pollock'],
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'White Fish',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    description: 'Flaky Atlantic cod, halibut steaks, sea bass & haddock',
  },
  {
    id: 'sub_tuna',
    parentCategoryId: 'cat_meat',
    name: 'Ahi Tuna & Steaks',
    keywords: ['tuna steak', 'ahi tuna', 'yellowfin', 'bluefin tuna', 'fresh tuna'],
    imageUrl: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Ahi Tuna',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Sashimi-grade yellowfin and seared ahi tuna steaks',
  },
  {
    id: 'sub_shrimp',
    parentCategoryId: 'cat_meat',
    name: 'Shrimp & Prawns',
    keywords: ['shrimp', 'prawn', 'prawns', 'scampi', 'tiger shrimp', 'jumbo shrimp'],
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Shrimp & Prawns',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    description: 'Jumbo tiger prawns, peeled cocktail shrimp & scampi',
  },
  {
    id: 'sub_lobster_crab',
    parentCategoryId: 'cat_meat',
    name: 'Lobster & Crab',
    keywords: ['lobster', 'crab', 'crab meat', 'lobster tail', 'king crab', 'snow crab'],
    imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Lobster & Crab',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    description: 'Succulent Maine lobster tails and Alaskan king crab legs',
  },
  {
    id: 'sub_scallops',
    parentCategoryId: 'cat_meat',
    name: 'Sea Scallops',
    keywords: ['scallop', 'scallops', 'sea scallops', 'bay scallops'],
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Scallops',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Pan-seared jumbo sea scallops and delicate bay scallops',
  },
  {
    id: 'sub_shellfish',
    parentCategoryId: 'cat_meat',
    name: 'Mussels, Clams & Oysters',
    keywords: ['mussel', 'mussels', 'clam', 'clams', 'oyster', 'oysters'],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Mussels & Clams',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    description: 'Fresh blue mussels, littleneck clams, and raw oysters',
  },
  {
    id: 'sub_calamari',
    parentCategoryId: 'cat_meat',
    name: 'Calamari, Squid & Octopus',
    keywords: ['squid', 'calamari', 'octopus', 'cuttlefish'],
    imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80',
    icon: Fish,
    badgeLabel: 'Calamari & Squid',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    description: 'Tender calamari rings, whole baby squid & seared octopus',
  },
  {
    id: 'sub_canned_fish',
    parentCategoryId: 'cat_meat',
    name: 'Canned Tuna & Sardines',
    keywords: ['canned tuna', 'sardine', 'sardines', 'anchovy', 'anchovies', 'tuna can'],
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    icon: Package,
    badgeLabel: 'Canned Seafood',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    description: 'Wild caught tuna in olive oil, Portuguese sardines & anchovies',
  },

  // Other Popular Produce & Dairy Subcategories
  {
    id: 'sub_berries',
    parentCategoryId: 'cat_produce',
    name: 'Berries & Small Fruits',
    keywords: ['strawberry', 'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries', 'blackberry', 'blackberries'],
    imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    icon: Cherry,
    badgeLabel: 'Berries',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Fresh organic strawberries, wild blueberries & raspberries',
  },
  {
    id: 'sub_citrus',
    parentCategoryId: 'cat_produce',
    name: 'Citrus Fruits',
    keywords: ['lemon', 'lime', 'orange', 'grapefruit', 'mandarin', 'clementine', 'citrus'],
    imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=600&q=80',
    icon: Citrus,
    badgeLabel: 'Citrus',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    description: 'Juicy lemons, fresh limes, valencia oranges & grapefruits',
  },
  {
    id: 'sub_greens',
    parentCategoryId: 'cat_produce',
    name: 'Salad Greens & Herbs',
    keywords: ['spinach', 'kale', 'lettuce', 'arugula', 'salad', 'basil', 'parsley', 'coriander', 'cilantro', 'mint'],
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    icon: Salad,
    badgeLabel: 'Greens & Herbs',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    description: 'Crisp romaine, baby spinach, peppery arugula & fresh herbs',
  },
  {
    id: 'sub_root_veg',
    parentCategoryId: 'cat_produce',
    name: 'Root Vegetables',
    keywords: ['carrot', 'potato', 'potatoes', 'sweet potato', 'onion', 'garlic', 'ginger', 'beet'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    icon: Carrot,
    badgeLabel: 'Root Vegetables',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Yukon gold potatoes, sweet potatoes, carrots, onions & garlic',
  },
  {
    id: 'sub_cheese',
    parentCategoryId: 'cat_dairy',
    name: 'Cheeses & Curds',
    keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'brie', 'gouda', 'ricotta'],
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80',
    icon: Milk,
    badgeLabel: 'Artisan Cheese',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Aged cheddar, fresh buffalo mozzarella, parmigiano & brie',
  },
  {
    id: 'sub_eggs',
    parentCategoryId: 'cat_dairy',
    name: 'Farm Eggs',
    keywords: ['egg', 'eggs', 'egg whites', 'yolk', 'brown eggs'],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    icon: Egg,
    badgeLabel: 'Farm Eggs',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Free-range pasture-raised brown and organic chicken eggs',
  },
  {
    id: 'sub_pasta',
    parentCategoryId: 'cat_pantry',
    name: 'Pasta & Noodles',
    keywords: ['pasta', 'spaghetti', 'penne', 'noodles', 'ramen', 'linguine', 'macaroni', 'fusilli'],
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80',
    icon: Utensils,
    badgeLabel: 'Pasta & Noodles',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Bronze-die Italian spaghetti, penne rigate & ramen noodles',
  },
  {
    id: 'sub_bread',
    parentCategoryId: 'cat_bakery',
    name: 'Artisanal Bread & Sourdough',
    keywords: ['bread', 'sourdough', 'baguette', 'croissant', 'bagel', 'bun', 'brioche', 'loaf'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    icon: Wheat,
    badgeLabel: 'Fresh Bakery',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Rustic naturally leavened sourdough boules and french baguettes',
  },
];

// Complete catalog of all Food Category Types with authentic, high-res web photography
export const ALL_FOOD_CATEGORIES: FoodCategoryMeta[] = [
  {
    id: 'cat_produce',
    name: 'Produce',
    filterKey: 'Produce',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    icon: Apple,
    badgeLabel: 'Produce',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    description: 'Fresh vegetables, fruits, salad greens & herbs',
  },
  {
    id: 'cat_dairy',
    name: 'Dairy & Eggs',
    filterKey: 'Dairy',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    icon: Milk,
    badgeLabel: 'Dairy & Eggs',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    description: 'Milk, butter, cheeses, yogurt & farm eggs',
  },
  {
    id: 'cat_meat',
    name: 'Meat & Seafood',
    filterKey: 'Meat',
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    icon: Beef,
    badgeLabel: 'Meat & Seafood',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Beef, poultry, pork, salmon & fresh seafood',
  },
  {
    id: 'cat_bakery',
    name: 'Bakery',
    filterKey: 'Bakery',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    icon: Wheat,
    badgeLabel: 'Bakery',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Artisanal sourdough, baguettes, bread & pastries',
  },
  {
    id: 'cat_pantry',
    name: 'Pantry Staples',
    filterKey: 'Pantry',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    icon: Package,
    badgeLabel: 'Pantry Staples',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    description: 'Pasta, grains, legumes, rice, flour & spices',
  },
  {
    id: 'cat_frozen',
    name: 'Frozen Meals',
    filterKey: 'Frozen',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    icon: Snowflake,
    badgeLabel: 'Frozen Meals',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    description: 'Frozen pizzas, dumplings, waffles & frozen veggies',
  },
  {
    id: 'cat_beverages',
    name: 'Beverages',
    filterKey: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    icon: Coffee,
    badgeLabel: 'Beverages',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    description: 'Coffee, tea, matcha, natural juices & sparkling drinks',
  },
  {
    id: 'cat_snacks',
    name: 'Snacks',
    filterKey: 'Snacks',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    icon: Cookie,
    badgeLabel: 'Snacks',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    description: 'Mixed roasted nuts, crisps, dried fruits & crackers',
  },
  {
    id: 'cat_condiments',
    name: 'Condiments',
    filterKey: 'Condiments',
    imageUrl: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80',
    icon: Soup,
    badgeLabel: 'Condiments',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    description: 'Olive oil, balsamic vinegar, hot sauces & dressings',
  },
  {
    id: 'cat_deli',
    name: 'Deli & Prepared',
    filterKey: 'Deli',
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    icon: Sandwich,
    badgeLabel: 'Deli & Prepared',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Charcuterie, cured meats, prepared salads & dips',
  },
  {
    id: 'cat_canned',
    name: 'Canned Goods',
    filterKey: 'Canned',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    icon: Package,
    badgeLabel: 'Canned Goods',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Canned tomatoes, soups, broths & preserved beans',
  },
  {
    id: 'cat_sweets',
    name: 'Sweets & Desserts',
    filterKey: 'Sweet',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    icon: IceCream,
    badgeLabel: 'Sweets & Desserts',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    description: 'Fine chocolates, gourmet pastries, honey & desserts',
  },
];

// Category mapping with theme colors, Lucide icons, and curated high-resolution food photos
export const FOOD_CATEGORY_VISUALS: Record<string, FoodTypeVisual> = {
  'Dairy & Eggs': {
    icon: Milk,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    defaultImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Dairy & Eggs',
  },
  Dairy: {
    icon: Milk,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    defaultImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Dairy',
  },
  Produce: {
    icon: Apple,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    defaultImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Produce',
  },
  'Fruits & Vegetables': {
    icon: Apple,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    defaultImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Produce',
  },
  'Meat & Seafood': {
    icon: Beef,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    defaultImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Meat & Seafood',
  },
  Meat: {
    icon: Beef,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    defaultImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Meat',
  },
  Bakery: {
    icon: Wheat,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    defaultImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Bakery',
  },
  'Pantry Staples': {
    icon: Package,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    defaultImage: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Pantry Staples',
  },
  Pantry: {
    icon: Package,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    defaultImage: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Pantry',
  },
  'Frozen Meals': {
    icon: Snowflake,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    defaultImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Frozen Meals',
  },
  'Frozen Foods': {
    icon: Snowflake,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    defaultImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Frozen Foods',
  },
  Beverages: {
    icon: Coffee,
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    defaultImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Beverages',
  },
  Drinks: {
    icon: Coffee,
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    defaultImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Beverages',
  },
  Snacks: {
    icon: Cookie,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    defaultImage: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Snacks',
  },
  Condiments: {
    icon: Soup,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    defaultImage: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Condiments',
  },
  'Condiments & Sauces': {
    icon: Soup,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    defaultImage: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Condiments',
  },
  'Deli & Prepared': {
    icon: Sandwich,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    defaultImage: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Deli & Prepared',
  },
  'Canned Goods': {
    icon: Package,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    defaultImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Canned Goods',
  },
  'Sweets & Desserts': {
    icon: IceCream,
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    defaultImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    badgeLabel: 'Sweets',
  },
};

// Subcategory and granular item name matching for specific foods
export function getFoodVisual(itemName: string = '', categoryName: string = ''): FoodTypeVisual {
  const lowerName = itemName.toLowerCase();
  const lowerCat = categoryName.toLowerCase();

  // 1. Check exact subcategory matches first (e.g. ribeye, salmon, chicken breast, shrimp, bacon)
  for (const sub of ALL_SUB_CATEGORIES) {
    if (
      lowerName.includes(sub.name.toLowerCase()) ||
      sub.keywords.some((kw) => lowerName.includes(kw.toLowerCase()) || lowerCat.includes(kw.toLowerCase()))
    ) {
      return {
        icon: sub.icon,
        bgColor: sub.bgColor,
        textColor: sub.textColor,
        borderColor: sub.borderColor,
        defaultImage: sub.imageUrl,
        badgeLabel: sub.badgeLabel,
      };
    }
  }

  // 2. Specific food visual overrides based on item name keywords
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

  // Fallback to category mapping if available (exact or case-insensitive)
  if (FOOD_CATEGORY_VISUALS[categoryName]) {
    return FOOD_CATEGORY_VISUALS[categoryName];
  }

  const normalizedCat = categoryName.trim().toLowerCase();
  for (const [key, visual] of Object.entries(FOOD_CATEGORY_VISUALS)) {
    if (key.toLowerCase() === normalizedCat || normalizedCat.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCat)) {
      return visual;
    }
  }

  // Generic fallback
  return {
    icon: Utensils,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    badgeLabel: categoryName || 'Kitchen Item',
  };
}

/**
 * Returns the curated web photo URL for any food category type or subcategory
 */
export function getCategoryImageUrl(categoryName: string = ''): string {
  if (!categoryName) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }
  const clean = categoryName.trim().toLowerCase();

  // Check subcategory first
  const matchedSub = ALL_SUB_CATEGORIES.find(
    (s) =>
      s.name.toLowerCase() === clean ||
      s.keywords.some((kw) => clean.includes(kw.toLowerCase()))
  );
  if (matchedSub) return matchedSub.imageUrl;

  const matched = ALL_FOOD_CATEGORIES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.filterKey.toLowerCase() === clean ||
      clean.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(clean)
  );
  if (matched) return matched.imageUrl;
  if (FOOD_CATEGORY_VISUALS[categoryName]?.defaultImage) {
    return FOOD_CATEGORY_VISUALS[categoryName].defaultImage;
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
}

/**
 * Subcategory helper specifically for Meat & Seafood cuts
 */
export const ALL_MEAT_SEAFOOD_SUBCATEGORIES = ALL_SUB_CATEGORIES.filter(
  (s) => s.parentCategoryId === 'cat_meat'
);


