# Purple Sector

Interactive Formula 1 data platform with real-time standings, race calendars, circuit details, session results, teammate head-to-head battles, and live telemetry. Built as a high-performance monorepo with an Express backend acting as an intelligent caching proxy to the Jolpica F1 and OpenF1 APIs, and a Next.js frontend rendering server-side pages using a monolithic cockpit design system.

> Purple Sector is an unofficial project and is not affiliated with Formula 1 companies.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Backend | Express.js, TypeScript | 4.x, 5.x |
| Frontend | Next.js (App Router), React, TypeScript | 16.x, 19.x |
| Caching | Upstash Redis (serverless REST) + in-memory fallback | REST API / Map |
| UI & Styling | Tailwind CSS v4, shadcn/ui, Lucide Icons | — |
| Package Manager | pnpm workspaces (monorepo) | 11.x |
| External APIs | [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) (historical data), [OpenF1 API](https://api.openf1.org/v1/) (live timing, telemetry, race control) | — |

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
│   │   │   │   ├── constructors.ts     # Season constructors list and team profiles
│   │   │   │   ├── drivers.ts          # Season drivers list and driver career profiles
│   │   │   │   ├── head-to-head.ts     # Teammate comparison battles and stats
│   │   │   │   ├── live.ts             # SSE stream, live timing tower, car telemetry & 2D positions
│   │   │   │   ├── openf1.ts           # OpenF1 sessions, stints, weather, race control
│   │   │   │   ├── races.ts            # Race schedule, results, pit stops, lap data, next race
│   │   │   │   └── standings.ts        # Driver and constructor championship standings
│   │   │   ├── services/
│   │   │   │   ├── cache.ts            # Cache service (Upstash Redis + in-memory fallback)
│   │   │   │   ├── f1-official.ts      # Official F1 asset mappings (liveries, photos)
│   │   │   │   ├── head-to-head.ts     # Teammate battle calculation engine
│   │   │   │   ├── jolpica.ts          # Jolpica F1 API client with cache-aside pattern
│   │   │   │   ├── live-polling.ts     # OpenF1 live polling engine with event emitters
│   │   │   │   ├── live-telemetry.ts   # High-frequency car telemetry & position aggregators
│   │   │   │   ├── openf1.ts           # OpenF1 REST client with rate limiting & caching
│   │   │   │   ├── openf1-mapper.ts    # OpenF1 to domain entity normalizers
│   │   │   │   └── session-watcher.ts  # Automatic live session detection & state recovery
│   │   │   └── types/
│   │   │       └── f1.ts               # Shared backend domain & API types
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                       # Next.js application (port 3000)
│       ├── app/
│       │   ├── layout.tsx              # Root layout with navigation dock
│       │   ├── error.tsx               # Global error boundary
│       │   ├── global-error.tsx        # Root error boundary
│       │   └── (main)/                 # Route group with shared shell
│       │       ├── page.tsx            # Cockpit Dashboard (Next GP, circuit, standings)
│       │       ├── calendar/
│       │       │   ├── page.tsx        # Season race calendar with year selector
│       │       │   └── [round]/
│       │       │       ├── page.tsx    # Race weekend hub (sessions, results, circuit)
│       │       │       ├── laps/       # Lap-by-lap timing, race pace & gap analysis
│       │       │       └── pit-stops/  # Pit stop chronology, strategy & durations
│       │       ├── constructors/
│       │       │   ├── page.tsx        # Season constructors directory
│       │       │   └── [constructorId]/# Team profile, history, achievements & driver lineup
│       │       ├── drivers/
│       │       │   ├── page.tsx        # Season drivers grid
│       │       │   └── [driverId]/     # Driver career stats, bio & season breakdown
│       │       ├── head-to-head/
│       │       │   └── page.tsx        # Teammate battle comparison matrix (qualifying, race, pts)
│       │       ├── live/
│       │       │   └── page.tsx        # Real-time Live Control Room (SSE, 2D map, telemetry)
│       │       └── standings/
│       │           └── page.tsx        # Full championship standings with round slider
│       ├── components/
│       │   ├── f1/                     # Domain-specific components
│       │   │   ├── head-to-head/       # Head-to-head battle cards & comparison charts
│       │   │   ├── laps/               # Lap chart visualizations, gap tower & pace tables
│       │   │   ├── pit-stops/          # Pit stop duration charts & tables
│       │   │   ├── sections/           # Modular page-level content sections
│       │   │   ├── skeletons/          # Zero-CLS loading skeletons matching grid architecture
│       │   │   ├── circuit-details-card.tsx
│       │   │   ├── countdown-widget.tsx
│       │   │   ├── navbar.tsx          # Responsive liquid-glass floating dock with F1 Red active glow
│       │   │   ├── next-race-card.tsx  # Next Grand Prix hero card with timetable matrix
│       │   │   ├── race-results-table.tsx
│       │   │   ├── race-schedule.tsx
│       │   │   ├── round-selector.tsx
│       │   │   └── season-selector.tsx
│       │   └── ui/                     # shadcn/ui base primitives
│       ├── lib/
│       │   ├── api.ts                  # Server-side API client (Next.js fetch with revalidation)
│       │   ├── api-client.ts           # Client-side API hooks (SWR)
│       │   ├── circuit-details.ts      # Circuit metadata, historical era routing (Jarama, Montjuïc, etc.)
│       │   ├── circuits.ts             # Circuit ID-to-image and track layout mapping
│       │   ├── country-flags.ts        # Country code to high-res flag URL resolver
│       │   ├── driver-photos.ts        # Driver photo CDN resolver with fallback avatars
│       │   ├── sessions.ts             # Session timing and weekend format logic
│       │   ├── team-colors.ts          # Official team livery colors & border utilities
│       │   ├── timezones.ts            # Local/track timezone conversions
│       │   └── utils.ts               # Date formatting, class merging utilities
│       └── types/
│           └── f1.ts                   # Frontend domain type definitions
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

Key variables in `packages/backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: `3001`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST endpoint. Falls back to in-memory cache if empty. |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis auth token. Falls back to in-memory cache if empty. |
| `ADMIN_CACHE_KEY` | **Yes (for admin)** | Secret token for admin cache endpoints (`x-admin-token` or `Authorization: Bearer`). |
| `OPENF1_BASE_URL` | No | Base URL for OpenF1 API (default: `https://api.openf1.org/v1`) |

### Running the Application

```bash
# Run both frontend and backend concurrently
pnpm dev

# Or run individually
pnpm dev:backend    # Express API at http://localhost:3001
pnpm dev:frontend   # Next.js app at http://localhost:3000
```

---

## Backend API Reference

### Races & Results

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/races/next` | Next upcoming Grand Prix with session schedule | 20s (race weekend) / 60s (midweek) |
| `GET` | `/api/races/:season` | Full race schedule for a season (1950–present) | 6h (current) / 24h (past) |
| `GET` | `/api/races/:season/:round` | Grand Prix results, sprint results, qualifying classification | 24h (completed) / 60s (upcoming) |
| `GET` | `/api/races/:season/:round/pitstops` | Pit stop chronology, tyre stop counts, and durations (2012+) | 24h (immutable) |
| `GET` | `/api/races/:season/:round/laps` | Full lap-by-lap timing data, positions, and fastest laps (1996+) | 24h (immutable) |

### Championship Standings

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/standings/drivers?season=&round=` | Driver championship standings with optional round filter | 60s (race weekend) / 5m (midweek) / 24h (past) |
| `GET` | `/api/standings/constructors?season=&round=` | Constructor championship standings with optional round filter | 60s (race weekend) / 5m (midweek) / 24h (past) |

### Drivers & Constructors

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/drivers?season=YYYY` | Roster of active drivers for a given season | 5m (race weekend) / 1h (midweek) / 24h (past) |
| `GET` | `/api/drivers/:driverId` | Full driver profile, career statistics, and season finish history | 24h |
| `GET` | `/api/constructors?season=YYYY` | Constructors entered for a given season | 5m (race weekend) / 1h (midweek) / 24h (past) |
| `GET` | `/api/constructors/:constructorId` | Team profile, historical lineup, career stats, championships | 5m |

### Teammate Head-to-Head

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/head-to-head/:season` | All teammate battles and metrics across constructors for a season | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/head-to-head/:season/constructor/:id` | Teammate battle for a specific constructor | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/head-to-head/:season/battle/:d1/:d2` | Direct head-to-head telemetry & finishing battle between 2 drivers | 60s (weekend) / 15m (midweek) / 24h (past) |

### Live Timing & Telemetry (OpenF1 Engine)

| Method | Path | Description | Cache / Rate |
|---|---|---|---|
| `GET` | `/api/live/state` | Current live session snapshot (auto-wakes polling engine) | `no-cache` |
| `GET` | `/api/live/stream` | Server-Sent Events (SSE) stream for real-time live timing & race events | Continuous stream |
| `GET` | `/api/live/timing/tower` | Live timing tower with positions, intervals, gaps, tyres, and stints | 2s |
| `GET` | `/api/live/telemetry/:driverNumber` | High-frequency telemetry (speed, RPM, gear, throttle, brake, DRS) | 1s live / 24h historical |
| `GET` | `/api/live/telemetry/compare/:d1/:d2` | Side-by-side telemetry trace comparison for two drivers | 1s live / 24h historical |
| `GET` | `/api/live/map/positions` | High-frequency 2D coordinate positions for track map tracking | 1s |
| `GET` | `/api/openf1/race/:season/:round` | Complete OpenF1 session dataset (tyre stints, weather, race control) | 24h |
| `GET` | `/api/openf1/sessions/:year` | All recorded OpenF1 sessions for a calendar year (2023+) | 6h (current) / 24h (past) |
| `GET` | `/api/openf1/stints/:sessionKey` | Detailed tyre stint breakdown by driver | 24h |
| `GET` | `/api/openf1/weather/:sessionKey` | Ambient and track temperature, humidity, rainfall readings | 24h |
| `GET` | `/api/openf1/race_control/:sessionKey` | FIA race control incident log, flags, and safety cars | 24h |

### Admin Endpoints (token-protected)

All admin endpoints require `x-admin-token` or `Authorization: Bearer <token>` matching `ADMIN_CACHE_KEY`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check with Redis status, latency, and hit/miss statistics |
| `DELETE` | `/api/admin/cache` | Flush all cached keys matching `f1:*` |
| `DELETE` | `/api/admin/cache?key=f1:next-race` | Invalidate a specific cache key |
| `DELETE` | `/api/admin/cache?pattern=f1:schedule:*` | Invalidate keys matching a glob pattern |
| `POST` | `/api/admin/cache/warm` | Trigger background cache pre-warming for core endpoints |
| `POST` | `/api/live/start` | Force-start the live polling engine for a session |
| `POST` | `/api/live/stop` | Stop the live polling engine |

---

## Caching Architecture

The platform uses a two-tier caching architecture engineered to respect upstream rate limits (e.g. OpenF1's 3 req/sec limit and Jolpica's rate bounds) while keeping latency minimal.

### Layer 1: Redis & Service Cache-Aside (Backend)

- **Upstash Redis** as primary serverless store with in-memory `Map` fallback with TTL expiration.
- **In-flight request deduplication**: Concurrent requests for the same uncached key share a single upstream promise, preventing cache stampedes.
- **Negative Caching**: Non-existent or 404 lookups are cached for 5 minutes (`NEGATIVE_CACHE`), blocking parameter brute-forcing from exhausting rate limits.
- **Dynamic Tiered TTLs**:
  - Historical seasons (completed): 24 hours (`86400s`).
  - Active season (midweek): 1 hour to 6 hours depending on resource stability.
  - Race weekends: 20 seconds to 60 seconds for near-instant classification updates.
  - Live session telemetry: 1 to 2 seconds with SSE streaming.
- **Cache Pre-warming**: Asynchronous pre-fetch of next race, current season calendar, and standings immediately upon backend initialization.

### Layer 2: Next.js Fetch Cache (Frontend)

Next.js server components configure `next: { revalidate }` aligned with Redis TTLs to enforce the invariant:

$$\text{TTL}(\text{Next.js revalidate}) \le \text{TTL}(\text{Redis})$$

This ensures Next.js never serves stale data after Redis has received fresh upstream updates.

### Cache Key Schema

```text
f1:next-race
f1:schedule:{season}
f1:race:{season}:{round}
f1:race:pitstops:{season}:{round}
f1:race:laps:{season}:{round}
f1:standings:drivers:{season}
f1:standings:drivers:{season}:{round}
f1:standings:constructors:{season}
f1:standings:constructors:{season}:{round}
f1:drivers:{season}
f1:driver:{driverId}
f1:constructors:{season}
f1:constructor:{constructorId}
f1:h2h:{season}
f1:h2h:{season}:{constructorId}
f1:h2h:{season}:{driver1}:{driver2}
f1:openf1:sessions:{year}
f1:openf1:race:{season}:{round}
```

---

## Frontend Pages

| Route | Component | Data Fetching | Description |
|---|---|---|---|
| `/` | Dashboard | Server Component (SSR) | Race Control cockpit: Next Grand Prix hero card, timetable matrix, circuit map, and compact standings |
| `/calendar` | Calendar | Server Component (SSR) | Complete season schedule (1950–present) with status pills, dates, and track layouts |
| `/calendar/[round]` | Race Detail | Server Component (SSR) | Weekend hub: qualifying & race classifications, session schedules, and circuit details |
| `/calendar/[round]/pit-stops` | Pit Stops | Server Component (SSR) | Pit stop chronology, duration rankings, stop counts, and tyre strategy overview |
| `/calendar/[round]/laps` | Lap Telemetry | Server Component (SSR) | Lap-by-lap timing analysis, driver lap comparisons, and race pace progression |
| `/drivers` | Drivers Grid | Server Component (SSR) | Active driver roster for the season with team associations, points, and nationality flags |
| `/drivers/[driverId]` | Driver Profile | Server Component (SSR) | Deep-dive driver biography, career statistics (wins, podiums, poles), and season finishes |
| `/constructors` | Constructors Grid | Server Component (SSR) | Championship constructor grid with team liveries and season statistics |
| `/constructors/[constructorId]` | Constructor Profile | Server Component (SSR) | Historical team achievements, full driver roster history, and active driver pairings |
| `/head-to-head` | Head-To-Head | Server Component (SSR) | Apex design benchmark: comprehensive teammate battle comparison across qualifying, race, and points |
| `/live` | Live Control Room | Client Component (SSE/SWR) | Real-time session monitoring: 2D track map with car coordinates, live timing tower, and telemetry |
| `/standings` | Standings | Server Component (SSR) | Full driver & constructor championship standings with season selector and completed-round slider |

All pages feature tailored `loading.tsx` skeletons and robust `error.tsx` boundaries.

---

## UI/UX Design System Benchmark

The user interface follows the monolithic cockpit design system established on the **Teammate Head-to-Head** (`/head-to-head`) page:

- **Monolithic 1px Grid Architecture**: Ban loose "AI floating bubble cards". Cards utilize unified outer shells (`rounded-3xl border border-white/10 bg-zinc-950`) with contiguous 1px shared borders (`border-t border-l border-white/10` parent, `border-b border-r border-white/10 bg-zinc-900/20` children).
- **Typography & High Contrast**: Monospace numbers (`font-mono`) for all telemetry, lap times, gaps, and points; uppercase tracking for badges and headers (`text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider`).
- **Compact Cockpit Density**: Eliminated large vertical gaps and horizontal table overflow, ensuring all data grids fit comfortably on standard laptop viewports.
- **Motorsports Polish**: High-res country flags for Grand Prix and drivers, inwards-facing driver cutouts, distinct DNF/DSQ badges, dynamic team livery ambient glows (`opacity-20 blur-3xl`), and signature F1 Red active indicators.
- **Mobile Adaptability**: Liquid glass bottom dock navigation with $\ge 44\text{px}$ touch targets and smooth horizontal scrolling ribbons.

---

## Future Roadmap

- **Interactive Audio Team Radio**: Integrated audio playback for FIA team radio clips provided by OpenF1.
- **WebSockets / WebTransport Migration**: Low-latency bidirectional alternative to SSE for live telemetry broadcast during live sessions.
- **Historical Telemetry Replays**: Timeline scrubber to replay past Grand Prix telemetry laps side-by-side with synchronized 2D track animations.
- **Production Deployment**: Containerized deployment on Koyeb/Render, frontend on Vercel, with Upstash Redis as the persistent global cache.
