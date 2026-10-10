import type { Race, SessionScheduleOverride, SessionScheduleStatus, F1Session } from '../types/f1';
import type { OpenF1Session, OpenF1RaceControl } from '../types/openf1-types';
import { openF1Fetch } from './openf1';
import { isRaceWeekend } from './jolpica';
import { cache } from './cache';

interface SessionTargetConfig {
  code: 'P1' | 'P2' | 'P3' | 'QUALY' | 'SQ' | 'SPRINT' | 'RACE';
  name: string;
  durationMinutes: number;
  openF1NamePattern: RegExp;
  getSession: (race: Race) => F1Session | undefined;
  setSession?: (race: Race, session: F1Session) => void;
}

const SESSION_TARGETS: SessionTargetConfig[] = [
  {
    code: 'P1',
    name: 'Practice 1',
    durationMinutes: 60,
    openF1NamePattern: /practice\s*1/i,
    getSession: (r) => r.FirstPractice,
    setSession: (r, s) => { r.FirstPractice = s; },
  },
  {
    code: 'P2',
    name: 'Practice 2',
    durationMinutes: 60,
    openF1NamePattern: /practice\s*2/i,
    getSession: (r) => r.SecondPractice,
    setSession: (r, s) => { r.SecondPractice = s; },
  },
  {
    code: 'P3',
    name: 'Practice 3',
    durationMinutes: 60,
    openF1NamePattern: /practice\s*3/i,
    getSession: (r) => r.ThirdPractice,
    setSession: (r, s) => { r.ThirdPractice = s; },
  },
  {
    code: 'SQ',
    name: 'Sprint Qualifying',
    durationMinutes: 45,
    openF1NamePattern: /sprint\s*qualifying|sprint\s*shootout/i,
    getSession: (r) => r.SprintQualifying || r.SprintShootout,
    setSession: (r, s) => {
      if (r.SprintQualifying) r.SprintQualifying = s;
      else r.SprintShootout = s;
    },
  },
  {
    code: 'SPRINT',
    name: 'Sprint',
    durationMinutes: 60,
    openF1NamePattern: /^sprint$/i,
    getSession: (r) => r.Sprint,
    setSession: (r, s) => { r.Sprint = s; },
  },
  {
    code: 'QUALY',
    name: 'Qualifying',
    durationMinutes: 75,
    openF1NamePattern: /^qualifying$/i,
    getSession: (r) => r.Qualifying,
    setSession: (r, s) => { r.Qualifying = s; },
  },
  {
    code: 'RACE',
    name: 'Race',
    durationMinutes: 150,
    openF1NamePattern: /^race$/i,
    getSession: (r) => ({ date: r.date, time: r.time }),
    setSession: (r, s) => {
      r.date = s.date;
      r.time = s.time;
    },
  },
];

/**
 * Builds mock schedule overrides for development testing and verification.
 */
