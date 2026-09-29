import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import inventoryRouter from "./server/src/routes/inventory.js";
import recipesRouter from "./server/src/routes/recipes.js";
import adminRouter from "./server/src/routes/admin.js";
import authFido2Router from "./server/src/routes/authFido2.js";

dotenv.config();

// Ensure DISABLE_HMR is set in development for AI Studio environment
if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = "true";
}

// Global crash and rejection handlers for robust container diagnostics
process.on("uncaughtException", (err) => {
  console.error("[Pantryo Server] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Pantryo Server] Unhandled rejection at:", promise, "reason:", reason);
});

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Trust reverse proxy headers from Cloudflare Tunnel
app.set("trust proxy", true);

// Baseline HTTP Protective Security Headers (SEC-05)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: ws: wss:; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Standard API parser (2MB max) to protect from memory-exhaustion Denial of Service (SEC-04)
const standardJsonParser = express.json({ limit: "2mb" });
const standardUrlParser = express.urlencoded({ extended: true, limit: "2mb" });

// High-capacity parser for image scans and database backup operations (50MB)
const highCapacityJsonParser = express.json({ limit: "50mb" });
const highCapacityUrlParser = express.urlencoded({ extended: true, limit: "50mb" });

// Apply high-capacity parser specifically to image/backup upload routes
const HIGH_CAPACITY_PREFIXES = [
  "/api/v1/inventory/ai-scan",
  "/api/inventory/ai-scan",
  "/api/v1/inventory/barcode/packaging",
  "/api/inventory/barcode/packaging",
  "/api/v1/recipes/parse-photo",
  "/api/recipes/parse-photo",
  "/api/v1/recipes/parse-recipe-card",
  "/api/recipes/parse-recipe-card",
  "/api/v1/admin/backup/import",
  "/api/admin/backup/import",
  "/api/v1/admin/restore",
  "/api/admin/restore",
];

app.use((req, res, next) => {
  const isHighCap = HIGH_CAPACITY_PREFIXES.some((prefix) => req.path.startsWith(prefix));
  if (isHighCap) {
    highCapacityJsonParser(req, res, (err) => {
      if (err) return next(err);
      highCapacityUrlParser(req, res, next);
    });
  } else {
    standardJsonParser(req, res, (err) => {
      if (err) return next(err);
      standardUrlParser(req, res, next);
    });
  }
});

// Mount the Kitchen Komrade Backend APIs (supports both /api/v1/* and /api/*)
app.use(["/api/v1/inventory", "/api/inventory"], inventoryRouter);
app.use(["/api/v1/recipes", "/api/recipes"], recipesRouter);
app.use(["/api/v1/admin", "/api/admin"], adminRouter);
app.use(["/api/v1/auth/fido2", "/api/auth/fido2"], authFido2Router);
app.use(["/api/v1/auth", "/api/auth"], adminRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Kitchen Komrade API Server",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Explicit 404 handler for API routes to prevent fallback to index.html
app.use("/api", (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.path}`,
    status: 404,
  });
});

// Universal PWA manifest and service worker headers for installability (dev & prod)
app.get("/sw.js", (req, res, next) => {
  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Service-Worker-Allowed", "/");
  const targetDir = process.env.NODE_ENV === "production" ? "dist" : "public";
  const swPath = path.join(process.cwd(), targetDir, "sw.js");
  res.sendFile(swPath, (err) => {
    if (err) {
      res.sendFile(path.join(process.cwd(), "public", "sw.js"), (err2) => {
        if (err2) next();
      });
    }
  });
});

app.get(["/manifest.webmanifest", "/manifest.json"], (req, res, next) => {
  res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  const targetDir = process.env.NODE_ENV === "production" ? "dist" : "public";
  const filename = req.path.endsWith("webmanifest") ? "manifest.webmanifest" : "manifest.json";
  const filePath = path.join(process.cwd(), targetDir, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(process.cwd(), "public", "manifest.json"), (err2) => {
        if (err2) next();
      });
    }
  });
});

// Explicitly serve public static assets (icons, screenshots, logo, avatars)
app.use(express.static(path.join(process.cwd(), "public"), {
  maxAge: "1d",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".webmanifest") || filePath.endsWith("manifest.json")) {
      res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    } else if (filePath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else if (filePath.endsWith(".svg")) {
      res.setHeader("Content-Type", "image/svg+xml");
    }
  }
}));

async function startServer() {
  // Vite middleware setup (development only)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kitchen Komrade] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
