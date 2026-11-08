---
name: redis-realtime-patterns
description: Architecture guide and runbook for Redis caching, Pub/Sub channels, Redis Streams for critical event delivery, and key namespacing in real-time F1 timing applications.
---

# Redis Realtime Patterns & Event Streaming

This skill provides architectural guidelines and operational patterns for real-time sports telemetry, live timing feeds, and state caching using Redis (Upstash Redis REST & local in-memory fallback).

---

## 1. Key Namespacing Standard

Always structure Redis keys using hierarchical delimiters (`:`) to enable granular queries, wildcard pattern subscriptions (`PSUBSCRIBE`), and clean flush patterns.

| Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `f1:schedule:<season>` | String (JSON) | 6h (current) / 24h (past) | Full season calendar |
| `f1:race:<season>:<round>` | String (JSON) | 24h (done) / 60s (live) | Race session details & results |
| `f1:race:laps:<season>:<round>` | String (JSON) | 24h (immutable) | Complete lap-by-lap timing matrix |
| `f1:race:pitstops:<season>:<round>` | String (JSON) | 24h (immutable) | Pit stop sequence |
| `f1:session:<id>:snapshot` | String (JSON) | 10s | Current aggregate live session state |
| `f1:session:<id>:intervals` | String (JSON) | 5s | Latest grid gap & interval matrix |
| `f1:session:<id>:telemetry:<driver>` | String (JSON) | 10s | Last telemetry packet for specific car |
| `f1:session:<id>:stream:pit_stops` | Stream (XADD) | MaxLen 500 (~24h) | Durable stream of pit stop events |
| `f1:session:<id>:stream:race_control` | Stream (XADD) | MaxLen 500 (~24h) | Durable stream of flags, SC, penalties |

---

## 2. Ephemeral Pub/Sub vs. Durable Streams

### A. Ephemeral Telemetry & Intervals → Pub/Sub
- High frequency (~3.7 Hz per car, 20 cars = ~74 Hz total).
- Dropped frames during network jitter are acceptable since newer packets immediately supersede older ones.
- **Channel Pattern**: `f1:session:<sessionId>:telemetry:<driverNumber>`
- **Grid-Wide Listener**: `PSUBSCRIBE f1:session:9159:telemetry:*`
- **Single Driver Listener**: `SUBSCRIBE f1:session:9159:telemetry:1`

### B. Critical Race Events → Redis Streams (`XADD` / `XREAD`)
- Critical, low-volume events must not be dropped due to temporary client disconnects:
  1. **Pit Stop Entries & Exits** (`f1:session:<id>:stream:pit_stops`)
  2. **Race Control Messages** (Safety Car, VSC, Red Flag, Investigation, Penalties) (`f1:session:<id>:stream:race_control`)
- **Stream Trimming & Replay Window**: `MAXLEN ~ 500` trims oldest entries. If a reconnecting client's `lastEventId` is older than the oldest retained ID (stream gap), fallback to fetching the complete snapshot via `GET f1:session:<id>:snapshot` or REST API to resynchronize state before resuming `XREAD`.
- **Producer (Ingestion Worker)**:
  ```typescript
  // Append new event to stream with approximate trimming
  await redis.xadd(
    `f1:session:${sessionKey}:stream:race_control`,
    'MAXLEN', '~', 500,
    '*',
    'type', event.type,
    'message', event.message,
    'flag', event.flag ?? '',
    'lap', String(event.lap),
    'date', event.date
  );
  ```
- **Consumer Reconnection**:
  - When a frontend client reconnects, it passes its `lastEventId`.
  - Server reads with `XREAD STREAMS key lastEventId` to catch up on any missed flags or pit stops without missing historical transitions.

---

## 3. Centralized Ingestion Cache (Rate Limit Shield)

**Never allow frontend clients to directly trigger upstream API calls.**

```
[OpenF1 API] (3 req/sec limit)
      │
      ▼ (Throttled Background Ingestion Loop)
[Backend Express Ingestion Engine]
      │
      ▼ (Atomic State Write)
[Redis Cache & Streams]
      │
      ▼ (High-Throughput Read / SSE / WebSockets)
[Thousands of Connected Frontend Users]
```

- **Ingestion Worker**: Runs at a fixed rate (e.g. 1 poll every 3–4 seconds).
- **Graceful Fallback**: If Redis is unreachable, fallback to `MemoryCacheService` + Node.js `EventEmitter`.

---

## 4. Stale-While-Revalidate (SWR) & Thundering Herd Shielding

High-concurrency sports telemetry applications cannot afford cold-start latency or cache stampedes that overwhelm rate-limited upstream providers (OpenF1 3 req/sec limit). The platform deploys an enterprise-grade SWR layer:

### A. Dual TTL Model (`softTtl` vs `hardTtl`)
- **Soft TTL**: Period during which cached data is fresh (e.g. 60s). Returned immediately (`<3ms`) with `X-Cache-Status: HIT`.
- **Hard TTL**: Retention window in Redis (e.g. 24h to 7 days). Stale data (`softTtl <= age < hardTtl`) is served **instantly** (`<3ms`) with `X-Cache-Status: STALE`, while asynchronous revalidation fires in the background.
- **Eviction**: Expired beyond `hardTtl` triggers synchronous fetch with `X-Cache-Status: MISS`.

### B. In-Memory Singleflight Promise Coalescing
Prevents cache stampedes when a key is missing or hard-expired:
```typescript
class Singleflight {
  private inFlight = new Map<string, Promise<unknown>>();

  async do<T>(key: string, fn: () => Promise<T>): Promise<{ result: T; coalesced: boolean }> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return { result: await existing, coalesced: true };

    const promise = fn().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return { result: await promise, coalesced: false };
  }
}
```

### C. Distributed Mutex Lock for Background Revalidation
When hundreds of concurrent requests hit stale data, only **one** background worker should query upstream:
- Atomic lock acquisition: `SET f1:lock:revalidate:<key> 1 NX EX <ttlSeconds>`.
- If lock is denied, the duplicate revalidation is dropped cleanly while the user still receives valid stale data.
- Lock is released upon completion (`DEL f1:lock:revalidate:<key>`).

### D. Autonomous Background Cache Refresher (`CacheRefresherService`)
Continuously warms top-tier routes (`/next`, standings, schedule, active race) in an autonomous timer loop:
- **Race Weekend Interval**: 35 seconds (matches dynamic session rhythm).
- **Mid-week Interval**: 180 seconds.
- Multi-instance deduplication via `service:cache-refresher:lock`.
- Ensures zero cold starts for frontend users visiting the homepage or opening the race recap modal.
