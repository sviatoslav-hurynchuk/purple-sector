/**
 * Helpers for classifying Formula 1 race outcome statuses.
 * Distinguishes cleanly between:
 * 1. Finished on lead lap ('Finished')
 * 2. Finished lapped ('+1 Lap', '+2 Laps', '1 Lap')
 * 3. DNF / Retired / Disqualified ('Engine', 'Collision', 'Accident', 'R', 'D', etc.)
 */

/**
 * Determines whether a race result entry represents a true DNF / Retirement / Disqualification.
 */
export function isDnfStatus(status?: string, positionText?: string): boolean {
  if (!status && !positionText) return false;
  const s = (status ?? '').trim().toLowerCase();
  const p = (positionText ?? '').trim().toUpperCase();

  // Explicit DNF / Disqualified / Not Classified position codes
  if (p === 'R' || p === 'D' || p === 'W' || p === 'NC' || p === 'DNQ' || p === 'DNS') {
    return true;
  }

  // Finished on lead lap or finished lapped is NOT a DNF
  if (s === 'finished') return false;
  if (s.startsWith('+') || s.includes('lap')) return false;

  // Any specific technical or incident status is a DNF
  // (e.g. Engine, Collision, Accident, Brakes, Suspension, Power Unit, Mechanical, Retired, Spun off, etc.)
  return s.length > 0;
}

/**
 * Determines whether a driver finished the race in a lap deficit (+1 Lap, +2 Laps, etc.).
 */
export function isLappedStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  if (s === 'finished') return false;
  return s.startsWith('+') || s.includes('lap');
}

/**
 * Formats a driver's final classification text (e.g. 'P1', 'P14 (+1 Lap)', 'DNF (Engine)').
 */
export function formatRaceOutcome(status?: string, positionText?: string, finishPosition?: number): string {
  if (isDnfStatus(status, positionText)) {
    return status ? `DNF (${status})` : 'DNF';
  }
  const posStr = finishPosition ? `P${finishPosition}` : (positionText ? `P${positionText}` : '');
  if (isLappedStatus(status)) {
    return `${posStr} (${status})`;
  }
  return posStr || 'Finished';
}
