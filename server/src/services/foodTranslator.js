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
  "pork loin roast": "rôti de longe de porc",
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
  "unbleached all-purpose flour": "farine tout usage non blanchie",
  "unbleached flour": "farine non blanchie",
  "all-purpose flour": "farine tout usage",
  "whole wheat flour": "farine de blé entier",
  "bread flour": "farine à pain",
  "flour": "farine",
  "granulated sugar": "sucre granulé",
  "white sugar": "sucre blanc",
  "brown sugar": "cassonade",
  "icing sugar": "sucre à glacer",
  "maple syrup": "sirop d'érable",
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
  "dijon mustard": "moutarde de Dijon",
  "yellow mustard": "moutarde jaune",
  "mustard": "moutarde",
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
  "honey": "miel",
  "vanilla extract": "extrait de vanille",
  "mayonnaise": "mayonnaise",
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

  // --- Filipino Staples & Ingredients / Ingrédients philippins ---
  "pork belly (liempo)": "poitrine de porc (liempo)",
  "pork belly": "poitrine de porc",
  "liempo": "poitrine de porc (liempo)",
  "pork shoulder (kasim)": "épaule de porc (kasim)",
  "kasim": "épaule de porc (kasim)",
  "sinigang mix": "mélange pour soupe sinigang au tamarin",
  "sinigang sa sampaloc mix": "mélange pour soupe sinigang au tamarin",
  "sinigang sa sampalok mix": "mélange pour soupe sinigang au tamarin",
  "tamarind soup mix": "mélange pour soupe au tamarin",
  "knorr sinigang mix": "mélange pour sinigang Knorr",
  "fish sauce (patis)": "sauce de poisson (patis)",
  "patis": "sauce de poisson (patis)",
  "cane vinegar (suka)": "vinaigre de canne (suka)",
  "cane vinegar": "vinaigre de canne",
  "suka": "vinaigre de canne (suka)",
  "soy sauce (toyo)": "sauce soja (toyo)",
  "toyo": "sauce soja (toyo)",
  "shrimp paste (bagoong)": "pâte de crevettes (bagoong)",
  "bagoong alamang": "pâte de crevettes fermentée (bagoong)",
  "bagoong": "pâte de crevettes (bagoong)",
  "water spinach (kangkong)": "épinards d'eau (kangkong)",
  "water spinach": "épinards d'eau (kangkong)",
  "kangkong": "épinards d'eau (kangkong)",
  "string beans (sitaw)": "haricots longs (sitaw)",
  "string beans": "haricots verts longs (sitaw)",
  "sitaw": "haricots longs (sitaw)",
  "yardlong beans": "haricots longs (sitaw)",
  "eggplant (talong)": "aubergine (talong)",
  "talong": "aubergine (talong)",
  "taro root (gabi)": "racine de taro (gabi)",
  "taro (gabi)": "taro (gabi)",
  "gabi": "racine de taro (gabi)",
  "taro": "racine de taro",
  "daikon radish (labanos)": "radis blanc daikon (labanos)",
  "daikon radish": "radis blanc daikon",
  "labanos": "radis blanc daikon (labanos)",
  "radish": "radis",
  "okra": "gombos (okra)",
  "long green chili (siling haba)": "piment vert doux (siling haba)",
  "long green chili": "piment vert doux (siling haba)",
  "siling haba": "piment vert doux (siling haba)",
  "siling pansigang": "piment vert pour sinigang",
  "siling labuyo": "petit piment oiseau piquant",
  "bird's eye chili": "piment oiseau",
  "bitter melon (ampalaya)": "margose / melon amer (ampalaya)",
  "bitter melon": "melon amer (ampalaya)",
  "ampalaya": "melon amer (ampalaya)",
  "chayote (sayote)": "chayote (sayote)",
  "chayote": "chayote (sayote)",
  "sayote": "chayote (sayote)",
  "moringa leaves (malunggay)": "feuilles de moringa (malunggay)",
  "malunggay": "feuilles de moringa (malunggay)",
  "bok choy (pechay)": "bok choy (pechay)",
  "pechay": "bok choy (pechay)",
  "lemongrass (tanglad)": "citronnelle (tanglad)",
  "lemongrass": "citronnelle (tanglad)",
  "tanglad": "citronnelle (tanglad)",
  "coconut milk (gata)": "lait de coco (gata)",
  "coconut cream (kakang gata)": "crème de coco première pression (kakang gata)",
  "gata": "lait de coco (gata)",
  "annatto seeds (atsuete)": "graines de rocou (atsuete)",
  "annatto powder": "poudre de rocou (atsuete)",
  "atsuete": "graines de rocou (atsuete)",
  "achuete": "graines de rocou (achuete)",
  "calamansi": "calamondin / lime philippine",
  "calamansi juice": "jus de calamansi",
  "chicharon": "grattons de porc soufflés (chicharon)",
  "lumpia wrapper": "feuilles de pâte à lumpia / rouleaux impériaux",
  "lumpia wrappers": "feuilles de pâte à lumpia",
  "rice noodles (bihon)": "vermicelles de riz (bihon)",
  "bihon": "vermicelles de riz (bihon)",
  "egg noodles (canton)": "nouilles aux œufs (pancit canton)",
  "pancit canton": "nouilles sautées pancit canton",
  "cellophane noodles (sotanghon)": "vermicelles de haricot mungo (sotanghon)",
  "sotanghon": "vermicelles transparents (sotanghon)",
  "miswa": "vermicelles de blé fins (miswa)",
  "banana ketchup": "ketchup de banane philippin",
  "liver spread": "tartinade de foie pour caldereta",
  "sweet potato (kamote)": "patate douce (kamote)",
  "kamote": "patate douce (kamote)",
  "bay leaves (dahon ng laurel)": "feuilles de laurier (dahon ng laurel)",
  "black peppercorns (paminta)": "grains de poivre noir (paminta)",
  "cooking oil (mantika)": "huile de cuisson (mantika)",
  "cooking oil": "huile de cuisson",

  // --- Filipino Dishes / Plats philippins ---
  "pork sinigang": "sinigang de porc (soupe tamarin)",
  "sinigang na baboy": "sinigang de porc (soupe tamarin)",
  "killer pork sinigang": "sinigang de porc réconfortant (soupe tamarin)",
  "chicken adobo": "adobo de poulet",
  "adobong manok": "adobo de poulet",
  "pork adobo": "adobo de porc",
  "adobong baboy": "adobo de porc",
  "kare-kare": "kare-kare (ragoût à la sauce d'arachide)",
  "beef caldereta": "caldereta de bœuf (ragoût tomaté épicé)",
  "pork menudo": "menudo de porc",
  "chicken afritada": "afritada de poulet",
  "lechon kawali": "poitrine de porc croustillante (lechon kawali)",
  "crispy pata": "jarret de porc croustillant (crispy pata)",
  "pork sisig": "sisig de porc croustillant",
  "chicken tinola": "soupe tinola de poulet au gingembre et chayote",
  "tinolang manok": "soupe tinola de poulet au gingembre",
  "bicol express": "porc épicé au lait de coco et piment (bicol express)",
  "bulalo": "soupe bulalo au jarret de bœuf et maïs",
  "lumpiang shanghai": "petits rouleaux impériaux au porc (lumpiang shanghai)",
  "pancit bihon": "nouilles sautées de riz pancit bihon",
  "pancit palabok": "nouilles pancit palabok à la sauce crevette et chicharon",
  "arroz caldo": "soupe de riz réconfortante au poulet et gingembre (arroz caldo)",
  "halo-halo": "dessert glacé philippin halo-halo",
  "turon": "rouleaux croustillants de banane et jacquier (turon)",
  "apple and maple syrup pork roast": "rôti de porc aux pommes et sirop d'érable",
  "pork roast with apples and maple syrup": "rôti de porc aux pommes et sirop d'érable",
  "pork roast with apples": "rôti de porc aux pommes",
  "spaghetti squash meal soup": "soupe-repas à la courge spaghetti",
  "spaghetti squash dinner soup": "soupe-repas à la courge spaghetti",
  "spaghetti squash soup": "soupe à la courge spaghetti",
  "spaghetti squash": "courge spaghetti",
  "acorn squash": "courge poivrée",
  "kabocha squash": "courge kabocha",
  "squash": "courge",
  "meal soup": "soupe-repas",
  "dinner soup": "soupe-repas",
  "soup": "soupe",
  "creamy soup": "potage",
  "smooth soup": "velouté",
  "white beans": "haricots blancs",
  "cannellini beans": "haricots cannellini",
  "kidney beans": "haricots rouges",
  "navy beans": "haricots blancs",
  "bone broth": "bouillon d'os",
  "shredded parmesan": "parmesan râpé",

  // Connectors and qualifiers
  "and": "et",
  "with": "avec",
  "or": "ou",
  "for": "pour",
  "to taste": "au goût",
};

