/**
 * Pantryo - Bilingual Food & Grocery Translator Service
 * Handles bidirectional translation between French and English for:
 * - Recipe ingredients & titles
 * - Supermarket flyer deals (Maxi, Super C, No Frills, Metro, IGA, Walmart Canada)
 * - Receipt item lines & OCR extracts
 * - Barcode / Open Food Facts product names
 * - Prepared dishes & leftovers
 */

// Common exact word / phrase mappings: English -> French
export const EN_TO_FR_DICTIONARY = {
  // --- Dairy & Eggs / Produits laitiers & œufs ---
  "greek yogurt": "yogourt grec",
  "plain greek yogurt": "yogourt grec nature",
  "vanilla greek yogurt": "yogourt grec à la vanille",
  "strawberry greek yogurt": "yogourt grec aux fraises",
  "stirred yogurt": "yogourt brassé",
  "plain yogurt": "yogourt nature",
  "vanilla yogurt": "yogourt à la vanille",
  "strawberry yogurt": "yogourt aux fraises",
  "blueberry yogurt": "yogourt aux bleuets",
  "raspberry yogurt": "yogourt aux framboises",
  "peach yogurt": "yogourt aux pêches",
  "drinkable yogurt": "yogourt à boire",
  "yogurt": "yogourt",
  "whole milk": "lait entier",
  "2% milk": "lait 2%",
  "1% milk": "lait 1%",
  "skim milk": "lait écrémé",
  "chocolate milk": "lait au chocolat",
  "almond milk": "lait d'amande",
  "oat milk": "lait d'avoine",
  "soy milk": "lait de soya",
  "coconut milk": "lait de coco",
  "milk": "lait",
  "heavy cream": "crème 35%",
  "whipping cream": "crème à fouetter 35%",
  "sour cream": "crème sure",
  "half and half": "crème 10%",
  "coffee cream": "crème à café 10%",
  "cream": "crème",
  "salted butter": "beurre salé",
  "unsalted butter": "beurre non salé",
  "butter": "beurre",
  "margarine": "margarine",
  "cheddar cheese": "fromage cheddar",
  "sharp cheddar": "cheddar fort",
  "mild cheddar": "cheddar doux",
  "marble cheddar": "cheddar marbré",
  "mozzarella cheese": "fromage mozzarella",
  "parmesan cheese": "fromage parmesan",
  "grated parmesan": "parmesan râpé",
  "feta cheese": "fromage feta",
  "swiss cheese": "fromage suisse",
  "brie cheese": "fromage brie",
  "cream cheese": "fromage à la crème",
  "cottage cheese": "fromage cottage",
  "goat cheese": "fromage de chèvre",
  "cheese": "fromage",
  "large eggs": "gros œufs",
  "free run eggs": "œufs en liberté",
  "organic eggs": "œufs biologiques",
  "brown eggs": "œufs bruns",
  "white eggs": "œufs blancs",
  "eggs": "œufs",
  "egg": "œuf",

  // --- Meat & Poultry & Seafood / Viandes, volailles & poissons ---
  "boneless skinless chicken breasts": "poitrines de poulet désossées sans peau",
  "boneless skinless chicken breast": "poitrine de poulet désossée sans peau",
  "chicken breasts": "poitrines de poulet",
  "chicken breast": "poitrine de poulet",
  "chicken thighs": "cuisses de poulet",
  "chicken thigh": "cuisse de poulet",
  "chicken drumsticks": "pilons de poulet",
  "chicken wings": "ailes de poulet",
  "ground chicken": "poulet haché",
  "whole chicken": "poulet entier",
  "roast chicken": "poulet rôti",
  "chicken tenders": "lanières de poulet",
  "chicken": "poulet",
  "lean ground beef": "bœuf haché maigre",
  "extra lean ground beef": "bœuf haché extra-maigre",
  "medium ground beef": "bœuf haché mi-maigre",
  "ground beef": "bœuf haché",
  "beef ribeye steak": "faux-filet de bœuf",
  "ribeye steak": "faux-filet",
  "sirloin steak": "bifteck de surlonge",
  "strip loin steak": "bifteck de contre-filet",
  "beef stew meat": "bœuf à ragoût",
  "beef roast": "rôti de bœuf",
  "roast beef": "rôti de bœuf",
  "beef": "bœuf",
  "pork chops": "côtelettes de porc",
  "pork chop": "côtelette de porc",
  "pork tenderloin": "filet de porc",
  "pork loin": "longe de porc",
  "pork ribs": "côtes levées de porc",
  "ground pork": "porc haché",
  "pork roast": "rôti de porc",
  "pork": "porc",
  "sliced bacon": "bacon tranché",
  "thick cut bacon": "bacon coupe épaisse",
  "bacon": "bacon",
  "cooked ham": "jambon cuit",
  "smoked ham": "jambon fumé",
  "ham": "jambon",
  "pork sausages": "saucisses de porc",
  "sausages": "saucisses",
  "sausage": "saucisse",
  "ground turkey": "dinde hachée",
  "turkey breast": "poitrine de dinde",
  "turkey": "dinde",
  "veal": "veau",
  "ground veal": "veau haché",
  "lamb chops": "côtelettes d'agneau",
  "lamb": "agneau",
  "atlantic salmon fillets": "filets de saumon de l'Atlantique",
  "atlantic salmon fillet": "filet de saumon de l'Atlantique",
  "salmon fillets": "filets de saumon",
  "salmon fillet": "filet de saumon",
  "fresh salmon": "saumon frais",
  "smoked salmon": "saumon fumé",
  "salmon": "saumon",
  "steelhead trout": "truite steelhead",
  "trout fillets": "filets de truite",
  "trout": "truite",
  "cod fillets": "filets de morue",
  "cod": "morue",
  "haddock fillets": "filets d'aiglefin",
  "haddock": "aiglefin",
  "halibut": "flétan",
  "tilapia fillets": "filets de tilapia",
  "tilapia": "tilapia",
  "canned tuna": "thon en conserve",
  "tuna": "thon",
  "cooked shrimp": "crevettes cuites",
  "raw shrimp": "crevettes crues",
  "jumbo shrimp": "grosses crevettes",
  "shrimp": "crevettes",
  "sea scallops": "pétoncles de mer",
  "scallops": "pétoncles",
  "fresh mussels": "moules fraîches",
  "mussels": "moules",
  "lobster": "homard",
  "crab": "crabe",
  "seafood": "fruits de mer",
  "fish": "poisson",

  // --- Produce / Fruits & Légumes frais ---
  "gala apples": "pommes Gala",
  "honeycrisp apples": "pommes Honeycrisp",
  "mcintosh apples": "pommes McIntosh",
  "granny smith apples": "pommes Granny Smith",
  "fuji apples": "pommes Fuji",
  "apples": "pommes",
  "apple": "pomme",
  "bananas": "bananes",
  "banana": "banane",
  "fresh strawberries": "fraises fraîches",
  "strawberries": "fraises",
  "strawberry": "fraise",
  "fresh blueberries": "bleuets frais",
  "blueberries": "bleuets",
  "fresh raspberries": "framboises fraîches",
  "raspberries": "framboises",
  "blackberries": "mûres",
  "seedless red grapes": "raisins rouges sans pépins",
  "seedless green grapes": "raisins verts sans pépins",
  "red grapes": "raisins rouges",
  "green grapes": "raisins verts",
  "grapes": "raisins",
  "fresh mangoes": "mangues fraîches",
  "fresh mango": "mangue fraîche",
  "ataulfo mango": "mangue Ataulfo",
  "mangoes": "mangues",
  "mango": "mangue",
  "hass avocados": "avocats Hass",
  "avocados": "avocats",
  "avocado": "avocat",
  "fresh pineapple": "ananas frais",
  "pineapple": "ananas",
  "watermelon": "melon d'eau",
  "cantaloupe": "cantaloup",
  "honeydew melon": "melon miel",
  "oranges": "oranges",
  "orange": "orange",
  "clementines": "clémentines",
  "lemons": "citrons",
  "lemon": "citron",
  "limes": "limes",
  "lime": "lime",
  "grapefruit": "pamplemousse",
  "fresh peaches": "pêches fraîches",
  "peaches": "pêches",
  "peach": "pêche",
  "fresh pears": "poires fraîches",
  "pears": "poires",
  "pear": "poire",
  "plums": "prunes",
  "cherries": "cerises",
  "kiwis": "kiwis",
  "kiwi": "kiwi",
  "romaine lettuce": "laitue romaine",
  "iceberg lettuce": "laitue iceberg",
  "leaf lettuce": "laitue en feuille",
  "lettuce": "laitue",
  "baby spinach": "bébés épinards",
  "spinach": "épinards",
  "kale": "chou frisé",
  "mixed salad greens": "mélange printanier de salade",
  "spring mix": "mélange printanier",
  "arugula": "roquette",
  "salad": "salade",
  "vine tomatoes": "tomates sur vigne",
  "roma tomatoes": "tomates Roma",
  "beefsteak tomatoes": "tomates de serre",
  "cherry tomatoes": "tomates cerises",
  "grape tomatoes": "tomates raisins",
  "tomatoes": "tomates",
  "tomato": "tomate",
  "english cucumber": "concombre anglais",
  "cucumbers": "concombres",
  "cucumber": "concombre",
  "red bell peppers": "poivrons rouges",
  "green bell peppers": "poivrons verts",
  "yellow bell peppers": "poivrons jaunes",
  "orange bell peppers": "poivrons oranges",
  "bell peppers": "poivrons",
  "bell pepper": "poivron",
  "peppers": "poivrons",
  "sweet peppers": "poivrons doux",
  "jalapeno peppers": "piments jalapeño",
  "russet potatoes": "pommes de terre Russet",
  "red potatoes": "pommes de terre rouges",
  "yellow potatoes": "pommes de terre jaunes",
  "sweet potatoes": "patates douces",
  "sweet potato": "patate douce",
  "potatoes": "pommes de terre",
  "potato": "pomme de terre",
  "yellow onions": "oignons jaunes",
  "red onions": "oignons rouges",
  "white onions": "oignons blancs",
  "green onions": "oignons verts",
  "onions": "oignons",
  "onion": "oignon",
  "fresh garlic": "ail frais",
  "garlic bulbs": "têtes d'ail",
  "garlic cloves": "gousses d'ail",
  "garlic": "ail",
  "fresh ginger": "gingembre frais",
  "ginger": "gingembre",
  "carrots": "carottes",
  "baby carrots": "bébés carottes",
  "carrot": "carotte",
  "celery stalks": "branches de céleri",
  "celery": "céleri",
  "fresh broccoli crowns": "couronnes de brocoli",
  "fresh broccoli": "brocoli frais",
  "broccoli": "brocoli",
  "fresh cauliflower": "chou-fleur frais",
  "cauliflower": "chou-fleur",
  "zucchini": "courgette",
  "yellow squash": "courge jaune",
  "butternut squash": "courge musquée",
  "cremini mushrooms": "champignons cremini",
  "white button mushrooms": "champignons blancs",
  "portobello mushrooms": "champignons portobello",
  "sliced mushrooms": "champignons tranchés",
  "mushrooms": "champignons",
  "mushroom": "champignon",
  "fresh asparagus": "asperges fraîches",
  "asparagus": "asperges",
  "green beans": "haricots verts",
  "brussels sprouts": "choux de Bruxelles",
  "cabbage": "chou",
  "red cabbage": "chou rouge",
  "fresh cilantro": "coriandre fraîche",
  "cilantro": "coriandre",
  "fresh parsley": "persil frais",
  "parsley": "persil",
  "fresh basil": "basilic frais",
  "basil": "basilic",
  "fresh rosemary": "romarin frais",
  "rosemary": "romarin",
  "fresh thyme": "thym frais",
  "thyme": "thym",

  // --- Bakery / Boulangerie ---
  "whole wheat bread": "pain de blé entier",
  "white bread": "pain blanc",
  "multigrain bread": "pain multigrain",
  "sourdough bread": "pain au levain",
  "rye bread": "pain de seigle",
  "french baguette": "baguette française",
  "baguette": "baguette",
  "plain bagels": "bagels nature",
  "everything bagels": "bagels tout garnis",
  "sesame bagels": "bagels au sésame",
  "bagels": "bagels",
  "croissants": "croissants",
  "croissant": "croissant",
  "hamburger buns": "pains à hamburger",
  "hot dog buns": "pains à hot-dog",
  "pita bread": "pain pita",
  "flour tortillas": "tortillas de blé",
  "corn tortillas": "tortillas de maïs",
  "tortillas": "tortillas",
  "english muffins": "muffins anglais",
  "bread": "pain",

  // --- Pantry Staples / Garde-manger ---
  "all-purpose flour": "farine tout usage",
  "whole wheat flour": "farine de blé entier",
  "bread flour": "farine à pain",
  "flour": "farine",
  "granulated sugar": "sucre granulé",
  "white sugar": "sucre blanc",
  "brown sugar": "cassonade",
  "icing sugar": "sucre à glacer",
  "sugar": "sucre",
  "baking powder": "poudre à pâte",
  "baking soda": "bicarbonate de soude",
  "yeast": "levure",
  "extra virgin olive oil": "huile d'olive extra vierge",
  "olive oil": "huile d'olive",
  "canola oil": "huile de canola",
  "vegetable oil": "huile végétale",
  "coconut oil": "huile de coco",
  "sesame oil": "huile de sésame",
  "oil": "huile",
  "apple cider vinegar": "vinaigre de cidre de pomme",
  "white vinegar": "vinaigre blanc",
  "balsamic vinegar": "vinaigre balsamique",
  "red wine vinegar": "vinaigre de vin rouge",
  "vinegar": "vinaigre",
  "soy sauce": "sauce soya",
  "fish sauce": "sauce de poisson",
  "worcestershire sauce": "sauce Worcestershire",
  "hot sauce": "sauce piquante",
  "tomato sauce": "sauce tomate",
  "marinara sauce": "sauce marinara",
  "pasta sauce": "sauce pour pâtes",
  "canned crushed tomatoes": "tomates broyées en conserve",
  "canned diced tomatoes": "tomates en dés en conserve",
  "canned whole tomatoes": "tomates entières en conserve",
  "canned tomatoes": "tomates en conserve",
  "tomato paste": "pâte de tomates",
  "steamed jasmine rice": "riz jasmin cuit vapeur",
  "steamed rice": "riz cuit vapeur",
  "fried rice": "riz frit",
  "jasmine rice": "riz jasmin",
  "basmati rice": "riz basmati",
  "white rice": "riz blanc",
  "brown rice": "riz brun",
  "parboiled rice": "riz étuvé",
  "rice": "riz",
  "spaghetti": "spaghetti",
  "penne pasta": "penne",
  "macaroni": "macaroni",
  "fettuccine": "fettuccine",
  "lasagna noodles": "nouilles à lasagne",
  "egg noodles": "nouilles aux œufs",
  "rice noodles": "nouilles de riz",
  "pasta": "pâtes",
  "noodles": "nouilles",
  "canned black beans": "haricots noirs en conserve",
  "canned chickpeas": "pois chiches en conserve",
  "canned red kidney beans": "haricots rouges en conserve",
  "black beans": "haricots noirs",
  "chickpeas": "pois chiches",
  "lentils": "lentilles",
  "whole kernel corn": "maïs en grains entiers",
  "whole kernel": "grains entiers",
  "canned": "en boîte",
  "whole kernel canned corn": "maïs en grains entiers en conserve",
  "canned whole kernel corn": "maïs en grains entiers en conserve",
  "canned corn": "maïs en conserve",
  "cream style corn": "maïs en crème",
  "sweet corn": "maïs sucré",
  "corn on the cob": "maïs en épi",
  "corn": "maïs",
  "canned beans": "haricots en conserve",
  "baked beans": "fèves au lard",
  "baked beans with maple syrup": "fèves au lard au sirop d'érable",
  "canned green peas": "petits pois en conserve",
  "green peas": "petits pois",
  "peas": "pois",
  "flaked light tuna": "thon pâle émietté",
  "chunk light tuna": "thon pâle en morceaux",
  "canned salmon": "saumon en conserve",
  "canned soup": "soupe en conserve",
  "chicken noodle soup": "soupe poulet et nouilles",
  "tomato soup": "soupe aux tomates",
  "cream of mushroom soup": "crème de champignons",
  "cream of chicken soup": "crème de poulet",
  "chicken broth": "bouillon de poulet",
  "beef broth": "bouillon de bœuf",
  "vegetable broth": "bouillon de légumes",
  "broth": "bouillon",
  "rolled oats": "flocons d'avoine",
  "quick oats": "gruau rapide",
  "oats": "avoine",
  "breakfast cereal": "céréales de déjeuner",
  "cereal": "céréales",
  "creamy peanut butter": "beurre d'arachide crémeux",
  "crunchy peanut butter": "beurre d'arachide croquant",
  "peanut butter": "beurre d'arachide",
  "almond butter": "beurre d'amande",
  "strawberry jam": "confiture de fraises",
  "raspberry jam": "confiture de framboises",
  "jam": "confiture",
  "pure maple syrup": "sirop d'érable pur",
  "maple syrup": "sirop d'érable",
  "honey": "miel",
  "vanilla extract": "extrait de vanille",
  "mayonnaise": "mayonnaise",
  "mustard": "moutarde",
  "dijon mustard": "moutarde de Dijon",
  "yellow mustard": "moutarde jaune",
  "ketchup": "ketchup",
  "relish": "relish",
  "kosher salt": "sel cachère",
  "sea salt": "sel de mer",
  "table salt": "sel de table",
  "salt": "sel",
  "black pepper": "poivre noir",
  "ground black pepper": "poivre noir moulu",
  "black peppercorns": "grains de poivre noir",
  "pepper": "poivre",
  "oregano": "origan",
  "paprika": "paprika",
  "smoked paprika": "paprika fumé",
  "cumin": "cumin",
  "ground cumin": "cumin moulu",
  "chili powder": "poudre de chili",
  "cinnamon": "cannelle",
  "ground cinnamon": "cannelle moulue",
  "nutmeg": "muscade",
  "ground ginger": "gingembre moulu",
  "bay leaves": "feuilles de laurier",
  "bay leaf": "feuille de laurier",

  // --- Frozen / Surgelés ---
  "frozen thin crust pizza": "pizza mince surgelée",
  "frozen pizza": "pizza surgelée",
  "vanilla ice cream": "crème glacée à la vanille",
  "chocolate ice cream": "crème glacée au chocolat",
  "ice cream": "crème glacée",
  "frozen green peas": "petits pois surgelés",
  "frozen corn": "maïs surgelé",
  "frozen mixed vegetables": "légumes mélangés surgelés",
  "frozen berries": "petits fruits surgelés",
  "frozen fruit": "fruits surgelés",
  "frozen waffles": "gaufres surgelées",
  "frozen french fries": "frites surgelées",

  // --- Beverages / Boissons ---
  "orange juice": "jus d'orange",
  "apple juice": "jus de pomme",
  "juice": "jus",
  "sparkling water": "eau pétillante",
  "spring water": "eau de source",
  "water": "eau",
  "ground coffee": "café moulu",
  "coffee beans": "café en grains",
  "coffee": "café",
  "green tea": "thé vert",
  "black tea": "thé noir",
  "herbal tea": "tisane",
  "tea": "thé",

  // --- Leftovers & Filipino/Festive dishes ---
  "leftover roast chicken": "restes de poulet rôti",
  "leftover steamed jasmine rice": "restes de riz jasmin cuit",
  "leftover fried rice": "restes de riz frit",
  "leftover pancit bihon": "restes de pancit bihon",
  "leftover chicken adobo": "restes d'adobo de poulet",
  "leftover pork lechon": "restes de rôti de porc lechon",
  "leftover pork adobo": "restes d'adobo de porc",
  "leftover beef stew": "restes de ragoût de bœuf",
  "leftover meat lasagna": "restes de lasagne à la viande",
  "leftover spaghetti bolognese": "restes de spaghetti bolognaise",
  "leftover chicken soup": "restes de soupe au poulet",
  "leftover vegetable curry": "restes de curry de légumes",
};

