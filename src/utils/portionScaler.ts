/**
 * Utility for parsing and scaling recipe ingredient quantities by portions / number of people eating
 */

/**
 * Extracts the primary integer servings count from strings like "4 servings", "Pour 6 personnes", "Serves 4-6"
 */
export function parseServingsCount(servingsStr?: string | number | null): number {
  if (typeof servingsStr === 'number') {
    return Math.max(1, Math.round(servingsStr));
  }
  if (!servingsStr) return 4;
  const match = String(servingsStr).match(/(\d+)(?:\s*[-–—àa]\s*(\d+))?/);
  if (!match) return 4;
  if (match[2]) {
    // If range like 4-6, default to the lower bound for conservative ingredient scaling
    const lower = parseInt(match[1], 10);
    const upper = parseInt(match[2], 10);
    return Math.round((lower + upper) / 2) || lower || 4;
  }
  return parseInt(match[1], 10) || 4;
}

/**
 * Converts a decimal value to a clean culinary fraction string (e.g. 0.25 -> "1/4", 1.5 -> "1 1/2")
 */
export function formatCulinaryFraction(val: number): string {
  if (val <= 0) return '0';
  const integerPart = Math.floor(val);
  const remainder = val - integerPart;

  const EPSILON = 0.04;
  let fractionPart = '';

  if (Math.abs(remainder - 0.125) < EPSILON) fractionPart = '1/8';
  else if (Math.abs(remainder - 0.25) < EPSILON) fractionPart = '1/4';
  else if (Math.abs(remainder - 0.333) < EPSILON) fractionPart = '1/3';
  else if (Math.abs(remainder - 0.375) < EPSILON) fractionPart = '3/8';
  else if (Math.abs(remainder - 0.5) < EPSILON) fractionPart = '1/2';
  else if (Math.abs(remainder - 0.625) < EPSILON) fractionPart = '5/8';
  else if (Math.abs(remainder - 0.666) < EPSILON) fractionPart = '2/3';
  else if (Math.abs(remainder - 0.75) < EPSILON) fractionPart = '3/4';
  else if (Math.abs(remainder - 0.875) < EPSILON) fractionPart = '7/8';
  else if (remainder >= 0.96) return String(integerPart + 1);

  if (fractionPart) {
    return integerPart > 0 ? `${integerPart} ${fractionPart}` : fractionPart;
  }

  // Fallback to 1 decimal place if irregular fraction (e.g. 1.2, 3.4)
  if (remainder > 0.05) {
    const formatted = val.toFixed(1);
    return formatted.endsWith('.0') ? String(integerPart) : formatted;
  }
  return String(integerPart);
}

/**
 * Parses a fractional or decimal number from a string (e.g. "1 1/2" -> 1.5, "3/4" -> 0.75, "2.5" -> 2.5)
 */
function parseFractionOrNumber(str: string): number | null {
  const clean = str.trim();
  if (/^\d+\s+\d+\/\d+$/.test(clean)) {
    const parts = clean.split(/\s+/);
    const whole = parseInt(parts[0], 10);
    const frac = parts[1].split('/');
    return whole + parseInt(frac[0], 10) / parseInt(frac[1], 10);
  }
  if (/^\d+\/\d+$/.test(clean)) {
    const frac = clean.split('/');
    return parseInt(frac[0], 10) / parseInt(frac[1], 10);
  }
  const floatVal = parseFloat(clean);
  return isNaN(floatVal) ? null : floatVal;
}

/**
 * Scales an individual ingredient amount string by a factor (targetServings / baseServings)
 * Example: "1/2 cup" with factor 2 -> "1 cup"
 * Example: "3/4 cup (3oz) shredded Cheddar cheese - 3 slices" with factor 2 -> "1 1/2 cups (6oz) shredded Cheddar cheese - 6 slices"
 */
export function scaleIngredientAmount(amountStr: string, factor: number): string {
  if (!amountStr || factor <= 0 || Math.abs(factor - 1) < 0.01) {
    return amountStr || '';
  }

  // Handle qualitative phrases that shouldn't be mathematically scaled
  if (/^(?:to taste|au go[uû]t|pinch|pinc[ée]e|optional|facultatif|as needed|au besoin)$/i.test(amountStr.trim())) {
    return amountStr;
  }

  // Replace numbers, fractions, and parenthesis-enclosed quantities
  // e.g., "1 1/2 cups", "3/4 cup (3oz)", "200 g"
  const scaled = amountStr.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/g, (match) => {
    const num = parseFractionOrNumber(match);
    if (num === null) return match;
    const scaledNum = num * factor;

    // If original was integer >= 10 (like 200g, 450ml), keep as clean rounded integer
    if (num >= 10 && Number.isInteger(num)) {
      return String(Math.round(scaledNum));
    }
    // If scaled result is practically an integer (e.g. 1.999 or 2.001)
    if (Math.abs(scaledNum - Math.round(scaledNum)) < 0.04) {
      return String(Math.round(scaledNum));
    }
    return formatCulinaryFraction(scaledNum);
  });

  return scaled;
}
