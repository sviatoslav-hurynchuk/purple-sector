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

  // 1. Stewards penalties & infringements first (so e.g. "SAFETY CAR INFRINGEMENT" is categorized as warning/penalty, not deployment)
  if (category === 'PENALTY' || text.includes('PENALTY') || text.includes('TIME PENALTY')) return 'penalty';
  if (
    text.includes('INFRINGEMENT') ||
    text.includes('INVESTIGATED') ||
    text.includes('INVESTIGATION') ||
    text.includes('TRACK LIMITS') ||
    flag === 'BLACK AND WHITE'
  ) {
    return 'warning';
  }

  // 2. Flags
  if (flag === 'CHEQUERED' || text.includes('CHEQUERED FLAG')) return 'chequered_flag';
  if (flag === 'RED' || text.includes('RED FLAG - RACE SUSPENDED') || /\bRED\s*FLAG\b/.test(text)) return 'red_flag';
  if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW' || text.includes('YELLOW FLAG')) return 'yellow_flag';

  // 3. Safety Car & VSC deployments ONLY (not informational notices like LIGHTS ON, OVERTAKE, USE PIT LANE, etc.)
  if (text.includes('VSC DEPLOYED') || text.includes('VIRTUAL SAFETY CAR DEPLOYED')) return 'vsc';
  if (text.includes('SAFETY CAR DEPLOYED') || (category === 'SAFETYCAR' && text.includes('DEPLOYED'))) return 'safety_car';

  // Informational Safety Car notices (e.g. LIGHTS ON, OVERTAKE, USE PIT LANE, IN THIS LAP) are not new deployments
  if (category === 'SAFETYCAR' || text.includes('SAFETY CAR') || text.includes('VSC')) {
    return 'other';
  }

  // 2026+ Active Aerodynamics (Straight-line mode / X-Mode / Z-Mode)
  if (text.includes('STRAIGHT LINE MODE ENABLED') || text.includes('ACTIVE AERO ENABLED') || text.includes('X-MODE ENABLED')) {
    return 'straight_line_mode_enabled';
  }
  if (text.includes('STRAIGHT LINE MODE DISABLED') || text.includes('ACTIVE AERO DISABLED') || text.includes('X-MODE DISABLED')) {
    return 'straight_line_mode_disabled';
  }

  // 2026+ Overtake Mode / Manual Override Mode (MOM)
  if (text.includes('OVERTAKE MODE ENABLED') || text.includes('MANUAL OVERRIDE ENABLED') || text.includes('MOM ENABLED')) {
    return 'overtake_mode_enabled';
  }
  if (text.includes('OVERTAKE MODE DISABLED') || text.includes('MANUAL OVERRIDE DISABLED') || text.includes('MOM DISABLED')) {
    return 'overtake_mode_disabled';
  }

  // <= 2025 DRS (Drag Reduction System)
  if (text.includes('DRS ENABLED')) return 'drs_enabled';
  if (text.includes('DRS DISABLED')) return 'drs_disabled';

  return 'other';
}

/**
 * Parses lap number from message text if available (e.g. "LAP 14 CAR 16 OFF TRACK", "L14", "ON LAP 14").
 */