// Build reverse dictionary: French -> English
export const FR_TO_EN_DICTIONARY = {};
for (const [enKey, frVal] of Object.entries(EN_TO_FR_DICTIONARY)) {
  FR_TO_EN_DICTIONARY[frVal.toLowerCase()] = enKey;
}

// Additional specific French synonyms and regional variations
const EXTRA_FR_TO_EN = {
  "yaourt": "yogurt",
  "yaourt grec": "greek yogurt",
  "yaourt nature": "plain yogurt",
  "yaourt vanille": "vanilla yogurt",
  "yogourt grec nature": "plain greek yogurt",
  "yogourt grec vanille": "vanilla greek yogurt",
  "oeuf": "egg",
  "oeufs": "eggs",
  "pommes": "apples",
  "pomme": "apple",
  "poitrine de poulet": "chicken breast",
  "poitrines de poulet": "chicken breasts",
  "boeuf hache": "ground beef",
  "bœuf haché": "ground beef",
  "bœuf": "beef",
  "boeuf": "beef",
  "porc": "pork",
  "saumon": "salmon",
  "morue": "cod",
  "truite": "trout",
  "crevettes": "shrimp",
  "crevette": "shrimp",
  "fromage": "cheese",
  "beurre": "butter",
  "lait": "milk",
  "farine": "flour",
  "sucre": "sugar",
  "sel": "salt",
  "poivre": "pepper",
  "huile d'olive": "olive oil",
  "huile": "oil",
  "vinaigre": "vinegar",
  "riz": "rice",
  "pates": "pasta",
  "pâtes": "pasta",
  "pain": "bread",
  "bleuets": "blueberries",
  "fraises": "strawberries",
  "framboises": "raspberries",
  "raisins": "grapes",
  "raisins rouges": "red grapes",
  "mangue": "mango",
  "avocat": "avocado",
  "tomates": "tomatoes",
  "tomate": "tomato",
  "carottes": "carrots",
  "carotte": "carrot",
  "oignons": "onions",
  "oignon": "onion",
  "ail": "garlic",
  "epinards": "spinach",
  "épinards": "spinach",
  "laitue": "lettuce",
  "brocoli": "broccoli",
  "chou-fleur": "cauliflower",
  "champignons": "mushrooms",
  "patates douces": "sweet potatoes",
  "pommes de terre": "potatoes",
  "concombres": "cucumbers",
  "concombre": "cucumber",
  "poivrons": "bell peppers",
  "poivron": "bell pepper",
  // Corn & canned staples
  "maïs en grains entiers": "whole kernel corn",
  "mais en grains entiers": "whole kernel corn",
  "maïs en grains": "whole kernel corn",
  "mais en grains": "whole kernel corn",
  "maïs en boîte": "canned corn",
  "mais en boite": "canned corn",
  "maïs en conserve": "canned corn",
  "mais en conserve": "canned corn",
  "maïs sucré": "sweet corn",
  "mais sucre": "sweet corn",
  "maïs en crème": "cream style corn",
  "mais en creme": "cream style corn",
  "maïs": "corn",
  "mais": "corn",
  "blé d'inde": "sweet corn",
  "ble d'inde": "sweet corn",
  "en conserve": "canned",
  "en boîte": "canned",
  "en boite": "canned",
  "boîte de conserve": "canned",
  "boite de conserve": "canned",
  "grains entiers": "whole kernel",
  "haricots en conserve": "canned beans",
  "haricots en boîte": "canned beans",
  "haricots en boite": "canned beans",
  "fèves au lard": "baked beans",
  "feves au lard": "baked beans",
  "petits pois": "green peas",
  "petits pois en conserve": "canned green peas",
  "petits pois en boîte": "canned green peas",
  "petits pois en boite": "canned green peas",
  "pois chiches": "chickpeas",
  "pois chiches en conserve": "canned chickpeas",
  "pois chiches en boîte": "canned chickpeas",
  "pois chiches en boite": "canned chickpeas",
  "thon en boîte": "canned tuna",
  "thon en boite": "canned tuna",
  "thon en conserve": "canned tuna",
  "thon blanc": "white albacore tuna",
  "thon pâle": "light tuna",
  "thon pale": "light tuna",
  "thon": "tuna",
  "saumon en boîte": "canned salmon",
  "saumon en boite": "canned salmon",
  "saumon en conserve": "canned salmon",
  // Badges & descriptors
  "marché canadien": "canadian market",
  "marche canadien": "canadian market",
  "aliment du québec": "food of quebec",
  "aliment du quebec": "food of quebec",
  "produit du canada": "product of canada",
  "produit du québec": "product of quebec",
  "produit du quebec": "product of quebec",
  "100% lait canadien": "100% canadian milk",
  "produits laitiers frais": "fresh dairy",
  "produits frais": "fresh produce",
  "produit frais": "fresh produce",
  "sans emballage": "packaging-free",
  "certifié biologique": "certified organic",
  "certifie biologique": "certified organic",
  "biologique": "organic",
  "format familial": "family size",
  "emballage commercial": "retail package",
  "fruit/légume frais en vrac": "whole fresh loose produce",
  "fruit/legume frais en vrac": "whole fresh loose produce",
  "en vrac": "loose produce",
  "pot de yogourt": "yogurt tub",
  "pot en plastique": "plastic tub",
  "bocal en verre": "glass jar",
  "bouteille plastique": "plastic bottle",
  "sac plastique": "plastic bag",
  "boîte de carton": "cardboard box",
  "boite de carton": "cardboard box",
  "barquette refermable": "clamshell container",
  "emballage sous vide": "vacuum pack",
};

