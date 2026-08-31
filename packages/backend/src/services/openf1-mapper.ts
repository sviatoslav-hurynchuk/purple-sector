import type {
  TireCompound,
  TireStint,
  RaceEvent,
  RaceEventType,
  WeatherSnapshot,
  LapSectorTiming,
  PitStopDetail,
  TeamRadioClip,
} from '../types/f1';
import type {
  OpenF1Stint,
  OpenF1RaceControl,
  OpenF1Weather,
  OpenF1Lap,
  OpenF1Pit,
  OpenF1TeamRadio,
} from '../types/openf1-types';

/**
 * Normalizes OpenF1 compound names to strict TireCompound domain union.
 */
export function normalizeCompound(raw: string | undefined | null): TireCompound {
  if (!raw) return 'UNKNOWN';
  const c = raw.trim().toUpperCase();
  if (c === 'SOFT') return 'SOFT';
  if (c === 'MEDIUM') return 'MEDIUM';
  if (c === 'HARD') return 'HARD';
  if (c === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (c === 'WET') return 'WET';
  return 'UNKNOWN';
}

/**
 * Maps raw OpenF1 stints to domain TireStint array.
 */
export function mapStints(
  rawStints: OpenF1Stint[],
  driverMap: Map<number, string>
): TireStint[] {
  if (!Array.isArray(rawStints)) return [];

  return rawStints.map((stint) => ({
    driverId: driverMap.get(stint.driver_number) ?? `driver_${stint.driver_number}`,
    driverNumber: stint.driver_number,
    stintNumber: stint.stint_number,
    compound: normalizeCompound(stint.compound),
    startLap: stint.lap_start,
    endLap: stint.lap_end,
    tyreAgeAtStart: stint.tyre_age_at_start ?? 0,
  })).sort((a, b) => {
    if (a.driverNumber !== b.driverNumber) return a.driverNumber - b.driverNumber;
    return a.stintNumber - b.stintNumber;
  });
}

/**
 * Categorizes an FIA Race Control message into our domain RaceEventType.
 */
export function categorizeRaceControlMessage(
  msg: OpenF1RaceControl
): RaceEventType {
  const category = (msg.category ?? '').toUpperCase();
  const text = (msg.message ?? '').toUpperCase();
  const flag = (msg.flag ?? '').toUpperCase();

  if (category === 'SAFETYCAR' || text.includes('SAFETY CAR')) {
    if (text.includes('VIRTUAL') || text.includes('VSC')) return 'vsc';
    return 'safety_car';
  }

  if (flag === 'RED' || text.includes('RED FLAG')) return 'red_flag';
  if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW' || text.includes('YELLOW FLAG')) return 'yellow_flag';
  if (flag === 'CHEQUERED' || text.includes('CHEQUERED FLAG')) return 'chequered_flag';

  if (text.includes('DRS ENABLED')) return 'drs_enabled';
  if (text.includes('DRS DISABLED')) return 'drs_disabled';

  if (category === 'PENALTY' || text.includes('PENALTY') || text.includes('TIME PENALTY')) return 'penalty';
  if (flag === 'BLACK AND WHITE' || text.includes('WARNING') || text.includes('TRACK LIMITS')) return 'warning';

  return 'other';
}

/**
 * Parses lap number from message text if available (e.g. "LAP 14 CAR 16 OFF TRACK").
 */
export function extractLapFromMessage(text: string): number | null {
  const match = text.match(/LAP\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Maps raw OpenF1 race control items to domain RaceEvent array.
 */
export function mapRaceControlEvents(
  rawEvents: OpenF1RaceControl[]
): RaceEvent[] {
  if (!Array.isArray(rawEvents)) return [];

  return rawEvents.map((item) => {
    const type = categorizeRaceControlMessage(item);
    const parsedLap = extractLapFromMessage(item.message);

    return {
      type,
      lap: parsedLap ?? 0,
      date: item.date,
      message: item.message,
      flag: item.flag ?? undefined,
      driverNumber: item.driver_number ?? undefined,
    };
  }).sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
}

/**
 * Maps raw OpenF1 weather readings to domain WeatherSnapshot array.
 */
export function mapWeather(
  rawWeather: OpenF1Weather[]
): WeatherSnapshot[] {
  if (!Array.isArray(rawWeather)) return [];

  return rawWeather.map((w) => ({
    date: w.date,
    airTemperature: w.air_temperature,
    trackTemperature: w.track_temperature,
    humidity: w.humidity,
    pressure: w.pressure,
    rainfall: w.rainfall > 0,
    windSpeed: w.wind_speed,
    windDirection: w.wind_direction,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Maps raw OpenF1 laps to domain LapSectorTiming array.
 */
export function mapLapSectorTimings(
  rawLaps: OpenF1Lap[],
  driverMap: Map<number, string>
): LapSectorTiming[] {
  if (!Array.isArray(rawLaps)) return [];

  return rawLaps.map((lap) => ({
    driverId: driverMap.get(lap.driver_number) ?? `driver_${lap.driver_number}`,
    driverNumber: lap.driver_number,
    lapNumber: lap.lap_number,
    lapDuration: lap.lap_duration,
    sector1: lap.duration_sector_1,
    sector2: lap.duration_sector_2,
    sector3: lap.duration_sector_3,
    speedTrap: lap.st_speed,
    i1Speed: lap.i1_speed,
    i2Speed: lap.i2_speed,
    isPitOutLap: lap.is_pit_out_lap ?? false,
    dateStart: lap.date_start,
  })).sort((a, b) => {
    if (a.lapNumber !== b.lapNumber) return a.lapNumber - b.lapNumber;
    return a.driverNumber - b.driverNumber;
  });
}

/**
 * Maps raw OpenF1 pit records to domain PitStopDetail array.
 */
export function mapPitStops(
  rawPits: OpenF1Pit[],
  driverMap: Map<number, string>
): PitStopDetail[] {
  if (!Array.isArray(rawPits)) return [];

  return rawPits.map((pit) => ({
    driverId: driverMap.get(pit.driver_number) ?? `driver_${pit.driver_number}`,
    driverNumber: pit.driver_number,
    lapNumber: pit.lap_number,
    laneDuration: pit.lane_duration,
    stopDuration: pit.stop_duration,
    date: pit.date,
  })).sort((a, b) => a.lapNumber - b.lapNumber);
}

/**
 * Maps raw OpenF1 team radio clips to domain TeamRadioClip array.
 */
export function mapTeamRadio(
  rawRadio: OpenF1TeamRadio[],
  driverMap: Map<number, string>
): TeamRadioClip[] {
  if (!Array.isArray(rawRadio)) return [];

  return rawRadio.map((r) => ({
    driverId: driverMap.get(r.driver_number) ?? `driver_${r.driver_number}`,
    driverNumber: r.driver_number,
    date: r.date,
    recordingUrl: r.recording_url,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
