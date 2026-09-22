import { MealType } from '../types';

export interface RecipeIngredient {
  name: string;
  nameFr?: string;
  amount: string;
  inKitchenItemName?: string; // name in kitchen inventory if matched
  category?: string;
  locationType?: 'FRIDGE' | 'FREEZER' | 'PANTRY';
}

export interface RicardoRecipe {
  id: string;
  title: string;
  titleFr: string;
  ricardoUrlEn: string;
  ricardoUrlFr: string;
  imageUrl: string;
  time: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  difficultyFr: 'Facile' | 'Moyen' | 'Avancé';
  calories: string;
  source: 'Ricardo Cuisine' | 'Trois Fois Par Jour' | 'Jamie Oliver' | 'Marmiton' | 'Gordon Ramsay' | 'Serious Eats' | 'Kitchen Rescue' | 'YouTube' | 'Personal' | 'Photo Import';
  authorName?: string;
  authorBadge?: string;
  isRicardoOfficial: boolean;
  isCustom?: boolean;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  createdAt?: string;
  descriptionEn: string;
  descriptionFr: string;
  ingredients: RecipeIngredient[];
  instructionsEn: string[];
  instructionsFr: string[];
  tags: string[];
  suggestedPantryNeeds: string[];
  mealTypes?: MealType[];
  safeCooking?: {
    internalTempC: number;
    internalTempF: number;
    targetMeat?: string;
    targetMeatFr?: string;
    restTimeMinutes?: number;
    safetyTipEn?: string;
    safetyTipFr?: string;
    standardAgency?: string;
  };
}

export function inferRecipeMealTypes(recipe: {
  title?: string;
  titleFr?: string;
  tags?: string[];
  descriptionEn?: string;
  descriptionFr?: string;
  mealTypes?: MealType[];
}): MealType[] {
  if (recipe.mealTypes && recipe.mealTypes.length > 0) {
    return recipe.mealTypes;
  }
  const text = [
    recipe.title || '',
    recipe.titleFr || '',
    (recipe.tags || []).join(' '),
    recipe.descriptionEn || '',
    recipe.descriptionFr || '',
  ].join(' ').toLowerCase();

  const types: MealType[] = [];

  if (
    /breakfast|déjeuner|dejeuner|brunch|pancake|waffle|gaufre|oat|avoine|porridge|parfait|french toast|pain doré|pain dore|egg|oeuf|œuf|scramble|brouillade|omelet|omelette|smoothie|granola|muffin|crepe|crêpe|shakshuka|tartine|toast|bacon/.test(
      text
    )
  ) {
    types.push('BREAKFAST');
  }

  if (
    /lunch|dîner|diner|sandwich|wrap|salad|salade|soup|potage|quiche|tartine|toast|bowl|croque|panini|taco|burger|flatbread/.test(
      text
    )
  ) {
    types.push('LUNCH');
  }

  if (
    /dinner|souper|stew|ragout|ragoût|roast|rôti|curry|casserole|pasta|pâtes|pates|spaghetti|bolognese|lasagna|lasagne|salmon|saumon|beef|bœuf|boeuf|chicken|poulet|pork|porc|steak|sheet-pan|plaque|skillet|poêlée|poelee|grill|bake/.test(
      text
    )
  ) {
    types.push('DINNER');
  }

  if (
    /snack|collation|parfait|bites|bouchée|bouchee|dip|trempette|chips|crisps|hummus|smoothie|bar|barre|cookie|biscuit|popcorn|nuts|noix|fruit|granola|muffin/.test(
      text
    )
  ) {
    types.push('SNACK');
  }

  if (types.length === 0) {
    types.push('DINNER', 'LUNCH');
  }

  return types;
}

