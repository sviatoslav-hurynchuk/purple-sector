import type {
  Race,
  DriverStanding,
  ConstructorStanding,
  Driver,
  Constructor,
} from '../types/f1';

const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

export interface RaceResult extends Race {
  Results: Array<{
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
  }>;
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

// ── Race Result ──────────────────────────────────────────────────────────────

export async function getRaceResult(
    season: string | number,
    round: string | number
): Promise<RaceResult | null> {
  const data = await jolpicaFetch<JolpicaRaceResultsResponse>(`/${season}/${round}/results`);
  return data.MRData.RaceTable.Races[0] ?? null;
}

// ── Driver Standings ─────────────────────────────────────────────────────────

export async function getDriverStandings(season: string | number): Promise<DriverStanding[]> {
  const data = await jolpicaFetch<JolpicaStandingsResponse>(`/${season}/driverStandings`);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

// ── Constructor Standings ────────────────────────────────────────────────────

export async function getConstructorStandings(season: string | number): Promise<ConstructorStanding[]> {
  const data = await jolpicaFetch<JolpicaStandingsResponse>(`/${season}/constructorStandings`);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
}

// ── Next Race ────────────────────────────────────────────────────────────────

export async function getNextRace(): Promise<Race | null> {
  const data = await jolpicaFetch<JolpicaRacesResponse>('/current/next');
  return data.MRData.RaceTable.Races[0] ?? null;
}