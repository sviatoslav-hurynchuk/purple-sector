import type {
  Race,
  DriverStanding,
  ConstructorStanding,
  Driver,
  Constructor,
  QualifyingResultEntry,
  DriverProfile,
  DriverSeasonStanding,
  DriverCareerStats,
} from '../types/f1';
import { cache } from './cache';
import { getOfficialF1DriverStats, warmOfficialDriverStats } from './f1-official';

const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

function getCurrentSeason(): string {
  return new Date().getFullYear().toString();
}

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
  NEGATIVE_CACHE: 5 * 60,          // 5 minutes for non-existent races
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
  QualifyingResults?: QualifyingResultEntry[];
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

interface DriverTable {
  season?: string;
  driverId?: string;
  Drivers: Driver[];
}

interface RaceResultsTable {
  season: string;
  round?: string;
  Races: RaceResult[];
}

interface StandingsTable {
  season: string;
  driverId?: string;
  StandingsLists: Array<{
    season: string;
    round: string;
    DriverStandings?: DriverStanding[];
    ConstructorStandings?: ConstructorStanding[];
  }>;
}

type JolpicaRacesResponse = JolpicaResponse<'RaceTable', RaceTable>;
type JolpicaDriversResponse = JolpicaResponse<'DriverTable', DriverTable>;
type JolpicaRaceResultsResponse = JolpicaResponse<'RaceTable', RaceResultsTable>;
type JolpicaStandingsResponse = JolpicaResponse<'StandingsTable', StandingsTable>;
// ── HTTP Fetch Helper with Retry ──────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  backoffMs = 300
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[Jolpica] Got HTTP ${res.status} for ${url}. Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(`[Jolpica] Network error for ${url}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

async function jolpicaFetch<T>(path: string, timeoutMs = 8000): Promise<T> {
  // According to Jolpica docs: all endpoints must end with .json or /
  const url = `${BASE_URL}${path}.json`;
  const res = await fetchWithRetry(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`Jolpica API error: ${res.status} — ${url}`);
  }

  const data = await res.json();
  return data as T;
}

// ── Cache-Aside Wrapper with Stampede & Negative Caching Protection ─────────

const inFlight = new Map<string, Promise<unknown>>();

type TTLResolver<T> = number | ((data: T) => number);

async function cachedFetch<T>(
  key: string,
  ttl: TTLResolver<T>,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null && cached !== undefined) {
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
      // Negative caching protection: if fresh is null/undefined, do NOT cache for 24h!
      if (fresh !== null && fresh !== undefined) {
        const computedTtl = typeof ttl === 'function' ? ttl(fresh) : ttl;
        await cache.set(key, fresh, computedTtl);
      } else {
        // Cache negative result for only 5 seconds to prevent spam while allowing quick recovery
        await cache.set(key, fresh, 5);
      }
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
  const ttl = s === getCurrentSeason() ? TTL.SCHEDULE_CURRENT : TTL.SCHEDULE_PAST;

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

  return cachedFetch<RaceResult | Race | null>(
    cacheKey,
    (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      const hasResults = 'Results' in data && Array.isArray(data.Results) && data.Results.length > 0;
      return hasResults ? TTL.RACE_WITH_RESULTS : getUpcomingRaceTTL();
    },
    async () => {
      // 1. Fetch race schedule details (let upstream errors propagate for outages)
      const scheduleRes = await jolpicaFetch<JolpicaRacesResponse>(`/${s}/${r}`);
      const scheduleRace = scheduleRes.MRData.RaceTable.Races[0];

      if (!scheduleRace) {
        return null;
      }

      // 2. Fetch results, sprint, and qualifying in parallel (optional sub-requests)
      const [resultsRes, sprintRes, qualyRes] = await Promise.all([
        jolpicaFetch<JolpicaRaceResultsResponse>(`/${s}/${r}/results`).catch(() => null),
        jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: RaceResult[] }>>(`/${s}/${r}/sprint`).catch(() => null),
        jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: { QualifyingResults?: QualifyingResultEntry[] }[] }>>(`/${s}/${r}/qualifying`).catch(() => null),
      ]);

      const resultsRace = resultsRes?.MRData.RaceTable.Races[0];
      const sprintRace = sprintRes?.MRData.RaceTable.Races[0];
      const qualyRace = qualyRes?.MRData.RaceTable.Races[0];

      const merged: RaceResult = {
        ...scheduleRace,
        ...(resultsRace || {}),
      } as RaceResult;

      if (resultsRace?.Results && resultsRace.Results.length > 0) {
        merged.Results = resultsRace.Results;
      }

      if (sprintRace?.SprintResults && sprintRace.SprintResults.length > 0) {
        merged.SprintResults = sprintRace.SprintResults;
      }

      if (qualyRace?.QualifyingResults && qualyRace.QualifyingResults.length > 0) {
        merged.QualifyingResults = qualyRace.QualifyingResults;
      }

      return merged;
    }
  );
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

// ── Drivers ──────────────────────────────────────────────────────────────────

export async function getSeasonDrivers(season?: string | number): Promise<Driver[]> {
  const s = season ? String(season) : getCurrentSeason();
  const cacheKey = `f1:drivers:${s}`;

  return cachedFetch(cacheKey, TTL.SCHEDULE_PAST, async () => {
    const data = await jolpicaFetch<JolpicaDriversResponse>(`/${s}/drivers?limit=100`);
    return data.MRData.DriverTable.Drivers ?? [];
  });
}

const DRIVER_2026_REGISTRY: Record<
  string,
  {
    givenName: string;
    familyName: string;
    nationality: string;
    permanentNumber?: string;
    code?: string;
    constructorId: string;
    constructorName: string;
  }
> = {
  antonelli: { givenName: 'Andrea Kimi', familyName: 'Antonelli', nationality: 'Italian', permanentNumber: '12', code: 'ANT', constructorId: 'mercedes', constructorName: 'Mercedes' },
  russell: { givenName: 'George', familyName: 'Russell', nationality: 'British', permanentNumber: '63', code: 'RUS', constructorId: 'mercedes', constructorName: 'Mercedes' },
  hamilton: { givenName: 'Lewis', familyName: 'Hamilton', nationality: 'British', permanentNumber: '44', code: 'HAM', constructorId: 'ferrari', constructorName: 'Ferrari' },
  leclerc: { givenName: 'Charles', familyName: 'Leclerc', nationality: 'Monegasque', permanentNumber: '16', code: 'LEC', constructorId: 'ferrari', constructorName: 'Ferrari' },
  verstappen: { givenName: 'Max', familyName: 'Verstappen', nationality: 'Dutch', permanentNumber: '1', code: 'VER', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  max_verstappen: { givenName: 'Max', familyName: 'Verstappen', nationality: 'Dutch', permanentNumber: '1', code: 'VER', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  hadjar: { givenName: 'Isack', familyName: 'Hadjar', nationality: 'French', permanentNumber: '6', code: 'HAD', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  norris: { givenName: 'Lando', familyName: 'Norris', nationality: 'British', permanentNumber: '4', code: 'NOR', constructorId: 'mclaren', constructorName: 'McLaren' },
  piastri: { givenName: 'Oscar', familyName: 'Piastri', nationality: 'Australian', permanentNumber: '81', code: 'PIA', constructorId: 'mclaren', constructorName: 'McLaren' },
  alonso: { givenName: 'Fernando', familyName: 'Alonso', nationality: 'Spanish', permanentNumber: '14', code: 'ALO', constructorId: 'astonmartin', constructorName: 'Aston Martin' },
  stroll: { givenName: 'Lance', familyName: 'Stroll', nationality: 'Canadian', permanentNumber: '18', code: 'STR', constructorId: 'astonmartin', constructorName: 'Aston Martin' },
  gasly: { givenName: 'Pierre', familyName: 'Gasly', nationality: 'French', permanentNumber: '10', code: 'GAS', constructorId: 'alpine', constructorName: 'Alpine' },
  colapinto: { givenName: 'Franco', familyName: 'Colapinto', nationality: 'Argentine', permanentNumber: '43', code: 'COL', constructorId: 'alpine', constructorName: 'Alpine' },
  albon: { givenName: 'Alexander', familyName: 'Albon', nationality: 'Thai', permanentNumber: '23', code: 'ALB', constructorId: 'williams', constructorName: 'Williams' },
  sainz: { givenName: 'Carlos', familyName: 'Sainz', nationality: 'Spanish', permanentNumber: '55', code: 'SAI', constructorId: 'williams', constructorName: 'Williams' },
  bearman: { givenName: 'Oliver', familyName: 'Bearman', nationality: 'British', permanentNumber: '87', code: 'BEA', constructorId: 'haas', constructorName: 'Haas' },
  ocon: { givenName: 'Esteban', familyName: 'Ocon', nationality: 'French', permanentNumber: '31', code: 'OCO', constructorId: 'haas', constructorName: 'Haas' },
  hulkenberg: { givenName: 'Nico', familyName: 'Hülkenberg', nationality: 'German', permanentNumber: '27', code: 'HUL', constructorId: 'audi', constructorName: 'Audi' },
  bortoleto: { givenName: 'Gabriel', familyName: 'Bortoleto', nationality: 'Brazilian', permanentNumber: '5', code: 'BOR', constructorId: 'audi', constructorName: 'Audi' },
  lawson: { givenName: 'Liam', familyName: 'Lawson', nationality: 'New Zealander', permanentNumber: '30', code: 'LAW', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  lindblad: { givenName: 'Arvid', familyName: 'Lindblad', nationality: 'British', permanentNumber: '41', code: 'LIN', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  arvid_lindblad: { givenName: 'Arvid', familyName: 'Lindblad', nationality: 'British', permanentNumber: '41', code: 'LIN', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  bottas: { givenName: 'Valtteri', familyName: 'Bottas', nationality: 'Finnish', permanentNumber: '77', code: 'BOT', constructorId: 'cadillac', constructorName: 'Cadillac' },
  perez: { givenName: 'Sergio', familyName: 'Pérez', nationality: 'Mexican', permanentNumber: '11', code: 'PER', constructorId: 'cadillac', constructorName: 'Cadillac' },
};

export async function getDriverProfile(driverId: string): Promise<DriverProfile | null> {
  const rawId = driverId.trim().toLowerCase();
  // Map aliases to official Jolpica driverId
  const idMap: Record<string, string> = {
    lindblad: 'arvid_lindblad',
    aron: 'paul_aron',
    beganovic: 'dino_beganovic',
    'nico-hulkenberg': 'hulkenberg',
    'carlos-sainz': 'sainz',
    'max-verstappen': 'max_verstappen',
    'lewis-hamilton': 'hamilton',
  };
  const id = idMap[rawId] ?? rawId;
  const cacheKey = `f1:driver:profile:${id}`;

  return cachedFetch<DriverProfile | null>(cacheKey, TTL.SCHEDULE_PAST, async () => {
    // Lean fetching: 2 light calls to Jolpica + 1 official F1 call (eliminates 429 burst storm)
    const [driverRes, standingsRes, officialStats] = await Promise.all([
      jolpicaFetch<JolpicaDriversResponse>(`/drivers/${id}`).catch(() => null),
      jolpicaFetch<JolpicaStandingsResponse>(`/drivers/${id}/driverStandings?limit=100`).catch(() => null),
      getOfficialF1DriverStats(id).catch(() => null),
    ]);

    let driver: Driver | undefined = driverRes?.MRData.DriverTable.Drivers[0];

    // Smart Fallback: if Jolpica is temporarily down or has no entry, use registry fallback
    if (!driver) {
      const fallbackMeta = DRIVER_2026_REGISTRY[id] ?? DRIVER_2026_REGISTRY[rawId];
      if (fallbackMeta) {
        driver = {
          driverId: id,
          permanentNumber: fallbackMeta.permanentNumber,
          code: fallbackMeta.code,
          url: `https://www.formula1.com/en/drivers/${id.replace(/_/g, '-')}`,
          givenName: fallbackMeta.givenName,
          familyName: fallbackMeta.familyName,
          dateOfBirth: officialStats?.bio?.dateOfBirth ?? '',
          nationality: fallbackMeta.nationality,
        };
      } else {
        return null;
      }
    }

    const validDriver: Driver = driver;

    const standingsLists = standingsRes?.MRData.StandingsTable.StandingsLists ?? [];
    let seasonHistory: DriverSeasonStanding[] = standingsLists
      .map((list) => {
        const entry = list.DriverStandings?.[0];
        if (!entry) return null;
        return {
          season: list.season,
          round: list.round,
          position: entry.position,
          points: entry.points,
          wins: entry.wins,
          constructors: (entry.Constructors ?? []).map((c) => ({
            constructorId: c.constructorId,
            name: c.name,
          })),
        };
      })
      .filter((s): s is DriverSeasonStanding => s !== null)
      .sort((a, b) => Number(b.season) - Number(a.season));

    // Fallback for rookie drivers without past season standings history
    if (seasonHistory.length === 0) {
      const fallbackMeta = DRIVER_2026_REGISTRY[id] ?? DRIVER_2026_REGISTRY[rawId];
      if (fallbackMeta && officialStats?.season) {
        seasonHistory = [
          {
            season: officialStats.season.year ?? '2026',
            round: '1',
            position: officialStats.season.position.replace(/[^0-9]/g, '') || '1',
            points: officialStats.season.points || '0',
            wins: String(officialStats.season.gpWins || 0),
            constructors: [
              {
                constructorId: fallbackMeta.constructorId,
                name: fallbackMeta.constructorName,
              },
            ],
          },
        ];
      }
    }

    const calcWins = () => {
      if (officialStats?.career) {
        const m = officialStats.career.highestRaceFinish.match(/1\s*\(x(\d+)\)/);
        if (m) return parseInt(m[1], 10);
        if (officialStats.career.highestRaceFinish === '1') return 1;
      }
      return seasonHistory.reduce((sum, s) => sum + parseInt(s.wins || '0', 10), 0);
    };

    const careerStats: DriverCareerStats = {
      wins: calcWins(),
      podiums: officialStats?.career?.podiums ?? 0,
      poles: officialStats?.career?.polePositions ?? 0,
      championships: officialStats?.career?.worldChampionships ?? 0,
      totalRaces: officialStats?.career?.grandsPrixEntered ?? (seasonHistory.length > 0 ? seasonHistory.length * 22 : 0),
    };

    return {
      driver: validDriver,
      careerStats,
      seasonHistory,
      officialStats,
    };
  });
}

// ── Cache Warming ─────────────────────────────────────────────────────────────

export async function warmCache(): Promise<void> {
  console.log('[CacheWarming] Pre-fetching core F1 data...');
  const start = Date.now();
  const currentSeason = getCurrentSeason();

  try {
    await Promise.all([
      getNextRace().catch((err) => console.warn('[CacheWarming] Failed next race:', err instanceof Error ? err.message : err)),
      getRaceSchedule(currentSeason).catch((err) => console.warn('[CacheWarming] Failed schedule:', err instanceof Error ? err.message : err)),
      getDriverStandings(currentSeason).catch((err) => console.warn('[CacheWarming] Failed driver standings:', err instanceof Error ? err.message : err)),
      getConstructorStandings(currentSeason).catch((err) => console.warn('[CacheWarming] Failed constructor standings:', err instanceof Error ? err.message : err)),
      warmOfficialDriverStats().catch((err) => console.warn('[CacheWarming] Failed official driver stats:', err instanceof Error ? err.message : err)),
    ]);
    console.log(`[CacheWarming] Completed in ${Date.now() - start}ms`);
  } catch (err) {
    console.warn('[CacheWarming] Unexpected error:', err instanceof Error ? err.message : err);
  }
}