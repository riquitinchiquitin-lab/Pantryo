import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const PHOTOS_DIR = path.join(DATA_DIR, "monitored_photos");
const LOG_FILE = path.join(DATA_DIR, "photo_monitor.log");
const JOURNAL_FILE = path.join(DATA_DIR, "scan_monitor.json");
const MAX_STORED_PHOTOS = 50;

// Ensure directories exist
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOURNAL_FILE)) {
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify([], null, 2), "utf8");
  }
} catch (e) {
  console.warn("[Photo Monitor] Could not initialize storage directories:", e.message);
}

/**
 * Determines file extension from mimeType or base64 header
 */
function getExtension(mimeType = "", cleanBase64 = "") {
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (cleanBase64.startsWith("iVBORw0KGgo")) return "png";
  if (cleanBase64.startsWith("UklGR")) return "webp";
  return "jpg";
}

/**
 * Prunes older photos when count exceeds MAX_STORED_PHOTOS
 */
function pruneOldPhotos() {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) return;
    const files = fs.readdirSync(PHOTOS_DIR)
      .map((f) => ({
        name: f,
        path: path.join(PHOTOS_DIR, f),
        time: fs.statSync(path.join(PHOTOS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_STORED_PHOTOS) {
      const toDelete = files.slice(MAX_STORED_PHOTOS);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(file.path);
        } catch (_) {}
      }
    }
  } catch (e) {
    console.warn("[Photo Monitor] Photo pruning warning:", e.message);
  }
}

/**
 * Records a photo used to identify products
 */
export function recordMonitoredPhoto({
  route = "/api/v1/inventory/scan",
  imageBase64 = "",
  mimeType = "image/jpeg",
  language = "EN",
  result = null,
  error = null,
  durationMs = 0,
}) {
  try {
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return null;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
    if (!cleanBase64) return null;

    const buffer = Buffer.from(cleanBase64, "base64");
    const ext = getExtension(mimeType, cleanBase64);
    const timestamp = new Date();
    const isoString = timestamp.toISOString();
    const id = `scan_${timestamp.getTime()}_${Math.random().toString(36).substring(2, 7)}`;
    const routeSlug = route.replace(/[^a-zA-Z0-9]/g, "_").replace(/^_+|_+$/g, "");
    const fileName = `${id}_${routeSlug}.${ext}`;
    const filePath = path.join(PHOTOS_DIR, fileName);

    // Save image file
    fs.writeFileSync(filePath, buffer);
    pruneOldPhotos();

    // Summarize detected items
    const detectedItems = [];
    if (result) {
      if (result.item) {
        detectedItems.push({
          name: result.item.name || result.item.nameFr || result.item.nameEn,
          category: result.item.category,
          brand: result.item.brand,
          confidence: result.confidence,
          storage: result.item.recommendedLocation,
          expiryDate: result.item.estimatedExpiryDate,
        });
      }
      if (Array.isArray(result.items)) {
        for (const it of result.items) {
          detectedItems.push({
            name: it.name || it.nameFr || it.nameEn,
            category: it.category,
            brand: it.brand,
            confidence: it.confidence || result.confidence,
            storage: it.recommendedLocation,
            price: it.price,
          });
        }
      }
    }

    const itemsSummary = detectedItems.length > 0
      ? detectedItems.map((d) => d.name).filter(Boolean).join(", ")
      : (result?.summary || "No product recognized");

    const entry = {
      id,
      timestamp: isoString,
      route,
      fileName,
      filePath: `/server/data/monitored_photos/${fileName}`,
      fileSizeKB: Math.round((buffer.length / 1024) * 10) / 10,
      mimeType,
      language,
      success: !error && (detectedItems.length > 0 || Boolean(result?.success)),
      detectionMethod: result?.detectionMethod || result?.identifiedMethod || (error ? "failed" : "unknown"),
      itemsCount: detectedItems.length,
      detectedItems,
      summary: itemsSummary,
      error: error ? (error.message || String(error)) : null,
      durationMs: Math.round(durationMs),
    };

    // Update journal file
    let journal = [];
    try {
      if (fs.existsSync(JOURNAL_FILE)) {
        journal = JSON.parse(fs.readFileSync(JOURNAL_FILE, "utf8"));
      }
    } catch (_) {
      journal = [];
    }
    journal.unshift(entry);
    if (journal.length > MAX_STORED_PHOTOS) {
      journal = journal.slice(0, MAX_STORED_PHOTOS);
    }
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2), "utf8");

    // Human-readable append log
    const logLine = `[${isoString}] [${entry.fileSizeKB}KB] [${route}] [${entry.detectionMethod}] -> ${entry.summary} (${entry.durationMs}ms)${error ? " ERR: " + entry.error : ""}\n`;
    fs.appendFileSync(LOG_FILE, logLine, "utf8");

    console.log(`[Photo Monitor 📸] Photo recorded: ${fileName} (${entry.fileSizeKB} KB) | Items: "${entry.summary}" | Method: ${entry.detectionMethod} | Route: ${route}`);

    return entry;
  } catch (err) {
    console.error("[Photo Monitor] Error recording monitored photo:", err.message);
    return null;
  }
}

/**
 * Retrieves the journal of monitored scans
 */
export function getMonitoredScans(limit = 30) {
  try {
    if (fs.existsSync(JOURNAL_FILE)) {
      const data = JSON.parse(fs.readFileSync(JOURNAL_FILE, "utf8"));
      return data.slice(0, limit);
    }
  } catch (e) {
    console.warn("[Photo Monitor] Could not read journal:", e.message);
  }
  return [];
}

/**
 * Retrieves absolute path to a monitored photo
 */
export function getPhotoFilePath(fileName) {
  const safeName = path.basename(fileName);
  const fullPath = path.join(PHOTOS_DIR, safeName);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }
  return null;
}
