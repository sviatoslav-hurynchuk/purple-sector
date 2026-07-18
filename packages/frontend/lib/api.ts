/**
 * API client for F1 Data Hub backend.
 * All requests go through our Express server (port 3001).
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ── Standings ────────────────────────────────────────────────────────────────

export async function getDriverStandings(season?: number) {
  const year = season ?? new Date().getFullYear();
  return apiFetch(`/api/standings/drivers?season=${year}`);
}

export async function getConstructorStandings(season?: number) {
  const year = season ?? new Date().getFullYear();
  return apiFetch(`/api/standings/constructors?season=${year}`);
}

// ── Races ────────────────────────────────────────────────────────────────────

export async function getRaceSchedule(season?: number) {
  const year = season ?? new Date().getFullYear();
  return apiFetch(`/api/races/${year}`);
}

export async function getRaceDetail(season: number, round: number) {
  return apiFetch(`/api/races/${season}/${round}`);
}
