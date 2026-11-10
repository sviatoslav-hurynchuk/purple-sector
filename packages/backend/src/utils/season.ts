import { CACHE_TTL } from '../constants/cache';

/**
 * Returns the current calendar year as a 4-digit string (e.g. "2026").
 */
export function getCurrentSeason(): string {
  return new Date().getFullYear().toString();
}

/**
 * Resolves a season parameter, replacing undefined or 'current' with the actual year.
 */
export function resolveCurrentSeason(season?: string): string {
  if (!season || season === 'current') {
    return getCurrentSeason();
  }
  return season.trim();
}

/**
 * Maximum supported calendar year (current year + 1 to account for upcoming schedule releases).
 */
export function getMaxSupportedSeason(): number {
  return new Date().getFullYear() + 1;
}

/**
 * Checks whether the current moment falls within a Formula 1 race weekend (Friday, Saturday, or Sunday in UTC).
 */
export function isRaceWeekend(now = new Date()): boolean {
  const day = now.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  return day === 0 || day === 5 || day === 6;
}

/**
 * Returns dynamic TTL for the next upcoming race (20s on race weekend, 60s mid-week).
 */
export function getNextRaceTTL(): number {
  return isRaceWeekend() ? CACHE_TTL.TWENTY_SECONDS : CACHE_TTL.ONE_MINUTE;
}

/**
 * Returns dynamic TTL for championship standings (60s on race weekend, 5m mid-week).
 */
export function getStandingsTTL(): number {
  return isRaceWeekend() ? CACHE_TTL.ONE_MINUTE : CACHE_TTL.FIVE_MINUTES;
}

/**
 * Returns dynamic TTL for upcoming race sessions (60s on race weekend, 5m mid-week).
 */
export function getUpcomingRaceTTL(): number {
  return isRaceWeekend() ? CACHE_TTL.ONE_MINUTE : CACHE_TTL.FIVE_MINUTES;
}
