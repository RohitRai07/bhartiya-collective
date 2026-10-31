/**
 * Broadcast Time Validation & Formatting Utilities
 * Standardizes timing fields across Admin Broadcast & YouTube Live events.
 * 
 * Supports both standard single times (HH:MM AM/PM) and full ranges (e.g., 04:00 PM – 08:00 PM IST).
 */

export interface TimeValidationResult {
  isValid: boolean;
  formattedTime: string;
  hours?: number;
  minutes?: number;
  period?: 'AM' | 'PM';
  endHours?: number;
  endMinutes?: number;
  endPeriod?: 'AM' | 'PM';
  hasEndTime?: boolean;
  error?: string;
}

export const TIME_FORMAT_ERROR = 'Please enter time in HH:MM AM/PM format (e.g., 09:30 AM or 04:00 PM – 08:00 PM).';

export interface ParsedEventTimeRange {
  startHours: number;
  startMinutes: number;
  endHours: number;
  endMinutes: number;
  hasEndTime: boolean;
  formattedRange: string;
}

/**
 * Helper to parse a single time component (e.g. "4:00 PM", "4pm", "09:30 AM")
 */
export function parseTimeComponent(s: string): { hours: number; minutes: number; period?: 'AM' | 'PM' } | null {
  if (!s) return null;
  const clean = s.trim();
  const m = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  if (hours < 1 || hours > 12) return null;
  if (minutes < 0 || minutes > 59) return null;
  const period = m[3] ? (m[3].toUpperCase() as 'AM' | 'PM') : undefined;
  return { hours, minutes, period };
}

/**
 * Validate manual time entry strictly against HH:MM AM/PM format (single or range).
 * - Trims unnecessary spaces
 * - Handles case-insensitive am/pm
 * - Validates hours (1-12) and minutes (00-59)
 * - Auto-pads single digit hours and minutes with leading zeros
 * - Supports ranges (e.g. "04:00 PM - 08:00 PM", "4pm to 8pm")
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

  // 1. Strict single-time match: HH:MM AM/PM
  const singleMatch = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([ap]m)$/i);
  if (singleMatch) {
    const hours = parseInt(singleMatch[1], 10);
    const minutes = parseInt(singleMatch[2], 10);
    const period = singleMatch[3].toUpperCase() as 'AM' | 'PM';

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedTime = `${formattedHours}:${formattedMinutes} ${period}`;

    return {
      isValid: true,
      formattedTime,
      hours,
      minutes,
      period,
      hasEndTime: false,
    };
  }

  // 2. Strict range match (e.g., "04:00 PM - 08:00 PM" or "4:00 PM to 8:00 PM")
  const parsedRange = parseEventTimeRange(trimmed);
  if (parsedRange && parsedRange.hasEndTime) {
    const start12 = (parsedRange.startHours % 12) || 12;
    const startP = parsedRange.startHours >= 12 ? 'PM' : 'AM';
    const end12 = (parsedRange.endHours % 12) || 12;
    const endP = parsedRange.endHours >= 12 ? 'PM' : 'AM';

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const formattedTime = `${pad2(start12)}:${pad2(parsedRange.startMinutes)} ${startP} – ${pad2(end12)}:${pad2(parsedRange.endMinutes)} ${endP}`;

    return {
      isValid: true,
      formattedTime,
      hours: start12,
      minutes: parsedRange.startMinutes,
      period: startP,
      endHours: end12,
      endMinutes: parsedRange.endMinutes,
      endPeriod: endP,
      hasEndTime: true,
    };
  }

  return {
    isValid: false,
    formattedTime: trimmed,
    error: TIME_FORMAT_ERROR,
  };
}

/**
 * Parse any time string into 24-hour start and end time components.
 * Handles:
 * - "04:00 PM – 08:00 PM IST"
 * - "4:00 PM - 8:00 PM"
 * - "4pm to 8pm"
 * - "10:00 AM – 4:30 PM IST"
 * - "Wednesday, 28 October 2026 || 4:00 PM - 8:00 PM IST"
 * - "04:00 PM IST" (single time -> defaults to +2 hours duration)
 */
