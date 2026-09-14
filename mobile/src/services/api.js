/**
 * Kitchen Komrade - Mobile API Client Service (Expo / React Native)
 * 
 * Provides a production-grade API client connecting the Expo mobile client
 * (iOS / Android / Web) to the Kitchen Komrade Node.js backend.
 * Uses native fetch with automatic timeout, error normalization, and response typing.
 */

// Determine API Base URL based on environment (Expo configuration or local fallback)
const getApiBaseUrl = () => {
  // 1. Check Expo public environment variable (Expo SDK 49+)
  if (typeof process !== "undefined" && process.env && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // 2. Browser / Web preview fallback
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return `${window.location.origin}/api/v1/inventory`;
  }

  // 3. Android Emulator (10.0.2.2) or iOS Simulator (localhost:3000) default
  return "http://localhost:3000/api/v1/inventory";
};

const API_BASE_URL = getApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 25000; // 25 seconds for multimodal AI vision inference

/**
 * Standardized HTTP request helper with timeout and error handling
 */
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    let responseData = null;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = { message: await response.text() };
    }

    if (!response.ok) {
      const errorMsg =
        (responseData && (responseData.error || responseData.message || responseData.details)) ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(`Request to ${endpoint} timed out after ${options.timeoutMs || DEFAULT_TIMEOUT_MS}ms.`);
    }

    console.error(`[Kitchen Komrade API] Failure at ${endpoint}:`, error);
    throw error;
  }
}

/**
 * 1. AI Vision Food Scanner
 * Sends a captured camera photo or selected image (as base64) to the server
 * where Gemini Flash Vision extracts items, locations, and shelf-life estimations.
 *
 * @param {string} imageBase64 - Base64 string of the camera photo
 * @param {string} [mimeType='image/jpeg'] - MIME type of the image
 * @returns {Promise<{ success: boolean, summary: string, items: Array }>}
 */
export async function scanFoodPhoto(imageBase64, mimeType = "image/jpeg") {
  if (!imageBase64) {
    throw new Error("scanFoodPhoto requires a valid base64 image string.");
  }

  return request("/scan", {
    method: "POST",
    body: JSON.stringify({
      imageBase64,
      mimeType,
    }),
    timeoutMs: 35000, // Generous timeout for high-res image transmission & AI inference
  });
}

/**
 * 2. Get Real-Time Household Inventory
 * Retrieves all items grouped by storage location (Fridge, Pantry, Freezer),
 * prioritized by expiration date, with live freezer duration calculations.
 *
 * @param {string} [householdId='hh_yan_kriz_01'] - Household identifier
 * @returns {Promise<{ success: boolean, stats: Object, grouped: Object, expiringSoon: Array, allItems: Array }>}
 */
export async function getHouseholdInventory(householdId = "hh_yan_kriz_01") {
  return request(`/household/${encodeURIComponent(householdId)}`, {
    method: "GET",
  });
}

/**
 * 3. Create New Inventory Item
 * Inserts a new food item into the household database attributed to the active user.
 *
 * @param {Object} itemData
 * @param {string} itemData.name - Item title (e.g. "Oat Milk")
 * @param {number} [itemData.quantity=1] - Numeric amount
 * @param {string} [itemData.unit='pcs'] - Unit of measurement
 * @param {string} [itemData.locationName='Fridge'] - "Fridge", "Pantry", or "Freezer"
 * @param {string} [itemData.categoryName='Produce'] - Category name
 * @param {string} [itemData.expirationDate] - Target expiration (ISO or YYYY-MM-DD)
 * @param {number} [itemData.monthsFrozenShelfLife=6] - Months safe in freezer
 * @param {string} [itemData.notes] - Optional chef notes
 * @param {string} [userId='usr_yan'] - Current logged-in user ID
 * @param {string} [householdId='hh_yan_kriz_01'] - Active household
 */
export async function createInventoryItem(itemData, userId = "usr_yan", householdId = "hh_yan_kriz_01") {
  if (!itemData || !itemData.name) {
    throw new Error("createInventoryItem requires an item object with a 'name' field.");
  }

  return request("/item", {
    method: "POST",
    body: JSON.stringify({
      ...itemData,
      addedById: userId,
      householdId,
    }),
  });
}

/**
 * 4. Defrost Frozen Item
 * Moves an item from Freezer to Fridge, stamps defrostedAt timestamp,
 * and resets its expiration counter safely to 3 days.
 *
 * @param {string} itemId - UUID of the item to defrost
 * @param {string} [userId='usr_yan'] - User performing the action
 * @returns {Promise<{ success: boolean, message: string, item: Object, newExpirationDate: string }>}
 */
export async function defrostItem(itemId, userId = "usr_yan") {
  if (!itemId) {
    throw new Error("defrostItem requires an itemId parameter.");
  }

  return request(`/item/${encodeURIComponent(itemId)}/defrost`, {
    method: "PUT",
    body: JSON.stringify({ userId }),
  });
}

/**
 * 5. Remove or Consume Item
 *
 * @param {string} itemId - UUID of the item to remove
 */
export async function deleteInventoryItem(itemId) {
  if (!itemId) {
    throw new Error("deleteInventoryItem requires an itemId parameter.");
  }

  return request(`/item/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

export default {
  scanFoodPhoto,
  getHouseholdInventory,
  createInventoryItem,
  defrostItem,
  deleteInventoryItem,
};
