/**
 * API client for the Purple Sector Express backend.
 * All data requests are routed through our backend server (port 3001),
 * which handles caching, aggregation, and Jolpica/OpenF1 rate limits.
 */

import type {
  Race,
  RaceResult,
  DriverStanding,
  ConstructorStanding,
} from '@/types/f1';

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

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/**
 * Fetches a resource that is expected to exist.
 * Throws on any non-2xx response.
 */
async function apiFetch<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches a resource that may not exist.
 * Returns null on 404. Throws on other non-2xx responses.
 */
async function apiFetchNullable<T>(path: string, revalidate = 60): Promise<T | null> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Backend API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ── Standings ────────────────────────────────────────────────────────────────

export async function getDriverStandings(season?: number, round?: number): Promise<DriverStanding[]> {
  const year = season ?? new Date().getFullYear();
  const roundParam = round ? `&round=${round}` : '';
  const data = await apiFetch<StandingsResponse<DriverStanding>>(
    `/api/standings/drivers?season=${year}${roundParam}`
  );
  return data.standings;
}

export async function getConstructorStandings(season?: number, round?: number): Promise<ConstructorStanding[]> {
  const year = season ?? new Date().getFullYear();
  const roundParam = round ? `&round=${round}` : '';
  const data = await apiFetch<StandingsResponse<ConstructorStanding>>(
    `/api/standings/constructors?season=${year}${roundParam}`
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
): Promise<RaceResult | Race | null> {
  // 404 = race hasn't happened yet or doesn't exist — return null, not an error
  return apiFetchNullable<RaceResult | Race>(`/api/races/${season}/${round}`);
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  // Revalidate every 5 minutes — next race data changes when a session ends
  // 404 = no upcoming races found (end of season) — not an error
  return apiFetchNullable<Race>('/api/races/next', 300);
}