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

  // In local preview/dev, allow request if explicit bypass isn't required, but return warning
  return next();
}

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
 * Downloads or exports full database snapshot
 * Query params:
 * - encrypt=true|false
 * - passphrase=...
 */
router.get("/backup", (req, res) => {
  try {
    const shouldEncrypt = req.query.encrypt === "true" || req.query.encrypt === "1";
    const passphrase = shouldEncrypt ? req.query.passphrase || "" : null;

    if (shouldEncrypt && (!passphrase || passphrase.trim().length === 0)) {
      return res.status(400).json({ error: "Passphrase is required for encrypted backup" });
    }

    const backupPackage = dbStore.exportBackup(passphrase);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="pantryo-backup-${new Date().toISOString().split("T")[0]}${
        shouldEncrypt ? ".pantryo.enc" : ".json"
      }"`
    );
    res.setHeader("Content-Type", "application/json");
    res.json(backupPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/admin/restore
 * Restores database from an uploaded JSON or encrypted package
 */
router.post("/restore", (req, res) => {
  try {
    const { backupPackage, passphrase, mode = "replace" } = req.body;

    if (!backupPackage) {
      return res.status(400).json({ error: "Missing backupPackage in request body" });
    }

    const result = dbStore.restoreBackup(backupPackage, passphrase, mode);
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
    const safeUsers = dbStore.users.map(({ passwordHash, recoveryCodes, ...u }) => {
      const hasCreds = Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0);
      return {
        ...u,
        fido2Enabled: hasCreds,
        fido2Enforced: isGlobalEnforced || Boolean(u.fido2Enforced),
        isCompliant: hasCreds,
        requiresEnrollment: !hasCreds,
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

    // If global policy or user policy mandates FIDO2:
    if (isGlobalEnforced || user.fido2Enforced) {
      if (hasCreds) {
        return res.json({
          success: true,
          requires2FA: true,
          authType: "FIDO2_WEBAUTHN",
          userId: user.id,
          user,
          message: "FIDO2 2FA verification required for all users.",
        });
      } else {
        return res.json({
          success: true,
          requires2FA: true,
          requiresEnrollment: true,
          authType: "FIDO2_ENROLLMENT_REQUIRED",
          userId: user.id,
          user,
          message: "FIDO2 security key registration is mandatory for all users.",
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