export function extractLapFromMessage(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(?:LAP|L)\s*(\d+)/i) ?? text.match(/ON\s+LAP\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Maps raw OpenF1 race control items to domain RaceEvent array.
 * If rawLaps are provided, maps each event timestamp to its active lap number.
 */
export function mapRaceControlEvents(
  rawEvents: OpenF1RaceControl[],
  rawLaps?: OpenF1Lap[]
): RaceEvent[] {
  if (!Array.isArray(rawEvents)) return [];

  // Build sorted lap start timeline if laps are available
  const lapTimeline: Array<{ dateMs: number; lap: number }> = [];
  if (Array.isArray(rawLaps) && rawLaps.length > 0) {
    const lapMap = new Map<number, number>(); // lap_number -> min date_start timestamp
    for (const lap of rawLaps) {
      if (lap.date_start && lap.lap_number > 0) {
        const t = new Date(lap.date_start).getTime();
        if (!isNaN(t)) {
          const existing = lapMap.get(lap.lap_number);
          if (existing === undefined || t < existing) {
            lapMap.set(lap.lap_number, t);
          }
        }
      }
    }
    for (const [lap, dateMs] of lapMap.entries()) {
      lapTimeline.push({ lap, dateMs });
    }
    lapTimeline.sort((a, b) => a.dateMs - b.dateMs);
  }

  const sortedEvents = [...rawEvents].sort(
    (a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
  );

  const mapped: RaceEvent[] = [];

  for (let i = 0; i < sortedEvents.length; i++) {
    const item = sortedEvents[i];
    const type = categorizeRaceControlMessage(item);
    let lapNumber: number | undefined = undefined;

    // 1. Direct lap_number on OpenF1 record
    if (typeof item.lap_number === 'number' && item.lap_number > 0) {
      lapNumber = item.lap_number;
    }

    // 2. Parse from message text
    if (!lapNumber) {
      const parsed = extractLapFromMessage(item.message);
      if (parsed !== null && parsed > 0) {
        lapNumber = parsed;
      }
    }

    // 3. Fallback to lap timestamp timeline
    if (!lapNumber && item.date && lapTimeline.length > 0) {
      const eventTime = new Date(item.date).getTime();
      if (!isNaN(eventTime)) {
        let bestLap = lapTimeline[0].lap;
        for (const entry of lapTimeline) {
          if (entry.dateMs <= eventTime) {
            bestLap = entry.lap;
          } else {
            break;
          }
        }
        lapNumber = bestLap;
      }
    }

    const text = (item.message || '').toUpperCase();
    const isEndingNotice =
      text.includes('SAFETY CAR IN THIS LAP') ||
      text.includes('SAFETY CAR ENDING') ||
      text.includes('VSC ENDING');

    // Skip creating duplicate deployment items for ending notices
    if (isEndingNotice && (type === 'safety_car' || type === 'vsc')) {
      continue;
    }

    mapped.push({
      type,
      ...(lapNumber !== undefined ? { lap: lapNumber } : {}),
      date: item.date,
      message: item.message,
      flag: item.flag ?? undefined,
      driverNumber: item.driver_number ?? undefined,
    });
  }

  // Helper to determine if an event terminates an active track neutralization
  const isTrackNeutralizationTerminator = (raw: OpenF1RaceControl, targetType: RaceEventType): boolean => {
    const msg = (raw.message || '').toUpperCase();
    const flag = (raw.flag || '').toUpperCase();
    const scope = (raw.scope || '').toUpperCase();

    // Local sector yellow clears do NOT end full-course neutralizations
    if (scope === 'SECTOR' || msg.includes('TRACK SECTOR')) return false;

    if (targetType === 'vsc') {
      return (
        msg.includes('VSC ENDING') ||
        msg.includes('SAFETY CAR DEPLOYED') ||
        msg.includes('RED FLAG') ||
        (msg === 'TRACK CLEAR' && scope === 'TRACK') ||
        msg.includes('GREEN FLAG') ||
        flag === 'CHEQUERED'
      );
    }

    if (targetType === 'safety_car') {
      return (
        msg.includes('SAFETY CAR IN THIS LAP') ||
        msg.includes('SAFETY CAR ENDING') ||
        msg.includes('RED FLAG') ||
        msg.includes('STANDING START') ||
        msg.includes('ROLLING START') ||
        (msg === 'TRACK CLEAR' && scope === 'TRACK') ||
        msg.includes('GREEN FLAG') ||
        flag === 'CHEQUERED'
      );
    }

    if (targetType === 'red_flag') {
      return (
        msg.includes('SESSION STARTED') ||
        msg.includes('SESSION RESUMED') ||
        msg.includes('STANDING START') ||
        msg.includes('ROLLING START') ||
        msg.includes('SAFETY CAR DEPLOYED') ||
        msg.includes('GREEN FLAG') ||
        flag === 'CHEQUERED'
      );
    }

    return false;
  };

  // Calculate endLap for paired Safety Car, VSC, and Red Flag periods
  for (let i = 0; i < mapped.length; i++) {
    const evt = mapped[i];
    if (evt.type === 'safety_car' || evt.type === 'vsc' || evt.type === 'red_flag') {
      const startLap = evt.lap ?? 1;
      const nextEndOrFlag = sortedEvents.find((raw) => {
        const rawTime = new Date(raw.date ?? 0).getTime();
        const evtTime = new Date(evt.date ?? 0).getTime();
        if (rawTime <= evtTime) return false;
        return isTrackNeutralizationTerminator(raw, evt.type);
      });

      if (nextEndOrFlag) {
        const endLap = nextEndOrFlag.lap_number ?? (extractLapFromMessage(nextEndOrFlag.message) || startLap);
        evt.endLap = Math.max(startLap, endLap);
      } else {
        evt.endLap = startLap + (evt.type === 'vsc' ? 1 : evt.type === 'red_flag' ? 0 : 2);
      }
    }
  }

  // Merge contiguous or overlapping Safety Car and VSC periods
  const merged: RaceEvent[] = [];
  for (const evt of mapped) {
    if (evt.type === 'safety_car' || evt.type === 'vsc') {
      const prev = merged[merged.length - 1];
      if (
        prev &&
        prev.type === evt.type &&
        prev.endLap !== undefined &&
        evt.lap !== undefined &&
        evt.lap <= prev.endLap + 1
      ) {
        prev.endLap = Math.max(prev.endLap, evt.endLap ?? evt.lap);
        continue;
      }
    }
    merged.push(evt);
  }

  return merged;
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