// Tagalog / Filipino dishes and ingredients -> English translation
export const TAGALOG_TO_EN_DICTIONARY = {
  "sinigang na baboy": "pork sinigang (tamarind soup)",
  "killer pork sinigang": "comforting pork sinigang (tamarind soup)",
  "sinigang": "sinigang (tamarind soup)",
  "adobong manok": "chicken adobo",
  "adobong baboy": "pork adobo",
  "adobo": "adobo (soy-vinegar braise)",
  "kare-kare": "kare-kare (peanut stew)",
  "kare kare": "kare-kare (peanut stew)",
  "tinolang manok": "chicken tinola (ginger broth)",
  "tinola": "chicken tinola (ginger broth)",
  "pancit bihon": "pancit bihon (stir-fried rice noodles)",
  "pancit canton": "pancit canton (stir-fried egg noodles)",
  "pancit palabok": "pancit palabok (noodles with shrimp sauce)",
  "pancit": "pancit noodles",
  "lumpiang shanghai": "pork spring rolls (lumpia)",
  "lumpia": "filipino spring rolls (lumpia)",
  "lechon kawali": "crispy pork belly (lechon kawali)",
  "crispy pata": "crispy pork knuckle (crispy pata)",
  "bicol express": "spicy pork in coconut milk (bicol express)",
  "bulalo": "beef bone marrow soup (bulalo)",
  "menudo": "pork menudo stew",
  "pork menudo": "pork menudo stew",
  "caldereta": "beef caldereta (spiced tomato stew)",
  "beef caldereta": "beef caldereta (spiced tomato stew)",
  "kaldereta": "beef caldereta (spiced tomato stew)",
  "afritada": "chicken afritada stew",
  "chicken afritada": "chicken afritada stew",
  "sisig": "sizzling crispy pork sisig",
  "pork sisig": "sizzling crispy pork sisig",
  "pinakbet": "pinakbet (vegetables in shrimp paste)",
  "pakbet": "pinakbet (vegetables in shrimp paste)",
  "arroz caldo": "chicken rice porridge (arroz caldo)",
  "halo-halo": "halo-halo shaved ice dessert",
  "turon": "crispy banana jackfruit rolls (turon)",
  "liempo": "pork belly (liempo)",
  "kasim": "pork shoulder (kasim)",
  "baboy": "pork",
  "manok": "chicken",
  "baka": "beef",
  "isda": "fish",
  "hipon": "shrimp",
  "pusit": "squid",
  "patis": "fish sauce (patis)",
  "toyo": "soy sauce (toyo)",
  "suka": "cane vinegar (suka)",
  "bagoong": "fermented shrimp paste (bagoong)",
  "bagoong alamang": "fermented shrimp paste (bagoong)",
  "kangkong": "water spinach (kangkong)",
  "sitaw": "string beans (sitaw)",
  "talong": "eggplant (talong)",
  "gabi": "taro root (gabi)",
  "labanos": "daikon radish (labanos)",
  "calamansi": "calamansi (Philippine lime)",
  "kalamansi": "calamansi (Philippine lime)",
  "malunggay": "moringa leaves (malunggay)",
  "sayote": "chayote (sayote)",
  "ampalaya": "bitter melon (ampalaya)",
  "siling haba": "long green chili (siling haba)",
  "siling pansigang": "green finger chili for sinigang",
  "siling labuyo": "bird's eye chili",
  "tanglad": "lemongrass (tanglad)",
  "gata": "coconut milk (gata)",
  "kakang gata": "coconut cream",
  "atsuete": "annatto seeds (atsuete)",
  "achuete": "annatto seeds (achuete)",
  "paminta": "black peppercorns (paminta)",
  "mantika": "cooking oil",
  "dahon ng laurel": "bay leaves (dahon ng laurel)",
  "chicharon": "crispy pork rinds (chicharon)",
  "sinigang mix": "tamarind soup mix (sinigang mix)",
  "sinigang sa sampaloc mix": "tamarind soup mix (sinigang mix)",
  "sampaloc": "tamarind",
  "sampalok": "tamarind",
};

// Tagalog / Filipino dishes and ingredients -> French translation
export const TAGALOG_TO_FR_DICTIONARY = {
  "sinigang na baboy": "sinigang de porc (soupe tamarin)",
  "killer pork sinigang": "sinigang de porc réconfortant (soupe tamarin)",
  "sinigang": "soupe tamarin philippine (sinigang)",
  "adobong manok": "adobo de poulet",
  "adobong baboy": "adobo de porc",
  "adobo": "adobo (mijoté soja-vinaigre)",
  "kare-kare": "kare-kare (ragoût à la sauce d'arachide)",
  "kare kare": "kare-kare (ragoût à la sauce d'arachide)",
  "tinolang manok": "soupe tinola de poulet au gingembre",
  "tinola": "soupe tinola au gingembre",
  "pancit bihon": "vermicelles de riz sautés (pancit bihon)",
  "pancit canton": "nouilles sautées aux œufs (pancit canton)",
  "pancit palabok": "nouilles palabok à la sauce crevette et chicharon",
  "pancit": "nouilles sautées pancit",
  "lumpiang shanghai": "rouleaux impériaux philippins (lumpia)",
  "lumpia": "rouleaux impériaux philippins (lumpia)",
  "lechon kawali": "poitrine de porc croustillante (lechon kawali)",
  "crispy pata": "jarret de porc croustillant (crispy pata)",
  "bicol express": "porc épicé au lait de coco et piment (bicol express)",
  "bulalo": "soupe au jarret de bœuf et maïs (bulalo)",
  "menudo": "ragoût de porc menudo",
  "pork menudo": "menudo de porc",
  "caldereta": "caldereta de bœuf tomatée épicée",
  "beef caldereta": "caldereta de bœuf tomatée épicée",
  "kaldereta": "caldereta de bœuf tomatée épicée",
  "afritada": "afritada de poulet en sauce tomate",
  "chicken afritada": "afritada de poulet",
  "sisig": "poêlée croustillante de porc (sisig)",
  "pork sisig": "sisig de porc croustillant",
  "pinakbet": "légumes mijotés à la pâte de crevette (pinakbet)",
  "pakbet": "légumes mijotés à la pâte de crevette (pinakbet)",
  "arroz caldo": "soupe de riz au poulet et gingembre (arroz caldo)",
  "halo-halo": "dessert glacé philippin halo-halo",
  "turon": "rouleaux croustillants de banane et jacquier (turon)",
  "liempo": "poitrine de porc (liempo)",
  "kasim": "épaule de porc (kasim)",
  "baboy": "porc",
  "manok": "poulet",
  "baka": "bœuf",
  "isda": "poisson",
  "hipon": "crevettes",
  "pusit": "calmar",
  "patis": "sauce de poisson (patis)",
  "toyo": "sauce soja (toyo)",
  "suka": "vinaigre de canne (suka)",
  "bagoong": "pâte de crevettes fermentée (bagoong)",
  "bagoong alamang": "pâte de crevettes fermentée (bagoong)",
  "kangkong": "épinards d'eau (kangkong)",
  "sitaw": "haricots longs (sitaw)",
  "talong": "aubergine (talong)",
  "gabi": "racine de taro (gabi)",
  "labanos": "radis blanc daikon (labanos)",
  "calamansi": "calamondin / lime philippine",
  "kalamansi": "calamondin / lime philippine",
  "malunggay": "feuilles de moringa (malunggay)",
  "sayote": "chayote (sayote)",
  "ampalaya": "margose / melon amer (ampalaya)",
  "siling haba": "piment vert doux (siling haba)",
  "siling pansigang": "piment vert pour sinigang",
  "siling labuyo": "petit piment oiseau piquant",
  "tanglad": "citronnelle (tanglad)",
  "gata": "lait de coco (gata)",
  "kakang gata": "crème de coco première pression",
  "atsuete": "graines de rocou (atsuete)",
  "achuete": "graines de rocou (achuete)",
  "paminta": "grains de poivre noir (paminta)",
  "mantika": "huile de cuisson",
  "dahon ng laurel": "feuilles de laurier (dahon ng laurel)",
  "chicharon": "grattons de porc soufflés (chicharon)",
  "sinigang mix": "mélange pour soupe sinigang au tamarin",
  "sinigang sa sampaloc mix": "mélange pour soupe sinigang au tamarin",
  "sampaloc": "tamarin",
  "sampalok": "tamarin",
};

// Build reverse dictionary: French -> English
export const FR_TO_EN_DICTIONARY = {};
for (const [enKey, frVal] of Object.entries(EN_TO_FR_DICTIONARY)) {
  FR_TO_EN_DICTIONARY[frVal.toLowerCase()] = enKey;
}

