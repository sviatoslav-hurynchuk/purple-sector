/**
 * Shared TypeScript types for F1 domain entities.
 * These mirror the structures returned by Jolpica F1 API.
 */

// ── Race ────────────────────────────────────────────────────────────────────

export interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    country: string;
    locality: string;
    lat: string;
    long: string;
  };
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
}

// ── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  driverId: string;
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
