/**
 * Contact Validation & Formatting Utility
 * 
 * Provides robust validation, deduplication, and formatting for bulk
 * Email Addresses and Phone Numbers pasted into the Notification Centre:
 * - Line-by-line parsing from arbitrary text (supporting newlines, commas, semicolons)
 * - Automatic default +91 country code application ONLY when missing
 * - Strict non-duplication of existing country codes (prevents +91 +91... or +91 91...)
 * - International phone number preservation (+1, +44, etc.)
 * - Duplicate detection within lists
 * - Detailed syntax error explanations per line
 */

export interface ParsedContactItem {
  id: string;
  lineNumber: number;
  raw: string;
  formatted: string;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
  duplicateOfLine?: number;
}

export interface ContactValidationSummary {
  items: ParsedContactItem[];
  rawText: string;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  hasErrors: boolean;
  validItems: ParsedContactItem[];
}

/**
 * Validate and format an email address
 */
export function validateAndFormatEmail(rawInput: string): { formatted: string; isValid: boolean; error?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { formatted: '', isValid: false, error: 'Empty line' };
  }

  // Basic structure check
  if (!trimmed.includes('@')) {
    return { formatted: trimmed, isValid: false, error: "Missing '@' sign in email" };
  }

  const parts = trimmed.split('@');
  if (parts.length > 2) {
    return { formatted: trimmed, isValid: false, error: "Multiple '@' symbols are invalid" };
  }

  const [username, domain] = parts;
  if (!username) {
    return { formatted: trimmed, isValid: false, error: "Missing username before '@'" };
  }

  if (!domain || !domain.includes('.')) {
    return { formatted: trimmed, isValid: false, error: "Missing domain name or dot (e.g. .org, .edu, .in)" };
  }

  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return { formatted: trimmed, isValid: false, error: "Invalid top-level domain extension" };
  }

  // RFC-compliant standard email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { formatted: trimmed, isValid: false, error: "Contains invalid email characters or spacing" };
  }

  return { formatted: trimmed.toLowerCase(), isValid: true };
}

/**
 * Validate and format a phone number with strict default +91 rules:
 * - Apply +91 ONLY when phone number has NO country code
 * - Do NOT duplicate existing country codes (+91, 91, 0091)
 * - Preserve valid international country codes (+1, +44, etc.)
 */
