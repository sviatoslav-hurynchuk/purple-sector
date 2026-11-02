# Purple Sector

Interactive Formula 1 data platform featuring real-time championship standings with mathematical clinch detection, race weekend calendars with 1-click calendar sync (iCal, Webcal, Google, Outlook), circuit details, session results, teammate head-to-head battles, season reliability & attrition analytics, and live telemetry. Built as a high-performance monorepo with an Express backend acting as an intelligent caching proxy to the Jolpica F1 and OpenF1 APIs, and a Next.js frontend rendering server-side pages using a monolithic cockpit design system.

> Purple Sector is an unofficial project and is not affiliated with Formula 1 companies.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Backend | Express.js, TypeScript | 4.x, 5.x |
| Frontend | Next.js (App Router, Turbopack), React, TypeScript | 16.x, 19.x |
| Caching | Upstash Redis (serverless REST) + in-memory fallback | REST API / Map |
| Calendar Exports | RFC 5545 iCalendar specification (`.ics`, `webcal://`) | Standard |
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
│   │   │   ├── index.ts                # Server entry point, CORS config, Redis init, cache warming
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
│   │   │   │   ├── reliability.ts      # Season reliability, attrition heatmap matrix & constructor history
│   │   │   │   └── standings.ts        # Driver & constructor standings with clinch status
│   │   │   ├── services/
│   │   │   │   ├── cache.ts            # Cache service (Upstash Redis + in-memory fallback)
│   │   │   │   ├── f1-official.ts      # Official F1 scraper (liveries, photos, stats) with adaptive TTL
│   │   │   │   ├── head-to-head.ts     # Teammate battle calculation engine
│   │   │   │   ├── jolpica/            # Modular Jolpica F1 API client & domain services
│   │   │   │   │   ├── championship.ts # Mathematical clinch detector & FIA Art. 7.2 countback tiebreaker
│   │   │   │   │   ├── client.ts       # HTTP client with negative caching & request deduplication
│   │   │   │   │   ├── constructors.ts # Team roster, details & multi-season results
│   │   │   │   │   ├── drivers.ts      # Driver profiles, standings synchronization & career records
│   │   │   │   │   ├── races.ts        # Race calendar, session schedules & classifications
│   │   │   │   │   ├── standings.ts    # Driver & constructor standings queries
│   │   │   │   │   ├── timing.ts       # Pit stops & lap time metrics
│   │   │   │   │   ├── warming.ts      # Cache pre-warming & event-driven cache invalidation
│   │   │   │   │   └── index.ts        # Domain export barrel
│   │   │   │   ├── live-polling.ts     # OpenF1 live polling engine with event emitters
│   │   │   │   ├── live-telemetry.ts   # High-frequency car telemetry & position aggregators
│   │   │   │   ├── openf1.ts           # OpenF1 REST client with rate limiting & caching
│   │   │   │   ├── openf1-mapper.ts    # OpenF1 to domain entity normalizers
│   │   │   │   ├── reliability.ts      # Reliability analytics engine, DNF categorization & multi-season aggregation
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
│       │   ├── api/
│       │   │   └── calendar/
│       │   │       └── [season]/
│       │   │           └── route.ts    # Dynamic season iCalendar (ICS) and Webcal subscription feed
│       │   └── (main)/                 # Route group with shared shell
│       │       ├── page.tsx            # Cockpit Dashboard (Next GP, circuit, standings)
│       │       ├── calendar/
│       │       │   ├── page.tsx        # Season race calendar with year selector & calendar export
│       │       │   └── [round]/
│       │       │       ├── page.tsx    # Race weekend hub (sessions, results, circuit)
│       │       │       ├── laps/       # Lap-by-lap timing, race pace & gap analysis
│       │       │       └── pit-stops/  # Pit stop chronology, strategy & durations
│       │       ├── constructors/
│       │       │   ├── page.tsx        # Season constructors directory
│       │       │   └── [constructorId]/# Team profile, history, achievements & driver lineup
│       │       ├── drivers/
│       │       │   ├── page.tsx        # Season drivers grid
│       │       │   └── [driverId]/     # Driver career stats, bio, active standings & champion badges
│       │       ├── head-to-head/
│       │       │   └── page.tsx        # Teammate battle comparison matrix (qualifying, race, pts)
│       │       ├── live/
│       │       │   └── page.tsx        # Real-time Live Control Room (SSE, 2D map, telemetry)
│       │       ├── reliability/
│       │       │   └── page.tsx        # Season reliability rankings & team multi-season durability view
│       │       └── standings/
│       │           └── page.tsx        # Full championship standings with round slider & clinch highlights
│       ├── components/
│       │   ├── f1/                     # Domain-specific components
│       │   │   ├── calendar/           # Add-to-calendar menu, session filters & direct provider links
│       │   │   ├── head-to-head/       # Head-to-head battle cards & comparison charts
│       │   │   ├── laps/               # Lap chart visualizations, gap tower & pace tables
│       │   │   ├── pit-stops/          # Pit stop duration charts & tables
│       │   │   ├── reliability/        # Constructor durability table, attrition matrix & cause breakdown
│       │   │   ├── sections/           # Modular page-level content sections
│       │   │   ├── skeletons/          # Zero-CLS loading skeletons matching grid architecture
│       │   │   ├── standings/          # Driver & Constructor standings cards with champion 'C' badges
│       │   │   ├── circuit-details-card.tsx
│       │   │   ├── countdown-widget.tsx
│       │   │   ├── navbar.tsx          # Responsive liquid-glass floating dock with F1 Red active glow
│       │   │   ├── next-race-card.tsx  # Next Grand Prix hero card with timetable matrix
│       │   │   ├── race-results-table.tsx
│       │   │   ├── race-schedule.tsx   # Race calendar list with weekend session drawers & export buttons
│       │   │   ├── round-selector.tsx
│       │   │   └── season-selector.tsx
│       │   └── ui/                     # shadcn/ui base primitives
│       ├── lib/
│       │   ├── api.ts                  # Server-side API client (Next.js fetch with ISR revalidation)
│       │   ├── api-client.ts           # Client-side API hooks (SWR)
│       │   ├── calendar-links.ts       # Provider calendar link generators (Google, Outlook, Webcal)
│       │   ├── circuit-details.ts      # Circuit metadata, historical era routing (Jarama, Montjuïc, etc.)
│       │   ├── circuits.ts             # Circuit ID-to-image and track layout mapping
│       │   ├── country-flags.ts        # Country code to high-res flag URL resolver
│       │   ├── driver-photos.ts        # Driver photo CDN resolver with fallback avatars
│       │   ├── ics-generator.ts        # RFC 5545 iCalendar (ICS) generator with alarms & session filtering
│       │   ├── sessions.ts             # Session timing and weekend format logic
│       │   ├── team-colors.ts          # Official team livery colors & border utilities
│       │   ├── timezones.ts            # Local/track timezone conversions
│       │   └── utils.ts                # Date formatting, class merging utilities
│       ├── types/
│       │   └── f1.ts                   # Frontend domain type definitions
│       ├── .env.example
│       ├── package.json
│       └── tsconfig.json
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

