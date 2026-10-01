/**
 * Canadian Food & Open Grocery Intelligence Service
 * 
 * Integrates open-source food databases with a primary concentration on Canada:
 * 1. Canadian Nutrient File (CNF) / Fichier canadien sur les éléments nutritifs (Health Canada)
 * 2. IFPS Global PLU Produce Database (Canadian retail standard for fresh produce)
 * 3. Open Food Facts Canada & Global (ca.openfoodfacts.org / world.openfoodfacts.org)
 * 4. USDA FoodData Central reference & Quebec Grocery Brand Catalog
 */

import fetch from "node-fetch";
import { translateFoodItem, getBilingualNames } from "./foodTranslator.js";

// ============================================================================
// 1. IFPS GLOBAL PRODUCE PLU DATABASE (Canadian Grocery Retail Standard)
// ============================================================================
export const IFPS_PLU_CODES = {
  // --- TROPICAL & EXOTIC FRUITS ---
  "4051": {
    nameFr: "Mangue rouge fraîche (Tommy Atkins / Kent)",
    nameEn: "Fresh Red Mango (Tommy Atkins / Kent)",
    variety: "Tommy Atkins / Kent",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 7,
    origin: "Mexique / Pérou / Brésil",
    storageTipFr: "Mûrir sur le comptoir à température ambiante. Transférer au réfrigérateur une fois souple.",
    storageTipEn: "Ripen at room temperature on counter. Refrigerate once slightly soft to touch.",
    calories: 60, protein: "0.8g", carbs: "15g", fat: "0.4g", fiber: "1.6g",
  },
  "4959": {
    nameFr: "Grosse mangue rouge tropicale",
    nameEn: "Large Red Tropical Mango",
    variety: "Large Red",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 7,
    origin: "Importé",
    storageTipFr: "Conserver sur le comptoir. Délicieuse en smoothie ou salade de fruits.",
    storageTipEn: "Keep at room temperature until fragrant and ripe.",
    calories: 65, protein: "0.8g", carbs: "16g", fat: "0.4g", fiber: "1.7g",
  },
  "4312": {
    nameFr: "Mangue Ataulfo (Mangue miel)",
    nameEn: "Ataulfo Honey Mango",
    variety: "Ataulfo (Honey / Champagne)",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 6,
    origin: "Mexique",
    storageTipFr: "Prête à consommer lorsque la peau devient dorée et légèrement fripée.",
    storageTipEn: "Ready to eat when golden yellow and skin slightly wrinkles.",
    calories: 62, protein: "0.9g", carbs: "15g", fat: "0.3g", fiber: "1.8g",
  },
  "3114": {
    nameFr: "Mangue verte / mûre à cuisiner",
    nameEn: "Green / Cooking Mango",
    variety: "Green / Keitt",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 8,
    origin: "Importé",
    storageTipFr: "Idéale pour salades thaïes ou chutneys épicés.",
    storageTipEn: "Ideal for salads, chutneys, or ripening slowly.",
    calories: 58, protein: "0.7g", carbs: "14g", fat: "0.3g", fiber: "1.5g",
  },
  "4011": {
    nameFr: "Bananes jaunes fraîches",
    nameEn: "Fresh Yellow Bananas",
    variety: "Cavendish",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 5,
    origin: "Équateur / Costa Rica / Colombie",
    storageTipFr: "Garder sur le comptoir à l'air libre. Ne pas réfrigérer entière pour éviter le noircissement.",
    storageTipEn: "Store on countertop. Do not refrigerate whole peel to avoid browning.",
    calories: 89, protein: "1.1g", carbs: "23g", fat: "0.3g", fiber: "2.6g",
  },
  "4235": {
    nameFr: "Bananes plantains vertes / jaunes",
    nameEn: "Plantain Bananas",
    variety: "Plantain",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 10,
    origin: "Colombie / Équateur",
    storageTipFr: "Cuire à la poêle, bouillir ou frire en tostones.",
    storageTipEn: "Cook before eating: fry, boil, or bake.",
    calories: 122, protein: "1.3g", carbs: "32g", fat: "0.4g", fiber: "2.3g",
  },
  "4046": {
    nameFr: "Avocats Hass réguliers",
    nameEn: "Hass Avocados (Medium)",
    variety: "Hass",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 6,
    origin: "Mexique",
    storageTipFr: "Mûrir sur le comptoir. Placer au frigo une fois la peau foncée et souple.",
    storageTipEn: "Ripen on counter. Move to fridge once dark and soft.",
    calories: 160, protein: "2g", carbs: "9g", fat: "15g", fiber: "7g",
  },
  "4225": {
    nameFr: "Gros avocats Hass",
    nameEn: "Large Hass Avocados",
    variety: "Hass Jumbo",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 6,
    origin: "Mexique / Pérou",
    storageTipFr: "Mûrir à l'air libre. Arroser de jus de lime si coupé en deux.",
    storageTipEn: "Store cut side with lime juice in airtight container.",
    calories: 220, protein: "2.7g", carbs: "12g", fat: "20g", fiber: "9g",
  },
  "4430": {
    nameFr: "Ananas frais doré (Golden Ripe)",
    nameEn: "Fresh Golden Pineapple",
    variety: "MD2 Extra Sweet",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 6,
    origin: "Costa Rica",
    storageTipFr: "Garder sur le comptoir. Une fois tranché, conserver au frigo dans un contenant hermétique.",
    storageTipEn: "Keep stem-down on counter. Refrigerate once cut.",
    calories: 50, protein: "0.5g", carbs: "13g", fat: "0.1g", fiber: "1.4g",
  },
  "4032": {
    nameFr: "Pastèque entière sans pépins (Melon d'eau)",
    nameEn: "Seedless Watermelon",
    variety: "Seedless",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 10,
    origin: "Canada (Ontario) / États-Unis",
    storageTipFr: "Conserver entière à température ambiante. Réfrigérer immédiatement après découpe.",
    storageTipEn: "Store whole at room temperature. Refrigerate once sliced.",
    calories: 30, protein: "0.6g", carbs: "8g", fat: "0.2g", fiber: "0.4g",
  },
  "4050": {
    nameFr: "Cantaloup frais (Melon brodé)",
    nameEn: "Fresh Cantaloupe",
    variety: "Cantaloupe",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 7,
    origin: "Canada / Importé",
    storageTipFr: "Mûrir sur le comptoir. Réfrigérer dès qu'il dégage un parfum sucré.",
    storageTipEn: "Countertop until aromatic, then refrigerate.",
    calories: 34, protein: "0.8g", carbs: "8g", fat: "0.2g", fiber: "0.9g",
  },

  // --- APPLES (Canadian & Quebec Orchard Varieties) ---
  "4152": {
    nameFr: "Pommes McIntosh du Québec",
    nameEn: "Quebec McIntosh Apples",
    variety: "McIntosh (Pommes du Québec)",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 30,
    origin: "Québec, Canada",
    storageTipFr: "Conserver dans le bac à légumes à faible humidité du réfrigérateur.",
    storageTipEn: "Keep in the crisper drawer of your refrigerator.",
    calories: 52, protein: "0.3g", carbs: "14g", fat: "0.2g", fiber: "2.4g",
  },
  "4133": {
    nameFr: "Pommes Gala fraîches",
    nameEn: "Fresh Gala Apples",
    variety: "Gala (Canada No. 1)",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 28,
    origin: "Canada (Québec / Ontario)",
    storageTipFr: "Conserver au frais pour préserver le croquant sucré.",
    storageTipEn: "Refrigerate to preserve natural crisp sweetness.",
    calories: 52, protein: "0.3g", carbs: "14g", fat: "0.2g", fiber: "2.4g",
  },
  "4173": {
    nameFr: "Pommes Honeycrisp de l'Ontario / Québec",
    nameEn: "Honeycrisp Apples",
    variety: "Honeycrisp",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 35,
    origin: "Canada",
    storageTipFr: "Pomme extra croquante et juteuse. Réfrigérer en permanence.",
    storageTipEn: "Extra crisp and juicy. Keep constantly chilled.",
    calories: 57, protein: "0.3g", carbs: "15g", fat: "0.2g", fiber: "2.5g",
  },
  "4124": {
    nameFr: "Pommes Cortland du Québec (Idéales en cuisine)",
    nameEn: "Cortland Apples (Quebec)",
    variety: "Cortland",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 28,
    origin: "Québec, Canada",
    storageTipFr: "La chair ne brunit pas rapidement à l'air libre. Parfaite pour salades et tartes.",
    storageTipEn: "Flesh resists browning. Superb for salads and pies.",
    calories: 50, protein: "0.3g", carbs: "13g", fat: "0.2g", fiber: "2.2g",
  },
  "4131": {
    nameFr: "Pommes Fuji croquantes",
    nameEn: "Fuji Apples",
    variety: "Fuji",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 35,
    origin: "Canada / Importé",
    storageTipFr: "Très longue conservation au réfrigérateur.",
    storageTipEn: "Long storage life when refrigerated in crisper.",
    calories: 55, protein: "0.3g", carbs: "15g", fat: "0.2g", fiber: "2.4g",
  },
  "3438": {
    nameFr: "Pommes Ambrosia de la Colombie-Britannique",
    nameEn: "Ambrosia Apples (BC Canada)",
    variety: "Ambrosia",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 30,
    origin: "Colombie-Britannique, Canada",
    storageTipFr: "Variété canadienne douce et mielleuse à chair crème.",
    storageTipEn: "Canadian sweet variety discovered in British Columbia.",
    calories: 54, protein: "0.3g", carbs: "14g", fat: "0.2g", fiber: "2.4g",
  },

  // --- CITRUS & BERRIES ---
  "4053": {
    nameFr: "Citrons jaunes frais",
    nameEn: "Fresh Yellow Lemons",
    variety: "Eureka / Lisbon",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 21,
    origin: "États-Unis / Espagne",
    storageTipFr: "Au frigo dans un sac scellé pour conserver jusqu'à 3 semaines de jus.",
    storageTipEn: "Store in a sealed bag in the crisper drawer for up to 3 weeks.",
    calories: 29, protein: "1.1g", carbs: "9g", fat: "0.3g", fiber: "2.8g",
  },
  "4048": {
    nameFr: "Limes fraîches (Citrons verts)",
    nameEn: "Fresh Limes",
    variety: "Persian Lime",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 21,
    origin: "Mexique",
    storageTipFr: "Conserver au bac à légumes pour éviter le dessèchement de l'écorce.",
    storageTipEn: "Refrigerate in crisper drawer to avoid skin drying out.",
    calories: 30, protein: "0.7g", carbs: "11g", fat: "0.2g", fiber: "2.8g",
  },
  "4012": {
    nameFr: "Oranges Navel douces sans pépins",
    nameEn: "Navel Oranges",
    variety: "Navel",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 21,
    origin: "Californie / Floride",
    storageTipFr: "Garder au frigo ou sur le comptoir si consommées dans les 4 jours.",
    storageTipEn: "Refrigerate for longevity, or keep on counter if eating soon.",
    calories: 47, protein: "0.9g", carbs: "12g", fat: "0.1g", fiber: "2.4g",
  },

  // --- CANADIAN & POPULAR VEGETABLES ---
  "4065": {
    nameFr: "Tomates de serre sur vigne (Savoura / Mirabel)",
    nameEn: "Greenhouse Vine Tomatoes",
    variety: "Vine Ripe (Serres du Québec)",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 7,
    origin: "Québec, Canada",
    storageTipFr: "Garder sur le comptoir pour préserver toute la saveur et texture juteuse.",
    storageTipEn: "Keep stem-on on counter. Never refrigerate raw vine tomatoes.",
    calories: 18, protein: "0.9g", carbs: "3.9g", fat: "0.2g", fiber: "1.2g",
  },
  "4087": {
    nameFr: "Tomates italiennes Roma",
    nameEn: "Roma Plum Tomatoes",
    variety: "Roma",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 7,
    origin: "Canada / Mexique",
    storageTipFr: "Chair dense, idéale pour coulis, sauces et pâtes.",
    storageTipEn: "Meaty flesh ideal for slow-cooked pasta sauces and canning.",
    calories: 18, protein: "0.9g", carbs: "3.9g", fat: "0.2g", fiber: "1.2g",
  },
  "4062": {
    nameFr: "Concombre anglais sans pépins",
    nameEn: "English Seedless Cucumber",
    variety: "English Greenhouse",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 8,
    origin: "Québec / Ontario, Canada",
    storageTipFr: "Conserver dans sa pellicule plastique d'origine dans le bac à légumes.",
    storageTipEn: "Keep in original plastic wrap in crisper drawer to retain moisture.",
    calories: 15, protein: "0.7g", carbs: "3.6g", fat: "0.1g", fiber: "0.5g",
  },
  "4562": {
    nameFr: "Carottes fraîches en vrac ou sac",
    nameEn: "Fresh Carrots",
    variety: "Canada No. 1",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 30,
    origin: "Québec, Canada (Terres Noires)",
    storageTipFr: "Conserver au bac à légumes dans un sac perforé avec un essuie-tout.",
    storageTipEn: "Store in perforated bag with a paper towel in crisper drawer.",
    calories: 41, protein: "0.9g", carbs: "10g", fat: "0.2g", fiber: "2.8g",
  },
  "4060": {
    nameFr: "Couronnes de brocoli frais",
    nameEn: "Fresh Broccoli Crowns",
    variety: "Crown Cut",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 6,
    origin: "Canada (Québec) / États-Unis",
    storageTipFr: "Conserver au réfrigérateur non lavé dans un sac plastique entrouvert.",
    storageTipEn: "Keep unwashed in loose plastic bag in refrigerator crisper.",
    calories: 34, protein: "2.8g", carbs: "7g", fat: "0.4g", fiber: "2.6g",
  },
  "4079": {
    nameFr: "Chou-fleur blanc frais",
    nameEn: "White Cauliflower",
    variety: "White Crown",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 9,
    origin: "Canada / États-Unis",
    storageTipFr: "Conserver tige vers le haut au réfrigérateur pour éviter l'humidité.",
    storageTipEn: "Store stem-side up in fridge to prevent moisture accumulation.",
    calories: 25, protein: "1.9g", carbs: "5g", fat: "0.3g", fiber: "2g",
  },
  "4072": {
    nameFr: "Pommes de terre Russet du Québec",
    nameEn: "Quebec Russet Baking Potatoes",
    variety: "Russet Burbank",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 35,
    origin: "Québec, Canada",
    storageTipFr: "Conserver dans un garde-manger frais, sec et sombre. Ne pas réfrigérer.",
    storageTipEn: "Store in a cool, dark, ventilated pantry. Never refrigerate.",
    calories: 77, protein: "2g", carbs: "17g", fat: "0.1g", fiber: "2.1g",
  },
  "4727": {
    nameFr: "Pommes de terre jaunes grelots / Yukon Gold",
    nameEn: "Yukon Gold / Yellow Potatoes",
    variety: "Yukon Gold",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 30,
    origin: "Canada (Ontario / Québec)",
    storageTipFr: "Chair jaune beurrée, excellente en purée ou rôtie au four.",
    storageTipEn: "Classic Canadian yellow-fleshed potato invented at U of Guelph.",
    calories: 70, protein: "1.9g", carbs: "16g", fat: "0.1g", fiber: "1.8g",
  },
  "4088": {
    nameFr: "Poivrons doux rouges",
    nameEn: "Red Sweet Bell Peppers",
    variety: "Bell Pepper",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 10,
    origin: "Canada / Mexique",
    storageTipFr: "Conserver au bac à légumes bien sec.",
    storageTipEn: "Store dry in vegetable crisper drawer.",
    calories: 31, protein: "1g", carbs: "6g", fat: "0.3g", fiber: "2.1g",
  },
  "4093": {
    nameFr: "Oignons jaunes à cuire",
    nameEn: "Yellow Cooking Onions",
    variety: "Yellow Storage",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 45,
    origin: "Québec, Canada",
    storageTipFr: "Conserver dans un panier ventilé dans un endroit sombre et sec.",
    storageTipEn: "Keep in a cool, dry, well-ventilated spot away from potatoes.",
    calories: 40, protein: "1.1g", carbs: "9g", fat: "0.1g", fiber: "1.7g",
  },
  "4068": {
    nameFr: "Oignons verts (Échalotes fraîches)",
    nameEn: "Green Onions / Scallions",
    variety: "Scallions",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 10,
    origin: "Canada / Mexique",
    storageTipFr: "Placer les racines dans un petit verre d'eau au frigo ou envelopper dans un linge humide.",
    storageTipEn: "Stand upright in a glass with 1 inch of water in the fridge.",
    calories: 32, protein: "1.8g", carbs: "7g", fat: "0.2g", fiber: "2.6g",
  },
  "4608": {
    nameFr: "Ail blanc frais en bulbe",
    nameEn: "Fresh Garlic Bulbs",
    variety: "Softneck / Hardneck",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Pantry",
    shelfLifeDays: 60,
    origin: "Canada / Espagne",
    storageTipFr: "Conserver à l'air libre dans un endroit tempéré et sec.",
    storageTipEn: "Store at room temperature in a mesh bag or garlic keeper.",
    calories: 149, protein: "6.4g", carbs: "33g", fat: "0.5g", fiber: "2.1g",
  },
  "4085": {
    nameFr: "Champignons blancs frais entiers",
    nameEn: "White Button Mushrooms",
    variety: "Agaricus bisporus",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 6,
    origin: "Canada (Champignons du Québec / Ontario)",
    storageTipFr: "Conserver dans un sac en papier brun pour absorber l'excès d'humidité.",
    storageTipEn: "Store in a breathable brown paper bag in the fridge.",
    calories: 22, protein: "3.1g", carbs: "3.3g", fat: "0.3g", fiber: "1g",
  },
  "4648": {
    nameFr: "Champignons Cremini (Bébé Bella)",
    nameEn: "Cremini / Baby Bella Mushrooms",
    variety: "Cremini",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 7,
    origin: "Canada",
    storageTipFr: "Saveur plus boisée et terreuse que le champignon blanc.",
    storageTipEn: "Earthier flavor. Keep dry in paper bag.",
    calories: 22, protein: "2.5g", carbs: "3.9g", fat: "0.1g", fiber: "1.2g",
  },
  "4067": {
    nameFr: "Courgettes vertes (Zucchini)",
    nameEn: "Green Zucchini",
    variety: "Green Zucchini",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 7,
    origin: "Canada (Québec) / Mexique",
    storageTipFr: "Conserver au bac à légumes sans emballage étanche.",
    storageTipEn: "Store in crisper drawer in loose plastic wrap.",
    calories: 17, protein: "1.2g", carbs: "3.1g", fat: "0.3g", fiber: "1g",
  },
  "4070": {
    nameFr: "Céleri en branche frais",
    nameEn: "Fresh Pascal Celery Stalks",
    variety: "Pascal",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 18,
    origin: "Canada / Californie",
    storageTipFr: "Envelopper fermement dans du papier d'aluminium pour conserver jusqu'à 3 semaines.",
    storageTipEn: "Wrap tightly in aluminum foil to keep crisp for weeks.",
    calories: 14, protein: "0.7g", carbs: "3g", fat: "0.2g", fiber: "1.6g",
  },
  "4640": {
    nameFr: "Cœurs de laitue romaine fraîche",
    nameEn: "Romaine Lettuce Hearts",
    variety: "Romaine",
    category: "Produce",
    categoryFr: "Produits frais",
    location: "Fridge",
    shelfLifeDays: 10,
    origin: "Canada (Serres Lefort / Mirabel) / Californie",
    storageTipFr: "Conserver bien sec dans un linge propre au bac à légumes.",
    storageTipEn: "Keep in crisper drawer with paper towel to absorb condensation.",
    calories: 17, protein: "1.2g", carbs: "3.3g", fat: "0.3g", fiber: "2.1g",
  },
};

