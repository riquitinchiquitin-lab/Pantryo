import crypto from "crypto";

/**
 * Standard RFC 6238 TOTP (Time-Based One-Time Password) implementation.
 * Uses native Node.js crypto module. Zero external dependencies.
 * Default: 6 digits, 30-second step, HMAC-SHA1.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generates a random Base32 secret (160 bits = 20 bytes = 32 base32 chars)
 */
export function generateTotpSecret(length = 20) {
  const randomBytes = crypto.randomBytes(length);
  let base32 = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < randomBytes.length; i++) {
    value = (value << 8) | randomBytes[i];
    bits += 8;

    while (bits >= 5) {
      base32 += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    base32 += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return base32;
}

/**
 * Decodes a Base32 string to Buffer
 */
function base32ToBuffer(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a 6-digit TOTP code for a secret at a given counter or timestamp
 */
export function generateTotpCode(secret, timeStepOffset = 0, timestampMs = Date.now()) {
  const key = base32ToBuffer(secret);
  const timeStep = 30; // 30 seconds
  const counter = Math.floor(timestampMs / 1000 / timeStep) + timeStepOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret with a +/- 1 window (drift allowance = 90s)
 */
export function verifyTotpCode(secret, token, window = 1) {
  if (!secret || !token) return false;
  const normalizedToken = String(token).trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedToken)) return false;

  for (let offset = -window; offset <= window; offset++) {
    const expected = generateTotpCode(secret, offset);
    if (crypto.timingSafeEqual(Buffer.from(normalizedToken), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

/**
 * Generates otpauth:// URI for scanning into Google Authenticator, 1Password, Bitwarden, etc.
 */
export function generateOtpAuthUri(accountName, issuer, secret) {
  const cleanIssuer = encodeURIComponent(issuer || "Pantryo");
  const cleanAccount = encodeURIComponent(accountName || "User");
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}
