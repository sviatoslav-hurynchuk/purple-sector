/**
 * API client for the Purple Sector Express backend.
 * All data requests are routed through our backend server (port 3001),
 * which handles caching, aggregation, and Jolpica/OpenF1 rate limits.
 */

import type {
  Race,
  RaceResult,
  DriverStanding,
  ConstructorStanding,
  Driver,
  DriverProfile,
  Constructor,
  ConstructorProfile,
  PitStopEntry,
  PitStopsResponse,
  RaceLapsResponse,
  RaceSessionData,
  SeasonHeadToHeadResponse,
  TeammatePairBattle,
  SeasonReliabilityResponse,
  ConstructorReliability,
} from '@/types/f1';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Checks if the backend API server is reachable.
 * Used by generateStaticParams to avoid build failures in CI/Vercel
 * when the backend server is not running or under heavy load during the static build phase.
 */
export async function isBackendReachable(): Promise<boolean> {
  // In CI and Vercel build environments, skip build-time static pre-rendering.
  // Burst-requesting 114+ pages against a remote backend during CI causes gateway timeouts
  // (502 Bad Gateway) and Jolpica rate limits. Next.js ISR (revalidate) seamlessly renders
  // and caches these dynamic pages on-demand at runtime.
  if (process.env.VERCEL || process.env.CI || process.env.SKIP_SSG === 'true') {
    return false;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

// ── Response wrapper shapes (match Express route response format) ─────────────

interface StandingsResponse<T> {
  season: string;
  standings: T[];
}

interface RaceScheduleResponse {
  season: string;
  races: Race[];
}

interface DriversResponse {
  season: string;
  drivers: Driver[];
}

interface ConstructorsResponse {
  season: string;
  constructors: Constructor[];
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 500;

/**
 * Resilient fetch wrapper with exponential backoff retry for transient network
 * errors and server-side gateway/rate-limit errors (500, 502, 503, 504, 429).
 */
async function resilientFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      // Return immediately if successful or if error is a non-retryable client error (e.g. 400, 404)
      if (res.ok || !RETRYABLE_STATUS_CODES.has(res.status) || attempt === retries) {
        return res;
      }

      console.warn(
        `[resilientFetch] HTTP ${res.status} for ${url}. Retrying (${attempt + 1}/${retries})...`
      );
    } catch (err) {
      lastError = err;
      if (attempt === retries) {
        throw err;
      }
      console.warn(
        `[resilientFetch] Network error for ${url}. Retrying (${attempt + 1}/${retries})...`,
        err instanceof Error ? err.message : err
      );
    }

    const backoff = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, backoff));
  }

  throw lastError;
}

/**
 * Fetches a resource that is expected to exist.
 * Throws on any non-2xx response after retries.
 */
async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await resilientFetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches a resource that may not exist (e.g. 404).
 * Returns null on 404, server errors (500/502/503), or network failures after retries.
 */
