import { GoogleGenAI, Type } from "@google/genai";

/**
 * Pantryo - Gemini Flash Vision Service
 * Uses Google Gemini Flash (Vision API via @google/genai) to analyze food photographs,
 * grocery receipts, packaging, or open fridge shelves and return structured inventory data.
 */

// Lazy-initialized Gemini client
let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing. Please set it in your environment or Settings > Secrets."
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

  const systemInstruction = `You are Pantryo's expert food safety specialist, culinary archivist, household inventory analyst, and high-accuracy optical character recognition (OCR) scanner.
Your job is to visually inspect photographs of groceries, ingredients, prepared meals, food packaging, store receipts, or refrigerator/pantry contents.

CRITICAL OCR & TEXT EXTRACTION INSTRUCTIONS:
1. READ ALL VISIBLE TEXT: Actively examine and read printed text on packaging, labels, bottles, cans, carton lids, price tags, and grocery store receipts (Costco, Walmart, Trader Joe's, Kroger, etc.).
2. BARCODE & UPC READING: Look for any UPC-A, UPC-E, or EAN barcode symbol on food packaging. Read the 12-digit or 13-digit numeric code printed directly below the barcode lines (e.g., "011110816850", "073420000115") and output it in the 'barcode' field.
3. BRAND & PRODUCT NAME: Read exact brand names (e.g., "Oatly", "Chobani", "Kirkland Signature", "Barilla", "Tyson") and combine with product title (e.g., "Oatly Barista Edition Oatmilk", "Kirkland Organic Eggs Grade A Large").
4. PRINTED EXPIRATION DATES: Specifically scan for printed date stamps: "EXP", "BEST BY", "BEST BEFORE", "USE BY", "SELL BY", "BB", or dot-matrix expiration dates printed on container necks, carton tops, or bag clips.
   - If a date is visible (e.g. "OCT 25 2026", "2026-10-25", "10/25/26"), output it in 'printedExpirationDate' (in YYYY-MM-DD format whenever possible) and calculate 'estimatedShelfLifeDays' based on the remaining days until that date.
5. QUANTITIES & WEIGHTS: Read printed net contents, weights, or volumes (e.g. "32 FL OZ (1 QT) 946mL", "16 OZ (1 LB) 454g", "1 Gallon", "Pack of 6") to extract precise quantity and unit.
6. RECEIPT SCANNING: If the image is a paper grocery receipt, parse the itemized lines into individual food inventory entries, omitting tax/tender lines.
7. DETECTED TEXT: In 'detectedText', include the key words or label text read from the item (e.g., "OATLY BARISTA EDITION 32 FL OZ - BEST BY 12/15/2026").

MANDATORY TRANSLATION ON IMPORT:
Target Language: ${language === "FR" ? "French (Français)" : "English"}.
If target language is 'FR':
- 'name': Translate item name into natural, idiomatic French (e.g., "Épinards frais bio", "Lait d'avoine Barista", "Fraises fraîches", "Poitrines de poulet").
- 'category': "Produits frais", "Produits laitiers & œufs", "Viandes & Poissons", "Boulangerie", "Boissons", "Condiments", "Garde-manger", "Surgelés", or "Collations".
- 'storageReason' & 'storageTip': Output in French.
- Provide 'nameFr' (French name) and 'nameEn' (English name).
If target language is 'EN':
- 'name', 'category', 'storageReason', 'storageTip' in English.
- Provide 'nameEn' and 'nameFr'.

For each distinct food item identified in the image:
1. name: Precise item name translated to ${language === "FR" ? "French" : "English"}.
2. nameFr: French translation of item name.
3. nameEn: English translation of item name.
4. brand: Brand name extracted from packaging/receipt, or null if unbranded fresh produce.
5. barcode: 12-digit UPC or 13-digit EAN code read from packaging, or null if absent.
6. category: Food category.
7. quantity: Number extracted from packaging/receipt or visual estimation.
8. unit: "pcs", "pack", "carton", "bottle", "can", "box", "bag", "lbs", "oz", "fl oz", "kg", "g", "L", "gal".
9. recommendedLocation: "Fridge", "Pantry", or "Freezer".
10. storageReason: Why this compartment is recommended.
11. estimatedShelfLifeDays: Days before spoilage.
12. monthsFrozenShelfLife: Recommended maximum frozen storage duration in months at 0°F.
13. confidence: 0.0 to 1.0.
14. storageTip: Practical tip to maximize freshness.
15. detectedText: Key printed label or receipt text read via OCR.
16. printedExpirationDate: Date string (preferably YYYY-MM-DD) if stamped on packaging, else null.

Always respond with structured JSON following the specified schema. If multiple items or receipt lines are detected, return all items in the "items" array.`;

  const promptText = `Examine this photo thoroughly. Perform full optical character recognition (OCR) to read all text, product packaging labels, brand names, barcodes / UPC codes, grocery receipts, net weights, and any printed expiration or best-by dates. Return complete inventory attributes for each item with detectedText, brand, barcode, and printedExpirationDate when visible. Ensure item names, categories, and recommendations are translated according to user language preference.`;

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

      return {
        ...item,
        name: item.name || "Grocery Item",
        brand: item.brand ? String(item.brand).trim() : undefined,
        barcode: barcodeStr || undefined,
        detectedText: item.detectedText ? String(item.detectedText).trim() : undefined,
        printedExpirationDate: printedDateStr || undefined,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        unit: item.unit || "pcs",
        recommendedLocation: ["Fridge", "Pantry", "Freezer"].includes(item.recommendedLocation)
          ? item.recommendedLocation
          : "Fridge",
        estimatedShelfLifeDays: days,
        suggestedExpirationDate: targetExp.toISOString().split("T")[0],
        monthsFrozenShelfLife: typeof item.monthsFrozenShelfLife === "number" ? item.monthsFrozenShelfLife : 6,
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
    console.error("[Pantryo - Gemini Vision Error]:", error);
    throw new Error(`Failed to parse food image with Gemini Vision: ${error.message}`);
  }
}

