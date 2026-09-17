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

  const systemInstruction = `You are Pantryo's expert food safety specialist, culinary archivist, and household inventory analyst.
Your job is to visually inspect photographs of groceries, ingredients, prepared meals, packages, or refrigerator/pantry contents.

For each distinct food item identified in the image:
1. Identify the exact item name (concise, clear, e.g., "Organic Whole Milk", "Fresh Strawberries", "Ground Beef 80/20").
2. Assign the most appropriate culinary category: "Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Condiments", "Pantry Staples", "Frozen Meals", or "Snacks".
3. Estimate a reasonable quantity and unit based on visual cues (e.g., 1 gallon, 2 pack, 500 g, 6 pcs).
4. Recommend the optimal storage location: "Fridge", "Pantry", or "Freezer".
5. Provide a scientifically grounded shelf-life estimate:
   - estimatedShelfLifeDays: Expected days before spoilage at the recommended location.
   - monthsFrozenShelfLife: Recommended maximum storage duration in months if kept frozen at 0°F (-18°C).
6. Provide a concise, practical storage tip for maximum freshness.
7. Return confidence score between 0.0 and 1.0.

Always respond with structured JSON following the specified schema. If multiple items are detected in a single photo (such as a grocery haul), return all distinct items in the "items" array.`;

  const promptText = `Inspect this food photo thoroughly. Detect all grocery items, fresh produce, prepared foods, or packaged ingredients visible. Return complete inventory attributes for each item.`;

  try {
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
          temperature: 0.2, // Lower temperature for consistent categorization
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
      console.warn("Primary gemini-2.5-flash failed, attempting fallback to gemini-2.0-flash:", modelErr.message);
      response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      const days = typeof item.estimatedShelfLifeDays === "number" ? item.estimatedShelfLifeDays : 7;
      const targetExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      return {
        ...item,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        unit: item.unit || "pcs",
        recommendedLocation: ["Fridge", "Pantry", "Freezer"].includes(item.recommendedLocation)
          ? item.recommendedLocation
          : "Fridge",
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