#### Backend (`packages/backend/.env`)

Copy the example backend environment file:

```bash
cp packages/backend/.env.example packages/backend/.env
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Backend HTTP port |
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS allowed origins (supports wildcards like `https://*.vercel.app`) |
| `UPSTASH_REDIS_REST_URL` | No | — | Upstash Redis REST endpoint. Falls back to in-memory `Map` cache if empty. |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Upstash Redis auth token. Falls back to in-memory `Map` cache if empty. |
| `ADMIN_CACHE_KEY` | **Yes (for admin)** | — | Secret token for admin cache management endpoints (`x-admin-token` or `Authorization: Bearer`). |
| `OPENF1_BASE_URL` | No | `https://api.openf1.org/v1` | Base URL for OpenF1 API |
| `JOLPICA_BASE_URL` | No | `https://api.jolpi.ca/ergast/f1` | Base URL for Jolpica F1 API |

#### Frontend (`packages/frontend/.env.local`)

Copy the example frontend environment file:

```bash
cp packages/frontend/.env.example packages/frontend/.env.local
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Backend API base URL used for SSR and client data fetching |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public website origin (used for calendar subscription feeds and event URLs) |
| `NEXT_PUBLIC_LIVE_ENABLED` | No | `false` | Feature flag to show the Live Control Room dock item |

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

### Championship Standings & Mathematical Clinch

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/standings/drivers?season=&round=` | Driver championship standings with optional round filter. Includes mathematical `championship` clinch status and sets `isClinchedChampion: true` on crowned leaders | 60s (race weekend) / 5m (midweek) / 24h (past) |
| `GET` | `/api/standings/constructors?season=&round=` | Constructor championship standings with optional round filter. Includes mathematical `championship` clinch status and sets `isClinchedChampion: true` on crowned leaders | 60s (race weekend) / 5m (midweek) / 24h (past) |

