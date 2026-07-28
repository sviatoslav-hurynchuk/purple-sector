import { Redis } from '@upstash/redis';

interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRatioPercentage: string;
}

interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(pattern?: string): Promise<number>;
  isConnected(): boolean;
  getStats(): CacheStats;
}

abstract class BaseCacheService implements ICacheService {
  protected hits = 0;
  protected misses = 0;

  abstract get<T>(key: string): Promise<T | null>;
  abstract set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract flush(pattern?: string): Promise<number>;
  abstract isConnected(): boolean;

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const ratio = total > 0 ? ((this.hits / total) * 100).toFixed(1) : '0.0';

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRatioPercentage: `${ratio}%`,
    };
  }
}

// ── In-Memory Fallback ────────────────────────────────────────────────────────

class MemoryCacheService extends BaseCacheService {
  private store = new Map<string, { json: string; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return JSON.parse(entry.json) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      json: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async flush(pattern?: string): Promise<number> {
    if (!pattern || pattern === '*') {
      const count = this.store.size;
      this.store.clear();
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
    try {
      const raw = await this.client.get<CacheEntry<T>>(key);
      if (!raw) {
        this.misses++;
        return null;
      }
      this.hits++;
      return raw.data;
    } catch (err) {
      console.warn('[Cache] Redis GET failed:', err instanceof Error ? err.message : err);
      this.misses++;
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
};
