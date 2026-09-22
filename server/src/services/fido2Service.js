import crypto from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import { dbStore } from "./dbStore.js";

// Active challenges cache with 5-minute TTL
const activeChallenges = new Map();

function cleanExpiredChallenges() {
  const now = Date.now();
  for (const [key, val] of activeChallenges.entries()) {
    if (val.expiresAt < now) {
      activeChallenges.delete(key);
    }
  }
}
setInterval(cleanExpiredChallenges, 60000);

/**
 * Derives the rpID and expected origin from the incoming Express request
 */
export function getRpIdAndOrigin(req) {
  const rawOrigin =
    req.get("origin") ||
    req.get("referer") ||
    `${req.protocol}://${req.get("host")}` ||
    "http://localhost:3000";

  let origin = rawOrigin;
  let rpID = "localhost";

  try {
    const parsed = new URL(rawOrigin);
    origin = parsed.origin;
    rpID = parsed.hostname;
  } catch (e) {
    rpID = req.hostname || "localhost";
  }

  // Normalize localhost IP variants for WebAuthn standard
  if (rpID === "127.0.0.1" || rpID === "0.0.0.0") {
    rpID = "localhost";
  }

  // Allow list of expected origins for preview/iframe & direct access
  const expectedOrigins = [
    origin,
    "https://pantryo.yknet.org",
    "http://pantryo.yknet.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  if (req.get("host")) {
    expectedOrigins.push(`${req.protocol}://${req.get("host")}`);
  }

  // Expected RPIDs list
  const expectedRPIDs = [rpID, "pantryo.yknet.org", "yknet.org", "localhost"];

  return { rpID, origin, expectedOrigins, expectedRPIDs };
}

/**
 * Generate 8-character formatted recovery code (e.g. A4K9-7M2P)
 */
function generateCode() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed easily confused 0,O,1,I
  let code = "";
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}