### Drivers & Constructors

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/drivers?season=YYYY` | Roster of active drivers for a given season | 5m (race weekend) / 1h (midweek) / 24h (past) |
| `GET` | `/api/drivers/:driverId` | Full driver profile, career statistics, live standings reconciliation, and multi-season finish history | 30m (race weekend) / 12h (midweek) / 30d (retired) |
| `GET` | `/api/constructors?season=YYYY` | Constructors entered for a given season | 5m (race weekend) / 1h (midweek) / 24h (past) |
| `GET` | `/api/constructors/:constructorId` | Team profile, historical lineup, career stats, championships | 5m |

### Teammate Head-to-Head

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/head-to-head/:season` | All teammate battles and metrics across constructors for a season | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/head-to-head/:season/constructor/:id` | Teammate battle for a specific constructor | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/head-to-head/:season/battle/:d1/:d2` | Direct head-to-head telemetry & finishing battle between 2 drivers | 60s (weekend) / 15m (midweek) / 24h (past) |

### Reliability & Attrition Analytics

| Method | Path | Description | Cache TTL |
|---|---|---|---|
| `GET` | `/api/reliability/:season` | Full season reliability rankings, executive KPIs, constructor/driver standings, attrition heatmap matrix, and failure cause breakdown | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/reliability/constructor/:constructorId?season=YYYY` | Multi-season reliability history (up to 5 seasons), all-time KPIs, and active season breakdown for a constructor | 60s (weekend) / 15m (midweek) / 24h (past) |
| `GET` | `/api/reliability/:season/constructor/:constructorId` | Reliability analytics for a specific constructor in a given season | 60s (weekend) / 15m (midweek) / 24h (past) |

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

### System & Health Endpoints (Public)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check with Redis status, latency, and hit/miss statistics |

### Admin Endpoints (token-protected)

All admin endpoints require `x-admin-token` or `Authorization: Bearer <token>` matching `ADMIN_CACHE_KEY`.

| Method | Path | Description |
|---|---|---|
| `DELETE` | `/api/admin/cache` | Flush all cached keys matching `f1:*` |
| `DELETE` | `/api/admin/cache?key=f1:next-race` | Invalidate a specific cache key |
| `DELETE` | `/api/admin/cache?pattern=f1:schedule:*` | Invalidate keys matching a glob pattern |
| `POST` | `/api/admin/cache/warm` | Trigger background cache pre-warming for core endpoints |
| `POST` | `/api/live/start` | Force-start the live polling engine for a session |
| `POST` | `/api/live/stop` | Stop the live polling engine |

---

## Frontend Integration Routes

### Calendar Subscription Feed

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calendar/:season` | Serves an RFC 5545 compliant `.ics` calendar feed with session filtering (`?sessions=all\|races\|qualy`) and alarm reminders (`?alarm=none\|15m\|30m\|1h`) for direct Webcal (`webcal://`), Apple Calendar, Google Calendar, and Microsoft Outlook subscriptions |

