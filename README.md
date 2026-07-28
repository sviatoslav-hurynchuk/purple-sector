# Purple Sector 🏎️

Interactive analytics and data platform for Formula 1, built with Node.js, Express, and Next.js monorepo architecture.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js + TypeScript |
| Frontend | Next.js (App Router) + TypeScript |
| Package Manager | pnpm (workspaces monorepo) |
| Data APIs | [Jolpica F1 API](https://api.jolpi.ca/ergast/f1/) · [OpenF1 API](https://api.openf1.org/v1/) |

## Project Structure

```text
f1-data-demo/
├── packages/
│   ├── backend/     # Express API (port 3001)
│   └── frontend/    # Next.js app (port 3000)
├── package.json
└── pnpm-workspace.yaml
```

## Local Setup & Execution

```bash
# Install dependencies
pnpm install

# Run both frontend and backend concurrently
pnpm dev

# Or run individually
pnpm dev:backend
pnpm dev:frontend
```

## Backend API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/standings/drivers` | Driver Standings |
| GET | `/api/standings/constructors` | Constructor Standings |
| GET | `/api/races/:season` | Season Race Calendar |
| GET | `/api/races/:season/:round` | Race Details & Session Schedule |

## Future OpenF1 Live Integration Roadmap

- **Live Race Control & Red Flag Handling**:
  - **API Endpoint:** `https://api.openf1.org/v1/race_control?session_key=latest`
  - **Objective:** Track real-time race control messages (`flag: "RED"`, `status: "Delayed"`, `status: "Resumed"`).
  - **Component Target:** Connect to `CountdownWidget` and `resolveQualifyingSegment` in `lib/sessions.ts` so live Q1/Q2/Q3 timers automatically pause during Red Flags, safety car periods, or session delays.
