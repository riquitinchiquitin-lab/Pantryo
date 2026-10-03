import express from "express";
import { dbStore } from "../services/dbStore.js";
import { validatePasswordNist } from "../services/nistPasswordValidator.js";
import { rateLimiter } from "../services/rateLimiter.js";
import { resetGeminiClient as resetVisionGemini } from "../services/geminiVision.js";
import { resetGeminiClient as resetRecipeGemini } from "../services/geminiRecipeParser.js";
import {
  getAuthenticatedUserFromRequest,
  issueSessionToken,
} from "../services/sessionTokenService.js";

const router = express.Router();

/**
 * Middleware: Cryptographic Admin Authorization Check
 * Strictly validates session token.
 * Untrusted client assertions (x-user-role, ?role=, unverified proxy headers) are completely disallowed.
 */
export function requireAdmin(req, res, next) {
  const authUser = getAuthenticatedUserFromRequest(req);
  if (authUser) {
    if (authUser.role === "ADMIN") {
      req.user = authUser;
      return next();
    }
    return res.status(403).json({
      error: "Administrator authorization required. Current account role is insufficient.",
    });
  }

  return res.status(401).json({
    error: "Administrator authorization required. Access denied. Please provide a valid session token.",
  });
}

/**
 * Middleware: Requires any valid authenticated household member
 */
export function requireAuth(req, res, next) {
  const authUser = getAuthenticatedUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({
      error: "Authentication required. Please provide a valid session token.",
    });
  }
  req.user = authUser;
  return next();
}

/**
 * GET /api/v1/auth/status or /api/v1/admin/status
 * Returns system initialization status without leaking user identities or emails (SEC-03 fix)
 */
router.get("/status", (req, res) => {
  const initialized = dbStore.users.length > 0;
  res.json({
    initialized,
    userCount: dbStore.users.length,
    fido2Policy: dbStore.fido2Policy,
    hasAdmin: dbStore.users.some((u) => u.role === "ADMIN"),
  });
});

/**
 * GET /api/v1/auth/public-members
 * Public minimal representation for login screen avatar picker (no emails, no hashes, no recovery codes)
 */
router.get("/public-members", (req, res) => {
  const publicUsers = dbStore.users.map((u) => ({
    id: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl || "/avatars/chef-cat.svg",
    role: u.role,
    fido2Enabled: Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0),
    totpEnabled: Boolean(u.totpEnabled && u.totpSecret),
  }));
  res.json(publicUsers);
});

/**
 * POST /api/v1/auth/session or /api/v1/auth/refresh-session
 * Refreshes/generates a signed session token for the authenticated user
 */