---

## Championship Clinch Engine & Tiebreaker Architecture

The platform features an automated, mathematically rigorous championship clinch detection engine ([`championship.ts`](packages/backend/src/services/jolpica/championship.ts)) supporting both the **Drivers' World Championship** and **Constructors' World Championship**:

1. **Available Points Calculation**:
   - **Drivers**: 25 points per remaining Grand Prix + 8 points per remaining Sprint. (Fastest lap bonus point was abolished by the FIA starting from the 2025 season).
   - **Constructors**: Maximum 43 points per remaining Grand Prix (P1 25 pts + P2 18 pts) + 15 points per remaining Sprint (P1 8 pts + P2 7 pts).
2. **Mathematical Contender Elimination**:
   - Every contender from P2 downwards is evaluated. If $\text{LeaderPoints} > \text{ChallengerPoints} + \text{MaxRemainingPoints}$, the contender is mathematically eliminated.
3. **FIA Sporting Regulations Article 7.2 Countback Tiebreaker**:
   - If a challenger could equal the leader on points ($\text{LeaderPoints} = \text{ChallengerMaxPoints}$), the tiebreaker engine executes:
     - **Clause (a)**: Win countback. The challenger must win every remaining GP to match points. If the leader's win total exceeds the challenger's maximum possible wins ($\text{LeaderWins} > \text{ChallengerWins} + \text{RemainingGPs}$), the championship is clinched on win countback.
     - **Clause (b)**: Finishes countback (2nd places, 3rd places, etc.) if wins would tie.
4. **Visual Language & UI Polish**:
   - **Standings Tables & Cards**: The clinched champion's row is highlighted with a 1px monolithic gold border (`border-y border-amber-500/50 border-l-2 border-l-amber-400 border-r-2 border-r-amber-400/80 bg-amber-500/[0.08]`) and replaces the standard `P01` badge with a gold **`C`** (Champion) badge.
   - **Driver Profile**: Displays a prominent `WORLD CHAMPION (CLINCHED)` golden trophy header badge with live-reconciled career points and wins.

---

## Calendar Export & Synchronization Engine

The platform provides comprehensive calendar export and subscription capabilities for race weekends and entire seasons:

- **Formats & Protocols**:
  - Downloadable `.ics` iCalendar file (RFC 5545 compliant).
  - Webcal live subscription feed (`webcal://.../api/calendar/[season]`) with automatic updates as sessions change.
  - 1-click deep links for **Google Calendar** and **Microsoft Outlook Web**.
- **Granular Session Filtering**: Export all sessions (Practice, Qualifying, Sprint, Grand Prix) or filter to Grand Prix races only.
- **Configurable Alarms**: Pre-configured `VALARM` triggers (15 minutes, 30 minutes, or 1 hour prior to session start).
- **Timezone Awareness**: Preserves UTC session timestamps with local track conversion for zero-offset calendar rendering.

---

## Caching Architecture & Resiliency

The platform employs a two-tier caching architecture engineered to respect upstream rate limits (OpenF1's 3 req/sec limit and Jolpica's rate bounds) while delivering sub-50ms responses.

### Layer 1: Redis & Service Cache-Aside (Backend)

- **Upstash Redis** as primary serverless store with in-memory `Map` fallback with TTL expiration.
- **In-flight request deduplication**: Concurrent requests for the same uncached key share a single upstream promise, preventing cache stampedes.
- **Negative Caching**: Non-existent lookups are cached for 5 minutes (`NEGATIVE_CACHE`), preventing brute-force parameter spamming from exhausting upstream rate limits.
- **Adaptive Scraper TTLs**:
  - Race weekend active drivers: 30 minutes.
  - Midweek active drivers: 12 hours.
  - Retired/historical drivers: 30 days.
