/**
 * Broadcast Time Validation & Formatting Utilities
 * Standardizes timing fields across Admin Broadcast & YouTube Live events.
 * 
 * Required format: HH:MM AM/PM (e.g., 09:30 AM, 12:00 PM, 06:45 PM, 11:15 PM)
 */

export interface TimeValidationResult {
  isValid: boolean;
  formattedTime: string;
  hours?: number;
  minutes?: number;
  period?: 'AM' | 'PM';
  error?: string;
}

export const TIME_FORMAT_ERROR = 'Please enter time in HH:MM AM/PM format (e.g., 09:30 AM).';

/**
 * Validate manual time entry strictly against HH:MM AM/PM format.
 * - Trims unnecessary spaces
 * - Handles case-insensitive am/pm
 * - Validates hours (1-12) and minutes (00-59)
 * - Auto-pads single digit hours and minutes with leading zeros
 */
export function validateBroadcastTime(input: string | undefined | null): TimeValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      formattedTime: '',
      error: TIME_FORMAT_ERROR,
    };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      formattedTime: '',
      error: TIME_FORMAT_ERROR,
    };
  }

  // Regex strictly matching HH:MM AM/PM with optional spacing and case-insensitivity
  const match = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([ap]m)$/i);
  if (!match) {
    return {
      isValid: false,
      formattedTime: trimmed,
      error: TIME_FORMAT_ERROR,
    };
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase() as 'AM' | 'PM';

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`;

  return {
    isValid: true,
    formattedTime,
    hours,
    minutes,
    period,
  };
}

/**
 * Extract clean HH:MM AM/PM from any existing stored time string.
 * Used when populating the input during edit or reschedule flows.
 * Handles ranges (e.g., "06:00 PM – 07:30 PM IST" -> "06:00 PM"),
 * single times with timezone (e.g., "09:30 AM IST" -> "09:30 AM"),
 * and 24h formats ("18:30" -> "06:30 PM").
 */
export function extractBroadcastTime(raw: string | undefined | null, fallback: string = '06:30 PM'): string {
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Search for HH:MM AM/PM pattern anywhere in the string
  const match = trimmed.match(/(0?[1-9]|1[0-2]):([0-5][0-9])\s*([ap]m)/i);
  if (match) {
    const hours = String(parseInt(match[1], 10)).padStart(2, '0');
    const minutes = String(parseInt(match[2], 10)).padStart(2, '0');
    const period = match[3].toUpperCase();
    return `${hours}:${minutes} ${period}`;
  }

  // Fallback 24-hour match e.g. "18:30"
  const match24 = trimmed.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
  }

  return fallback;
}

/**
 * Format a validated time string for persistence in event storage,
 * preserving Indian Standard Time (IST) convention.
 */
export function formatBroadcastStorageTime(formattedTime: string): string {
  const validation = validateBroadcastTime(formattedTime);
  const clean = validation.isValid ? validation.formattedTime : formattedTime.trim();
  if (clean.endsWith('IST')) return clean;
  return `${clean} IST`;
}

/**
 * Legacy compatibility structure for testing and parsing ranges.
 */
export interface ParsedTime {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  durationMinutes: number;
  timezone: string;
}

export function parseBroadcastTime(timeStr: string): ParsedTime {
  const defaultTime: ParsedTime = {
    hour: 6,
    minute: 0,
    period: 'PM',
    durationMinutes: 90,
    timezone: 'IST',
  };

  if (!timeStr || !timeStr.trim()) return defaultTime;
  const clean = timeStr.trim();

  // Range match: "06:00 PM – 07:30 PM IST"
  const rangeMatch = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–\-—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s*([A-Z]{3}))?/i);
  if (rangeMatch) {
    const startH = parseInt(rangeMatch[1], 10);
    const startM = parseInt(rangeMatch[2], 10);
    const startP = rangeMatch[3].toUpperCase() as 'AM' | 'PM';
    const endH = parseInt(rangeMatch[4], 10);
    const endM = parseInt(rangeMatch[5], 10);
    const endP = rangeMatch[6].toUpperCase() as 'AM' | 'PM';
    const tz = rangeMatch[7] || 'IST';

    let startTotalM = (startH % 12 + (startP === 'PM' ? 12 : 0)) * 60 + startM;
    let endTotalM = (endH % 12 + (endP === 'PM' ? 12 : 0)) * 60 + endM;
    let duration = endTotalM >= startTotalM ? endTotalM - startTotalM : (1440 - startTotalM) + endTotalM;

    return {
      hour: startH,
      minute: startM,
      period: startP,
      durationMinutes: duration,
      timezone: tz,
    };
  }

  // Single time match: "06:00 PM IST" or "10:15 AM"
  const singleMatch = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s*([A-Z]{3}))?/i);
  if (singleMatch) {
    const h = parseInt(singleMatch[1], 10);
    const m = parseInt(singleMatch[2], 10);
    const p = singleMatch[3].toUpperCase() as 'AM' | 'PM';
    const tz = singleMatch[4] || 'IST';

    return {
      hour: h,
      minute: m,
      period: p,
      durationMinutes: 0,
      timezone: tz,
    };
  }

  return defaultTime;
}

export function formatBroadcastTime(parsed: ParsedTime): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const startStr = `${pad2(parsed.hour)}:${pad2(parsed.minute)} ${parsed.period}`;
  if (!parsed.durationMinutes || parsed.durationMinutes === 0) {
    return `${startStr} ${parsed.timezone}`.trim();
  }

  let totalM = (parsed.hour % 12 + (parsed.period === 'PM' ? 12 : 0)) * 60 + parsed.minute + parsed.durationMinutes;
  totalM = totalM % 1440;
  const end24H = Math.floor(totalM / 60);
  const endM = totalM % 60;
  const endPeriod = end24H >= 12 ? 'PM' : 'AM';
  const end12H = end24H % 12 || 12;
  const endStr = `${pad2(end12H)}:${pad2(endM)} ${endPeriod}`;

  return `${startStr} – ${endStr} ${parsed.timezone}`.trim();
}