router.post(["/session", "/refresh-session"], (req, res) => {
  try {
    const authUser = getAuthenticatedUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({
        error: "Active authenticated session token is required to refresh session.",
      });
    }

    const token = issueSessionToken(authUser);
    res.json({
      success: true,
      token,
      userId: authUser.id,
      role: authUser.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/setup-admin
 * Initial setup endpoint: creates the primary household administrator account.
 * Only permitted when NO users exist in the system (clean install).
 */
router.post("/setup-admin", async (req, res) => {
  try {
    if (dbStore.users.length > 0) {
      return res.status(403).json({
        error: "Initial setup has already been completed. An administrator account already exists.",
      });
    }

    const { name, username, email, password, avatarUrl, dbEncryptionKey } = req.body;
    const cleanUsername = (username || email || "").trim();
    if (!cleanUsername || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    if (cleanUsername.toLowerCase() === "admin") {
      return res.status(400).json({
        error: "Generic username 'admin' is not permitted. Please choose your personalized username or email.",
      });
    }

    // If custom database encryption key is provided, set it and re-encrypt the storage
    if (dbEncryptionKey && typeof dbEncryptionKey === "string" && dbEncryptionKey.trim().length >= 16) {
      dbStore.setEncryptionKey(dbEncryptionKey.trim());
    }

    // Validate new password against NIST SP 800-63B
    const validation = await validatePasswordNist(password, {
      name: name || cleanUsername,
      email: email || cleanUsername,
      username: cleanUsername.split("@")[0],
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
        validation,
      });
    }

    const newAdmin = dbStore.createUser(
      name || cleanUsername,
      email || cleanUsername,
      "ADMIN",
      validation.normalized,
      avatarUrl || null
    );

    newAdmin.mustChangePassword = false;
    newAdmin.mustSetupProfile = false;
    newAdmin.isDefaultAdmin = false;
    dbStore.persistToEncryptedDisk();

    res.status(201).json({
      success: true,
      message: "Primary administrator account created successfully.",
      user: newAdmin,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/generate-key
 * Generates a 256-bit cryptographically secure AES key for database and backup encryption
 */
router.get("/generate-key", requireAdmin, async (req, res) => {
  try {
    const key = await dbStore.generateEncryptionKey();
    res.json({
      success: true,
      key,
      algorithm: "AES-256-GCM",
      entropyBits: 256,
      subtleCrypto: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/set-encryption-key
 * Re-encrypts the database disk storage with a new user-supplied or generated encryption key
 */
router.post("/set-encryption-key", requireAdmin, (req, res) => {
  try {
    const { encryptionKey } = req.body;
    if (!encryptionKey || typeof encryptionKey !== "string" || encryptionKey.trim().length < 16) {
      return res.status(400).json({
        error: "Encryption key must be at least 16 characters (256-bit recommended).",
      });
    }

    dbStore.setEncryptionKey(encryptionKey.trim());
    res.json({
      success: true,
      message: "Database successfully re-encrypted with new key and saved to disk.",
      algorithm: "AES-256-GCM",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/settings
 * Retrieves operational system, network, and integration settings
 */
router.get("/settings", requireAdmin, (req, res) => {
  try {
    const settings = dbStore.getSystemSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/settings
 * Updates operational system, network, and integration settings
 */
router.post("/settings", requireAdmin, (req, res) => {
  try {
    const updates = req.body || {};
    const updatedSettings = dbStore.updateSystemSettings(updates);
    
    // Refresh cached Gemini AI clients with updated API key
    resetVisionGemini();
    resetRecipeGemini();

    res.json({
      success: true,
      message: "Paramètres système et réseau mis à jour avec succès.",
      settings: updatedSettings,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/test-gemini
 * Verifies connectivity of the configured Google Gemini API Key
 */
router.post("/test-gemini", requireAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body;
    const cleanInputKey = apiKey && !apiKey.includes("•") ? apiKey.trim() : "";
    const keyToTest = (cleanInputKey || process.env.GEMINI_API_KEY || dbStore?.systemSettings?.geminiApiKey || "").trim();
    if (!keyToTest) {
      return res.status(400).json({ error: "Aucune clé API Gemini fournie à tester (non trouvée dans l'environnement Google ni dans les paramètres)." });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const testClient = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const response = await testClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Respond with the word 'OK' to test connectivity.",
    });

    const reply = response?.text?.trim() || "OK";
    resetVisionGemini();
    resetRecipeGemini();
    res.json({
      success: true,
      message: "Connexion API Gemini validée avec succès ! Les fonctionnalités Vision & Recettes IA sont opérationnelles.",
      model: "gemini-3.8-flash",
      reply,
    });
  } catch (err) {
    const isQuotaExceeded =
      err.message &&
      (err.message.includes("resource_exhausted") ||
        err.message.includes("quota") ||
        err.message.includes("rate-limits") ||
        err.message.includes("429"));

    const friendlyError = isQuotaExceeded
      ? "Quota ou limite d'appels de l'API Gemini atteinte (Resource Exhausted). Les moteurs hors-ligne et OCR restent 100% actifs. Veuillez vérifier vos quotas sur ai.google.dev."
      : `Échec du test de clé Gemini: ${err.message || "Clé invalide."}`;

    res.status(400).json({
      success: false,
      isQuotaExceeded: Boolean(isQuotaExceeded),
      error: friendlyError,
    });
  }
});

/**
 * GET /api/v1/admin/stats
 * Returns database health, encryption status, and entity counts
 */
router.get("/stats", requireAdmin, (req, res) => {
  try {
    const stats = dbStore.getHealthStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/backup
 * Downloads full encrypted database snapshot.
 * Requires an encryption key to download.
 */
router.get("/backup", requireAdmin, (req, res) => {
  try {
    const key = (req.query.passphrase || req.query.key || "").trim();

    if (!key || key.length === 0) {
      return res.status(400).json({
        error: "An encryption key is required to download the database backup.",
      });
    }

    const backupPackage = dbStore.exportBackup(key);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pantryo-backup-${new Date().toISOString().split("T")[0]}.pantryo.enc"`
    );
    res.setHeader("Content-Type", "application/json");
    res.json(backupPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/restore
 * Restores database from an uploaded encrypted package.
 * Requires the encryption key to decrypt and restore.
 */
router.post("/restore", requireAdmin, (req, res) => {
  try {
    const { backupPackage, passphrase, key, mode = "replace" } = req.body;
    const decryptionKey = (passphrase || key || "").trim();

    if (!backupPackage) {
      return res.status(400).json({ error: "Missing backupPackage in request body" });
    }

    if (!decryptionKey || decryptionKey.length === 0) {
      return res.status(400).json({
        error: "The encryption key is required to decrypt and restore this backup.",
      });
    }

    const result = dbStore.restoreBackup(backupPackage, decryptionKey, mode);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/reset
 * Resets database to factory seed data or wipes it
 */
router.post("/reset", requireAdmin, (req, res) => {
  try {
    const { action = "seed" } = req.body;
    if (action === "wipe") {
      const result = dbStore.wipeAll();
      return res.json(result);
    }
    const result = dbStore.factoryReset();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/users
 * Returns list of household users with sanitized FIDO2 2FA status (Admin Protected)
 */
router.get("/users", requireAdmin, (req, res) => {
  try {
    const isGlobalEnforced = Boolean(dbStore.fido2Policy?.allUsersRequired);
    const safeUsers = dbStore.users.map(({ passwordHash, recoveryCodes, totpSecret, ...u }) => {
      const hasCreds = Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0);
      return {
        ...u,
        fido2Enabled: hasCreds,
        fido2Enforced: isGlobalEnforced || Boolean(u.fido2Enforced),
        totpEnabled: Boolean(u.totpEnabled && u.totpSecret),
        isCompliant: hasCreds || Boolean(u.totpEnabled && u.totpSecret),
        requiresEnrollment: !hasCreds && !u.totpEnabled,
        mustChangePassword: Boolean(u.mustChangePassword),
        mustSetupProfile: Boolean(u.mustSetupProfile),
        isDefaultAdmin: Boolean(u.isDefaultAdmin),
        fido2Credentials: (u.fido2Credentials || []).map((c) => ({
          id: c.id,
          friendlyName: c.friendlyName,
          counter: c.counter,
          deviceType: c.deviceType,
          createdAt: c.createdAt,
        })),
        recoveryCodesRemaining: (u.recoveryCodes || []).length,
      };
    });
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/validate-password
 * Interactive NIST SP 800-63B Password Screening Endpoint
 */
router.post("/validate-password", async (req, res) => {
  try {
    const { password, name, email, username } = req.body;
    const result = await validatePasswordNist(password, { name, email, username });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/admin/nist-policy
 * Details of NIST SP 800-63B & Modern Authentication Standards Configuration
 */
router.get("/nist-policy", (req, res) => {
  res.json({
    specification: "NIST Special Publication 800-63B (Digital Identity Guidelines)",
    principles: {
      lengthOverComplexity: {
        minimumLength: 8,
        recommendedLength: 15,
        maximumLength: 256,
        arbitraryCompositionRequired: false,
        allPrintableCharactersPermitted: true,
        spacesPermitted: true,
        unicodeNFKCNormalized: true,
      },
      bannedObsoletePolicies: {
        periodicExpiration: false,
        periodicExpirationRationale: "Arbitrary 60/90-day resets incentivize predictable variations. Resets enforced only upon compromise.",
        knowledgeBasedQuestions: false,
        knowledgeBasedRationale: "Security questions easily compromised via OSINT and social engineering.",
        pastingAllowed: true,
        passwordManagersEncouraged: true,
      },
      proactiveScreening: {
        hibpKAnonymityEnabled: true,
        offlineBlocklistEnabled: true,
        contextTermsScreened: true,
        sequentialPatternsScreened: true,
      },
      storageAndHandling: {
        memoryHardKdf: "scrypt (N=32768, r=8, p=1, maxmem=64MB)",
        legacyPbkdf2Supported: true,
        progressiveThrottling: true,
        permanentLockoutDisabled: true,
      },
      authenticationHierarchy: [
        {
          tier: 1,
          badge: "HIGHEST",
          title: "Passkeys / WebAuthn (FIDO2)",
          description: "Cryptographically signed with public-key cryptography, hardware-backed, mathematically immune to phishing and server breaches.",
        },
        {
          tier: 2,
          badge: "HIGH",
          title: "Passphrases + Phishing-Resistant MFA",
          description: "Multi-word passphrases (16+ characters) exceeding high-entropy baselines, backed by hardware security keys or authenticator apps.",
        },
        {
          tier: 3,
          badge: "STANDARD",
          title: "Random Machine-Generated Strings",
          description: "16–32 character high-entropy pseudorandom strings generated and managed in a reputable password manager.",
        },
        {
          tier: 4,
          badge: "BANNED / OBSOLETE",
          title: "Short 'Complex' Passwords & 90-day Resets",
          description: "Enforcing symbol requirements (P@ssword1!) and forced periodic password rotations are actively discouraged by NIST.",
        },
      ],
    },
  });
});

/**
 * POST /api/v1/admin/users
 * Creates a new user in the household with NIST SP 800-63B validation (Admin only)
 */
router.post("/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password, avatarUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const initialPassword = password || "correct-horse-battery-staple";

    // Validate against NIST SP 800-63B
    const validation = await validatePasswordNist(initialPassword, {
      name,
      email,
      username: email.split("@")[0],
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
        validation,
      });
    }

    const newUser = dbStore.createUser(
      name,
      email,
      role,
      validation.normalized,
      avatarUrl
    );
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/admin/users/:id/role
 * Updates a user's role (ADMIN vs MEMBER) - Admin only
 */
router.put("/users/:id/role", requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });
    const updated = dbStore.updateUserRole(req.params.id, role);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/admin/users/:id/avatar
 * Updates a user's profile avatar picture (URL or Base64 data URL)
 */
router.put("/users/:id/avatar", requireAuth, (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "You can only update your own avatar." });
    }

    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ error: "Avatar URL is required" });
    const updated = dbStore.updateUserAvatar(req.params.id, avatarUrl);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/admin/users/:id/profile
 * Updates a user's display name and/or personal username/email
 */
router.put("/users/:id/profile", requireAuth, (req, res) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "You can only update your own profile." });
    }

    const { name, email, username } = req.body;
    const user = dbStore.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newName = (name !== undefined ? name : user.name).trim();
    const newUsername = (username !== undefined ? username : (email !== undefined ? email : user.email)).trim();

    if (!newName) return res.status(400).json({ error: "Display name cannot be empty" });
    if (!newUsername) return res.status(400).json({ error: "Username or email cannot be empty" });

    // Check duplicate
    const duplicate = dbStore.users.find(
      (u) => u.id !== user.id && (u.email.toLowerCase() === newUsername.toLowerCase() || u.name.toLowerCase() === newName.toLowerCase())
    );
    if (duplicate) {
      return res.status(400).json({ error: "Another member is already using that name or username/email" });
    }

    const updated = dbStore.updateUserProfile(req.params.id, newName, newUsername);
    const { passwordHash, recoveryCodes, totpSecret, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/v1/admin/users/:id
 * Deletes a user/member from the household database (Admin only)
 */
router.delete("/users/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = dbStore.deleteUser(id);

    const isGlobalEnforced = Boolean(dbStore.fido2Policy?.allUsersRequired);
    const safeUsers = dbStore.users.map(({ passwordHash, recoveryCodes, totpSecret, ...u }) => {
      const hasCreds = Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0);
      return {
        ...u,
        fido2Enabled: hasCreds,
        fido2Enforced: isGlobalEnforced || Boolean(u.fido2Enforced),
        totpEnabled: Boolean(u.totpEnabled && u.totpSecret),
        isCompliant: hasCreds || Boolean(u.totpEnabled && u.totpSecret),
        requiresEnrollment: !hasCreds && !u.totpEnabled,
        mustChangePassword: Boolean(u.mustChangePassword),
        mustSetupProfile: Boolean(u.mustSetupProfile),
        isDefaultAdmin: Boolean(u.isDefaultAdmin),
        fido2Credentials: (u.fido2Credentials || []).map((c) => ({
          id: c.id,
          friendlyName: c.friendlyName,
          counter: c.counter,
          deviceType: c.deviceType,
          createdAt: c.createdAt,
        })),
        recoveryCodesRemaining: (u.recoveryCodes || []).length,
      };
    });

    res.json({
      success: true,
      message: result.message,
      users: safeUsers,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/admin/household/name
 * Renames the active kitchen/household (Admin only - exclusive to Admin pane)
 */
router.put("/household/name", requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Kitchen name is required." });
    }
    const result = dbStore.updateHouseholdName(name.trim());
    res.json({
      success: true,
      message: `Kitchen name updated to "${result.household.name}"`,
      household: result.household,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/password
 * Resets or updates a user's password with NIST SP 800-63B verification (Admin only)
 */
router.post("/users/:id/password", requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = dbStore.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate against NIST SP 800-63B
    const validation = await validatePasswordNist(password, {
      name: user.name,
      email: user.email,
      username: user.email?.split("@")[0],
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
        validation,
      });
    }

    dbStore.setUserPassword(user.id, validation.normalized);
    const refreshedToken = issueSessionToken(user);
    res.json({
      success: true,
      token: refreshedToken,
      message: "Password updated successfully in compliance with NIST SP 800-63B.",
      validation: {
        entropyBits: validation.entropyBits,
        nistCompliant: validation.nistCompliant,
        recommendation: validation.warnings[0] || null,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/complete-setup
 * Onboarding endpoint for default admin:
 * Replaces default "admin" / "pnatryo" with personalized username and password, removing default credentials.
 */
router.post("/users/:id/complete-setup", async (req, res) => {
  try {
    const { newUsername, newName, newPassword, avatarUrl } = req.body;
    if (!newUsername || !newPassword) {
      return res.status(400).json({ error: "Personalized username and new password are required" });
    }

    const user = dbStore.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate new password against NIST SP 800-63B
    const validation = await validatePasswordNist(newPassword, {
      name: newName || user.name,
      email: newUsername,
      username: newUsername.split("@")[0],
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
        validation,
      });
    }

    const updatedUser = dbStore.completeAdminSetup(
      req.params.id,
      newUsername,
      newName || newUsername,
      validation.normalized,
      avatarUrl || null
    );

    res.json({
      success: true,
      message: "Personalized administrator account successfully initialized. Default password has been removed.",
      user: updatedUser,
      token: issueSessionToken(updatedUser),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/change-password
 * Mandatory password change endpoint for users upon first login
 */
router.post("/users/:id/change-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const user = dbStore.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Validate new password against NIST SP 800-63B
    const validation = await validatePasswordNist(newPassword, {
      name: user.name,
      email: user.email,
      username: user.email?.split("@")[0],
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
        validation,
      });
    }

    const updatedUser = dbStore.completeUserPasswordChange(
      req.params.id,
      validation.normalized
    );

    res.json({
      success: true,
      message: "Password changed successfully.",
      user: updatedUser,
      token: issueSessionToken(updatedUser),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/login
 * Verifies email/name and password, checking for progressive throttling and FIDO2 2FA
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

    // 1. NIST SP 800-63B Progressive Rate Limiting & Throttling
    const throttleCheck = rateLimiter.check(clientIp, username);
    if (throttleCheck.throttled) {
      return res.status(429).json({
        error: throttleCheck.message,
        retryAfterMs: throttleCheck.delayMs,
        failedCount: throttleCheck.failedCount,
      });
    }

    // Optional artificial micro-delay if previous failures occurred
    if (throttleCheck.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, throttleCheck.delayMs));
    }

    const authResult = dbStore.authenticateUser(username, password);
    if (!authResult.success) {
      // Record failure for progressive throttling
      const failureStats = rateLimiter.recordFailure(clientIp, username);
      return res.status(401).json({
        error: authResult.error,
        failedAttempts: failureStats.failedCount,
      });
    }

    // Record success to reset throttle counter
    rateLimiter.recordSuccess(clientIp, username);

    const user = authResult.user;
    const isGlobalEnforced = Boolean(dbStore.fido2Policy?.allUsersRequired);
    const hasCreds = Boolean(user.fido2Enabled && user.fido2Credentials && user.fido2Credentials.length > 0);
    const hasTotp = Boolean(user.totpEnabled);

    // Only challenge for 2FA if:
    // - User explicitly has fido2Enforced enabled OR
    // - Global policy enforces 2FA AND user has enrolled credentials or TOTP
    if (user.fido2Enforced || (isGlobalEnforced && (hasCreds || hasTotp))) {
      if (hasCreds) {
        return res.json({
          success: true,
          requires2FA: true,
          authType: "FIDO2_WEBAUTHN",
          userId: user.id,
          user,
          hasTotp,
          message: "FIDO2 2FA verification required.",
        });
      } else if (hasTotp) {
        return res.json({
          success: true,
          requires2FA: true,
          authType: "TOTP_6DIGIT",
          userId: user.id,
          user,
          hasTotp: true,
          message: "2ème facteur à 6 chiffres requis.",
        });
      }
    }

    res.json({
      success: true,
      user,
      token: issueSessionToken(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/auth/me
 * Validates the caller's session token and returns the current user profile
 */
router.get("/me", (req, res) => {
  const authUser = getAuthenticatedUserFromRequest(req);
  if (!authUser) {
    return res.status(401).json({ error: "Session invalid or expired" });
  }

  const { passwordHash, recoveryCodes, totpSecret, ...safeUser } = authUser;
  res.json({
    success: true,
    user: safeUser,
  });
});

export default router;