- **Event-Driven Post-Race Invalidation**: Completing a Grand Prix triggers automatic cache invalidation for affected driver and constructor profile keys, ensuring instant statistical freshness without manual intervention.
- **Single Source of Truth Profile Reconciliation**: Dynamic driver profiles actively query live season standings to guarantee 100% synchronization between dashboard standings, race results, and career biography totals.
- **Fail-Fast Error Propagation**: Critical multi-season operations reject immediately upon season fetch failures rather than returning partial histories that downstream HTTP and Next.js caches might retain.

### Layer 2: Next.js Fetch & ISR Cache (Frontend)

- **Incremental Static Regeneration (ISR)**: Dynamic driver and constructor profile routes use a 5-minute (`revalidate = 300`) window, balancing instant CDN page delivery with rapid post-race update propagation.
- **Route-Level Cache Coordination**: Server components query backend proxy endpoints using Next.js tagged fetches with predictable revalidation tiers (60s for current season, 24h for historical seasons).

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
f1:championship:drivers:{season}
f1:championship:constructors:{season}
f1:drivers:{season}
f1:driver:{driverId}
f1:driver:profile:v2:{driverId}
f1:constructors:{season}
f1:constructor:{constructorId}
f1:h2h:{season}
f1:h2h:{season}:{constructorId}
f1:h2h:{season}:{driver1}:{driver2}
f1:reliability:season:{season}:v2
f1:reliability:history:v3:{constructorId}:{season}
f1:openf1:sessions:{year}
f1:openf1:race:{season}:{round}
```

---

## Frontend Pages

| Route | Component | Data Fetching | Description |
|---|---|---|---|
| `/` | Dashboard | Server Component (SSR) | Race Control cockpit: Next Grand Prix hero card, timetable matrix, circuit map, and compact standings with champion 'C' badges |
| `/calendar` | Calendar | Server Component (SSR) | Complete season schedule (1950–present) with status pills, dates, track layouts, and 1-click Calendar Export |
| `/calendar/[round]` | Race Detail | Server Component (SSR) | Weekend hub: qualifying & race classifications, session schedules, and circuit details |
| `/calendar/[round]/pit-stops` | Pit Stops | Server Component (SSR) | Pit stop chronology, duration rankings, stop counts, and tyre strategy overview |
| `/calendar/[round]/laps` | Lap Telemetry | Server Component (SSR) | Lap-by-lap timing analysis, driver lap comparisons, and race pace progression |
| `/drivers` | Drivers Grid | Server Component (SSR) | Active driver roster for the season with team associations, points, and nationality flags |
| `/drivers/[driverId]` | Driver Profile | Server Component (ISR) | Deep-dive driver biography, live standings reconciliation, `WORLD CHAMPION (CLINCHED)` trophy badge, and career statistics |
| `/constructors` | Constructors Grid | Server Component (SSR) | Championship constructor grid with team liveries and season statistics |
| `/constructors/[constructorId]` | Constructor Profile | Server Component (ISR) | Historical team achievements, technical leadership, full driver roster history, and active driver pairings |
| `/head-to-head` | Head-To-Head | Server Component (SSR) | Apex design benchmark: comprehensive teammate battle comparison across qualifying, race, and points |
| `/reliability` | Reliability Analytics | Server Component (SSR) | Full-grid reliability rankings, constructor finish & lap completion rates, interactive season attrition heatmap matrix, and failure cause distribution |
| `/reliability?team={team}&season={year}` | Team Reliability | Server Component (SSR) | Dedicated constructor multi-season durability cockpit: 5-season historical trajectory, driver cutouts with inwards gaze, and round-by-round car results |
| `/live` | Live Control Room | Client Component (SSE/SWR) | Real-time session monitoring: 2D track map with car coordinates, live timing tower, and telemetry |
| `/standings` | Standings | Server Component (SSR) | Full driver & constructor championship standings with round slider and gold champion clinch highlights |

All pages feature tailored `loading.tsx` skeletons and robust `error.tsx` boundaries.

---

## UI/UX Design System Benchmark

The user interface follows the monolithic cockpit design system established on the **Teammate Head-to-Head** (`/head-to-head`) page:

- **Monolithic 1px Grid Architecture**: Ban loose "AI floating bubble cards". Cards utilize unified outer shells (`rounded-3xl border border-white/10 bg-zinc-950`) with contiguous 1px shared borders (`border-t border-l border-white/10` parent, `border-b border-r border-white/10 bg-zinc-900/20` children).
- **Typography & High Contrast**: Monospace numbers (`font-mono`) for all telemetry, lap times, gaps, and points; uppercase tracking for badges and headers (`text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider`). Never drop readable labels below `text-zinc-400`.
- **Compact Cockpit Density**: Eliminated large vertical gaps and horizontal table overflow, ensuring all data grids fit comfortably on standard laptop viewports (`py-2.5` to `py-3.5`, `space-y-4` to `space-y-6`).
- **Motorsports Polish**: High-res country flags for Grand Prix and drivers, inwards-facing driver cutouts, distinct DNF/DSQ badges, dynamic team livery ambient glows (`opacity-20 blur-3xl`), and signature F1 Red active indicators.
- **Champion Clinch Visual Language**: Decided champions receive an unbroken golden frame outline (`border-y border-amber-500/50 border-l-2 border-l-amber-400 border-r-2 border-r-amber-400/80 bg-amber-500/[0.08]`) and a glowing **`C`** (Champion) position badge.
- **Failure Taxonomy & Reliability Visual Language**:
  - Mechanical Failures: Rose/Red badge (`bg-rose-500/10 border-rose-500/20 text-rose-400`).
  - Incident & Crash: Amber badge (`bg-amber-500/10 border-amber-500/20 text-amber-400`).
  - Disqualifications: Purple badge (`bg-purple-500/10 border-purple-500/20 text-purple-400`).
  - Did Not Start: Muted Slate badge (`bg-zinc-800 border-zinc-700 text-zinc-400`).
  - Finish Rate Color Coding: $\ge 95\%$ Emerald, $\ge 85\%$ Sky Blue, $< 85\%$ Amber.
- **Mobile Adaptability**: Liquid glass bottom dock navigation with $\ge 44\text{px}$ touch targets and smooth horizontal scrolling ribbons without destructive content hiding.

---

## Production Deployment & Infrastructure Architecture

The platform is deployed and running in a production cloud environment:

- **Frontend Deployment ([Vercel](https://vercel.com))**:
  - Deployed at [`purple-sector-sviatoslav.vercel.app`](https://purple-sector-sviatoslav.vercel.app).
  - Next.js Turbopack production builds with global edge distribution.
  - Server-side rendering (SSR) and Incremental Static Regeneration (ISR) with automated preview builds for pull requests.
- **Backend Deployment**:
  - Containerized Express.js API running in a Node.js 22 environment.
  - Restrictive CORS configuration via `ALLOWED_ORIGINS` ensuring only trusted origins and preview domains can access API endpoints.
- **Global Cache ([Upstash Redis](https://upstash.com))**:
  - Serverless REST-based Redis cluster providing persistent low-latency cache across edge regions.
  - Automatic in-memory fallback ensures high availability in the event of upstream network partitions.

---

## Future Roadmap

- **Interactive Audio Team Radio**: Integrated audio playback for official FIA team radio broadcast clips provided by OpenF1.
- **WebSockets / WebTransport Migration**: Low-latency bidirectional alternative to SSE for live telemetry broadcast during live sessions.
- **Historical Telemetry Lap Replays**: Interactive timeline scrubber to replay past Grand Prix telemetry laps side-by-side with synchronized 2D track animations.
- **Constructor Battle & Title Math Simulator**: Interactive cockpit calculator simulating remaining round scenarios and points combinations for championship title battles.
