import type {
  RaceSessionData,
  TireStint,
  RaceEvent,
  WeatherSnapshot,
  LapSectorTiming,
  PitStopDetail,
  TeamRadioClip,
} from '../types/f1';
import type {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Stint,
  OpenF1RaceControl,
  OpenF1Weather,
  OpenF1Pit,
  OpenF1TeamRadio,
} from '../types/openf1-types';
import { cache } from './cache';
import { getRaceSchedule } from './jolpica';
import {
  mapStints,
  mapRaceControlEvents,
  mapWeather,
  mapLapSectorTimings,
  mapPitStops,
  mapTeamRadio,
} from './openf1-mapper';

const BASE_URL = process.env.OPENF1_BASE_URL ?? 'https://api.openf1.org/v1';

const TTL = {
  SESSIONS_CURRENT: 6 * 60 * 60,   // 6 hours
  SESSIONS_PAST: 24 * 60 * 60,     // 24 hours
  ENRICHED_RACE: 24 * 60 * 60,     // 24 hours (immutable once race is done)
  NEGATIVE_CACHE: 5 * 60,          // 5 minutes
} as const;

// ── OpenF1 Throttled Request Queue (3 req/sec limit) ─────────────────────────

interface OpenF1QueueItem {
  url: string;
  options: RequestInit;
  retries: number;
  timeoutMs: number;
  resolve: (res: Response) => void;
  reject: (err: unknown) => void;
}

const OPENF1_QUEUE: OpenF1QueueItem[] = [];
let activeOpenF1Count = 0;
const MAX_OPENF1_CONCURRENCY = 2;
const MIN_OPENF1_INTERVAL_MS = 350; // Max ~2.85 req/sec (safe under 3 req/sec limit)
const MAX_OPENF1_QUEUE_CAPACITY = 200;
let nextScheduledOpenF1Time = 0;

function enqueueOpenF1Request(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 12000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (OPENF1_QUEUE.length >= MAX_OPENF1_QUEUE_CAPACITY) {
      reject(new Error(`OpenF1 request queue is full (${MAX_OPENF1_QUEUE_CAPACITY} pending). Server overloaded.`));
      return;
    }
    OPENF1_QUEUE.push({ url, options, retries, timeoutMs, resolve, reject });
    processOpenF1Queue();
  });
}

function processOpenF1Queue(): void {
  if (OPENF1_QUEUE.length === 0 || activeOpenF1Count >= MAX_OPENF1_CONCURRENCY) return;

  const now = Date.now();
  const scheduledTime = Math.max(now, nextScheduledOpenF1Time);
  nextScheduledOpenF1Time = scheduledTime + MIN_OPENF1_INTERVAL_MS;
  const delay = Math.max(0, scheduledTime - now);

  const item = OPENF1_QUEUE.shift();
  if (!item) return;

  activeOpenF1Count++;

  setTimeout(async () => {
    try {
      let lastError: unknown;
      for (let attempt = 0; attempt <= item.retries; attempt++) {
        try {
          const signal = AbortSignal.timeout(item.timeoutMs);
          const res = await fetch(item.url, { ...item.options, signal });

          if ((res.status === 429 || res.status >= 500) && attempt < item.retries) {
            await res.body?.cancel().catch(() => {});
            const backoff = 1000 * Math.pow(1.8, attempt) + Math.random() * 300;
            console.warn(
              `[OpenF1] HTTP ${res.status} for ${item.url}. Backing off ${Math.round(backoff)}ms (attempt ${attempt + 1}/${item.retries})...`
            );
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }

          item.resolve(res);
          return;
        } catch (err) {
          lastError = err;
          if (attempt < item.retries) {
            const backoff = 1000 * Math.pow(1.8, attempt);
            console.warn(`[OpenF1] Network error for ${item.url}. Retrying in ${Math.round(backoff)}ms...`);
            await new Promise((r) => setTimeout(r, backoff));
          }
        }
      }
      item.reject(lastError ?? new Error(`Failed to fetch ${item.url}`));
    } finally {
      activeOpenF1Count--;
      processOpenF1Queue();
    }
  }, delay);
}

// ── Generic OpenF1 Fetch Helper ──────────────────────────────────────────────