export function parseEventTimeRange(raw: string | undefined | null): ParsedEventTimeRange | null {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s.includes('||')) {
    s = s.split('||')[1].trim();
  }
  s = s.replace(/\b(IST|UTC|GMT)\b/gi, '').trim();

  // Range match with delimiter: -, –, —, to, until
  const rangeMatch = s.match(/^(.*?)\s*(?:[–\-—]|(?:\s+to\s+)|\s+until\s+)\s*(.*)$/i);
  if (rangeMatch) {
    const part1 = parseTimeComponent(rangeMatch[1]);
    const part2 = parseTimeComponent(rangeMatch[2]);
    if (part1 && part2) {
      let h1 = part1.hours;
      const m1 = part1.minutes;
      let p1 = part1.period;

      let h2 = part2.hours;
      const m2 = part2.minutes;
      let p2 = part2.period;

      // Infer period if missing in part1 (e.g. "4 to 8 pm")
      if (!p1 && p2) {
        if (h1 <= 12 && h2 <= 12) {
          p1 = h1 > h2 ? (p2 === 'PM' ? 'AM' : 'PM') : p2;
        }
      }
      if (!p1) p1 = h1 >= 12 ? 'PM' : 'AM';
      if (!p2) p2 = h2 >= 12 ? 'PM' : 'AM';

      const startHours24 = (h1 % 12) + (p1 === 'PM' ? 12 : 0);
      const endHours24 = (h2 % 12) + (p2 === 'PM' ? 12 : 0);

      const pad2 = (n: number) => String(n).padStart(2, '0');
      const start12 = h1 % 12 || 12;
      const end12 = h2 % 12 || 12;
      const formattedRange = `${pad2(start12)}:${pad2(m1)} ${p1} – ${pad2(end12)}:${pad2(m2)} ${p2} IST`;

      return {
        startHours: startHours24,
        startMinutes: m1,
        endHours: endHours24,
        endMinutes: m2,
        hasEndTime: true,
        formattedRange,
      };
    }
  }

  // Single time entry (e.g., "04:00 PM IST" or "04:00 PM")
  const single = parseTimeComponent(s);
  if (single) {
    const h = single.hours;
    const m = single.minutes;
    let p = single.period;
    if (!p) p = h >= 12 ? 'PM' : 'AM';
    const startHours24 = (h % 12) + (p === 'PM' ? 12 : 0);
    // Default duration 2 hours
    const endHours24 = (startHours24 + 2) % 24;

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const start12 = h % 12 || 12;
    const formattedRange = `${pad2(start12)}:${pad2(m)} ${p} IST`;

    return {
      startHours: startHours24,
      startMinutes: m,
      endHours: endHours24,
      endMinutes: m,
      hasEndTime: false,
      formattedRange,
    };
  }

  return null;
}

/**
 * Parse an event date into year, month (0-indexed), and day.
 * Supports:
 * - "2026-11-01" (ISO)
 * - "1 November 2026", "November 1, 2026", "28 October 2026"
 * - "1 November" (without year, defaults to current year)
 */
export function parseEventDate(dateStr: string | undefined | null): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (clean === 'UPCOMING EVENT' || clean === 'COMING SOON' || clean.length < 3) return null;

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }

  // 2. Standard natural date: "1 November 2026" or "November 1, 2026"
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      day: parsed.getDate(),
    };
  }

  // 3. Date without year: "1 November" -> default to current year
  const currentYear = new Date().getFullYear();
  const withYear = new Date(`${clean} ${currentYear}`);
  if (!isNaN(withYear.getTime())) {
    return {
      year: withYear.getFullYear(),
      month: withYear.getMonth(),
      day: withYear.getDate(),
    };
  }

  return null;
}

/**
 * Calculates the exact dynamic live stream status based on scheduled timing.
 * 
 * Rules:
 * - Before start time: "upcoming" (Scheduled Stream)
 * - Start time breach up to (End time + 30 minutes grace): "live" (Ongoing / Live Now)
 * - After (End time + 30 minutes grace): "ended" (Stream Ended / Replay)
 */
