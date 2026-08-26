/**
 * Shared TypeScript types for F1 domain entities.
 * These mirror the structures returned by Jolpica F1 API.
 */

export interface F1Session {
  date: string;
  time?: string;
}

// ── Circuit ──────────────────────────────────────────────────────────────────

export interface Circuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: {
    country: string;
    locality: string;
    lat: string;
    long: string;
  };
}

// ── Race ────────────────────────────────────────────────────────────────────

export interface Race {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: F1Session;
  SecondPractice?: F1Session;
  ThirdPractice?: F1Session;
  Qualifying?: F1Session;
  Sprint?: F1Session;
  SprintQualifying?: F1Session;
  SprintShootout?: F1Session;
}

// ── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  driverId: string;
  url: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

// ── Constructor ─────────────────────────────────────────────────────────────

export interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

// ── Standings ───────────────────────────────────────────────────────────────

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

export interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: Constructor;
}

export interface QualifyingResultEntry {
  number: string;
  position: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

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
}

export interface RaceResult extends Race {
  Results?: RaceResultEntry[];
  SprintResults?: RaceResultEntry[];
  QualifyingResults?: QualifyingResultEntry[];
}

// ── Pit Stops ────────────────────────────────────────────────────────────────

/**
 * A single pit stop event recorded by the FIA timing system.
 * All fields are strings to match the Ergast/Jolpica JSON convention.
 */
export interface PitStopEntry {
  /** Jolpica driver slug (e.g. "max_verstappen") */
  driverId: string;
  /** Sequential stop number for this driver in the race (first stop = "1") */
  stop: string;
  /** Lap number on which the car entered the pit lane */
  lap: string;
  /** Time of day in HH:MM:SS format when the pit stop occurred */
  time: string;
  /** Total pit lane time in seconds, e.g. "24.474" or "1:04.195" for long stops */
  duration: string;
}

export interface PitStopsResponse {
  season: string;
  round: string;
  pitStops: PitStopEntry[];
}


// ── Driver Profiles ──────────────────────────────────────────────────────────

export interface DriverCareerStats {
  wins: number;
  podiums: number;
  poles: number;
  championships: number;
  totalRaces: number;
}

export interface DriverSeasonStanding {
  season: string;
  round: string;
  position: string;
  points: string;
  wins: string;
  constructors: Array<{ constructorId: string; name: string }>;
}

export interface OfficialDriverStats {
  season: {
    year: string;
    position: string;
    points: string;
    gpRaces: number;
    gpPoints: number;
    gpWins: number;
    gpPodiums: number;
    gpPoles: number;
    gpTop10s: number;
    fastestLaps: number;
    dnfs: number;
    sprintRaces?: number;
    sprintPoints?: number;
    sprintWins?: number;
    sprintPodiums?: number;
  };
  career: {
    grandsPrixEntered: number;
    careerPoints: number;
    highestRaceFinish: string;
    podiums: number;
    highestGridPosition: string;
    polePositions: number;
    worldChampionships: number;
    dnfs?: number;
  };
  bio?: {
    dateOfBirth?: string;
    placeOfBirth?: string;
  };
}

export interface DriverProfile {
  driver: Driver;
  careerStats: DriverCareerStats;
  seasonHistory: DriverSeasonStanding[];
  officialStats?: OfficialDriverStats | null;
}

// ── Constructor Profiles ─────────────────────────────────────────────────────

export interface ConstructorCareerStats {
  championships: number;
  totalRaces: number;
  wins: number;
  podiums: number;
  poles: number;
  fastestLaps?: number;
}

export interface ConstructorMeta {
  fullName: string;
  base: string;
  teamPrincipal: string;
  technicalChief?: string;
  chassis?: string;
  powerUnit?: string;
  firstEntry?: number;
  worldChampionships?: number[];
}

export interface ConstructorDriverHistory {
  driverId: string;
  givenName: string;
  familyName: string;
  code?: string;
  permanentNumber?: string;
  nationality: string;
}

export interface ConstructorProfile {
  constructor: Constructor;
  meta: ConstructorMeta;
  stats: ConstructorCareerStats;
  currentDrivers: ConstructorDriverHistory[];
  historicalDrivers: ConstructorDriverHistory[];
  seasonsCount: number;
  officialDetails?: OfficialTeamDetails | null;
}

export interface OfficialTeamDetails {
  fullName?: string;
  base?: string;
  teamPrincipal?: string;
  technicalChief?: string;
  chassis?: string;
  powerUnit?: string;
  firstEntry?: number;
  worldChampionships?: number;
  highestRaceFinish?: string;
  polePositions?: number;
  fastestLaps?: number;
}

// ── Lap Data ─────────────────────────────────────────────────────────────────

/** A single driver's timing entry for one lap of a race. */
export interface LapTiming {
  /** Jolpica driver slug (e.g. "max_verstappen") */
  driverId: string;
  /** Driver's track position at the end of this lap (as string, e.g. "1") */
  position: string;
  /** Lap time formatted as M:SS.mmm (e.g. "1:33.450") */
  time: string;
}

/** All timing entries for a single lap number. */
export interface LapData {
  /** Lap number (as string, e.g. "1") */
  number: string;
  /** All driver timings for this lap */
  Timings: LapTiming[];
}

/** Summary information about a driver's race participation, enriched from results. */
export interface DriverLapSummary {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  constructorId: string;
  constructorName: string;
  gridPosition: number;
  finishPosition: number;
  positionText: string;
  status: string;
  totalLaps: number;
  fastestLap?: {
    lap: number;
    time: string;
    rank: number;
  };
}

/** Complete lap-by-lap data for a race, returned by the backend API. */
export interface RaceLapsResponse {
  season: string;
  round: string;
  totalLaps: number;
  laps: LapData[];
  drivers: DriverLapSummary[];
}

// ── Race Events (placeholder for future OpenF1 integration) ──────────────────

/** Type of race control event. */
export type RaceEventType =
  | 'safety_car'
  | 'vsc'
  | 'yellow_flag'
  | 'red_flag'
  | 'drs_enabled'
  | 'drs_disabled'
  | 'fastest_lap'
  | 'chequered_flag';

/** A race control event mapped to a specific lap range. */
export interface RaceEvent {
  type: RaceEventType;
  /** Lap number when the event started */
  lap: number;
  /** Lap number when the event ended (e.g. safety car in) */
  endLap?: number;
  /** Raw race control message from FIA */
  message: string;
  /** Driver number involved (if applicable) */
  driverNumber?: number;
}