// ============================================================================
// 2. CANADIAN NUTRIENT FILE (CNF) & BILINGUAL CANADIAN RETAIL STAPLES
// ============================================================================
export const CANADIAN_NUTRIENT_FILE_CATALOG = [
  // --- DAIRY & EGGS (Canadian Standards: Homo, 2%, 1%, Skim, Butter, Cheese) ---
  {
    code: "CNF_DAIRY_01",
    upc: "068700011039",
    nameFr: "Lait 2% partiellement écrémé canadien",
    nameEn: "Canadian 2% Partly Skimmed Milk",
    brand: "Québon / Sealtest / Natrel / Lactantia",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Fridge",
    unopenedShelfLifeDays: 16,
    openedShelfLifeDays: 7,
    origin: "Lait 100% canadien (Logo Vache Bleue)",
    badges: ["Lait 100% canadien", "Vitamines A & D", "Aliments du Québec"],
    nutrition: { serving: "250 mL (1 tasse)", calories: 130, protein: "9g", carbs: "12g", fat: "5g", calcium: "300mg" },
    storageTipFr: "Conserver sur les tablettes intérieures du réfrigérateur à 4°C (éviter la porte).",
    storageTipEn: "Keep on middle fridge shelves at 4°C rather than inside door for stable temp.",
  },
  {
    code: "CNF_DAIRY_02",
    upc: "055653670014",
    nameFr: "Beurre salé de crème fraîche canadienne",
    nameEn: "Canadian Salted Butter",
    brand: "Lactantia / Gay Lea / Natrel",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Fridge",
    unopenedShelfLifeDays: 90,
    openedShelfLifeDays: 30,
    monthsFrozenShelfLife: 12,
    origin: "Canada (Crème pasteurisée 100% canadienne)",
    badges: ["Crème 100% canadienne", "Sans colorant artificiel"],
    nutrition: { serving: "10g (2 c. à thé)", calories: 70, protein: "0.1g", carbs: "0g", fat: "8g", sodium: "65mg" },
    storageTipFr: "Conserver au frigo bien emballé. Se congèle parfaitement jusqu'à 1 an.",
    storageTipEn: "Keep tightly wrapped. Can be frozen for up to 1 year.",
  },
  {
    code: "CNF_DAIRY_03",
    upc: "068200000155",
    nameFr: "Fromage Cheddar vieilli canadien",
    nameEn: "Canadian Aged Cheddar Cheese",
    brand: "Black Diamond / Armstrong / Perron / Île-aux-Grues",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Fridge",
    unopenedShelfLifeDays: 120,
    openedShelfLifeDays: 28,
    origin: "Québec / Ontario, Canada",
    badges: ["Lait canadien", "Sans lactose naturel", "Riche en calcium"],
    nutrition: { serving: "30g", calories: 120, protein: "7g", carbs: "0g", fat: "10g", calcium: "200mg" },
    storageTipFr: "Envelopper dans du papier ciré ou parchemin puis dans un sac hermétique.",
    storageTipEn: "Wrap in wax or parchment paper, then place in an airtight bag.",
  },
  {
    code: "CNF_DAIRY_04",
    upc: "067000001018",
    nameFr: "Fromage en grains frais du jour (Cheddar frais)",
    nameEn: "Fresh Cheese Curds (Squeaky Curds)",
    brand: "P'tit Québec / St-Guillaume / Victoriaville / Boivin",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Pantry",
    unopenedShelfLifeDays: 2,
    openedShelfLifeDays: 7,
    origin: "Québec, Canada",
    badges: ["Aliments du Québec", "Fait au Québec", "Tradition poutine"],
    nutrition: { serving: "50g", calories: 190, protein: "13g", carbs: "1g", fat: "15g", sodium: "380mg" },
    storageTipFr: "Garder à température ambiante le 1er jour pour conserver le 'squick-squick'. Réfrigérer ensuite.",
    storageTipEn: "Keep at room temp day 1 for optimal squeak. Refrigerate thereafter.",
  },
  {
    code: "CNF_DAIRY_05",
    upc: "064541234567",
    nameFr: "Gros œufs blancs canadiens Calibre A",
    nameEn: "Canadian Grade A Large White Eggs",
    brand: "Nutri / Burnbrae / Sélection / Compliments",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Fridge",
    unopenedShelfLifeDays: 35,
    openedShelfLifeDays: 21,
    origin: "Producteurs d'œufs du Canada",
    badges: ["Calibre A", "Protéines complètes", "Fermes canadiennes"],
    nutrition: { serving: "1 œuf (53g)", calories: 70, protein: "6g", carbs: "0g", fat: "5g", choline: "140mg" },
    storageTipFr: "Conserver dans leur carton d'origine sur une tablette du réfrigérateur.",
    storageTipEn: "Store in original carton on a fridge shelf to maintain moisture balance.",
  },
  {
    code: "CNF_DAIRY_06",
    upc: "056800123456",
    nameFr: "Yogourt grec nature 0% riche en protéines",
    nameEn: "Plain 0% High-Protein Greek Yogurt",
    brand: "Oikos / Iögo / Liberté / Kirkland",
    category: "Dairy & Eggs",
    categoryFr: "Produits laitiers & œufs",
    location: "Fridge",
    unopenedShelfLifeDays: 28,
    openedShelfLifeDays: 10,
    origin: "Canada",
    badges: ["17g de protéines", "Sans sucre ajouté", "Lait canadien"],
    nutrition: { serving: "175g (3/4 tasse)", calories: 100, protein: "17g", carbs: "6g", fat: "0g", calcium: "200mg" },
    storageTipFr: "Garder bien fermé au réfrigérateur. Ne pas jeter le petit-lait riche en protéines.",
    storageTipEn: "Stir whey liquid back in for maximum calcium and protein.",
  },

  // --- MEATS & POULTRY (Canadian Cuts & Standards) ---
  {
    code: "CNF_MEAT_01",
    upc: "060383182903",
    nameFr: "Poitrines de poulet frais désossées sans peau",
    nameEn: "Fresh Boneless Skinless Chicken Breasts",
    brand: "Exceldor / Flamingo / Olymel / Le Choix du Président",
    category: "Meat & Seafood",
    categoryFr: "Viandes & Poissons",
    location: "Fridge",
    unopenedShelfLifeDays: 3,
    openedShelfLifeDays: 2,
    monthsFrozenShelfLife: 9,
    origin: "Poulet élevé par un producteur canadien",
    badges: ["Poulet canadien", "Sans hormones ajoutées", "Élevé au Canada"],
    nutrition: { serving: "100g cuit", calories: 165, protein: "31g", carbs: "0g", fat: "3.6g", iron: "1mg" },
    storageTipFr: "Cuire dans les 2 à 3 jours ou congeler immédiatement dans un sac sous vide ou sac congélation.",
    storageTipEn: "Cook within 2-3 days or freeze immediately in freezer zip bag.",
  },
  {
    code: "CNF_MEAT_02",
    upc: "060383002341",
    nameFr: "Bœuf haché maigre canadien 100%",
    nameEn: "Canadian 100% Lean Ground Beef",
    brand: "Bœuf Canadien Certifié / Sterling Silver",
    category: "Meat & Seafood",
    categoryFr: "Viandes & Poissons",
    location: "Fridge",
    unopenedShelfLifeDays: 3,
    openedShelfLifeDays: 2,
    monthsFrozenShelfLife: 4,
    origin: "Bœuf du Canada (Alberta / Ontario / Québec)",
    badges: ["Bœuf canadien", "Catégorie AA / AAA", "Sans additifs"],
    nutrition: { serving: "100g cuit", calories: 215, protein: "26g", carbs: "0g", fat: "11g", iron: "2.8mg" },
    storageTipFr: "Conserver sur la tablette du bas au frigo. Décongeler lentement au réfrigérateur.",
    storageTipEn: "Store on lowest shelf of fridge. Thaw safely inside fridge overnight.",
  },
  {
    code: "CNF_MEAT_03",
    upc: "060383567890",
    nameFr: "Filet de saumon de l'Atlantique canadien frais",
    nameEn: "Fresh Canadian Atlantic Salmon Fillet",
    brand: "Pêcheries Atlantiques / Jail Island",
    category: "Meat & Seafood",
    categoryFr: "Viandes & Poissons",
    location: "Fridge",
    unopenedShelfLifeDays: 2,
    openedShelfLifeDays: 1,
    monthsFrozenShelfLife: 3,
    origin: "Nouveau-Brunswick / Nouvelle-Écosse, Canada",
    badges: ["Oméga-3", "Pêche / Aquaculture responsable", "Produit du Canada"],
    nutrition: { serving: "100g", calories: 208, protein: "20g", carbs: "0g", fat: "13g", omega3: "2.3g" },
    storageTipFr: "Idéalement consommer le jour même ou le lendemain. Placer sur un lit de glace au frigo.",
    storageTipEn: "Cook within 24-48 hours. Freeze tightly wrapped for longer storage.",
  },
  {
    code: "CNF_MEAT_04",
    upc: "068700023411",
    nameFr: "Bacon fumé au bois de pommier naturel",
    nameEn: "Applewood Smoked Canadian Bacon",
    brand: "Maple Leaf / Olymel / Lafleur",
    category: "Meat & Seafood",
    categoryFr: "Viandes & Poissons",
    location: "Fridge",
    unopenedShelfLifeDays: 45,
    openedShelfLifeDays: 7,
    monthsFrozenShelfLife: 3,
    origin: "Porc du Québec / Canada",
    badges: ["Porc canadien", "Fumé naturellement", "Aliments du Québec"],
    nutrition: { serving: "2 tranches (30g)", calories: 90, protein: "6g", carbs: "0g", fat: "7g", sodium: "320mg" },
    storageTipFr: "Après ouverture, envelopper fermement dans une pellicule plastique ou papier alu.",
    storageTipEn: "Keep tightly sealed after opening; freeze extra portions.",
  },

  // --- BAKERY & GRAINS (Canadian Mills & Breads) ---
  {
    code: "CNF_BAKERY_01",
    upc: "061077123450",
    nameFr: "Pain 100% blé entier tranché St-Méthode",
    nameEn: "St-Méthode 100% Whole Wheat Sliced Bread",
    brand: "Boulangerie St-Méthode / Bon Matin / D'Italiano",
    category: "Bakery",
    categoryFr: "Boulangerie",
    location: "Pantry",
    unopenedShelfLifeDays: 8,
    openedShelfLifeDays: 5,
    monthsFrozenShelfLife: 3,
    origin: "Farine de blé du Québec et de l'Ouest canadien",
    badges: ["Aliments du Québec", "Grains entiers", "Source élevée de fibres"],
    nutrition: { serving: "2 tranches (75g)", calories: 170, protein: "8g", carbs: "32g", fat: "1.5g", fiber: "5g" },
    storageTipFr: "Conserver dans un endroit frais et sec. Se congèle parfaitement en tranches.",
    storageTipEn: "Store in bread box or pantry. Freeze whole loaf and toast directly from frozen.",
  },
  {
    code: "CNF_BAKERY_02",
    upc: "059749876543",
    nameFr: "Bagels style Montréal aux graines de sésame",
    nameEn: "Montreal-Style Sesame Seed Bagels",
    brand: "Première Moisson / Fairmount / St-Viateur",
    category: "Bakery",
    categoryFr: "Boulangerie",
    location: "Pantry",
    unopenedShelfLifeDays: 4,
    openedShelfLifeDays: 2,
    monthsFrozenShelfLife: 4,
    origin: "Montréal, Québec, Canada",
    badges: ["Tradition montréalaise", "Cuit au four à bois", "Aliments du Québec"],
    nutrition: { serving: "1 bagel (90g)", calories: 270, protein: "9g", carbs: "51g", fat: "3.5g", iron: "3.5mg" },
    storageTipFr: "Trancher en deux avant de congeler pour griller directement sans décongélation.",
    storageTipEn: "Slice before freezing so you can pop straight into the toaster.",
  },
  {
    code: "CNF_BAKERY_03",
    upc: "058703123456",
    nameFr: "Farine tout usage enrichie non blanchie Five Roses",
    nameEn: "Five Roses Enriched Unbleached All-Purpose Flour",
    brand: "Five Roses / Robin Hood",
    category: "Pantry Staples",
    categoryFr: "Garde-manger",
    location: "Pantry",
    unopenedShelfLifeDays: 365,
    openedShelfLifeDays: 180,
    origin: "Blé dur canadien de l'Ouest (CWRS)",
    badges: ["100% blé canadien", "Non blanchie", "Qualité meunerie"],
    nutrition: { serving: "30g (1/4 tasse)", calories: 110, protein: "4g", carbs: "22g", fat: "0.3g", iron: "1.4mg" },
    storageTipFr: "Transférer dans un contenant hermétique dans un endroit frais et sombre.",
    storageTipEn: "Store in an airtight container in a cool, dry, dark pantry.",
  },

  // --- CANADIAN PANTRY & MAPLE SPECIALTIES ---
  {
    code: "CNF_PANTRY_01",
    upc: "062000123456",
    nameFr: "Sirop d'érable pur 100% du Québec (Ambré goût riche)",
    nameEn: "100% Pure Quebec Maple Syrup (Amber Rich Taste)",
    brand: "Érablière du Québec / Sélection / Irresistibles",
    category: "Pantry Staples",
    categoryFr: "Garde-manger",
    location: "Fridge",
    unopenedShelfLifeDays: 730,
    openedShelfLifeDays: 365,
    origin: "Québec, Canada (Producteurs et productrices acéricoles du Québec)",
    badges: ["Aliments du Québec", "100% pur", "Goût riche"],
    nutrition: { serving: "60 mL (1/4 tasse)", calories: 216, protein: "0g", carbs: "53g", fat: "0g", potassium: "204mg" },
    storageTipFr: "Après ouverture de la conserve ou bouteille, conserver TOUJOURS au réfrigérateur pour éviter les moisissures.",
    storageTipEn: "After opening, ALWAYS refrigerate to prevent crystallization and mold.",
  },
  {
    code: "CNF_PANTRY_02",
    upc: "064500001234",
    nameFr: "Fèves au lard à l'ancienne à la mélasse Clark",
    nameEn: "Clark Traditional Baked Beans in Molasses",
    brand: "Clark / Heinz Canada",
    category: "Canned Goods",
    categoryFr: "Conserves & Légumineuses",
    location: "Pantry",
    unopenedShelfLifeDays: 730,
    openedShelfLifeDays: 4,
    origin: "Canada",
    badges: ["Riche en fibres", "Sans gluten naturel", "Classique québécois"],
    nutrition: { serving: "250 mL (1 tasse)", calories: 240, protein: "12g", carbs: "48g", fat: "1.5g", fiber: "10g" },
    storageTipFr: "Après ouverture de la boîte, transvider dans un plat hermétique et réfrigérer jusqu'à 4 jours.",
    storageTipEn: "Transfer leftovers from metal can into glass container; refrigerate.",
  },
  {
    code: "CNF_PANTRY_03",
    upc: "060500123456",
    nameFr: "Soupe aux pois à l'ancienne avec jambon Habitant",
    nameEn: "Habitant French-Canadian Pea Soup with Ham",
    brand: "Habitant / Campbell's Canada",
    category: "Canned Goods",
    categoryFr: "Conserves & Légumineuses",
    location: "Pantry",
    unopenedShelfLifeDays: 730,
    openedShelfLifeDays: 4,
    origin: "Canada",
    badges: ["Recette traditionnelle québécoise", "Pois jaunes entiers"],
    nutrition: { serving: "250 mL", calories: 170, protein: "9g", carbs: "27g", fat: "2.5g", fiber: "6g" },
    storageTipFr: "Garde-manger. Transférer dans un bol scellé après ouverture au réfrigérateur.",
    storageTipEn: "Keep in pantry. Store opened soup in fridge up to 4 days.",
  },
  {
    code: "CNF_PANTRY_04",
    upc: "068700987654",
    nameFr: "Sauce BBQ St-Hubert originale en boîte",
    nameEn: "St-Hubert Original BBQ Gravy Sauce",
    brand: "St-Hubert",
    category: "Condiments",
    categoryFr: "Sauces & Condiments",
    location: "Pantry",
    unopenedShelfLifeDays: 730,
    openedShelfLifeDays: 5,
    origin: "Québec, Canada",
    badges: ["Aliments du Québec", "Recette originale 1951"],
    nutrition: { serving: "60 mL", calories: 30, protein: "0.5g", carbs: "6g", fat: "0.5g", sodium: "410mg" },
    storageTipFr: "Classique des rôtisseries québécoises. Réfrigérer après ouverture.",
    storageTipEn: "Iconic Quebec rotisserie sauce. Refrigerate leftovers.",
  },
  {
    code: "CNF_PANTRY_05",
    upc: "067300123456",
    nameFr: "Jus de pomme pur 100% Oasis / Rougemont",
    nameEn: "Oasis / Rougemont 100% Pure Apple Juice",
    brand: "Oasis / Rougemont / Lassonde",
    category: "Beverages",
    categoryFr: "Boissons",
    location: "Pantry",
    unopenedShelfLifeDays: 270,
    openedShelfLifeDays: 10,
    origin: "Rougemont, Québec, Canada",
    badges: ["Aliments du Québec", "Sans sucre ajouté", "Vitamine C ajoutée"],
    nutrition: { serving: "250 mL", calories: 110, protein: "0g", carbs: "28g", fat: "0g", vitaminC: "100%" },
    storageTipFr: "Garder au garde-manger. Mettre au frigo avant de servir; consommer dans les 10 jours après ouverture.",
    storageTipEn: "Pantry stable unopened. Refrigerate after opening and drink within 10 days.",
  },
];

