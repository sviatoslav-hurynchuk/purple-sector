import type {
  Race,
  DriverStanding,
  ConstructorStanding,
  Driver,
  Constructor,
} from '../types/f1';

const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

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
}

// ── Jolpica API Response Schema Definitions ──────────────────────────────────

interface JolpicaResponse<TableKey extends string, TableType> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
  } & {
    [key in TableKey]: TableType;
  };
}

interface RaceTable {
  season: string;
  round?: string;
  Races: Race[];
}

interface RaceResultsTable {
  season: string;
  round?: string;
  Races: RaceResult[];
}

interface StandingsTable {
  season: string;
  StandingsLists: Array<{
    season: string;
    round: string;
    DriverStandings?: DriverStanding[];
    ConstructorStandings?: ConstructorStanding[];
  }>;
}

type JolpicaRacesResponse = JolpicaResponse<'RaceTable', RaceTable>;
type JolpicaRaceResultsResponse = JolpicaResponse<'RaceTable', RaceResultsTable>;
type JolpicaStandingsResponse = JolpicaResponse<'StandingsTable', StandingsTable>;

// ── HTTP Fetch Helper ────────────────────────────────────────────────────────

async function jolpicaFetch<T>(path: string): Promise<T> {
  // According to Jolpica docs: all endpoints must end with .json or /
  const url = `${BASE_URL}${path}.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Jolpica API error: ${res.status} — ${url}`);
  }

  const data = await res.json();
  return data as T;
}

// ── Race Schedule ────────────────────────────────────────────────────────────

export async function getRaceSchedule(season: string | number): Promise<Race[]> {
  const data = await jolpicaFetch<JolpicaRacesResponse>(`/${season}`);
  return data.MRData.RaceTable.Races;
}

// ── Race Result / Detail ─────────────────────────────────────────────────────

export async function getRaceResult(
    season: string | number,
    round: string | number
): Promise<RaceResult | Race | null> {
  // Fetch schedule, results, and sprint results in parallel
  const [scheduleRes, resultsRes, sprintRes] = await Promise.all([
    jolpicaFetch<JolpicaRacesResponse>(`/${season}/${round}`).catch(() => null),
    jolpicaFetch<JolpicaRaceResultsResponse>(`/${season}/${round}/results`).catch(() => null),
    jolpicaFetch<JolpicaResponse<'RaceTable', { season: string; round?: string; Races: RaceResult[] }>>(`/${season}/${round}/sprint`).catch(() => null),
  ]);

  const scheduleRace = scheduleRes?.MRData.RaceTable.Races[0];
  const resultsRace = resultsRes?.MRData.RaceTable.Races[0];
  const sprintRace = sprintRes?.MRData.RaceTable.Races[0];

  if (!scheduleRace && !resultsRace && !sprintRace) {
    return null;
  }

  // Merge schedule information with results
  const merged: RaceResult = {
    ...(scheduleRace || {}),
    ...(resultsRace || {}),
  } as RaceResult;

  if (resultsRace?.Results && resultsRace.Results.length > 0) {
    merged.Results = resultsRace.Results;
  }

  if (sprintRace?.SprintResults && sprintRace.SprintResults.length > 0) {
    merged.SprintResults = sprintRace.SprintResults;
  }

  return merged;
}

// ── Driver Standings ─────────────────────────────────────────────────────────

export async function getDriverStandings(
  season: string | number,
  round?: string | number
): Promise<DriverStanding[]> {
  const path = round ? `/${season}/${round}/driverStandings` : `/${season}/driverStandings`;
  const data = await jolpicaFetch<JolpicaStandingsResponse>(path);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

// ── Constructor Standings ────────────────────────────────────────────────────

export async function getConstructorStandings(
  season: string | number,
  round?: string | number
): Promise<ConstructorStanding[]> {
  const path = round ? `/${season}/${round}/constructorStandings` : `/${season}/constructorStandings`;
  const data = await jolpicaFetch<JolpicaStandingsResponse>(path);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  const data = await jolpicaFetch<JolpicaRacesResponse>('/current/next');
  return data.MRData.RaceTable.Races[0] ?? null;
}