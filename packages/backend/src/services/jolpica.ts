import type {
  Race,
  DriverStanding,
  ConstructorStanding,
  Driver,
  Constructor,
} from '../types/f1';
import { cache } from './cache';

const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

const CURRENT_SEASON = new Date().getFullYear().toString();

// ── Dynamic Race Weekend TTL Helpers ─────────────────────────────────────────

export function isRaceWeekend(now = new Date()): boolean {
  const day = now.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  return day === 0 || day === 5 || day === 6;
}

function getNextRaceTTL(): number {
  return isRaceWeekend() ? 20 : 60; // 20s during race weekend vs 60s mid-week
}

function getStandingsTTL(): number {
  return isRaceWeekend() ? 60 : 5 * 60; // 60s during race weekend vs 5min mid-week
}

function getUpcomingRaceTTL(): number {
  return isRaceWeekend() ? 60 : 5 * 60; // 60s during race weekend vs 5min mid-week
}

const TTL = {
  SCHEDULE_CURRENT: 6 * 60 * 60,   // 6 hours
  SCHEDULE_PAST: 24 * 60 * 60,     // 24 hours
  RACE_WITH_RESULTS: 24 * 60 * 60, // 24 hours (immutable data)
} as const;

export interface RaceResultEntry {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

export interface RaceResult extends Race {
  Results?: RaceResultEntry[];
  SprintResults?: RaceResultEntry[];
}

// ── Jolpica API Response Schema Definitions ──────────────────────────────────

interface JolpicaResponse<TableKey extends string, TableType> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & {
    [key in TableKey]: TableType;
  };
}

interface RaceTable {
  season: string;
  round?: string;
  Races: Race[];
}

interface RaceResultsTable {
  season: string;
  round?: string;
  Races: RaceResult[];
}

interface StandingsTable {
  season: string;
  StandingsLists: Array<{
    season: string;
    round: string;
    DriverStandings?: DriverStanding[];
    ConstructorStandings?: ConstructorStanding[];
  }>;
}

type JolpicaRacesResponse = JolpicaResponse<'RaceTable', RaceTable>;
type JolpicaRaceResultsResponse = JolpicaResponse<'RaceTable', RaceResultsTable>;
type JolpicaStandingsResponse = JolpicaResponse<'StandingsTable', StandingsTable>;

// ── HTTP Fetch Helper ────────────────────────────────────────────────────────

async function jolpicaFetch<T>(path: string): Promise<T> {
  // According to Jolpica docs: all endpoints must end with .json or /
  const url = `${BASE_URL}${path}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Jolpica API error: ${res.status} — ${url}`);
  }

  const data = await res.json();
  return data as T;
}

// ── Cache-Aside Wrapper with Stampede Protection ────────────────────────────

const inFlight = new Map<string, Promise<unknown>>();