export const RICARDO_RECIPES: RicardoRecipe[] = [
  {
    id: 'ricardo_sheet_pan_salmon',
    title: 'Sheet-Pan Salmon with Herb Butter & Veggies',
    titleFr: 'Saumon et légumes sur plaque au beurre d\'herbes',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/8276-sheet-pan-salmon-and-vegetables',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/8276-saumon-et-legumes-sur-une-plaque',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    time: '25 mins',
    prepTime: '10 mins',
    cookTime: '15 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '440 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'Ricardo\'s signature weeknight sheet-pan technique: succulent salmon filets with garlic, tender asparagus, and a golden citrus herb glaze.',
    descriptionFr: 'La technique classique de Ricardo sur plaque : saumon fondant, asperges tendres et un filet de beurre noisette citronné.',
    tags: ['Ricardo Cuisine', 'Sheet-Pan', 'Zero-Waste', 'High-Protein'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Wild Salmon Fillets', nameFr: 'Filets de saumon sauvage', amount: '4 fillets (approx. 600g)', inKitchenItemName: 'Wild Salmon Fillets', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'Fresh Asparagus or Green Veggies', nameFr: 'Asperges fraîches ou légumes verts', amount: '1 bunch', inKitchenItemName: 'Organic Strawberries', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Unsalted Butter', nameFr: 'Beurre non salé', amount: '2 tbsp', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Fresh Lemon & Garlic', nameFr: 'Citron frais et ail', amount: '1 lemon, 2 cloves', category: 'Produce', locationType: 'PANTRY' },
      { name: 'Olive Oil', nameFr: 'Huile d\'olive', amount: '1 tbsp', inKitchenItemName: 'Extra Virgin Olive Oil', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Preheat oven to 400°F (200°C) with rack in the middle. Line a large sheet pan with parchment paper.',
      'Defrost the salmon filets if using freezer reserves and pat dry with paper towels.',
      'Toss vegetables with olive oil, salt, and pepper on the sheet pan. Place salmon fillets skin-side down alongside.',
      'Melt butter with minced garlic, lemon juice, and chopped herbs, then spoon generously over each salmon fillet.',
      'Bake for 12 to 15 minutes until salmon flakes gently with a fork and vegetables are tender-crisp.',
    ],
    instructionsFr: [
      'Préchauffer le four à 200°C (400°F) avec la grille au centre. Tapisser une plaque de cuisson de papier parchemin.',
      'Décongeler les filets de saumon s\'ils proviennent du congélateur et bien éponger.',
      'Mélanger les légumes avec l\'huile d\'olive, sel et poivre sur la plaque. Déposer les filets de saumon à côté.',
      'Faire fondre le beurre avec l\'ail haché et le jus de citron, puis badigeonner généreusement chaque pavé.',
      'Cuire au four 12 à 15 minutes jusqu\'à ce que la chair s\'effiloche facilement à la fourchette.',
    ],
    suggestedPantryNeeds: ['Fresh Asparagus', 'Lemon & Garlic'],
  },
  {
    id: 'ricardo_bolognese_sauce',
    title: 'Ricardo\'s Best Weeknight Bolognese Sauce',
    titleFr: 'La meilleure sauce à spaghetti de Ricardo',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/4436-the-best-spaghetti-sauce',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/4436-la-meilleure-sauce-a-spaghetti',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d628106a?auto=format&fit=crop&w=600&q=80',
    time: '45 mins',
    prepTime: '15 mins',
    cookTime: '30 mins',
    servings: '6 servings',
    difficulty: 'Medium',
    difficultyFr: 'Moyen',
    calories: '510 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'Ricardo\'s most celebrated spaghetti meat sauce: deeply flavorful beef, Italian herbs, and sweet San Marzano crushed tomatoes simmered to perfection.',
    descriptionFr: 'La célèbre recette québécoise de Ricardo : une sauce riche en viande réconfortante, mijotée aux herbes italiennes et tomates San Marzano.',
    tags: ['Ricardo Cuisine', 'Quebec Classic', 'Batch-Cook', 'Family Favorite'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Grass-Fed Ground Beef 85/15', nameFr: 'Bœuf haché maigre', amount: '1 lb (450g)', inKitchenItemName: 'Grass-Fed Ground Beef 85/15', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'San Marzano Canned Tomatoes', nameFr: 'Tomates broyées San Marzano', amount: '1 can (796 ml)', inKitchenItemName: 'San Marzano Canned Tomatoes', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Yellow Onion & Garlic', nameFr: 'Oignon jaune et ail', amount: '1 diced onion, 3 cloves', category: 'Produce', locationType: 'PANTRY' },
      { name: 'Tomato Paste & Italian Herbs', nameFr: 'Pâte de tomate et origan', amount: '2 tbsp paste, 1 tsp oregano', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Rigatoni or Spaghetti Pasta', nameFr: 'Pâtes spaghetti ou rigatoni', amount: '400g', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'In a large heavy-bottom pot over medium-high heat, brown the ground beef in a dash of olive oil, breaking up lumps.',
      'Add chopped onion, celery, and garlic; cook for 4-5 minutes until translucent and fragrant.',
      'Stir in tomato paste, oregano, and salt. Pour in crushed San Marzano tomatoes and a pinch of chili flakes.',
      'Reduce heat to low, cover partially, and let gently simmer for 30 minutes, stirring occasionally.',
      'Toss with freshly cooked pasta and top with freshly grated parmesan.',
    ],
    instructionsFr: [
      'Dans une grande casserole à feu moyen-vif, faire dorer le bœuf haché dans un filet d\'huile en l\'émiettant.',
      'Ajouter l\'oignon haché et l\'ail; cuire 4 à 5 minutes jusqu\'à ce que les oignons soient tendres.',
      'Incorporer la pâte de tomates, l\'origan et le sel. Verser les tomates San Marzano broyées.',
      'Baisser à feu doux et laisser mijoter à demi-couvert pendant 30 minutes en remuant de temps à autre.',
      'Servir généreusement sur des pâtes fraîches avec du parmesan râpé.',
    ],
    suggestedPantryNeeds: ['Yellow Onion', 'Tomato Paste', 'Spaghetti Pasta'],
  },
  {
    id: 'ricardo_strawberry_parfait',
    title: 'Strawberry & Greek Yogurt Parfait with Honey Oat Crunch',
    titleFr: 'Parfait aux fraises, yogourt grec et crumble d\'avoine',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/5863-strawberry-and-yogurt-parfaits',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/5863-parfaits-aux-fraises-et-au-yogourt',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    time: '10 mins',
    prepTime: '10 mins',
    cookTime: '0 mins',
    servings: '2 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '280 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'The ideal zero-waste breakfast from Ricardo: macerated ripe strawberries layered with rich chilled Greek yogurt, oat milk swirl, and toasted oats.',
    descriptionFr: 'Le déjeuner anti-gaspillage parfait de Ricardo : fraises mûres macérées au sirop d\'érable, yogourt grec soyeux et avoine croquante.',
    tags: ['Ricardo Cuisine', 'Zero-Waste', 'Expiring-Soon Rescue', 'Breakfast'],
    mealTypes: ['BREAKFAST', 'SNACK'],
    ingredients: [
      { name: 'Organic Strawberries', nameFr: 'Fraises fraîches bien mûres', amount: '1.5 cups hulled and sliced', inKitchenItemName: 'Organic Strawberries', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Greek Yogurt (0% Fat)', nameFr: 'Yogourt grec nature', amount: '1 cup', inKitchenItemName: 'Greek Yogurt (0% Fat)', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Oat Milk (Barista Blend)', nameFr: 'Lait d\'avoine', amount: '2 tbsp for smooth texture', inKitchenItemName: 'Oat Milk (Barista Blend)', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Pure Maple Syrup or Honey', nameFr: 'Vrai sirop d\'érable pur', amount: '1.5 tbsp', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Toasted Rolled Oats or Granola', nameFr: 'Flocons d\'avoine grillés ou granola', amount: '1/3 cup', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'In a small mixing bowl, toss sliced ripe strawberries with 1 tbsp maple syrup and allow to sit for 3 minutes to release juices.',
      'Whisk Greek yogurt with oat milk and a drop of vanilla until creamy and smooth.',
      'In two clear tumblers, layer half the macerated strawberries, followed by Greek yogurt, and top with toasted oats.',
      'Drizzle remaining fruit juices on top and enjoy immediately for breakfast or light dessert.',
    ],
    instructionsFr: [
      'Dans un bol, mélanger les fraises tranchées avec le sirop d\'érable et laisser macérer 3 minutes pour former un jus parfumé.',
      'Fouetter le yogourt grec avec une touche de lait d\'avoine pour une texture ultra crémeuse.',
      'Dans deux jolis verres, alterner les couches de fraises, de yogourt et d\'avoine croquante.',
      'Arroser du coulis naturel de fraises et déguster frais.',
    ],
    suggestedPantryNeeds: ['Pure Maple Syrup', 'Rolled Oats'],
  },
  {
    id: 'ricardo_maple_glazed_salmon',
    title: 'Ricardo\'s Classic Quebec Maple Glazed Salmon',
    titleFr: 'Saumon glacé à l\'érable traditionnel de Ricardo',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/4207-maple-glazed-salmon',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/4207-saumon-glace-a-l-erable',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    time: '20 mins',
    prepTime: '5 mins',
    cookTime: '15 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '410 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'A quintessential Ricardo Quebec recipe: 3-ingredient maple and Dijon glaze caramelizes over tender wild salmon fillets under the broiler.',
    descriptionFr: 'Une recette culte de Ricardo : seulement 3 ingrédients pour une laque érable et moutarde de Dijon dorée et caramélisée.',
    tags: ['Ricardo Cuisine', 'Quebec Terroir', '20-Min Meal', 'Quick Dinner'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Wild Salmon Fillets', nameFr: 'Pavés de saumon sauvage', amount: '4 portions', inKitchenItemName: 'Wild Salmon Fillets', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'Pure Maple Syrup', nameFr: 'Sirop d\'érable pur', amount: '3 tbsp', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Dijon Mustard', nameFr: 'Moutarde de Dijon', amount: '1.5 tbsp', category: 'Pantry', locationType: 'FRIDGE' },
      { name: 'Soy Sauce or Tamari', nameFr: 'Sauce soya ou tamari', amount: '1 tbsp', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'In a small cup, stir together pure maple syrup, Dijon mustard, and soy sauce.',
      'Place salmon fillets on a baking sheet lined with foil or parchment.',
      'Brush half the glaze over salmon. Broil 6 inches from heat for 6 minutes.',
      'Brush with remaining maple glaze and return under the broiler for 4-5 minutes until caramelized and tender.',
    ],
    instructionsFr: [
      'Dans un bol, mélanger le sirop d\'érable, la moutarde de Dijon et la sauce soya.',
      'Déposer les pavés de saumon sur une plaque recouverte de papier parchemin.',
      'Badigeonner de la moitié de la marinade. Cuire sous le gril (broil) pendant 6 minutes.',
      'Badigeonner du reste de la laque à l\'érable et poursuivre la cuisson 4 à 5 minutes.',
    ],
    suggestedPantryNeeds: ['Dijon Mustard', 'Soy Sauce'],
  },
  {
    id: 'ricardo_avocado_egg_tartine',
    title: 'Ricardo\'s Avocado Tartine with Jammy Soft Egg',
    titleFr: 'Tartines crémeuses à l\'avocat et œuf mollet',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/7724-avocado-toast-with-soft-boiled-egg',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/7724-tartines-a-l-avocat-et-a-l-oeuf-mollet',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    time: '12 mins',
    prepTime: '6 mins',
    cookTime: '6 mins',
    servings: '2 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '340 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'Toasted bakery sourdough loaded with mashed Haas avocados, fresh lime juice, flaky sea salt, and a 6-minute jammy egg.',
    descriptionFr: 'Pain au levain croustillant, purée d\'avocat au citron vert, fleur de sel et œuf fermier mollet au jaune coulant.',
    tags: ['Ricardo Cuisine', 'Express Lunch', 'High-Protein', 'Brunch'],
    mealTypes: ['BREAKFAST', 'LUNCH', 'SNACK'],
    ingredients: [
      { name: 'Sourdough Bread', nameFr: 'Tranches de pain au levain', amount: '2 thick slices', inKitchenItemName: 'Sourdough Bread', category: 'Bakery', locationType: 'PANTRY' },
      { name: 'Hass Avocados', nameFr: 'Avocats Hass bien mûrs', amount: '2 avocados', inKitchenItemName: 'Hass Avocados', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Free-Range Eggs', nameFr: 'Œufs frais de ferme', amount: '2 large eggs', inKitchenItemName: 'Free-Range Eggs', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Fresh Lime & Red Pepper Flakes', nameFr: 'Lime et flocons de piment', amount: '1/2 lime, pinch of chili', inKitchenItemName: 'Organic Limes', category: 'Produce', locationType: 'FRIDGE' },
    ],
    instructionsEn: [
      'Gently lower eggs into simmering water and cook for exactly 6 minutes. Plunge immediately into ice water and peel.',
      'Toast sourdough bread slices until deeply golden and crispy.',
      'Mash avocados in a bowl with lime juice, a drizzle of olive oil, and sea salt.',
      'Spread avocado over toasts, slice soft eggs in half to reveal runny yolks, and top with chili flakes.',
    ],
    instructionsFr: [
      'Plonger délicatement les œufs dans l\'eau bouillante et cuire 6 minutes. Refroidir dans l\'eau glacée puis écaler.',
      'Faire griller les tranches de pain au levain jusqu\'à ce qu\'elles soient bien dorées.',
      'Écraser les avocats à la fourchette avec le jus de lime, huile d\'olive et sel.',
      'Tartiner le pain, déposer les œufs mollets coupés en deux et parsemer de piment.',
    ],
    suggestedPantryNeeds: ['Chili Flakes', 'Flaky Sea Salt'],
  },
  {
    id: 'ricardo_golden_french_toast',
    title: 'Sourdough French Toast with Warm Berry Compote',
    titleFr: 'Pain doré au levain et compote tiède de petits fruits',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/498-french-toast',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/498-pain-dore',
    imageUrl: 'https://images.unsplash.com/photo-1484723091739-00a8a6be96cb?auto=format&fit=crop&w=600&q=80',
    time: '15 mins',
    prepTime: '5 mins',
    cookTime: '10 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '390 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'The ultimate weekend brunch comfort: day-old sourdough soaked in rich custard of eggs, milk, cinnamon, and pan-fried in foaming butter.',
    descriptionFr: 'Le classique des déjeuners du week-end québécois : pain de la veille imbibé d\'œufs, de lait entier et doré au beurre.',
    tags: ['Ricardo Cuisine', 'Zero-Waste Bakery', 'Brunch', 'Comfort Food'],
    mealTypes: ['BREAKFAST', 'SNACK'],
    ingredients: [
      { name: 'Sourdough Bread', nameFr: 'Pain au levain rassis', amount: '4 thick slices', inKitchenItemName: 'Sourdough Bread', category: 'Bakery', locationType: 'PANTRY' },
      { name: 'Free-Range Eggs', nameFr: 'Œufs frais', amount: '3 eggs', inKitchenItemName: 'Free-Range Eggs', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Organic Whole Milk', nameFr: 'Lait entier biologique', amount: '3/4 cup', inKitchenItemName: 'Organic Whole Milk', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Organic Strawberries', nameFr: 'Fraises fraîches pour garnir', amount: '1 cup', inKitchenItemName: 'Organic Strawberries', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Cinnamon & Butter', nameFr: 'Cannelle et beurre', amount: '1/2 tsp cinnamon, 2 tbsp butter', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
    ],
    instructionsEn: [
      'Whisk eggs, whole milk, cinnamon, and a pinch of salt in a wide shallow baking dish.',
      'Soak sourdough slices for 1 minute on each side until saturated.',
      'Melt butter in a large skillet over medium heat. Fry bread for 3-4 minutes per side until golden brown.',
      'Serve warm topped with freshly sliced strawberries and genuine Quebec maple syrup.',
    ],
    instructionsFr: [
      'Dans un plat peu profond, fouetter les œufs, le lait entier, la cannelle et une pincée de sel.',
      'Faire tremper les tranches de pain au levain 1 minute de chaque côté.',
      'Faire fondre le beurre dans une poêle à feu moyen et dorer les tranches 3 à 4 minutes de chaque côté.',
      'Garnir de fraises fraîches tranchées et arroser de sirop d\'érable.',
    ],
    suggestedPantryNeeds: ['Ground Cinnamon'],
  },
  {
    id: 'ricardo_skillet_taco_beef',
    title: 'Ricardo\'s Express 20-Min Beef Taco Skillet',
    titleFr: 'Poêlée mexicaine express de bœuf à la Ricardo',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/6890-ground-beef-taco-bowls',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/6890-bols-de-tacos-au-boeuf-hache',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80',
    time: '20 mins',
    prepTime: '5 mins',
    cookTime: '15 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '480 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'Quick skillet meal with spiced ground beef, sweet tomatoes, diced avocado, melted cheese, and fragrant fresh cilantro.',
    descriptionFr: 'Repas tout-en-un express à la poêle : bœuf épicé, tomates mijotées, avocat frais et fromage fondu.',
    tags: ['Ricardo Cuisine', '20-Min Meal', 'Weeknight Fast', 'Freezer-to-Plate'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Grass-Fed Ground Beef 85/15', nameFr: 'Bœuf haché 85/15 décongelé', amount: '1 lb (450g)', inKitchenItemName: 'Grass-Fed Ground Beef 85/15', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'San Marzano Canned Tomatoes', nameFr: 'Tomates en dés', amount: '1 cup', inKitchenItemName: 'San Marzano Canned Tomatoes', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Hass Avocados', nameFr: 'Avocats en dés', amount: '1 avocado', inKitchenItemName: 'Hass Avocados', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Cumin, Chili & Smoked Paprika', nameFr: 'Épices à tacos (cumin, chili, paprika)', amount: '1.5 tbsp spice blend', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Brown ground beef in a cast iron skillet over medium-high heat, breaking up meat until no longer pink.',
      'Add spice blend and crushed tomatoes with 2 tbsp water; simmer for 8 minutes until thickened.',
      'Top with diced fresh avocado, fresh herbs, and serve over rice or warm tortillas.',
    ],
    instructionsFr: [
      'Dorer le bœuf haché dans une poêle à feu moyen-vif en l\'émiettant.',
      'Ajouter le mélange d\'épices et les tomates; laisser mijoter 8 minutes jusqu\'à consistance onctueuse.',
      'Garnir de dés d\'avocat frais et servir avec des tortillas chaudes ou du riz.',
    ],
    suggestedPantryNeeds: ['Taco Spices', 'Tortilla Chips'],
  },
  {
    id: 'ricardo_veggie_egg_scramble',
    title: 'Zero-Waste Garden Veggie & Cheese Breakfast Scramble',
    titleFr: 'Brouillade d\'œufs aux légumes du frigo et cheddar',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/scrambled-eggs-with-vegetables',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/oeufs-brouilles-aux-legumes',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    time: '12 mins',
    prepTime: '5 mins',
    cookTime: '7 mins',
    servings: '2 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '310 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'The perfect breakfast for using up leftover veggies, herbs, and cheese into creamy, gently folded eggs.',
    descriptionFr: 'Le déjeuner parfait pour sauver les légumes entamés, herbes fraîches et fromage dans des œufs brouillés crémeux.',
    tags: ['Ricardo Cuisine', 'Zero-Waste', 'Breakfast', 'High-Protein', 'Quick'],
    mealTypes: ['BREAKFAST', 'LUNCH'],
    ingredients: [
      { name: 'Free-Range Eggs', nameFr: 'Œufs frais', amount: '4 large eggs', inKitchenItemName: 'Free-Range Eggs', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Fresh Asparagus or Green Veggies', nameFr: 'Légumes verts coupés', amount: '1 cup diced', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Unsalted Butter', nameFr: 'Beurre', amount: '1 tbsp', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Organic Whole Milk', nameFr: 'Lait', amount: '2 tbsp', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
    ],
    instructionsEn: [
      'Whisk eggs with milk, a pinch of salt, and black pepper.',
      'Sauté diced vegetables in melted butter for 3 minutes until tender-crisp.',
      'Pour in eggs and stir gently with a spatula over low heat until softly scrambled and creamy.',
      'Serve with toasted bread and fresh herbs.',
    ],
    instructionsFr: [
      'Fouetter les œufs avec le lait, une pincée de sel et du poivre.',
      'Faire sauter les légumes émincés dans le beurre 3 minutes.',
      'Verser les œufs et cuire à feu doux en ramenant doucement les bords au centre.',
      'Servir immédiatement sur du pain grillé.',
    ],
    suggestedPantryNeeds: ['Black Pepper', 'Fresh Bread'],
  },
  {
    id: 'ricardo_chickpea_lemon_dip',
    title: 'Crispy Herbed Pita Chips with Garlic Chickpea Dip',
    titleFr: 'Pitas croustillantes aux herbes et tartinade de pois chiches à l\'ail',
    ricardoUrlEn: 'https://www.ricardocuisine.com/en/recipes/hummus-and-pita-chips',
    ricardoUrlFr: 'https://www.ricardocuisine.com/fr/recettes/houmous-et-chips-de-pita',
    imageUrl: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80',
    time: '15 mins',
    prepTime: '10 mins',
    cookTime: '5 mins',
    servings: '3 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '240 kcal',
    source: 'Ricardo Cuisine',
    isRicardoOfficial: true,
    descriptionEn: 'Quick energizing snack: crisp golden pita triangles paired with a zesty garlic and lemon pantry dip.',
    descriptionFr: 'Collation rapide et saine : triangles de pita croustillants dorés au four et tartinade relevée au citron.',
    tags: ['Ricardo Cuisine', 'Zero-Waste', 'Snack', 'Plant-Based', 'Quick'],
    mealTypes: ['SNACK', 'LUNCH'],
    ingredients: [
      { name: 'Sourdough Bread or Pita', nameFr: 'Pain pita ou restes de pain', amount: '2 pieces', category: 'Bakery', locationType: 'PANTRY' },
      { name: 'Extra Virgin Olive Oil', nameFr: 'Huile d\'olive', amount: '2 tbsp', inKitchenItemName: 'Extra Virgin Olive Oil', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Fresh Lemon & Garlic', nameFr: 'Jus de citron et ail', amount: '1 lemon, 1 clove', category: 'Produce', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Cut pita or leftover bread into triangles, toss with olive oil, salt, and oregano.',
      'Bake at 375°F (190°C) for 6-8 minutes until crisp and lightly browned.',
      'Serve warm alongside the garlic dip.',
    ],
    instructionsFr: [
      'Couper les pitas en triangles, badigeonner d\'huile d\'olive et d\'origan.',
      'Cuire au four à 190°C (375°F) pendant 6 à 8 minutes jusqu\'à croustillant.',
      'Servir avec la trempette au citron.',
    ],
    suggestedPantryNeeds: ['Dried Oregano', 'Flaky Sea Salt'],
  },
  {
    id: 'marilou_avocado_salmon_bowl',
    title: 'Marilou\'s Sesame Salmon & Avocado Zen Bowl',
    titleFr: 'Bol zen saumon sésame et avocat par Marilou',
    ricardoUrlEn: 'https://www.troisfoisparjour.com/en/recipes',
    ricardoUrlFr: 'https://www.troisfoisparjour.com/fr/recettes',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    time: '20 mins',
    prepTime: '10 mins',
    cookTime: '10 mins',
    servings: '2 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '420 kcal',
    source: 'Trois Fois Par Jour',
    authorName: 'Marilou',
    authorBadge: 'Trois Fois Par Jour',
    isRicardoOfficial: false,
    descriptionEn: 'Gentle, comforting and wholesome bowl by Marilou: pan-seared wild salmon with honey-ginger glaze, creamy diced avocado, and fragrant sesame.',
    descriptionFr: 'Une recette douce, réconfortante et épurée signée Marilou : pavé de saumon poêlé au gingembre et miel, avocat fondant et sésame grillé.',
    tags: ['Trois Fois Par Jour', 'Marilou', 'Healthy', 'Quick Dinner', 'Anti-Gaspi'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Wild Salmon Fillets', nameFr: 'Filets de saumon frais ou décongelés', amount: '2 pavés (300g)', inKitchenItemName: 'Wild Salmon Fillets', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'Hass Avocados', nameFr: 'Avocat mûr en tranches', amount: '1 avocat', inKitchenItemName: 'Hass Avocados', category: 'Produce', locationType: 'FRIDGE' },
      { name: 'Pure Maple Syrup or Honey', nameFr: 'Sirop d\'érable ou miel pur', amount: '1.5 c. à soupe', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Extra Virgin Olive Oil', nameFr: 'Huile d\'olive et sésame', amount: '1 c. à soupe', inKitchenItemName: 'Extra Virgin Olive Oil', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Fresh Lemon & Garlic', nameFr: 'Jus de lime frais et gingembre', amount: '1 lime', category: 'Produce', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'In a small bowl, whisk honey or maple syrup with lime juice, soy sauce, and grated fresh ginger.',
      'Sear salmon skin-side down in a hot skillet with olive oil for 4 minutes, flip and cook 3 minutes while brushing with glaze.',
      'Slice avocado and arrange over a bowl with leafy greens or warm grains.',
      'Top with salmon, remaining pan glaze, and toasted sesame seeds.',
    ],
    instructionsFr: [
      'Dans un bol, mélanger le sirop d\'érable, le jus de lime et un filet d\'huile.',
      'Saisir les pavés de saumon côté peau 4 minutes dans une poêle chaude, retourner et napper de sauce.',
      'Trancher l\'avocat et disposer harmonieusement dans deux jolis bols.',
      'Déposer le saumon chaud, arroser des sucs de cuisson et parsemer de graines de sésame.',
    ],
    suggestedPantryNeeds: ['Sesame Seeds', 'Soy Sauce'],
  },
  {
    id: 'jamie_oliver_15min_pasta',
    title: 'Jamie Oliver\'s 15-Minute Rustic Garlic & Tomato Pasta',
    titleFr: 'Pâtes rustiques express à la tomate et à l\'ail de Jamie Oliver',
    ricardoUrlEn: 'https://www.jamieoliver.com/recipes/pasta-recipes',
    ricardoUrlFr: 'https://www.jamieoliver.com/recipes/pasta-recipes',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d628106a?auto=format&fit=crop&w=600&q=80',
    time: '15 mins',
    prepTime: '5 mins',
    cookTime: '10 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '450 kcal',
    source: 'Jamie Oliver',
    authorName: 'Jamie Oliver',
    authorBadge: 'Jamie Oliver',
    isRicardoOfficial: false,
    descriptionEn: 'Jamie\'s unbeatable fast-food pantry pasta: sweet canned plum tomatoes, sizzled garlic slices, chili warmth, and luscious olive oil emulsion.',
    descriptionFr: 'Le grand classique express de Jamie Oliver : ail croustillant, tomates concassées parfumées, piment doux et une émulsion parfaite à l\'huile d\'olive.',
    tags: ['Jamie Oliver', '15-Minute Meals', 'Pantry Staple', 'Italian Classic'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'San Marzano Canned Tomatoes', nameFr: 'Tomates pelées en conserve de qualité', amount: '1 can (400g)', inKitchenItemName: 'San Marzano Canned Tomatoes', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Fresh Lemon & Garlic', nameFr: 'Gousses d\'ail fraîches émincées', amount: '4 cloves garlic', category: 'Produce', locationType: 'PANTRY' },
      { name: 'Extra Virgin Olive Oil', nameFr: 'Bonne huile d\'olive extra vierge', amount: '3 tbsp', inKitchenItemName: 'Extra Virgin Olive Oil', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Sourdough Bread or Pasta', nameFr: 'Pâtes spaghetti ou penne', amount: '350g', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Bring a large pot of heavily salted water to a rolling boil and cook pasta al dente.',
      'In a wide frying pan, gently sizzle thinly sliced garlic in olive oil until golden and fragrant (do not burn).',
      'Crush in the tomatoes by hand, season generously with salt and pepper, and simmer briskly for 8 minutes.',
      'Drag cooked pasta directly into the sauce with a splash of starchy cooking water; toss vigorously with parmesan until glossy.',
    ],
    instructionsFr: [
      'Faire cuire les pâtes dans une grande casserole d\'eau bouillante bien salée.',
      'Dans une poêle, faire dorer doucement les lamelles d\'ail dans l\'huile d\'olive sans les brûler.',
      'Écraser les tomates à la main dans la poêle, saler, poivrer et laisser mijoter 8 minutes.',
      'Égoutter les pâtes en gardant un peu d\'eau de cuisson; mélanger vivement dans la poêle pour lier la sauce.',
    ],
    suggestedPantryNeeds: ['Dried Chili Flakes', 'Parmesan Cheese'],
  },
  {
    id: 'ramsay_perfect_scrambled_eggs',
    title: 'Gordon Ramsay\'s Ultimate Custard Scrambled Eggs',
    titleFr: 'Les célèbres œufs brouillés fondants de Gordon Ramsay',
    ricardoUrlEn: 'https://www.gordonramsay.com/gr/recipes',
    ricardoUrlFr: 'https://www.gordonramsay.com/gr/recipes',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    time: '8 mins',
    prepTime: '2 mins',
    cookTime: '6 mins',
    servings: '2 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '290 kcal',
    source: 'Gordon Ramsay',
    authorName: 'Gordon Ramsay',
    authorBadge: 'Gordon Ramsay',
    isRicardoOfficial: false,
    descriptionEn: 'Ramsay\'s masterclass technique: on and off the heat with cold butter cubes for the silkiest, most velvety scrambled eggs in the world.',
    descriptionFr: 'La méthode mythique de Gordon Ramsay : alterner chaud et froid avec des cubes de beurre pour une texture crémeuse comme un nuage.',
    tags: ['Gordon Ramsay', 'Masterclass', 'Breakfast', 'High-Protein', 'Under 10 Mins'],
    mealTypes: ['BREAKFAST', 'LUNCH', 'SNACK'],
    ingredients: [
      { name: 'Free-Range Eggs', nameFr: 'Œufs frais bio', amount: '4 gros œufs', inKitchenItemName: 'Free-Range Eggs', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Unsalted Butter', nameFr: 'Beurre froid coupé en dés', amount: '2 c. à soupe', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Greek Yogurt (0% Fat) or Crème Fraîche', nameFr: 'Crème fraîche ou yogourt crémeux', amount: '1 c. à soupe', inKitchenItemName: 'Greek Yogurt (0% Fat)', category: 'Dairy & Eggs', locationType: 'FRIDGE' },
      { name: 'Sourdough Bread', nameFr: 'Pain au levain toasté', amount: '2 tranches', inKitchenItemName: 'Sourdough Bread', category: 'Bakery', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Crack eggs directly into a cold saucepan with butter cubes. Do not whisk yet.',
      'Place on medium heat and stir constantly with a rubber spatula, scraping the bottom and sides.',
      'Take pan off heat after 30 seconds while continuing to stir, then return to heat. Repeat 3-4 times.',
      'Just before eggs set completely, take off heat, stir in a spoonful of crème fraîche/yogurt and chives to stop cooking, then season with salt.',
    ],
    instructionsFr: [
      'Casser les œufs directement dans une casserole froide avec les morceaux de beurre. Ne pas fouetter d\'avance.',
      'Mettre à feu moyen et remuer continuellement à la spatule en raclant le fond.',
      'Retirer la casserole du feu 30 secondes en continuant de remuer, puis remettre sur le feu. Répéter 3 à 4 fois.',
      'Hors du feu, incorporer une cuillère de crème ou yogourt pour stopper la cuisson, saler, poivrer et servir sur du pain grillé.',
    ],
    suggestedPantryNeeds: ['Fresh Chives', 'Black Pepper'],
  },
  {
    id: 'marmiton_grandma_beef_stew',
    title: 'Marmiton Traditional French Minced Beef & Veggie Skillet',
    titleFr: 'Poêlée campagnarde de bœuf et légumes façon Marmiton',
    ricardoUrlEn: 'https://www.marmiton.org',
    ricardoUrlFr: 'https://www.marmiton.org/recettes/recherche.aspx',
    imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80',
    time: '25 mins',
    prepTime: '10 mins',
    cookTime: '15 mins',
    servings: '4 servings',
    difficulty: 'Easy',
    difficultyFr: 'Facile',
    calories: '430 kcal',
    source: 'Marmiton',
    authorName: 'Marmiton',
    authorBadge: 'Marmiton',
    isRicardoOfficial: false,
    descriptionEn: 'The beloved French community recipe: fragrant browned beef with sautéed onions, garlic, thyme, and melting seasonal veggies.',
    descriptionFr: 'La recette chaleureuse préférée de la communauté Marmiton : bœuf doré aux oignons, herbes de Provence, tomates douces et légumes du marché.',
    tags: ['Marmiton', 'French Country', 'Comfort Food', 'Family Friendly'],
    mealTypes: ['DINNER', 'LUNCH'],
    ingredients: [
      { name: 'Grass-Fed Ground Beef 85/15', nameFr: 'Bœuf haché frais ou décongelé', amount: '450g', inKitchenItemName: 'Grass-Fed Ground Beef 85/15', category: 'Meat & Seafood', locationType: 'FREEZER' },
      { name: 'Yellow Onion & Garlic', nameFr: 'Oignon et gousses d\'ail', amount: '1 oignon émincé, 2 gousses', category: 'Produce', locationType: 'PANTRY' },
      { name: 'San Marzano Canned Tomatoes', nameFr: 'Tomates concassées', amount: '1 tasse', inKitchenItemName: 'San Marzano Canned Tomatoes', category: 'Pantry', locationType: 'PANTRY' },
      { name: 'Extra Virgin Olive Oil', nameFr: 'Huile d\'olive', amount: '1 c. à soupe', inKitchenItemName: 'Extra Virgin Olive Oil', category: 'Pantry', locationType: 'PANTRY' },
    ],
    instructionsEn: [
      'Heat olive oil in a wide sauté pan and sweat diced onions with garlic until tender.',
      'Add ground beef, breaking it up with a wooden spoon until nicely browned.',
      'Add tomatoes, thyme, salt, and black pepper. Cover and simmer gently for 12 minutes.',
      'Serve steaming with fresh bread, mashed potatoes, or rice.',
    ],
    instructionsFr: [
      'Faire suer les oignons et l\'ail dans l\'huile d\'olive chaude.',
      'Ajouter le bœuf haché et faire dorer en remuant à la cuillère en bois.',
      'Verser les tomates concassées, ajouter le thym, sel et poivre. Couvrir et laisser mijoter 12 minutes.',
      'Servir bien chaud avec du bon pain croustillant ou du riz.',
    ],
    suggestedPantryNeeds: ['Herbes de Provence', 'Black Pepper'],
  }
];
