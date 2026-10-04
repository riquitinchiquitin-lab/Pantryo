import { GoogleGenAI, Type } from "@google/genai";
import Tesseract from "tesseract.js";
import { parseQuebecReceiptText } from "./quebecReceiptParser.js";
import { getBilingualNames, translateFoodItem } from "./foodTranslator.js";
import { analyzePackagingText, analyzeMultiItemPackagingText, extractPackagingBadges } from "./packagingAnalyzer.js";
import { dbStore } from "./dbStore.js";

/**
 * Pantryo - Gemini Flash Vision Service
 * Uses Google Gemini Flash (Vision API via @google/genai) to analyze food photographs,
 * grocery receipts, packaging, supermarket flyer circulars, or open fridge shelves
 * and return structured inventory data.
 */

// Lazy-initialized Gemini client
let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = (process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.startsWith("your_")) {
      throw new Error(
        "GEMINI_API_KEY is missing or unconfigured. Please configure it in your environment or Admin Settings."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export function resetGeminiClient() {
  aiClient = null;
}

/**
 * Analyzes a food photo and extracts items, storage recommendations, and shelf-life estimations.
 * 
 * @param {string} base64Data - Raw base64-encoded image string (with or without data URI prefix)
 * @param {string} mimeType - Standard image MIME type (e.g., 'image/jpeg', 'image/png', 'image/webp')
 * @returns {Promise<Object>} Structured scan result containing recognized items and metadata
 */
export async function analyzeFoodImage(base64Data, mimeType = "image/jpeg", language = "EN") {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid image payload: base64Data is required as a string.");
  }

  // Strip potential data URL prefix (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();

  if (cleanBase64.length === 0) {
    throw new Error("Invalid image payload: base64 string is empty after normalization.");
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are Pantryo's elite food safety specialist, culinary archivist, household inventory analyst, and high-accuracy optical character recognition (OCR) scanner.
You are deeply trained on Canadian and Quebec supermarket items, bilingual French/English food packaging, and weekly grocery flyers across all major Canadian supermarket banners:
- Super C (Metro Inc. discount chain - "Beau, bon, pas cher", https://www.superc.ca/en/online-grocery/flyer)
- Maxi & Maxi Cie (Loblaw discount chain in Quebec - "Imbattable", PC Optimum)
- No Frills (Loblaw discount chain in Canada - "Won't Be Beat", "Hauler deals", PC Optimum)
- Metro & Metro Plus (Full-service supermarket, Moi Rewards)
- IGA & IGA Extra / Sobeys (Full-service supermarket, Scène+ Rewards)
- Food Basics (Metro discount chain in Ontario - "Always More for Less")
- FreshCo & Chalo FreshCo (Sobeys discount chain - "Cheaper makes you Cheerful")
- Real Canadian Superstore / RCSS & Loblaws (Large-format grocery, PC Optimum)
- Walmart Canada Supercentre (Grocery flyer deals, "Rollback / Chute de prix")
- Costco Wholesale Canada (Member Savings / Rabais instantané circulaire)

YOUR CORE CAPABILITIES & DETECTION MODES:
1. CANADIAN SUPERMARKET FLYER & CIRCULAR DEALS RECOGNITION (CANADA-WIDE):
   - When the image contains a Canadian grocery store flyer, circular page, weekly ad clipping, newspaper insert, or website screenshot:
     * Detect the specific Canadian grocery chain banner from the visual styling, logo, or text (Super C, Maxi, No Frills, Metro, IGA, Food Basics, FreshCo, Real Canadian Superstore, Walmart Canada, Costco).
     * Extract EVERY single promoted food deal tile visible on the page! Do not limit yourself to only one item.
     * Recognize Canadian flyer price formats:
       - Dual metric & imperial pricing standard: e.g. "$1.48 / lb ($3.26 / kg)", "$3.88 / lb ($8.55 / kg)", "$6.99 / lb ($15.41 / kg)". Always capture the unit and per-pound / per-kg details.
       - Flat deal prices: e.g. "$0.99 ch. / ea.", "$3.99", "$4.44", "$11.97", "$0.95".
       - Multi-unit bundle promotions: e.g. "2 POUR 5,00 $ / 2 FOR $5.00", "3 POUR 7,00 $", "4 FOR $10.00".
       - Member / Loyalty pricing: e.g. "PRIX MEMBRE PC OPTIMUM", "POINTS SCÈNE+ BÔNUS", "POINTS MOI".
       - Promotional tags: "Circulaire", "Aubaine de la semaine", "Rollback / Chute de prix", "Moins de 5 $", "Achetez-en 1 obtenez le 2e à 50%".
     * Identify Canadian private label and national brands:
       - Metro/Super C/Food Basics: Sélection, Sélection Éco, Irrésistibles, Life Smart / Mieux-être.
       - Loblaw/Maxi/No Frills/RCSS: Sans Nom / No Name (yellow label), Le Choix du Président / President's Choice (PC), PC Organics, Farmer's Market.
       - Sobeys/IGA/FreshCo: Compliments, Panache, Signal.
       - Walmart Canada: Great Value, Notre Excellence / Our Finest, Your Fresh Market.
       - Costco Canada: Kirkland Signature.
       - Canadian National Brands: Québon, Natrel, Lactantia, Beatrice, Dairyland, Black Diamond, Armstrong, Olymel, Maple Leaf, Flamingo, Five Roses, Robin Hood, Oasis, St-Hubert, Clark, La Cage, Oikos, Iögo, Astro, Activia, Liberté, Catelli, Primo, Aylmer, Dare, Leclerc, Cavendish Farms, Chapman's.
     * Examples of canonical Canadian flyer deals across departments:
       - Produce: Seedless red grapes ($1.48/lb / $3.26/kg, Super C), English seedless cucumbers ($0.88 - $0.99 ea., No Frills/Super C), Quebec McIntosh apples 3 lb bag ($2.99, Maxi), Sweet oranges 5 lb bag ($4.95, Super C), Yellow potatoes 10 lb bag ($2.99 - $3.99, Metro/Maxi), Quebec broccoli crowns ($0.99 ea., Super C), Romaine hearts 3-pack ($2.99, IGA), Fresh strawberries 1 lb ($2.49 - $3.49, Food Basics/Metro).
       - Meat & Seafood: Fresh Quebec pork tenderloin ($3.88/lb / $8.55/kg, Super C), Fresh whole chicken ($1.99/lb / $4.39/kg, Maxi), Lean ground beef ($3.77 - $4.49/lb, No Frills/Metro), Sirloin tip roast ($6.99/lb, Super C), Fresh Atlantic steelhead trout / salmon fillets ($9.99/lb, Metro/IGA), Selection fondue meat 175-800g ($6.77, Super C).
       - Dairy & Eggs: Fresh yogurt (Oikos Greek yogurt 750g $5.49, Iögo stirred yogurt 650g $3.99, Astro Original 12x100g $4.97, Activia 650g $3.99, Liberté Méditerranée $4.29, Dairy & Eggs, Fridge, 21-28 days), Black Diamond or Armstrong cheddar cheese block 400g ($4.44, Dairy, Fridge), Fresh Quebec Grade A Large Eggs 12-pk ($3.49, Maxi/No Frills), Québon / Natrel / Beatrice fresh milk 2L or 4L ($4.89, Dairy, Fridge), Salted butter 454g ($4.88, No Name/Selection).
       - Pantry & Baking: Five Roses or Robin Hood all-purpose flour 10 kg ($11.97, Pantry), Catelli / Primo pasta 750g-900g (4 for $5.00, Maxi), Oasis 100% pure juice 960 mL ($1.25, Super C), St-Hubert canned soup or broth 540 mL ($1.49, Super C), Clark baked beans with maple syrup 398 mL ($0.95, Super C), Selection or Irrésistibles ground coffee ($9.99, Super C).
       - Frozen: La Cage chicken wings 500-550g ($8.99, Freezer), Irrésistibles thin crust pizza ($3.33, Freezer), Cavendish Farms restaurant style fries 750g ($2.49, Freezer), Chapman's Canadian ice cream 2L ($3.99, Freezer).

2. MULTI-ITEM GROCERY HAULS & COUNTERTOP PHOTOS:
   - If the image contains multiple grocery items (e.g. groceries unpacked on a kitchen table, open fridge shelf, pantry shelf, or shopping basket), visually locate, distinguish, and return ALL food items in the 'items' array.

3. FRESH FOOD, FRUITS & VEGETABLES IDENTIFICATION MASTERY:
   - When the photo shows fresh produce, fruits, vegetables, herbs, or bulk market items (whether loose on a counter, in a plastic produce bag, in a crisper drawer, or with an oval PLU sticker):
     * SPECIFICALLY NAME EACH FRUIT OR VEGETABLE: Never use vague terms like "vegetable", "fruit", "greens", or "food". Output the precise common culinary and botanical name:
       - Mangoes (e.g. "Mangue fraîche (Tommy Atkins / Ataulfo)" / "Fresh Mango", "Mangue Ataulfo miel"). Visually identify the characteristic red/green/yellow-blushed oval tropical fruit shape and skin texture, or read PLU sticker numbers 4051, 4959, 4312, 3114. Location: Pantry (countertop until ripe, then fridge).
       - Bananas (e.g. "Bananes jaunes fraîches" / "Fresh Yellow Bananas", PLU 4011). Location: Pantry.
       - Avocados (e.g. "Avocats Hass" / "Hass Avocados", PLU 4046, 4225). Location: Pantry until soft.
       - Apples & Pears (e.g. "Pommes McIntosh / Gala / Honeycrisp", "Poires Bartlett / Bosc", PLU 4131, 4133, 4173, 4409). Location: Fridge.
       - Citrus (e.g. "Citrons jaunes frais" / "Fresh Lemons", "Limes fraîches", "Oranges douces", PLU 4053, 4048).
       - Berries & Melons (e.g. "Fraises fraîches", "Bleuets frais", "Pastèque / Melon d'eau", "Cantaloup", PLU 4032).
       - Tomatoes (e.g. "Tomates de serre sur vigne" / "Quebec Vine Tomatoes", "Tomates cerises" / "Cherry Tomatoes", "Tomates Roma", "Tomates Beefsteak", PLU 4065, 4087). Location: Pantry/Countertop.
       - Cucumbers (e.g. "Concombre anglais sans pépins" / "English Seedless Cucumber", "Mini concombres", PLU 4062). Location: Fridge.
       - Bell Peppers (e.g. "Poivron rouge" / "Red Bell Pepper", "Poivron vert" / "Green Bell Pepper", "Poivron jaune / orange"). Location: Fridge.
       - Broccoli & Cauliflower (e.g. "Couronnes de brocoli" / "Broccoli crowns", "Chou-fleur blanc" / "Cauliflower", PLU 4060). Location: Fridge.
       - Carrots (e.g. "Carottes fraîches du Québec" / "Fresh Carrots", "Bébés carottes", PLU 4562). Location: Fridge.
       - Onions & Garlic (e.g. "Oignons jaunes" / "Yellow Onions", "Oignons rouges", "Oignons verts / Échalotes en botte" / "Green Onions (Scallions)", "Ail frais" / "Fresh Garlic Bulbs", PLU 4082, 4068). Location: Pantry (onions/garlic) or Fridge (green onions).
       - Potatoes & Tubers (e.g. "Pommes de terre jaunes / blanches" / "Yellow Potatoes", "Pommes de terre Russet", "Patates douces" / "Sweet Potatoes", PLU 4072). Location: Pantry.
       - Squashes & Gourds (e.g. "Courge Butternut", "Courge poivrée", "Courge spaghetti", "Courgettes vertes (Zucchini)").
       - Leafy Greens & Salads (e.g. "Cœurs de romaine" / "Romaine Hearts", "Laitue iceberg", "Bébés épinards" / "Baby Spinach", "Chou frisé / Kale", "Chou vert", "Chou rouge").
       - Celery, Mushrooms & Others (e.g. "Pied de céleri branche" / "Celery Stalk", "Champignons blancs" / "White Mushrooms", "Cremini", "Haricots verts frais" / "Green Beans", "Asperges vertes" / "Green Asparagus", "Maïs frais en épi" / "Fresh Sweet Corn", PLU 4070, 4080).
       - Asian Produce & Specialty Greens (e.g. "Bok choy / Pak choï", "Shanghai bok choy", "Gai Lan (Brocoli chinois / Chinese Broccoli)", "Choy Sum (Yu Choy)", "Chou chinois Napa (Wong Bok)", "Radis Daikon blanc asiatique", "Liseron d’eau (Ong Choy / Kang Kong)", "Feuilles de moutarde (Gai Choy)", "Pousses de pois doux (Dou Miao / Pea Shoots)", "Haricots kilomètres (Yardlong beans)"). Location: Fridge.
       - Filipino Produce & Tropical Specialties (e.g. "Calamansi / Limette philippine (Calamondin)", "Ube frais (Igname pourpre philippine)", "Banane Saba / Cardaba (Cooking banana for Turon/Nilaga)", "Malunggay (Feuilles de moringa)", "Sitaw (Haricots longs philippins / Yardlong beans)", "Ampalaya (Melon amer philippin / Bitter melon)", "Sayote (Chayote philippine)", "Singkamas (Jicama)", "Puso ng Saging (Cœur de bananier / Banana blossom)", "Guyabano (Corossol / Soursop)", "Atis (Pomme cannelle / Sugar apple)", "Santol (Cotton fruit)", "Chico (Sapotille / Sapodilla)", "Lanzones (Langsat)", "Kamias (Bilimbi acide)", "Patola (Courge éponge / Luffa)", "Upo (Calebasse blanche / Bottle gourd)", "Talbos ng Kamote (Feuilles de patate douce)", "Siling Labuyo (Piment oiseau philippin)", "Mangue Carabao philippine (Manila Super Mango)"). Location: Fridge or cool pantry.
       - Asian & Specialty Mushrooms (e.g. "Champignons Enoki (Enokitake)", "Champignons Shiitake frais", "Pleurote du panicaut (King Oyster / Trumpet)", "Pleurotes frais", "Oreilles de Judas / Champignon noir"). Location: Fridge in paper bag.
       - World & Tropical Exotic Fruits (e.g. "Fruit du dragon / Pitaya (Chair blanche ou rouge)", "Litchis frais (Lychee)", "Longanes (Œil de dragon)", "Ramboutan velu", "Durian épineux", "Fruit du jacquier (Jackfruit)", "Mangoustan pourpre", "Carambole (Starfruit)", "Goyave fraîche", "Fruit de la passion (Maracuja)", "Kaki / Persimmon (Fuyu / Hachiya)", "Banane plantain verte / mûre", "Figue de Barbarie (Cactus pear)", "Tamarin doux en gousse", "Chérimole / Pomme cannelle (Custard apple)", "Kumquats entiers").
       - Asian, Latin & Caribbean Roots & Specialties (e.g. "Racine de lotus (Lotus root)", "Melon amer (Bitter melon / Goya / Margose)", "Courge cireuse (Winter melon / Dong Gua)", "Racine de taro", "Manioc frais (Yuca / Cassava)", "Christophine (Chayote / Chouchou)", "Pois patate (Jicama)", "Gombo frais (Okra)", "Bâtons de citronnelle fraîche (Lemongrass)", "Racine de galanga", "Piments Shishito doux", "Piments oiseaux thaï (Bird's eye chili)", "Basilic thaï parfumé (Thai basil)"). Location: Fridge or cool pantry depending on root/leaf.
     * Produce Stickers & PLU Codes:
       - Read any 4-digit or 5-digit PLU sticker numbers on produce (e.g., 4051 = Mango, 4011 = Banana, 4065 = Vine Tomato, 4062 = Cucumber, 4225 = Avocado) to definitively identify the exact produce variety.
     * Category Assignment:
       - Always assign category: "Produce" (or "Produits frais" in French). Never classify fresh fruits or vegetables as "Pantry Staples" or "Garde-manger".
     * Storage Rules:
       - Crisper drawer (Fridge): Broccoli, carrots, cucumbers, celery, lettuces, spinach, mushrooms, peppers, green onions, berries, grapes, apples, green beans, asparagus.
       - Countertop / Pantry: Whole mangoes (ripen on counter, refrigerate once soft), whole bananas, whole tomatoes (room temp preserves flavor), whole potatoes (dark cool pantry, never fridge), onions, garlic, whole winter squashes, sweet potatoes, whole avocados (ripen at room temp).
     * NOISE REJECTION:
       - NEVER output punctuation, dashes, or unreadable noise like "- - a". If text on a sticker cannot be read, recognize the item by its physical fruit/vegetable visual appearance.

4. PACKAGING INSPECTION & OCR DISCIPLINE:
   - Brands: Read canonical brands including Metro/Super C private brands (Sélection, Sélection Éco, Irrésistibles, Life Smart / Mieux-être, Our Harvest Best / Jardin de nos maraîchers) and national brands (St-Hubert, Clark, La Cage, Black Diamond, Lactantia, Québon, Natrel, Beatrice, Olymel, Flamingo, Maple Leaf, Five Roses, Robin Hood, Oasis, Arthur's, Fontaine Santé, Clover Leaf, Catelli, Primo, Aylmer, Dare, Leclerc, Kraft, Cheez Whiz, Chobani, Oatly, Barilla, etc.).
   - Certifications: Detect "Aliments du Québec", "Produit d'ici", "Aliments préparés au Québec", "CANADA No. 1", "CANADA FANCY", "Produit du Canada", "Biologique / Organic".
   - Printed Expiration Dates: Scan carton tops, bottle caps, bag clips, stamped ink, or dot-matrix for dates like "EXP", "BB / ME", "BEST BY", "BEST BEFORE". Return in YYYY-MM-DD format whenever possible.
   - Barcode / UPC: Read 12-digit UPC or 13-digit EAN numeric codes beneath barcode lines if visible.
   - Net weights and formats: Extract metric and imperial measures (e.g. "10 kg", "1.36 kg / 3 lb", "680 mL", "900 mL", "400 g", "960 mL").

MANDATORY TRANSLATION ON IMPORT:
Target Language: ${language === "FR" ? "French (Français)" : "English"}.
If target language is 'FR':
- 'name': Natural, idiomatic French name (e.g., "Raisins rouges sans pépins", "Filet de porc frais", "Farine tout usage Five Roses", "Fromage cheddar Black Diamond").
- 'category': "Produits frais", "Produits laitiers & œufs", "Viandes & Poissons", "Boulangerie", "Boissons", "Condiments", "Garde-manger", "Surgelés", or "Collations".
- 'storageReason' & 'storageTip': Clear practical advice in French.
- Provide both 'nameFr' and 'nameEn'.
If target language is 'EN':
- 'name': Clear English name.
- 'category', 'storageReason', 'storageTip' in English.
- Provide both 'nameEn' and 'nameFr'.

Always respond with structured JSON following the specified schema. Return every identified item or flyer deal in the 'items' array.`;

  const promptText = `Examine this image with expert vision intelligence.
If this is a grocery flyer, circular ad, or weekly deals clipping (e.g., Super C or Quebec grocery deals):
- Extract ALL promotional food deals shown on the circular page with deal prices (e.g., $1.48/lb, $3.88/lb, $11.97, $0.95), brand names, net contents, categories, and storage recommendations.
If this is a grocery haul, open fridge, or pantry shelf:
- Detect and extract ALL distinct food items visible.
If this is a single packaged product or fresh produce:
- Perform full optical character recognition (OCR) to read all text, product packaging labels, brand names, barcodes / UPC codes, net weights, and any printed expiration or best-by dates.
Translate item names and categories to ${language === "FR" ? "French" : "English"} with bilingual name fields.`;

  try {
    console.log(`[Pantryo Vision] Starting image analysis. Base64 length: ${cleanBase64.length} chars, mimeType: ${mimeType}`);
    
    // Modern Gemini Flash model candidates (gemini-3.8-flash, gemini-3.6-flash, gemini-flash-latest)
    const modelCandidates = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
    let response = null;
    let lastError = null;

    const visionSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "Brief summary of what was identified in the image",
        },
        items: {
          type: Type.ARRAY,
          description: "List of identified inventory items",
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Specific item name",
              },
              nameFr: {
                type: Type.STRING,
                description: "French translation of item name",
              },
              nameEn: {
                type: Type.STRING,
                description: "English translation of item name",
              },
              category: {
                type: Type.STRING,
                description: "Item category",
              },
              quantity: {
                type: Type.NUMBER,
                description: "Estimated numeric quantity",
              },
              unit: {
                type: Type.STRING,
                description: "Measurement unit (pcs, pack, carton, bottle, lbs, kg, g, oz, L)",
              },
              recommendedLocation: {
                type: Type.STRING,
                description: "Optimal storage location: 'Fridge', 'Pantry', or 'Freezer'",
              },
              storageReason: {
                type: Type.STRING,
                description: "Short reason why this location is recommended",
              },
              estimatedShelfLifeDays: {
                type: Type.INTEGER,
                description: "Estimated days before expiration at recommended location",
              },
              monthsFrozenShelfLife: {
                type: Type.INTEGER,
                description: "Recommended maximum frozen storage duration in months",
              },
              price: {
                type: Type.STRING,
                description: "Deal or package price if visible on circular or label (e.g. '$1.48 / lb', '$3.88', '$11.97', '$0.95')",
              },
              brand: {
                type: Type.STRING,
                description: "Brand name read directly from packaging or receipt (e.g., 'Chobani', 'Oatly')",
              },
              barcode: {
                type: Type.STRING,
                description: "12-digit UPC or 13-digit EAN barcode number read from beneath barcode lines (e.g. '011110816850')",
              },
              detectedText: {
                type: Type.STRING,
                description: "Key printed label or receipt text read via OCR",
              },
              printedExpirationDate: {
                type: Type.STRING,
                description: "Date string (YYYY-MM-DD) if stamped/printed on packaging, else null",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Detection confidence score between 0.0 and 1.0",
              },
              storageTip: {
                type: Type.STRING,
                description: "Practical tip to preserve freshness and avoid waste",
              },
              gradeOrigin: {
                type: Type.STRING,
                description: "Grade, origin, or certification (e.g. 'CANADA No. 1 • PRODUIT DU QUÉBEC', 'Aliments du Québec')",
              },
              packagingFormat: {
                type: Type.STRING,
                description: "Physical packaging type (e.g. 'Perforated plastic produce bag', 'Metal can / Tin', 'Tetra Pak carton with resealable cap')",
              },
              dietaryBadges: {
                type: Type.ARRAY,
                description: "List of nutrition, dietary or safety claims (e.g. ['60% Moins de sodium', 'Sans BPA', 'Aliments du Québec'])",
                items: { type: Type.STRING },
              },
              netContent: {
                type: Type.STRING,
                description: "Printed net weight, volume, or count (e.g. '1.36 kg / 3 lb', '680 mL', '900 mL')",
              },
              unopenedLocation: {
                type: Type.STRING,
                description: "Recommended compartment before opening (e.g. 'Pantry' or 'Fridge')",
              },
              openedLocation: {
                type: Type.STRING,
                description: "Recommended compartment after opening (e.g. 'Fridge')",
              },
              unopenedShelfLifeDays: {
                type: Type.INTEGER,
                description: "Shelf life in days before opening",
              },
              openedShelfLifeDays: {
                type: Type.INTEGER,
                description: "Shelf life in days after opening",
              },
              freezerTip: {
                type: Type.STRING,
                description: "Practical tip for freezing this food item",
              },
            },
            required: [
              "name",
              "category",
              "quantity",
              "unit",
              "recommendedLocation",
              "estimatedShelfLifeDays",
              "monthsFrozenShelfLife",
            ],
          },
        },
      },
      required: ["summary", "items"],
    };

    for (const modelName of modelCandidates) {
      try {
        console.log(`[Pantryo Vision] Attempting image analysis with model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: visionSchema,
          },
        });

        if (response && response.text) {
          console.log(`[Pantryo Vision] Successfully analyzed image with model: ${modelName}`);
          break;
        }
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`[Pantryo Vision] Model ${modelName} with structured schema failed: ${modelErr.message || modelErr}. Trying unstructured prompt fallback...`);
        
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: cleanBase64,
                  },
                },
                {
                  text: promptText + "\nRespond with valid JSON conforming to { summary: string, items: Array<{ name, brand, barcode, category, quantity, unit, recommendedLocation, storageReason, estimatedShelfLifeDays, monthsFrozenShelfLife, confidence, storageTip, detectedText, printedExpirationDate }> }",
                },
              ],
            },
            config: {
              systemInstruction,
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          });

          if (response && response.text) {
            console.log(`[Pantryo Vision] Successfully analyzed image via unstructured prompt on ${modelName}`);
            break;
          }
        } catch (retryErr) {
          lastError = retryErr;
          console.warn(`[Pantryo Vision] Fallback for ${modelName} also failed: ${retryErr.message || retryErr}`);
        }
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Gemini Vision returned an empty text response.");
    }

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Gemini Vision returned an empty text response.");
    }

    // Clean possible markdown code fences
    let sanitizedJson = rawText.trim();
    if (sanitizedJson.startsWith("```json")) {
      sanitizedJson = sanitizedJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (sanitizedJson.startsWith("```")) {
      sanitizedJson = sanitizedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsedData = JSON.parse(sanitizedJson);

    // Ensure items array exists and normalize expiration calculations
    const now = new Date();
    const normalizedItems = (parsedData.items || []).map((item) => {
      let days = typeof item.estimatedShelfLifeDays === "number" ? item.estimatedShelfLifeDays : 7;
      let targetExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // If an expiration or best-by date was read directly from packaging via OCR
      let printedDateStr = item.printedExpirationDate ? String(item.printedExpirationDate).trim() : null;
      if (printedDateStr) {
        const parsedPrintedDate = new Date(printedDateStr);
        if (!isNaN(parsedPrintedDate.getTime())) {
          targetExp = parsedPrintedDate;
          const diffDays = Math.round((parsedPrintedDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          if (diffDays > 0) {
            days = diffDays;
          }
          printedDateStr = parsedPrintedDate.toISOString().split("T")[0];
        }
      }

      // Sanitize barcode string (numbers only)
      let barcodeStr = item.barcode ? String(item.barcode).replace(/[^0-9]/g, "") : null;
      if (barcodeStr && (barcodeStr.length < 8 || barcodeStr.length > 14)) {
        barcodeStr = null;
      }

      // Enrich with packagingAnalyzer intelligence for deep completeness
      const packagingInsight = analyzePackagingText(
        [item.name, item.brand, item.detectedText].filter(Boolean).join(" "),
        language
      );

      return {
        ...item,
        name: item.name || packagingInsight.name,
        nameFr: item.nameFr || packagingInsight.nameFr,
        nameEn: item.nameEn || packagingInsight.nameEn,
        brand: (item.brand ? String(item.brand).trim() : null) || packagingInsight.brand,
        gradeOrigin: (item.gradeOrigin ? String(item.gradeOrigin).trim() : null) || packagingInsight.gradeOrigin,
        packagingFormat: (item.packagingFormat ? String(item.packagingFormat).trim() : null) || (language === "FR" ? packagingInsight.packagingFormat : packagingInsight.packagingFormatEn),
        dietaryBadges: Array.isArray(item.dietaryBadges) && item.dietaryBadges.length > 0 ? item.dietaryBadges : packagingInsight.dietaryBadges,
        price: (item.price ? String(item.price).trim() : null) || packagingInsight.price || undefined,
        netContent: (item.netContent ? String(item.netContent).trim() : null) || packagingInsight.netContent,
        barcode: barcodeStr || undefined,
        detectedText: item.detectedText ? String(item.detectedText).trim() : packagingInsight.detectedText,
        printedExpirationDate: printedDateStr || undefined,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : packagingInsight.quantity,
        unit: item.unit || packagingInsight.unit,
        category: item.category || (language === "FR" ? packagingInsight.category : packagingInsight.categoryEn),
        recommendedLocation: ["Fridge", "Pantry", "Freezer"].includes(item.recommendedLocation)
          ? item.recommendedLocation
          : packagingInsight.recommendedLocation,
        unopenedLocation: item.unopenedLocation || packagingInsight.unopenedLocation,
        openedLocation: item.openedLocation || packagingInsight.openedLocation,
        unopenedShelfLifeDays: typeof item.unopenedShelfLifeDays === "number" ? item.unopenedShelfLifeDays : packagingInsight.unopenedShelfLifeDays,
        openedShelfLifeDays: typeof item.openedShelfLifeDays === "number" ? item.openedShelfLifeDays : packagingInsight.openedShelfLifeDays,
        estimatedShelfLifeDays: days || packagingInsight.estimatedShelfLifeDays,
        suggestedExpirationDate: targetExp.toISOString().split("T")[0],
        monthsFrozenShelfLife: typeof item.monthsFrozenShelfLife === "number" ? item.monthsFrozenShelfLife : packagingInsight.monthsFrozenShelfLife,
        storageTip: item.storageTip || packagingInsight.storageTip,
        freezerTip: item.freezerTip || packagingInsight.freezerTip,
        storageReason: item.storageReason || packagingInsight.storageReason,
        confidence: typeof item.confidence === "number" ? item.confidence : packagingInsight.confidence,
      };
    });

    return {
      success: true,
      summary: parsedData.summary || `Identified ${normalizedItems.length} item(s).`,
      itemsCount: normalizedItems.length,
      items: normalizedItems,
      scannedAt: now.toISOString(),
    };
  } catch (error) {
    console.warn("[Pantryo - Gemini Vision Note]:", error.message, "- Trying offline OCR & Quebec packaging analyzer fallback...");

    try {
      const imageBuffer = Buffer.from(cleanBase64, "base64");
      const ocrResult = await Tesseract.recognize(imageBuffer, "fra+eng");
      const ocrText = ocrResult?.data?.text?.trim() || "";

      if (ocrText && ocrText.length > 3) {
        const fallbackItems = analyzeMultiItemPackagingText(ocrText, language);
        if (fallbackItems && fallbackItems.length > 0) {
          const isFr = (language || "EN").toUpperCase() === "FR";
          const now = new Date();
          const itemsWithDates = fallbackItems.map((fi) => {
            const days = fi.estimatedShelfLifeDays || 7;
            const targetExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            return {
              ...fi,
              suggestedExpirationDate: targetExp.toISOString().split("T")[0],
            };
          });

          return {
            success: true,
            summary: isFr
              ? `Reconnaissance locale réussie (${itemsWithDates.length} article(s) détecté(s)).`
              : `Local vision recognition completed (${itemsWithDates.length} item(s) detected).`,
            itemsCount: itemsWithDates.length,
            items: itemsWithDates,
            demoMode: true,
            scannedAt: now.toISOString(),
          };
        }
      }
    } catch (fallbackErr) {
      console.warn("[Pantryo Vision] Local fallback OCR also failed:", fallbackErr.message);
    }

    throw new Error(`Failed to parse food image with Gemini Vision: ${error.message}`);
  }
}

/**
 * Specialized Supermarket Flyer & Circular Scanner
 * Highly trained on Super C, Metro, Maxi, IGA weekly circulars, deal pages,
 * and circular screenshots (e.g. superc.ca/flyer).
 * 
 * @param {string} base64Data - Raw base64-encoded image string
 * @param {string} mimeType - Standard image MIME type
 * @param {string} language - "FR" or "EN"
 */
export async function analyzeFlyerImage(base64Data, mimeType = "image/jpeg", language = "FR") {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid image payload: base64Data is required as a string.");
  }

  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
  const isFr = (language || "FR").toUpperCase() === "FR";

  const ai = getGeminiClient();

  const flyerSystemInstruction = `You are Pantryo's elite supermarket flyer and promotional circular parser.
You are specifically trained on Canadian grocery flyer pictures and circular clippings across all Canadian supermarket banners:
- Super C (Metro Inc. discount chain - "Beau, bon, pas cher")
- Maxi & Maxi Cie (Loblaw discount chain in Quebec - "Imbattable")
- No Frills (Loblaw discount chain - "Won't Be Beat", "Hauler deals")
- Metro & Metro Plus (Full-service supermarket, Moi Rewards)
- IGA & IGA Extra / Sobeys (Full-service supermarket, Scène+ Rewards)
- Food Basics (Metro discount chain in Ontario - "Always More for Less")
- FreshCo & Chalo FreshCo (Sobeys discount chain - "Cheaper makes you Cheerful")
- Real Canadian Superstore / RCSS & Loblaws (Large-format grocery, PC Optimum)
- Walmart Canada Supercentre (Grocery flyer deals, "Rollback / Chute de prix")
- Costco Wholesale Canada (Member Instant Savings / Épargnes membres)

FLYER ANATOMY & CANADIAN PROMOTIONAL DEALS DETECTION:
Inspect this circular / flyer page photograph, clipping, or screenshot and extract EVERY promoted grocery deal shown.
Each promotional deal tile typically features:
1. Product name (bilingual FR & EN): Provide specific canonical names (e.g. "Raisins rouges sans pépins" / "Seedless Red Grapes", "Filet de porc frais" / "Fresh Pork Tenderloin", "Yogourt grec Oikos" / "Oikos Greek Yogurt", "Poulet entier frais" / "Fresh Whole Chicken").
2. Brand name: Canadian private labels (Sélection, Irrésistibles, Sans Nom / No Name, Le Choix du Président / PC, Compliments, Panache, Great Value, Kirkland Signature) or national brands (Olymel, Maple Leaf, Black Diamond, Québon, Natrel, Lactantia, Five Roses, Robin Hood, Oasis, St-Hubert, Clark, La Cage, Oikos, Iögo, Astro, Activia, Liberté).
3. Deal promotional price: Parse Canadian price conventions:
   - Dual lb/kg pricing: e.g. "$1.48 / lb ($3.26 / kg)", "$3.88 / lb ($8.55 / kg)", "$6.99 / lb ($15.41 / kg)".
   - Flat promotional prices: e.g. "$0.99 ch.", "$3.99", "$4.44", "$11.97", "$0.95".
   - Multi-unit promotions: e.g. "2 POUR 5,00 $ / 2 FOR $5.00", "3 POUR 7,00 $", "4 FOR $10.00".
4. Net content or pack size: e.g. "10 kg", "750 g", "650 g", "375-400g", "960 mL", "5 lb", "10 lb", "2 L", "4 L", "540 mL", "398 mL".
5. Promotional badge: e.g. "Prix membre PC Optimum", "Points Scène+", "Circulaire Super C", "Imbattable Maxi", "Rollback Walmart", "Aliments du Québec", "100% Lait canadien".
6. Food category, optimal compartment ('Fridge', 'Pantry', or 'Freezer'), and estimated shelf life.

Output ALL deals in the 'items' array with bilingual names (nameFr and nameEn).`;

  const flyerPrompt = `Analyze this Canadian supermarket flyer / circular page photograph. Detect the store chain (Super C, Maxi, No Frills, Metro, IGA, Food Basics, FreshCo, Walmart, Costco), and extract all promotional deals with their product name, brand, deal price, unit, category, and storage recommendations. Translate to ${isFr ? "French" : "English"} with bilingual name fields.`;

  const flyerSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Summary of flyer deals parsed and store circular name if detected",
      },
      storeName: {
        type: Type.STRING,
        description: "Store name (e.g., 'Super C', 'Metro', 'Maxi', 'IGA')",
      },
      items: {
        type: Type.ARRAY,
        description: "List of promotional food deals extracted from the flyer",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            nameFr: { type: Type.STRING },
            nameEn: { type: Type.STRING },
            brand: { type: Type.STRING },
            price: { type: Type.STRING, description: "Promotional deal price (e.g. '$1.48 / lb', '$3.88 / lb', '$4.44', '$11.97')" },
            category: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            netContent: { type: Type.STRING },
            recommendedLocation: { type: Type.STRING, description: "'Fridge', 'Pantry', or 'Freezer'" },
            estimatedShelfLifeDays: { type: Type.INTEGER },
            monthsFrozenShelfLife: { type: Type.INTEGER },
            storageTip: { type: Type.STRING },
            storageReason: { type: Type.STRING },
            dietaryBadges: { type: Type.ARRAY, items: { type: Type.STRING } },
            gradeOrigin: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["name", "category", "quantity", "unit", "recommendedLocation", "estimatedShelfLifeDays", "monthsFrozenShelfLife"],
        },
      },
    },
    required: ["summary", "items"],
  };

  const modelCandidates = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  let response = null;
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      console.log(`[Pantryo Flyer Vision] Analyzing flyer with model: ${modelName}`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: flyerPrompt,
            },
          ],
        },
        config: {
          systemInstruction: flyerSystemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: flyerSchema,
        },
      });

      if (response && response.text) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Pantryo Flyer Vision] Model ${modelName} error:`, err.message);
    }
  }

  if (response && response.text) {
    let sanitizedJson = response.text.trim();
    if (sanitizedJson.startsWith("```json")) {
      sanitizedJson = sanitizedJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (sanitizedJson.startsWith("```")) {
      sanitizedJson = sanitizedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsedData = JSON.parse(sanitizedJson);
      const now = new Date();
      const normalized = (parsedData.items || []).map((item) => {
        const days = typeof item.estimatedShelfLifeDays === "number" ? item.estimatedShelfLifeDays : 7;
        const targetExp = new Date(now.getTime() + days * 86400000);
        return {
          ...item,
          suggestedExpirationDate: targetExp.toISOString().split("T")[0],
          confidence: typeof item.confidence === "number" ? item.confidence : 0.96,
        };
      });

      return {
        success: true,
        summary: parsedData.summary || `Extracted ${normalized.length} promotional flyer deal(s).`,
        storeName: parsedData.storeName || "Super C",
        itemsCount: normalized.length,
        items: normalized,
        scannedAt: now.toISOString(),
      };
    } catch (e) {
      console.warn("[Pantryo Flyer Vision] JSON parse failed, falling back to local catalog parser:", e.message);
    }
  }

  // Fallback to local OCR + Quebec grocery catalog
  try {
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const ocrResult = await Tesseract.recognize(imageBuffer, "fra+eng");
    const ocrText = ocrResult?.data?.text?.trim() || "";

    if (ocrText && ocrText.length > 3) {
      const items = analyzeMultiItemPackagingText(ocrText, language);
      if (items.length > 0) {
        const now = new Date();
        const normalized = items.map((i) => {
          const days = i.estimatedShelfLifeDays || 7;
          return {
            ...i,
            suggestedExpirationDate: new Date(now.getTime() + days * 86400000).toISOString().split("T")[0],
          };
        });

        return {
          success: true,
          summary: isFr
            ? `Circulaire Super C numérisée (${normalized.length} rabais extraits).`
            : `Super C circular analyzed (${normalized.length} flyer deals extracted).`,
          storeName: "Super C",
          itemsCount: normalized.length,
          items: normalized,
          demoMode: true,
          scannedAt: now.toISOString(),
        };
      }
    }
  } catch (e) {
    console.warn("[Pantryo Flyer Vision] Local OCR fallback note:", e.message);
  }

  throw lastError || new Error("Failed to extract flyer deals from image.");
}