/**
 * Intelligent rule-based offline fallback parser for receipt text
 * Used when GEMINI_API_KEY is not yet configured or if API is unreachable.
 */
function parseReceiptTextFallback(receiptText) {
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
    "deposit", "bottle deposit", "bag fee"
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

    if (lower.includes("spinach") || lower.includes("lettuce") || lower.includes("kale") || lower.includes("salad")) {
      category = "Produce";
      location = "Fridge";
      shelfLifeDays = 5;
      unit = "clamshell";
    } else if (lower.includes("berry") || lower.includes("strawberr") || lower.includes("blueberr") || lower.includes("raspberr")) {
      category = "Produce";
      location = "Fridge";
      shelfLifeDays = 4;
      unit = "pack";
    } else if (lower.includes("apple") || lower.includes("banana") || lower.includes("orange") || lower.includes("avocado") || lower.includes("lemon") || lower.includes("lime")) {
      category = "Produce";
      location = lower.includes("avocado") ? "Pantry" : "Fridge";
      shelfLifeDays = 7;
      unit = "pcs";
    } else if (lower.includes("milk") || lower.includes("oatmilk") || lower.includes("almond milk") || lower.includes("cream")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 7;
      unit = "carton";
    } else if (lower.includes("cheese") || lower.includes("cheddar") || lower.includes("parmesan") || lower.includes("feta") || lower.includes("mozzarella")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 14;
      unit = "block";
    } else if (lower.includes("egg") || lower.includes("eggs")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 21;
      unit = "dozen";
    } else if (lower.includes("yogurt") || lower.includes("kefir")) {
      category = "Dairy & Eggs";
      location = "Fridge";
      shelfLifeDays = 10;
      unit = "tub";
    } else if (lower.includes("beef") || lower.includes("steak") || lower.includes("ground beef") || lower.includes("ribeye")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 3;
      unit = "pack";
    } else if (lower.includes("chicken") || lower.includes("poultry") || lower.includes("turkey") || lower.includes("breast") || lower.includes("thigh")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 2;
      unit = "pack";
    } else if (lower.includes("salmon") || lower.includes("fish") || lower.includes("shrimp") || lower.includes("cod") || lower.includes("tuna")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 2;
      unit = "fillet";
    } else if (lower.includes("pork") || lower.includes("bacon") || lower.includes("sausage")) {
      category = "Meat & Seafood";
      location = "Fridge";
      shelfLifeDays = 4;
      unit = "pack";
    } else if (lower.includes("bread") || lower.includes("sourdough") || lower.includes("bagel") || lower.includes("croissant") || lower.includes("brioche") || lower.includes("toast")) {
      category = "Bakery";
      location = "Pantry";
      shelfLifeDays = 6;
      unit = "loaf";
    } else if (lower.includes("frozen") || lower.includes("pizza") || lower.includes("ice cream") || lower.includes("dumpling") || lower.includes("waffle")) {
      category = "Frozen Meals";
      location = "Freezer";
      shelfLifeDays = 180;
      unit = "box";
    } else if (lower.includes("coffee") || lower.includes("tea") || lower.includes("juice") || lower.includes("sparkling") || lower.includes("soda")) {
      category = "Beverages";
      location = lower.includes("juice") ? "Fridge" : "Pantry";
      shelfLifeDays = 30;
      unit = "bottle";
    } else if (lower.includes("sauce") || lower.includes("mayo") || lower.includes("ketchup") || lower.includes("mustard") || lower.includes("dressing") || lower.includes("oil")) {
      category = "Condiments";
      location = lower.includes("oil") ? "Pantry" : "Fridge";
      shelfLifeDays = 60;
      unit = "bottle";
    } else if (lower.includes("chip") || lower.includes("cracker") || lower.includes("nut") || lower.includes("snack") || lower.includes("pretzel") || lower.includes("cookie")) {
      category = "Snacks";
      location = "Pantry";
      shelfLifeDays = 45;
      unit = "bag";
    } else if (lower.includes("pasta") || lower.includes("rice") || lower.includes("flour") || lower.includes("bean") || lower.includes("grain") || lower.includes("cereal")) {
      category = "Pantry Staples";
      location = "Pantry";
      shelfLifeDays = 90;
      unit = "box";
    }

    // Capitalize properly
    const friendlyName = cleaned
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

    const targetExp = new Date(now.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);

    items.push({
      name: friendlyName,
      brand,
      category,
      quantity,
      unit,
      recommendedLocation: location,
      storageReason: `Preserve peak flavor and texture in ${location.toLowerCase()}.`,
      estimatedShelfLifeDays: shelfLifeDays,
      monthsFrozenShelfLife: location === "Freezer" ? 6 : 4,
      confidence: 0.88,
      storageTip: `Keep sealed and stored in ${location.toLowerCase()}.`,
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
Your task is to parse raw text from store receipts (Costco, Walmart, Trader Joe's, Kroger, Aldi, Carrefour, Loblaws, Metro, IGA, Whole Foods, Super C, Maxi, Provigo, etc.) or online order confirmations (Instacart, UberEats, Amazon Fresh).

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
    console.info("[Pantryo Receipt Image] GEMINI_API_KEY is not configured. Returning demonstration receipt items.");
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

INSTRUCTIONS:
1. Thoroughly transcribe and read all itemized food and ingredient rows on the receipt.
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

