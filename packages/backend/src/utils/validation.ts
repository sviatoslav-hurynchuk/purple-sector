import { F1_HISTORICAL_BOUNDS } from '../constants/f1';
import { getMaxSupportedSeason } from './season';

/**
 * Validates whether a season value is a valid 4-digit F1 championship year string (1950 to current year + 1).
 * Accepts unknown to guard against malformed or array query parameters (e.g. ?season=2025&season=2026).
 */
export function isValidSeason(season: unknown): season is string {
  if (typeof season !== 'string' || !/^\d{4}$/.test(season.trim())) {
    return false;
  }
  const year = parseInt(season, 10);
  return year >= F1_HISTORICAL_BOUNDS.FIRST_SEASON && year <= getMaxSupportedSeason();
}

/**
 * Parses and validates an optional race round query/path parameter.
 * Returns { isValid: true, value?: string } if valid, or { isValid: false } otherwise.
 */
export function parseRound(raw: unknown): { isValid: boolean; value?: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { isValid: true, value: undefined };
  }
  if (typeof raw !== 'string') {
    return { isValid: false };
  }
  const trimmed = raw.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) {
    return { isValid: false };
  }
  return { isValid: true, value: trimmed };
}
