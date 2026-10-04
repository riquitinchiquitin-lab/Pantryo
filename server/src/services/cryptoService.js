import crypto from "crypto";

// Modern Memory-Hard KDF Parameters (NIST SP 800-63B & OWASP recommendations)
const SCRYPT_N = 32768; // CPU/memory cost parameter (2^15)
const SCRYPT_R = 8;     // Block size
const SCRYPT_P = 1;     // Parallelization parameter
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 64 * 1024 * 1024; // 64 MB memory limit

const PBKDF2_HIGH_ITERATIONS = 600000; // NIST SP 800-63B standard for PBKDF2-HMAC-SHA256
const PBKDF2_LEGACY_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32; // 256 bits for AES-256
const PBKDF2_DIGEST = "sha256";
const ALGORITHM = "aes-256-gcm";

/**
 * Derives a 256-bit key from a passphrase and salt using PBKDF2 with Unicode NFKC normalization
 */
export function deriveKey(passphrase, salt) {
  const normalized = typeof passphrase === "string" ? passphrase.normalize("NFKC") : passphrase;
  return crypto.pbkdf2Sync(normalized, salt, PBKDF2_LEGACY_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
}

/**
 * Computes SHA-256 checksum of a string or buffer
 */
export function computeChecksum(data) {
  const content = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Hashes a password using modern memory-hard scrypt KDF (or Argon2 equivalent)
 * with a fresh 128-bit cryptographic salt and Unicode NFKC normalization.
 * Meets NIST SP 800-63B memory-hard KDF requirements to defeat GPU/ASIC cracking rigs.
 */
export function hashPassword(password) {
  const normalized = (password || "").normalize("NFKC");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(normalized, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAXMEM,
    })
    .toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/**
 * Alternative high-iteration PBKDF2 hasher (>= 600,000 iterations as recommended in NIST SP 800-63B)
 */
export function hashPasswordPbkdf2(password, iterations = PBKDF2_HIGH_ITERATIONS) {
  const normalized = (password || "").normalize("NFKC");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(normalized, salt, iterations, 64, PBKDF2_DIGEST)
    .toString("hex");
  return `pbkdf2:${salt}:${iterations}:${hash}`;
}

/**
 * Verifies a password against a stored hash with Unicode NFKC normalization.
 * Supports:
 * - Modern memory-hard scrypt (`scrypt:salt:hash`)
 * - High-iteration PBKDF2 (`pbkdf2:salt:iterations:hash`)
 * - Legacy PBKDF2 (`salt:hash`)
 * Utilizes constant-time timingSafeEqual comparison to prevent side-channel timing attacks.
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !password) return false;
  const normalized = password.normalize("NFKC");

  try {
    if (storedHash.startsWith("scrypt:")) {
      const parts = storedHash.split(":");
      if (parts.length !== 3) return false;
      const [, salt, originalHash] = parts;
      const computedHash = crypto
        .scryptSync(normalized, salt, SCRYPT_KEYLEN, {
          N: SCRYPT_N,
          r: SCRYPT_R,
          p: SCRYPT_P,
          maxmem: SCRYPT_MAXMEM,
        })
        .toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, "hex"),
        Buffer.from(originalHash, "hex")
      );
    }

    if (storedHash.startsWith("pbkdf2:")) {
      const parts = storedHash.split(":");
      if (parts.length !== 4) return false;
      const [, salt, iterStr, originalHash] = parts;
      const iters = parseInt(iterStr, 10) || PBKDF2_HIGH_ITERATIONS;
      const computedHash = crypto
        .pbkdf2Sync(normalized, salt, iters, 64, PBKDF2_DIGEST)
        .toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, "hex"),
        Buffer.from(originalHash, "hex")
      );
    }

    // Legacy format: salt:hash (100,000 iterations)
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto
      .pbkdf2Sync(normalized, salt, PBKDF2_LEGACY_ITERATIONS, 64, PBKDF2_DIGEST)
      .toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Encrypts an object or string using AES-256-GCM with a passphrase or binary key
 */
export function encryptData(data, passphraseOrKey) {
  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12); // 96-bit standard for GCM
  let key;
  let saltHex = null;

  if (typeof passphraseOrKey === "string") {
    const salt = crypto.randomBytes(16);
    saltHex = salt.toString("hex");
    key = deriveKey(passphraseOrKey, salt);
  } else if (Buffer.isBuffer(passphraseOrKey)) {
    key = passphraseOrKey;
  } else {
    throw new Error("Invalid encryption key or passphrase");
  }

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    algorithm: ALGORITHM,
    encrypted: true,
    salt: saltHex,
    iv: iv.toString("hex"),
    authTag,
    ciphertext: encrypted,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload
 */
export function decryptData(encryptedPayload, passphraseOrKey) {
  const { iv, authTag, ciphertext, salt } = encryptedPayload;
  if (!iv || !authTag || !ciphertext) {
    throw new Error("Invalid encrypted payload structure");
  }

  let key;
  if (typeof passphraseOrKey === "string") {
    if (!salt) {
      throw new Error("Missing salt for passphrase-based decryption");
    }
    key = deriveKey(passphraseOrKey, Buffer.from(salt, "hex"));
  } else if (Buffer.isBuffer(passphraseOrKey)) {
    key = passphraseOrKey;
  } else {
    throw new Error("Invalid decryption key or passphrase");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}
