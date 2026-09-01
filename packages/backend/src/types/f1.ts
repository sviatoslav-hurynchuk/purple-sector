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

// ── Race Events & Race Control ───────────────────────────────────────────────

/** Type of race control event. */
export type RaceEventType =
  | 'safety_car'
  | 'vsc'
  | 'yellow_flag'
  | 'red_flag'
  | 'drs_enabled'
  | 'drs_disabled'
  | 'fastest_lap'
  | 'chequered_flag'
  | 'warning'
  | 'penalty'
  | 'other';

/** A race control event mapped to a specific lap or timestamp. */
export interface RaceEvent {
  type: RaceEventType;
  /** Lap number when the event occurred/started */
  lap: number;
  /** Lap number when the event ended (e.g. safety car in) */
  endLap?: number;
  /** ISO timestamp when the message was broadcast */
  date?: string;
  /** Raw race control message from FIA */
  message: string;
  /** Flag type (e.g. "RED", "YELLOW", "BLACK AND WHITE") */
  flag?: string;
  /** Driver number involved (if applicable) */
  driverNumber?: number;
}

// ── Tire Stints ──────────────────────────────────────────────────────────────

/** Tire compound used during a stint. */
export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

/** A tire stint for a driver during a race. */
export interface TireStint {
  driverId: string;
  driverNumber: number;
  stintNumber: number;
  compound: TireCompound;
  startLap: number;
  endLap: number;
  tyreAgeAtStart: number;
}

// ── Weather ──────────────────────────────────────────────────────────────────

/** Weather snapshot for a session time slice. */
export interface WeatherSnapshot {
  date: string;
  airTemperature: number;
  trackTemperature: number;
  humidity: number;
  pressure: number;
  rainfall: boolean;
  windSpeed: number;
  windDirection: number;
}

// ── OpenF1 Timing & Session Telemetry Models ──────────────────────────────────

/** Lap timing with sector splits and speed traps from OpenF1. */
export interface LapSectorTiming {
  driverId: string;
  driverNumber: number;
  lapNumber: number;
  lapDuration: number | null;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  speedTrap: number | null;
  i1Speed: number | null;
  i2Speed: number | null;
  isPitOutLap: boolean;
  dateStart: string;
}

/** Pit stop entry with lane duration and stop duration. */
export interface PitStopDetail {
  driverId: string;
  driverNumber: number;
  lapNumber: number;
  laneDuration: number;
  stopDuration: number | null;
  date: string;
}

/** Team radio communication clip. */
export interface TeamRadioClip {
  driverId: string;
  driverNumber: number;
  date: string;
  recordingUrl: string;
}

/** Complete session dataset returned by GET /api/openf1/race/:season/:round */
export interface RaceSessionData {
  sessionKey: number;
  meetingKey: number;
  season: string;
  round: string;
  stints: TireStint[];
  raceControlEvents: RaceEvent[];
  weather: WeatherSnapshot[];
  laps: LapSectorTiming[];
  pitStops: PitStopDetail[];
  teamRadio: TeamRadioClip[];
}

// ── Live Realtime Session State ──────────────────────────────────────────────

/** Live status of a single driver during an active race/practice/qualifying session. */
export interface LiveDriverState {
  driverNumber: number;
  driverId: string;
  code?: string;
  name?: string;
  teamName?: string;
  teamColour?: string;
  position: number;
  gapToLeader: number | string | null;
  interval: number | string | null;
  lastLapDuration: number | null;
  currentCompound: TireCompound;
  currentStintLaps: number;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  speedTrap: number | null;
  isPitOutLap: boolean;
}

/** Aggregated live session state streamed to dashboard & live timing. */
export interface LiveSessionState {
  sessionKey: number | null;
  meetingKey: number | null;
  sessionType: string;
  sessionName: string;
  circuitShortName?: string;
  countryName?: string;
  dateStart?: string;
  dateEnd?: string;
  isActive: boolean;
  lastUpdated: string;
  drivers: LiveDriverState[];
  raceControlFeed: RaceEvent[];
  weather: WeatherSnapshot | null;
}

// ── Telemetry & Track Coordinates ─────────────────────────────────────────────

/** High-frequency car telemetry sample (~3.7 Hz). */
export interface CarTelemetrySample {
  date: string;
  driverNumber: number;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  drs: number;
}

/** 2D/3D car coordinates in circuit local reference frame. */
export interface CarLocationSample {
  date: string;
  driverNumber: number;
  x: number;
  y: number;
  z: number;
}