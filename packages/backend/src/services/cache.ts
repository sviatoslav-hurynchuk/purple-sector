import { Redis } from '@upstash/redis';
import { CACHE_LOCK } from '../constants/cache';

/**
 * Cache entry with optional Soft and Hard TTL for Stale-While-Revalidate (SWR) support.
 */
interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  ttl: number;
  softTtl?: number;
  hardTtl?: number;
}

/**
 * SWR caching options defining fresh duration and stale grace period.
 */
export interface SwrOptions<T = unknown> {
  /** Duration in seconds that data is considered 100% fresh (e.g. 60s), or dynamic resolver. */
  softTtlSeconds: number | ((data: T) => number);
  /** Maximum retention duration in seconds before hard eviction in Redis/Memory (e.g. 86400s), or dynamic resolver. */
  hardTtlSeconds: number | ((data: T) => number);
  /** Mutex lock duration for background revalidation to prevent thundering herd (defaults to 30s). */
  lockTtlSeconds?: number;
  /** Whether to cache null or undefined results (defaults to false to prevent caching 404s/transient errors). */
  cacheNull?: boolean;
  /** Optional predicate to determine whether the returned data is complete and suitable for SWR caching. */
  shouldCache?: (data: T) => boolean;
  /** When true, an authoritative null result retires (deletes) the stale cache entry instead of preserving it. */
  retireOnNull?: boolean;
}

/** Cache lookup outcome status. */
export type CacheStatus = 'HIT' | 'STALE' | 'MISS';

/** Result returned by the SWR caching wrapper. */
export interface SwrResult<T> {
  data: T;
  status: CacheStatus;
  ageSeconds: number;
}

/**
 * Operational telemetry metrics for cache hits, misses, and SWR revalidations.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  revalidationsTriggered: number;
  singleflightCoalesced: number;
  total: number;
  hitRatioPercentage: string;
}

/**
 * Unified interface for backend cache service.
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(pattern?: string): Promise<number>;
  isConnected(): boolean;
  getStats(): CacheStats;

  /**
   * Stale-While-Revalidate (SWR) executor with background revalidation and singleflight deduplication.
   */
  swr<T>(key: string, fetcher: () => Promise<T>, options: SwrOptions<T>): Promise<SwrResult<T>>;
  acquireLock(key: string, ttlSeconds: number, ownerToken?: string): Promise<string | null>;
  releaseLock(key: string, ownerToken?: string): Promise<boolean>;
}

/**
 * In-memory singleflight coordinator to coalesce concurrent requests for the exact same key.
 */
class Singleflight {
  private inFlight = new Map<string, Promise<unknown>>();

  async do<T>(key: string, fn: () => Promise<T>): Promise<{ result: T; coalesced: boolean }> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      const result = await existing;
      return { result, coalesced: true };
    }

    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    const result = await promise;
    return { result, coalesced: false };
  }
}

/**
 * Base abstract cache service with common SWR logic and metric calculations.
 */
abstract class BaseCacheService implements ICacheService {
  protected hits = 0;
  protected misses = 0;
  protected staleHits = 0;
  protected revalidationsTriggered = 0;
  protected singleflightCoalesced = 0;
  protected singleflight = new Singleflight();

  abstract get<T>(key: string): Promise<T | null>;
  abstract set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  abstract isConnected(): boolean;
  abstract acquireLock(key: string, ttlSeconds: number, ownerToken?: string): Promise<string | null>;
  abstract releaseLock(key: string, ownerToken?: string): Promise<boolean>;
  abstract getEntry<T>(key: string): Promise<CacheEntry<T> | null>;
  abstract setSwr<T>(key: string, value: T, options: SwrOptions<T>): Promise<void>;

  protected abstract delDirect(key: string): Promise<void>;
  protected abstract flushDirect(pattern?: string): Promise<number>;

  /**
   * Coordinated cache deletion: when invalidating a core service key, also invalidate its SWR route counterpart.
   */
  async del(key: string): Promise<void> {
    if (key === 'f1:next-race') {
      await this.delDirect('f1:swr:races:next').catch(() => {});
    } else if (key.startsWith('f1:schedule:')) {
      const season = key.replace('f1:schedule:', '');
      await this.delDirect(`f1:swr:races:schedule:${season}`).catch(() => {});
    }
    await this.delDirect(key);
  }