export function validateAndFormatPhoneNumber(rawInput: string): { 
  formatted: string; 
  isValid: boolean; 
  error?: string;
  countryCode?: string;
  nationalNumber?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { formatted: '', isValid: false, error: 'Empty line' };
  }

  // Check for illegal alphabetic or special characters
  if (/[^\d\s\-+().]/.test(trimmed)) {
    return { formatted: trimmed, isValid: false, error: 'Contains non-numeric or invalid characters' };
  }

  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return { formatted: trimmed, isValid: false, error: 'No numeric digits found' };
  }

  // Helper to extract country code from formatted phone
  const extractCc = (formatted: string) => {
    const match = formatted.match(/^(\+\d{1,4})/);
    return match ? match[1] : undefined;
  };

  // Case 1: Explicit leading '+' provided by user
  if (hasLeadingPlus) {
    // If it starts with 91 (+91...)
    if (digitsOnly.startsWith('91')) {
      const national = digitsOnly.slice(2);
      if (national.length === 10) {
        if (!/^[6-9]/.test(national)) {
          return { formatted: `+91 ${national}`, isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9', countryCode: '+91', nationalNumber: national };
        }
        return { formatted: `+91 ${national}`, isValid: true, countryCode: '+91', nationalNumber: national };
      } else if (national.length < 10) {
        return { formatted: `+91 ${national}`, isValid: false, error: `Too short: expected 10 digits after +91, got ${national.length}`, countryCode: '+91', nationalNumber: national };
      } else {
        return { formatted: `+91 ${national}`, isValid: false, error: `Too long: expected 10 digits after +91, got ${national.length}`, countryCode: '+91', nationalNumber: national };
      }
    } else {
      // Non-91 international number with explicit + (e.g. +1 555-0199, +44 7911 123456)
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        const cc = digitsOnly.startsWith('1') ? '+1' : digitsOnly.startsWith('44') ? '+44' : `+${digitsOnly.slice(0, 2)}`;
        return { formatted: `+${digitsOnly}`, isValid: true, countryCode: cc };
      } else {
        return { formatted: `+${digitsOnly}`, isValid: false, error: 'Invalid international phone length (expected 7-15 digits)' };
      }
    }
  }

  // Case 2: International dialling prefix '00' (e.g. 0091 9876543210)
  if (trimmed.startsWith('00')) {
    const without00 = digitsOnly.replace(/^00/, '');
    if (without00.startsWith('91')) {
      const national = without00.slice(2);
      if (national.length === 10) {
        if (!/^[6-9]/.test(national)) {
          return { formatted: `+91 ${national}`, isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9', countryCode: '+91', nationalNumber: national };
        }
        return { formatted: `+91 ${national}`, isValid: true, countryCode: '+91', nationalNumber: national };
      }
    }
    const cc = without00.startsWith('1') ? '+1' : without00.startsWith('44') ? '+44' : `+${without00.slice(0, 2)}`;
    return { 
      formatted: `+${without00}`, 
      isValid: without00.length >= 7 && without00.length <= 15, 
      error: without00.length < 7 ? 'Too short' : (without00.length > 15 ? 'Too long' : undefined),
      countryCode: cc
    };
  }

  // Case 3: 12 digits starting with '91' without '+' (e.g. 919876543210)
  // Do NOT add another +91 (which would produce +91 919876543210)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const national = digitsOnly.slice(2);
    if (/^[6-9]/.test(national)) {
      return { formatted: `+91 ${national}`, isValid: true, countryCode: '+91', nationalNumber: national };
    } else {
      return { formatted: `+91 ${national}`, isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9', countryCode: '+91', nationalNumber: national };
    }
  }

  // Case 4: 11 digits starting with '0' (domestic Indian trunk prefix, e.g. 09876543210)
  // Strip leading 0 and apply +91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    const national = digitsOnly.slice(1);
    if (/^[6-9]/.test(national)) {
      return { formatted: `+91 ${national}`, isValid: true, countryCode: '+91', nationalNumber: national };
    } else {
      return { formatted: `+91 ${national}`, isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9', countryCode: '+91', nationalNumber: national };
    }
  }

  // Case 5: Standard 10-digit Indian national number with NO country code (e.g. 9876543210)
  // Apply default +91 country code!
  if (digitsOnly.length === 10) {
    if (/^[6-9]/.test(digitsOnly)) {
      return { formatted: `+91 ${digitsOnly}`, isValid: true, countryCode: '+91', nationalNumber: digitsOnly };
    } else {
      return { formatted: `+91 ${digitsOnly}`, isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9', countryCode: '+91', nationalNumber: digitsOnly };
    }
  }

  // Case 6: Less than 10 digits
  if (digitsOnly.length < 10) {
    return { formatted: `+91 ${digitsOnly}`, isValid: false, error: `Incomplete mobile number: ${digitsOnly.length} digits (expected 10 digits for India)`, countryCode: '+91', nationalNumber: digitsOnly };
  }

  // Case 7: Unrecognized length
  return { formatted: trimmed, isValid: false, error: `Unrecognized number length (${digitsOnly.length} digits)` };
}

/**
 * Splits raw multi-line/comma/semicolon-separated input into cleanly organized lines
 */
export function splitRawContactInput(text: string): string[] {
  if (!text) return [];
  // Split on newlines, commas, or semicolons
  return text
    .split(/[\r\n,;]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Parse and validate a list of emails with duplicate detection
 */
export function parseEmailList(rawText: string): ContactValidationSummary {
  const lines = splitRawContactInput(rawText);
  const seenMap = new Map<string, number>(); // normalized email -> line index
  const items: ParsedContactItem[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const res = validateAndFormatEmail(line);
    const key = res.formatted.toLowerCase();
    let isDuplicate = false;
    let duplicateOfLine: number | undefined = undefined;

    if (res.isValid) {
      if (seenMap.has(key)) {
        isDuplicate = true;
        duplicateOfLine = seenMap.get(key);
      } else {
        seenMap.set(key, lineNumber);
      }
    }

    items.push({
      id: `eml-${index}-${Date.now()}`,
      lineNumber,
      raw: line,
      formatted: res.formatted,
      isValid: res.isValid && !isDuplicate,
      isDuplicate,
      error: isDuplicate 
        ? `Duplicate: Already entered on line ${duplicateOfLine}` 
        : res.error,
      duplicateOfLine,
    });
  });

  const validItems = items.filter(i => i.isValid);
  const invalidCount = items.filter(i => !i.isValid && !i.isDuplicate).length;
  const duplicateCount = items.filter(i => i.isDuplicate).length;

  return {
    items,
    rawText,
    totalCount: items.length,
    validCount: validItems.length,
    invalidCount,
    duplicateCount,
    hasErrors: invalidCount > 0 || duplicateCount > 0,
    validItems,
  };
}

/**
 * Parse and validate a list of phone numbers with duplicate detection and +91 formatting
 */
export function parsePhoneList(rawText: string): ContactValidationSummary {
  const lines = splitRawContactInput(rawText);
  const seenMap = new Map<string, number>(); // normalized formatted -> line index
  const items: ParsedContactItem[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const res = validateAndFormatPhoneNumber(line);
    const key = res.formatted.replace(/\s+/g, '');
    let isDuplicate = false;
    let duplicateOfLine: number | undefined = undefined;

    if (res.isValid) {
      if (seenMap.has(key)) {
        isDuplicate = true;
        duplicateOfLine = seenMap.get(key);
      } else {
        seenMap.set(key, lineNumber);
      }
    }

    items.push({
      id: `phn-${index}-${Date.now()}`,
      lineNumber,
      raw: line,
      formatted: res.formatted,
      isValid: res.isValid && !isDuplicate,
      isDuplicate,
      error: isDuplicate 
        ? `Duplicate: Already entered on line ${duplicateOfLine}` 
        : res.error,
      duplicateOfLine,
    });
  });

  const validItems = items.filter(i => i.isValid);
  const invalidCount = items.filter(i => !i.isValid && !i.isDuplicate).length;
  const duplicateCount = items.filter(i => i.isDuplicate).length;

  return {
    items,
    rawText,
    totalCount: items.length,
    validCount: validItems.length,
    invalidCount,
    duplicateCount,
    hasErrors: invalidCount > 0 || duplicateCount > 0,
    validItems,
  };
}

/**
 * Clean and format entries line by line
 */
export function organizeCleanLines(text: string, type: 'email' | 'phone'): string {
  const lines = splitRawContactInput(text);
  if (type === 'email') {
    return lines
      .map(l => validateAndFormatEmail(l).formatted || l)
      .filter(Boolean)
      .join('\n');
  } else {
    return lines
      .map(l => validateAndFormatPhoneNumber(l).formatted || l)
      .filter(Boolean)
      .join('\n');
  }
}

/**
 * Remove duplicate lines while preserving the first appearance
 */
export function deduplicateLines(text: string, type: 'email' | 'phone'): string {
  const summary = type === 'email' ? parseEmailList(text) : parsePhoneList(text);
  const uniqueFormatted: string[] = [];
  const seen = new Set<string>();

  summary.items.forEach(item => {
    const key = item.formatted.toLowerCase().replace(/\s+/g, '');
    if (!seen.has(key) && item.formatted) {
      seen.add(key);
      uniqueFormatted.push(item.formatted);
    }
  });

  return uniqueFormatted.join('\n');
}

/**
 * Strip out only invalid lines, keeping all valid entries
 */
export function removeInvalidLines(text: string, type: 'email' | 'phone'): string {
  const summary = type === 'email' ? parseEmailList(text) : parsePhoneList(text);
  return summary.items
    .filter(i => i.isValid)
    .map(i => i.formatted)
    .join('\n');
}