function hashCode(plainCode) {
  const normalized = plainCode.replace(/-/g, "").trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export const fido2Service = {
  /**
   * Generates FIDO2 registration options for enrolling a hardware key or passkey
   */
  async createRegistrationOptions(user, req) {
    const { rpID } = getRpIdAndOrigin(req);

    // Filter existing user credentials to prevent re-registering the same authenticator
    const excludeCredentials = (user.fido2Credentials || []).map((cred) => ({
      id: cred.id,
      transports: cred.transports,
    }));

    const options = await generateRegistrationOptions({
      rpName: "Pantryo",
      rpID,
      userID: isoUint8Array.fromUTF8String(user.id),
      userName: user.email || `${user.name.toLowerCase()}@pantryo.local`,
      userDisplayName: user.name,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Save challenge
    activeChallenges.set(`reg_${user.id}`, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return options;
  },

  /**
   * Verifies the WebAuthn registration response and stores the new credential
   */
  async verifyRegistration(user, clientResponse, friendlyName, req) {
    const stored = activeChallenges.get(`reg_${user.id}`);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new Error("Registration challenge expired. Please retry.");
    }
    activeChallenges.delete(`reg_${user.id}`);

    const { expectedOrigins, expectedRPIDs } = getRpIdAndOrigin(req);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: clientResponse,
        expectedChallenge: stored.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: expectedRPIDs,
        requireUserVerification: false,
      });
    } catch (err) {
      throw new Error(`WebAuthn verification failed: ${err.message}`);
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("WebAuthn signature could not be verified.");
    }

    const regInfo = verification.registrationInfo;
    const credObj = regInfo.credential || {};

    const rawCredID =
      credObj.id ||
      regInfo.credentialID ||
      clientResponse.id;

    const credIdString = typeof rawCredID === "string" 
      ? rawCredID 
      : isoBase64URL.fromBuffer(rawCredID);

    const rawPubKey = credObj.publicKey || regInfo.credentialPublicKey;
    const pubKeyString = typeof rawPubKey === "string" 
      ? rawPubKey 
      : isoBase64URL.fromBuffer(rawPubKey);

    const credCounter =
      credObj.counter !== undefined
        ? credObj.counter
        : regInfo.counter !== undefined
        ? regInfo.counter
        : 0;

    const newCredential = {
      id: credIdString,
      publicKey: pubKeyString,
      counter: credCounter,
      deviceType: regInfo.credentialDeviceType || "security-key",
      backedUp: Boolean(regInfo.credentialBackedUp),
      transports: clientResponse.response?.transports || credObj.transports || ["internal", "usb", "nfc"],
      friendlyName: friendlyName?.trim() || "FIDO2 Security Key",
      createdAt: new Date().toISOString(),
    };

    if (!user.fido2Credentials) {
      user.fido2Credentials = [];
    }
    user.fido2Credentials.push(newCredential);
    user.fido2Enabled = true;

    // Generate emergency recovery codes if not present
    let plainRecoveryCodes = null;
    if (!user.recoveryCodes || user.recoveryCodes.length === 0) {
      const generated = [];
      const hashed = [];
      for (let i = 0; i < 8; i++) {
        const c = generateCode();
        generated.push(c);
        hashed.push(hashCode(c));
      }
      user.recoveryCodes = hashed;
      plainRecoveryCodes = generated;
    }

    dbStore.persistToEncryptedDisk();

    return {
      verified: true,
      credential: {
        id: newCredential.id,
        friendlyName: newCredential.friendlyName,
        deviceType: newCredential.deviceType,
        counter: newCredential.counter,
        createdAt: newCredential.createdAt,
      },
      recoveryCodes: plainRecoveryCodes,
    };
  },

  /**
   * Generates FIDO2 authentication options for 2FA challenge
   */
  async createAuthenticationOptions(user, req) {
    if (!user.fido2Credentials || user.fido2Credentials.length === 0) {
      throw new Error("No FIDO2 security keys registered for this account.");
    }

    const { rpID } = getRpIdAndOrigin(req);

    const allowCredentials = user.fido2Credentials.map((cred) => ({
      id: cred.id,
      transports: cred.transports,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    activeChallenges.set(`auth_${user.id}`, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return options;
  },

  /**
   * Verifies the WebAuthn authentication response against enrolled credentials
   */
  async verifyAuthentication(user, clientResponse, req) {
    const stored = activeChallenges.get(`auth_${user.id}`);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new Error("Authentication challenge expired. Please retry.");
    }
    activeChallenges.delete(`auth_${user.id}`);

    const credential = (user.fido2Credentials || []).find(
      (c) => c.id === clientResponse.id
    );
    if (!credential) {
      throw new Error("Unknown or unregistered FIDO2 security key presented.");
    }

    const { expectedOrigins, expectedRPIDs } = getRpIdAndOrigin(req);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: clientResponse,
        expectedChallenge: stored.challenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: expectedRPIDs,
        credential: {
          id: credential.id,
          publicKey: isoBase64URL.toBuffer(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports,
        },
        requireUserVerification: false,
      });
    } catch (err) {
      throw new Error(`FIDO2 verification failed: ${err.message}`);
    }

    if (!verification.verified) {
      throw new Error("FIDO2 cryptographic verification failed.");
    }

    // Update credential counter to detect clone attacks
    credential.counter = verification.authenticationInfo.newCounter;
    credential.lastUsedAt = new Date().toISOString();
    dbStore.persistToEncryptedDisk();

    return { verified: true };
  },

  /**
   * Verifies a single-use emergency recovery code
   */
  verifyRecoveryCode(user, rawCode) {
    if (!user.recoveryCodes || user.recoveryCodes.length === 0) {
      throw new Error("No recovery codes available for this account.");
    }

    const hashed = hashCode(rawCode);
    const index = user.recoveryCodes.indexOf(hashed);
    if (index === -1) {
      return { success: false, error: "Invalid recovery code." };
    }

    // Consume the single-use recovery code
    user.recoveryCodes.splice(index, 1);
    dbStore.persistToEncryptedDisk();

    return {
      success: true,
      remainingCodes: user.recoveryCodes.length,
    };
  },

  /**
   * Generates a fresh set of 8 recovery codes
   */
  generateNewRecoveryCodes(user) {
    const generated = [];
    const hashed = [];
    for (let i = 0; i < 8; i++) {
      const c = generateCode();
      generated.push(c);
      hashed.push(hashCode(c));
    }
    user.recoveryCodes = hashed;
    dbStore.persistToEncryptedDisk();
    return generated;
  },

  /**
   * Removes an enrolled FIDO2 credential
   */
  removeCredential(user, credentialId) {
    if (!user.fido2Credentials || user.fido2Credentials.length === 0) return false;
    const target = String(credentialId || "").trim();
    const decodedTarget = decodeURIComponent(target);

    const initialLen = user.fido2Credentials.length;
    user.fido2Credentials = user.fido2Credentials.filter((c) => {
      // If credential has no ID, remove it
      if (!c.id) return false;
      // Filter out if matches raw target or decoded target or friendlyName
      if (c.id === target || c.id === decodedTarget) return false;
      if (c.friendlyName && (c.friendlyName === target || c.friendlyName === decodedTarget)) return false;
      return true;
    });

    // If nothing was removed and target is empty or 'undefined' or 'first'
    if (user.fido2Credentials.length === initialLen) {
      if (!target || target === "undefined" || target === "null") {
        user.fido2Credentials.shift();
      } else {
        return false;
      }
    }

    if (user.fido2Credentials.length === 0) {
      user.fido2Enabled = false;
      user.fido2Enforced = false;
    }
    dbStore.persistToEncryptedDisk();
    return true;
  },

  /**
   * Removes all enrolled FIDO2 credentials and resets 2FA
   */
  removeAllCredentials(user) {
    user.fido2Credentials = [];
    user.fido2Enabled = false;
    user.fido2Enforced = false;
    dbStore.persistToEncryptedDisk();
    return true;
  },

  /**
   * Enrolls a virtual / simulated security key
   * Allows instant testability in restricted iframe preview environments
   */
  simulateEnroll(user, friendlyName = "Virtual FIDO2 Security Token") {
    const simId = `sim_fido2_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const newCredential = {
      id: simId,
      publicKey: isoBase64URL.fromBuffer(crypto.randomBytes(32)),
      counter: 1,
      deviceType: "virtual-hardware-key",
      backedUp: true,
      transports: ["internal"],
      friendlyName: friendlyName.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!user.fido2Credentials) user.fido2Credentials = [];
    user.fido2Credentials.push(newCredential);
    user.fido2Enabled = true;

    let plainRecoveryCodes = null;
    if (!user.recoveryCodes || user.recoveryCodes.length === 0) {
      const generated = [];
      const hashed = [];
      for (let i = 0; i < 8; i++) {
        const c = generateCode();
        generated.push(c);
        hashed.push(hashCode(c));
      }
      user.recoveryCodes = hashed;
      plainRecoveryCodes = generated;
    }

    dbStore.persistToEncryptedDisk();

    return {
      verified: true,
      credential: {
        id: newCredential.id,
        friendlyName: newCredential.friendlyName,
        deviceType: newCredential.deviceType,
        counter: newCredential.counter,
        createdAt: newCredential.createdAt,
      },
      recoveryCodes: plainRecoveryCodes,
    };
  },

  /**
   * Simulates an authentication challenge verification
   */
  simulateAuthenticate(user, credentialId) {
    if (!user.fido2Credentials || user.fido2Credentials.length === 0) {
      return { success: false, error: "No FIDO2 keys enrolled" };
    }
    const cred = credentialId
      ? user.fido2Credentials.find((c) => c.id === credentialId)
      : user.fido2Credentials[0];

    if (!cred) {
      return { success: false, error: "FIDO2 key not found" };
    }

    cred.counter = (cred.counter || 0) + 1;
    cred.lastUsedAt = new Date().toISOString();
    dbStore.persistToEncryptedDisk();

    return {
      success: true,
      verified: true,
      credential: {
        id: cred.id,
        friendlyName: cred.friendlyName,
        counter: cred.counter,
      },
    };
  },
};