function buildMockScheduleOverrides(race: Race, scenario: string): SessionScheduleOverride[] {
  const now = new Date();
  const scenarioLower = scenario.toLowerCase();

  // Scenario 1: Qualifying delayed by 1 hour (e.g. weather / rain delay)
  if (
    scenarioLower === 'qualy_delayed_1h' ||
    scenarioLower === 'qualy_delay' ||
    scenarioLower === 'rain_delay' ||
    scenarioLower === 'true'
  ) {
    const qualy = race.Qualifying ?? {
      date: race.date,
      time: race.time ? `${parseInt(race.time.split(':')[0] || '14', 10) - 2}:00:00Z` : '15:00:00Z',
    };

    const origTimeStr = qualy.time ?? '15:00:00Z';
    const cleanTime = origTimeStr.endsWith('Z') ? origTimeStr : `${origTimeStr}Z`;
    const origDate = new Date(`${qualy.date}T${cleanTime}`);
    const revisedDate = new Date(origDate.getTime() + 60 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const revTimeStr = `${pad(revisedDate.getUTCHours())}:${pad(revisedDate.getUTCMinutes())}:${pad(revisedDate.getUTCSeconds())}Z`;
    const revDateStr = `${revisedDate.getUTCFullYear()}-${pad(revisedDate.getUTCMonth() + 1)}-${pad(revisedDate.getUTCDate())}`;

    return [
      {
        sessionCode: 'QUALY',
        sessionName: 'Qualifying',
        status: 'DELAYED',
        originalDate: qualy.date,
        originalTime: qualy.time,
        revisedDate: revDateStr,
        revisedTime: revTimeStr,
        deltaMinutes: 60,
        reason: 'Delayed by 60 min due to adverse weather & track conditions (FIA Race Control)',
        lastNotice: 'START DELAYED - ESTIMATED START TIME ' + revTimeStr.slice(0, 5) + ' UTC',
        lastUpdated: now.toISOString(),
      },
    ];
  }

  // Scenario 2: Main race delayed by 30 minutes
  if (scenarioLower === 'race_delayed_30m' || scenarioLower === 'race_delay') {
    const origTimeStr = race.time ?? '14:00:00Z';
    const cleanTime = origTimeStr.endsWith('Z') ? origTimeStr : `${origTimeStr}Z`;
    const origDate = new Date(`${race.date}T${cleanTime}`);
    const revisedDate = new Date(origDate.getTime() + 30 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const revTimeStr = `${pad(revisedDate.getUTCHours())}:${pad(revisedDate.getUTCMinutes())}:${pad(revisedDate.getUTCSeconds())}Z`;
    const revDateStr = `${revisedDate.getUTCFullYear()}-${pad(revisedDate.getUTCMonth() + 1)}-${pad(revisedDate.getUTCDate())}`;

    return [
      {
        sessionCode: 'RACE',
        sessionName: 'Race',
        status: 'DELAYED',
        originalDate: race.date,
        originalTime: race.time,
        revisedDate: revDateStr,
        revisedTime: revTimeStr,
        deltaMinutes: 30,
        reason: 'Formation lap delayed by 30 minutes — standing water in Sector 2',
        lastNotice: 'START DELAYED - ESTIMATED START TIME ' + revTimeStr.slice(0, 5) + ' UTC',
        lastUpdated: now.toISOString(),
      },
    ];
  }

  // Scenario 3: Sprint rescheduled to different time
  if (scenarioLower === 'sprint_rescheduled' || scenarioLower === 'sprint_delay') {
    const sprint = race.Sprint ?? { date: race.date, time: '11:00:00Z' };
    const origTimeStr = sprint.time ?? '11:00:00Z';
    const cleanTime = origTimeStr.endsWith('Z') ? origTimeStr : `${origTimeStr}Z`;
    const origDate = new Date(`${sprint.date}T${cleanTime}`);
    const revisedDate = new Date(origDate.getTime() + 90 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const revTimeStr = `${pad(revisedDate.getUTCHours())}:${pad(revisedDate.getUTCMinutes())}:${pad(revisedDate.getUTCSeconds())}Z`;
    const revDateStr = `${revisedDate.getUTCFullYear()}-${pad(revisedDate.getUTCMonth() + 1)}-${pad(revisedDate.getUTCDate())}`;

    return [
      {
        sessionCode: 'SPRINT',
        sessionName: 'Sprint',
        status: 'RESCHEDULED',
        originalDate: sprint.date,
        originalTime: sprint.time,
        revisedDate: revDateStr,
        revisedTime: revTimeStr,
        deltaMinutes: 90,
        reason: 'Sprint timetable rescheduled per FIA Bulletin',
        lastNotice: 'OFFICIAL TIMETABLE REVISION',
        lastUpdated: now.toISOString(),
      },
    ];
  }

  return [];
}

/**
 * Parses an OpenF1 GMT offset string (e.g. "+02:00", "-04:00:00", "08:00:00") into total minutes.
 */
function parseGmtOffsetToMinutes(offsetStr?: string): number {
  if (!offsetStr) return 0;
  const isNeg = offsetStr.startsWith('-');
  const clean = offsetStr.replace(/^[+-]/, '');
  const parts = clean.split(':').map((p) => parseInt(p, 10) || 0);
  const totalMinutes = (parts[0] || 0) * 60 + (parts[1] || 0);
  return isNeg ? -totalMinutes : totalMinutes;
}

/**
 * Detects discrepancies between Jolpica scheduled times and OpenF1 official times,
 * and parses FIA Race Control messages for real-time start delays.
 */
export async function detectScheduleOverrides(
  race: Race,
  mockScenario?: string
): Promise<SessionScheduleOverride[]> {
  // If mock scenario requested, serve immediately without external API lookups (dev only or explicit opt-in)
  const mocksEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SCHEDULE_MOCKS === 'true';
  if (mocksEnabled && typeof mockScenario === 'string' && mockScenario.trim().length > 0) {
    return buildMockScheduleOverrides(race, mockScenario.trim());
  }

  const seasonNum = parseInt(race.season, 10);
  if (isNaN(seasonNum) || seasonNum < 2023) {
    return [];
  }

  const cacheKey = `f1:schedule:overrides:v2:${race.season}:${race.round}`;
  const ttl = isRaceWeekend() ? 45 : 300; // 45s on race weekend, 5m midweek

  const cached = await cache.get<SessionScheduleOverride[]>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  try {
    // 1. Fetch OpenF1 sessions for this year
    const openF1Sessions = await openF1Fetch<OpenF1Session>('/sessions', { year: seasonNum }).catch(() => []);
    if (!openF1Sessions || openF1Sessions.length === 0) {
      await cache.set(cacheKey, [], ttl);
      return [];
    }

    // 2. Correlate sessions for this Grand Prix weekend
    const jDate = race.date; // e.g. "2025-10-05"
    const jCircuit = race.Circuit.circuitName.toLowerCase();
    const jLoc = race.Circuit.Location.locality.toLowerCase();
    const jCountry = race.Circuit.Location.country.toLowerCase();

    // Restrict meeting matching to the race weekend around jDate
    const rTime = jDate ? new Date(`${jDate}T12:00:00Z`).getTime() : NaN;
    const withinWeekend = (s: OpenF1Session) =>
      !isNaN(rTime) &&
      !!s.date_start &&
      Math.abs(new Date(s.date_start).getTime() - rTime) <= 4 * 24 * 60 * 60 * 1000;

    // Find all OpenF1 sessions for this meeting
    let meetingSessions = openF1Sessions.filter((s) => {
      if (!withinWeekend(s)) return false;
      const sCircuit = (s.circuit_short_name ?? '').toLowerCase();
      const sLoc = (s.location ?? '').toLowerCase();
      const sCountry = (s.country_name ?? '').toLowerCase();

      return (
        (sCircuit && jCircuit.includes(sCircuit)) ||
        (sLoc && jLoc.includes(sLoc)) ||
        (sCountry && jCountry === sCountry)
      );
    });

    if (meetingSessions.length === 0 && !isNaN(rTime)) {
      // Proximity fallback: within 4 days of main race date
      meetingSessions = openF1Sessions.filter((s) => withinWeekend(s));
    }

    if (meetingSessions.length === 0) {
      await cache.set(cacheKey, [], ttl);
      return [];
    }

    const overrides: SessionScheduleOverride[] = [];
    const pad = (n: number) => n.toString().padStart(2, '0');

    // 3. Inspect each session in the race schedule
    for (const target of SESSION_TARGETS) {
      const jSession = target.getSession(race);
      if (!jSession || !jSession.date) continue;

      // Match OpenF1 session for this target
      const matchedOpenF1 = meetingSessions.find((s) => target.openF1NamePattern.test(s.session_name ?? ''));
      if (!matchedOpenF1 || !matchedOpenF1.date_start) continue;

      const cleanJTime = jSession.time
        ? jSession.time.endsWith('Z')
          ? jSession.time
          : `${jSession.time}Z`
        : '12:00:00Z';

      const jStart = new Date(`${jSession.date}T${cleanJTime}`);
      const oStart = new Date(matchedOpenF1.date_start);

      if (isNaN(jStart.getTime()) || isNaN(oStart.getTime())) continue;

      const deltaMs = oStart.getTime() - jStart.getTime();
      const deltaMinutes = Math.round(deltaMs / (60 * 1000));

      let isDelayedOrRescheduled = Math.abs(deltaMinutes) >= 5;
      let reason: string | undefined;
      let lastNotice: string | undefined;
      let status: SessionScheduleStatus = deltaMinutes > 0 ? 'DELAYED' : 'RESCHEDULED';

      if (matchedOpenF1.is_cancelled) {
        status = 'CANCELLED';
        isDelayedOrRescheduled = true;
        reason = 'Session cancelled by FIA';
      }

      // 4. Check OpenF1 Race Control messages for real-time delay announcements
      try {
        const rcEvents = await openF1Fetch<OpenF1RaceControl>('/race_control', {
          session_key: matchedOpenF1.session_key,
        }).catch(() => []);

        if (rcEvents.length > 0) {
          // Look for delay notices in recent race control messages
          const delayNotice = [...rcEvents].reverse().find((rc) => {
            const msg = (rc.message ?? '').toUpperCase();
            return (
              msg.includes('DELAYED') ||
              msg.includes('POSTPONED') ||
              msg.includes('ESTIMATED START TIME') ||
              (msg.includes('WEATHER') && (msg.includes('DELAY') || msg.includes('POSTPONE') || msg.includes('SUSPEND')))
            );
          });

          if (delayNotice) {
            isDelayedOrRescheduled = true;
            status = 'DELAYED';
            lastNotice = delayNotice.message;
            reason = delayNotice.message;

            // If start delay message gives a specific revised time (e.g. "ESTIMATED START TIME 17:15")
            const timeMatch = delayNotice.message.match(/ESTIMATED START TIME[:\s-]+(\d{1,2}):(\d{2})/i);
            if (timeMatch) {
              const estH = parseInt(timeMatch[1], 10);
              const estM = parseInt(timeMatch[2], 10);

              // Convert track-local estimated start time to UTC using session gmt_offset
              const offsetMinutes = parseGmtOffsetToMinutes(matchedOpenF1.gmt_offset);
              const localTrackDate = new Date(oStart.getTime() + offsetMinutes * 60 * 1000);
              const newUtcMs =
                Date.UTC(
                  localTrackDate.getUTCFullYear(),
                  localTrackDate.getUTCMonth(),
                  localTrackDate.getUTCDate(),
                  estH,
                  estM,
                  0
                ) - offsetMinutes * 60 * 1000;

              const parsedDate = new Date(newUtcMs);
              const rcDeltaMs = parsedDate.getTime() - jStart.getTime();
              const rcDeltaMin = Math.round(rcDeltaMs / (60 * 1000));
              if (Math.abs(rcDeltaMin) > 0) {
                // Use race control revised time
                oStart.setTime(parsedDate.getTime());
              }
            }
          }
        }
      } catch {
        // Race control lookup failure is non-fatal; proceed with timetable comparison
      }

      if (isDelayedOrRescheduled) {
        const revTimeStr = `${pad(oStart.getUTCHours())}:${pad(oStart.getUTCMinutes())}:${pad(oStart.getUTCSeconds())}Z`;
        const revDateStr = `${oStart.getUTCFullYear()}-${pad(oStart.getUTCMonth() + 1)}-${pad(oStart.getUTCDate())}`;

        // Check if date changed (e.g. moved to next day)
        if (revDateStr !== jSession.date && status !== 'CANCELLED') {
          status = 'POSTPONED';
        }

        const sessionEndMs = matchedOpenF1.date_end
          ? new Date(matchedOpenF1.date_end).getTime()
          : oStart.getTime() + target.durationMinutes * 60 * 1000;
        const nowMs = Date.now();
        const isCompleted = nowMs > sessionEndMs;

        overrides.push({
          sessionCode: target.code,
          sessionName: target.name,
          status,
          originalDate: jSession.date,
          originalTime: jSession.time,
          revisedDate: revDateStr,
          revisedTime: revTimeStr,
          deltaMinutes: Math.round((oStart.getTime() - jStart.getTime()) / 60000),
          reason:
            reason ??
            (deltaMinutes > 0
              ? `Delayed by ${Math.abs(deltaMinutes)}m per official FIA schedule`
              : `Rescheduled by ${Math.abs(deltaMinutes)}m per official FIA schedule`),
          lastNotice,
          lastUpdated: new Date().toISOString(),
          isCompleted,
        });
      }
    }

    await cache.set(cacheKey, overrides, ttl);
    return overrides;
  } catch (err) {
    console.warn('[ScheduleDetector] Error detecting schedule overrides:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Enriches a Jolpica race object with active schedule overrides.
 * Also dynamically updates the session times in the returned race object
 * so all countdown and timetable consumers automatically reflect authoritative revised times.
 */
export async function enrichRaceWithScheduleOverrides(
  race: Race,
  mockScenario?: string
): Promise<Race> {
  const overrides = await detectScheduleOverrides(race, mockScenario);
  if (!overrides || overrides.length === 0) {
    return { ...race, scheduleOverrides: [] };
  }

  // Clone race to avoid mutating cached base race object
  const enriched: Race = {
    ...race,
    scheduleOverrides: overrides,
  };

  // Update session start times to revised times
  for (const override of overrides) {
    const target = SESSION_TARGETS.find((t) => t.code === override.sessionCode);
    if (target?.setSession && override.revisedDate) {
      target.setSession(enriched, {
        date: override.revisedDate,
        time: override.revisedTime,
      });
    }
  }

  return enriched;
}