export async function openF1Fetch<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  timeoutMs = 12000
): Promise<T[]> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const queryParts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (key.endsWith('>=') || key.endsWith('<=') || key.endsWith('>') || key.endsWith('<')) {
        queryParts.push(`${key}${encodeURIComponent(String(value))}`);
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
  }

  const queryString = queryParts.join('&');
  const url = `${BASE_URL}${cleanEndpoint}${queryString ? `?${queryString}` : ''}`;
  const res = await enqueueOpenF1Request(url, {}, 3, timeoutMs);

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`OpenF1 API error: ${res.status} — ${url}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

// ── Cache-Aside Wrapper with Stampede & Negative Caching ──────────────────────

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

async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
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
      if (fresh !== null && fresh !== undefined) {
        await cache.set(key, fresh, ttlSeconds);
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

// ── Session Resolver: (season, round) -> sessionKey ─────────────────────────

export interface ResolvedSessionMeta {
  sessionKey: number;
  meetingKey: number;
  sessionName: string;
  circuitShortName: string;
  countryName: string;
  dateStart: string;
}

/**
 * Resolves OpenF1 session_key and meeting_key for a given (season, round).
 * OpenF1 has data for seasons >= 2023.
 */
export async function resolveSessionKey(
  season: string | number,
  round: string | number,
  sessionType = 'Race'
): Promise<ResolvedSessionMeta | null> {
  const year = parseInt(String(season), 10);
  const rNum = parseInt(String(round), 10);

  if (isNaN(year) || year < 2023 || isNaN(rNum) || rNum < 1) {
    return null;
  }

  const cacheKey = `f1:openf1:session_map:v2:${year}:${rNum}:${sessionType.toLowerCase()}`;

  return cachedFetch<ResolvedSessionMeta | null>(cacheKey, TTL.SESSIONS_PAST, async () => {
    // 1. Fetch Jolpica schedule to find target race name, date and circuit details
    const schedule = await getRaceSchedule(year).catch(() => []);
    const targetJolpicaRace = schedule.find((r) => parseInt(r.round, 10) === rNum);

    // 2. Fetch all OpenF1 sessions for this year
    const sessions = await openF1Fetch<OpenF1Session>('/sessions', { year });
    if (!sessions || sessions.length === 0) return null;

    // Filter sessions by strict name ('Race', 'Sprint', 'Qualifying')
    const typeMatchingSessions = sessions
      .filter((s) => {
        const name = (s.session_name ?? '').toLowerCase();
        const type = (s.session_type ?? '').toLowerCase();
        const target = sessionType.toLowerCase();

        if (target === 'race') {
          return name === 'race';
        }
        if (target === 'sprint') {
          return name === 'sprint';
        }
        if (target === 'qualifying') {
          return name.includes('qualifying');
        }
        return name === target || type === target;
      })
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

    if (typeMatchingSessions.length === 0) return null;

    let matchedSession: OpenF1Session | undefined;

    // Correlate with Jolpica schedule (date / circuit / country)
    if (targetJolpicaRace) {
      const jDate = targetJolpicaRace.date; // e.g. "2026-07-05"
      const jCircuit = targetJolpicaRace.Circuit.circuitName.toLowerCase();
      const jLoc = targetJolpicaRace.Circuit.Location.locality.toLowerCase();
      const jCountry = targetJolpicaRace.Circuit.Location.country.toLowerCase();

      // 1. Exact date match (highest confidence)
      if (jDate) {
        matchedSession = typeMatchingSessions.find((s) => s.date_start?.startsWith(jDate));
      }

      // 2. Circuit or locality match
      if (!matchedSession) {
        matchedSession = typeMatchingSessions.find((s) => {
          const sCircuit = (s.circuit_short_name ?? '').toLowerCase();
          const sLoc = (s.location ?? '').toLowerCase();
          return (sCircuit && jCircuit.includes(sCircuit)) || (sLoc && jLoc.includes(sLoc));
        });
      }

      // 3. Country match (only when unambiguous; many seasons have multiple rounds in Italy, USA, etc.)
      if (!matchedSession) {
        const countryCandidates = typeMatchingSessions.filter((s) => {
          const sCountry = (s.country_name ?? '').toLowerCase();
          return sCountry && jCountry.includes(sCountry);
        });
        if (countryCandidates.length === 1) {
          matchedSession = countryCandidates[0];
        }
      }
    }

    // Fallback: round index match (round 1 = index 0)
    if (!matchedSession) {
      matchedSession = typeMatchingSessions[rNum - 1];
    }

    if (!matchedSession) return null;

    return {
      sessionKey: matchedSession.session_key,
      meetingKey: matchedSession.meeting_key,
      sessionName: matchedSession.session_name,
      circuitShortName: matchedSession.circuit_short_name,
      countryName: matchedSession.country_name,
      dateStart: matchedSession.date_start,
    };
  });
}

// ── Driver Identification & Number Mapping ───────────────────────────────────

const FALLBACK_NUMBER_TO_DRIVER_ID: Record<number, string> = {
  1: 'max_verstappen',
  11: 'perez',
  44: 'hamilton',
  63: 'russell',
  16: 'leclerc',
  55: 'sainz',
  4: 'norris',
  81: 'piastri',
  14: 'alonso',
  18: 'stroll',
  10: 'gasly',
  31: 'ocon',
  23: 'albon',
  2: 'sargeant',
  43: 'colapinto',
  3: 'ricciardo',
  22: 'tsunoda',
  30: 'lawson',
  77: 'bottas',
  24: 'zhou',
  27: 'hulkenberg',
  20: 'magnussen',
  38: 'bearman',
  87: 'bearman',
  12: 'antonelli',
  6: 'hadjar',
  5: 'bortoleto',
  41: 'arvid_lindblad',
};

const DRIVER_SLUGS_BY_CODE: Record<string, string> = {
  NOR: 'norris',
  VER: 'max_verstappen',
  HAM: 'hamilton',
  RUS: 'russell',
  LEC: 'leclerc',
  SAI: 'sainz',
  PIA: 'piastri',
  ANT: 'antonelli',
  ALO: 'alonso',
  STR: 'stroll',
  GAS: 'gasly',
  OCO: 'ocon',
  ALB: 'albon',
  TSU: 'tsunoda',
  LAW: 'lawson',
  BOT: 'bottas',
  ZHO: 'zhou',
  HUL: 'hulkenberg',
  MAG: 'magnussen',
  BEA: 'bearman',
  HAD: 'hadjar',
  BOR: 'bortoleto',
  COL: 'colapinto',
  PER: 'perez',
  RIC: 'ricciardo',
  SAR: 'sargeant',
  LIN: 'arvid_lindblad',
  DEV: 'de_vries',
};

/**
 * Builds a Map of OpenF1 driver_number -> Jolpica driverId slug.
 * Caches as a plain JSON-serializable record (Map is not serializable).
 */
export async function buildDriverMap(sessionKey: number): Promise<Map<number, string>> {
  const cacheKey = `f1:openf1:driver_map:v3:${sessionKey}`;

  const record = await cachedFetch<Record<string, string>>(cacheKey, TTL.SESSIONS_PAST, async () => {
    const result: Record<string, string> = {};

    // 1. First, populate from live OpenF1 session drivers (takes precedence)
    const openF1Drivers = await openF1Fetch<OpenF1Driver>('/drivers', { session_key: sessionKey }).catch(() => []);

    for (const d of openF1Drivers) {
      if (d.driver_number) {
        const codeUpper = d.name_acronym ? d.name_acronym.toUpperCase() : undefined;
        const slugByCode = codeUpper ? DRIVER_SLUGS_BY_CODE[codeUpper] : undefined;
        const lastNameLower = d.last_name ? d.last_name.toLowerCase() : undefined;
        const fallbackSlug = FALLBACK_NUMBER_TO_DRIVER_ID[d.driver_number];
        const derivedSlug = d.last_name ? `${d.first_name || ''}_${d.last_name}`.toLowerCase().replace(/\s+/g, '_') : undefined;

        // Priority resolution:
        // 1. Acronym (100% robust across car number changes, e.g. Norris #4 -> #1)
        // 2. Exact match in DRIVER_SLUGS_BY_CODE by surname
        // 3. Fallback number match if surname matches fallback slug
        // 4. Canonical surname
        // 5. Fallback number
        const resolvedSlug =
          slugByCode ||
          (lastNameLower && DRIVER_SLUGS_BY_CODE[lastNameLower.toUpperCase()]) ||
          (fallbackSlug && lastNameLower && fallbackSlug.includes(lastNameLower) ? fallbackSlug : undefined) ||
          lastNameLower ||
          fallbackSlug ||
          derivedSlug ||
          `driver_${d.driver_number}`;

        result[String(d.driver_number)] = resolvedSlug;
      }
    }

    // 2. Fill remaining numbers from the fallback registry (only for numbers not reported by OpenF1)
    for (const [numStr, slug] of Object.entries(FALLBACK_NUMBER_TO_DRIVER_ID)) {
      if (!(numStr in result)) {
        result[numStr] = slug;
      }
    }

    return result;
  });

  // Reconstruct Map from the cached plain record
  const map = new Map<number, string>();
  for (const [numStr, slug] of Object.entries(record)) {
    map.set(parseInt(numStr, 10), slug);
  }
  return map;
}

// ── Raw Data Getters ─────────────────────────────────────────────────────────

export async function getOpenF1Sessions(year: number): Promise<OpenF1Session[]> {
  const cacheKey = `f1:openf1:sessions:${year}`;
  const isCurrent = year === new Date().getFullYear();
  const ttl = isCurrent ? TTL.SESSIONS_CURRENT : TTL.SESSIONS_PAST;

  return cachedFetch<OpenF1Session[]>(cacheKey, ttl, () =>
    openF1Fetch<OpenF1Session>('/sessions', { year })
  );
}

export async function getOpenF1Drivers(sessionKey: number): Promise<OpenF1Driver[]> {
  const cacheKey = `f1:openf1:drivers:${sessionKey}`;
  return cachedFetch<OpenF1Driver[]>(cacheKey, TTL.SESSIONS_PAST, () =>
    openF1Fetch<OpenF1Driver>('/drivers', { session_key: sessionKey })
  );
}

export async function getOpenF1Stints(sessionKey: number): Promise<OpenF1Stint[]> {
  const cacheKey = `f1:openf1:stints:${sessionKey}`;
  return cachedFetch<OpenF1Stint[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1Stint>('/stints', { session_key: sessionKey })
  );
}

export async function getOpenF1RaceControlEvents(sessionKey: number): Promise<OpenF1RaceControl[]> {
  const cacheKey = `f1:openf1:race_control:${sessionKey}`;
  return cachedFetch<OpenF1RaceControl[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1RaceControl>('/race_control', { session_key: sessionKey })
  );
}

export async function getOpenF1Weather(sessionKey: number): Promise<OpenF1Weather[]> {
  const cacheKey = `f1:openf1:weather:${sessionKey}`;
  return cachedFetch<OpenF1Weather[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1Weather>('/weather', { session_key: sessionKey })
  );
}

export async function getOpenF1Laps(sessionKey: number, driverNumber?: number): Promise<OpenF1Lap[]> {
  const cacheKey = driverNumber
    ? `f1:openf1:laps:${sessionKey}:${driverNumber}`
    : `f1:openf1:laps:${sessionKey}:all`;

  return cachedFetch<OpenF1Lap[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1Lap>('/laps', { session_key: sessionKey, driver_number: driverNumber })
  );
}

export async function getOpenF1Pit(sessionKey: number): Promise<OpenF1Pit[]> {
  const cacheKey = `f1:openf1:pit:${sessionKey}`;
  return cachedFetch<OpenF1Pit[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1Pit>('/pit', { session_key: sessionKey })
  );
}

export async function getOpenF1TeamRadio(sessionKey: number, driverNumber?: number): Promise<OpenF1TeamRadio[]> {
  const cacheKey = driverNumber
    ? `f1:openf1:team_radio:${sessionKey}:${driverNumber}`
    : `f1:openf1:team_radio:${sessionKey}:all`;

  return cachedFetch<OpenF1TeamRadio[]>(cacheKey, TTL.ENRICHED_RACE, () =>
    openF1Fetch<OpenF1TeamRadio>('/team_radio', { session_key: sessionKey, driver_number: driverNumber })
  );
}

// ── Race Session Data Orchestrator ───────────────────────────────────────────

/**
 * Returns complete race session dataset (stints, race control, weather, laps, pits, radio)
 * for a completed Grand Prix (2023+).
 * Returns null if before 2023 or session cannot be resolved.
 */
export async function getRaceSessionData(
  season: string | number,
  round: string | number
): Promise<RaceSessionData | null> {
  const s = String(season);
  const r = String(round);
  const year = parseInt(s, 10);

  // OpenF1 only covers 2023 onwards
  if (isNaN(year) || year < 2023) {
    return null;
  }

  const cacheKey = `f1:openf1:session_data:v7:${s}:${r}`;

  return cachedFetch<RaceSessionData | null>(cacheKey, TTL.ENRICHED_RACE, async () => {
    // 1. Resolve OpenF1 session_key
    const sessionMeta = await resolveSessionKey(s, r, 'Race');
    if (!sessionMeta) return null;

    const { sessionKey, meetingKey } = sessionMeta;

    // 2. Fetch driver map and raw OpenF1 data in parallel via throttled queue
    const [
      driverMap,
      rawStints,
      rawRaceControl,
      rawWeather,
      rawLaps,
      rawPits,
      rawRadio,
    ] = await Promise.all([
      buildDriverMap(sessionKey),
      getOpenF1Stints(sessionKey).catch(() => []),
      getOpenF1RaceControlEvents(sessionKey).catch(() => []),
      getOpenF1Weather(sessionKey).catch(() => []),
      getOpenF1Laps(sessionKey).catch(() => []),
      getOpenF1Pit(sessionKey).catch(() => []),
      getOpenF1TeamRadio(sessionKey).catch(() => []),
    ]);

    // 3. Map all data via pure transformation mappers
    const stints: TireStint[] = mapStints(rawStints, driverMap);
    const raceControlEvents: RaceEvent[] = mapRaceControlEvents(rawRaceControl, rawLaps);
    const weather: WeatherSnapshot[] = mapWeather(rawWeather);
    const laps: LapSectorTiming[] = mapLapSectorTimings(rawLaps, driverMap);
    const pitStops: PitStopDetail[] = mapPitStops(rawPits, driverMap);
    const teamRadio: TeamRadioClip[] = mapTeamRadio(rawRadio, driverMap);

    return {
      sessionKey,
      meetingKey,
      season: s,
      round: r,
      stints,
      raceControlEvents,
      weather,
      laps,
      pitStops,
      teamRadio,
    };
  });
}
