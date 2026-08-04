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