import type { CarTelemetrySample, CarLocationSample } from '../types/f1';
import type { OpenF1CarData, OpenF1Location, OpenF1Lap } from '../types/openf1-types';
import { openF1Fetch } from './openf1';
import { cache } from './cache';

const MAX_TELEMETRY_WINDOW_SEC = 30;
const MAX_LOCATION_WINDOW_SEC = 10;

/**
 * Normalizes OpenF1 car_data record to CarTelemetrySample.
 */
function mapCarDataSample(raw: OpenF1CarData): CarTelemetrySample {
  return {
    date: raw.date,
    driverNumber: raw.driver_number,
    speed: raw.speed,
    rpm: raw.rpm,
    gear: raw.n_gear,
    throttle: raw.throttle,
    brake: raw.brake,
    drs: raw.drs,
  };
}

/**
 * Normalizes OpenF1 location record to CarLocationSample.
 */
function mapLocationSample(raw: OpenF1Location): CarLocationSample {
  return {
    date: raw.date,
    driverNumber: raw.driver_number,
    x: raw.x,
    y: raw.y,
    z: raw.z,
  };
}

/**
 * Fetches recent live telemetry for a specific driver within a safe time window.
 * Constrained to maximum 30 seconds to prevent massive payloads.
 */
export async function getRecentDriverTelemetry(
  sessionKey: number,
  driverNumber: number,
  windowSeconds = 15,
  explicitDateFrom?: string
): Promise<CarTelemetrySample[]> {
  const boundedWindow = Math.min(Math.max(1, windowSeconds), MAX_TELEMETRY_WINDOW_SEC);
  const dateFrom = explicitDateFrom ?? new Date(Date.now() - boundedWindow * 1000).toISOString();
  const params: Record<string, string | number> = {
    session_key: sessionKey,
    driver_number: driverNumber,
    'date>=': dateFrom,
  };

  if (explicitDateFrom) {
    params['date<='] = new Date(new Date(explicitDateFrom).getTime() + boundedWindow * 1000).toISOString();
  }

  const rawData = await openF1Fetch<OpenF1CarData>('/car_data', params);

  return rawData.map(mapCarDataSample).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetches complete telemetry for a driver on a specific lap number.
 * Uses lap date_start and lap_duration for precise bounds.
 * Immutable once lap is complete -> cached aggressively.
 */
export async function getDriverLapTelemetry(
  sessionKey: number,
  driverNumber: number,
  lapNumber: number
): Promise<CarTelemetrySample[]> {
  const cacheKey = `f1:openf1:lap_telemetry:${sessionKey}:${driverNumber}:${lapNumber}`;

  const cached = await cache.get<CarTelemetrySample[]>(cacheKey);
  if (cached) return cached;

  // 1. Resolve lap start and end times
  const laps = await openF1Fetch<OpenF1Lap>('/laps', {
    session_key: sessionKey,
    driver_number: driverNumber,
    lap_number: lapNumber,
  });

  if (!laps || laps.length === 0 || !laps[0].date_start) {
    return [];
  }

  const lap = laps[0];
  const dateStart = lap.date_start;
  const durationMs = lap.lap_duration ? Math.ceil(lap.lap_duration * 1000) + 1500 : 120000;
  const dateEnd = new Date(new Date(dateStart).getTime() + durationMs).toISOString();

  // 2. Fetch bounded telemetry for the exact lap duration
  const rawData = await openF1Fetch<OpenF1CarData>('/car_data', {
    session_key: sessionKey,
    driver_number: driverNumber,
    'date>=': dateStart,
    'date<=': dateEnd,
  });

  const mapped = rawData.map(mapCarDataSample).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (mapped.length > 0) {
    // Cache for 24h (immutable historical lap telemetry)
    await cache.set(cacheKey, mapped, 86400);
  }

  return mapped;
}

/**
 * Fetches side-by-side telemetry comparison for two drivers on a specific lap or recent time window.
 */
export async function getTelemetryComparison(
  sessionKey: number,
  driver1: number,
  driver2: number,
  lapNumber?: number,
  windowSeconds = 15,
  explicitDateFrom?: string
): Promise<{ driver1: CarTelemetrySample[]; driver2: CarTelemetrySample[] }> {
  if (lapNumber && lapNumber > 0) {
    const [t1, t2] = await Promise.all([
      getDriverLapTelemetry(sessionKey, driver1, lapNumber),
      getDriverLapTelemetry(sessionKey, driver2, lapNumber),
    ]);
    return { driver1: t1, driver2: t2 };
  }

  const [t1, t2] = await Promise.all([
    getRecentDriverTelemetry(sessionKey, driver1, windowSeconds, explicitDateFrom),
    getRecentDriverTelemetry(sessionKey, driver2, windowSeconds, explicitDateFrom),
  ]);

  return { driver1: t1, driver2: t2 };
}

/**
 * Fetches recent location snapshot of all cars for live 2D track map rendering.
 * Constrained to maximum 10 seconds of location data.
 */
export async function getLocationSnapshot(
  sessionKey: number,
  windowSeconds = 5,
  explicitDateFrom?: string
): Promise<CarLocationSample[]> {
  const boundedWindow = Math.min(Math.max(1, windowSeconds), MAX_LOCATION_WINDOW_SEC);
  const dateFrom = explicitDateFrom ?? new Date(Date.now() - boundedWindow * 1000).toISOString();
  const params: Record<string, string | number> = {
    session_key: sessionKey,
    'date>=': dateFrom,
  };

  if (explicitDateFrom) {
    params['date<='] = new Date(new Date(explicitDateFrom).getTime() + boundedWindow * 1000).toISOString();
  }

  const rawLocations = await openF1Fetch<OpenF1Location>('/location', params);

  return rawLocations.map(mapLocationSample).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
