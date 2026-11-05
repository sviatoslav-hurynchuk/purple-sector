import crypto from 'crypto';
import type {
  RaceEvent,
  PitStopDetail,
  LapSectorTiming,
  TeamRadioClip,
  RaceHighlight,
  RaceHighlightCategory,
  RaceResultEntry,
} from '../types/f1';
import type { OpenF1Driver } from '../types/openf1-types';

export interface DriverHighlightMeta {
  driverId: string;
  driverNumber: number;
  driverName: string;
  driverSurname: string;
  driverCode?: string;
  teamName?: string;
  teamColour?: string;
}

export interface DnfHighlightInfo {
  driverNumber: number;
  status: string;
  laps: number;
  retirementTime?: number;
}

function isDnf(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  if (
    s === 'finished' ||
    s === 'lapped' ||
    s.startsWith('+') ||
    s.includes('lap') ||
    s.includes('disqualif') ||
    s === 'dsq'
  ) {
    return false;
  }
  return true;
}

function buildHighlightId(
  category: RaceHighlightCategory,
  lap: number,
  driverNumber: number,
  timestamp: string,
  recordingUrl?: string
): string {
  const hash = crypto
    .createHash('md5')
    .update(`${category}:${lap}:${driverNumber}:${timestamp}:${recordingUrl || ''}`)
    .digest('hex')
    .slice(0, 8);
  return `hl-${category}-l${lap}-${driverNumber}-${hash}`;
}

/**
 * Extracts clean surname from a driver full name (e.g. "Lewis HAMILTON" -> "HAMILTON", "Max Verstappen" -> "VERSTAPPEN").
 */
function extractSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] || fullName).toUpperCase();
}

/**
 * Correlates all official FOM TV broadcast radio clips with session laps and race context.
 * Every broadcast clip is preserved, presented as an authentic F1 TV graphic ({DRIVER} RADIO),
 * and categorized into victory, safety car, pit stop, dnf, or team radio.
 */