async function apiFetchNullable<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await resilientFetch(`${BACKEND_URL}${path}`, {
      next: { revalidate },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      console.warn(`[apiFetchNullable] Backend API returned ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[apiFetchNullable] Network/fetch error for ${path}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Standings ────────────────────────────────────────────────────────────────

export async function getDriverStandings(season?: number, round?: number): Promise<DriverStanding[]> {
  const currentYear = getCurrentYear();
  const year = season ?? currentYear;
  const roundParam = round ? `&round=${round}` : '';
  const revalidate = year < currentYear ? 86400 : 60; // 24h for past seasons, 60s for current season
  const data = await apiFetch<StandingsResponse<DriverStanding>>(
    `/api/standings/drivers?season=${year}${roundParam}`,
    revalidate
  );
  return data.standings;
}

export async function getConstructorStandings(season?: number, round?: number): Promise<ConstructorStanding[]> {
  const currentYear = getCurrentYear();
  const year = season ?? currentYear;
  const roundParam = round ? `&round=${round}` : '';
  const revalidate = year < currentYear ? 86400 : 60; // 24h for past seasons, 60s for current season
  const data = await apiFetch<StandingsResponse<ConstructorStanding>>(
    `/api/standings/constructors?season=${year}${roundParam}`,
    revalidate
  );
  return data.standings;
}

// ── Races ────────────────────────────────────────────────────────────────────

export async function getRaceSchedule(season?: number): Promise<Race[]> {
  const currentYear = getCurrentYear();
  const year = season ?? currentYear;
  const revalidate = year === currentYear ? 3600 : 86400; // 1h for current year, 24h for past years
  const data = await apiFetch<RaceScheduleResponse>(`/api/races/${year}`, revalidate);
  return data.races;
}

export async function getRaceDetail(
  season: number,
  round: number,
  mockParam?: string
): Promise<RaceResult | Race | null> {
  const currentYear = getCurrentYear();
  // Current season gets 1h revalidate; all non-current seasons (past & future) get 24h
  const revalidate = season === currentYear ? 3600 : 86400;
  const query = mockParam ? `?mockScheduleChange=${encodeURIComponent(mockParam)}` : '';
  return apiFetchNullable<RaceResult | Race>(`/api/races/${season}/${round}${query}`, revalidate);
}

export async function getRacePitStops(
  season: number,
  round: number
): Promise<PitStopEntry[] | null> {
  const currentYear = getCurrentYear();
  // Current season gets 1h revalidate; past seasons get 24h (immutable)
  const revalidate = season === currentYear ? 3600 : 86400;
  const data = await apiFetchNullable<PitStopsResponse>(`/api/races/${season}/${round}/pitstops`, revalidate);
  return data?.pitStops ?? null;
}

export async function getRaceLaps(
  season: number,
  round: number
): Promise<RaceLapsResponse | null> {
  const currentYear = getCurrentYear();
  // Current season gets 1h revalidate; past seasons get 24h (immutable)
  const revalidate = season === currentYear ? 3600 : 86400;
  return apiFetchNullable<RaceLapsResponse>(`/api/races/${season}/${round}/laps`, revalidate);
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(mockParam?: string): Promise<Race | null> {
  const query = mockParam ? `?mockScheduleChange=${encodeURIComponent(mockParam)}` : '';
  // Revalidate every 30s — aligned with backend Redis TTL (20s-60s)
  return apiFetchNullable<Race>(`/api/races/next${query}`, 30);
}

// ── Drivers ──────────────────────────────────────────────────────────────────

export async function getSeasonDrivers(season?: number): Promise<Driver[]> {
  const currentYear = getCurrentYear();
  const year = season ?? currentYear;
  const revalidate = year < currentYear ? 86400 : 3600;
  const data = await apiFetch<DriversResponse>(`/api/drivers?season=${year}`, revalidate);
  return data.drivers;
}

export async function getDriverProfile(driverId: string): Promise<DriverProfile | null> {
  const revalidate = 60; // 60s on frontend; backend Express handles Redis caching (24h)
  return apiFetchNullable<DriverProfile>(`/api/drivers/${driverId}`, revalidate);
}

// ── Constructors ─────────────────────────────────────────────────────────────

export async function getSeasonConstructors(season?: number): Promise<Constructor[]> {
  const currentYear = getCurrentYear();
  const year = season ?? currentYear;
  const revalidate = year < currentYear ? 86400 : 3600;
  const data = await apiFetch<ConstructorsResponse>(`/api/constructors?season=${year}`, revalidate);
  return data.constructors;
}

export async function getConstructorProfile(constructorId: string): Promise<ConstructorProfile | null> {
  const revalidate = 300; // 5 mins for constructor profiles
  return apiFetchNullable<ConstructorProfile>(`/api/constructors/${constructorId}`, revalidate);
}

// ── OpenF1 Enriched Race Data (2023+) ─────────────────────────────────────────

export async function getOpenF1RaceData(
  season: number | string,
  round: number | string
): Promise<RaceSessionData | null> {
  const year = Number(season);
  // OpenF1 only covers 2023 onwards
  if (year < 2023) return null;
  const currentYear = getCurrentYear();
  const revalidate = year === currentYear ? 3600 : 86400;
  return apiFetchNullable<RaceSessionData>(`/api/openf1/race/${season}/${round}`, revalidate);
}

// ── Teammate Head-to-Head ───────────────────────────────────────────────────

export async function getSeasonHeadToHead(
  season?: number | string
): Promise<SeasonHeadToHeadResponse | null> {
  const currentYear = getCurrentYear();
  const year = season ? String(season) : String(currentYear);
  const revalidate = Number(year) < currentYear ? 86400 : 900;
  return apiFetchNullable<SeasonHeadToHeadResponse>(
    `/api/head-to-head/${year}`,
    revalidate
  );
}

export async function getTeammateBattle(
  season: number | string,
  driver1: string,
  driver2: string
): Promise<TeammatePairBattle | null> {
  const currentYear = getCurrentYear();
  const year = String(season);
  const revalidate = Number(year) < currentYear ? 86400 : 900;
  return apiFetchNullable<TeammatePairBattle>(
    `/api/head-to-head/${year}/battle/${driver1}/${driver2}`,
    revalidate
  );
}

export async function getConstructorHeadToHead(
  season: number | string,
  constructorId: string
): Promise<TeammatePairBattle[] | null> {
  const currentYear = getCurrentYear();
  const year = String(season);
  const revalidate = Number(year) < currentYear ? 86400 : 900;
  return apiFetchNullable<TeammatePairBattle[]>(
    `/api/head-to-head/${year}/constructor/${constructorId}`,
    revalidate
  );
}

// ── Reliability & Attrition Analytics ────────────────────────────────────────

/**
 * Fetches season-wide reliability and DNF analytics for all constructors and drivers.
 */
export async function getSeasonReliability(
  season?: number | string
): Promise<SeasonReliabilityResponse | null> {
  const currentYear = getCurrentYear();
  const year = season ? String(season) : String(currentYear);
  const revalidate = Number(year) < currentYear ? 86400 : 900;
  return apiFetchNullable<SeasonReliabilityResponse>(
    `/api/reliability/${year}`,
    revalidate
  );
}

/**
 * Fetches constructor-specific reliability and DNF analytics for a season.
 */
export async function getConstructorReliability(
  season: number | string,
  constructorId: string
): Promise<ConstructorReliability | null> {
  const currentYear = getCurrentYear();
  const year = String(season);
  const revalidate = Number(year) < currentYear ? 86400 : 900;
  return apiFetchNullable<ConstructorReliability>(
    `/api/reliability/${year}/constructor/${constructorId}`,
    revalidate
  );
}