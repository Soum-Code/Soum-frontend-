/**
 * Utility functions for parsing, formatting, and calculating relative time
 * across telemetry, traces, and incident diagnostics.
 */

export interface TimeDisplayInfo {
  relative: string;          // e.g. "2s ago", "1m ago", "just now"
  fullRelative: string;      // e.g. "2 seconds ago", "1 minute ago", "just now"
  formattedTime: string;     // e.g. "10:32:15"
  formattedDate: string;     // e.g. "2026-10-19"
  formattedDateTime: string; // e.g. "2026-10-19 10:32:15"
  isoString: string;         // ISO 8601 string
  timestampMs: number;       // Unix epoch ms
  raw: string;
}

/**
 * Parses any date/time string, ISO string, time-only string, or relative string to epoch ms.
 */
export const parseDateTimeToMs = (dateStr?: string | null, referenceNow: number = Date.now()): number => {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // 1. Relative string parser (e.g., "2s ago", "15m ago", "2h ago", "1d ago", "Just now", "Yesterday")
  if (/^just\s*now$/i.test(trimmed)) {
    return referenceNow;
  }
  if (/^yesterday$/i.test(trimmed)) {
    return referenceNow - 86400 * 1000;
  }
  const relMatch = trimmed.match(/^(\d+)\s*([smhdw]|mo|yr?|sec|secs|min|mins|hours?|days?)\s*ago$/i);
  if (relMatch) {
    const amount = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    let multiplier = 1000; // default seconds
    if (unit.startsWith('s')) multiplier = 1000;
    else if (unit.startsWith('m') && !unit.startsWith('mo')) multiplier = 60 * 1000;
    else if (unit.startsWith('h')) multiplier = 3600 * 1000;
    else if (unit.startsWith('d')) multiplier = 86400 * 1000;
    else if (unit.startsWith('w')) multiplier = 7 * 86400 * 1000;
    else if (unit.startsWith('mo')) multiplier = 30 * 86400 * 1000;
    else if (unit.startsWith('y')) multiplier = 365 * 86400 * 1000;
    return referenceNow - amount * multiplier;
  }

  // 2. Full date format (e.g. "2026-08-31 10:32:15" or ISO)
  const normalizedIso = trimmed.includes(' ') && !trimmed.match(/\b(am|pm)\b/i)
    ? trimmed.replace(' ', 'T')
    : trimmed;
  const parsedDirect = Date.parse(normalizedIso);
  if (!isNaN(parsedDirect)) {
    return parsedDirect;
  }

  // 3. Time string e.g. "10:32:15", "10:32:15 AM", "2:30 PM"
  const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const match = trimmed.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    const ampm = match[4]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const today = new Date(referenceNow);
    today.setHours(hours, minutes, seconds, 0);
    return today.getTime();
  }

  // 4. Fallback to Date.parse
  const fallback = Date.parse(trimmed);
  if (!isNaN(fallback)) return fallback;

  return 0;
};

/**
 * Returns a compact relative time string (e.g. "2s ago", "15m ago", "2h ago", "just now").
 */
export const formatRelativeTime = (
  dateInput?: string | number | Date | null,
  referenceNow: number = Date.now()
): string => {
  if (!dateInput) return 'N/A';

  // If already formatted relative string, return directly
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^(\d+[smhdw]|just\s*now|yesterday)/i.test(trimmed)) {
      return trimmed;
    }
  }

  const ms = typeof dateInput === 'number'
    ? dateInput
    : dateInput instanceof Date
    ? dateInput.getTime()
    : parseDateTimeToMs(dateInput, referenceNow);

  if (ms <= 0) {
    return typeof dateInput === 'string' ? dateInput : 'N/A';
  }

  const diffMs = referenceNow - ms;
  if (diffMs < 1000 && diffMs >= -1000) {
    return 'just now';
  }

  if (diffMs < 0) {
    // Slight clock drift in future
    return 'just now';
  }

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    return `${sec}s ago`;
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }

  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

/**
 * Returns an expanded, human-readable relative time string (e.g. "2 seconds ago", "3 minutes ago").
 */
export const formatFullRelativeTime = (
  dateInput?: string | number | Date | null,
  referenceNow: number = Date.now()
): string => {
  if (!dateInput) return 'N/A';

  const ms = typeof dateInput === 'number'
    ? dateInput
    : dateInput instanceof Date
    ? dateInput.getTime()
    : parseDateTimeToMs(dateInput, referenceNow);

  if (ms <= 0) return 'N/A';

  const diffMs = referenceNow - ms;
  if (diffMs < 1000 && diffMs >= -1000) {
    return 'just now';
  }
  if (diffMs < 0) return 'just now';

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    return `${sec} second${sec === 1 ? '' : 's'} ago`;
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} minute${min === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

/**
 * Formats a timestamp into comprehensive display components for UI columns and tooltips.
 */
export const getTimeDisplayInfo = (
  dateInput?: string | number | Date | null,
  referenceNow: number = Date.now()
): TimeDisplayInfo => {
  const raw = dateInput ? String(dateInput).trim() : '';
  const ms = typeof dateInput === 'number'
    ? dateInput
    : dateInput instanceof Date
    ? dateInput.getTime()
    : parseDateTimeToMs(dateInput, referenceNow);

  if (ms <= 0) {
    return {
      relative: raw || 'N/A',
      fullRelative: raw || 'N/A',
      formattedTime: raw || '--:--:--',
      formattedDate: '--',
      formattedDateTime: raw || 'N/A',
      isoString: '',
      timestampMs: 0,
      raw
    };
  }

  const dateObj = new Date(ms);
  const relative = formatRelativeTime(ms, referenceNow);
  const fullRelative = formatFullRelativeTime(ms, referenceNow);

  // Pad helper
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  const seconds = pad(dateObj.getSeconds());
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const formattedDate = `${year}-${month}-${day}`;
  const formattedDateTime = `${formattedDate} ${formattedTime}`;

  let isoString = '';
  try {
    isoString = dateObj.toISOString();
  } catch {
    isoString = formattedDateTime;
  }

  return {
    relative,
    fullRelative,
    formattedTime,
    formattedDate,
    formattedDateTime,
    isoString,
    timestampMs: ms,
    raw
  };
};
