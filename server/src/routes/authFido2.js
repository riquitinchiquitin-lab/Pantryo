import express from "express";
import { dbStore } from "../services/dbStore.js";
import { fido2Service } from "../services/fido2Service.js";

const router = express.Router();

/**
 * Helper to look up user by ID, email, or username
 */
function findUser(identifier) {
  if (!identifier) return null;
  const idStr = String(identifier).trim().toLowerCase();
  return dbStore.users.find(
    (u) =>
      u.id === identifier ||
      u.email?.toLowerCase() === idStr ||
      u.name?.toLowerCase() === idStr
  );
}

/**
 * GET /api/v1/auth/fido2/policy
 * Returns global FIDO2 security policy requiring all household users to use FIDO2
 */
router.get("/policy", (req, res) => {
  try {
    const policy = dbStore.fido2Policy || { allUsersRequired: true, enforced: true };
    const totalUsers = dbStore.users.length;
    const compliantUsers = dbStore.users.filter(
      (u) => Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0)
    ).length;

    res.json({
      allUsersRequired: policy.allUsersRequired ?? true,
      enforced: policy.enforced ?? true,
      totalUsers,
      compliantUsers,
      nonCompliantUsers: totalUsers - compliantUsers,
      users: dbStore.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        fido2Enabled: Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0),
        fido2Enforced: true,
        credentialsCount: (u.fido2Credentials || []).length,
        isCompliant: Boolean(u.fido2Enabled && u.fido2Credentials?.length > 0),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/auth/fido2/status/:userId
 * Returns FIDO2 status, enrolled credentials summary, and remaining recovery codes count
 */
router.get("/status/:userId", (req, res) => {
  try {
    const user = findUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const credentials = (user.fido2Credentials || []).map((c) => ({
      id: c.id,
      friendlyName: c.friendlyName,
      counter: c.counter,
      deviceType: c.deviceType,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt || null,
    }));

    const isGlobalEnforced = dbStore.fido2Policy?.allUsersRequired ?? true;
    const hasCredentials = Boolean(user.fido2Enabled && credentials.length > 0);

    res.json({
      fido2Enabled: hasCredentials,
      fido2Enforced: isGlobalEnforced || Boolean(user.fido2Enforced),
      allUsersRequired: isGlobalEnforced,
      isCompliant: hasCredentials,
      requiresEnrollment: isGlobalEnforced && !hasCredentials,
      credentialsCount: credentials.length,
      credentials,
      recoveryCodesRemaining: (user.recoveryCodes || []).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/register-options
 * Generates WebAuthn registration options for enrolling a hardware key / passkey
 */
router.post("/register-options", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const options = await fido2Service.createRegistrationOptions(user, req);
    res.json(options);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/register-verify
 * Verifies WebAuthn registration response and registers credential
 */
router.post("/register-verify", async (req, res) => {
  try {
    const { userId, response, friendlyName } = req.body;
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!response) {
      return res.status(400).json({ error: "Missing registration response payload" });
    }

    const result = await fido2Service.verifyRegistration(
      user,
      response,
      friendlyName || "FIDO2 Security Key",
      req
    );

    res.json({
      success: true,
      verified: true,
      credential: result.credential,
      recoveryCodes: result.recoveryCodes,
      message: "FIDO2 key successfully registered and 2FA enabled.",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/auth-options
 * Generates WebAuthn authentication options for 2FA challenge
 */
router.post("/auth-options", async (req, res) => {
  try {
    const { userId, username } = req.body;
    const user = findUser(userId || username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.fido2Enabled || !user.fido2Credentials || user.fido2Credentials.length === 0) {
      return res.status(400).json({ error: "FIDO2 2FA is not enabled for this user" });
    }

    const options = await fido2Service.createAuthenticationOptions(user, req);
    res.json(options);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/auth-verify
 * Verifies WebAuthn authentication response
 */
router.post("/auth-verify", async (req, res) => {
  try {
    const { userId, username, response } = req.body;
    const user = findUser(userId || username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!response) {
      return res.status(400).json({ error: "Missing authentication response payload" });
    }

    // Check if it's a simulated token verification
    if (response.id?.startsWith("sim_fido2_")) {
      const match = (user.fido2Credentials || []).find((c) => c.id === response.id);
      if (!match) {
        return res.status(400).json({ error: "Invalid simulated FIDO2 key" });
      }
      match.counter += 1;
      match.lastUsedAt = new Date().toISOString();
      dbStore.persistToEncryptedDisk();
    } else {
      await fido2Service.verifyAuthentication(user, response, req);
    }

    const { passwordHash: _, recoveryCodes: __, ...safeUser } = user;
    const token = `fido2_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    res.json({
      success: true,
      verified: true,
      user: safeUser,
      token,
      message: "FIDO2 2FA verification successful",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/verify-recovery-code
 * Fallback: verifies single-use recovery code
 */
router.post("/verify-recovery-code", (req, res) => {
  try {
    const { userId, username, code } = req.body;
    const user = findUser(userId || username);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!code) {
      return res.status(400).json({ error: "Recovery code is required" });
    }

    const result = fido2Service.verifyRecoveryCode(user, code);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Invalid recovery code" });
    }

    const { passwordHash: _, recoveryCodes: __, ...safeUser } = user;
    const token = `rec_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    res.json({
      success: true,
      verified: true,
      user: safeUser,
      token,
      remainingCodes: result.remainingCodes,
      message: "Recovery code accepted. 1 single-use code consumed.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/simulate-enroll
 * Fast virtual enrollment for testing without hardware
 */
router.post("/simulate-enroll", (req, res) => {
  try {
    const { userId, friendlyName } = req.body;
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = fido2Service.simulateEnroll(
      user,
      friendlyName || "Passkey Virtual Token"
    );

    res.json({
      success: true,
      verified: true,
      credential: result.credential,
      recoveryCodes: result.recoveryCodes,
      message: "Virtual FIDO2 passkey enrolled successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/simulate-auth
 * Fast virtual authentication challenge for sandbox testing
 */
router.post("/simulate-auth", (req, res) => {
  try {
    const { userId, credentialId } = req.body;
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = fido2Service.simulateAuthenticate(user, credentialId);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Simulation failed" });
    }

    const { passwordHash: _, recoveryCodes: __, ...safeUser } = user;
    const token = `fido2_tok_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    res.json({
      success: true,
      verified: true,
      user: safeUser,
      token,
      message: "FIDO2 virtual cryptographic signature verified.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/recovery-codes/regenerate
 * Generates a new fresh set of 8 emergency recovery codes
 */
router.post("/recovery-codes/regenerate", (req, res) => {
  try {
    const { userId } = req.body;
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newCodes = fido2Service.generateNewRecoveryCodes(user);
    res.json({
      success: true,
      recoveryCodes: newCodes,
      message: "8 new recovery codes generated. Previous codes have been invalidated.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/v1/auth/fido2/credentials/:credentialId
 * Removes an enrolled key or 'all' keys
 */
router.delete("/credentials/:credentialId", (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"] || req.body?.userId || "usr_yan";
    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { credentialId } = req.params;
    if (credentialId === "all") {
      fido2Service.removeAllCredentials(user);
      return res.json({
        success: true,
        fido2Enabled: false,
        remainingCount: 0,
        credentials: [],
        message: "All FIDO2 keys removed successfully.",
      });
    }

    const ok = fido2Service.removeCredential(user, credentialId);
    if (!ok) {
      // If it wasn't found by raw id, try decoded
      return res.status(404).json({ error: "Credential not found or already deleted" });
    }

    res.json({
      success: true,
      fido2Enabled: Boolean(user.fido2Enabled),
      remainingCount: (user.fido2Credentials || []).length,
      credentials: user.fido2Credentials || [],
      message: "FIDO2 security key removed successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/delete-credential
 * POST fallback alternative for deleting a key
 */
router.post("/delete-credential", (req, res) => {
  try {
    const { userId, credentialId } = req.body || {};
    const effectiveUserId = userId || req.headers["x-user-id"] || "usr_yan";
    const user = findUser(effectiveUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!credentialId || credentialId === "all") {
      fido2Service.removeAllCredentials(user);
      return res.json({
        success: true,
        fido2Enabled: false,
        remainingCount: 0,
        credentials: [],
        message: "All FIDO2 keys removed successfully.",
      });
    }

    const ok = fido2Service.removeCredential(user, credentialId);
    if (!ok) {
      return res.status(404).json({ error: "Credential not found or already deleted" });
    }

    res.json({
      success: true,
      fido2Enabled: Boolean(user.fido2Enabled),
      remainingCount: (user.fido2Credentials || []).length,
      credentials: user.fido2Credentials || [],
      message: "FIDO2 security key removed successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/auth/fido2/toggle-enforcement
 * Toggles or reinforces FIDO2 requirement for all users or a specific user
 */
router.post("/toggle-enforcement", (req, res) => {
  try {
    const { userId, enforced, allUsers } = req.body || {};
    const willEnforce = enforced !== undefined ? Boolean(enforced) : true;

    if (allUsers || !userId) {
      dbStore.fido2Policy = {
        allUsersRequired: willEnforce,
        enforced: willEnforce,
        updatedAt: new Date().toISOString(),
      };
      dbStore.users.forEach((u) => {
        u.fido2Enforced = willEnforce;
      });
      dbStore.persistToEncryptedDisk();
      return res.json({
        success: true,
        allUsersRequired: willEnforce,
        fido2Enforced: willEnforce,
        message: willEnforce
          ? "FIDO2 est désormais strictement obligatoire pour TOUS les utilisateurs."
          : "Politique FIDO2 assouplie.",
      });
    }

    const user = findUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.fido2Enforced = willEnforce;
    dbStore.persistToEncryptedDisk();

    res.json({
      success: true,
      fido2Enforced: user.fido2Enforced,
      allUsersRequired: dbStore.fido2Policy?.allUsersRequired ?? true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
