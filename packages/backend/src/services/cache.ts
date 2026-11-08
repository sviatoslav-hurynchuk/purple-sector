import { Redis } from '@upstash/redis';

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
export interface SwrOptions {
  /** Duration in seconds that data is considered 100% fresh (e.g. 60s). */
  softTtlSeconds: number;
  /** Maximum retention duration in seconds before hard eviction in Redis/Memory (e.g. 86400s). */
  hardTtlSeconds: number;
  /** Mutex lock duration for background revalidation to prevent thundering herd (defaults to 30s). */
  lockTtlSeconds?: number;
  /** Whether to cache null or undefined results (defaults to false to prevent caching 404s/transient errors). */
  cacheNull?: boolean;
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
  swr<T>(key: string, fetcher: () => Promise<T>, options: SwrOptions): Promise<SwrResult<T>>;
  acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
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
  abstract del(key: string): Promise<void>;
  abstract flush(pattern?: string): Promise<number>;
  abstract isConnected(): boolean;
  abstract acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
  abstract releaseLock(key: string): Promise<void>;
  abstract getEntry<T>(key: string): Promise<CacheEntry<T> | null>;
  abstract setSwr(key: string, value: unknown, options: SwrOptions): Promise<void>;

  /**
   * Stale-While-Revalidate pattern implementation.
   * Delivers zero cold-start latency by instantly returning stale data while asynchronously
   * revalidating in the background under singleflight mutex protection.
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: SwrOptions
  ): Promise<SwrResult<T>> {
    const entry = await this.getEntry<T>(key);
    const now = Date.now();

    if (entry) {
      const softTtl = (entry.softTtl ?? entry.ttl) * 1000;
      const hardTtl = (entry.hardTtl ?? entry.ttl) * 1000;
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
      const freshData = await fetcher();
      if ((freshData !== null && freshData !== undefined) || options.cacheNull) {
        await this.setSwr(key, freshData, options);
      }
      return freshData;
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
    options: SwrOptions
  ): void {
    const lockTtl = options.lockTtlSeconds ?? 30;

    (async () => {
      const acquired = await this.acquireLock(key, lockTtl);
      if (!acquired) {
        return; // Another worker or request is actively revalidating this key
      }

      this.revalidationsTriggered++;
      try {
        const freshData = await fetcher();
        if ((freshData !== null && freshData !== undefined) || options.cacheNull) {
          await this.setSwr(key, freshData, options);
        }
      } catch (err) {
        console.warn(
          `[Cache:SWR] Background revalidation failed for "${key}":`,
          err instanceof Error ? err.message : err
        );
      } finally {
        await this.releaseLock(key).catch(() => {});
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
  private locks = new Map<string, number>();

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.getEntry<T>(key);
    if (!entry) return null;
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

  async setSwr(key: string, value: unknown, options: SwrOptions): Promise<void> {
    const entry: CacheEntry = {
      data: value,
      cachedAt: Date.now(),
      ttl: options.hardTtlSeconds,
      softTtl: options.softTtlSeconds,
      hardTtl: options.hardTtlSeconds,
    };
    this.store.set(key, {
      json: JSON.stringify(entry),
      expiresAt: Date.now() + options.hardTtlSeconds * 1000,
    });
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    if (existing && existing > now) {
      return false;
    }
    this.locks.set(key, now + ttlSeconds * 1000);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    this.locks.delete(key);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.locks.delete(key);
  }

  async flush(pattern?: string): Promise<number> {
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

  async ping(timeoutMs = 3000): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Redis ping timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const result = await Promise.race([this.client.ping(), timeoutPromise]);
      this.connected = result === 'PONG';
      return this.connected;
    } catch (err) {
      console.warn('[Cache] Redis ping failed:', err instanceof Error ? err.message : err);
      this.connected = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = await this.getEntry<T>(key);
    if (!entry) return null;
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

  async setSwr(key: string, value: unknown, options: SwrOptions): Promise<void> {
    try {
      const entry: CacheEntry = {
        data: value,
        cachedAt: Date.now(),
        ttl: options.hardTtlSeconds,
        softTtl: options.softTtlSeconds,
        hardTtl: options.hardTtlSeconds,
      };
      await this.client.set(key, entry, { ex: options.hardTtlSeconds });
    } catch (err) {
      console.warn('[Cache] Redis SET SWR failed:', err instanceof Error ? err.message : err);
    }
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const lockKey = `f1:lock:revalidate:${key}`;
      const res = await this.client.set(lockKey, '1', { nx: true, ex: ttlSeconds });
      return res === 'OK';
    } catch (err) {
      console.warn('[Cache] Redis lock acquire failed:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    try {
      const lockKey = `f1:lock:revalidate:${key}`;
      await this.client.del(lockKey);
    } catch (err) {
      console.warn('[Cache] Redis lock release failed:', err instanceof Error ? err.message : err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn('[Cache] Redis DEL failed:', err instanceof Error ? err.message : err);
    }
  }

  async flush(pattern?: string): Promise<number> {
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
    console.log('[Cache] No Upstash credentials found — using in-memory fallback');
    return;
  }

  const redisService = new RedisCacheService(url, token);
  const ok = await redisService.ping();

  if (ok) {
    cacheInstance = redisService;
    console.log('[Cache] Connected to Upstash Redis');
  } else {
    console.warn('[Cache] Failed to connect to Upstash Redis — using in-memory fallback');
  }
}

export const cache: ICacheService = {
  get<T>(key: string) {
    return cacheInstance.get<T>(key);
  },
  set(key: string, value: unknown, ttlSeconds: number) {
    return cacheInstance.set(key, value, ttlSeconds);
  },
  del(key: string) {
    return cacheInstance.del(key);
  },
  flush(pattern?: string) {
    return cacheInstance.flush(pattern);
  },
  isConnected() {
    return cacheInstance.isConnected();
  },
  getStats() {
    return cacheInstance.getStats();
  },
  swr<T>(key: string, fetcher: () => Promise<T>, options: SwrOptions) {
    return cacheInstance.swr<T>(key, fetcher, options);
  },
  acquireLock(key: string, ttlSeconds: number) {
    return cacheInstance.acquireLock(key, ttlSeconds);
  },
  releaseLock(key: string) {
    return cacheInstance.releaseLock(key);
  },
};
