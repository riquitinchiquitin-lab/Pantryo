import crypto from "crypto";

/**
 * NIST SP 800-63B & Modern Password Validation Engine
 *
 * Implements:
 * 1. Length over complexity:
 *    - Absolute floor: >= 8 characters.
 *    - Strongly recommended: >= 15 characters (especially for single factor).
 *    - Permitted maximum: >= 64 characters (up to 256 characters supported).
 *    - No arbitrary composition rules (no forced digits/symbols/uppercase rules).
 *    - Permit all characters, including spaces (for multi-word passphrases) and Unicode.
 * 2. Ban obsolete lifecycle policies:
 *    - No periodic expiration (resets only upon breach/compromise).
 *    - No knowledge-based questions or hints.
 *    - Pasting and password managers fully permitted and encouraged.
 * 3. Proactive screening:
 *    - Check against breached passwords using HIBP k-anonymity API + local offline blocklist.
 *    - Screen out context-specific terms (username, email, application name).
 *    - Screen out repetitive and sequential characters (e.g. 123456, qwerty).
 * 4. Unicode normalization (NFKC) before validation and hashing.
 */

export const NIST_CONFIG = {
  MIN_LENGTH: 8,
  RECOMMENDED_MIN_LENGTH: 15,
  MAX_LENGTH: 256,
  APP_TERMS: ["pantryo", "komrade", "kitchenkomrade", "kitchen"],
};

// Common top breached / dictionary passwords for offline screening
const OFFLINE_BREACHED_BLOCKLIST = new Set([
  "password",
  "password123",
  "password1",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwertyuiop",
  "azerty",
  "asdfghjkl",
  "admin",
  "admin123",
  "admin1234",
  "administrator",
  "welcome",
  "welcome123",
  "letmein",
  "letmein123",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "football",
  "charlie",
  "shadow",
  "superman",
  "trustno1",
  "iloveyou",
  "passcode",
  "root123",
  "default",
  "changeme",
  "pantryo123",
]);

// Sequential patterns to detect
const SEQUENCES = [
  "0123456789",
  "9876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiopasdfghjklzxcvbnm",
  "azertyuiopqsdfghjklmwxcvbn",
];

/**
 * Normalizes input using Unicode NFKC as specified in NIST SP 800-63B Section 5.1.1.2
 */
export function normalizeUnicode(input) {
  if (!input || typeof input !== "string") return "";
  return input.normalize("NFKC");
}

/**
 * Checks Have I Been Pwned (HIBP) k-anonymity API
 * Sends only the first 5 characters of SHA-1 hash to preserve full client privacy
 */
export async function checkPwnedPassword(normalizedPassword) {
  try {
    const sha1 = crypto
      .createHash("sha1")
      .update(normalizedPassword)
      .digest("hex")
      .toUpperCase();

    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    // Use built-in fetch with a 2.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "Pantryo-NIST-SP80063B-Validator",
        "Add-Padding": "true", // Mitigates response length side-channel
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { checked: false, isPwned: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split("\r\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix && hashSuffix.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr.trim(), 10) || 1;
        return { checked: true, isPwned: true, count };
      }
    }

    return { checked: true, isPwned: false, count: 0 };
  } catch (err) {
    // Graceful offline fallback
    return { checked: false, isPwned: false, count: 0, error: err.message };
  }
}

/**
 * Estimates entropy bits of a passphrase or password
 */
export function estimateEntropy(normalizedPassword) {
  if (!normalizedPassword) return 0;
  const len = normalizedPassword.length;

  // Check if it's a multi-word passphrase (separated by spaces, hyphens, underscores)
  const words = normalizedPassword.trim().split(/[\s\-_]+/);
  if (words.length >= 3 && words.every((w) => w.length >= 2)) {
    // Diceware style: ~12.9 bits per word from standard wordlist
    return Math.round(words.length * 12.9);
  }

  // Character pool entropy estimation
  let poolSize = 0;
  if (/[a-z]/.test(normalizedPassword)) poolSize += 26;
  if (/[A-Z]/.test(normalizedPassword)) poolSize += 26;
  if (/[0-9]/.test(normalizedPassword)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(normalizedPassword)) poolSize += 33;

  if (poolSize === 0) return 0;
  return Math.round(len * (Math.log(poolSize) / Math.log(2)));
}

