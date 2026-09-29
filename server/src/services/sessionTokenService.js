import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbStore } from "./dbStore.js";

// Session secret key derived from persistent environment or cryptographically generated file
function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  if (process.env.DB_ENCRYPTION_KEY && process.env.DB_ENCRYPTION_KEY.trim().length >= 16) {
    return crypto.createHmac("sha256", process.env.DB_ENCRYPTION_KEY.trim()).update("pantryo-session-salt-v1").digest("hex");
  }

  const secretFile = path.join(process.cwd(), "server", "data", "session_secret.meta");
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, "utf8").trim();
      if (existing.length >= 32) return existing;
    }
    const generated = crypto.randomBytes(32).toString("hex");
    const dataDir = path.dirname(secretFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(secretFile, generated, { encoding: "utf8", mode: 0o600 });
    return generated;
  } catch {
    // Ephemeral random secret if filesystem is completely read-only
    return crypto.randomBytes(32).toString("hex");
  }
}

const SESSION_SECRET = getSessionSecret();

/**
 * Issues a cryptographically signed HMAC-SHA256 session token
 * Token format: pst.<base64Payload>.<hmacSignatureHex>
 */
export function issueSessionToken(user, expiresInDays = 7) {
  if (!user || !user.id) {
    throw new Error("Cannot issue session token for invalid user");
  }

  const payload = {
    userId: user.id,
    role: user.role || "MEMBER",
    issuedAt: Date.now(),
    expiresAt: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("hex");

  return `pst.${payloadBase64}.${signature}`;
}

/**
 * Validates a session token string
 * Returns { userId, role, expiresAt } or null if invalid/expired
 */
export function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== "string" || !tokenString.startsWith("pst.")) {
    return null;
  }

  const parts = tokenString.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [, payloadBase64, signature] = parts;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    if (!payload.userId || !payload.expiresAt) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session token from an Express request
 */
export function getAuthenticatedUserFromRequest(req) {
  const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
  let token = null;

  if (authHeader) {
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (typeof authHeader === "string") {
      token = authHeader.trim();
    }
  }

  if (!token && req.query && typeof req.query.token === "string") {
    token = req.query.token.trim();
  }

  if (!token) {
    return null;
  }

  const verifiedPayload = verifySessionToken(token);
  if (!verifiedPayload) {
    return null;
  }

  // Cross-reference user against database to ensure account wasn't deleted or role changed
  const dbUser = dbStore.users.find((u) => u.id === verifiedPayload.userId);
  if (!dbUser) {
    return null;
  }

  return {
    ...dbUser,
    activeRole: dbUser.role,
  };
}

/**
 * Express middleware: requires any valid authenticated household member session
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