export function calculateEventTimingWindow(
  event: { date?: string; time?: string; liveStatus?: string },
  now: Date = new Date()
): {
  status: 'upcoming' | 'live' | 'ended';
  startDate?: Date;
  endDate?: Date;
  endGraceDate?: Date;
  hasTimeWindow: boolean;
} {
  if (!event.date) {
    if (event.liveStatus && ['upcoming', 'live', 'ended'].includes(event.liveStatus)) {
      return { status: event.liveStatus as any, hasTimeWindow: false };
    }
    return { status: 'upcoming', hasTimeWindow: false };
  }

  const dateParts = parseEventDate(event.date);
  if (!dateParts) {
    if (event.liveStatus && ['upcoming', 'live', 'ended'].includes(event.liveStatus)) {
      return { status: event.liveStatus as any, hasTimeWindow: false };
    }
    return { status: 'upcoming', hasTimeWindow: false };
  }

  const timeRange = parseEventTimeRange(event.time);

  // If time could not be parsed, fall back to whole calendar day comparison
  if (!timeRange) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(dateParts.year, dateParts.month, dateParts.day);
    if (eventDay.getTime() === today.getTime()) {
      return { status: 'live', hasTimeWindow: false };
    } else if (eventDay.getTime() < today.getTime()) {
      return { status: 'ended', hasTimeWindow: false };
    } else {
      return { status: 'upcoming', hasTimeWindow: false };
    }
  }

  // Construct start date time
  const startDate = new Date(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    timeRange.startHours,
    timeRange.startMinutes,
    0
  );

  // Construct end date time
  let endDate = new Date(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    timeRange.endHours,
    timeRange.endMinutes,
    0
  );
  if (timeRange.endHours < timeRange.startHours) {
    // Overnight event
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  }

  // Exactly +30 minutes grace period
  const endGraceDate = new Date(endDate.getTime() + 30 * 60 * 1000);

  const nowMs = now.getTime();
  if (nowMs < startDate.getTime()) {
    return {
      status: 'upcoming',
      startDate,
      endDate,
      endGraceDate,
      hasTimeWindow: true,
    };
  } else if (nowMs <= endGraceDate.getTime()) {
    return {
      status: 'live',
      startDate,
      endDate,
      endGraceDate,
      hasTimeWindow: true,
    };
  } else {
    return {
      status: 'ended',
      startDate,
      endDate,
      endGraceDate,
      hasTimeWindow: true,
    };
  }
}

/**
 * Extract clean start time (HH:MM AM/PM) from any existing stored time string.
 */
export function extractBroadcastTime(raw: string | undefined | null, fallback: string = '06:30 PM'): string {
  const parsed = parseEventTimeRange(raw);
  if (parsed) {
    const start12 = (parsed.startHours % 12) || 12;
    const period = parsed.startHours >= 12 ? 'PM' : 'AM';
    const pad2 = (n: number) => String(n).padStart(2, '0');
    return `${pad2(start12)}:${pad2(parsed.startMinutes)} ${period}`;
  }
  return fallback;
}

/**
 * Extract clean end time (HH:MM AM/PM) if present in stored time string.
 */
export function extractBroadcastEndTime(raw: string | undefined | null, fallback: string = ''): string {
  const parsed = parseEventTimeRange(raw);
  if (parsed && parsed.hasEndTime) {
    const end12 = (parsed.endHours % 12) || 12;
    const period = parsed.endHours >= 12 ? 'PM' : 'AM';
    const pad2 = (n: number) => String(n).padStart(2, '0');
    return `${pad2(end12)}:${pad2(parsed.endMinutes)} ${period}`;
  }
  return fallback;
}

/**
 * Format the end time + 30 minutes grace threshold for human display (e.g. "08:00 PM" -> "08:30 PM").
 */
export function formatGraceEndTime(timeStr: string): string {
  const parsed = parseEventTimeRange(timeStr);
  if (!parsed) return '';
  const endHours = parsed.hasEndTime ? parsed.endHours : parsed.startHours;
  const endMinutes = parsed.hasEndTime ? parsed.endMinutes : parsed.startMinutes;
  let totalM = endHours * 60 + endMinutes + 30; // +30 minutes grace
  totalM = totalM % 1440;
  const h24 = Math.floor(totalM / 60);
  const m = totalM % 60;
  const p = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(h12)}:${pad2(m)} ${p}`;
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