for (const [frKey, enVal] of Object.entries(EXTRA_FR_TO_EN)) {
  FR_TO_EN_DICTIONARY[frKey.toLowerCase()] = enVal;
}

/**
 * Normalizes text for key comparison
 */
function cleanKey(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[,\(\)\.:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether text appears to be primarily French
 */
export function isTextFrench(text) {
  if (!text) return false;
  // If it has typical French accents (à, â, é, è, ê, ë, î, ï, ô, ù, û, ü, ç, œ), it's strongly French:
  if (/[àâéèêëîïôùûüçœ]/i.test(text)) return true;

  const lower = text.toLowerCase();

  // Strong English signals that mean it's English
  const enSignals = [
    "whole", "kernel", "canned", "sweet", "frozen", "fresh", "sliced", "ground", "smoked",
    "roasted", "organic", "breast", "breasts", "thigh", "thighs", "steak", "roast", "pork",
    "beef", "chicken", "turkey", "salmon", "tuna", "beans", "corn", "peas", "carrots",
    "apples", "onions", "potatoes", "bread", "cheese", "milk", "butter", "cream", "water",
    "juice", "chips", "crackers", "cookies", "dressing", "flavour", "flavor", "syrup",
    "sauce", "broth", "soup", "bacon", "sausage", "leftover", "leftovers"
  ];
  const hasEnWord = enSignals.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));

  const frSignals = [
    "lait", "yogourt", "yaourt", "fromage", "beurre", "oeuf", "œuf", "poulet", "bœuf", "boeuf",
    "porc", "saumon", "poisson", "crevette", "pomme", "fraise", "bleuet", "framboise",
    "raisin", "mangue", "avocat", "tomate", "carotte", "oignon", "ail", "épinard",
    "pain", "farine", "sucre", "sel", "poivre", "huile", "vinaigre", "riz", "pâte", "pates",
    "sans nom", "sélection", "irrésistibles", "restes", "cuit",
    "rôti", "tranché", "frais", "surgelé", "biologique",
    "maïs", "mais", "grain", "grains", "entier", "entiers", "boîte", "boite", "conserve",
    "conserves", "haricot", "haricots", "fève", "fèves", "pois", "thon",
    "bouillon", "soupe", "confiture", "sirop", "crème", "creme", "moutarde",
    "vinaigrette", "gruau", "flocons", "avoine", "canneberge", "érable",
    "collation", "biscuit", "biscuits", "craquelin", "craquelins", "croustille", "croustilles",
    "tranches", "sachet", "bocal", "bouteille", "paquet", "canette", "portion",
    "portions", "unité", "unite", "morceau", "morceaux", "doux", "épicé", "sucré", "salé",
    "préparé", "canadien", "canadienne", "québécois", "garde-manger", "repas", "recette"
  ];
  const hasFrWord = frSignals.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower));

  if (hasEnWord && !hasFrWord) return false;
  if (hasFrWord && !hasEnWord) return true;
  return hasFrWord;
}

