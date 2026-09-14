import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import inventoryRouter from "./server/src/routes/inventory.js";
import recipesRouter from "./server/src/routes/recipes.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limits for high-resolution base64 camera photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount the Kitchen Komrade Backend APIs
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/recipes", recipesRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Kitchen Komrade API Server",
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
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