  /**
   * Coordinated pattern flush: also cleans corresponding SWR counterpart namespaces.
   */
  async flush(pattern?: string): Promise<number> {
    let count = await this.flushDirect(pattern);
    if (pattern === 'f1:schedule:*' || pattern === 'f1:schedule*') {
      count += await this.flushDirect('f1:swr:races:schedule:*');
    }
    return count;
  }

  /**
   * Stale-While-Revalidate pattern implementation.
   * Delivers zero cold-start latency by instantly returning stale data while asynchronously
   * revalidating in the background under singleflight mutex protection.
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: SwrOptions<T>
  ): Promise<SwrResult<T>> {
    const entry = await this.getEntry<T>(key);
    const now = Date.now();

    if (entry) {
      const softTtlSec =
        typeof options.softTtlSeconds === 'function'
          ? options.softTtlSeconds(entry.data)
          : (entry.softTtl ?? entry.ttl);
      const hardTtlSec =
        typeof options.hardTtlSeconds === 'function'
          ? options.hardTtlSeconds(entry.data)
          : (entry.hardTtl ?? entry.ttl);

      const softTtl = softTtlSec * 1000;
      const hardTtl = hardTtlSec * 1000;
      const ageMs = Math.max(0, now - entry.cachedAt);
      const ageSeconds = Math.floor(ageMs / 1000);

      // Case 1: Fresh Cache HIT
      if (ageMs < softTtl) {
        this.hits++;
        return { data: entry.data, status: 'HIT', ageSeconds };
      }

      // Case 2: Stale Cache HIT (serve instantly, revalidate asynchronously)
      if (ageMs < hardTtl) {
        this.staleHits++;
        this.triggerBackgroundRevalidation(key, fetcher, options);
        return { data: entry.data, status: 'STALE', ageSeconds };
      }
    }

    // Case 3: Cache MISS (un-cached or expired past hard TTL)
    this.misses++;
    const { result, coalesced } = await this.singleflight.do<T>(key, async () => {
      // Coordinate across distributed instances via lock
      const lockKey = `miss:${key}`;
      const lockToken = await this.acquireLock(lockKey, CACHE_LOCK.MISS_LOCK_TTL_SECONDS);
      if (!lockToken) {
        // Another instance is fetching this key right now; wait briefly and check cache
        for (let attempt = 0; attempt < CACHE_LOCK.MISS_RETRIES; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, CACHE_LOCK.MISS_BACKOFF_MS));
          const existing = await this.getEntry<T>(key);
          if (existing) {
            return existing.data;
          }
        }
      }

      try {
        const freshData = await fetcher();
        const canCache =
          (options.shouldCache ? options.shouldCache(freshData) : true) &&
          ((freshData !== null && freshData !== undefined) || options.cacheNull);

        if (canCache) {
          await this.setSwr(key, freshData, options);
        }
        return freshData;
      } finally {
        if (lockToken) {
          await this.releaseLock(lockKey, lockToken).catch(() => {});
        }
      }
    });

    if (coalesced) {
      this.singleflightCoalesced++;
    }

    return { data: result, status: 'MISS', ageSeconds: 0 };
  }

  /**
   * Asynchronously triggers background revalidation under a distributed/in-memory lock.
   */
  protected triggerBackgroundRevalidation<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: SwrOptions<T>
  ): void {
    const lockTtl = options.lockTtlSeconds ?? CACHE_LOCK.DEFAULT_TTL_SECONDS;

    (async () => {
      const lockToken = await this.acquireLock(key, lockTtl);
      if (!lockToken) {
        return; // Another worker or request is actively revalidating this key
      }

      this.revalidationsTriggered++;
      try {
        // Coordinate revalidation with foreground fetches using the shared Singleflight map
        await this.singleflight.do(key, async () => {
          const freshData = await fetcher();

          // If authoritative null returned for next-race or retireOnNull, delete stale entry
          if (freshData === null && (options.retireOnNull || key === 'f1:swr:races:next')) {
            await this.del(key);
            return freshData;
          }

          const canCache =
            (options.shouldCache ? options.shouldCache(freshData) : true) &&
            ((freshData !== null && freshData !== undefined) || options.cacheNull);

          if (canCache) {
            await this.setSwr(key, freshData, options);
          }
          return freshData;
        });
      } catch (err) {
        console.warn(
          `[Cache:SWR] Background revalidation failed for "${key}":`,
          err instanceof Error ? err.message : err
        );
      } finally {
        await this.releaseLock(key, lockToken).catch(() => {});
      }
    })().catch((err) => {
      console.error(`[Cache:SWR] Unhandled background revalidation error for "${key}":`, err);
    });
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses + this.staleHits;
    const ratio = total > 0 ? (((this.hits + this.staleHits) / total) * 100).toFixed(1) : '0.0';

    return {
      hits: this.hits,
      misses: this.misses,
      staleHits: this.staleHits,
      revalidationsTriggered: this.revalidationsTriggered,
      singleflightCoalesced: this.singleflightCoalesced,
      total,
      hitRatioPercentage: `${ratio}%`,
    };
  }
}

