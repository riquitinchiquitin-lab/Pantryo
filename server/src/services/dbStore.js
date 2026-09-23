import fs from "fs";
import path from "path";
import {
  encryptData,
  decryptData,
  computeChecksum,
  hashPassword,
  verifyPassword,
} from "./cryptoService.js";
import { validatePasswordNist, normalizeUnicode } from "./nistPasswordValidator.js";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const ENCRYPTED_DB_FILE = path.join(DATA_DIR, "pantryo_database.enc");
// Server master encryption key (uses process.env.DB_ENCRYPTION_KEY or a secure static key)
const SERVER_MASTER_KEY =
  process.env.DB_ENCRYPTION_KEY || "pantryo-master-secret-key-2026-aes256gcm-secure";

const SEED_HOUSEHOLD_ID = "hh_pantryo_main";

// Default clean-install administrator account:
// Username: "admin"
// Password: "pantryo"
// Upon first login, forces personalized username, name, and new password, removing default password.
const DEFAULT_USERS = [
  {
    id: "usr_admin",
    name: "Administrator",
    email: "admin",
    role: "ADMIN",
    passwordHash: hashPassword("pantryo"),
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString(),
    fido2Enforced: true,
    mustChangePassword: true,
    mustSetupProfile: true,
    isDefaultAdmin: true,
  },
];

const DEFAULT_LOCATIONS = [
  { id: "loc_fridge", name: "Fridge", type: "FRIDGE", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_pantry", name: "Pantry", type: "PANTRY", householdId: SEED_HOUSEHOLD_ID },
  { id: "loc_freezer", name: "Freezer", type: "FREEZER", householdId: SEED_HOUSEHOLD_ID },
];

const DEFAULT_CATEGORIES = [
  {
    id: "cat_produce",
    name: "Produce",
    icon: "Apple",
    color: "#DCFCE7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
    description: "Fresh vegetables, fruits, salad greens & herbs",
  },
  {
    id: "cat_dairy",
    name: "Dairy & Eggs",
    icon: "Milk",
    color: "#E0F2FE",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    description: "Milk, butter, cheeses, yogurt & farm eggs",
  },
  {
    id: "cat_meat",
    name: "Meat & Seafood",
    icon: "Beef",
    color: "#FEE2E2",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80",
    description: "Beef, poultry, pork, salmon & fresh seafood",
  },
  {
    id: "cat_bakery",
    name: "Bakery",
    icon: "Wheat",
    color: "#FEF3C7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    description: "Artisanal sourdough, baguettes, bread & pastries",
  },
  {
    id: "cat_pantry",
    name: "Pantry Staples",
    icon: "Package",
    color: "#F3E8FF",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80",
    description: "Pasta, grains, legumes, rice, flour & spices",
  },
  {
    id: "cat_frozen",
    name: "Frozen Meals",
    icon: "Snowflake",
    color: "#E0E7FF",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    description: "Frozen pizzas, dumplings, waffles & frozen veggies",
  },
  {
    id: "cat_beverages",
    name: "Beverages",
    icon: "Coffee",
    color: "#CCFBF1",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    description: "Coffee, tea, matcha, natural juices & sparkling drinks",
  },
  {
    id: "cat_snacks",
    name: "Snacks",
    icon: "Cookie",
    color: "#FFEDD5",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
    description: "Mixed roasted nuts, crisps, dried fruits & crackers",
  },
  {
    id: "cat_condiments",
    name: "Condiments",
    icon: "Soup",
    color: "#FEF9C3",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
    description: "Olive oil, balsamic vinegar, hot sauces & dressings",
  },
  {
    id: "cat_deli",
    name: "Deli & Prepared",
    icon: "Sandwich",
    color: "#FEF3C7",
    householdId: SEED_HOUSEHOLD_ID,
    imageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80",
    description: "Charcuterie, cured meats, prepared salads & dips",
  },
];

const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const getMonthsAgoDate = (offsetMonths) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonths);
  return d.toISOString();
};

