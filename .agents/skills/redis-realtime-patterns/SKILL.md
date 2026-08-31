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
| `f1:session:<id>:snapshot` | String (JSON) | 5s | Current aggregate live session state |
| `f1:session:<id>:intervals` | String (JSON) | 3s | Latest grid gap & interval matrix |
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
- Critical, low-volume events must NEVER be lost due to client disconnects or socket reconnection:
  1. **Pit Stop Entries & Exits** (`f1:session:<id>:stream:pit_stops`)
  2. **Race Control Messages** (Safety Car, VSC, Red Flag, Investigation, Penalties) (`f1:session:<id>:stream:race_control`)
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
