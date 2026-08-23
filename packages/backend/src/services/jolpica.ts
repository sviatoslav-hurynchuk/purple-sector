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
  ConstructorProfile,
  ConstructorMeta,
  ConstructorCareerStats,
  ConstructorDriverHistory,
  PitStopEntry,
} from '../types/f1';
import { cache } from './cache';
import { getOfficialF1DriverStats, getOfficialF1TeamDetails, warmOfficialDriverStats } from './f1-official';

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
  PIT_STOPS: 24 * 60 * 60,         // 24 hours (immutable once race finishes)
  NEGATIVE_CACHE: 5 * 60,          // 5 minutes for non-existent races
  CONSTRUCTOR_PROFILE: 5 * 60,     // 5 minutes for constructor profiles
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

interface ConstructorTable {
  season?: string;
  constructorId?: string;
  Constructors: Constructor[];
}

interface SeasonTable {
  constructorId?: string;
  Seasons: Array<{ season: string; url: string }>;
}

type JolpicaRacesResponse = JolpicaResponse<'RaceTable', RaceTable>;
type JolpicaDriversResponse = JolpicaResponse<'DriverTable', DriverTable>;
type JolpicaConstructorsResponse = JolpicaResponse<'ConstructorTable', ConstructorTable>;
type JolpicaSeasonsResponse = JolpicaResponse<'SeasonTable', SeasonTable>;
type JolpicaRaceResultsResponse = JolpicaResponse<'RaceTable', RaceResultsTable>;
type JolpicaStandingsResponse = JolpicaResponse<'StandingsTable', StandingsTable>;

// Pit stop table shape returned by Jolpica /{season}/{round}/pitstops.json
interface PitStopRaceRow extends Race {
  PitStops: PitStopEntry[];
}
interface PitStopTable {
  season: string;
  round?: string;
  Races: PitStopRaceRow[];
}
type JolpicaPitStopsResponse = JolpicaResponse<'RaceTable', PitStopTable>;

// ── HTTP Fetch Helper with Throttled Queue & Resilient Backoff ──────────────

interface JolpicaQueueItem {
  url: string;
  options: RequestInit;
  retries: number;
  timeoutMs: number;
  resolve: (res: Response) => void;
  reject: (err: unknown) => void;
}

const JOLPICA_QUEUE: JolpicaQueueItem[] = [];
let activeJolpicaCount = 0;
const MAX_JOLPICA_CONCURRENCY = 2;
const MIN_JOLPICA_INTERVAL_MS = 120;
const MAX_JOLPICA_QUEUE_CAPACITY = 200;
let nextScheduledJolpicaTime = 0;

function enqueueJolpicaRequest(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 10000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (JOLPICA_QUEUE.length >= MAX_JOLPICA_QUEUE_CAPACITY) {
      reject(new Error(`Jolpica request queue is full (${MAX_JOLPICA_QUEUE_CAPACITY} items pending). Server overloaded.`));
      return;
    }
    JOLPICA_QUEUE.push({ url, options, retries, timeoutMs, resolve, reject });
    processJolpicaQueue();
  });
}