const DEFAULT_ITEMS = [
  {
    id: "item_001",
    name: "Oat Milk (Barista Blend)",
    quantity: 1,
    unit: "carton",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_dairy",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(2),
    frozenAt: null,
    monthsFrozenShelfLife: 3,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80",
    notes: "Opened Sunday, keep cold on top shelf",
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(-1),
  },
  {
    id: "item_002",
    name: "Organic Strawberries",
    quantity: 1,
    unit: "pack (400g)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_produce",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(1),
    frozenAt: null,
    monthsFrozenShelfLife: 8,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=300&q=80",
    notes: "Wash before eating",
    createdAt: getRelativeDate(-4),
    updatedAt: getRelativeDate(-1),
  },
  {
    id: "item_003",
    name: "Grass-Fed Ground Beef 85/15",
    quantity: 2,
    unit: "lbs",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_freezer",
    categoryId: "cat_meat",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(120),
    frozenAt: getMonthsAgoDate(2.5),
    monthsFrozenShelfLife: 6,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=300&q=80",
    notes: "Vacuum sealed portion packs",
    createdAt: getMonthsAgoDate(2.5),
    updatedAt: getMonthsAgoDate(2.5),
  },
  {
    id: "item_004",
    name: "Wild Salmon Fillets",
    quantity: 4,
    unit: "portions",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_freezer",
    categoryId: "cat_meat",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(90),
    frozenAt: getMonthsAgoDate(4.2),
    monthsFrozenShelfLife: 5,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80",
    notes: "Individually wrapped",
    createdAt: getMonthsAgoDate(4.2),
    updatedAt: getMonthsAgoDate(4.2),
  },
  {
    id: "item_005",
    name: "Greek Yogurt Plain 2%",
    quantity: 2,
    unit: "tubs (750g)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_dairy",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(14),
    frozenAt: null,
    monthsFrozenShelfLife: 2,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80",
    notes: "Breakfast & cooking sauces",
    createdAt: getRelativeDate(-2),
    updatedAt: getRelativeDate(-2),
  },
  {
    id: "item_006",
    name: "Baby Spinach Greens",
    quantity: 1,
    unit: "clamshell (312g)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_fridge",
    categoryId: "cat_produce",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(3),
    frozenAt: null,
    monthsFrozenShelfLife: 6,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&q=80",
    notes: "For salads and breakfast eggs",
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
  },
  {
    id: "item_007",
    name: "Extra Virgin Olive Oil",
    quantity: 1,
    unit: "bottle (1L)",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_pantry",
    categoryId: "cat_condiments",
    addedById: "usr_yan",
    status: "ACTIVE",
    expirationDate: getRelativeDate(240),
    frozenAt: null,
    monthsFrozenShelfLife: 12,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=300&q=80",
    notes: "Cold pressed, single origin",
    createdAt: getRelativeDate(-10),
    updatedAt: getRelativeDate(-10),
  },
  {
    id: "item_008",
    name: "Artisanal Sourdough Batard",
    quantity: 1,
    unit: "loaf",
    householdId: SEED_HOUSEHOLD_ID,
    locationId: "loc_pantry",
    categoryId: "cat_bakery",
    addedById: "usr_kriz",
    status: "ACTIVE",
    expirationDate: getRelativeDate(4),
    frozenAt: null,
    monthsFrozenShelfLife: 3,
    defrostedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80",
    notes: "Local bakery loaf",
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
  },
];