/**
 * Translates a single food or ingredient item name into the target language.
 *
 * @param {string} rawName - Product, ingredient or meal name
 * @param {'FR'|'EN'} targetLang - 'FR' for French or 'EN' for English
 * @returns {string} Translated title
 */
export function translateFoodItem(rawName, targetLang = "FR") {
  if (!rawName || typeof rawName !== "string") return "";
  const trimmed = rawName.trim();
  if (trimmed.length < 2) return trimmed;

  const target = targetLang.toUpperCase() === "FR" ? "FR" : "EN";

  // Check if it's already leftover prefix
  let isLeftover = false;
  let leftoverClean = trimmed;
  if (/^(?:restes?|reste)\s*:\s*/i.test(trimmed)) {
    isLeftover = true;
    leftoverClean = trimmed.replace(/^(?:restes?|reste)\s*:\s*/i, "");
  } else if (/^leftovers?\s*:\s*/i.test(trimmed)) {
    isLeftover = true;
    leftoverClean = trimmed.replace(/^leftovers?\s*:\s*/i, "");
  }

  // Preserve package sizing / brand prefixes (e.g., "(750 g)", "Oikos", "454g", "Club Pack")
  const sizeMatch = leftoverClean.match(/\(([^)]+)\)$/);
  const sizeSuffix = sizeMatch ? ` (${sizeMatch[1]})` : "";
  const cleanCore = leftoverClean.replace(/\(([^)]+)\)$/, "").trim();

  // Extract known brands
  const brands = [
    "Oikos", "Danone", "Iögo", "Iogo", "Astro", "Activia", "Liberté", "Olympic",
    "Siggi's", "Chobani", "Québon", "Natrel", "Beatrice", "Lactantia", "Neilson",
    "Saputo", "Armstrong", "Black Diamond", "Cracker Barrel", "Sélection", "Selection",
    "Irrésistibles", "Irresistibles", "Sans nom", "No Name", "President's Choice", "PC",
    "Compliments", "Great Value", "Kirkland Signature", "Kirkland", "Olymel", "Maple Leaf",
    "Schneiders", "Savoura", "Wonder", "D'Italiano", "Dempster's", "Villaggio", "Gadoua",
    "St-Méthode", "Catelli", "Barilla", "Kraft", "Heinz", "Hellmann's", "French's",
    "Clover Leaf", "Ocean's", "High Liner", "Tropicana", "Oasis", "Fairlife"
  ];

  let detectedBrand = null;
  let nameWithoutBrand = cleanCore;

  for (const b of brands) {
    const brandRegex = new RegExp(`^${b}\\s+|\\s+${b}$|\\b${b}\\b`, "i");
    if (brandRegex.test(cleanCore)) {
      detectedBrand = b;
      nameWithoutBrand = cleanCore.replace(brandRegex, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const lookupKey = cleanKey(nameWithoutBrand || cleanCore);

  let translatedCore = null;

  if (target === "FR") {
    // Translating to French
    if (EN_TO_FR_DICTIONARY[lookupKey]) {
      translatedCore = EN_TO_FR_DICTIONARY[lookupKey];
    } else {
      // Partial matching for compound English food phrases (longer phrases first)
      let partial = lookupKey;
      const sortedEntries = Object.entries(EN_TO_FR_DICTIONARY).sort((a, b) => b[0].length - a[0].length);
      for (const [enKey, frVal] of sortedEntries) {
        if (enKey.length >= 3 && partial.includes(enKey)) {
          partial = partial.replace(new RegExp(`\\b${enKey}\\b`, "gi"), frVal);
        }
      }
      if (partial !== lookupKey) {
        translatedCore = partial;
      }
    }
  } else {
    // Translating to English
    if (FR_TO_EN_DICTIONARY[lookupKey]) {
      translatedCore = FR_TO_EN_DICTIONARY[lookupKey];
    } else {
      // Partial matching for compound French food phrases (longer phrases first)
      let partial = lookupKey;
      const sortedEntries = Object.entries(FR_TO_EN_DICTIONARY).sort((a, b) => b[0].length - a[0].length);
      for (const [frKey, enVal] of sortedEntries) {
        if (frKey.length >= 3 && partial.includes(frKey)) {
          partial = partial.replace(new RegExp(`\\b${frKey}\\b`, "gi"), enVal);
        }
      }
      if (partial !== lookupKey) {
        translatedCore = partial;
      }
    }
  }

  // Capitalize properly
  let result = translatedCore || nameWithoutBrand || cleanCore;
  result = result.charAt(0).toUpperCase() + result.slice(1);

  // Re-attach brand if stripped
  if (detectedBrand) {
    result = `${detectedBrand} ${result}`;
  }

  // Re-attach size
  if (sizeSuffix) {
    result = `${result}${sizeSuffix}`;
  }

  // Re-attach leftover prefix if present
  if (isLeftover) {
    result = target === "FR" ? `Restes : ${result}` : `Leftover: ${result}`;
  }

  return result;
}

/**
 * Returns structured bilingual names `{ name, nameFr, nameEn }` for any imported item.
 *
 * @param {string} rawName - Raw product or ingredient name
 * @param {'FR'|'EN'} preferredLang - User's active language
 * @returns {{ name: string, nameFr: string, nameEn: string }}
 */
export function getBilingualNames(rawName, preferredLang = "FR") {
  if (!rawName || typeof rawName !== "string") {
    return { name: "", nameFr: "", nameEn: "" };
  }

  const trimmed = rawName.trim();
  const isFr = preferredLang.toUpperCase().startsWith("FR");
  const isInputFr = isTextFrench(trimmed);

  let nameFr = "";
  let nameEn = "";

  if (isInputFr) {
    nameFr = trimmed;
    nameEn = translateFoodItem(trimmed, "EN");
  } else {
    nameEn = trimmed;
    nameFr = translateFoodItem(trimmed, "FR");
  }

  // Fallbacks if one didn't change
  if (!nameFr) nameFr = trimmed;
  if (!nameEn) nameEn = trimmed;

  const activeName = isFr ? nameFr : nameEn;

  return {
    name: activeName,
    nameFr,
    nameEn,
  };
}

/**
 * Translates a complete recipe's ingredients and title into bilingual structures.
 */
export function translateRecipeIngredients(ingredients = [], targetLang = "FR") {
  if (!Array.isArray(ingredients)) return [];

  return ingredients.map((ing) => {
    const rawName = ing.name || ing.nameFr || "";
    const biling = getBilingualNames(rawName, targetLang);

    return {
      ...ing,
      name: targetLang === "FR" ? (biling.nameFr || biling.name) : (biling.nameEn || biling.name),
      nameFr: biling.nameFr,
      nameEn: biling.nameEn,
    };
  });
}
