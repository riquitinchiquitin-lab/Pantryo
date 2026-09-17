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
export async function analyzeFoodImage(base64Data, mimeType = "image/jpeg") {
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
2. BRAND & PRODUCT NAME: Read exact brand names (e.g., "Oatly", "Chobani", "Kirkland Signature", "Barilla", "Tyson") and combine with product title (e.g., "Oatly Barista Edition Oatmilk", "Kirkland Organic Eggs Grade A Large").
3. PRINTED EXPIRATION DATES: Specifically scan for printed date stamps: "EXP", "BEST BY", "BEST BEFORE", "USE BY", "SELL BY", "BB", or dot-matrix expiration dates printed on container necks, carton tops, or bag clips.
   - If a date is visible (e.g. "OCT 25 2026", "2026-10-25", "10/25/26"), output it in 'printedExpirationDate' (in YYYY-MM-DD format whenever possible) and calculate 'estimatedShelfLifeDays' based on the remaining days until that date.
4. QUANTITIES & WEIGHTS: Read printed net contents, weights, or volumes (e.g. "32 FL OZ (1 QT) 946mL", "16 OZ (1 LB) 454g", "1 Gallon", "Pack of 6") to extract precise quantity and unit.
5. RECEIPT SCANNING: If the image is a paper grocery receipt, parse the itemized lines into individual food inventory entries, omitting tax/tender lines.
6. DETECTED TEXT: In 'detectedText', include the key words or label text read from the item (e.g., "OATLY BARISTA EDITION 32 FL OZ - BEST BY 12/15/2026").

For each distinct food item identified in the image:
1. name: Precise item name including brand if readable from text.
2. brand: Brand name extracted from packaging/receipt, or null if unbranded fresh produce.
3. category: "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Condiments", "Pantry Staples", "Frozen Meals", or "Snacks".
4. quantity: Number extracted from packaging/receipt or visual estimation.
5. unit: "pcs", "pack", "carton", "bottle", "can", "box", "bag", "lbs", "oz", "fl oz", "kg", "g", "L", "gal".
6. recommendedLocation: "Fridge", "Pantry", or "Freezer".
7. storageReason: Why this compartment is recommended.
8. estimatedShelfLifeDays: Days before spoilage. If printed expiration date is detected, use the remaining days until that date.
9. monthsFrozenShelfLife: Recommended maximum frozen storage duration in months if frozen at 0°F (-18°C).
10. confidence: 0.0 to 1.0.
11. storageTip: Practical tip to maximize freshness.
12. detectedText: Key printed label or receipt text read via OCR.
13. printedExpirationDate: Date string (preferably YYYY-MM-DD) if stamped on packaging, else null.

Always respond with structured JSON following the specified schema. If multiple items or receipt lines are detected, return all items in the "items" array.`;

  const promptText = `Examine this photo thoroughly. Perform full optical character recognition (OCR) to read all text, product packaging labels, brand names, grocery receipts, net weights, and any printed expiration or best-by dates. Return complete inventory attributes for each item with detectedText, brand, and printedExpirationDate when visible.`;

  try {
    console.log(`[Pantryo Vision] Starting image analysis. Base64 length: ${cleanBase64.length} chars, mimeType: ${mimeType}`);
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
          responseSchema: {
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
                    category: {
                      type: Type.STRING,
                      description: "Item category (Produce, Dairy & Eggs, Meat & Seafood, Bakery, Beverages, Condiments, Pantry Staples, Frozen Meals, Snacks)",
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
          },
        },
      });
    } catch (modelErr) {
      console.warn("[Pantryo Vision] Primary gemini-2.5-flash with schema failed, retrying without strict schema:", modelErr.message);
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText + "\nRespond with valid JSON conforming to { summary: string, items: Array<{ name, brand, category, quantity, unit, recommendedLocation, storageReason, estimatedShelfLifeDays, monthsFrozenShelfLife, confidence, storageTip, detectedText, printedExpirationDate }> }",
            },
          ],
        },
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
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

      return {
        ...item,
        name: item.name || "Grocery Item",
        brand: item.brand ? String(item.brand).trim() : undefined,
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
