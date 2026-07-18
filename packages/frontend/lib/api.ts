/**
 * API client for the F1 Data Hub Express backend.
 * All data requests are routed through our backend server (port 3001),
 * which handles caching, aggregation, and Jolpica/OpenF1 rate limits.
 */

import type {
  Race,
  RaceResult,
  DriverStanding,
  ConstructorStanding,
} from '../types/f1';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Response wrapper shapes (match Express route response format) ─────────────

interface StandingsResponse<T> {
  season: string;
  standings: T[];
}

interface RaceScheduleResponse {
  season: string;
  races: Race[];
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ── Standings ────────────────────────────────────────────────────────────────

export async function getDriverStandings(season?: number): Promise<DriverStanding[]> {
  const year = season ?? new Date().getFullYear();
  const data = await apiFetch<StandingsResponse<DriverStanding>>(
      `/api/standings/drivers?season=${year}`
  );
  return data.standings;
}

export async function getConstructorStandings(season?: number): Promise<ConstructorStanding[]> {
  const year = season ?? new Date().getFullYear();
  const data = await apiFetch<StandingsResponse<ConstructorStanding>>(
      `/api/standings/constructors?season=${year}`
  );
  return data.standings;
}

// ── Races ────────────────────────────────────────────────────────────────────

export async function getRaceSchedule(season?: number): Promise<Race[]> {
  const year = season ?? new Date().getFullYear();
  const data = await apiFetch<RaceScheduleResponse>(`/api/races/${year}`);
  return data.races;
}

export async function getRaceDetail(
    season: number,
    round: number
): Promise<RaceResult | null> {
  return apiFetch<RaceResult | null>(`/api/races/${season}/${round}`);
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  // Revalidate every 5 minutes — next race data changes when a session ends
  return apiFetch<Race | null>('/api/races/next', 300);
}