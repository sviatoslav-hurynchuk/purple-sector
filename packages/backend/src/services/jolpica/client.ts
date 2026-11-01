import { cache } from '../cache';

export const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

export function getCurrentSeason(): string {
  return new Date().getFullYear().toString();
}

// ── Dynamic Race Weekend TTL Helpers ─────────────────────────────────────────

export function isRaceWeekend(now = new Date()): boolean {
  const day = now.getUTCDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
  return day === 0 || day === 5 || day === 6;
}

export function getNextRaceTTL(): number {
  return isRaceWeekend() ? 20 : 60; // 20s during race weekend vs 60s mid-week
}

export function getStandingsTTL(): number {
  return isRaceWeekend() ? 60 : 5 * 60; // 60s during race weekend vs 5min mid-week
}

export function getUpcomingRaceTTL(): number {
  return isRaceWeekend() ? 60 : 5 * 60; // 60s during race weekend vs 5min mid-week
}

export const TTL = {
  SCHEDULE_CURRENT: 6 * 60 * 60,   // 6 hours
  SCHEDULE_PAST: 24 * 60 * 60,     // 24 hours
  RACE_WITH_RESULTS: 24 * 60 * 60, // 24 hours (immutable data)
  PIT_STOPS: 24 * 60 * 60,         // 24 hours (immutable once race finishes)
  LAPS: 24 * 60 * 60,              // 24 hours (immutable once race finishes)
  H2H: 24 * 60 * 60,               // 24 hours for completed season H2H
  NEGATIVE_CACHE: 5 * 60,          // 5 minutes for non-existent races
  CONSTRUCTOR_PROFILE: 5 * 60,     // 5 minutes for constructor profiles
} as const;

// ── Jolpica API Response Schema Definitions ──────────────────────────────────

export interface JolpicaResponse<TableKey extends string, TableType> {
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

export async function jolpicaFetch<T>(path: string, timeoutMs = 10000): Promise<T> {
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

/**
 * Executes an async mapper function over an array with limited concurrency.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Cache-Aside Wrapper with Stampede & Negative Caching Protection ─────────

export interface NegativeCacheSentinel {
  __negativeCache: true;
}

export function isNegativeCacheSentinel(val: unknown): val is NegativeCacheSentinel {
  return (
    typeof val === 'object' &&
    val !== null &&
    '__negativeCache' in val &&
    (val as NegativeCacheSentinel).__negativeCache
  );
}

const inFlight = new Map<string, Promise<unknown>>();

export type TTLResolver<T> = number | ((data: T) => number | Promise<number>);

export interface CachedFetchOptions<T> {
  negativeTtl?: number;
  validate?: (data: T) => boolean;
}

export async function cachedFetch<T>(
  key: string,
  ttl: TTLResolver<T>,
  fetcher: () => Promise<T>,
  optionsOrNegativeTtl: number | CachedFetchOptions<T> = TTL.NEGATIVE_CACHE
): Promise<T> {
  const options: CachedFetchOptions<T> =
    typeof optionsOrNegativeTtl === 'number'
      ? { negativeTtl: optionsOrNegativeTtl }
      : optionsOrNegativeTtl;
  const negativeTtl = options.negativeTtl ?? TTL.NEGATIVE_CACHE;
  const validator = options.validate;

  const cached = await cache.get<T | NegativeCacheSentinel>(key);
  if (cached !== null && cached !== undefined) {
    if (isNegativeCacheSentinel(cached)) {
      console.log(`[Cache NEGATIVE HIT] ${key}`);
      return null as T;
    }
    if (validator && !validator(cached as T)) {
      console.log(`[Cache INVALID HIT] ${key} failed validation, re-fetching...`);
      await cache.del(key).catch(() => {});
    } else {
      console.log(`[Cache HIT] ${key}`);
      return cached as T;
    }
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
        if (validator && !validator(fresh)) {
          console.warn(`[Cache] Fresh data for ${key} failed integrity validation, skipping cache storage.`);
          inFlight.delete(key);
          return fresh;
        }

        const computedTtl = typeof ttl === 'function' ? await ttl(fresh) : ttl;
        await cache.set(key, fresh, computedTtl);
      } else if (negativeTtl > 0) {
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
