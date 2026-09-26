import express from "express";
import path from "path";
import dotenv from "dotenv";
import inventoryRouter from "./server/src/routes/inventory.js";
import recipesRouter from "./server/src/routes/recipes.js";
import adminRouter from "./server/src/routes/admin.js";
import authFido2Router from "./server/src/routes/authFido2.js";

dotenv.config();

// Global crash and rejection handlers for robust container diagnostics
process.on("uncaughtException", (err) => {
  console.error("[Pantryo Server] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Pantryo Server] Unhandled rejection at:", promise, "reason:", reason);
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Trust reverse proxy headers from Cloudflare Tunnel
app.set("trust proxy", true);

// Middleware for parsing JSON with generous limits for high-resolution base64 camera photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount the Kitchen Komrade Backend APIs
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/recipes", recipesRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/auth/fido2", authFido2Router);
app.use("/api/v1/auth", adminRouter);

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
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.path}`,
    status: 404,
  });
});

async function startServer() {
  // Vite middleware setup (development only)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kitchen Komrade] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