// ============================================================================
// 3. SEARCH & RESOLUTION ENGINE
// ============================================================================

/**
 * Searches the Canadian Nutrient File and PLU database for keyword matches
 */
export function searchCanadianAndPluDatabase(query, language = "FR") {
  if (!query || typeof query !== "string") return [];
  const normalized = query.toLowerCase().trim();
  const isFr = (language || "FR").toUpperCase().startsWith("FR");

  const results = [];
  const seenCodes = new Set();

  // 1. Check PLU produce database
  // If query is a 4- or 5-digit number
  const isNumeric = /^\d{4,5}$/.test(normalized);
  if (isNumeric) {
    const pluKey = normalized.length === 5 && normalized.startsWith("9") ? normalized.slice(1) : normalized;
    const isOrganic = normalized.length === 5 && normalized.startsWith("9");

    if (IFPS_PLU_CODES[pluKey]) {
      const p = IFPS_PLU_CODES[pluKey];
      results.push({
        source: "IFPS_PLU",
        sourceLabel: isFr ? "🏷️ Base PLU Internationale (Fruits & Légumes)" : "🏷️ IFPS Global PLU Produce Database",
        code: normalized,
        name: isOrganic
          ? (isFr ? `${p.nameFr} (Biologique)` : `${p.nameEn} (Organic)`)
          : (isFr ? p.nameFr : p.nameEn),
        nameFr: isOrganic ? `${p.nameFr} (Biologique)` : p.nameFr,
        nameEn: isOrganic ? `${p.nameEn} (Organic)` : p.nameEn,
        category: isFr ? p.categoryFr : p.category,
        categoryEn: p.category,
        brand: isOrganic ? "Certifié Biologique" : "Produit frais",
        gradeOrigin: `Code PLU #${normalized} • ${p.origin}`,
        location: p.location,
        shelfLifeDays: p.shelfLifeDays,
        storageTip: isFr ? p.storageTipFr : p.storageTipEn,
        nutrition: { calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat, fiber: p.fiber },
      });
      seenCodes.add(normalized);
    }
  }

  // 2. Keyword search on IFPS PLU produce
  for (const [code, p] of Object.entries(IFPS_PLU_CODES)) {
    if (seenCodes.has(code)) continue;
    const matchFr = p.nameFr.toLowerCase().includes(normalized) || p.variety.toLowerCase().includes(normalized);
    const matchEn = p.nameEn.toLowerCase().includes(normalized) || p.variety.toLowerCase().includes(normalized);

    if (matchFr || matchEn) {
      seenCodes.add(code);
      results.push({
        source: "IFPS_PLU",
        sourceLabel: isFr ? "🏷️ Base PLU Fruits & Légumes" : "🏷️ IFPS Produce Database",
        code: code,
        name: isFr ? p.nameFr : p.nameEn,
        nameFr: p.nameFr,
        nameEn: p.nameEn,
        category: isFr ? p.categoryFr : p.category,
        categoryEn: p.category,
        brand: "Produit frais",
        gradeOrigin: `Pastille PLU #${code} • ${p.origin}`,
        location: p.location,
        shelfLifeDays: p.shelfLifeDays,
        storageTip: isFr ? p.storageTipFr : p.storageTipEn,
        nutrition: { calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat, fiber: p.fiber },
      });
    }
  }

  // 3. Search Canadian Nutrient File (CNF)
  for (const cnf of CANADIAN_NUTRIENT_FILE_CATALOG) {
    if (seenCodes.has(cnf.code)) continue;
    const matchName = cnf.nameFr.toLowerCase().includes(normalized) || cnf.nameEn.toLowerCase().includes(normalized);
    const matchBrand = cnf.brand.toLowerCase().includes(normalized);
    const matchUpc = cnf.upc === normalized;

    if (matchName || matchBrand || matchUpc) {
      seenCodes.add(cnf.code);
      results.push({
        source: "CANADIAN_NUTRIENT_FILE",
        sourceLabel: isFr ? "🍁 Fichier canadien sur les éléments nutritifs (Santé Canada)" : "🍁 Canadian Nutrient File (Health Canada)",
        code: cnf.code,
        upc: cnf.upc,
        name: isFr ? cnf.nameFr : cnf.nameEn,
        nameFr: cnf.nameFr,
        nameEn: cnf.nameEn,
        category: isFr ? cnf.categoryFr : cnf.category,
        categoryEn: cnf.category,
        brand: cnf.brand,
        gradeOrigin: cnf.origin,
        location: cnf.location,
        shelfLifeDays: cnf.unopenedShelfLifeDays,
        storageTip: isFr ? cnf.storageTipFr : cnf.storageTipEn,
        dietaryBadges: cnf.badges,
        nutrition: cnf.nutrition,
      });
    }
  }

  return results;
}