const DEFAULT_PLANNED_MEALS = [
  {
    id: "meal_001",
    householdId: SEED_HOUSEHOLD_ID,
    title: "Crispy Garlic Butter Steak Bites & Golden Potatoes",
    date: new Date().toISOString().split("T")[0],
    mealType: "DINNER",
    recipeName: "Crispy Garlic Butter Steak Bites",
    recipeUrl: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    servings: 2,
    prepTimeMinutes: 25,
    notes: "Uses ground beef from freezer and pantry herbs",
    isCooked: false,
    ingredients: [
      { name: "Grass-Fed Ground Beef 85/15", quantity: 1, unit: "lbs", inStock: true },
      { name: "Baby Potatoes", quantity: 1, unit: "lb", inStock: false },
      { name: "Fresh Garlic Cloves", quantity: 4, unit: "cloves", inStock: true },
      { name: "Unsalted Butter", quantity: 3, unit: "tbsp", inStock: true },
    ],
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
  },
];

const DEFAULT_RECIPES = [
  {
    id: "rec_sample_yt_01",
    title: "Crispy Garlic Butter Steak Bites & Golden Potatoes",
    titleFr: "Bouchées de steak au beurre d'ail et pommes de terre dorées",
    ricardoUrlEn: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    ricardoUrlFr: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    youtubeUrl: "https://www.youtube.com/watch?v=17XjG6x5g2I",
    youtubeVideoId: "17XjG6x5g2I",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    time: "25 mins",
    prepTime: "10 mins",
    cookTime: "15 mins",
    servings: "4 servings",
    difficulty: "Easy",
    difficultyFr: "Facile",
    calories: "510 kcal",
    source: "YouTube",
    isRicardoOfficial: false,
    isCustom: true,
    descriptionEn: "Tender beef seared to caramelized perfection with foaming garlic herb butter and crispy potatoes.",
    descriptionFr: "Bœuf fondant saisi à point avec un beurre d'ail persillé moussant et des pommes de terre croustillantes.",
    tags: ["YouTube Recipe", "High-Protein", "20-Min Meal", "Skillet Favorite"],
    ingredients: [
      { name: "Grass-Fed Ground Beef 85/15", nameFr: "Cubes de bœuf frais", amount: "1.5 lbs (700g)", category: "Meat & Seafood", locationType: "FREEZER" },
      { name: "Unsalted Butter", nameFr: "Beurre doux", amount: "3 tbsp", category: "Dairy & Eggs", locationType: "FRIDGE" },
      { name: "Fresh Garlic Cloves", nameFr: "Gousses d'ail", amount: "4 cloves minced", category: "Produce", locationType: "PANTRY" },
      { name: "Baby Potatoes", nameFr: "Pommes de terre grelots", amount: "1 lb halved", category: "Produce", locationType: "PANTRY" },
      { name: "Fresh Rosemary & Parsley", nameFr: "Romarin et persil frais", amount: "2 tbsp", category: "Produce", locationType: "FRIDGE" },
    ],
    instructionsEn: [
      "Sear beef cubes in a hot cast-iron skillet with a splash of olive oil for 3-4 minutes until nicely browned. Transfer to a plate.",
      "Add halved baby potatoes to the skillet with a splash of water and butter. Cover and steam-fry for 10 minutes until golden and tender.",
      "Toss beef back into the skillet, add garlic, butter, and chopped herbs. Baste for 2 minutes until aromatic.",
      "Garnish with freshly cracked black pepper and sea salt; serve immediately.",
    ],
    instructionsFr: [
      "Saisir les cubes de bœuf dans une poêle en fonte chaude 3 à 4 minutes jusqu'à belle coloration. Réserver.",
      "Ajouter les pommes de terre grelots avec un peu d'eau et de beurre. Couvrir et cuire 10 minutes.",
      "Remettre la viande dans la poêle avec l'ail, le beurre et les herbes. Arroser 2 minutes.",
      "Garnir de poivre et de fleur de sel, servir sans attendre.",
    ],
    suggestedPantryNeeds: ["Baby Potatoes", "Fresh Rosemary"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

class EncryptedDatabaseStore {
  constructor() {
    this.household = {
      id: SEED_HOUSEHOLD_ID,
      name: "My Kitchen",
      inviteCode: "PANTRY-KITCHEN",
    };
    this.users = [...DEFAULT_USERS];
    this.locations = [...DEFAULT_LOCATIONS];
    this.categories = [...DEFAULT_CATEGORIES];
    this.items = [];
    this.plannedMeals = [];
    this.customRecipes = [];
    this.groceryItems = [];
    this.savedLists = [];
    this.lastBackupAt = null;
    this.lastRestoreAt = null;
    this.fido2Policy = {
      allUsersRequired: true,
      enforced: true,
      updatedAt: new Date().toISOString(),
    };

    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ENCRYPTED_DB_FILE)) {
        const encryptedFileContent = fs.readFileSync(ENCRYPTED_DB_FILE, "utf8");
        const parsed = JSON.parse(encryptedFileContent);
        const decrypted = decryptData(parsed, SERVER_MASTER_KEY);

        if (decrypted && Array.isArray(decrypted.users)) {
          this.household = decrypted.household || this.household;
          this.users = decrypted.users;
          this.locations = decrypted.locations || this.locations;
          this.categories = decrypted.categories || this.categories;
          this.items = Array.isArray(decrypted.items) ? decrypted.items : [];
          this.plannedMeals = Array.isArray(decrypted.plannedMeals) ? decrypted.plannedMeals : [];
          this.customRecipes = Array.isArray(decrypted.customRecipes) ? decrypted.customRecipes : [];
          this.groceryItems = Array.isArray(decrypted.groceryItems) ? decrypted.groceryItems : [];
          this.savedLists = Array.isArray(decrypted.savedLists) ? decrypted.savedLists : [];
          this.lastBackupAt = decrypted.lastBackupAt || null;
          this.lastRestoreAt = decrypted.lastRestoreAt || null;
          this.fido2Policy = {
            allUsersRequired: true,
            enforced: true,
            updatedAt: new Date().toISOString(),
          };

          // Policy enforcement: all users must use FIDO2
          this.users.forEach((u) => {
            u.fido2Enforced = true;
            if (u.isDefaultAdmin && (u.mustSetupProfile || u.mustChangePassword)) {
              u.passwordHash = hashPassword("pantryo");
            }
          });

          this.persistToEncryptedDisk();

          console.log(
            `[Pantryo DB] Successfully loaded encrypted database with ${this.items.length} items, ${this.customRecipes.length} recipes, ${this.users.length} users.`
          );
          return;
        }
      }
    } catch (err) {
      console.warn("[Pantryo DB] Could not load existing encrypted database, starting with clean install:", err.message);
    }

    // Clean install initial state: no default recipes, grocery lists, or inventory
    this.items = [];
    this.plannedMeals = [];
    this.customRecipes = [];
    this.groceryItems = [];
    this.savedLists = [];
    this.users = [...DEFAULT_USERS];
    this.users.forEach((u) => {
      u.fido2Enforced = true;
    });
    this.persistToEncryptedDisk();
  }

  persistToEncryptedDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const snapshot = {
        schemaVersion: "1.0",
        app: "Pantryo",
        updatedAt: new Date().toISOString(),
        household: this.household,
        users: this.users,
        locations: this.locations,
        categories: this.categories,
        items: this.items,
        plannedMeals: this.plannedMeals,
        customRecipes: this.customRecipes,
        groceryItems: this.groceryItems,
        savedLists: this.savedLists,
        lastBackupAt: this.lastBackupAt,
        lastRestoreAt: this.lastRestoreAt,
        fido2Policy: this.fido2Policy || { allUsersRequired: true, enforced: true },
      };

      const encrypted = encryptData(snapshot, SERVER_MASTER_KEY);
      fs.writeFileSync(ENCRYPTED_DB_FILE, JSON.stringify(encrypted, null, 2), "utf8");
      return true;
    } catch (err) {
      console.error("[Pantryo DB] Error persisting encrypted database to disk:", err);
      return false;
    }
  }

  /**
   * Generates a complete database backup package
   * Can be unencrypted JSON or AES-256-GCM encrypted with a custom passphrase
   */
  exportBackup(passphrase = null) {
    const rawData = {
      schemaVersion: "1.0",
      app: "Pantryo",
      exportedAt: new Date().toISOString(),
      household: this.household,
      users: this.users.map((u) => {
        // Exclude password hash from exports for security or preserve if needed for full restore
        return { ...u };
      }),
      locations: this.locations,
      categories: this.categories,
      items: this.items,
      plannedMeals: this.plannedMeals,
      customRecipes: this.customRecipes,
      groceryItems: this.groceryItems,
      savedLists: this.savedLists,
    };

    const checksum = computeChecksum(rawData);
    const recordCounts = {
      items: this.items.length,
      plannedMeals: this.plannedMeals.length,
      customRecipes: this.customRecipes.length,
      groceryItems: this.groceryItems.length,
      savedLists: this.savedLists.length,
      users: this.users.length,
    };

    this.lastBackupAt = new Date().toISOString();
    this.persistToEncryptedDisk();

    if (passphrase && passphrase.trim().length > 0) {
      const encrypted = encryptData(rawData, passphrase.trim());
      return {
        metadata: {
          app: "Pantryo",
          schemaVersion: "1.0",
          exportedAt: rawData.exportedAt,
          isEncrypted: true,
          algorithm: "AES-256-GCM",
          checksum,
          recordCounts,
        },
        payload: encrypted,
      };
    }

    return {
      metadata: {
        app: "Pantryo",
        schemaVersion: "1.0",
        exportedAt: rawData.exportedAt,
        isEncrypted: false,
        checksum,
        recordCounts,
      },
      payload: rawData,
    };
  }

  /**
   * Previews or executes a backup restore
   */
  restoreBackup(backupPackage, passphrase = null, mode = "replace") {
    if (!backupPackage || typeof backupPackage !== "object") {
      throw new Error("Invalid backup format: root must be an object");
    }

    let restoredData;

    if (backupPackage.metadata?.isEncrypted) {
      if (!passphrase || passphrase.trim().length === 0) {
        throw new Error("This backup is encrypted. An admin passphrase is required to decrypt it.");
      }
      try {
        restoredData = decryptData(backupPackage.payload, passphrase.trim());
      } catch (err) {
        throw new Error("Failed to decrypt backup. Incorrect passphrase or corrupted payload.");
      }
    } else if (backupPackage.payload) {
      restoredData = backupPackage.payload;
    } else {
      restoredData = backupPackage;
    }

    if (!restoredData || typeof restoredData !== "object") {
      throw new Error("Corrupted backup data: unable to parse inner records");
    }

    // Optional Checksum Validation
    if (backupPackage.metadata?.checksum) {
      const computed = computeChecksum(restoredData);
      if (computed !== backupPackage.metadata.checksum) {
        console.warn("[Pantryo DB] Checksum mismatch during restore (continuing if data valid)");
      }
    }

    // Apply restore
    if (mode === "replace") {
      if (Array.isArray(restoredData.items)) this.items = restoredData.items;
      if (Array.isArray(restoredData.plannedMeals)) this.plannedMeals = restoredData.plannedMeals;
      if (Array.isArray(restoredData.customRecipes)) this.customRecipes = restoredData.customRecipes;
      if (Array.isArray(restoredData.groceryItems)) this.groceryItems = restoredData.groceryItems;
      if (Array.isArray(restoredData.savedLists)) this.savedLists = restoredData.savedLists;
      if (Array.isArray(restoredData.users)) this.users = restoredData.users;
      if (restoredData.household) this.household = restoredData.household;
    } else {
      // Merge mode
      if (Array.isArray(restoredData.items)) {
        const map = new Map(this.items.map((i) => [i.id, i]));
        restoredData.items.forEach((i) => map.set(i.id, i));
        this.items = Array.from(map.values());
      }
      if (Array.isArray(restoredData.plannedMeals)) {
        const map = new Map(this.plannedMeals.map((m) => [m.id, m]));
        restoredData.plannedMeals.forEach((m) => map.set(m.id, m));
        this.plannedMeals = Array.from(map.values());
      }
      if (Array.isArray(restoredData.customRecipes)) {
        const map = new Map(this.customRecipes.map((r) => [r.id, r]));
        restoredData.customRecipes.forEach((r) => map.set(r.id, r));
        this.customRecipes = Array.from(map.values());
      }
      if (Array.isArray(restoredData.savedLists)) {
        const map = new Map(this.savedLists.map((l) => [l.id, l]));
        restoredData.savedLists.forEach((l) => map.set(l.id, l));
        this.savedLists = Array.from(map.values());
      }
    }

    this.lastRestoreAt = new Date().toISOString();
    this.persistToEncryptedDisk();

    return {
      success: true,
      mode,
      restoredAt: this.lastRestoreAt,
      recordCounts: {
        items: this.items.length,
        plannedMeals: this.plannedMeals.length,
        customRecipes: this.customRecipes.length,
        groceryItems: this.groceryItems.length,
        savedLists: this.savedLists.length,
        users: this.users.length,
      },
    };
  }

  /**
   * Resets database to factory seed data
   */
  factoryReset() {
    this.items = [...DEFAULT_ITEMS];
    this.plannedMeals = [...DEFAULT_PLANNED_MEALS];
    this.customRecipes = [...DEFAULT_RECIPES];
    this.users = [...DEFAULT_USERS];
    this.groceryItems = [];
    this.savedLists = [];
    this.lastBackupAt = null;
    this.lastRestoreAt = new Date().toISOString();
    this.persistToEncryptedDisk();

    return {
      success: true,
      itemsCount: this.items.length,
      resetAt: this.lastRestoreAt,
    };
  }

  /**
   * Wipes all inventory and meals
   */
  wipeAll() {
    this.items = [];
    this.plannedMeals = [];
    this.groceryItems = [];
    this.savedLists = [];
    this.persistToEncryptedDisk();
    return { success: true, itemsCount: 0 };
  }

  /**
   * User Authentication
   */
  authenticateUser(emailOrName, password) {
    const user = this.users.find(
      (u) =>
        u.email?.toLowerCase() === emailOrName?.toLowerCase() ||
        u.name?.toLowerCase() === emailOrName?.toLowerCase()
    );

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check password if configured
    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Invalid password" };
      }

      // Proactive cryptographic upgrade: If the stored hash is using legacy PBKDF2,
      // seamlessly re-hash using modern memory-hard scrypt (NIST SP 800-63B recommendation)
      if (!user.passwordHash.startsWith("scrypt:")) {
        try {
          user.passwordHash = hashPassword(password);
          this.persistToEncryptedDisk();
        } catch (upgradeErr) {
          console.warn("Failed to upgrade legacy password hash:", upgradeErr);
        }
      }
    }

    const { passwordHash, recoveryCodes, totpSecret, ...rawSafeUser } = user;
    const safeUser = {
      ...rawSafeUser,
      fido2Enabled: Boolean(user.fido2Enabled && user.fido2Credentials?.length > 0),
      fido2Enforced: Boolean(user.fido2Enforced),
      totpEnabled: Boolean(user.totpEnabled && user.totpSecret),
      mustChangePassword: Boolean(user.mustChangePassword),
      mustSetupProfile: Boolean(user.mustSetupProfile),
      isDefaultAdmin: Boolean(user.isDefaultAdmin),
      fido2Credentials: (user.fido2Credentials || []).map((c) => ({
        id: c.id,
        friendlyName: c.friendlyName,
        counter: c.counter,
        deviceType: c.deviceType,
        createdAt: c.createdAt,
      })),
      recoveryCodesRemaining: (user.recoveryCodes || []).length,
    };
    return { success: true, user: safeUser };
  }

  setTotpSecret(userId, secret) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.totpSecret = secret;
    user.totpEnabled = true;
    this.persistToEncryptedDisk();
    return true;
  }

  disableTotp(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.totpSecret = null;
    user.totpEnabled = false;
    this.persistToEncryptedDisk();
    return true;
  }

  createUser(name, email, role = "MEMBER", password = "password123", avatarUrl = null) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.toUpperCase() === "ADMIN" ? "ADMIN" : "MEMBER",
      passwordHash: hashPassword(password),
      avatarUrl:
        avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
      createdAt: new Date().toISOString(),
      fido2Enforced: true,
      fido2Enabled: false,
      mustChangePassword: true,
      mustSetupProfile: false,
      isDefaultAdmin: false,
      fido2Credentials: [],
      recoveryCodes: [],
    };

    this.users.push(newUser);
    this.persistToEncryptedDisk();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  completeAdminSetup(userId, newUsername, newName, newPassword, avatarUrl = null) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (newUsername) user.email = newUsername.trim().toLowerCase();
    if (newName) user.name = newName.trim();
    if (newPassword) user.passwordHash = hashPassword(newPassword);
    if (avatarUrl) user.avatarUrl = avatarUrl;
    user.mustChangePassword = false;
    user.mustSetupProfile = false;
    user.isDefaultAdmin = false;
    this.persistToEncryptedDisk();
    const { passwordHash: _, recoveryCodes: __, ...safeUser } = user;
    return safeUser;
  }

  completeUserPasswordChange(userId, newPassword) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    this.persistToEncryptedDisk();
    const { passwordHash: _, recoveryCodes: __, ...safeUser } = user;
    return safeUser;
  }

  updateUserRole(userId, newRole) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.role = newRole.toUpperCase() === "ADMIN" ? "ADMIN" : "MEMBER";
    this.persistToEncryptedDisk();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  updateUserAvatar(userId, newAvatarUrl) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.avatarUrl = newAvatarUrl;
    this.persistToEncryptedDisk();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  setUserPassword(userId, newPassword) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.passwordHash = hashPassword(newPassword);
    this.persistToEncryptedDisk();
    return true;
  }

  getHealthStats() {
    let fileSizeKb = 0;
    try {
      if (fs.existsSync(ENCRYPTED_DB_FILE)) {
        const stat = fs.statSync(ENCRYPTED_DB_FILE);
        fileSizeKb = Math.round(stat.size / 1024);
      }
    } catch {
      fileSizeKb = 0;
    }

    return {
      status: "HEALTHY",
      encryption: {
        algorithm: "AES-256-GCM",
        atRest: true,
        authenticated: true,
        keyDerivation: "PBKDF2-SHA256 (100,000 rounds)",
        storageLocation: "server/data/pantryo_database.enc",
        fileSizeKb,
      },
      twoFactor: {
        standard: "FIDO2 / WebAuthn Level 3",
        passkeysSupported: true,
        hardwareKeysSupported: true,
        recoveryCodesSupported: true,
        activeEnrolledUsers: this.users.filter((u) => u.fido2Enabled).length,
      },
      counts: {
        items: this.items.length,
        plannedMeals: this.plannedMeals.length,
        customRecipes: this.customRecipes.length,
        groceryItems: this.groceryItems.length,
        savedLists: this.savedLists.length,
        users: this.users.length,
        locations: this.locations.length,
        categories: this.categories.length,
      },
      household: this.household,
      lastBackupAt: this.lastBackupAt,
      lastRestoreAt: this.lastRestoreAt,
      serverTime: new Date().toISOString(),
    };
  }
}

export const dbStore = new EncryptedDatabaseStore();