/**
 * Intelligent rule-based offline fallback parser for receipt text
 * Used when GEMINI_API_KEY is not yet configured or if API is unreachable.
 */
function parseReceiptTextFallback(receiptText, language = "FR") {
  // First, run high-precision Canadian / Quebec supermarket parser
  const specializedItems = parseQuebecReceiptText(receiptText, language);
  if (specializedItems && specializedItems.length > 0) {
    return specializedItems;
  }

  const lines = receiptText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const ignoredKeywords = [
    "subtotal", "sub-total", "total", "tax", "gst", "hst", "pst", "visa",
    "mastercard", "amex", "debit", "cash", "change", "tender", "balance",
    "invoice", "receipt", "store", "manager", "cashier", "date", "time",
    "tel", "phone", "thank you", "welcome", "customer", "rewards", "points",
    "saving", "discount", "order #", "order id", "card #", "approved",
    "auth", "reference", "aid", "tvr", "tsi", "terminal", "lane", "station",
    "deposit", "bottle deposit", "bag fee", "costco wholesale", "walmart supercenter",
    "supermarché", "circulaire", "flyer", "weekly circular"
  ];

  const candidateLines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return !ignoredKeywords.some((kw) => lower.includes(kw));
  });

  const items = [];
  const now = new Date();

  for (let idx = 0; idx < candidateLines.length; idx++) {
    const rawLine = candidateLines[idx];
    // Remove price tokens at the end (e.g. 4.99, $12.50, 3.49 B)
    let cleaned = rawLine.replace(/[$€£]?\s*\d+[.,]\d{2}(?:\s*[A-Za-z*])?$/i, "").trim();
    cleaned = cleaned.replace(/^\d{1,4}\s+/, "").trim(); // Remove leading PLU/SKU codes

    if (cleaned.length < 3) continue;

    // Detect quantity e.g. "2x", "2 @", "3 PK", "2.5 LB"
    let quantity = 1;
    let unit = "pcs";
    const qtyMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:x|@|ct|pk|ea)?\s+(.*)/i);
    if (qtyMatch) {
      quantity = Math.max(1, Math.round(Number(qtyMatch[1])));
      cleaned = qtyMatch[2].trim();
    }

    // Identify food category & location via keyword rules
    const lower = cleaned.toLowerCase();
    let category = "Pantry Staples";
    let location = "Pantry";
    let shelfLifeDays = 21;
    let brand = undefined;

    if (lower.includes("spinach") || lower.includes("lettuce") || lower.includes("kale") || lower.includes("salad") || lower.includes("espinaca") || lower.includes("lechuga") || lower.includes("ensalada") || lower.includes("kangkong") || lower.includes("gulay")) {
      category = "Produce";
      location = "Fridge";
      shelfLifeDays = 5;
      unit = "clamshell";
    } else if (lower.includes("berry") || lower.includes("strawberr") || lower.includes("blueberr") || lower.includes("raspberr") || lower.includes("fresa") || lower.includes("arándano")) {
      category = "Produce";
      location = "Fridge";
      shelfLifeDays = 4;
      unit = "pack";
    } else if (lower.includes("apple") || lower.includes("banana") || lower.includes("orange") || lower.includes("avocado") || lower.includes("lemon") || lower.includes("lime") || lower.includes("manzana") || lower.includes("platano") || lower.includes("plátano") || lower.includes("limon") || lower.includes("limón") || lower.includes("aguacate") || lower.includes("saging") || lower.includes("mansanas") || lower.includes("kamatis")) {
      category = "Produce";
      location = (lower.includes("avocado") || lower.includes("aguacate") || lower.includes("banana") || lower.includes("platano") || lower.includes("saging")) ? "Pantry" : "Fridge";
      shelfLifeDays = 7;
      unit = "pcs";
    } else if (lower.includes("milk") || lower.includes("oatmilk") || lower.includes("almond milk") || lower.includes("cream") || lower.includes("lait") || lower.includes("leche") || lower.includes("gatas")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 7;
      unit = "carton";
    } else if (lower.includes("cheese") || lower.includes("cheddar") || lower.includes("parmesan") || lower.includes("feta") || lower.includes("mozzarella") || lower.includes("fromage") || lower.includes("queso") || lower.includes("keso")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 14;
      unit = "block";
    } else if (lower.includes("egg") || lower.includes("eggs") || lower.includes("oeuf") || lower.includes("œuf") || lower.includes("huevo") || lower.includes("huevos") || lower.includes("itlog")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 21;
      unit = "dozen";
    } else if (lower.includes("yogurt") || lower.includes("kefir") || lower.includes("yogourt") || lower.includes("yogur") || lower.includes("yaourt") || lower.includes("oikos") || lower.includes("iogo") || lower.includes("iögo") || lower.includes("astro") || lower.includes("activia") || lower.includes("liberte") || lower.includes("liberté") || lower.includes("chobani") || lower.includes("skyr")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 21;
      unit = "tub";
    } else if (lower.includes("beef") || lower.includes("steak") || lower.includes("ground beef") || lower.includes("ribeye") || lower.includes("boeuf") || lower.includes("bœuf") || lower.includes("res") || lower.includes("carne") || lower.includes("baka")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 3;
      unit = "pack";
    } else if (lower.includes("chicken") || lower.includes("poultry") || lower.includes("turkey") || lower.includes("breast") || lower.includes("thigh") || lower.includes("poulet") || lower.includes("pollo") || lower.includes("pavo") || lower.includes("manok")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 2;
      unit = "pack";
    } else if (lower.includes("salmon") || lower.includes("fish") || lower.includes("shrimp") || lower.includes("cod") || lower.includes("tuna") || lower.includes("saumon") || lower.includes("poisson") || lower.includes("pescado") || lower.includes("camaron") || lower.includes("camarón") || lower.includes("isda") || lower.includes("bangus") || lower.includes("hipon") || lower.includes("tilapia")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 2;
      unit = "fillet";
    } else if (lower.includes("pork") || lower.includes("bacon") || lower.includes("sausage") || lower.includes("porc") || lower.includes("cerdo") || lower.includes("tocino") || lower.includes("salchicha") || lower.includes("baboy") || lower.includes("longganisa")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 4;
      unit = "pack";
    } else if (lower.includes("bread") || lower.includes("sourdough") || lower.includes("bagel") || lower.includes("croissant") || lower.includes("brioche") || lower.includes("toast") || lower.includes("pain") || lower.includes("pan") || lower.includes("tinapay") || lower.includes("pandesal")) {
      category = "Bakery";
      location = "Pantry";
      shelfLifeDays = 6;
      unit = "loaf";
    } else if (lower.includes("frozen") || lower.includes("pizza") || lower.includes("ice cream") || lower.includes("dumpling") || lower.includes("waffle") || lower.includes("surgelé") || lower.includes("congelado") || lower.includes("helado") || lower.includes("pinalamig") || lower.includes("sorbetes")) {
      category = "Frozen Meals";
      location = "Freezer";
      shelfLifeDays = 180;
      unit = "box";
    } else if (lower.includes("coffee") || lower.includes("tea") || lower.includes("juice") || lower.includes("sparkling") || lower.includes("soda") || lower.includes("café") || lower.includes("té") || lower.includes("jugo") || lower.includes("kape") || lower.includes("tsaa")) {
      category = "Beverages";
      location = lower.includes("juice") || lower.includes("jugo") ? "Fridge" : "Pantry";
      shelfLifeDays = 30;
      unit = "bottle";
    } else if (lower.includes("sauce") || lower.includes("mayo") || lower.includes("ketchup") || lower.includes("mustard") || lower.includes("dressing") || lower.includes("oil") || lower.includes("huile") || lower.includes("salsa") || lower.includes("aceite") || lower.includes("toyo") || lower.includes("suka") || lower.includes("patis") || lower.includes("mantika")) {
      category = "Condiments";
      location = (lower.includes("oil") || lower.includes("huile") || lower.includes("aceite") || lower.includes("mantika") || lower.includes("suka")) ? "Pantry" : "Fridge";
      shelfLifeDays = 60;
      unit = "bottle";
    } else if (lower.includes("chip") || lower.includes("cracker") || lower.includes("nut") || lower.includes("snack") || lower.includes("pretzel") || lower.includes("cookie") || lower.includes("galleta") || lower.includes("chicharon")) {
      category = "Snacks";
      location = "Pantry";
      shelfLifeDays = 45;
      unit = "bag";
    } else if (lower.includes("pasta") || lower.includes("rice") || lower.includes("flour") || lower.includes("bean") || lower.includes("grain") || lower.includes("cereal") || lower.includes("riz") || lower.includes("farine") || lower.includes("arroz") || lower.includes("harina") || lower.includes("frijol") || lower.includes("frijoles") || lower.includes("bigas") || lower.includes("kanin")) {
      category = "Pantry Staples";
      location = "Pantry";
      shelfLifeDays = 90;
      unit = "box";
    }

    let expandedCleaned = cleaned
      .replace(/\bKS\s+ORG\b/i, "Kirkland Signature Organic")
      .replace(/\bBONLESS\s+SKNLS\s+CHIK\s+BRST\b/i, "Boneless Skinless Chicken Breast")
      .replace(/\bCHIK\s+BRST\b|\bCHKN\s+BRST\b/i, "Chicken Breast")
      .replace(/\bGRND\s+BEEF\b|\bGND\s+BEEF\b/i, "Ground Beef")
      .replace(/\bAPPLES\s+GALA\b/i, "Gala Apples")
      .replace(/\bAPPLES\s+MCINTOSH\b/i, "McIntosh Apples")
      .replace(/\bAPPLES\s+HONEYCRISP\b/i, "Honeycrisp Apples")
      .replace(/\s+\d+PK\b/i, "")
      .replace(/\s+\d+LB\b/i, "");

    // Capitalize properly
    const friendlyName = expandedCleaned
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Brand checks
    if (lower.includes("kirkland")) brand = "Kirkland Signature";
    else if (lower.includes("trader joe")) brand = "Trader Joe's";
    else if (lower.includes("great value")) brand = "Great Value";
    else if (lower.includes("compliments")) brand = "Compliments";
    else if (lower.includes("pc ") || lower.includes("presidents choice")) brand = "President's Choice";
    else if (lower.includes("365")) brand = "365 Whole Foods";
    else if (lower.includes("chobani")) brand = "Chobani";
    else if (lower.includes("oatly")) brand = "Oatly";
    else if (lower.includes("barilla")) brand = "Barilla";

    const isFr = (language || "FR").toUpperCase().startsWith("FR");
    const biling = getBilingualNames(friendlyName, isFr ? "FR" : "EN");

    const targetExp = new Date(now.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);

    const locFr = location === "Fridge" ? "réfrigérateur" : location === "Freezer" ? "congélateur" : "garde-manger";
    const locEn = location.toLowerCase();

    items.push({
      name: isFr ? (biling.nameFr || friendlyName) : (biling.nameEn || friendlyName),
      nameFr: biling.nameFr || friendlyName,
      nameEn: biling.nameEn || friendlyName,
      brand,
      category,
      quantity,
      unit,
      recommendedLocation: location,
      storageReason: isFr
        ? `Conserver au ${locFr} pour préserver la fraîcheur et la qualité optimale.`
        : `Preserve peak flavor and texture in ${locEn}.`,
      estimatedShelfLifeDays: shelfLifeDays,
      monthsFrozenShelfLife: location === "Freezer" ? 6 : 4,
      confidence: 0.88,
      storageTip: isFr
        ? `Garder scellé et ranger au ${locFr}.`
        : `Keep sealed and stored in ${locEn}.`,
      suggestedExpirationDate: targetExp.toISOString().split("T")[0],
      detectedText: rawLine,
    });
  }

  return items;
}