// ── In-Memory Fallback ────────────────────────────────────────────────────────

class MemoryCacheService extends BaseCacheService {
  private store = new Map<string, { json: string; expiresAt: number }>();
  private locks = new Map<string, { token: string; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.getEntry<T>(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.json) as CacheEntry<T>;
    } catch {
      this.store.delete(key);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const entry: CacheEntry = {
      data: value,
      cachedAt: Date.now(),
      ttl: ttlSeconds,
    };
    this.store.set(key, {
      json: JSON.stringify(entry),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async setSwr<T>(key: string, value: T, options: SwrOptions<T>): Promise<void> {
    const softTtl =
      typeof options.softTtlSeconds === 'function'
        ? options.softTtlSeconds(value)
        : options.softTtlSeconds;
    const hardTtl =
      typeof options.hardTtlSeconds === 'function'
        ? options.hardTtlSeconds(value)
        : options.hardTtlSeconds;

    const entry: CacheEntry<T> = {
      data: value,
      cachedAt: Date.now(),
      ttl: hardTtl,
      softTtl,
      hardTtl,
    };
    this.store.set(key, {
      json: JSON.stringify(entry),
      expiresAt: Date.now() + hardTtl * 1000,
    });
  }

  async acquireLock(key: string, ttlSeconds: number, ownerToken?: string): Promise<string | null> {
    const now = Date.now();
    const token = ownerToken ?? `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > now) {
      return null;
    }
    this.locks.set(key, { token, expiresAt: now + ttlSeconds * 1000 });
    return token;
  }

  async releaseLock(key: string, ownerToken?: string): Promise<boolean> {
    const existing = this.locks.get(key);
    if (!existing) return true;
    if (!ownerToken || existing.token === ownerToken) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }

  protected async delDirect(key: string): Promise<void> {
    this.store.delete(key);
    this.locks.delete(key);
  }

  protected async flushDirect(pattern?: string): Promise<number> {
    if (!pattern || pattern === '*') {
      const count = this.store.size;
      this.store.clear();
      this.locks.clear();
      return count;
    }

    const prefix = pattern.replace('*', '');
    let deletedCount = 0;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  isConnected(): boolean {
    return true;
  }
}

// ── Upstash Redis Service ─────────────────────────────────────────────────────

class RedisCacheService extends BaseCacheService {
  private client: Redis;
  private connected = false;

  constructor(url: string, token: string) {
    super();
    this.client = new Redis({ url, token });
  }

  async ping(timeoutMs = CACHE_LOCK.REDIS_PING_TIMEOUT_MS): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), timeoutMs)
      );
      const res = await Promise.race([this.client.ping(), timeoutPromise]);
      this.connected = res === 'PONG';
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.getEntry<T>(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const raw = await this.client.get<CacheEntry<T>>(key);
      if (!raw) {
        return null;
      }
      return raw;
    } catch (err) {
      console.warn('[Cache] Redis GET failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const entry: CacheEntry = {
        data: value,
        cachedAt: Date.now(),
        ttl: ttlSeconds,
      };
      await this.client.set(key, entry, { ex: ttlSeconds });
    } catch (err) {
      console.warn('[Cache] Redis SET failed:', err instanceof Error ? err.message : err);
    }
  }

  async setSwr<T>(key: string, value: T, options: SwrOptions<T>): Promise<void> {
    try {
      const softTtl =
        typeof options.softTtlSeconds === 'function'
          ? options.softTtlSeconds(value)
          : options.softTtlSeconds;
      const hardTtl =
        typeof options.hardTtlSeconds === 'function'
          ? options.hardTtlSeconds(value)
          : options.hardTtlSeconds;

      const entry: CacheEntry<T> = {
        data: value,
        cachedAt: Date.now(),
        ttl: hardTtl,
        softTtl,
        hardTtl,
      };
      await this.client.set(key, entry, { ex: hardTtl });
    } catch (err) {
      console.warn('[Cache] Redis SET SWR failed:', err instanceof Error ? err.message : err);
    }
  }

  async acquireLock(key: string, ttlSeconds: number, ownerToken?: string): Promise<string | null> {
    const token = ownerToken ?? `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    try {
      const lockKey = `f1:lock:revalidate:${key}`;
      const res = await this.client.set(lockKey, token, { nx: true, ex: ttlSeconds });
      return res === 'OK' ? token : null;
    } catch (err) {
      console.warn('[Cache] Redis lock acquire failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  async releaseLock(key: string, ownerToken?: string): Promise<boolean> {
    try {
      const lockKey = `f1:lock:revalidate:${key}`;
      if (!ownerToken) {
        await this.client.del(lockKey);
        return true;
      }
      const lua = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const res = await this.client.eval(lua, [lockKey], [ownerToken]);
      return res === 1;
    } catch (err) {
      console.warn('[Cache] Redis lock release failed:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  protected async delDirect(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn('[Cache] Redis DEL failed:', err instanceof Error ? err.message : err);
    }
  }

  protected async flushDirect(pattern?: string): Promise<number> {
    try {
      const queryPattern = pattern ?? 'f1:*';
      const keys = await this.client.keys(queryPattern);

      if (!keys || keys.length === 0) {
        return 0;
      }

      await this.client.del(...keys);
      return keys.length;
    } catch (err) {
      console.warn('[Cache] Redis FLUSH failed:', err instanceof Error ? err.message : err);
      return 0;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

let cacheInstance: BaseCacheService = new MemoryCacheService();

export async function connectRedis(): Promise<void> {
  const url = process.env['UPSTASH_REDIS_REST_URL'];
  const token = process.env['UPSTASH_REDIS_REST_TOKEN'];

  if (!url || !token) {
    console.log('[Cache] No Redis credentials found. Running in-memory cache.');
    cacheInstance = new MemoryCacheService();
    return;
  }

  try {
    const redisService = new RedisCacheService(url, token);
    const ok = await redisService.ping();

    if (ok) {
      console.log('[Cache] Upstash Redis connected successfully.');
      cacheInstance = redisService;
    } else {
      console.warn('[Cache] Upstash Redis ping failed. Falling back to in-memory cache.');
      cacheInstance = new MemoryCacheService();
    }
  } catch (err) {
    console.warn(
      '[Cache] Failed to connect to Redis. Falling back to in-memory cache:',
      err instanceof Error ? err.message : err
    );
    cacheInstance = new MemoryCacheService();
  }
}

/** Proxy object delegating calls dynamically to active cacheInstance */
export const cache: ICacheService = {
  get: <T>(key: string) => cacheInstance.get<T>(key),
  set: (key: string, value: unknown, ttlSeconds: number) => cacheInstance.set(key, value, ttlSeconds),
  del: (key: string) => cacheInstance.del(key),
  flush: (pattern?: string) => cacheInstance.flush(pattern),
  isConnected: () => cacheInstance.isConnected(),
  getStats: () => cacheInstance.getStats(),
  swr: <T>(key: string, fetcher: () => Promise<T>, options: SwrOptions<T>) =>
    cacheInstance.swr(key, fetcher, options),
  acquireLock: (key: string, ttlSeconds: number, ownerToken?: string) =>
    cacheInstance.acquireLock(key, ttlSeconds, ownerToken),
  releaseLock: (key: string, ownerToken?: string) => cacheInstance.releaseLock(key, ownerToken),
};
