/**
 * Centralized formatting utilities for lap times, telemetry deltas, and session durations.
 */

/**
 * Parses a lap time string formatted as "M:SS.mmm" or "SS.mmm" into seconds as a float.
 * Returns NaN if parsing fails or string is empty.
 */
export function parseLapTimeToSeconds(timeStr: string): number {
  if (!timeStr) return Number.NaN;
  const parts = timeStr.trim().split(':');
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  const seconds = parseFloat(parts[0]);
  return Number.isNaN(seconds) ? Number.NaN : seconds;
}

/**
 * Formats a numeric duration in seconds into standard motorsport "M:SS.mmm" format.
 * Returns "—" if duration is absent, non-finite, or <= 0.
 */
export function formatLapTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds) || !Number.isFinite(seconds) || seconds <= 0) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes > 0) {
    return `${minutes}:${remainder.toFixed(3).padStart(6, '0')}`;
  }
  return remainder.toFixed(3);
}

/**
 * Formats duration in seconds strictly ensuring "M:SS.mmm" padded layout.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds) || seconds <= 0) {
    return '—';
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = (seconds % 60).toFixed(3);
  return `${mins}:${remSecs.padStart(6, '0')}`;
}

/**
 * Formats leader gap delta. Returns "LEADER" if 0, "+X.XXX" if number, or raw value.
 */
export function formatGap(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    return val === 0 ? 'LEADER' : `+${val.toFixed(3)}`;
  }
  return String(val);
}

/**
 * Formats interval to driver ahead. Returns "—" if 0 or leader, or "+X.XXX" if number.
 */
export function formatInterval(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    return val === 0 ? '—' : `+${val.toFixed(3)}`;
  }
  return String(val);
}
