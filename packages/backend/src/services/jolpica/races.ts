import type {
  Race,
  Driver,
  Constructor,
  QualifyingResultEntry,
} from '../../types/f1';
import {
  TTL,
  getCurrentSeason,
  getNextRaceTTL,
  getUpcomingRaceTTL,
  jolpicaFetch,
  cachedFetch,
  type JolpicaResponse,
} from './client';

export interface RaceResultEntry {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

export interface RaceResult extends Race {
  Results?: RaceResultEntry[];
  SprintResults?: RaceResultEntry[];
  QualifyingResults?: QualifyingResultEntry[];
}

export interface RaceTable {
  season: string;
  round?: string;
  Races: Race[];
}

export interface RaceResultsTable {
  season: string;
  round?: string;
  Races: RaceResult[];
}

export type JolpicaRacesResponse = JolpicaResponse<'RaceTable', RaceTable>;
export type JolpicaRaceResultsResponse = JolpicaResponse<'RaceTable', RaceResultsTable>;

// ── Race Schedule ────────────────────────────────────────────────────────────

export async function getRaceSchedule(season: string | number): Promise<Race[]> {
  const s = String(season);
  const ttl = s === getCurrentSeason() ? TTL.SCHEDULE_CURRENT : TTL.SCHEDULE_PAST;

  return cachedFetch(`f1:schedule:${s}`, ttl, async () => {
    const data = await jolpicaFetch<JolpicaRacesResponse>(`/${s}`);
    return data.MRData.RaceTable.Races;
  });
}

// ── Race Result / Detail ─────────────────────────────────────────────────────

export async function getRaceResult(
  season: string | number,
  round: string | number
): Promise<RaceResult | Race | null> {
  const s = String(season);
  const r = String(round);
  const cacheKey = `f1:race:${s}:${r}`;

  return cachedFetch<RaceResult | Race | null>(
    cacheKey,
    (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      const hasResults = 'Results' in data && Array.isArray(data.Results) && data.Results.length > 0;
      return hasResults ? TTL.RACE_WITH_RESULTS : getUpcomingRaceTTL();
    },
    async () => {
      // 1. Fetch race schedule details (let upstream errors propagate for outages)
      const scheduleRes = await jolpicaFetch<JolpicaRacesResponse>(`/${s}/${r}`);
      const scheduleRace = scheduleRes.MRData.RaceTable.Races[0];

      if (!scheduleRace) {
        return null;
      }

      // 2. Fetch results, sprint, and qualifying in parallel (optional sub-requests)
      const [resultsRes, sprintRes, qualyRes] = await Promise.all([
        jolpicaFetch<JolpicaRaceResultsResponse>(`/${s}/${r}/results`).catch(() => null),
        jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: RaceResult[] }>>(`/${s}/${r}/sprint`).catch(() => null),
        jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: { QualifyingResults?: QualifyingResultEntry[] }[] }>>(`/${s}/${r}/qualifying`).catch(() => null),
      ]);

      const resultsRace = resultsRes?.MRData.RaceTable.Races[0];
      const sprintRace = sprintRes?.MRData.RaceTable.Races[0];
      const qualyRace = qualyRes?.MRData.RaceTable.Races[0];

      const merged: RaceResult = {
        ...scheduleRace,
        ...(resultsRace || {}),
      } as RaceResult;

      if (resultsRace?.Results && resultsRace.Results.length > 0) {
        merged.Results = resultsRace.Results;
      }

      if (sprintRace?.SprintResults && sprintRace.SprintResults.length > 0) {
        merged.SprintResults = sprintRace.SprintResults;
      }

      if (qualyRace?.QualifyingResults && qualyRace.QualifyingResults.length > 0) {
        merged.QualifyingResults = qualyRace.QualifyingResults;
      }

      return merged;
    }
  );
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  return cachedFetch('f1:next-race', getNextRaceTTL(), async () => {
    const data = await jolpicaFetch<JolpicaRacesResponse>('/current/next');
    return data.MRData.RaceTable.Races[0] ?? null;
  });
}