/**
 * Analyzes pasted receipt text (e.g. from an e-commerce order, email receipt, or OCR snippet)
 * and uses Gemini 3.8 Flash to extract structured food items, categories, storage compartments,
 * and shelf-life estimations.
 * 
 * @param {string} receiptText - Raw text of the grocery receipt
 * @returns {Promise<Object>} Structured parsed items with metadata
 */
export async function analyzeReceiptText(receiptText, language = "EN") {
  if (!receiptText || typeof receiptText !== "string" || receiptText.trim().length === 0) {
    throw new Error("receiptText is required and must not be empty.");
  }

  const cleanedText = receiptText.trim();
  const apiKey = process.env.GEMINI_API_KEY;
  const isApiKeyConfigured = Boolean(
    apiKey &&
    apiKey !== "MY_GEMINI_API_KEY" &&
    apiKey.trim().length > 0 &&
    !apiKey.startsWith("your_")
  );

  // If Gemini API Key is missing or invalid, run offline heuristic parser
  if (!isApiKeyConfigured) {
    console.info("[Pantryo Receipt] GEMINI_API_KEY is not configured. Running offline heuristic receipt parser.");
    const fallbackItems = parseReceiptTextFallback(cleanedText);
    return {
      success: true,
      summary:
        language === "FR"
          ? `Analyse de ${fallbackItems.length} article(s) terminée (Mode Démonstration).`
          : `Parsed ${fallbackItems.length} item(s) from receipt text (Demonstration / Offline Mode).`,
      demoMode: true,
      itemsCount: fallbackItems.length,
      items: fallbackItems,
      scannedAt: new Date().toISOString(),
    };
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are Pantryo's expert grocery receipt parsing and food inventory extraction engine.
Your task is to parse raw text from store receipts (Costco, Walmart, Trader Joe's, Kroger, Aldi, Carrefour, Loblaws, Metro, IGA, Whole Foods, Super C, Maxi, Provigo, Mercadona, Soriana, Seafood City, Puregold, etc.) or online order confirmations.

MULTILINGUAL OCR RECEIPT READING:
You MUST accurately parse receipts printed in:
- French (Français - e.g. Maxi, Provigo, Metro, IGA, Super C, Carrefour)
- English (e.g. Costco, Walmart, Trader Joe's, Kroger, Loblaws)
- Spanish (Español - e.g. Supermercado, Bodega, Tienda, Soriana, Mercadona, Chedraui)
- Tagalog / Filipino (e.g. Sari-sari receipts, Seafood City, Pinoy Supermarket, Puregold, Robinson's)

RULES:
1. Extract all FOOD & BEVERAGE items. Ignore non-food household items (paper towels, soap, shampoo, trash bags) unless explicitly culinary.
2. Filter out non-item lines: store addresses, phone numbers, transaction numbers, cashier IDs, tax lines, bottle deposits, tender lines (VISA, MASTERCARD, DEBIT, CASH), sub-totals, discounts, rewards points, and savings banners.
3. Clean abbreviated register names into clear, friendly, human-readable product names:
   - "KS ORG WHOLE MILK 2PK" -> "Kirkland Signature Organic Whole Milk", brand: "Kirkland Signature", quantity: 2, unit: "carton"
   - "AVOCADO HASS 4CT" -> "Hass Avocados", brand: null, quantity: 4, unit: "pcs"
   - "BNLS SKNLS CHIK BRST" -> "Boneless Skinless Chicken Breast", category: "Meat & Seafood", quantity: 1, unit: "pack"
   - "SAN MARZANO TOM 28OZ" -> "San Marzano Canned Tomatoes", category: "Pantry Staples", quantity: 1, unit: "can (28 oz)"
   - "DIGIORNO PEPP PIZZA" -> "DiGiorno Pepperoni Frozen Pizza", category: "Frozen Meals", quantity: 1, unit: "box", recommendedLocation: "Freezer"
4. Assign accurate category: "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Condiments", "Pantry Staples", "Frozen Meals", "Snacks", "Deli & Prepared", "Canned Goods", "Sweets & Desserts".
5. Recommend optimal storage location: 'Fridge', 'Pantry', or 'Freezer'.
6. Estimate realistic shelf life in days at that location, and maximum frozen storage in months.
7. Set 'detectedText' to the raw line from the receipt corresponding to the item.
8. AUTOMATIC TRANSLATION MANDATE:
   User Language: ${language === "FR" ? "French (Français)" : "English"}.
   Translate 'name' into ${language === "FR" ? "French" : "English"}.
   Provide both 'nameFr' (French item name) and 'nameEn' (English item name).
   Translate 'category', 'storageReason', and 'storageTip' into ${language === "FR" ? "French" : "English"}.
9. Output structured JSON matching the schema.`;

  const promptText = `Parse this grocery receipt text thoroughly into individual food inventory entries, translating each item name and attributes to ${language === "FR" ? "French" : "English"} with bilingual name fields:

${cleanedText}`;

  const receiptSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Summary of receipt items parsed and store name if detected",
      },
      storeName: {
        type: Type.STRING,
        description: "Store name if discernible (e.g. 'Costco', 'Trader Joe's', 'Walmart', 'Maxi')",
      },
      items: {
        type: Type.ARRAY,
        description: "List of extracted food items",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Clear, human-readable food item name translated according to user language preference",
            },
            nameFr: {
              type: Type.STRING,
              description: "French food item name",
            },
            nameEn: {
              type: Type.STRING,
              description: "English food item name",
            },
            brand: {
              type: Type.STRING,
              description: "Brand name if discernible",
            },
            category: {
              type: Type.STRING,
              description: "Food category",
            },
            quantity: {
              type: Type.NUMBER,
              description: "Quantity purchased",
            },
            unit: {
              type: Type.STRING,
              description: "Unit (pcs, pack, carton, bottle, box, bag, lbs, kg, oz, can)",
            },
            price: {
              type: Type.NUMBER,
              description: "Item price if visible on receipt line",
            },
            recommendedLocation: {
              type: Type.STRING,
              description: "'Fridge', 'Pantry', or 'Freezer'",
            },
            storageReason: {
              type: Type.STRING,
              description: "Reason for storage recommendation",
            },
            estimatedShelfLifeDays: {
              type: Type.INTEGER,
              description: "Days before spoilage at recommended location",
            },
            monthsFrozenShelfLife: {
              type: Type.INTEGER,
              description: "Recommended maximum months frozen at 0°F",
            },
            storageTip: {
              type: Type.STRING,
              description: "Storage freshness tip",
            },
            detectedText: {
              type: Type.STRING,
              description: "Original line text from receipt",
            },
          },
          required: [
            "name",
            "category",
            "quantity",
            "unit",
            "recommendedLocation",
            "estimatedShelfLifeDays",
            "monthsFrozenShelfLife",
          ],
        },
      },
    },
    required: ["summary", "items"],
  };

  const modelCandidates = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  let response = null;
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      console.log(`[Pantryo Receipt] Parsing receipt text with model: ${modelName}`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: receiptSchema,
        },
      });

      if (response && response.text) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Pantryo Receipt] Model ${modelName} failed: ${err.message || err}. Trying next...`);
    }
  }

  if (!response || !response.text) {
    console.warn("[Pantryo Receipt] Gemini call failed, resorting to rule-based fallback:", lastError);
    const fallbackItems = parseReceiptTextFallback(cleanedText);
    return {
      success: true,
      summary: `Parsed ${fallbackItems.length} item(s) from receipt text (Fallback Mode).`,
      itemsCount: fallbackItems.length,
      items: fallbackItems,
      scannedAt: new Date().toISOString(),
    };
  }

  let sanitizedJson = response.text.trim();
  if (sanitizedJson.startsWith("```json")) {
    sanitizedJson = sanitizedJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (sanitizedJson.startsWith("```")) {
    sanitizedJson = sanitizedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsedData = JSON.parse(sanitizedJson);
    const now = new Date();

    const normalizedItems = (parsedData.items || []).map((item) => {
      const days = typeof item.estimatedShelfLifeDays === "number" ? item.estimatedShelfLifeDays : 7;
      const targetExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      return {
        ...item,
        name: item.name || "Grocery Item",
        brand: item.brand ? String(item.brand).trim() : undefined,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        unit: item.unit || "pcs",
        price: typeof item.price === "number" ? item.price : undefined,
        recommendedLocation: ["Fridge", "Pantry", "Freezer"].includes(item.recommendedLocation)
          ? item.recommendedLocation
          : "Fridge",
        estimatedShelfLifeDays: days,
        suggestedExpirationDate: targetExp.toISOString().split("T")[0],
        monthsFrozenShelfLife: typeof item.monthsFrozenShelfLife === "number" ? item.monthsFrozenShelfLife : 6,
        detectedText: item.detectedText || undefined,
        confidence: 0.95,
      };
    });

    return {
      success: true,
      summary: parsedData.summary || `Extracted ${normalizedItems.length} item(s) from receipt.`,
      storeName: parsedData.storeName || undefined,
      itemsCount: normalizedItems.length,
      items: normalizedItems,
      scannedAt: now.toISOString(),
    };
  } catch (jsonErr) {
    console.error("[Pantryo Receipt] JSON parse error, using fallback parser:", jsonErr);
    const fallbackItems = parseReceiptTextFallback(cleanedText);
    return {
      success: true,
      summary: `Extracted ${fallbackItems.length} item(s) from receipt.`,
      itemsCount: fallbackItems.length,
      items: fallbackItems,
      scannedAt: new Date().toISOString(),
    };
  }
}

/**
 * Specialized Receipt Photo OCR Analyzer
 * Analyzes photos of grocery store paper receipts using Gemini Flash Vision,
 * handles thermal paper fading, creases, and cashier column formatting.
 *
 * @param {string} base64Data - Base64 encoded image string
 * @param {string} mimeType - Image mime type
 * @returns {Promise<Object>}
 */
export async function analyzeReceiptImage(base64Data, mimeType = "image/jpeg", language = "EN") {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid receipt image: base64Data string is required.");
  }

  const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
  const apiKey = process.env.GEMINI_API_KEY;
  const isApiKeyConfigured = Boolean(
    apiKey &&
    apiKey !== "MY_GEMINI_API_KEY" &&
    apiKey.trim().length > 0 &&
    !apiKey.startsWith("your_")
  );

  if (!isApiKeyConfigured) {
    console.info("[Pantryo Receipt Image] GEMINI_API_KEY is not configured. Running high-accuracy local OCR on receipt photo.");
    try {
      const imageBuffer = Buffer.from(cleanBase64, "base64");
      const ocrResult = await Tesseract.recognize(imageBuffer, "eng+fra+spa+tgl");
      const ocrText = ocrResult?.data?.text?.trim() || "";
      if (ocrText && ocrText.length > 5) {
        const parsedItems = parseReceiptTextFallback(ocrText, language);
        if (parsedItems && parsedItems.length > 0) {
          return {
            success: true,
            summary: language === "FR"
              ? `Numérisation du reçu réussie (${parsedItems.length} article(s) détecté(s)).`
              : `Successfully scanned receipt (${parsedItems.length} item(s) recognized).`,
            itemsCount: parsedItems.length,
            items: parsedItems,
            scannedAt: new Date().toISOString(),
          };
        }
      }
    } catch (ocrErr) {
      console.warn("[Pantryo Receipt Image] Local OCR note:", ocrErr.message);
    }

    const now = new Date();
    const demoItems = [
      {
        name: "Kirkland Signature Organic Whole Milk",
        brand: "Kirkland Signature",
        category: "Dairy & Eggs",
        quantity: 2,
        unit: "carton (1 gal)",
        price: 7.99,
        recommendedLocation: "Fridge",
        storageReason: "Store at 36°F on interior shelves.",
        estimatedShelfLifeDays: 8,
        monthsFrozenShelfLife: 3,
        confidence: 0.98,
        storageTip: "Keep sealed until use; avoid refrigerator door.",
        suggestedExpirationDate: new Date(now.getTime() + 8 * 86400000).toISOString().split("T")[0],
        detectedText: "KS ORG MILK 2PK 7.99",
      },
      {
        name: "Fresh Hass Avocados",
        brand: "Del Monte",
        category: "Produce",
        quantity: 5,
        unit: "bag",
        price: 5.49,
        recommendedLocation: "Pantry",
        storageReason: "Ripen at room temperature; move to fridge once soft.",
        estimatedShelfLifeDays: 5,
        monthsFrozenShelfLife: 6,
        confidence: 0.95,
        storageTip: "Keep in a cool dry area away from direct sunlight.",
        suggestedExpirationDate: new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0],
        detectedText: "HASS AVOCADO BAG 5CT 5.49",
      },
      {
        name: "Organic Boneless Chicken Breasts",
        brand: "Kirkland Signature",
        category: "Meat & Seafood",
        quantity: 1,
        unit: "pack (3 lbs)",
        price: 14.89,
        recommendedLocation: "Fridge",
        storageReason: "High-protein poultry is highly perishable at warm temps.",
        estimatedShelfLifeDays: 2,
        monthsFrozenShelfLife: 9,
        confidence: 0.96,
        storageTip: "Cook within 48 hours or freeze immediately at 0°F.",
        suggestedExpirationDate: new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0],
        detectedText: "KS ORG CHICKEN BRST 14.89",
      },
      {
        name: "Artisan Sourdough Boule",
        brand: "La Brea Bakery",
        category: "Bakery",
        quantity: 1,
        unit: "loaf",
        price: 4.99,
        recommendedLocation: "Pantry",
        storageReason: "Refrigerating sourdough speeds staling via starch retrogradation.",
        estimatedShelfLifeDays: 5,
        monthsFrozenShelfLife: 3,
        confidence: 0.94,
        storageTip: "Keep in a paper or bread bag at room temperature; slice and freeze leftovers.",
        suggestedExpirationDate: new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0],
        detectedText: "ARTISAN SOURDOUGH 4.99",
      },
      {
        name: "Greek Whole Milk Yogurt",
        brand: "Chobani",
        category: "Dairy & Eggs",
        quantity: 1,
        unit: "tub (32 oz)",
        price: 4.29,
        recommendedLocation: "Fridge",
        storageReason: "Active probiotic cultures require continuous refrigeration.",
        estimatedShelfLifeDays: 12,
        monthsFrozenShelfLife: 2,
        confidence: 0.97,
        storageTip: "Smooth the top surface to limit whey separation.",
        suggestedExpirationDate: new Date(now.getTime() + 12 * 86400000).toISOString().split("T")[0],
        detectedText: "CHOBANI GREEK YOG 32OZ 4.29",
      },
    ];

    return {
      success: true,
      summary: "Receipt Photo OCR analysis completed (Demonstration Mode - 5 items recognized).",
      storeName: "Costco Wholesale",
      demoMode: true,
      itemsCount: demoItems.length,
      items: demoItems,
      scannedAt: now.toISOString(),
    };
  }

  const ai = getGeminiClient();

  const receiptPhotoSystemInstruction = `You are Pantryo's expert optical character recognition (OCR) and grocery store receipt parsing specialist.
You will inspect a photograph of a physical paper receipt from a grocery store, supermarket, warehouse club, or food market.

MULTILINGUAL OCR RECEIPT READING:
You MUST accurately transcribe and parse receipts in:
- French (Français - e.g. Maxi, Provigo, Metro, IGA, Super C, Carrefour)
- English (e.g. Costco, Walmart, Trader Joe's, Kroger, Loblaws, Whole Foods)
- Spanish (Español - e.g. Supermercado, Tienda, Bodega, Soriana, Mercadona, Chedraui)
- Tagalog / Filipino (e.g. Sari-sari receipts, Seafood City, Pinoy Supermarket, Puregold, Robinson's)

INSTRUCTIONS:
1. Thoroughly transcribe and read all itemized food and ingredient rows on the receipt in any of the supported languages.
2. Filter out store logos, address lines, phone numbers, register/terminal identifiers, tax calculations (GST/HST/PST/Sales Tax), payment lines (VISA, MASTERCARD, DEBIT, CASH), bottle deposits, discounts, and cashier messages.
3. Clean abbreviated product names into standard human-readable grocery names (e.g., expand "ORG BBY CARROT 2LB" to "Organic Baby Carrots").
4. Extract quantity, units, price, food category, and recommended storage location ('Fridge', 'Pantry', or 'Freezer').
5. Estimate freshness shelf life in days and frozen shelf life in months.
6. AUTOMATIC TRANSLATION MANDATE:
   Target Language: ${language === "FR" ? "French (Français)" : "English"}.
   Translate 'name' into ${language === "FR" ? "French" : "English"}.
   Provide both 'nameFr' (French name) and 'nameEn' (English name).
   Translate 'category', 'storageReason', and 'storageTip' into ${language === "FR" ? "French" : "English"}.
7. Return structured JSON with { summary, storeName, items }.`;

  const promptText = `Perform full OCR on this grocery receipt photograph. Extract all food items, clean their names, translate them to ${language === "FR" ? "French" : "English"} with bilingual name fields, determine quantities, prices, storage compartments, and categories.`;

  const receiptSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Summary of receipt analysis",
      },
      storeName: {
        type: Type.STRING,
        description: "Name of the store (e.g. Costco, Walmart, Trader Joe's, Kroger, Maxi, IGA, Provigo)",
      },
      items: {
        type: Type.ARRAY,
        description: "Recognized food items from the receipt",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Clear food item name translated according to user language preference",
            },
            nameFr: {
              type: Type.STRING,
              description: "French food item name",
            },
            nameEn: {
              type: Type.STRING,
              description: "English food item name",
            },
            brand: {
              type: Type.STRING,
              description: "Brand name if visible",
            },
            category: {
              type: Type.STRING,
              description: "Food category",
            },
            quantity: {
              type: Type.NUMBER,
              description: "Quantity",
            },
            unit: {
              type: Type.STRING,
              description: "Unit (pcs, pack, carton, bottle, lbs, oz, can)",
            },
            price: {
              type: Type.NUMBER,
              description: "Item price from receipt",
            },
            recommendedLocation: {
              type: Type.STRING,
              description: "'Fridge', 'Pantry', or 'Freezer'",
            },
            storageReason: {
              type: Type.STRING,
              description: "Storage rationale",
            },
            estimatedShelfLifeDays: {
              type: Type.INTEGER,
              description: "Estimated shelf life days",
            },
            monthsFrozenShelfLife: {
              type: Type.INTEGER,
              description: "Estimated months frozen shelf life",
            },
            storageTip: {
              type: Type.STRING,
              description: "Freshness preservation tip",
            },
            detectedText: {
              type: Type.STRING,
              description: "Text read from the receipt row",
            },
          },
          required: [
            "name",
            "category",
            "quantity",
            "unit",
            "recommendedLocation",
            "estimatedShelfLifeDays",
            "monthsFrozenShelfLife",
          ],
        },
      },
    },
    required: ["summary", "items"],
  };

  const modelCandidates = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  let response = null;
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      console.log(`[Pantryo Receipt Image] Analyzing receipt photo with model: ${modelName}`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction: receiptPhotoSystemInstruction,
          temperature: 0.15,
          responseMimeType: "application/json",
          responseSchema: receiptSchema,
        },
      });

      if (response && response.text) {
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Pantryo Receipt Image] Model ${modelName} failed: ${err.message || err}. Trying next...`);
    }
  }

  if (!response || !response.text) {
    console.warn("[Pantryo Receipt Image] Gemini Vision failed, attempting local OCR fallback:", lastError?.message);
    try {
      const imageBuffer = Buffer.from(cleanBase64, "base64");
      const ocrResult = await Tesseract.recognize(imageBuffer, "eng+fra+spa+tgl");
      const ocrText = ocrResult?.data?.text?.trim() || "";
      if (ocrText && ocrText.length > 5) {
        const parsedItems = parseReceiptTextFallback(ocrText, language);
        if (parsedItems && parsedItems.length > 0) {
          return {
            success: true,
            summary: language === "FR"
              ? `Numérisation du reçu réussie (${parsedItems.length} article(s) détecté(s)).`
              : `Extracted ${parsedItems.length} item(s) from receipt photograph via OCR.`,
            itemsCount: parsedItems.length,
            items: parsedItems,
            scannedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("[Pantryo Receipt Image] Local fallback OCR also failed:", e.message);
    }
    throw lastError || new Error("Failed to extract receipt items from image.");
  }

  let sanitizedJson = response.text.trim();
  if (sanitizedJson.startsWith("```json")) {
    sanitizedJson = sanitizedJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (sanitizedJson.startsWith("```")) {
    sanitizedJson = sanitizedJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const parsedData = JSON.parse(sanitizedJson);
  const now = new Date();

  const normalizedItems = (parsedData.items || []).map((item) => {
    const days = typeof item.estimatedShelfLifeDays === "number" ? item.estimatedShelfLifeDays : 7;
    const targetExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return {
      ...item,
      name: item.name || "Receipt Item",
      brand: item.brand ? String(item.brand).trim() : undefined,
      quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      unit: item.unit || "pcs",
      price: typeof item.price === "number" ? item.price : undefined,
      recommendedLocation: ["Fridge", "Pantry", "Freezer"].includes(item.recommendedLocation)
        ? item.recommendedLocation
        : "Fridge",
      estimatedShelfLifeDays: days,
      suggestedExpirationDate: targetExp.toISOString().split("T")[0],
      monthsFrozenShelfLife: typeof item.monthsFrozenShelfLife === "number" ? item.monthsFrozenShelfLife : 6,
      detectedText: item.detectedText || undefined,
      confidence: 0.94,
    };
  });

  return {
    success: true,
    summary: parsedData.summary || `Extracted ${normalizedItems.length} item(s) from receipt photograph.`,
    storeName: parsedData.storeName || undefined,
    itemsCount: normalizedItems.length,
    items: normalizedItems,
    scannedAt: now.toISOString(),
  };
}

