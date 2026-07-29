# Purple Sector

Interactive Formula 1 data platform with real-time standings, race calendars, circuit details, and session results. Built as a monorepo with an Express backend acting as a caching proxy to the Jolpica F1 API and a Next.js frontend rendering server-side pages.

> Purple Sector is an unofficial project and is not affiliated with Formula 1 companies.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Backend | Express.js, TypeScript | 4.x, 5.x |
| Frontend | Next.js (App Router), React, TypeScript | 16.x, 19.x |
| Caching | Upstash Redis (serverless) + in-memory fallback | REST API |
| UI | Tailwind CSS v4, shadcn/ui, Lucide Icons | — |
| Package Manager | pnpm workspaces (monorepo) | 11.x |
| External APIs | [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) (historical), [OpenF1 API](https://api.openf1.org/v1/) (live, planned) | — |

---

## Project Structure

```text
f1-data-demo/
├── packages/
│   ├── backend/                        # Express API server (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts                # Server entry point, Redis init, cache warming
│   │   │   ├── middleware/
│   │   │   │   └── errorHandler.ts     # Centralized error handler
│   │   │   ├── routes/
│   │   │   │   ├── admin.ts            # Protected cache invalidation / warming endpoints
│   │   │   │   ├── races.ts            # Race schedule, results, next race
│   │   │   │   └── standings.ts        # Driver and constructor standings
│   │   │   ├── services/
│   │   │   │   ├── cache.ts            # Cache service (Upstash Redis + in-memory fallback)
│   │   │   │   ├── jolpica.ts          # Jolpica F1 API client with cache-aside pattern
│   │   │   │   └── openf1.ts           # OpenF1 API client (reserved for live data)
│   │   │   └── types/
│   │   │       └── f1.ts               # Shared F1 type definitions
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                       # Next.js application (port 3000)
│       ├── app/
│       │   ├── layout.tsx              # Root layout with navigation
│       │   ├── error.tsx               # Global error boundary
│       │   ├── global-error.tsx        # Root error boundary
│       │   └── (main)/                 # Route group with shared layout
│       │       ├── page.tsx            # Dashboard (next race, standings overview)
│       │       ├── calendar/
│       │       │   ├── page.tsx        # Season race calendar
│       │       │   └── [round]/
│       │       │       └── page.tsx    # Race detail (results, circuit info)
│       │       └── standings/
│       │           └── page.tsx        # Championship standings tables
│       ├── components/
│       │   ├── f1/                     # Domain-specific components
│       │   │   ├── circuit-details-card.tsx
│       │   │   ├── countdown-widget.tsx
│       │   │   ├── next-race-card.tsx
│       │   │   ├── race-results-table.tsx
│       │   │   ├── race-schedule.tsx
│       │   │   ├── round-selector.tsx
│       │   │   ├── season-selector.tsx
│       │   │   ├── track-layout.tsx
│       │   │   ├── sections/           # Page-level section compositions
│       │   │   └── skeletons/          # Loading skeletons per page
│       │   └── ui/                     # shadcn/ui primitives (Badge, Button, Card, Table)
│       ├── lib/
│       │   ├── api.ts                  # Server-side API client (Next.js fetch with revalidation)
│       │   ├── api-client.ts           # Client-side API hooks (SWR)
│       │   ├── circuit-details.ts      # Static circuit metadata
│       │   ├── circuits.ts             # Circuit ID-to-image mapping
│       │   ├── country-flags.ts        # Country name-to-flag URL resolver
│       │   ├── sessions.ts             # Session timing and qualifying segment logic
│       │   ├── timezones.ts            # Timezone display helpers
│       │   └── utils.ts               # Date formatting, class merging utilities
│       └── types/
│           └── f1.ts                   # Frontend F1 type definitions
│
├── package.json                        # Root workspace scripts
├── pnpm-workspace.yaml
└── .gitignore
```

---

## Local Setup

### Prerequisites

- Node.js 22+
- pnpm 11+

### Installation

```bash
pnpm install
```

### Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Required variables in `packages/backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: `3001`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST endpoint. Falls back to in-memory cache if empty. |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis auth token. Falls back to in-memory cache if empty. |
| `ADMIN_CACHE_KEY` | **Yes (for admin)** | Secret token for admin cache endpoints (`x-admin-token` or `Authorization: Bearer`). Must be set in `.env`. |

### Running

```bash
# Run both frontend and backend concurrently
pnpm dev

# Or run individually
pnpm dev:backend    # Express API at http://localhost:3001
pnpm dev:frontend   # Next.js app at http://localhost:3000
```

---

## Backend API Reference

### Public Endpoints

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/health` | Health check with cache backend status and hit/miss stats | — |
| `GET` | `/api/races/next` | Next upcoming race | 20s (race weekend) / 60s (midweek) |
| `GET` | `/api/races/:season` | Full race schedule for a season | 6h (current year) / 24h (past years) |
| `GET` | `/api/races/:season/:round` | Race detail with results, sprint results | 24h (completed) / 60s (upcoming) |
| `GET` | `/api/standings/drivers?season=&round=` | Driver championship standings | 60s (race weekend) / 5min (midweek) |
| `GET` | `/api/standings/constructors?season=&round=` | Constructor championship standings | 60s (race weekend) / 5min (midweek) |

### Admin Endpoints (token-protected)

All admin endpoints require the `x-admin-token` header or `Authorization: Bearer <token>` matching `ADMIN_CACHE_KEY`. Token query parameters in URLs are not permitted for security reasons.

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/api/admin/cache` | Flush all cached keys matching `f1:*` |
| `DELETE` | `/api/admin/cache?key=f1:next-race` | Delete a specific cache key |
| `DELETE` | `/api/admin/cache?pattern=f1:schedule:*` | Delete keys matching a glob pattern |
| `POST` | `/api/admin/cache/warm` | Trigger background cache warming for core endpoints |

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2026-07-28T17:30:26.658Z",
  "cache": {
    "backend": "redis",
    "stats": {
      "hits": 142,
      "misses": 8,
      "total": 150,
      "hitRatioPercentage": "94.7%"
    }
  }
}
```

---

## Caching Architecture

The application implements a two-layer caching strategy to minimize external API calls and reduce response latency.

### Layer 1: Redis (Backend)

Cache-aside pattern at the service level (`services/jolpica.ts`). All five Jolpica API functions are wrapped with `cachedFetch()`, which checks Redis before making an external HTTP request.

Key features:
- **Upstash Redis** (serverless, REST-based) as the primary backend.
- **In-memory `Map` fallback** with TTL expiration when Redis credentials are not configured.
- **Startup Ping Timeout (3s)**: `RedisCacheService.ping()` is bounded by a 3-second timeout (`Promise.race`), preventing server boot hangs if the Redis endpoint is unresponsive.
- **Upstream Fetch Timeout (10s)**: `jolpicaFetch()` uses `AbortSignal.timeout(10000)` to ensure hung upstream requests reject and release `inFlight` deduplication locks promptly.
- **Graceful degradation**: all `cache.get()` and `cache.set()` calls are wrapped in try/catch. If Redis is unreachable, the system falls through to direct Jolpica API calls without interruption.
- **In-flight request deduplication** (stampede protection): concurrent requests for the same uncached key share a single upstream fetch rather than triggering parallel requests to the external API.
- **Negative Caching**: non-existent or 404 race lookups are cached for 5 minutes (`NEGATIVE_CACHE`), preventing invalid route params from bypassing the cache.
- **Cache warming on startup**: the server asynchronously pre-fetches the current season schedule, next race, and current standings immediately after boot, so the first visitor receives cached data.
- **Dynamic TTLs & Season Evaluation**: TTL values automatically shorten during race weekends (Friday-Sunday UTC). All current-year comparisons use dynamic evaluation helpers (`getCurrentYear()`, `getCurrentSeason()`) to ensure process stability across year transitions.
- **Season-Aware Standings**: historical driver and constructor standings (past seasons) utilize a 24-hour TTL (`86400s`) at both Express and Next.js layers, preventing unnecessary minute-by-minute revalidations for static historical data.

### Layer 2: Next.js Fetch Cache (Frontend)

Next.js server-side `fetch()` calls use the `next: { revalidate }` option to cache backend responses at the SSR layer. Revalidation intervals are aligned with Redis TTLs to satisfy the invariant:

```
TTL(Next.js revalidate) <= TTL(Redis)
```

This prevents Next.js from serving stale data after Redis has already received fresh upstream data.

### Cache Key Schema

```text
f1:next-race
f1:schedule:{season}
f1:race:{season}:{round}
f1:standings:drivers:{season}
f1:standings:drivers:{season}:{round}
f1:standings:constructors:{season}
f1:standings:constructors:{season}:{round}
```

---

## Frontend Pages

| Route | Component | Data Fetching | Description |
|---|---|---|---|
| `/` | Dashboard | Server Component (SSR) | Next race card with countdown, top-5 driver and constructor standings |
| `/calendar` | Calendar | Server Component (SSR) | Season race calendar with year selector (1950-present) |
| `/calendar/[round]` | Race Detail | Server Component (SSR) | Full race results table, sprint results, circuit map, session schedule |
| `/standings` | Standings | Server Component (SSR) | Full driver and constructor standings with season and round selectors |

All pages include dedicated `loading.tsx` skeletons and `error.tsx` error boundaries.

---

## Future Roadmap

- **OpenF1 Live Integration**: Real-time race control messages, live timing, and session status via the OpenF1 API (`/v1/race_control`, `/v1/position`).
- **Live Red Flag Handling**: Automatic countdown pause during red flags, safety car periods, and session delays in `CountdownWidget`.
- **Production Deployment**: Backend on Render/Koyeb, frontend on Vercel, with Upstash Redis as the shared cache layer.
