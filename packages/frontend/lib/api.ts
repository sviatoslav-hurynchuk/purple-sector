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
} from '@/types/f1';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

/**
 * Fetches a resource that is expected to exist.
 * Throws on any non-2xx response.
 */
async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches a resource that may not exist (e.g. 404).
 * Returns null only on 404. Throws on other non-2xx responses or network failures.
 */
async function apiFetchNullable<T>(path: string, revalidate = 60): Promise<T | null> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return (await res.json()) as T;
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
  round: number
): Promise<RaceResult | Race | null> {
  const currentYear = getCurrentYear();
  // Current season gets 1h revalidate; all non-current seasons (past & future) get 24h
  const revalidate = season === currentYear ? 3600 : 86400;
  return apiFetchNullable<RaceResult | Race>(`/api/races/${season}/${round}`, revalidate);
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

export async function getNextRace(): Promise<Race | null> {
  // Revalidate every 30s — aligned with backend Redis TTL (20s-60s)
  return apiFetchNullable<Race>('/api/races/next', 30);
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
  const revalidate = 86400; // 24h for driver profiles
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