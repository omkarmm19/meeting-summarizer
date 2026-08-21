/**
 * Robust date utilities to parse and format timestamps from backend UTC to user's local timezone.
 */

export function parseUtcDate(isoString) {
  if (!isoString) return new Date();
  let str = String(isoString).trim();
  
  // If string does not contain timezone indicator (+, -, or Z), treat it as UTC
  if (!str.endsWith('Z') && !str.includes('+') && !/-\d{2}:\d{2}$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatLocalDateTime(isoString) {
  if (!isoString) return '';
  const d = parseUtcDate(isoString);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatShortDate(isoString) {
  if (!isoString) return '';
  const d = parseUtcDate(isoString);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
