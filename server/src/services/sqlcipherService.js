import Database from "better-sqlite3-multiple-ciphers";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const SQLCIPHER_DB_FILE = path.join(DATA_DIR, "pantryo_sqlcipher.db");
const INSTALLATION_META_FILE = path.join(DATA_DIR, "installation.meta");

/**
 * Retrieves or initializes a unique installation identifier for per-installation database management.
 */
export function getOrCreateInstallationId() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(INSTALLATION_META_FILE)) {
      const saved = fs.readFileSync(INSTALLATION_META_FILE, "utf8").trim();
      if (saved) return saved;
    }
    const newId = `inst_pantryo_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    fs.writeFileSync(INSTALLATION_META_FILE, newId, "utf8");
    return newId;
  } catch (err) {
    return `inst_pantryo_fallback_${Date.now()}`;
  }
}

/**
 * Manages local-first SQLite storage with SQLCipher encryption.
 * Enforces per-installation encryption, page-level authenticated storage (AES-256-CBC with PBKDF2),
 * and transparent atomic transactions.
 */
export class SqlcipherService {
  constructor() {
    this.db = null;
    this.activeKey = null;
    this.installationId = getOrCreateInstallationId();
    this.isInitialized = false;
  }

  /**
   * Initializes the encrypted SQLite database with SQLCipher.
   */
  init(key) {
    if (!key || typeof key !== "string" || key.trim().length === 0) {
      throw new Error("[SQLCipher] Encryption key must not be empty");
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const cleanKey = key.trim();
    this.activeKey = cleanKey;

    try {
      if (this.db) {
        try {
          this.db.close();
        } catch (_) {}
      }

      this.db = new Database(SQLCIPHER_DB_FILE);

      // Configure SQLCipher encryption profile
      this.db.pragma("cipher = 'sqlcipher'");
      this.db.pragma(`key = '${cleanKey.replace(/'/g, "''")}'`);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("synchronous = NORMAL");
      this.db.pragma("foreign_keys = ON");

      // Verify that SQLCipher is active and key is accepted
      this.db.prepare("SELECT 1").get();
    } catch (err) {
      if (err.message && err.message.includes("not a database")) {
        console.warn("[SQLCipher] Database could not be opened with current key (key rotated or mismatched). Creating fresh SQLCipher database with new key...");
        try {
          if (this.db) this.db.close();
        } catch (_) {}
        try {
          if (fs.existsSync(SQLCIPHER_DB_FILE)) fs.unlinkSync(SQLCIPHER_DB_FILE);
          const wal = `${SQLCIPHER_DB_FILE}-wal`;
          const shm = `${SQLCIPHER_DB_FILE}-shm`;
          if (fs.existsSync(wal)) fs.unlinkSync(wal);
          if (fs.existsSync(shm)) fs.unlinkSync(shm);
        } catch (cleanupErr) {
          console.warn("[SQLCipher] Cleanup note:", cleanupErr.message);
        }

        // Fresh open with clean key
        this.db = new Database(SQLCIPHER_DB_FILE);
        this.db.pragma("cipher = 'sqlcipher'");
        this.db.pragma(`key = '${cleanKey.replace(/'/g, "''")}'`);
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("synchronous = NORMAL");
        this.db.pragma("foreign_keys = ON");
        this.db.prepare("SELECT 1").get();
      } else {
        console.error("[SQLCipher] Failed to initialize encrypted SQLite database:", err.message);
        this.isInitialized = false;
        throw err;
      }
    }

    try {
      // Bootstrap schema tables & indices
      this.createSchema();
      this.isInitialized = true;

      // Update installation metadata
      this.setMetadata("installation_id", this.installationId);
      this.setMetadata("cipher", "sqlcipher");
      this.setMetadata("last_opened_at", new Date().toISOString());

      console.log(
        `[SQLCipher] Local-first encrypted SQLite database initialized successfully (Installation ID: ${this.installationId})`
      );
      return true;
    } catch (schemaErr) {
      console.error("[SQLCipher] Schema creation error:", schemaErr.message);
      this.isInitialized = false;
      throw schemaErr;
    }
  }

  /**
   * Creates relational tables and indexes for complete kitchen management.
   */
  createSchema() {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS household (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT,
        updated_at TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'MEMBER',
        password_hash TEXT,
        avatar_url TEXT,
        fido2_enabled INTEGER DEFAULT 0,
        fido2_enforced INTEGER DEFAULT 1,
        totp_enabled INTEGER DEFAULT 0,
        totp_secret TEXT,
        must_change_password INTEGER DEFAULT 0,
        must_setup_profile INTEGER DEFAULT 0,
        is_default_admin INTEGER DEFAULT 0,
        created_at TEXT,
        raw_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        household_id TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        household_id TEXT,
        image_url TEXT,
        description TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit TEXT,
        household_id TEXT,
        location_id TEXT,
        category_id TEXT,
        added_by_id TEXT,
        status TEXT DEFAULT 'ACTIVE',
        expiration_date TEXT,
        frozen_at TEXT,
        months_frozen_shelf_life INTEGER,
        defrosted_at TEXT,
        image_url TEXT,
        notes TEXT,
        barcode TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_items_status ON inventory_items(status);
      CREATE INDEX IF NOT EXISTS idx_items_loc ON inventory_items(location_id);
      CREATE INDEX IF NOT EXISTS idx_items_exp ON inventory_items(expiration_date);

      CREATE TABLE IF NOT EXISTS planned_meals (
        id TEXT PRIMARY KEY,
        date TEXT,
        meal_type TEXT,
        title TEXT,
        recipe_id TEXT,
        servings INTEGER,
        created_at TEXT,
        raw_json TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_meals_date ON planned_meals(date);

      CREATE TABLE IF NOT EXISTS custom_recipes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_fr TEXT,
        image_url TEXT,
        time TEXT,
        servings TEXT,
        difficulty TEXT,
        source TEXT,
        created_at TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS grocery_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit TEXT,
        checked INTEGER DEFAULT 0,
        category_id TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS saved_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT,
        raw_json TEXT
      );

      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  /**
   * Re-encrypts the SQLCipher database with a new encryption key (in-place zero-downtime rekey).
   */
  rekey(newKey) {
    if (!this.db) {
      throw new Error("[SQLCipher] Database is not open");
    }
    if (!newKey || typeof newKey !== "string" || newKey.trim().length < 16) {
      throw new Error("[SQLCipher] New key must be at least 16 characters");
    }

    const cleanKey = newKey.trim();
    try {
      this.db.pragma(`rekey = '${cleanKey.replace(/'/g, "''")}'`);
      this.activeKey = cleanKey;
      this.setMetadata("rekeyed_at", new Date().toISOString());
      console.log("[SQLCipher] Database successfully re-keyed with new encryption key.");
      return true;
    } catch (err) {
      console.error("[SQLCipher] Failed to rekey database:", err);
      throw err;
    }
  }

  /**
   * Saves metadata key-value pair
   */
  setMetadata(key, value) {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare("INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)");
      stmt.run(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch (e) {
      console.warn("[SQLCipher] Metadata error:", e.message);
    }
  }

  /**
   * Retrieves metadata value
   */
  getMetadata(key) {
    if (!this.db) return null;
    try {
      const row = this.db.prepare("SELECT value FROM db_metadata WHERE key = ?").get(key);
      return row ? row.value : null;
    } catch {
      return null;
    }
  }

  /**
   * Saves a complete snapshot into SQLite SQLCipher tables in an atomic transaction.
   */
  saveSnapshot(snapshot) {
    if (!this.db) return false;

    try {
      const tx = this.db.transaction(() => {
        // 1. Household
        if (snapshot.household) {
          const stmt = this.db.prepare(
            "INSERT OR REPLACE INTO household (id, name, invite_code, updated_at, raw_json) VALUES (?, ?, ?, ?, ?)"
          );
          stmt.run(
            snapshot.household.id || "hh_pantryo_main",
            snapshot.household.name || "My Kitchen",
            snapshot.household.inviteCode || "PANTRY-KITCHEN",
            new Date().toISOString(),
            JSON.stringify(snapshot.household)
          );
        }

        // 2. Users
        if (Array.isArray(snapshot.users)) {
          this.db.prepare("DELETE FROM users").run();
          const userStmt = this.db.prepare(`
            INSERT INTO users (
              id, name, email, role, password_hash, avatar_url,
              fido2_enabled, fido2_enforced, totp_enabled, totp_secret,
              must_change_password, must_setup_profile, is_default_admin,
              created_at, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const u of snapshot.users) {
            userStmt.run(
              u.id,
              u.name || "",
              u.email || "",
              u.role || "MEMBER",
              u.passwordHash || null,
              u.avatarUrl || null,
              u.fido2Enabled ? 1 : 0,
              u.fido2Enforced ? 1 : 0,
              u.totpEnabled ? 1 : 0,
              u.totpSecret || null,
              u.mustChangePassword ? 1 : 0,
              u.mustSetupProfile ? 1 : 0,
              u.isDefaultAdmin ? 1 : 0,
              u.createdAt || new Date().toISOString(),
              JSON.stringify(u)
            );
          }
        }

        // 3. Locations
        if (Array.isArray(snapshot.locations)) {
          this.db.prepare("DELETE FROM locations").run();
          const locStmt = this.db.prepare(
            "INSERT INTO locations (id, name, type, household_id, raw_json) VALUES (?, ?, ?, ?, ?)"
          );
          for (const loc of snapshot.locations) {
            locStmt.run(loc.id, loc.name, loc.type, loc.householdId, JSON.stringify(loc));
          }
        }

        // 4. Categories
        if (Array.isArray(snapshot.categories)) {
          this.db.prepare("DELETE FROM categories").run();
          const catStmt = this.db.prepare(
            "INSERT INTO categories (id, name, icon, color, household_id, image_url, description, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          );
          for (const cat of snapshot.categories) {
            catStmt.run(
              cat.id,
              cat.name,
              cat.icon || null,
              cat.color || null,
              cat.householdId || null,
              cat.imageUrl || null,
              cat.description || null,
              JSON.stringify(cat)
            );
          }
        }

        // 5. Inventory Items
        if (Array.isArray(snapshot.items)) {
          this.db.prepare("DELETE FROM inventory_items").run();
          const itemStmt = this.db.prepare(`
            INSERT INTO inventory_items (
              id, name, quantity, unit, household_id, location_id, category_id,
              added_by_id, status, expiration_date, frozen_at, months_frozen_shelf_life,
              defrosted_at, image_url, notes, barcode, created_at, updated_at, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const item of snapshot.items) {
            itemStmt.run(
              item.id,
              item.name,
              Number(item.quantity) || 1,
              item.unit || "unit",
              item.householdId || null,
              item.locationId || null,
              item.categoryId || null,
              item.addedById || null,
              item.status || "ACTIVE",
              item.expirationDate || null,
              item.frozenAt || null,
              item.monthsFrozenShelfLife || null,
              item.defrostedAt || null,
              item.imageUrl || null,
              item.notes || null,
              item.barcode || null,
              item.createdAt || new Date().toISOString(),
              item.updatedAt || new Date().toISOString(),
              JSON.stringify(item)
            );
          }
        }

        // 6. Planned Meals
        if (Array.isArray(snapshot.plannedMeals)) {
          this.db.prepare("DELETE FROM planned_meals").run();
          const mealStmt = this.db.prepare(
            "INSERT INTO planned_meals (id, date, meal_type, title, recipe_id, servings, created_at, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          );
          for (const meal of snapshot.plannedMeals) {
            mealStmt.run(
              meal.id,
              meal.date || null,
              meal.mealType || "DINNER",
              meal.title || "",
              meal.recipeId || null,
              Number(meal.servings) || 2,
              meal.createdAt || new Date().toISOString(),
              JSON.stringify(meal)
            );
          }
        }

        // 7. Custom Recipes
        if (Array.isArray(snapshot.customRecipes)) {
          this.db.prepare("DELETE FROM custom_recipes").run();
          const recipeStmt = this.db.prepare(
            "INSERT INTO custom_recipes (id, title, title_fr, image_url, time, servings, difficulty, source, created_at, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          );
          for (const recipe of snapshot.customRecipes) {
            recipeStmt.run(
              recipe.id,
              recipe.title,
              recipe.titleFr || null,
              recipe.imageUrl || null,
              recipe.time || null,
              recipe.servings || null,
              recipe.difficulty || null,
              recipe.source || "Custom",
              recipe.createdAt || new Date().toISOString(),
              JSON.stringify(recipe)
            );
          }
        }

        // 8. Grocery Items
        if (Array.isArray(snapshot.groceryItems)) {
          this.db.prepare("DELETE FROM grocery_items").run();
          const grocStmt = this.db.prepare(
            "INSERT INTO grocery_items (id, name, quantity, unit, checked, category_id, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?)"
          );
          for (const groc of snapshot.groceryItems) {
            grocStmt.run(
              groc.id,
              groc.name,
              Number(groc.quantity) || 1,
              groc.unit || "unit",
              groc.checked ? 1 : 0,
              groc.categoryId || null,
              JSON.stringify(groc)
            );
          }
        }

        // 9. Saved Lists
        if (Array.isArray(snapshot.savedLists)) {
          this.db.prepare("DELETE FROM saved_lists").run();
          const listStmt = this.db.prepare(
            "INSERT INTO saved_lists (id, name, created_at, raw_json) VALUES (?, ?, ?, ?)"
          );
          for (const list of snapshot.savedLists) {
            listStmt.run(list.id, list.name, list.createdAt || new Date().toISOString(), JSON.stringify(list));
          }
        }

        // 10. Metadata
        this.setMetadata("schema_version", snapshot.schemaVersion || "1.0");
        this.setMetadata("app", "Pantryo");
        this.setMetadata("updated_at", new Date().toISOString());
        if (snapshot.lastBackupAt) this.setMetadata("last_backup_at", snapshot.lastBackupAt);
        if (snapshot.lastRestoreAt) this.setMetadata("last_restore_at", snapshot.lastRestoreAt);
        if (snapshot.fido2Policy) this.setMetadata("fido2_policy", JSON.stringify(snapshot.fido2Policy));
        if (snapshot.systemSettings) this.setMetadata("system_settings", JSON.stringify(snapshot.systemSettings));
      });

      tx();
      return true;
    } catch (err) {
      console.error("[SQLCipher] Error saving snapshot to SQLite database:", err);
      return false;
    }
  }

  /**
   * Loads complete dataset from the encrypted SQLCipher tables.
   */
  loadSnapshot() {
    if (!this.db) return null;

    try {
      // 1. Household
      let household = null;
      const hhRow = this.db.prepare("SELECT * FROM household LIMIT 1").get();
      if (hhRow) {
        household = hhRow.raw_json ? JSON.parse(hhRow.raw_json) : { id: hhRow.id, name: hhRow.name, inviteCode: hhRow.invite_code };
      }

      // 2. Users
      const users = this.db
        .prepare("SELECT * FROM users")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 3. Locations
      const locations = this.db
        .prepare("SELECT * FROM locations")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 4. Categories
      const categories = this.db
        .prepare("SELECT * FROM categories")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 5. Items
      const items = this.db
        .prepare("SELECT * FROM inventory_items")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 6. Planned Meals
      const plannedMeals = this.db
        .prepare("SELECT * FROM planned_meals")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 7. Custom Recipes
      const customRecipes = this.db
        .prepare("SELECT * FROM custom_recipes")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 8. Grocery Items
      const groceryItems = this.db
        .prepare("SELECT * FROM grocery_items")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 9. Saved Lists
      const savedLists = this.db
        .prepare("SELECT * FROM saved_lists")
        .all()
        .map((row) => (row.raw_json ? JSON.parse(row.raw_json) : row));

      // 10. Policy & timestamps & system settings
      const rawPolicy = this.getMetadata("fido2_policy");
      const fido2Policy = rawPolicy ? JSON.parse(rawPolicy) : { allUsersRequired: true, enforced: true };

      const rawSettings = this.getMetadata("system_settings");
      const systemSettings = rawSettings ? JSON.parse(rawSettings) : null;

      return {
        household,
        users,
        locations,
        categories,
        items,
        plannedMeals,
        customRecipes,
        groceryItems,
        savedLists,
        fido2Policy,
        systemSettings,
        lastBackupAt: this.getMetadata("last_backup_at"),
        lastRestoreAt: this.getMetadata("last_restore_at"),
      };
    } catch (err) {
      console.warn("[SQLCipher] Failed to read snapshot from SQLite:", err.message);
      return null;
    }
  }

  /**
   * Retrieves operational health and cryptographic statistics for the SQLite database.
   */
  getStats() {
    let fileSizeKb = 0;
    try {
      if (fs.existsSync(SQLCIPHER_DB_FILE)) {
        const stat = fs.statSync(SQLCIPHER_DB_FILE);
        fileSizeKb = Math.round(stat.size / 1024);
      }
    } catch {
      fileSizeKb = 0;
    }

    let pageCount = 0;
    let pageSize = 4096;
    let journalMode = "wal";
    let sqliteVersion = "3.x";

    if (this.db) {
      try {
        const verRow = this.db.prepare("SELECT sqlite_version() as v").get();
        if (verRow) sqliteVersion = verRow.v;
        const pageCountRow = this.db.pragma("page_count");
        if (pageCountRow && pageCountRow[0]) pageCount = pageCountRow[0].page_count;
        const pageSizeRow = this.db.pragma("page_size");
        if (pageSizeRow && pageSizeRow[0]) pageSize = pageSizeRow[0].page_size;
        const jmRow = this.db.pragma("journal_mode");
        if (jmRow && jmRow[0]) journalMode = jmRow[0].journal_mode;
      } catch (e) {
        console.warn("[SQLCipher] Stats pragma note:", e.message);
      }
    }

    const tableCounts = {};
    if (this.db) {
      const tables = ["household", "users", "locations", "categories", "inventory_items", "planned_meals", "custom_recipes", "grocery_items", "saved_lists"];
      for (const t of tables) {
        try {
          const r = this.db.prepare(`SELECT count(*) as c FROM ${t}`).get();
          tableCounts[t] = r ? r.c : 0;
        } catch {
          tableCounts[t] = 0;
        }
      }
    }

    return {
      engine: "SQLite 3 with SQLCipher",
      cipher: "SQLCipher (AES-256-CBC, PBKDF2/HMAC-SHA512)",
      isEncrypted: true,
      storageFile: "server/data/pantryo_sqlcipher.db",
      fileSizeKb,
      pageCount,
      pageSize,
      journalMode,
      sqliteVersion,
      installationId: this.installationId,
      tableCounts,
    };
  }
}

export const sqlcipherService = new SqlcipherService();
