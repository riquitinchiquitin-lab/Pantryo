import React, { useState } from 'react';
import { Copy, Check, FileCode, Database, Cpu, Route, Smartphone, Server } from 'lucide-react';

export const CodebaseExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prisma' | 'gemini' | 'routes' | 'mobile' | 'docker'>('prisma');
  const [copied, setCopied] = useState(false);

  const files = {
    prisma: {
      path: 'prisma/schema.prisma',
      title: 'Prisma PostgreSQL Schema',
      icon: Database,
      language: 'prisma',
      summary: 'Multi-tenant household models: User, Household, Item, Location, Category, and ActivityLog with indexes for real-time querying.',
      code: `// Pantryo - Prisma Schema
// Production-ready PostgreSQL schema for self-hosted multi-tenant food inventory tracking

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  MEMBER
  GUEST
}

enum StorageType {
  FRIDGE
  PANTRY
  FREEZER
  CELLAR
  SPICE_RACK
}

enum ItemStatus {
  ACTIVE
  CONSUMED
  EXPIRED
  DISCARDED
}

enum ActivityAction {
  ITEM_CREATED
  ITEM_UPDATED
  ITEM_DEFROSTED
  ITEM_CONSUMED
  ITEM_DISCARDED
  LOCATION_CHANGED
  HOUSEHOLD_JOINED
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  avatarUrl    String?
  role         UserRole      @default(MEMBER)
  householdId  String?
  household    Household?    @relation(fields: [householdId], references: [id], onDelete: SetNull)
  itemsCreated Item[]        @relation("UserCreatedItems")
  activityLogs ActivityLog[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([householdId])
}

model Household {
  id           String        @id @default(uuid())
  name         String
  inviteCode   String        @unique
  users        User[]
  items        Item[]
  locations    Location[]
  categories   Category[]
  activityLogs ActivityLog[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Location {
  id          String      @id @default(uuid())
  name        String      // e.g., "Fridge", "Pantry", "Freezer"
  type        StorageType @default(FRIDGE)
  description String?
  householdId String
  household   Household   @relation(fields: [householdId], references: [id], onDelete: Cascade)
  items       Item[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([householdId, name])
  @@index([householdId])
}

model Category {
  id          String    @id @default(uuid())
  name        String    // e.g., "Dairy & Eggs", "Produce", "Meat & Seafood"
  icon        String?   // Lucide icon identifier
  color       String?   // Hex or pastel badge color
  householdId String
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  items       Item[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([householdId, name])
  @@index([householdId])
}

model Item {
  id                    String        @id @default(uuid())
  name                  String
  quantity              Float         @default(1.0)
  unit                  String        @default("pcs")
  householdId           String
  household             Household     @relation(fields: [householdId], references: [id], onDelete: Cascade)
  locationId            String
  location              Location      @relation(fields: [locationId], references: [id], onDelete: Restrict)
  categoryId            String?
  category              Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  addedById             String
  addedBy               User          @relation("UserCreatedItems", fields: [addedById], references: [id], onDelete: Restrict)
  status                ItemStatus    @default(ACTIVE)
  
  // Expiration & Freezer Duration Tracking
  expirationDate        DateTime?     // Absolute expiration target
  frozenAt              DateTime?     // When placed into freezer
  monthsFrozenShelfLife Int?          @default(6) // Ideal max freezer duration in months
  defrostedAt           DateTime?     // When defrosted from freezer
  
  notes                 String?
  imageUrl              String?
  barcode               String?
  
  activityLogs          ActivityLog[]
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([householdId, status])
  @@index([locationId])
  @@index([expirationDate])
  @@index([frozenAt])
}

model ActivityLog {
  id          String         @id @default(uuid())
  action      ActivityAction
  details     Json?          // Dynamic metadata: previous location, new expiration date, etc.
  itemId      String?
  item        Item?          @relation(fields: [itemId], references: [id], onDelete: SetNull)
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  householdId String
  household   Household      @relation(fields: [householdId], references: [id], onDelete: Cascade)
  createdAt   DateTime       @default(now())

  @@index([householdId, createdAt])
  @@index([itemId])
  @@index([userId])
}`,
    },
    gemini: {
      path: 'server/src/services/geminiVision.js',
      title: 'Gemini Flash Vision Service',
      icon: Cpu,
      language: 'javascript',
      summary: 'Google GenAI SDK integration with structured JSON schema enforcing food item extraction, storage recommendations, and shelf-life estimation.',
      code: `import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialized Gemini client
let aiClient = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return aiClient;
}

export async function analyzeFoodImage(base64Data, mimeType = "image/jpeg") {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Invalid image payload: base64Data is required as a string.");
  }

  const cleanBase64 = base64Data.replace(/^data:image\\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
  const ai = getGeminiClient();

  const systemInstruction = \`You are Pantryo's expert food safety specialist, culinary archivist, and household inventory analyst.
Visually inspect photographs of groceries, ingredients, prepared meals, packages, or refrigerator/pantry contents.
Detect items, category, quantity, recommended location (Fridge/Pantry/Freezer), estimated shelf-life in days, and frozen shelf-life in months.\`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanBase64 } },
        { text: "Inspect this food photo thoroughly and extract inventory items." },
      ],
    },
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                recommendedLocation: { type: Type.STRING },
                storageReason: { type: Type.STRING },
                estimatedShelfLifeDays: { type: Type.INTEGER },
                monthsFrozenShelfLife: { type: Type.INTEGER },
                confidence: { type: Type.NUMBER },
                storageTip: { type: Type.STRING },
              },
              required: ["name", "category", "quantity", "unit", "recommendedLocation", "estimatedShelfLifeDays", "monthsFrozenShelfLife"],
            },
          },
        },
        required: ["summary", "items"],
      },
    },
  });

  return JSON.parse(response.text.trim());
}`,
    },
    routes: {
      path: 'server/src/routes/inventory.js',
      title: 'Express Backend API Routes',
      icon: Route,
      language: 'javascript',
      summary: 'API endpoints for POST /scan, GET /household/:id, POST /item (household attribution), and PUT /item/:id/defrost (resetting expiration to 3 days).',
      code: `import express from "express";
import { analyzeFoodImage } from "../services/geminiVision.js";

const router = express.Router();

/**
 * POST /api/v1/inventory/scan
 * Calls Gemini Vision service and returns auto-populated JSON fields.
 */
router.post("/scan", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;
  const result = await analyzeFoodImage(imageBase64, mimeType);
  return res.status(200).json(result);
});

/**
 * GET /api/v1/inventory/household/:id
 * Grouped inventory (Fridge, Pantry, Freezer) with live expiration & freezer shelf-life calculations.
 */
router.get("/household/:id", (req, res) => {
  const householdId = req.params.id;
  // Query items, compute daysUntilExpiration, monthsFrozen, and return grouped structure
  // ...
});

/**
 * POST /api/v1/inventory/item
 * Attributes creation to logged-in user and writes to ActivityLog.
 */
router.post("/item", (req, res) => {
  const { name, quantity, unit, locationId, categoryId, addedById, expirationDate } = req.body;
  // Inserts item and creates ActivityLog record
  // ...
});

/**
 * PUT /api/v1/inventory/item/:id/defrost
 * Moves item from Freezer to Fridge and resets expiration counter to exactly 3 days.
 */
router.put("/item/:id/defrost", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  const defrostDate = new Date();
  const newExpirationDate = new Date(defrostDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // Update item location to 'loc_fridge' and expirationDate to newExpirationDate
  // ...
});

export default router;`,
    },
    mobile: {
      path: 'mobile/src/services/api.js',
      title: 'Expo React Native API Service',
      icon: Smartphone,
      language: 'javascript',
      summary: 'Production Fetch client connecting Expo (iOS / Android) to the backend with automatic base URL resolution and timeout handling.',
      code: `// Pantryo - Mobile API Client Service (Expo / React Native)

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1/inventory";

async function request(endpoint, options = {}) {
  const url = \`\${API_BASE_URL}\${endpoint}\`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
  return response.json();
}

export async function scanFoodPhoto(imageBase64, mimeType = "image/jpeg") {
  return request("/scan", {
    method: "POST",
    body: JSON.stringify({ imageBase64, mimeType }),
  });
}

export async function getHouseholdInventory(householdId = "hh_yan_kriz_01") {
  return request(\`/household/\${encodeURIComponent(householdId)}\`);
}

export async function createInventoryItem(itemData, userId = "usr_yan") {
  return request("/item", {
    method: "POST",
    body: JSON.stringify({ ...itemData, addedById: userId }),
  });
}

export async function defrostItem(itemId, userId = "usr_yan") {
  return request(\`/item/\${encodeURIComponent(itemId)}/defrost\`, {
    method: "PUT",
    body: JSON.stringify({ userId }),
  });
}

export default { scanFoodPhoto, getHouseholdInventory, createInventoryItem, defrostItem };`,
    },
    docker: {
      path: 'docker-compose.yml',
      title: 'Self-Hosted Docker & Proxmox',
      icon: Server,
      language: 'yaml',
      summary: 'Modular containerized stack running the Node.js Express server and PostgreSQL 16 database.',
      code: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pantryo_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://pantryo_admin:pantryo_secure_pass@db:5432/pantryo?schema=public
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: pantryo_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: pantryo_admin
      POSTGRES_PASSWORD: pantryo_secure_pass
      POSTGRES_DB: pantryo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"`,
    },
  };

  const activeFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in text-slate-800">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#EDF3EC] rounded-2xl border border-[#D8E3D5]">
        {(Object.keys(files) as Array<keyof typeof files>).map((tabKey) => {
          const item = files[tabKey];
          const Icon = item.icon;
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => { setActiveTab(tabKey); setCopied(false); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-white text-[#233527] shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-[#5A6F5C] hover:text-[#233527] hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-emerald-600" />
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Code Container */}
      <div className="rounded-3xl border border-[#D5E1D2] bg-white overflow-hidden shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#F7FAF6] border-b border-[#E1ECE0]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-xs font-bold text-[#233527]">{activeFile.path}</span>
          </div>
          <button
            onClick={handleCopy}
            className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        {/* File Description */}
        <div className="px-5 py-3 bg-[#EAF2E8]/40 border-b border-[#E4ECE1] text-xs text-[#4F6854]">
          {activeFile.summary}
        </div>

        {/* Code Content */}
        <div className="p-5 bg-slate-950 text-slate-100 overflow-x-auto font-mono text-xs leading-relaxed max-h-[560px]">
          <pre>
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