// Additional specific French synonyms and regional variations
const EXTRA_FR_TO_EN = {
  "et": "and",
  "avec": "with",
  "ou": "or",
  "pour": "for",
  "au goût": "to taste",
  "au gout": "to taste",
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
    "préparé", "canadien", "canadienne", "québécois", "garde-manger", "repas", "recette", "courge", "potage", "velouté", "soupe-repas"
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

  const safePhraseReplace = (text, dictionary) => {
    const sortedEntries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
    const replacements = [];
    let tokenized = text;
    for (const [k, v] of sortedEntries) {
      if (k.length < 2) continue;
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      if (regex.test(tokenized)) {
        tokenized = tokenized.replace(regex, () => {
          const tok = `__TK${replacements.length}__`;
          replacements.push(v);
          return tok;
        });
      }
    }
    for (let i = 0; i < replacements.length; i++) {
      tokenized = tokenized.replace(new RegExp(`__TK${i}__`, "g"), replacements[i]);
    }
    return tokenized;
  };

  if (target === "FR") {
    // Translating to French
    if (EN_TO_FR_DICTIONARY[lookupKey]) {
      translatedCore = EN_TO_FR_DICTIONARY[lookupKey];
    } else {
      const replaced = safePhraseReplace(lookupKey, EN_TO_FR_DICTIONARY);
      if (replaced !== lookupKey) {
        translatedCore = replaced;
      }
    }
  } else {
    // Translating to English
    if (FR_TO_EN_DICTIONARY[lookupKey]) {
      translatedCore = FR_TO_EN_DICTIONARY[lookupKey];
    } else {
      const replaced = safePhraseReplace(lookupKey, FR_TO_EN_DICTIONARY);
      if (replaced !== lookupKey) {
        translatedCore = replaced;
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

// Tagalog culinary signals for source detection
export const TAGALOG_SIGNALS = [
  "sinigang", "adobo", "adobong", "tinola", "tinolang", "kare-kare", "karekare", "pancit",
  "bihon", "canton", "sotanghon", "palabok", "lumpia", "lumpiang", "sisig", "lechon", "menudo",
  "afritada", "caldereta", "kaldereta", "bulalo", "bicol express", "dinuguan",
  "pinakbet", "pakbet", "ginataan", "laing", "arroz caldo", "goto", "pares",
  "tapsilog", "longsilog", "tocino", "longganisa", "patis", "toyo", "suka",
  "bagoong", "alamang", "gabi", "sitaw", "talong", "kangkong", "malunggay",
  "sayote", "ampalaya", "calamansi", "kalamansi", "siling", "liempo", "kasim",
  "baboy", "manok", "baka", "isda", "hipon", "pusit", "daing", "tuyo", "tinapa",
  "halo-halo", "leche flan", "bibingka", "puto", "kakanin", "turon", "ube", "tanglad",
  "miki", "miswa", "chicharon", "atsuete", "achuete", "paminta", "mantika"
];

/**
 * Checks whether text appears to be Tagalog / Filipino culinary terminology
 */
export function isTextTagalog(text) {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();
  return TAGALOG_SIGNALS.some((w) => new RegExp(`\\b${w.replace("-", "[- ]")}\\b`, "i").test(lower));
}

/**
 * Translates Tagalog text into English using dictionary and pattern replacements
 */
/**
 * Cleans duplicated nested notes or duplicated parenthesis phrases (e.g. "(tamarind soup) (tamarind soup)")
 */
export function cleanDuplicatedNotes(text) {
  if (!text || typeof text !== "string") return "";
  let res = text
    .replace(/\s*Recipe$/i, "")
    .replace(/\s*Recette$/i, "")
    .replace(/\(([^)]+)\)\s*\(\1\)/gi, "($1)")
    .replace(/\(([^)]+)\)\s*\((?:[^)]+)?\1(?:[^)]+)?\)/gi, "($1)")
    .replace(/(\b\w+\b)(?:\s+\1)+/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return res;
}

/**
 * Translates Tagalog text into English using dictionary and pattern replacements
 */
export function translateTagalogToEnglish(text) {
  if (!text || typeof text !== "string") return "";
  const key = cleanKey(text);
  if (TAGALOG_TO_EN_DICTIONARY[key]) return TAGALOG_TO_EN_DICTIONARY[key];
  const sorted = Object.entries(TAGALOG_TO_EN_DICTIONARY).sort((a, b) => b[0].length - a[0].length);
  let res = text;
  for (const [k, v] of sorted) {
    if (k.length < 3) continue;
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    res = res.replace(new RegExp(`\\b${escaped}\\b`, "gi"), v);
  }
  res = cleanDuplicatedNotes(res);
  return res.charAt(0).toUpperCase() + res.slice(1);
}

/**
 * Translates Tagalog text into French using dictionary and pattern replacements
 */
export function translateTagalogToFrench(text) {
  if (!text || typeof text !== "string") return "";
  const key = cleanKey(text);
  if (TAGALOG_TO_FR_DICTIONARY[key]) return TAGALOG_TO_FR_DICTIONARY[key];
  const sorted = Object.entries(TAGALOG_TO_FR_DICTIONARY).sort((a, b) => b[0].length - a[0].length);
  let res = text;
  for (const [k, v] of sorted) {
    if (k.length < 3) continue;
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    res = res.replace(new RegExp(`\\b${escaped}\\b`, "gi"), v);
  }
  res = cleanDuplicatedNotes(res);
  return res.charAt(0).toUpperCase() + res.slice(1);
}

/**
 * Translates cooking instructions step text into French
 */
export function translateCookingStepToFrench(step) {
  if (!step || typeof step !== "string") return "";
  let text = step;

  const phraseReplacements = [
    [/pour water into a cooking pot/gi, "verser l'eau dans une marmite"],
    [/pour water into the pot/gi, "verser l'eau dans la marmite"],
    [/pour water into a pot/gi, "verser l'eau dans une casserole"],
    [/pour water/gi, "verser l'eau"],
    [/heat oil in a cooking pot/gi, "faire chauffer l'huile dans une marmite"],
    [/heat oil in a large skillet/gi, "faire chauffer l'huile dans une grande poêle"],
    [/heat oil in a skillet/gi, "faire chauffer l'huile dans une poêle"],
    [/heat oil in a pan/gi, "faire chauffer l'huile dans une poêle"],
    [/heat olive oil/gi, "faire chauffer l'huile d'olive"],
    [/heat vegetable oil/gi, "faire chauffer l'huile végétale"],
    [/heat cooking oil/gi, "faire chauffer l'huile de cuisson"],
    [/heat oil/gi, "faire chauffer l'huile"],
    [/saute onion until layers separate/gi, "faire revenir l'oignon jusqu'à ce qu'il devienne translucide"],
    [/saute onion and garlic/gi, "faire revenir l'oignon et l'ail"],
    [/saute garlic and onion/gi, "faire revenir l'ail et l'oignon"],
    [/saute garlic until fragrant/gi, "faire revenir l'ail jusqu'à ce que les arômes se dégagent"],
    [/continue sauteeing until/gi, "continuer à faire revenir jusqu'à ce que"],
    [/until the pork browns/gi, "la viande de porc soit bien dorée"],
    [/while adding around/gi, "tout en ajoutant environ"],
    [/while adding/gi, "tout en ajoutant"],
    [/bring to a gentle boil/gi, "amener à faible ébullition"],
    [/bring to a simmer/gi, "amener à frémissement"],
    [/bring to a boil/gi, "porter à ébullition"],
    [/cut squash in half/gi, "couper la courge en deux"],
    [/remove(?: the)? seeds/gi, "retirer les graines"],
    [/bake in (?:the )?oven/gi, "faire cuire au four"],
    [/preheat oven to/gi, "préchauffer le four à"],
    [/cut in half/gi, "couper en deux"],
    [/dice/gi, "couper en dés"],
    [/spaghetti squash/gi, "courge spaghetti"],
    [/in a cooking pot/gi, "dans une marmite"],
    [/in a large pot/gi, "dans une grande casserole"],
    [/in a large bowl/gi, "dans un grand bol"],
    [/in a medium bowl/gi, "dans un bol moyen"],
    [/in a small bowl/gi, "dans un petit bol"],
    [/in a large skillet/gi, "dans une grande poêle"],
    [/in a heavy skillet/gi, "dans une poêle épaisse"],
    [/in a baking dish/gi, "dans un plat de cuisson"],
    [/over medium-high heat/gi, "à feu moyen-vif"],
    [/over medium heat/gi, "à feu moyen"],
    [/over low heat/gi, "à feu doux"],
    [/over high heat/gi, "à feu vif"],
    [/boil for (\d+(?:-\d+)?)\s*minutes?/gi, "faire bouillir pendant $1 minutes"],
    [/boil for (\d+(?:-\d+)?)\s*hours?/gi, "faire bouillir pendant $1 heures"],
    [/cook for (\d+(?:-\d+)?)\s*minutes?/gi, "cuire pendant $1 minutes"],
    [/cook for (\d+(?:-\d+)?)\s*hours?/gi, "cuire pendant $1 heures"],
    [/simmer for (\d+(?:-\d+)?)\s*minutes?/gi, "laisser mijoter pendant $1 minutes"],
    [/simmer for (\d+(?:-\d+)?)\s*hours?/gi, "laisser mijoter pendant $1 heures"],
    [/bake for (\d+(?:-\d+)?)\s*minutes?/gi, "cuire au four pendant $1 minutes"],
    [/roast for (\d+(?:-\d+)?)\s*minutes?/gi, "rôtir pendant $1 minutes"],
    [/let sit for (\d+(?:-\d+)?)\s*minutes?/gi, "laisser reposer pendant $1 minutes"],
    [/stir occasionally/gi, "remuer de temps en temps"],
    [/stir constantly/gi, "remuer constamment"],
    [/stir well/gi, "bien mélanger"],
    [/mix well/gi, "bien mélanger"],
    [/whisk together/gi, "fouetter ensemble"],
    [/whisk until smooth/gi, "fouetter jusqu'à consistance lisse"],
    [/until tender/gi, "jusqu'à tendreté"],
    [/until golden brown/gi, "jusqu'à coloration dorée"],
    [/until cooked through/gi, "jusqu'à cuisson complète"],
    [/until fragrant/gi, "jusqu'à ce que les arômes se dégagent"],
    [/season with salt and pepper/gi, "assaisonner de sel et de poivre"],
    [/season with/gi, "assaisonner avec"],
    [/to taste/gi, "au goût"],
    [/turn off the heat/gi, "éteindre le feu"],
    [/turn off heat/gi, "éteindre le feu"],
    [/remove from heat/gi, "retirer du feu"],
    [/serve hot with warm white rice/gi, "servir chaud avec du riz blanc tiède"],
    [/serve hot with steamed rice/gi, "servir chaud avec du riz vapeur"],
    [/serve hot with rice/gi, "servir chaud avec du riz"],
    [/serve hot/gi, "servir chaud"],
    [/serve warm/gi, "servir tiède"],
    [/serve immediately/gi, "servir immédiatement"],
    [/on the side/gi, "en accompagnement"],
    [/preheat oven to/gi, "préchauffer le four à"],
    [/line a (?:baking|sheet) pan with parchment paper/gi, "tapisser une plaque de cuisson de papier parchemin"],
    [/cover with a lid/gi, "couvrir avec un couvercle"],
    [/cover with lid/gi, "couvrir avec un couvercle"],
    [/cover the pot/gi, "couvrir la marmite"],
    [/cover and simmer for (\d+(?:-\d+)?)\s*minutes?/gi, "couvrir et laisser mijoter pendant $1 minutes"],
    [/cover and cook for (\d+(?:-\d+)?)\s*minutes?/gi, "couvrir et cuire pendant $1 minutes"],
    [/cover and/gi, "couvrir et"],
    [/add onion and tomatoes/gi, "ajouter l'oignon et les tomates"],
    [/add half of the tomato/gi, "ajouter la moitié de la tomate"],
    [/add pork belly/gi, "ajouter la poitrine de porc"],
    [/add chicken/gi, "ajouter le poulet"],
    [/add beef/gi, "ajouter le bœuf"],
    [/add fish sauce/gi, "ajouter la sauce de poisson"],
    [/add sinigang mix/gi, "ajouter le mélange pour sinigang"],
    [/add tamarind soup mix and taro/gi, "ajouter le mélange pour soupe au tamarin et le taro"],
    [/add tamarind soup mix/gi, "ajouter le mélange pour soupe au tamarin"],
    [/add eggplant and string beans/gi, "ajouter l'aubergine et les haricots longs"],
    [/add string beans, eggplant/gi, "ajouter les haricots longs, l'aubergine"],
    [/add string beans/gi, "ajouter les haricots longs"],
    [/add eggplant/gi, "ajouter l'aubergine"],
    [/add spinach/gi, "ajouter les épinards"],
    [/add water spinach/gi, "ajouter les épinards d'eau"],
    [/add garlic/gi, "ajouter l'ail"],
    [/add onion/gi, "ajouter l'oignon"],
    [/add tomatoes/gi, "ajouter les tomates"],
    [/add tomato/gi, "ajouter la tomate"],
    [/cut into cubes/gi, "couper en cubes"],
    [/cut into pieces/gi, "couper en morceaux"],
    [/cut into bite-sized pieces/gi, "couper en morceaux de la taille d'une bouchée"],
    [/slice thinly/gi, "émincer finement"],
    [/finely chop/gi, "hacher finement"],
    // Tagalog instructions verbs & terms
    [/pakuluan ang tubig/gi, "faire bouillir l'eau"],
    [/pakuluan/gi, "faire bouillir"],
    [/igisa ang sibuyas at kamatis/gi, "faire revenir l'oignon et les tomates"],
    [/igisa ang bawang at sibuyas/gi, "faire revenir l'ail et l'oignon"],
    [/igisa ang/gi, "faire revenir"],
    [/igisa/gi, "faire revenir"],
    [/ilagay ang karne/gi, "ajouter la viande"],
    [/ilagay ang baboy/gi, "ajouter le porc"],
    [/ilagay ang manok/gi, "ajouter le poulet"],
    [/ilagay ang/gi, "ajouter"],
    [/ihalo ang/gi, "incorporer"],
    [/ihalo/gi, "bien mélanger"],
    [/isalin sa/gi, "transférer dans"],
    [/takpan ang kaldero/gi, "couvrir la marmite"],
    [/takpan/gi, "couvrir"],
    [/lutuin hanggang lumambot/gi, "cuire jusqu'à tendreté"],
    [/lutuin/gi, "cuire"],
    [/hanguin sa apoy/gi, "retirer du feu"],
    [/hanguin/gi, "retirer du feu"],
    [/patayin ang apoy/gi, "éteindre le feu"],
    [/ihain habang mainit/gi, "servir bien chaud"],
    [/ihain/gi, "servir"],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    text = text.replace(pattern, replacement);
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Translates French or Tagalog cooking steps into English
 */
export function translateCookingStepToEnglish(step) {
  if (!step || typeof step !== "string") return "";
  let text = step;

  const phraseReplacements = [
    [/dans une casserole à feu moyen-élevé/gi, "in a saucepan over medium-high heat"],
    [/dans une casserole à feu moyen/gi, "in a saucepan over medium heat"],
    [/dans une petite casserole/gi, "in a small saucepan"],
    [/sur une planche en bois carrée/gi, "on a square wooden board"],
    [/sur une planche en bois/gi, "on a wooden board"],
    [/sur une autre planche/gi, "on another board"],
    [/sur une planche/gi, "on a board"],
    [/étaler le fromage à la crème/gi, "spread the cream cheese"],
    [/en créant des sillons/gi, "creating decorative waves with a spoon"],
    [/y répartir le mélange d['’]oignons/gi, "top with the onion mixture"],
    [/y répartir la compote de canneberges/gi, "top with the cranberry compote"],
    [/y répartir/gi, "top with"],
    [/garnir du bacon et de feuilles de thym/gi, "garnish with bacon and thyme leaves"],
    [/garnir de la poire, des pistaches et des herbes/gi, "garnish with pear, pistachios and herbs"],
    [/garnir de/gi, "garnish with"],
    [/ajouter le miel en filet/gi, "drizzle with honey"],
    [/ajouter le sirop d['’]érable et la sauce worcestershire/gi, "add maple syrup and Worcestershire sauce"],
    [/saler légèrement/gi, "season lightly with salt"],
    [/déglacer avec le vinaigre/gi, "deglaze with vinegar"],
    [/laisser réduire presque à sec/gi, "let reduce until almost dry"],
    [/laisser tiédir/gi, "let cool slightly"],
    [/laisser refroidir/gi, "let cool"],
    [/transvider dans un bol et laisser tiédir/gi, "transfer to a bowl and let cool"],
    [/transvider dans un bol/gi, "transfer to a bowl"],
    [/à quelques reprises/gi, "a few times"],
    [/en remuant à quelques reprises/gi, "stirring occasionally"],
    [/à l['’]aide d['’]une fourchette/gi, "using a fork"],
    [/écraser les canneberges/gi, "mash the cranberries"],
    [/soient compotées/gi, "have burst and softened"],
    [/soient bien dorés/gi, "are nicely browned"],
    [/le liquide soit sirupeux/gi, "the liquid is thick and syrupy"],
    [/servir les planches de fromage à la crème avec des croûtons ou des craquelins/gi, "serve the cream cheese boards with croutons or crackers"],
    [/avec des croûtons ou des craquelins/gi, "with croutons or crackers"],
    [/cuire les oignons avec la branche de thym dans l['’]huile/gi, "cook onions with thyme sprig in oil"],
    [/porter à ébullition les canneberges, le sucre et l['’]eau/gi, "bring cranberries, sugar and water to a boil"],
    [/laisser mijoter à feu moyen/gi, "simmer over medium heat"],
    [/retirer la casserole du feu/gi, "remove the saucepan from the heat"],
    [/poivrer généreusement/gi, "season generously with pepper"],
    [/porter à ébullition/gi, "bring to a boil"],
    [/couper\\s+(?:la\\s+)?courge en deux/gi, "cut squash in half"],
    [/préchauffer le four à\\s*(\\d+)\\s*°c\\s*\\(([^)]+)\\)/gi, "preheat oven to $2 ($1°C)"],
    [/prechauffer le four a\\s*(\\d+)\\s*°c\\s*\\(([^)]+)\\)/gi, "preheat oven to $2 ($1°C)"],
    [/couper la courge spaghetti en deux sur la longueur/gi, "cut spaghetti squash in half lengthwise"],
    [/couper la courge en deux sur la longueur/gi, "cut squash in half lengthwise"],
    [/retirer les graines avec une cuillère/gi, "remove seeds with a spoon"],
    [/retirer les graines/gi, "remove the seeds"],
    [/côté coupé vers le bas/gi, "cut-side down"],
    [/cote coupe vers le bas/gi, "cut-side down"],
    [/côté coupé vers le haut/gi, "cut-side up"],
    [/cote coupe vers le haut/gi, "cut-side up"],
    [/sur une plaque de cuisson tapissée de papier parchemin/gi, "on a baking sheet lined with parchment paper"],
    [/sur une plaque de cuisson/gi, "on a baking sheet"],
    [/à l\\x27aide d\\x27une fourchette/gi, "using a fork"],
    [/a l\\x27aide d\\x27une fourchette/gi, "using a fork"],
    [/effilocher la chair/gi, "scrape the flesh into strands"],
    [/pour former des filaments de spaghetti/gi, "to separate into spaghetti strands"],
    [/les filaments de courge spaghetti/gi, "the spaghetti squash strands"],
    [/les filaments de courge/gi, "the squash strands"],
    [/filaments de courge/gi, "squash strands"],
    [/déposer la courge/gi, "place squash"],
    [/deposer la courge/gi, "place squash"],
    [/dans une grande casserole à feu moyen/gi, "in a large pot over medium heat"],
    [/dans une grande casserole a feu moyen/gi, "in a large pot over medium heat"],
    [/dans une grande poêle à feu moyen/gi, "in a large skillet over medium heat"],
    [/dans une grande poele a feu moyen/gi, "in a large skillet over medium heat"],
    [/à feu moyen-vif/gi, "over medium-high heat"],
    [/a feu moyen-vif/gi, "over medium-high heat"],
    [/à feu moyen-doux/gi, "over medium-low heat"],
    [/a feu moyen-doux/gi, "over medium-low heat"],
    [/à feu moyen/gi, "over medium heat"],
    [/a feu moyen/gi, "over medium heat"],
    [/à feu doux/gi, "over low heat"],
    [/a feu doux/gi, "over low heat"],
    [/à feu vif/gi, "over high heat"],
    [/a feu vif/gi, "over high heat"],
    [/chauffer l\\x27huile d\\x27olive/gi, "heat olive oil"],
    [/chauffer l\\x27huile/gi, "heat oil"],
    [/faire suer l\\x27oignon,\\s*les carottes et le céleri/gi, "sauté onion, carrots, and celery"],
    [/faire suer/gi, "sauté"],
    [/cuire au four de\\s*(\\d+)\\s*à\\s*(\\d+)\\s*minutes/gi, "bake for $1 to $2 minutes"],
    [/de\\s*(\\d+)\\s*à\\s*(\\d+)\\s*minutes/gi, "for $1 to $2 minutes"],
    [/jusqu\\x27à ce que la chair soit tendre/gi, "until tender"],
    [/jusqu\\x27a ce que la chair soit tendre/gi, "until tender"],
    [/jusqu\\x27à ce qu\\x27il soit parfumé/gi, "until fragrant"],
    [/jusqu\\x27a ce qu\\x27il soit parfume/gi, "until fragrant"],
    [/1 minute de plus/gi, "1 more minute"],
    [/pendant environ\\s*(\\d+)\\s*à\\s*(\\d+)\\s*minutes/gi, "for about $1 to $2 minutes"],
    [/environ\\s*(\\d+)\\s*à\\s*(\\d+)\\s*minutes/gi, "about $1 to $2 minutes"],
    [/ajouter l\\x27ail/gi, "add garlic"],
    [/ajouter les haricots blancs/gi, "add white beans"],
    [/rincés et égouttés/gi, "rinsed and drained"],
    [/rinces et egouttes/gi, "rinsed and drained"],
    [/égouttés et rincés/gi, "drained and rinsed"],
    [/egouttes et rinces/gi, "drained and rinsed"],
    [/verser le bouillon de poulet/gi, "pour chicken broth"],
    [/verser le bouillon/gi, "pour broth"],
    [/réduire le feu et laisser mijoter/gi, "reduce heat and simmer"],
    [/reduire le feu et laisser mijoter/gi, "reduce heat and simmer"],
    [/incorporer les filaments de courge spaghetti dans la soupe/gi, "stir spaghetti squash strands into the soup"],
    [/incorporer les filaments/gi, "stir in the strands"],
    [/dans la soupe/gi, "into the soup"],
    [/saler et poivrer au goût/gi, "season with salt and pepper to taste"],
    [/saler et poivrer au gout/gi, "season with salt and pepper to taste"],
    [/saler et poivrer/gi, "season with salt and pepper"],
    [/garnir de parmesan râpé et de persil frais haché/gi, "garnish with grated Parmesan and chopped fresh parsley"],
    [/garnir de parmesan râpé/gi, "garnish with grated Parmesan"],
    [/de persil frais haché/gi, "with chopped fresh parsley"],
    [/servir bien chaud/gi, "serve piping hot"],
    [/servir immédiatement/gi, "serve immediately"],
    [/pendant\\s*(\\d+)\\s*minutes/gi, "for $1 minutes"],
    [/chauffer l\\x27huile d\\x27olive/gi, "heat olive oil"],
    [/chauffer l\\x27huile/gi, "heat oil"],
    [/\\bchauffer\\b/gi, "heat"],
    [/incorporer/gi, "stir in"],
    [/de\\s*(\\d+)\\s*à\\s*(\\d+)\\s*minutes/gi, "for $1 to $2 minutes"],
    [/ou jusqu\\x27à ce que la chair soit tendre/gi, "or until tender"],
    [/jusqu\\x27à ce que la chair soit tendre/gi, "until tender"],
    [/l\\x27huile d\\x27olive/gi, "olive oil"],
    [/\\bet\\b/gi, "and"],
    [/\\bou\\b/gi, "or"],
    [/retirer les graines/gi, "remove the seeds"],
    [/faire cuire au four/gi, "bake in the oven"],
    [/cuire au four/gi, "bake in the oven"],
    [/préchauffer le four à/gi, "preheat oven to"],
    [/prechauffer le four a/gi, "preheat oven to"],
    [/couper en deux/gi, "cut in half"],
    [/couper en dés/gi, "dice"],
    [/couper en des/gi, "dice"],
    [/couper en morceaux/gi, "cut into pieces"],
    [/émincer/gi, "thinly slice"],
    [/emincer/gi, "thinly slice"],
    [/hacher finement/gi, "finely chop"],
    [/hacher/gi, "chop"],
    [/porter le bouillon à ébullition/gi, "bring broth to a boil"],
    [/égoutter/gi, "drain"],
    [/egoutter/gi, "drain"],
    [/rincer/gi, "rinse"],
    [/garnir de/gi, "garnish with"],
    [/courge spaghetti/gi, "spaghetti squash"],
    [/courge/gi, "squash"],
    [/porter à faible ébullition/gi, "bring to a gentle boil"],
    [/amener à frémissement/gi, "bring to a simmer"],
    [/faire bouillir pendant (\d+(?:-\d+)?)\s*minutes?/gi, "boil for $1 minutes"],
    [/cuire pendant (\d+(?:-\d+)?)\s*minutes?/gi, "cook for $1 minutes"],
    [/cuire au four pendant (\d+(?:-\d+)?)\s*minutes?/gi, "bake for $1 minutes"],
    [/laisser mijoter pendant (\d+(?:-\d+)?)\s*minutes?/gi, "simmer for $1 minutes"],
    [/laisser reposer pendant (\d+(?:-\d+)?)\s*minutes?/gi, "let sit for $1 minutes"],
    [/dans une grande casserole/gi, "in a large pot"],
    [/dans une casserole/gi, "in a pot"],
    [/dans une marmite/gi, "in a cooking pot"],
    [/dans une grande poêle/gi, "in a large skillet"],
    [/dans une poêle/gi, "in a skillet"],
    [/faire chauffer l'huile/gi, "heat oil"],
    [/faire chauffer/gi, "heat"],
    [/faire revenir/gi, "sauté"],
    [/faire sauter/gi, "sauté"],
    [/faire dorer/gi, "brown"],
    [/bien mélanger/gi, "mix well"],
    [/remuer constamment/gi, "stir constantly"],
    [/remuer de temps en temps/gi, "stir occasionally"],
    [/assaisonner de sel et de poivre/gi, "season with salt and pepper"],
    [/assaisonner avec/gi, "season with"],
    [/au goût/gi, "to taste"],
    [/au gout/gi, "to taste"],
    [/jusqu'à tendreté/gi, "until tender"],
    [/jusqu'à ce que ce soit doré/gi, "until golden brown"],
    [/jusqu'à cuisson complète/gi, "until cooked through"],
    [/ajouter l'ail/gi, "add garlic"],
    [/ajouter l'oignon/gi, "add onion"],
    [/ajouter la viande/gi, "add meat"],
    [/ajouter le poulet/gi, "add chicken"],
    [/ajouter le porc/gi, "add pork"],
    [/ajouter le bœuf/gi, "add beef"],
    [/ajouter/gi, "add"],
    [/verser l'eau/gi, "pour water"],
    [/verser/gi, "pour"],
    [/couvrir avec un couvercle/gi, "cover with a lid"],
    [/couvrir la marmite/gi, "cover the pot"],
    [/couvrir la casserole/gi, "cover the pot"],
    [/couvrir et laisser mijoter/gi, "cover and simmer"],
    [/couvrir et/gi, "cover and"],
    [/couvrir/gi, "cover"],
    [/retirer du feu/gi, "remove from heat"],
    [/éteindre le feu/gi, "turn off the heat"],
    [/servir chaud avec du riz/gi, "serve hot with rice"],
    [/servir chaud/gi, "serve hot"],
    [/servir tiède/gi, "serve warm"],
    [/servir immédiatement/gi, "serve immediately"],
    [/servir/gi, "serve"],
    // Tagalog to English step commands
    [/pakuluan ang tubig/gi, "boil water"],
    [/pakuluan/gi, "boil"],
    [/igisa ang sibuyas at kamatis/gi, "sauté onion and tomatoes"],
    [/igisa ang bawang at sibuyas/gi, "sauté garlic and onion"],
    [/igisa ang/gi, "sauté"],
    [/igisa/gi, "sauté"],
    [/ilagay ang karne/gi, "add meat"],
    [/ilagay ang baboy/gi, "add pork"],
    [/ilagay ang manok/gi, "add chicken"],
    [/ilagay ang/gi, "add"],
    [/ihalo ang/gi, "mix in"],
    [/ihalo/gi, "mix well"],
    [/isalin sa/gi, "transfer to"],
    [/takpan ang kaldero/gi, "cover the pot"],
    [/takpan/gi, "cover"],
    [/lutuin hanggang lumambot/gi, "cook until tender"],
    [/lutuin/gi, "cook"],
    [/hanguin sa apoy/gi, "remove from heat"],
    [/hanguin/gi, "remove from heat"],
    [/patayin ang apoy/gi, "turn off heat"],
    [/ihain habang mainit/gi, "serve while hot"],
    [/ihain/gi, "serve"],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    text = text.replace(pattern, replacement);
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Returns structured bilingual names `{ name, nameFr, nameEn }` for any imported item or recipe.
 *
 * EXACT SPECIFIED LOGIC:
 * 1. If it's French: translate to English ONLY for the English app version (preserve French for French app version).
 * 2. If it's English: translate to French for the French app version (preserve English for English app version).
 * 3. If it's Tagalog: translate to BOTH English and French!
 *
 * @param {string} rawName - Raw product, ingredient or recipe name
 * @param {'FR'|'EN'} preferredLang - User's active language
 * @returns {{ name: string, nameFr: string, nameEn: string }}
 */
export function getBilingualNames(rawName, preferredLang = "FR") {
  if (!rawName || typeof rawName !== "string") {
    return { name: "", nameFr: "", nameEn: "" };
  }

  const trimmed = rawName.trim();
  const isFrApp = preferredLang.toUpperCase().startsWith("FR");

  // 1. Tagalog check: If it's Tagalog, translate to BOTH English and French
  if (isTextTagalog(trimmed)) {
    let nameEn = translateTagalogToEnglish(trimmed) || trimmed;
    nameEn = cleanDuplicatedNotes(nameEn);
    let nameFr = translateTagalogToFrench(trimmed) || translateFoodItem(nameEn, "FR") || trimmed;
    nameFr = cleanDuplicatedNotes(nameFr);
    const activeName = isFrApp ? nameFr : nameEn;
    return {
      name: activeName,
      nameFr,
      nameEn,
    };
  }

  // 2. French check: If it's French, preserve French and translate to English only for English app version
  if (isTextFrench(trimmed)) {
    const nameFr = trimmed;
    let nameEn = translateRecipeTitleToEnglish(trimmed) || translateFoodItem(trimmed, "EN") || trimmed;
    nameEn = cleanDuplicatedNotes(nameEn);
    const activeName = isFrApp ? nameFr : nameEn;
    return {
      name: activeName,
      nameFr,
      nameEn,
    };
  }

  // 3. English check: If it's English, preserve English and translate to French for French app version
  const nameEn = trimmed;
  let nameFr = translateRecipeTitleToFrench(trimmed) || translateFoodItem(trimmed, "FR") || trimmed;
  nameFr = cleanDuplicatedNotes(nameFr);
  const activeName = isFrApp ? nameFr : nameEn;

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

/**
 * Automatically classifies kitchen storage location and pantry zone for any ingredient.
 * Returns { storage: 'fridge'|'freezer'|'pantry'|'spices', locationType: 'FRIDGE'|'FREEZER'|'PANTRY'|'SPICE_RACK', category }
 */
export function detectIngredientStorage(name = "", category = "") {
  const lower = (name || "").toLowerCase();
  const cat = (category || "").toLowerCase();

  // 1. Spices, dried herbs & ground seasonings -> SPICE_RACK
  if (
    /(sel\b|salt\b|poivre\b|pepper\b|paprika|curry|cumin|origan|oregano|thym\b|thyme\b|cannelle|cinnamon|muscade|nutmeg|piment\b|chili flake|laurier|bay leaf|dahon ng laurel|paminta|clove\b|cloves\b|coriandre|coriander|fennel|fenouil|cardamom|turmeric|curcuma|épice|spices|seasoning|bouillon cube)/.test(
      lower
    )
  ) {
    return { storage: "spices", locationType: "SPICE_RACK", category: "Spices & Seasonings" };
  }

  // 2. Frozen products -> FREEZER
  if (
    /(surgel|congel|frozen|glace\b|ice cream|crème glacée|sorbet|frites surgel)/.test(lower) ||
    cat.includes("frozen")
  ) {
    return { storage: "freezer", locationType: "FREEZER", category: "Frozen Foods" };
  }

  // 3. Condiments, Sauces, Oils, Broths, Asian & Filipino Staples -> PANTRY
  if (
    /(patis|fish sauce|sauce de poisson|toyo|soy sauce|sauce soja|suka|vinegar|vinaigre|huile|oil\b|mantika|sinigang mix|bouillon|broth|fond\b|farine|flour|sucre|sugar|riz\b|rice\b|pâtes\b|pasta|nouille|noodles|bihon|canton|sotanghon|miswa|conserve|canned|boîte|gata|coconut milk|lait de coco|sauce tomate|tomato paste|ketchup|mustard|moutarde|mayo|mayonnaise|bagoong|shrimp paste|tamarind|tamarin|lumpia wrapper)/.test(
      lower
    ) ||
    cat.includes("condiment")
  ) {
    return { storage: "pantry", locationType: "PANTRY", category: "Pantry Staples" };
  }

  // 4. Fresh Meats, Poultry, Seafood -> FRIDGE
  if (
    /(porc|pork|poulet|chicken|boeuf|bœuf|beef|veau|veal|agneau|lamb|saumon|salmon|morue|cod|thon|tuna|poisson|fish\b|crevette|shrimp|prawn|bacon|saucisse|sausage|liempo|kasim|pata\b|ribs\b|côtes\b|steak|meat|viande|dinde|turkey|canard|duck)/.test(
      lower
    ) ||
    cat.includes("meat") ||
    cat.includes("seafood") ||
    cat.includes("poultry")
  ) {
    return { storage: "fridge", locationType: "FRIDGE", category: "Meat & Seafood" };
  }

  // 5. Dairy & Fresh Eggs -> FRIDGE
  if (
    /(lait\b|milk\b|beurre|butter|fromage|cheese|oeuf|œuf|egg\b|eggs\b|yogourt|yogurt|crème|cream\b|sour cream|crème sure|feta|cheddar|mozzarella|parmesan|ricotta)/.test(
      lower
    ) ||
    cat.includes("dairy")
  ) {
    return { storage: "fridge", locationType: "FRIDGE", category: "Dairy & Eggs" };
  }

  // 6. Perishable Fresh Produce (Greens, Vegetables, Fresh Berries) -> FRIDGE
  if (
    /(kangkong|spinach|épinard|laitue|lettuce|roquette|arugula|salade|salad|chou\b|cabbage|bok choy|pechay|broccoli|brocoli|cauliflower|chou-fleur|fraise|strawberry|framboise|raspberry|bleuet|blueberry|raisin|grape|carotte|carrot|céleri|celery|concombre|cucumber|poivron|bell pepper|champignon|mushroom|tomate|tomato|haricot vert|green bean|string bean|sitaw|talong|aubergine|eggplant|okra\b|gombos|courgette|zucchini|asperge|asparagus|herbe\b|persil|parsley|coriandre|cilantro|basilic|basil|sayote|chayote|ampalaya|bitter melon|malunggay|radis|radish|labanos)/.test(
      lower
    )
  ) {
    return { storage: "fridge", locationType: "FRIDGE", category: "Produce" };
  }

  // 7. Ambient pantry produce (Potatoes, Onions, Garlic, Ginger, Citrus, Apples, Bananas) -> PANTRY
  if (
    /(oignon|onion|sibuyas|ail\b|garlic|bawang|pomme de terre|potato|patate|sweet potato|kamote|taro|gabi|gingembre|ginger|luya|pomme\b|apple\b|banane|banana|citron|lemon|lime|calamansi|orange\b|avocat|avocado)/.test(
      lower
    )
  ) {
    return { storage: "pantry", locationType: "PANTRY", category: "Produce" };
  }

  // 8. Bakery products -> PANTRY
  if (
    /(pain\b|bread\b|baguette|tortilla|brioche|croissant|pita\b|bun\b|rolls\b)/.test(lower) ||
    cat.includes("bakery")
  ) {
    return { storage: "pantry", locationType: "PANTRY", category: "Bakery" };
  }

  // Default fallback
  return { storage: "pantry", locationType: "PANTRY", category: "Pantry Staples" };
}

/**
 * Parses any raw ingredient string (e.g., from Schema.org JSON-LD or website text)
 * into a clean, structured object: { amount, unit, name, nameFr, category, locationType, storage, prepNotes }
 */
export function parseIngredientString(rawInput = "", preferredLang = "FR") {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      amount: "1",
      unit: "unit",
      name: "",
      nameFr: "",
      category: "Pantry Staples",
      locationType: "PANTRY",
      storage: "pantry",
      prepNotes: "",
    };
  }

  // Normalize Unicode fractions and dashes
  let str = rawInput
    .replace(/½/g, " 1/2")
    .replace(/¼/g, " 1/4")
    .replace(/¾/g, " 3/4")
    .replace(/⅓/g, " 1/3")
    .replace(/⅔/g, " 2/3")
    .replace(/⅛/g, " 1/8")
    .replace(/[–—]/g, "-")
    .trim();

  // Check for to taste / au goût
  if (
    /^(au goût|au gout|to taste|as needed|selon le goût|facultatif|optional)$/i.test(str) ||
    str === "-"
  ) {
    return {
      amount: "",
      unit: "to_taste",
      name: str,
      nameFr: str,
      category: "Spices & Seasonings",
      locationType: "SPICE_RACK",
      storage: "spices",
      prepNotes: "",
    };
  }

  let amount = "1";
  let unit = "unit";
  let remaining = str;

  // Pattern 1: Leading quantity (e.g. "1 1/2", "1/4", "2", "66", "2.5", "2 to 3")
  const leadingQtyRegex =
    /^(\d+\s*[\/\-]\s*\d+|\d+(?:\.\d+)?(?:\s*[\/\-]\s*\d+(?:\.\d+)?)?|\d+)\s*(.*)$/i;
  const qtyMatch = remaining.match(leadingQtyRegex);

  if (qtyMatch) {
    amount = qtyMatch[1].replace(/\s+/g, " ").trim();
    remaining = (qtyMatch[2] || "").trim();
  }

  // Standard Unit normalization regexes
  const unitPatterns = [
    {
      unit: "tbsp",
      regex: /^(tablespoons?|tbsp\.?|c\.?\s*à\s*s(?:oupe)?\.?|càs|cas)\b/i,
    },
    {
      unit: "tsp",
      regex: /^(teaspoons?|tsp\.?|c\.?\s*à\s*t(?:hé)?\.?|càt|cat)\b/i,
    },
    {
      unit: "cup",
      regex: /^(cups?|tasses?)\b/i,
    },
    {
      unit: "g",
      regex: /^(grams?|grammes?|g\.?)\b/i,
    },
    {
      unit: "kg",
      regex: /^(kilograms?|kilogrammes?|kg\.?)\b/i,
    },
    {
      unit: "ml",
      regex: /^(milliliters?|millilitres?|ml\.?)\b/i,
    },
    {
      unit: "l",
      regex: /^(liters?|litres?|l\.?)\b/i,
    },
    {
      unit: "lb",
      regex: /^(pounds?|lbs?\.?|livres?)\b/i,
    },
    {
      unit: "oz",
      regex: /^(ounces?|oz\.?|onces?)\b/i,
    },
    {
      unit: "clove",
      regex: /^(cloves?|gousses?)\b/i,
    },
    {
      unit: "slice",
      regex: /^(slices?|tranches?)\b/i,
    },
    {
      unit: "can",
      regex: /^(cans?|boîtes?|boites?|tins?|conserves?)\b/i,
    },
    {
      unit: "bunch",
      regex: /^(bunch(?:es)?|bottes?|bundles?)\b/i,
    },
    {
      unit: "packet",
      regex: /^(packets?|pouches?|sachets?|paquets?|envelopes?)\b/i,
    },
    {
      unit: "piece",
      regex: /^(pieces?|pièces?|morceaux?|pcs?\.?)\b/i,
    },
    {
      unit: "pinch",
      regex: /^(pinches?|pincées?|pincees?)\b/i,
    },
  ];

  for (const { unit: u, regex } of unitPatterns) {
    if (regex.test(remaining)) {
      unit = u;
      remaining = remaining.replace(regex, "").trim();
      break;
    }
  }

  // Handle parenthetical metric or imperial notes like "(40 g)", "(about 2 1/2 lb / 1.2 kg)", "(45 ml)", "((labanos) sliced)"
  let extractedParens = "";
  const parenMatches = remaining.match(/\(([^)]+)\)/g);
  if (parenMatches) {
    extractedParens = parenMatches.map((p) => p.replace(/[()]/g, "").trim()).join(", ");
    for (const pm of parenMatches) {
      const inner = pm.replace(/[()]/g, "").trim();
      if (unit === "unit" && /^\d+\s*(?:g|ml|kg|oz|lb)$/i.test(inner)) {
        const pQty = inner.match(/^(\d+)\s*(g|ml|kg|oz|lb)$/i);
        if (pQty) {
          amount = pQty[1];
          unit = pQty[2].toLowerCase();
        }
      }
    }
    remaining = remaining.replace(/\([^)]*\)/g, " ").trim();
  }

  // Strip leading punctuation and connectors (e.g. ".", ",", "of", "de", "d'", "d’")
  remaining = remaining.replace(/^[.,;:\s\-()]+/, "").trim();
  remaining = remaining.replace(/^(of\s+|de\s+|d['’]\s*)/i, "").trim();
  // Strip any stray unpaired parentheses
  remaining = remaining.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();

  // Extract trailing preparation notes or taste qualifiers
  let prepNotes = "";
  const prepRegex =
    /(?:,\s*|\s+)(cubed|sliced|minced|chopped|diced|quartered|peeled|wedged|crushed|cut in [^,]+|cut into [^,]+|to taste|au goût|au gout|or to taste|haché(?:e|s|es)?(?:\s+finement)?|coupé(?:e|s|es)? [^,]+|en morceaux|en dés|tranché(?:e|s|es)?|râpé(?:e|s|es)?|finely chopped|freshly ground)\s*$/i;
  const prepMatch = remaining.match(prepRegex);
  if (prepMatch) {
    prepNotes = prepMatch[1].trim();
    remaining = remaining.replace(prepRegex, "").trim();
  }

  // Strip common brand prefixes (Knorr, Dole, Del Monte, Heinz, Mama Sita's)
  remaining = remaining.replace(/^(Knorr|Dole|Del Monte|Heinz|Mama Sita's|Kraft)\s+/i, "").trim();

  // Clean trailing and leading punctuation, stray parentheses, or extra spaces
  remaining = remaining.replace(/^[.,;:\s\-()]+/, "").replace(/[.,;:\s\-()]+$/, "").replace(/\s+/g, " ").trim();

  if (!remaining) {
    remaining = str;
  }

  // Bilingual translation & detection
  const biling = getBilingualNames(remaining, preferredLang);
  const resolvedEn = biling.nameEn || remaining;
  const resolvedFr = biling.nameFr || remaining;

  // Detect storage & category
  const { storage, locationType, category } = detectIngredientStorage(resolvedEn, "");

  return {
    amount,
    unit,
    name: resolvedEn,
    nameFr: resolvedFr,
    category,
    locationType,
    storage,
    prepNotes: prepNotes || extractedParens,
  };
}


/**
 * Translates French or Tagalog recipe titles into English
 */
export function translateRecipeTitleToEnglish(raw) {
  if (!raw || typeof raw !== "string") return "";
  const title = raw.trim();
  const low = title.toLowerCase();

  const EXACT = {
    "soupe-repas à la courge spaghetti": "Spaghetti squash meal soup",
    "soupe repas à la courge spaghetti": "Spaghetti squash meal soup",
    "soupe repas a la courge spaghetti": "Spaghetti squash meal soup",
    "rôti de porc aux pommes et sirop d'érable": "Apple and maple syrup pork roast",
    "roti de porc aux pommes et sirop d'erable": "Apple and maple syrup pork roast",
    "pâté chinois": "Shepherd's pie (Pâté chinois)",
    "pate chinois": "Shepherd's pie (Pâté chinois)",
    "tourtière": "Traditional meat pie (Tourtière)",
    "tourtiere": "Traditional meat pie (Tourtière)",
    "soupe à l'oignon": "French onion soup",
    "soupe a l'oignon": "French onion soup",
    "salade césar": "Caesar salad",
    "salade cesar": "Caesar salad",
    "planches de fromage à la crème fouetté et ses deux garnitures (cream cheese butter boards)": "Whipped cream cheese boards with two toppings (cream cheese butter boards)",
    "planches de fromage à la crème fouetté et ses deux garnitures": "Whipped cream cheese boards with two toppings",
    "planches de fromage a la creme fouette et ses deux garnitures": "Whipped cream cheese boards with two toppings",
    "planches de fromage à la crème": "Whipped cream cheese boards",
    "planche de fromage à la crème": "Whipped cream cheese board"
  };
  if (EXACT[low]) return EXACT[low];

  const DISHES = [
    ["rôti de porc", "pork roast"],
    ["roti de porc", "pork roast"],
    ["rôti de boeuf", "beef roast"],
    ["roti de boeuf", "beef roast"],
    ["mijoté de boeuf", "beef stew"],
    ["mijoté de porc", "pork stew"],
    ["mijoté de poulet", "chicken stew"],
    ["salade de quinoa", "quinoa salad"],
    ["salade de pâtes", "pasta salad"],
    ["poêlée de crevettes", "shrimp skillet"],
    ["poêlée de légumes", "vegetable skillet"],
    ["côtelettes de porc", "pork chops"],
    ["saumon au four", "baked salmon"],
    ["poulet rôti", "roast chicken"],
    ["boulettes de viande", "meatballs"],
    ["soupe-repas", "meal soup"],
    ["soupe repas", "meal soup"],
    ["soupe", "soup"],
    ["potage", "creamy soup"],
    ["velouté", "smooth soup"],
    ["bouillon", "broth"],
    ["salade", "salad"],
    ["ragoût", "stew"],
    ["ragout", "stew"],
    ["mijoté", "slow cooker stew"],
    ["braisé", "braised dish"],
    ["rôti", "roast"],
    ["poêlée", "skillet"],
    ["sauté", "stir-fry"],
    ["gratin", "gratin"],
    ["casserole", "casserole"],
    ["tarte", "pie"],
    ["quiche", "quiche"],
    ["pâtes", "pasta"],
    ["sandwich", "sandwich"]
  ];

  for (const [frDish, enDish] of DISHES) {
    const regex = new RegExp(`^${frDish}\\s+(?:crémeuses?\\s+|glacées?\\s+|farcies?\\s+|au four\\s+)?(?:à la|a la|aux|au|de la|de l\\x27|du|des|de|d\\x27|à|a)\\s+(.+)$`, "i");
    const m = title.match(regex);
    if (m) {
      let rest = m[1].trim().toLowerCase().replace(/^[ld][\x27\x20]/, "");
      let restEn = translateFoodItem(rest, "EN") || rest;
      let adj = "";
      if (/crémeus/i.test(title)) adj = "Creamy ";
      if (/glacé/i.test(title)) adj = "Glazed ";
      if (/farci/i.test(title)) adj = "Stuffed ";
      const combined = adj + restEn + " " + enDish;
      return combined.replace(/\\b\\w/g, (c) => c.toUpperCase());
    }
  }

  const translatedDirect = translateFoodItem(title, "EN");
  if (translatedDirect && translatedDirect.toLowerCase() !== low) {
    return translatedDirect;
  }

  return title;
}

/**
 * Translates English recipe titles into French
 */
export function translateRecipeTitleToFrench(raw) {
  if (!raw || typeof raw !== "string") return "";
  const title = raw.trim();
  const low = title.toLowerCase();

  const EXACT = {
    "spaghetti squash meal soup": "Soupe-repas à la courge spaghetti",
    "spaghetti squash dinner soup": "Soupe-repas à la courge spaghetti",
    "apple and maple syrup pork roast": "Rôti de porc aux pommes et sirop d'érable",
    "pork roast with apples and maple syrup": "Rôti de porc aux pommes et sirop d'érable",
    "shepherd's pie": "Pâté chinois",
    "traditional meat pie": "Tourtière"
  };
  if (EXACT[low]) return EXACT[low];

  if (/meal soup$/i.test(title)) {
    const ing = title.replace(/\s*meal soup$/i, "").trim().toLowerCase();
    const frIng = ing === "spaghetti squash" ? "à la courge spaghetti" : `au ${ing}`;
    return `Soupe-repas ${frIng}`;
  }
  if (/pork roast$/i.test(title)) {
    const ing = title.replace(/\s*pork roast$/i, "").trim().toLowerCase();
    if (ing.includes("apple") && ing.includes("maple")) {
      return "Rôti de porc aux pommes et sirop d'érable";
    }
    return `Rôti de porc aux ${ing}`;
  }

  const direct = translateFoodItem(title, "FR");
  if (direct && direct.toLowerCase() !== low) {
    return direct;
  }

  return title;
}

/**
 * Translates French narrative recipe descriptions into English
 */
export function translateRecipeDescriptionToEnglish(desc) {
  if (!desc || typeof desc !== "string") return "";
  let text = desc.trim();

  const PHRASES = [
    [/préparée? à l['’]émission\s+(?:la cuisine d['’]isabelle et ricardo|[\\w\\s'’]+)/i, "Prepared on the show Isabelle and Ricardo's Kitchen"],
    [/cette soupe-repas est remplie de bonnes choses/i, "this meal soup is packed with wholesome ingredients"],
    [/cette recette est remplie de bonnes choses/i, "this recipe is packed with wholesome ingredients"],
    [/on fait cuire\s+(?:la\s+)?courge spaghetti à l['’]avance/i, "We cook the spaghetti squash ahead of time"],
    [/on fait cuire\s+([^,]+)\s+à l['’]avance/i, "Cook the $1 ahead of time"],
    [/et on intègre les filaments au bouillon/i, "and stir the strands into the broth"],
    [/on intègre les filaments au bouillon/i, "and stir the strands into the broth"],
    [/on intègre\s+([^,.]+)\s+au bouillon/i, "stir the $1 into the broth"],
    [/remplie? de bonnes choses/i, "packed with wholesome ingredients"],
    [/courge spaghetti/i, "spaghetti squash"],
    [/soupe-repas/i, "meal soup"],
    [/soupe repas/i, "meal soup"],
    [/à l['’]avance/i, "in advance"],
    [/au bouillon/i, "into the broth"],
    [/au four/i, "in the oven"],
    [/à la mijoteuse/i, "in the slow cooker"],
    [/facile et rapide/i, "quick and easy"],
    [/parfait pour un souper réconfortant/i, "perfect for a comforting dinner"],
    [/délicieux et réconfortant/i, "delicious and comforting"],
    [/servir bien chaud/i, "serve piping hot"],
    [/se congèle très bien/i, "freezes very well"],
    [/se congèle facilement/i, "freezes easily"],
    [/se conserve\s+(\\d+)\s+jours au réfrigérateur/i, "keeps for $1 days in the refrigerator"],
    [/\\bet\\b/gi, "and"],
    [/\\bavec\\b/gi, "with"]
  ];

  for (const [re, rep] of PHRASES) {
    text = text.replace(re, rep);
  }

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Translates English narrative recipe descriptions into French
 */
export function translateRecipeDescriptionToFrench(desc) {
  if (!desc || typeof desc !== "string") return "";
  let text = desc.trim();

  const PHRASES = [
    [/prepared on the show\s+isabelle and ricardo's kitchen/i, "Préparée à l'émission La cuisine d'Isabelle et Ricardo"],
    [/this meal soup is packed with wholesome ingredients/i, "cette soupe-repas est remplie de bonnes choses"],
    [/this recipe is packed with wholesome ingredients/i, "cette recette est remplie de bonnes choses"],
    [/we cook the spaghetti squash ahead of time/i, "On fait cuire la courge spaghetti à l'avance"],
    [/and stir the strands into the broth/i, "et on intègre les filaments au bouillon"],
    [/spaghetti squash/i, "courge spaghetti"],
    [/meal soup/i, "soupe-repas"],
    [/quick and easy/i, "rapide et facile"],
    [/comforting dinner/i, "souper réconfortant"],
    [/serve piping hot/i, "servir bien chaud"],
    [/freezes easily/i, "se congèle facilement"],
    [/\\band\\b/gi, "et"],
    [/\\bwith\\b/gi, "avec"]
  ];

  for (const [re, rep] of PHRASES) {
    text = text.replace(re, rep);
  }

  return text.replace(/\s+/g, " ").trim();
}