function processJolpicaQueue(): void {
  if (JOLPICA_QUEUE.length === 0 || activeJolpicaCount >= MAX_JOLPICA_CONCURRENCY) return;

  const now = Date.now();
  const scheduledTime = Math.max(now, nextScheduledJolpicaTime);
  nextScheduledJolpicaTime = scheduledTime + MIN_JOLPICA_INTERVAL_MS;
  const delay = Math.max(0, scheduledTime - now);

  const item = JOLPICA_QUEUE.shift();
  if (!item) return;

  activeJolpicaCount++;

  setTimeout(async () => {
    try {
      let lastError: unknown;
      for (let attempt = 0; attempt <= item.retries; attempt++) {
        try {
          const signal = AbortSignal.timeout(item.timeoutMs);
          const res = await fetch(item.url, { ...item.options, signal });
          if ((res.status === 429 || res.status >= 500) && attempt < item.retries) {
            await res.body?.cancel().catch(() => {});
            const backoff = 700 * Math.pow(1.5, attempt) + Math.random() * 200;
            console.warn(
              `[Jolpica] HTTP ${res.status} for ${item.url}. Backing off ${Math.round(backoff)}ms (attempt ${attempt + 1}/${item.retries})...`
            );
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          item.resolve(res);
          return;
        } catch (err) {
          lastError = err;
          if (attempt < item.retries) {
            const backoff = 700 * Math.pow(1.5, attempt);
            console.warn(`[Jolpica] Network error for ${item.url}. Retrying in ${Math.round(backoff)}ms...`);
            await new Promise((r) => setTimeout(r, backoff));
          }
        }
      }
      item.reject(lastError ?? new Error(`Failed to fetch ${item.url}`));
    } finally {
      activeJolpicaCount--;
      processJolpicaQueue();
    }
  }, delay);
}

async function jolpicaFetch<T>(path: string, timeoutMs = 10000): Promise<T> {
  const [pathnameRaw, query] = path.split('?', 2);
  const pathname = pathnameRaw.endsWith('.json') ? pathnameRaw.slice(0, -5) : pathnameRaw;
  const url = `${BASE_URL}${pathname}.json${query ? `?${query}` : ''}`;
  const res = await enqueueJolpicaRequest(url, {}, 3, timeoutMs);

  if (!res.ok) {
    throw new Error(`Jolpica API error: ${res.status} — ${url}`);
  }

  const data = await res.json();
  return data as T;
}

// ── Cache-Aside Wrapper with Stampede & Negative Caching Protection ─────────

interface NegativeCacheSentinel {
  __negativeCache: true;
}

function isNegativeCacheSentinel(val: unknown): val is NegativeCacheSentinel {
  return (
    typeof val === 'object' &&
    val !== null &&
    '__negativeCache' in val &&
    (val as NegativeCacheSentinel).__negativeCache
  );
}

const inFlight = new Map<string, Promise<unknown>>();

type TTLResolver<T> = number | ((data: T) => number | Promise<number>);

async function cachedFetch<T>(
  key: string,
  ttl: TTLResolver<T>,
  fetcher: () => Promise<T>,
  negativeTtl = TTL.NEGATIVE_CACHE
): Promise<T> {
  const cached = await cache.get<T | NegativeCacheSentinel>(key);
  if (cached !== null && cached !== undefined) {
    if (isNegativeCacheSentinel(cached)) {
      console.log(`[Cache NEGATIVE HIT] ${key}`);
      return null as T;
    }
    console.log(`[Cache HIT] ${key}`);
    return cached as T;
  }

  console.log(`[Cache MISS] ${key}`);

  const existing = inFlight.get(key);
  if (existing) {
    console.log(`[Cache] Deduplicating in-flight request for key: ${key}`);
    return existing as Promise<T>;
  }

  const promise = fetcher()
    .then(async (fresh) => {
      // Negative caching protection: if fresh is null/undefined, store sentinel with negativeTtl
      if (fresh !== null && fresh !== undefined) {
        const computedTtl = typeof ttl === 'function' ? await ttl(fresh) : ttl;
        await cache.set(key, fresh, computedTtl);
      } else {
        const sentinel: NegativeCacheSentinel = { __negativeCache: true };
        await cache.set(key, sentinel, negativeTtl);
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

interface Driver2026Entry {
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber?: string;
  code?: string;
  constructorId: string;
  constructorName: string;
}

const DRIVER_2026_REGISTRY: Record<string, Driver2026Entry> = {
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

function lookupDriverRegistry(key: string): Driver2026Entry | undefined {
  return Object.prototype.hasOwnProperty.call(DRIVER_2026_REGISTRY, key) ? DRIVER_2026_REGISTRY[key] : undefined;
}

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
    // Lean fetching: 2 light calls to Jolpica
    const [driverRes, standingsRes] = await Promise.all([
      jolpicaFetch<JolpicaDriversResponse>(`/drivers/${id}`).catch(() => null),
      jolpicaFetch<JolpicaStandingsResponse>(`/drivers/${id}/driverStandings?limit=100`).catch(() => null),
    ]);

    let driver: Driver | undefined = driverRes?.MRData.DriverTable.Drivers[0];

    // Smart Fallback: if Jolpica is temporarily down or has no entry, use registry fallback
    const fallbackMeta = lookupDriverRegistry(id) ?? lookupDriverRegistry(rawId);
    if (!driver) {
      if (fallbackMeta) {
        driver = {
          driverId: id,
          permanentNumber: fallbackMeta.permanentNumber,
          code: fallbackMeta.code,
          url: `https://www.formula1.com/en/drivers/${id.replace(/_/g, '-')}`,
          givenName: fallbackMeta.givenName,
          familyName: fallbackMeta.familyName,
          dateOfBirth: '',
          nationality: fallbackMeta.nationality,
        };
      } else {
        return null;
      }
    }

    const validDriver: Driver = driver;

    // Fetch official stats safely with givenName to prevent surname collisions
    const officialStats = await getOfficialF1DriverStats(id, validDriver.givenName).catch(() => null);
    if (officialStats?.bio?.dateOfBirth && !validDriver.dateOfBirth) {
      validDriver.dateOfBirth = officialStats.bio.dateOfBirth;
    }

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
      const rookieFallbackMeta = lookupDriverRegistry(id) ?? lookupDriverRegistry(rawId);
      if (rookieFallbackMeta && officialStats?.season) {
        seasonHistory = [
          {
            season: officialStats.season.year ?? getCurrentSeason(),
            round: '1',
            position: officialStats.season.position || '—',
            points: officialStats.season.points || '0',
            wins: String(officialStats.season.gpWins || 0),
            constructors: [
              {
                constructorId: rookieFallbackMeta.constructorId,
                name: rookieFallbackMeta.constructorName,
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
      totalRaces: officialStats?.career?.grandsPrixEntered ?? 0,
    };

    return {
      driver: validDriver,
      careerStats,
      seasonHistory,
      officialStats,
    };
  });
}

// ── Constructor Registry & Profiles ──────────────────────────────────────────

interface ConstructorRegistryData extends ConstructorMeta {
  currentDrivers: string[];
  stats?: {
    championships: number;
    totalRaces: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps?: number;
  };
}

const CONSTRUCTOR_REGISTRY: Record<string, ConstructorRegistryData> = {
  ferrari: {
    fullName: 'Scuderia Ferrari HP',
    base: 'Maranello, Italy',
    teamPrincipal: 'Frédéric Vasseur',
    technicalChief: 'Loïc Serra',
    chassis: 'SF-26',
    powerUnit: 'Ferrari',
    firstEntry: 1950,
    worldChampionships: [1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008],
    currentDrivers: ['hamilton', 'leclerc'],
    stats: { championships: 16, totalRaces: 1135, wins: 251, podiums: 857, poles: 253, fastestLaps: 264 },
  },
  mclaren: {
    fullName: 'McLaren Formula 1 Team',
    base: 'Woking, United Kingdom',
    teamPrincipal: 'Andrea Stella',
    technicalChief: 'Peter Prodromou / Neil Houldey',
    chassis: 'MCL40',
    powerUnit: 'Mercedes',
    firstEntry: 1966,
    worldChampionships: [1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998, 2024],
    currentDrivers: ['norris', 'piastri'],
    stats: { championships: 10, totalRaces: 965, wins: 200, podiums: 547, poles: 178, fastestLaps: 178 },
  },
  mercedes: {
    fullName: 'Mercedes-AMG PETRONAS F1 Team',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Toto Wolff',
    technicalChief: 'James Allison',
    chassis: 'F1 W17',
    powerUnit: 'Mercedes',
    firstEntry: 1954,
    worldChampionships: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
    currentDrivers: ['russell', 'antonelli'],
    stats: { championships: 8, totalRaces: 352, wins: 139, podiums: 324, poles: 146, fastestLaps: 114 },
  },
  red_bull: {
    fullName: 'Oracle Red Bull Racing',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Christian Horner',
    technicalChief: 'Pierre Waché',
    chassis: 'RB22',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2005,
    worldChampionships: [2010, 2011, 2012, 2013, 2022, 2023],
    currentDrivers: ['max_verstappen', 'hadjar'],
    stats: { championships: 6, totalRaces: 429, wins: 130, podiums: 301, poles: 107, fastestLaps: 104 },
  },
  williams: {
    fullName: 'Williams Racing',
    base: 'Grove, United Kingdom',
    teamPrincipal: 'James Vowles',
    technicalChief: 'Pat Fry',
    chassis: 'FW48',
    powerUnit: 'Mercedes',
    firstEntry: 1978,
    worldChampionships: [1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997],
    currentDrivers: ['sainz', 'albon'],
    stats: { championships: 9, totalRaces: 878, wins: 114, podiums: 316, poles: 128, fastestLaps: 133 },
  },
  aston_martin: {
    fullName: 'Aston Martin Aramco F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Mike Krack',
    technicalChief: 'Dan Fallows',
    chassis: 'AMR26',
    powerUnit: 'Honda',
    firstEntry: 1959,
    worldChampionships: [],
    currentDrivers: ['alonso', 'stroll'],
    stats: { championships: 0, totalRaces: 115, wins: 0, podiums: 9, poles: 0, fastestLaps: 3 },
  },
  alpine: {
    fullName: 'BWT Alpine F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Oliver Oakes',
    technicalChief: 'David Sanchez',
    chassis: 'A526',
    powerUnit: 'Mercedes',
    firstEntry: 1986,
    worldChampionships: [2005, 2006],
    currentDrivers: ['gasly', 'colapinto'],
    stats: { championships: 2, totalRaces: 490, wins: 22, podiums: 108, poles: 20, fastestLaps: 15 },
  },
  haas: {
    fullName: 'MoneyGram Haas F1 Team',
    base: 'Kannapolis, United States',
    teamPrincipal: 'Ayao Komatsu',
    technicalChief: 'Andrea De Zordo',
    chassis: 'VF-26',
    powerUnit: 'Ferrari',
    firstEntry: 2016,
    worldChampionships: [],
    currentDrivers: ['bearman', 'ocon'],
    stats: { championships: 0, totalRaces: 208, wins: 0, podiums: 0, poles: 1, fastestLaps: 2 },
  },
  rb: {
    fullName: 'Visa Cash App RB Formula One Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Laurent Mekies',
    technicalChief: 'Jody Egginton',
    chassis: 'VCARB 03',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: ['lawson', 'arvid_lindblad'],
    stats: { championships: 0, totalRaces: 395, wins: 2, podiums: 5, poles: 1, fastestLaps: 4 },
  },
  racing_bulls: {
    fullName: 'Visa Cash App RB Formula One Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Laurent Mekies',
    technicalChief: 'Jody Egginton',
    chassis: 'VCARB 03',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: ['lawson', 'arvid_lindblad'],
    stats: { championships: 0, totalRaces: 395, wins: 2, podiums: 5, poles: 1, fastestLaps: 4 },
  },
  sauber: {
    fullName: 'Stake F1 Team Kick Sauber',
    base: 'Hinwil, Switzerland',
    teamPrincipal: 'Mattia Binotto',
    technicalChief: 'James Key',
    chassis: 'C46',
    powerUnit: 'Ferrari',
    firstEntry: 1993,
    worldChampionships: [],
    currentDrivers: ['hulkenberg', 'bortoleto'],
    stats: { championships: 0, totalRaces: 480, wins: 1, podiums: 27, poles: 1, fastestLaps: 7 },
  },
  audi: {
    fullName: 'Audi Revolut F1 Team',
    base: 'Neuburg, Germany / Hinwil, Switzerland',
    teamPrincipal: 'Mattia Binotto',
    technicalChief: 'James Key',
    chassis: 'R26',
    powerUnit: 'Audi',
    firstEntry: 2026,
    worldChampionships: [],
    currentDrivers: ['hulkenberg', 'bortoleto'],
    stats: { championships: 0, totalRaces: 0, wins: 0, podiums: 0, poles: 0 },
  },
  cadillac: {
    fullName: 'Cadillac Formula 1 Team',
    base: 'Fishers, Indiana, United States / Silverstone, UK',
    teamPrincipal: 'Graeme Lowdon',
    technicalChief: 'Nick Chester',
    chassis: 'CT-26',
    powerUnit: 'Ferrari',
    firstEntry: 2026,
    worldChampionships: [],
    currentDrivers: ['bottas', 'perez'],
    stats: { championships: 0, totalRaces: 0, wins: 0, podiums: 0, poles: 0 },
  },
  renault: {
    fullName: 'Renault F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Cyril Abiteboul',
    powerUnit: 'Renault',
    firstEntry: 1977,
    worldChampionships: [2005, 2006],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 403, wins: 35, podiums: 107, poles: 51, fastestLaps: 33 },
  },
  benetton: {
    fullName: 'Benetton Formula',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Flavio Briatore',
    powerUnit: 'Ford / Renault',
    firstEntry: 1986,
    worldChampionships: [1995],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 260, wins: 27, podiums: 102, poles: 15, fastestLaps: 36 },
  },
  brawn: {
    fullName: 'Brawn GP Formula One Team',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Ross Brawn',
    powerUnit: 'Mercedes',
    firstEntry: 2009,
    worldChampionships: [2009],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 17, wins: 8, podiums: 15, poles: 5, fastestLaps: 4 },
  },
  tyrrell: {
    fullName: 'Tyrrell Racing Organisation',
    base: 'Ockham, United Kingdom',
    teamPrincipal: 'Ken Tyrrell',
    powerUnit: 'Ford Cosworth / Yamaha',
    firstEntry: 1970,
    worldChampionships: [1971],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 430, wins: 23, podiums: 77, poles: 14, fastestLaps: 20 },
  },
  lotus: {
    fullName: 'Team Lotus',
    base: 'Hethel, United Kingdom',
    teamPrincipal: 'Colin Chapman',
    powerUnit: 'Climax / Ford Cosworth',
    firstEntry: 1958,
    worldChampionships: [1963, 1965, 1968, 1970, 1972, 1973, 1978],
    currentDrivers: [],
    stats: { championships: 7, totalRaces: 491, wins: 73, podiums: 171, poles: 107, fastestLaps: 65 },
  },
  team_lotus: {
    fullName: 'Team Lotus',
    base: 'Hethel, United Kingdom',
    teamPrincipal: 'Colin Chapman',
    powerUnit: 'Climax / Ford Cosworth',
    firstEntry: 1958,
    worldChampionships: [1963, 1965, 1968, 1970, 1972, 1973, 1978],
    currentDrivers: [],
    stats: { championships: 7, totalRaces: 491, wins: 73, podiums: 171, poles: 107, fastestLaps: 65 },
  },
  lotus_f1: {
    fullName: 'Lotus F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Eric Boullier',
    powerUnit: 'Renault / Mercedes',
    firstEntry: 2012,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 77, wins: 2, podiums: 25, poles: 0, fastestLaps: 5 },
  },
  jordan: {
    fullName: 'Jordan Grand Prix',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Eddie Jordan',
    powerUnit: 'Ford / Mugen-Honda',
    firstEntry: 1991,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 250, wins: 4, podiums: 19, poles: 2, fastestLaps: 2 },
  },
  toro_rosso: {
    fullName: 'Scuderia Toro Rosso',
    base: 'Faenza, Italy',
    teamPrincipal: 'Franz Tost',
    powerUnit: 'Honda / Ferrari',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 268, wins: 1, podiums: 3, poles: 1, fastestLaps: 1 },
  },
  alphatauri: {
    fullName: 'Scuderia AlphaTauri',
    base: 'Faenza, Italy',
    teamPrincipal: 'Franz Tost',
    powerUnit: 'Honda / Red Bull Powertrains',
    firstEntry: 2020,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 83, wins: 1, podiums: 2, poles: 0, fastestLaps: 2 },
  },
  force_india: {
    fullName: 'Sahara Force India F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Vijay Mallya / Otmar Szafnauer',
    powerUnit: 'Mercedes',
    firstEntry: 2008,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 212, wins: 0, podiums: 6, poles: 1, fastestLaps: 5 },
  },
  racing_point: {
    fullName: 'Racing Point F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Otmar Szafnauer',
    powerUnit: 'BWT Mercedes',
    firstEntry: 2018,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 47, wins: 1, podiums: 4, poles: 1, fastestLaps: 0 },
  },
  alfa: {
    fullName: 'Alfa Romeo F1 Team Stake',
    base: 'Hinwil, Switzerland',
    teamPrincipal: 'Alessandro Alunni Bravi',
    powerUnit: 'Ferrari',
    firstEntry: 1950,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 214, wins: 10, podiums: 26, poles: 12, fastestLaps: 16 },
  },
  brabham: {
    fullName: 'Motor Racing Developments (Brabham)',
    base: 'Chessington, United Kingdom',
    teamPrincipal: 'Jack Brabham / Bernie Ecclestone',
    powerUnit: 'Repco / Ford Cosworth / BMW',
    firstEntry: 1962,
    worldChampionships: [1966, 1967],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 394, wins: 35, podiums: 124, poles: 39, fastestLaps: 41 },
  },
  matra: {
    fullName: 'Equipe Matra Sports',
    base: 'Vélizy-Villacoublay, France',
    teamPrincipal: 'Ken Tyrrell / Jean-Luc Lagardère',
    powerUnit: 'Ford Cosworth / Matra',
    firstEntry: 1967,
    worldChampionships: [1969],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 125, wins: 9, podiums: 21, poles: 4, fastestLaps: 12 },
  },
  cooper: {
    fullName: 'Cooper Car Company',
    base: 'Surbiton, United Kingdom',
    teamPrincipal: 'John Cooper',
    powerUnit: 'Climax / Maserati',
    firstEntry: 1950,
    worldChampionships: [1959, 1960],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 129, wins: 16, podiums: 58, poles: 11, fastestLaps: 14 },
  },
  brm: {
    fullName: 'British Racing Motors (BRM)',
    base: 'Bourne, United Kingdom',
    teamPrincipal: 'Raymond Mays / Louis Stanley',
    powerUnit: 'BRM',
    firstEntry: 1951,
    worldChampionships: [1962],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 197, wins: 17, podiums: 61, poles: 11, fastestLaps: 15 },
  },
  minardi: {
    fullName: 'Minardi F1 Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Gian Carlo Minardi / Paul Stoddart',
    powerUnit: 'Cosworth / Ford',
    firstEntry: 1985,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 340, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  prost: {
    fullName: 'Prost Grand Prix',
    base: 'Guyancourt, France',
    teamPrincipal: 'Alain Prost',
    powerUnit: 'Mugen-Honda / Peugeot / Acer',
    firstEntry: 1997,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 83, wins: 0, podiums: 3, poles: 0, fastestLaps: 0 },
  },
  stewart: {
    fullName: 'Stewart Grand Prix',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Jackie Stewart / Paul Stewart',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1997,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 49, wins: 1, podiums: 5, poles: 1, fastestLaps: 0 },
  },
  toyota: {
    fullName: 'Panasonic Toyota Racing',
    base: 'Cologne, Germany',
    teamPrincipal: 'Ove Andersson / John Howett',
    powerUnit: 'Toyota',
    firstEntry: 2002,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 139, wins: 0, podiums: 13, poles: 3, fastestLaps: 3 },
  },
  bmw_sauber: {
    fullName: 'BMW Sauber F1 Team',
    base: 'Hinwil, Switzerland / Munich, Germany',
    teamPrincipal: 'Mario Theissen',
    powerUnit: 'BMW',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 70, wins: 1, podiums: 17, poles: 1, fastestLaps: 2 },
  },
};