export function correlateRaceHighlights(params: {
  teamRadio: TeamRadioClip[];
  raceControlEvents: RaceEvent[];
  pitStops: PitStopDetail[];
  laps: LapSectorTiming[];
  openF1Drivers?: OpenF1Driver[];
  driverMap: Map<number, string>;
  results?: RaceResultEntry[];
}): RaceHighlight[] {
  const {
    teamRadio = [],
    raceControlEvents = [],
    pitStops = [],
    laps = [],
    openF1Drivers = [],
    driverMap,
    results = [],
  } = params;

  if (!teamRadio || teamRadio.length === 0) {
    return [];
  }

  // 1. Build rich driver metadata map
  const driverMetaMap = new Map<number, DriverHighlightMeta>();

  for (const d of openF1Drivers) {
    const rawColour = d.team_colour ? d.team_colour.trim() : undefined;
    const teamColour = rawColour ? (rawColour.startsWith('#') ? rawColour : `#${rawColour}`) : undefined;
    const driverId = driverMap.get(d.driver_number) ?? `driver_${d.driver_number}`;
    const fullName = d.broadcast_name || d.full_name || `${d.first_name} ${d.last_name}`.trim();
    const surname = d.last_name ? d.last_name.toUpperCase() : extractSurname(fullName);

    driverMetaMap.set(d.driver_number, {
      driverId,
      driverNumber: d.driver_number,
      driverName: fullName,
      driverSurname: surname,
      driverCode: d.name_acronym,
      teamName: d.team_name,
      teamColour,
    });
  }

  let winnerNumber: number | undefined;
  const dnfMap = new Map<number, DnfHighlightInfo>();
  const driverFinishPosMap = new Map<number, number>();

  for (const res of results) {
    const num = parseInt(res.number, 10);
    if (!isNaN(num)) {
      const pos = parseInt(res.position, 10);
      if (!isNaN(pos)) {
        driverFinishPosMap.set(num, pos);
      }

      if (res.position === '1') {
        winnerNumber = num;
      }

      const isFinisher =
        (res.positionText && res.positionText !== 'R' && !isNaN(parseInt(res.positionText, 10))) ||
        !isDnf(res.status);

      if (!isFinisher && isDnf(res.status)) {
        dnfMap.set(num, {
          driverNumber: num,
          status: res.status,
          laps: parseInt(res.laps, 10) || 0,
        });
      }

      if (!driverMetaMap.has(num)) {
        driverMetaMap.set(num, {
          driverId: res.Driver.driverId,
          driverNumber: num,
          driverName: `${res.Driver.givenName} ${res.Driver.familyName}`,
          driverSurname: res.Driver.familyName.toUpperCase(),
          driverCode: res.Driver.code,
          teamName: res.Constructor.name,
        });
      } else {
        const existing = driverMetaMap.get(num)!;
        if (!existing.driverCode && res.Driver.code) {
          existing.driverCode = res.Driver.code;
        }
        if (!existing.driverSurname && res.Driver.familyName) {
          existing.driverSurname = res.Driver.familyName.toUpperCase();
        }
      }
    }
  }

  // 2. Index laps by driver for precise lap mapping
  // driverNumber -> sorted list of { lapNumber, startTime }
  const driverLapsMap = new Map<number, Array<{ lapNumber: number; startTime: number }>>();
  let overallMinLapTime = Infinity;
  let overallMaxLapTime = -Infinity;
  let overallMaxLap = 1;

  for (const lap of laps) {
    if (!lap.dateStart) continue;
    const t = new Date(lap.dateStart).getTime();
    if (isNaN(t)) continue;

    if (t < overallMinLapTime) overallMinLapTime = t;
    if (t > overallMaxLapTime) overallMaxLapTime = t;
    if (lap.lapNumber > overallMaxLap) overallMaxLap = lap.lapNumber;

    let list = driverLapsMap.get(lap.driverNumber);
    if (!list) {
      list = [];
      driverLapsMap.set(lap.driverNumber, list);
    }
    list.push({ lapNumber: lap.lapNumber, startTime: t });
  }

  for (const list of driverLapsMap.values()) {
    list.sort((a, b) => a.startTime - b.startTime);
  }

  // Populate retirementTime for DNF drivers from race control incident messages or driver's last recorded lap
  for (const [dNum, dnfInfo] of dnfMap.entries()) {
    const incidentMsg = raceControlEvents.find(
      (e) =>
        (e.driverNumber === dNum || (e.message && e.message.toUpperCase().includes(`CAR ${dNum}`))) &&
        (e.message.toUpperCase().includes('STOPPED') ||
          e.message.toUpperCase().includes('OFF TRACK') ||
          e.message.toUpperCase().includes('ACCIDENT'))
    );
    if (incidentMsg?.date) {
      const t = new Date(incidentMsg.date).getTime();
      if (!isNaN(t)) dnfInfo.retirementTime = t;
    }

    if (!dnfInfo.retirementTime) {
      const dLaps = driverLapsMap.get(dNum);
      if (dLaps && dLaps.length > 0) {
        dnfInfo.retirementTime = dLaps[dLaps.length - 1].startTime;
      }
    }
  }

  // Chequered flag event time
  const chequeredFlagEvent = raceControlEvents.find(
    (e) => e.type === 'chequered_flag' || (e.message && e.message.toUpperCase().includes('CHEQUERED FLAG'))
  );
  const chequeredTime = chequeredFlagEvent?.date ? new Date(chequeredFlagEvent.date).getTime() : undefined;

  // 3. Process every broadcast team radio clip (no arbitrary discarding!)
  const highlights: RaceHighlight[] = [];

  for (const clip of teamRadio) {
    const clipTime = new Date(clip.date).getTime();
    if (isNaN(clipTime)) continue;

    // Filter out stray clips from previous sessions or support races (e.g. F1 Academy, Porsche Supercup, Qualifying)
    // Allow up to 10 minutes before lights out (formation lap & grid radio)
    if (overallMinLapTime !== Infinity && clipTime < overallMinLapTime - 10 * 60 * 1000) {
      continue;
    }

    // Allow up to 30 minutes after chequered flag or last recorded lap
    const sessionEndTime = chequeredTime || (overallMaxLapTime !== -Infinity ? overallMaxLapTime + 15 * 60 * 1000 : Infinity);
    if (sessionEndTime !== Infinity && clipTime > sessionEndTime + 30 * 60 * 1000) {
      continue;
    }

    const driverNum = clip.driverNumber;
    const meta = driverMetaMap.get(driverNum) ?? {
      driverId: clip.driverId || `driver_${driverNum}`,
      driverNumber: driverNum,
      driverName: `Car #${driverNum}`,
      driverSurname: `CAR #${driverNum}`,
      driverCode: undefined,
    };

    // Resolve accurate Lap Number
    let lap = 0;
    const driverLaps = driverLapsMap.get(driverNum);
    if (driverLaps && driverLaps.length > 0) {
      for (let i = driverLaps.length - 1; i >= 0; i--) {
        if (driverLaps[i].startTime <= clipTime) {
          lap = driverLaps[i].lapNumber;
          break;
        }
      }
      if (lap === 0) lap = driverLaps[0].lapNumber;
    }

    // Fallback: estimate from leader's laps if driver has no lap log
    if (lap === 0 && driverLapsMap.size > 0) {
      for (const lapsList of driverLapsMap.values()) {
        for (let i = lapsList.length - 1; i >= 0; i--) {
          if (lapsList[i].startTime <= clipTime) {
            lap = Math.max(lap, lapsList[i].lapNumber);
            break;
          }
        }
      }
    }
    if (lap === 0) lap = 1;

    let category: RaceHighlightCategory = 'team_radio';
    let score = 50;
    let transcript: string | null = clip.transcript ?? null;
    let description = 'Official Team Radio Broadcast';

    const dnfInfo = dnfMap.get(driverNum);
    const isRetirement =
      dnfInfo &&
      ((dnfInfo.retirementTime && Math.abs(clipTime - dnfInfo.retirementTime) <= 3 * 60 * 1000) ||
        (!dnfInfo.retirementTime && Math.abs(lap - dnfInfo.laps) <= 1 && clipTime >= overallMinLapTime));

    if (
      winnerNumber === driverNum &&
      chequeredTime &&
      clipTime >= chequeredTime - 30_000 &&
      clipTime <= chequeredTime + 10 * 60 * 1000
    ) {
      // Victory / Checkered Flag celebration
      category = 'victory';
      score = 95;
      description = `${meta.driverName} victory celebration & chequered flag radio`;
    } else if (isRetirement) {
      // DNF Reaction
      category = 'dnf';
      score = 90;
      description = `${meta.driverName} retirement communication (${dnfInfo.status})`;
    } else {
      // Check Safety Car / VSC
      const scEvent = raceControlEvents.find((e) => {
        if (e.type !== 'safety_car' && e.type !== 'vsc' && e.type !== 'red_flag') return false;
        if (!e.date) return false;
        const eTime = new Date(e.date).getTime();
        if (isNaN(eTime)) return false;
        // Must not precede deployment
        if (clipTime < eTime - 15_000) return false;
        // Near deployment broadcast
        if (Math.abs(eTime - clipTime) <= 60_000) return true;
        // Within valid lap range
        if (e.lap !== undefined && e.endLap !== undefined && lap >= e.lap && lap <= e.endLap) {
          return true;
        }
        return false;
      });

      if (scEvent) {
        category = scEvent.type === 'safety_car' ? 'safety_car' : scEvent.type === 'vsc' ? 'vsc' : 'red_flag';
        score = 80;
        description = scEvent.type === 'safety_car' ? 'Safety Car Period' : scEvent.type === 'vsc' ? 'Virtual Safety Car Period' : 'Red Flag Period';
      } else {
        // Check Pit Stop window
        const matchingPit = pitStops.find((pit) => {
          if (pit.driverNumber !== driverNum) return false;
          if (pit.date) {
            const pitTime = new Date(pit.date).getTime();
            if (!isNaN(pitTime)) {
              return Math.abs(pitTime - clipTime) <= 45_000;
            }
          }
          // Only fallback to same-lap if pit.date is missing/invalid
          return Boolean(pit.lapNumber && pit.lapNumber === lap);
        });

        if (matchingPit) {
          category = 'pit_stop';
          score = 75;
          description = 'Pit Stop Window';
        } else {
          // Generic team radio: calculate score based on finishing position and race stage
          const finishPos = driverFinishPosMap.get(driverNum);
          if (finishPos !== undefined) {
            if (finishPos <= 3) score = 65;
            else if (finishPos <= 6) score = 60;
            else if (finishPos <= 10) score = 55;
            else score = 45;
          }

          // Penalize lap 1 routine radio checks (typically 1-second static/bleeps)
          if (lap <= 1) {
            score = 15;
          }

          // Late-race battle bonus
          if (lap >= 45) {
            score += 10;
          }
        }
      }
    }

    // Deprecate bleeped/empty noise transcripts (e.g. "." or single characters)
    if (transcript != null) {
      const alphanumeric = transcript.replace(/[^a-zA-Z0-9]/g, '').trim();
      if (alphanumeric.length < 3) {
        score = Math.min(score, 10);
      }
    }

    // Official F1 TV On-Screen Graphic Title: e.g. "NORRIS RADIO", "HAMILTON RADIO"
    const title = `${meta.driverSurname} RADIO`;
    const highlightId = buildHighlightId(category, lap, driverNum, clip.date, clip.recordingUrl);

    highlights.push({
      id: highlightId,
      category,
      lap,
      timestamp: clip.date,
      title,
      description,
      driverNumber: driverNum,
      driverId: meta.driverId,
      driverName: meta.driverName,
      driverCode: meta.driverCode,
      teamName: meta.teamName,
      teamColour: meta.teamColour,
      radioClip: clip,
      transcript,
      significanceScore: score,
    });
  }

  // Sort chronologically by lap ascending, then timestamp
  return highlights.sort((a, b) => {
    if (a.lap !== b.lap) return a.lap - b.lap;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}