/**
 * High-precision UPC/EAN Barcode Resolver
 * Checks Canadian database and Open Food Facts (Canada node first, then Global)
 */
export async function resolveBarcodeUnified(barcode, language = "FR") {
  const cleanCode = String(barcode || "").trim().replace(/[^0-9]/g, "");
  const isFr = (language || "FR").toUpperCase().startsWith("FR");

  if (!cleanCode || cleanCode.length < 4) {
    throw new Error("Invalid barcode or PLU code");
  }

  // Check 1: IFPS PLU produce code (4-5 digits)
  if (cleanCode.length === 4 || cleanCode.length === 5) {
    const isOrganic = cleanCode.length === 5 && cleanCode.startsWith("9");
    const pluKey = isOrganic ? cleanCode.slice(1) : cleanCode;

    if (IFPS_PLU_CODES[pluKey]) {
      const p = IFPS_PLU_CODES[pluKey];
      const title = isOrganic
        ? (isFr ? `${p.nameFr} (Biologique)` : `${p.nameEn} (Organic)`)
        : (isFr ? p.nameFr : p.nameEn);

      return {
        success: true,
        source: "IFPS_PLU",
        sourceLabel: isFr ? "🏷️ Base PLU Internationale (Aliments frais)" : "🏷️ IFPS Global PLU Produce Standard",
        barcode: cleanCode,
        item: {
          name: title,
          nameFr: isOrganic ? `${p.nameFr} (Biologique)` : p.nameFr,
          nameEn: isOrganic ? `${p.nameEn} (Organic)` : p.nameEn,
          brand: isOrganic ? "Certifié Biologique" : "Produit frais",
          category: isFr ? p.categoryFr : p.category,
          categoryEn: p.category,
          quantity: 1,
          unit: "pcs",
          recommendedLocation: p.location,
          estimatedShelfLifeDays: p.shelfLifeDays,
          monthsFrozenShelfLife: 10,
          gradeOrigin: `Pastille PLU #${cleanCode} • ${p.origin}`,
          packagingFormat: isFr ? "Fruit/légume frais en vrac" : "Whole fresh loose produce",
          dietaryBadges: isOrganic ? ["Biologique", "Produits frais", "Sans emballage"] : ["Produits frais", "Sans emballage"],
          storageTip: isFr ? p.storageTipFr : p.storageTipEn,
          storageReason: isFr ? "Conserver selon les recommandations de fraîcheur maraîchère." : "Store according to fresh produce best practices.",
          freezerTip: isFr ? "Laver, peler ou découper avant de congeler pour smoothies ou cuisine." : "Chop or peel before freezing for smoothies or recipes.",
          nutrition: p.calories ? { calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat, fiber: p.fiber } : null,
          barcode: cleanCode,
        },
      };
    }
  }

  // Check 2: Canadian Nutrient File / Canadian retail catalog match
  const cnfMatch = CANADIAN_NUTRIENT_FILE_CATALOG.find((c) => c.upc === cleanCode);
  if (cnfMatch) {
    return {
      success: true,
      source: "CANADIAN_NUTRIENT_FILE",
      sourceLabel: isFr ? "🍁 Fichier canadien sur les éléments nutritifs (Santé Canada)" : "🍁 Canadian Nutrient File (Health Canada)",
      barcode: cleanCode,
      item: {
        name: isFr ? cnfMatch.nameFr : cnfMatch.nameEn,
        nameFr: cnfMatch.nameFr,
        nameEn: cnfMatch.nameEn,
        brand: cnfMatch.brand,
        category: isFr ? cnfMatch.categoryFr : cnfMatch.category,
        categoryEn: cnfMatch.category,
        quantity: 1,
        unit: "pcs",
        recommendedLocation: cnfMatch.location,
        unopenedShelfLifeDays: cnfMatch.unopenedShelfLifeDays,
        openedShelfLifeDays: cnfMatch.openedShelfLifeDays,
        estimatedShelfLifeDays: cnfMatch.unopenedShelfLifeDays,
        monthsFrozenShelfLife: cnfMatch.monthsFrozenShelfLife || 6,
        gradeOrigin: cnfMatch.origin,
        dietaryBadges: cnfMatch.badges,
        storageTip: isFr ? cnfMatch.storageTipFr : cnfMatch.storageTipEn,
        nutrition: cnfMatch.nutrition,
        barcode: cleanCode,
      },
    };
  }

  // Check 3: Query Canadian Open Food Facts first (ca.openfoodfacts.org), then global
  const endpoints = [
    `https://ca.openfoodfacts.org/api/v2/product/${cleanCode}.json`,
    `https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "PantryoCanadaFoodTracker/2.0 (Canadian Grocery Engine; contact@pantryo.app)",
        },
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 1 && data.product) {
          const prod = data.product;
          const brand = prod.brands ? prod.brands.split(",")[0].trim() : null;
          let nameFr = prod.product_name_fr || prod.generic_name_fr || null;
          let nameEn = prod.product_name_en || prod.generic_name_en || prod.product_name || "Food Product";

          if (brand) {
            if (nameFr && !nameFr.toLowerCase().includes(brand.toLowerCase())) {
              nameFr = `${brand} ${nameFr}`;
            }
            if (nameEn && !nameEn.toLowerCase().includes(brand.toLowerCase())) {
              nameEn = `${brand} ${nameEn}`;
            }
          }

          if (!nameFr && nameEn) {
            nameFr = translateFoodItem(nameEn, "FR");
          }
          if (!nameEn && nameFr) {
            nameEn = translateFoodItem(nameFr, "EN");
          }
          if (!nameFr) nameFr = "Produit alimentaire";
          if (!nameEn) nameEn = "Food Product";

          let name = isFr ? (nameFr || nameEn) : (nameEn || nameFr);

          // Detect category
          let category = "Pantry Staples";
          let categoryFr = "Garde-manger";
          const catTags = (prod.categories_tags || []).join(" ").toLowerCase();

          if (catTags.includes("dairy") || catTags.includes("cheese") || catTags.includes("milk") || catTags.includes("yogurt") || catTags.includes("egg")) {
            category = "Dairy & Eggs";
            categoryFr = "Produits laitiers & œufs";
          } else if (catTags.includes("meat") || catTags.includes("fish") || catTags.includes("seafood") || catTags.includes("poultry") || catTags.includes("beef") || catTags.includes("chicken")) {
            category = "Meat & Seafood";
            categoryFr = "Viandes & Poissons";
          } else if (catTags.includes("fruit") || catTags.includes("vegetable") || catTags.includes("produce") || catTags.includes("salad")) {
            category = "Produce";
            categoryFr = "Produits frais";
          } else if (catTags.includes("beverage") || catTags.includes("drink") || catTags.includes("juice") || catTags.includes("water") || catTags.includes("coffee") || catTags.includes("tea")) {
            category = "Beverages";
            categoryFr = "Boissons";
          } else if (catTags.includes("bread") || catTags.includes("bakery") || catTags.includes("pastry") || catTags.includes("cake")) {
            category = "Bakery";
            categoryFr = "Boulangerie";
          } else if (catTags.includes("frozen")) {
            category = "Frozen Meals";
            categoryFr = "Surgelés";
          }

          // Recommended location
          let recommendedLocation = "Pantry";
          if (["Dairy & Eggs", "Meat & Seafood", "Produce"].includes(category)) {
            recommendedLocation = "Fridge";
          } else if (category === "Frozen Meals") {
            recommendedLocation = "Freezer";
          }

          // Badges from Nutri-Score / Eco-Score
          const badges = [];
          if (prod.nutriscore_grade) badges.push(`Nutri-Score ${prod.nutriscore_grade.toUpperCase()}`);
          if (prod.ecoscore_grade) badges.push(`Eco-Score ${prod.ecoscore_grade.toUpperCase()}`);
          if (prod.nova_group) badges.push(`NOVA Groupe ${prod.nova_group}`);
          if (prod.countries_tags && prod.countries_tags.some((c) => c.includes("canada"))) {
            badges.push("Marché canadien");
          }

          const nutrition = prod.nutriments ? {
            serving: prod.serving_size || "100g",
            calories: prod.nutriments["energy-kcal_100g"] || prod.nutriments["energy-kcal"] || null,
            protein: prod.nutriments.proteins_100g ? `${prod.nutriments.proteins_100g}g` : null,
            carbs: prod.nutriments.carbohydrates_100g ? `${prod.nutriments.carbohydrates_100g}g` : null,
            fat: prod.nutriments.fat_100g ? `${prod.nutriments.fat_100g}g` : null,
            sodium: prod.nutriments.sodium_100g ? `${Math.round(prod.nutriments.sodium_100g * 1000)}mg` : null,
          } : null;

          return {
            success: true,
            source: url.includes("ca.openfoodfacts.org") ? "OPEN_FOOD_FACTS_CA" : "OPEN_FOOD_FACTS_GLOBAL",
            sourceLabel: url.includes("ca.openfoodfacts.org")
              ? (isFr ? "🇨🇦 Open Food Facts (Canada)" : "🇨🇦 Open Food Facts (Canada)")
              : (isFr ? "🌍 Open Food Facts (Mondial)" : "🌍 Open Food Facts (Global)"),
            barcode: cleanCode,
            item: {
              name: name.trim(),
              nameFr: nameFr ? nameFr.trim() : name.trim(),
              nameEn: nameEn ? nameEn.trim() : name.trim(),
              brand,
              category: isFr ? categoryFr : category,
              categoryEn: category,
              quantity: 1,
              unit: prod.quantity || "1 unité",
              recommendedLocation,
              estimatedShelfLifeDays: recommendedLocation === "Fridge" ? 14 : recommendedLocation === "Freezer" ? 180 : 60,
              monthsFrozenShelfLife: 6,
              gradeOrigin: prod.origins || (prod.countries_tags ? prod.countries_tags.join(", ").replace(/en:/g, "") : null),
              packagingFormat: prod.packaging || (isFr ? "Emballage commercial" : "Retail package"),
              dietaryBadges: badges,
              storageTip: isFr ? `Conserver au ${recommendedLocation.toLowerCase()} pour une fraîcheur optimale.` : `Store in ${recommendedLocation.toLowerCase()} for maximum freshness.`,
              nutrition,
              imageUrl: prod.image_front_url || prod.image_url || null,
              barcode: cleanCode,
            },
          };
        }
      }
    } catch (e) {
      // Continue to next endpoint
      console.warn(`[GroceryDb] Error querying ${url}:`, e.message);
    }
  }

  // Check 4: Return generic clean item with barcode
  return {
    success: true,
    source: "UNKNOWN_BARCODE",
    sourceLabel: isFr ? "Code-barres non répertorié" : "Unindexed Barcode",
    barcode: cleanCode,
    item: {
      name: isFr ? `Article UPC #${cleanCode.slice(-4)}` : `UPC Item #${cleanCode.slice(-4)}`,
      nameFr: `Article UPC #${cleanCode.slice(-4)}`,
      nameEn: `UPC Item #${cleanCode.slice(-4)}`,
      brand: null,
      category: isFr ? "Garde-manger" : "Pantry Staples",
      categoryEn: "Pantry Staples",
      quantity: 1,
      unit: "pcs",
      recommendedLocation: "Pantry",
      estimatedShelfLifeDays: 30,
      monthsFrozenShelfLife: 6,
      barcode: cleanCode,
    },
  };
}
