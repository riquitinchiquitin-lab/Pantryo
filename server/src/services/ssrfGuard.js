import dns from "dns/promises";
import net from "net";

/**
 * Checks if an IPv4 address is in a private, loopback, or link-local range
 */
function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, block
  }

  // 0.0.0.0/8 (Current network)
  if (parts[0] === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (parts[0] === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.x.x - 172.31.x.x)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 100.64.0.0/10 (Shared Address Space / Carrier-grade NAT)
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  // 224.0.0.0/4 (Multicast) and 240.0.0.0/4 (Reserved)
  if (parts[0] >= 224) return true;

  // Broadcast
  if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, or link-local range
 */
function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  // ::1 loopback
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  // :: unspecified
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // fc00::/7 (Unique local address)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // fe80::/10 (Link-local address)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:192.168.x.x)
  if (normalized.includes("::ffff:")) {
    const ipv4Part = normalized.split("::ffff:")[1];
    if (ipv4Part && net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  return false;
}

/**
 * Validates that a user-supplied URL is safe to fetch and does not target internal services.
 * Throws an Error with a descriptive explanation if unsafe.
 */
export async function validateSafeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Invalid URL provided.");
  }

  const trimmed = rawUrl.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL format.");
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Forbidden protocol: "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  // 2. Reject internal and non-routable hostnames
  const hostname = parsed.hostname.toLowerCase();
  const forbiddenHostnames = [
    "localhost",
    "metadata.google.internal",
    "metadata",
    "instance-data",
    "169.254.169.254",
  ];

  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".onion")
  ) {
    throw new Error("Access to local and internal hostnames is prohibited.");
  }

  // 3. If hostname is directly an IP literal, validate IP
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new Error("Access to private/local IPv4 addresses is prohibited.");
    }
    return trimmed;
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      throw new Error("Access to private/local IPv6 addresses is prohibited.");
    }
    return trimmed;
  }

  // 4. Resolve DNS to ensure destination IP does not point to internal/metadata addresses (Anti-DNS Rebinding)
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    for (const record of lookupResult) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        throw new Error(`Access to private IP (${record.address}) is prohibited.`);
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        throw new Error(`Access to private IPv6 (${record.address}) is prohibited.`);
      }
    }
  } catch (err) {
    if (err.message.includes("prohibited")) {
      throw err;
    }
    throw new Error(`Could not resolve hostname "${hostname}": ${err.message}`);
  }

  return trimmed;
}

/**
 * Safe fetch wrapper that enforces SSRF checks across all HTTP redirects
 */
export async function safeFetch(initialUrl, options = {}, maxRedirects = 3) {
  let currentUrl = initialUrl;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    const validatedUrl = await validateSafeExternalUrl(currentUrl);
    const fetchOptions = {
      ...options,
      redirect: "manual",
    };

    const res = await fetch(validatedUrl, fetchOptions);

    // If not a redirect, return the response
    if (![301, 302, 303, 307, 308].includes(res.status)) {
      return res;
    }

    // Handle redirect
    const location = res.headers.get("location");
    if (!location) {
      return res; // Malformed redirect without location
    }

    // Resolve relative or absolute redirect URL
    const nextUrl = new URL(location, currentUrl).toString();
    currentUrl = nextUrl;
    redirectsRemaining--;
  }

  throw new Error("Too many redirects during safe external fetch.");
}