/**
 * Comprehensive NIST SP 800-63B Password Validation
 */
export async function validatePasswordNist(password, context = {}) {
  const errors = [];
  const warnings = [];
  const feedback = [];

  // 1. Unicode NFKC Normalization
  const normalized = normalizeUnicode(password);

  // 2. Length Over Complexity Rules
  if (!normalized || normalized.length < NIST_CONFIG.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${NIST_CONFIG.MIN_LENGTH} characters long (NIST SP 800-63B requirement).`
    );
  }

  if (normalized.length > NIST_CONFIG.MAX_LENGTH) {
    errors.push(
      `Password exceeds maximum allowable length of ${NIST_CONFIG.MAX_LENGTH} characters.`
    );
  }

  if (normalized.length >= NIST_CONFIG.MIN_LENGTH && normalized.length < NIST_CONFIG.RECOMMENDED_MIN_LENGTH) {
    warnings.push(
      `NIST recommends 15+ characters or a multi-word passphrase when passwords act as a primary authentication factor.`
    );
  }

  // 3. Screen Out Context-Specific Terms (NIST SP 800-63B Section 5.1.1.2)
  const lower = normalized.toLowerCase();
  const contextTerms = [
    ...(NIST_CONFIG.APP_TERMS || []),
    context.name ? context.name.toLowerCase() : null,
    context.username ? context.username.toLowerCase() : null,
    context.email ? context.email.toLowerCase() : null,
    context.email && context.email.includes("@")
      ? context.email.split("@")[0].toLowerCase()
      : null,
  ].filter(Boolean);

  for (const term of contextTerms) {
    if (term.length >= 3 && lower.includes(term)) {
      errors.push(
        `Password must not contain context-specific terms such as your name, username, email, or application name ("${term}").`
      );
      break;
    }
  }

  // 4. Screen Out Repetitive & Sequential Patterns
  // Check repetitive characters (e.g. 'aaaa', '11111')
  if (/(.)\1{3,}/.test(normalized)) {
    errors.push(
      "Password contains repetitive character patterns (e.g. 4+ repeated characters)."
    );
  }

  // Check sequential characters (e.g. '12345', 'qwerty', 'abcdef')
  for (const seq of SEQUENCES) {
    for (let i = 0; i <= seq.length - 5; i++) {
      const slice = seq.substring(i, i + 5);
      if (lower.includes(slice)) {
        errors.push(
          `Password contains predictable sequential characters ("${slice}"). Choose non-sequential phrases.`
        );
        break;
      }
    }
    if (errors.length > 3) break;
  }

  // 5. Offline Breached List Check
  if (OFFLINE_BREACHED_BLOCKLIST.has(lower)) {
    errors.push(
      "This password is a known compromised password found on common breach blocklists. Choose a unique passphrase."
    );
  }

  // 6. Proactive Breached Password Screening via HIBP k-Anonymity API
  let isPwned = false;
  let pwnedCount = 0;
  if (errors.length === 0 && normalized.length >= NIST_CONFIG.MIN_LENGTH) {
    const pwnedResult = await checkPwnedPassword(normalized);
    if (pwnedResult.isPwned) {
      isPwned = true;
      pwnedCount = pwnedResult.count;
      errors.push(
        `Compromised credential alert: This password has appeared in ${pwnedResult.count.toLocaleString()} known data breaches according to Have I Been Pwned. Choose a unique passphrase.`
      );
    }
  }

  // 7. Entropy Calculation
  const entropyBits = estimateEntropy(normalized);

  // Positive NIST Feedback
  if (normalized.length >= 15) {
    feedback.push("Excellent length meeting NIST SP 800-63B high-entropy guidance (15+ characters).");
  }
  if (normalized.includes(" ") || normalized.includes("-")) {
    feedback.push("Multi-word passphrase structure detected, providing high entropy with memorability.");
  }
  if (entropyBits >= 64) {
    feedback.push(`High estimated cryptographic entropy (${entropyBits} bits).`);
  }

  return {
    isValid: errors.length === 0,
    nistCompliant: errors.length === 0 && normalized.length >= NIST_CONFIG.MIN_LENGTH,
    errors,
    warnings,
    feedback,
    entropyBits,
    length: normalized.length,
    isPwned,
    pwnedCount,
    normalized,
  };
}
