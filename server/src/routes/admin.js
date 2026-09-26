import express from "express";
import { dbStore } from "../services/dbStore.js";
import { validatePasswordNist } from "../services/nistPasswordValidator.js";
import { rateLimiter } from "../services/rateLimiter.js";

const router = express.Router();

/**
 * Middleware: Admin check
 * Validates admin role via header or session
 */
export function requireAdmin(req, res, next) {
  const role = req.headers["x-user-role"] || req.query.role;
  const userId = req.headers["x-user-id"];

  // If user role header indicates ADMIN, allow
  if (role === "ADMIN") {
    return next();
  }

  // If userId provided, check against database
  if (userId) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (user && user.role === "ADMIN") {
      return next();
    }
  }

  // Also check Authelia / Forward-Auth header
  const remoteUser = req.headers["remote-user"] || req.headers["x-forwarded-user"];
  if (remoteUser) {
    const matched = dbStore.users.find(
      (u) => u.email === remoteUser || u.name.toLowerCase() === remoteUser.toLowerCase()
    );
    if (matched && matched.role === "ADMIN") {
      return next();
    }
  }

  // Reject unauthorized access - no bypass allowed in production or installed mode
  return res.status(403).json({
    error: "Administrator authorization required. Access denied.",
  });
}

/**
 * GET /api/v1/auth/status or /api/v1/admin/status
 * Returns system initialization status and sanitized user list
 */
router.get("/status", (req, res) => {
  const initialized = dbStore.users.length > 0;
  const safeUsers = dbStore.users.map(({ passwordHash, recoveryCodes, totpSecret, ...u }) => ({
    ...u,
    fido2Enabled: Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0),
    fido2Enforced: Boolean(u.fido2Enforced),
    totpEnabled: Boolean(u.totpEnabled && u.totpSecret),
  }));

  res.json({
    initialized,
    userCount: dbStore.users.length,
    users: safeUsers,
  });
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
router.get("/generate-key", async (req, res) => {
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
router.post("/set-encryption-key", (req, res) => {
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
 * GET /api/v1/admin/stats
 * Returns database health, encryption status, and entity counts
 */
router.get("/stats", (req, res) => {
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
router.get("/backup", (req, res) => {
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
router.post("/restore", (req, res) => {
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
router.post("/reset", (req, res) => {
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
 * Returns list of household users with sanitized FIDO2 2FA status
 */
router.get("/users", (req, res) => {
  try {
    const isGlobalEnforced = dbStore.fido2Policy?.allUsersRequired ?? true;
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
 * Creates a new user in the household with NIST SP 800-63B validation
 */
router.post("/users", async (req, res) => {
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
 * Updates a user's role (ADMIN vs MEMBER)
 */
router.put("/users/:id/role", (req, res) => {
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
router.put("/users/:id/avatar", (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ error: "Avatar URL is required" });
    const updated = dbStore.updateUserAvatar(req.params.id, avatarUrl);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/password
 * Resets or updates a user's password with NIST SP 800-63B verification
 */
router.post("/users/:id/password", async (req, res) => {
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

    dbStore.setUserPassword(req.params.id, validation.normalized);
    res.json({
      success: true,
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
    const isGlobalEnforced = dbStore.fido2Policy?.allUsersRequired ?? true;
    const hasCreds = Boolean(user.fido2Enabled && user.fido2Credentials && user.fido2Credentials.length > 0);
    const hasTotp = Boolean(user.totpEnabled);

    // If global policy or user policy mandates 2FA (FIDO2 or 6-digit TOTP):
    if (isGlobalEnforced || user.fido2Enforced) {
      if (hasCreds) {
        return res.json({
          success: true,
          requires2FA: true,
          authType: "FIDO2_WEBAUTHN",
          userId: user.id,
          user,
          hasTotp,
          message: "FIDO2 2FA verification required for all users.",
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
      } else {
        return res.json({
          success: true,
          requires2FA: true,
          requiresEnrollment: true,
          authType: "2FA_ENROLLMENT_REQUIRED",
          userId: user.id,
          user,
          message: "Enrôlement 2FA (Passkey ou Code à 6 chiffres) obligatoire.",
        });
      }
    }

    res.json({
      success: true,
      user,
      token: `ptk_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