async function cachedFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`);
    return cached;
  }

  console.log(`[Cache MISS] ${key}`);

  const existing = inFlight.get(key);
  if (existing) {
    console.log(`[Cache] Deduplicating in-flight request for key: ${key}`);
    return existing as Promise<T>;
  }

  const promise = fetcher()
    .then(async (fresh) => {
      await cache.set(key, fresh, ttlSeconds);
      inFlight.delete(key);
      return fresh;
    })
    .catch((err: unknown) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

// ── Race Schedule ────────────────────────────────────────────────────────────

export async function getRaceSchedule(season: string | number): Promise<Race[]> {
  const s = String(season);
  const ttl = s === CURRENT_SEASON ? TTL.SCHEDULE_CURRENT : TTL.SCHEDULE_PAST;

  return cachedFetch(`f1:schedule:${s}`, ttl, async () => {
    const data = await jolpicaFetch<JolpicaRacesResponse>(`/${s}`);
    return data.MRData.RaceTable.Races;
  });
}

// ── Race Result / Detail ─────────────────────────────────────────────────────

export async function getRaceResult(
    season: string | number,
    round: string | number
): Promise<RaceResult | Race | null> {
  const s = String(season);
  const r = String(round);
  const cacheKey = `f1:race:${s}:${r}`;

  const cached = await cache.get<RaceResult | Race | null>(cacheKey);
  if (cached !== null) return cached;

  // Fetch schedule, results, and sprint results in parallel
  const [scheduleRes, resultsRes, sprintRes] = await Promise.all([
    jolpicaFetch<JolpicaRacesResponse>(`/${s}/${r}`).catch(() => null),
    jolpicaFetch<JolpicaRaceResultsResponse>(`/${s}/${r}/results`).catch(() => null),
    jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: RaceResult[] }>>(`/${s}/${r}/sprint`).catch(() => null),
  ]);

  const scheduleRace = scheduleRes?.MRData.RaceTable.Races[0];
  const resultsRace = resultsRes?.MRData.RaceTable.Races[0];
  const sprintRace = sprintRes?.MRData.RaceTable.Races[0];

  if (!scheduleRace && !resultsRace && !sprintRace) {
    return null;
  }

  // Merge schedule information with results
  const merged: RaceResult = {
    ...(scheduleRace || {}),
    ...(resultsRace || {}),
  } as RaceResult;

  if (resultsRace?.Results && resultsRace.Results.length > 0) {
    merged.Results = resultsRace.Results;
  }

  if (sprintRace?.SprintResults && sprintRace.SprintResults.length > 0) {
    merged.SprintResults = sprintRace.SprintResults;
  }

  // Immutable results get long TTL; upcoming races get dynamic short TTL
  const hasResults = merged.Results && merged.Results.length > 0;
  const ttl = hasResults ? TTL.RACE_WITH_RESULTS : getUpcomingRaceTTL();

  await cache.set(cacheKey, merged, ttl);
  return merged;
}

// ── Driver Standings ─────────────────────────────────────────────────────────

export async function getDriverStandings(
  season: string | number,
  round?: string | number
): Promise<DriverStanding[]> {
  const s = String(season);
  const cacheKey = round ? `f1:standings:drivers:${s}:${round}` : `f1:standings:drivers:${s}`;

  return cachedFetch(cacheKey, getStandingsTTL(), async () => {
    const path = round ? `/${s}/${round}/driverStandings` : `/${s}/driverStandings`;
    const data = await jolpicaFetch<JolpicaStandingsResponse>(path);
    return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
  });
}

// ── Constructor Standings ────────────────────────────────────────────────────

export async function getConstructorStandings(
  season: string | number,
  round?: string | number
): Promise<ConstructorStanding[]> {
  const s = String(season);
  const cacheKey = round ? `f1:standings:constructors:${s}:${round}` : `f1:standings:constructors:${s}`;

  return cachedFetch(cacheKey, getStandingsTTL(), async () => {
    const path = round ? `/${s}/${round}/constructorStandings` : `/${s}/constructorStandings`;
    const data = await jolpicaFetch<JolpicaStandingsResponse>(path);
    return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  });
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  return cachedFetch('f1:next-race', getNextRaceTTL(), async () => {
    const data = await jolpicaFetch<JolpicaRacesResponse>('/current/next');
    return data.MRData.RaceTable.Races[0] ?? null;
  });
}

// ── Cache Warming ─────────────────────────────────────────────────────────────

export async function warmCache(): Promise<void> {
  console.log('[CacheWarming] Pre-fetching core F1 data...');
  const start = Date.now();

  try {
    await Promise.all([
      getNextRace().catch((err) => console.warn('[CacheWarming] Failed next race:', err instanceof Error ? err.message : err)),
      getRaceSchedule(CURRENT_SEASON).catch((err) => console.warn('[CacheWarming] Failed schedule:', err instanceof Error ? err.message : err)),
      getDriverStandings(CURRENT_SEASON).catch((err) => console.warn('[CacheWarming] Failed driver standings:', err instanceof Error ? err.message : err)),
      getConstructorStandings(CURRENT_SEASON).catch((err) => console.warn('[CacheWarming] Failed constructor standings:', err instanceof Error ? err.message : err)),
    ]);
    console.log(`[CacheWarming] Completed in ${Date.now() - start}ms`);
  } catch (err) {
    console.warn('[CacheWarming] Unexpected error:', err instanceof Error ? err.message : err);
  }
}