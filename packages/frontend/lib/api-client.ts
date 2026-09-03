import type { PitStopsResponse, RaceSessionData } from '@/types/f1';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Fetches a resource and throws on any non-2xx response. */
export async function clientFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${BACKEND_URL}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}

/**
 * Fetches a resource that may not exist.
 * Returns null on 404 instead of throwing, rethrows on other errors.
 */
export async function clientFetchNullable<T>(path: string): Promise<T | null> {
    const res = await fetch(`${BACKEND_URL}${path}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}

/**
 * Fetches all pit stops for a race on-demand (called from client components).
 * Returns null when data is unavailable (pre-2012 races, future races).
 */
export async function getPitStops(
    season: number | string,
    round: number | string
): Promise<PitStopsResponse | null> {
    return clientFetchNullable<PitStopsResponse>(
        `/api/races/${season}/${round}/pitstops`
    );
}

/**
 * Fetches OpenF1 enriched race data (stints, weather, race control, team radio).
 */
export async function getOpenF1RaceData(
    season: number | string,
    round: number | string
): Promise<RaceSessionData | null> {
    const year = Number(season);
    if (year < 2023) return null;
    return clientFetchNullable<RaceSessionData>(
        `/api/openf1/race/${season}/${round}`
    );
}