function lookupConstructorRegistry(key: string): ConstructorRegistryData | undefined {
  return Object.prototype.hasOwnProperty.call(CONSTRUCTOR_REGISTRY, key) ? CONSTRUCTOR_REGISTRY[key] : undefined;
}

export async function getSeasonConstructors(season?: string | number): Promise<Constructor[]> {
  const s = season ? String(season) : getCurrentSeason();
  const cacheKey = `f1:constructors:${s}`;

  return cachedFetch(cacheKey, TTL.SCHEDULE_PAST, async () => {
    const data = await jolpicaFetch<JolpicaConstructorsResponse>(`/${s}/constructors.json?limit=100`);
    const constructors = data.MRData.ConstructorTable.Constructors ?? [];

    // Ensure season has debut/newly registered constructors if not yet in Jolpica API
    const currentYearNum = Number(s);
    const existingIds = new Set(constructors.map((c) => c.constructorId));
    for (const [id, meta] of Object.entries(CONSTRUCTOR_REGISTRY)) {
      if (!existingIds.has(id) && meta.firstEntry === currentYearNum) {
        constructors.push({
          constructorId: id,
          name: meta.fullName,
          nationality: meta.base.includes('Italy')
            ? 'Italian'
            : meta.base.includes('United States')
            ? 'American'
            : meta.base.includes('Germany')
            ? 'German'
            : meta.base.includes('France')
            ? 'French'
            : meta.base.includes('Japan')
            ? 'Japanese'
            : meta.base.includes('Switzerland')
            ? 'Swiss'
            : 'British',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(meta.fullName)}`,
        });
      }
    }

    return constructors;
  });
}

const inFlightConstructorProfiles = new Map<string, Promise<ConstructorProfile | null>>();

export async function getConstructorProfile(constructorId: string): Promise<ConstructorProfile | null> {
  const rawId = constructorId.trim().toLowerCase();
  const idMap: Record<string, string> = {
    redbull: 'red_bull',
    'red-bull': 'red_bull',
    redbullracing: 'red_bull',
    racingbulls: 'rb',
    'racing-bulls': 'rb',
    racing_bulls: 'rb',
    astonmartin: 'aston_martin',
    'aston-martin': 'aston_martin',
    'kick-sauber': 'sauber',
    'kick_sauber': 'sauber',
    kicksauber: 'sauber',
    'alfa-romeo': 'alfa',
    'alfaromeo': 'alfa',
    alfa_romeo: 'alfa',
    'team-lotus': 'lotus',
    'team_lotus': 'lotus',
    'lotus-f1': 'lotus_f1',
    'force-india': 'force_india',
    forceindia: 'force_india',
    'racing-point': 'racing_point',
    racingpoint: 'racing_point',
    'toro-rosso': 'toro_rosso',
    tororosso: 'toro_rosso',
    'bmw-sauber': 'bmw_sauber',
    bmwsauber: 'bmw_sauber',
  };
  const id = idMap[rawId] ?? rawId;
  const cacheKey = `f1:constructor:profile:${id}`;

  const registryEntry = lookupConstructorRegistry(id) ?? lookupConstructorRegistry(rawId);
  const isDebutTeam = registryEntry?.firstEntry === 2026;

  // Check cache first with sanity validation (established teams must have >0 races)
  const cached = await cache.get<ConstructorProfile | NegativeCacheSentinel>(cacheKey);
  if (cached !== null && cached !== undefined) {
    if (isNegativeCacheSentinel(cached)) {
      console.log(`[Cache NEGATIVE HIT] ${cacheKey}`);
      return null;
    }
    if (isDebutTeam || registryEntry === undefined || (cached.stats && cached.stats.totalRaces > 0)) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached;
    }
    console.log(`[Cache STALE/INVALID] ${cacheKey} had 0 races for established team, refreshing...`);
  }

  // Deduplicate concurrent in-flight requests for the same constructor
  const inFlight = inFlightConstructorProfiles.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      // Lean requests via throttled queue + official F1 scraper
      const [constructorRes, driversRes, seasonsRes, racesRes, p1Res, p2Res, p3Res, officialDetails] = await Promise.all([
        jolpicaFetch<JolpicaConstructorsResponse>(`/constructors/${id}.json`).catch(() => null),
        jolpicaFetch<JolpicaDriversResponse>(`/constructors/${id}/drivers.json?limit=100`).catch(() => null),
        jolpicaFetch<JolpicaSeasonsResponse>(`/constructors/${id}/seasons.json?limit=100`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/races.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/1.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/2.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/3.json?limit=1`).catch(() => null),
        getOfficialF1TeamDetails(id).catch(() => null),
      ]);

      let constructorEntity: Constructor | undefined = constructorRes?.MRData.ConstructorTable.Constructors[0];

      if (!constructorEntity) {
        if (registryEntry) {
          constructorEntity = {
            constructorId: id,
            name: registryEntry.fullName,
            nationality: registryEntry.base.includes('Italy')
              ? 'Italian'
              : registryEntry.base.includes('United States')
              ? 'American'
              : registryEntry.base.includes('Germany')
              ? 'German'
              : registryEntry.base.includes('France')
              ? 'French'
              : registryEntry.base.includes('Japan')
              ? 'Japanese'
              : registryEntry.base.includes('Switzerland')
              ? 'Swiss'
              : 'British',
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(registryEntry.fullName)}`,
          };
        } else {
          const sentinel: NegativeCacheSentinel = { __negativeCache: true };
          await cache.set(cacheKey, sentinel, TTL.NEGATIVE_CACHE);
          return null;
        }
      }

      const validConstructor: Constructor = constructorEntity;

      // Aggregate drivers list
      const rawDrivers = driversRes?.MRData.DriverTable.Drivers ?? [];
      const historicalDrivers: ConstructorDriverHistory[] = rawDrivers.map((d) => ({
        driverId: d.driverId,
        givenName: d.givenName,
        familyName: d.familyName,
        code: d.code,
        permanentNumber: d.permanentNumber,
        nationality: d.nationality,
      }));

      // Current drivers from registry / 2026 grid
      const currentDriverIds = registryEntry?.currentDrivers ?? [];
      const currentDrivers: ConstructorDriverHistory[] = currentDriverIds.map((driverKey) => {
        const foundHistorical = historicalDrivers.find((h) => h.driverId === driverKey);
        if (foundHistorical) return foundHistorical;
        const driverFallback = lookupDriverRegistry(driverKey);
        return {
          driverId: driverKey,
          givenName: driverFallback?.givenName ?? driverKey,
          familyName: driverFallback?.familyName ?? '',
          code: driverFallback?.code,
          permanentNumber: driverFallback?.permanentNumber,
          nationality: driverFallback?.nationality ?? 'International',
        };
      });

      // Ensure current drivers are also in historical list
      for (const cd of currentDrivers) {
        if (!historicalDrivers.some((h) => h.driverId === cd.driverId)) {
          historicalDrivers.unshift(cd);
        }
      }

      const fallbackStats = registryEntry?.stats;
      const jolpicaRaces = parseInt(racesRes?.MRData.total ?? '0', 10);
      const jolpicaWins = parseInt(p1Res?.MRData.total ?? '0', 10);
      const p2Count = parseInt(p2Res?.MRData.total ?? '0', 10);
      const p3Count = parseInt(p3Res?.MRData.total ?? '0', 10);
      const jolpicaPodiums = jolpicaWins + p2Count + p3Count;

      // Use higher of live Jolpica count, official F1 details, and verified registry baseline
      const totalRaces = Math.max(jolpicaRaces, fallbackStats?.totalRaces ?? 0);
      const wins = Math.max(jolpicaWins, fallbackStats?.wins ?? 0);
      const podiums = Math.max(jolpicaPodiums, fallbackStats?.podiums ?? 0);
      const poles = Math.max(officialDetails?.polePositions ?? 0, fallbackStats?.poles ?? 0);
      const fastestLaps = Math.max(officialDetails?.fastestLaps ?? 0, fallbackStats?.fastestLaps ?? 0);
      const championships = Math.max(
        officialDetails?.worldChampionships ?? 0,
        registryEntry?.worldChampionships?.length ?? 0,
        fallbackStats?.championships ?? 0
      );

      const seasonsCount = parseInt(
        seasonsRes?.MRData.total ??
          (registryEntry?.firstEntry ? String(Number(getCurrentSeason()) - registryEntry.firstEntry + 1) : '1'),
        10
      );

      const stats: ConstructorCareerStats = {
        championships,
        totalRaces,
        wins,
        podiums,
        poles,
        fastestLaps,
      };

      const meta: ConstructorMeta = {
        fullName: officialDetails?.fullName ?? registryEntry?.fullName ?? validConstructor.name,
        base: officialDetails?.base ?? registryEntry?.base ?? 'United Kingdom',
        teamPrincipal: officialDetails?.teamPrincipal ?? registryEntry?.teamPrincipal ?? 'Team Leadership',
        technicalChief: officialDetails?.technicalChief ?? registryEntry?.technicalChief,
        chassis: officialDetails?.chassis ?? registryEntry?.chassis,
        powerUnit: officialDetails?.powerUnit ?? registryEntry?.powerUnit,
        firstEntry: officialDetails?.firstEntry ?? registryEntry?.firstEntry,
        worldChampionships: registryEntry?.worldChampionships ?? [],
      };

      const result: ConstructorProfile = {
        constructor: validConstructor,
        meta,
        stats,
        currentDrivers,
        historicalDrivers,
        seasonsCount,
        officialDetails,
      };

      await cache.set(cacheKey, result, TTL.CONSTRUCTOR_PROFILE);
      return result;
    } finally {
      inFlightConstructorProfiles.delete(cacheKey);
    }
  })();

  inFlightConstructorProfiles.set(cacheKey, promise);
  return promise;
}

// ── Pit Stops ─────────────────────────────────────────────────────────────────

/**
 * Returns all pit stops for a given race round.
 *
 * Data is fetched from Jolpica /{season}/{round}/pitstops.json with limit=100
 * (covers the theoretical maximum of ~50 stops in a 20-car race).
 * Results are cached for 24 h because pit stop records are immutable once a race ends.
 * Returns null when pit stop data is unavailable (pre-2012 races, future races,
 * or Jolpica lookup failure), which triggers a 5-min negative-cache sentinel.
 */
export async function getRacePitStops(
  season: string | number,
  round: string | number
): Promise<PitStopEntry[] | null> {
  const s = String(season);
  const r = String(round);
  const cacheKey = `f1:race:pitstops:${s}:${r}`;

  return cachedFetch<PitStopEntry[] | null>(
    cacheKey,
    async (data) => {
      if (!data || data.length === 0) return TTL.NEGATIVE_CACHE;
      // Past seasons are immutable -> 24h
      if (s !== getCurrentSeason()) return TTL.PIT_STOPS;

      // For current season, check if the race has official results completed
      const race = await getRaceResult(s, r).catch(() => null);
      const isCompleted =
        race &&
        'Results' in race &&
        Array.isArray(race.Results) &&
        race.Results.length > 0;

      return isCompleted ? TTL.PIT_STOPS : (isRaceWeekend() ? 60 : 300);
    },
    async () => {
      const res = await jolpicaFetch<JolpicaPitStopsResponse>(
        `/${s}/${r}/pitstops?limit=100`
      );

      const pitStops = res?.MRData.RaceTable.Races[0]?.PitStops;
      if (!pitStops || pitStops.length === 0) return null;

      // Sort chronologically: by lap number first, then by time-of-day string
      return [...pitStops].sort((a, b) => {
        const lapDiff = parseInt(a.lap, 10) - parseInt(b.lap, 10);
        if (lapDiff !== 0) return lapDiff;
        return a.time.localeCompare(b.time);
      });
    },
    TTL.NEGATIVE_CACHE
  );
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