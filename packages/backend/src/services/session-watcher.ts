import type {
  LiveSessionState,
  LiveDriverState,
  Race,
} from '../types/f1';
import type {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position,
  OpenF1Interval,
  OpenF1Lap,
  OpenF1Stint,
  OpenF1Weather,
  OpenF1RaceControl,
} from '../types/openf1-types';
import {
  openF1Fetch,
  getOpenF1Drivers,
  getOpenF1Stints,
  getOpenF1Weather,
  getOpenF1RaceControlEvents,
  buildDriverMap,
} from './openf1';
import {
  mapRaceControlEvents,
  mapWeather,
  normalizeCompound,
} from './openf1-mapper';
import { getRaceSchedule, getCurrentSeason } from './jolpica';
import { livePollingEngine } from './live-polling';
import { cache } from './cache';

interface ActiveCalendarSession {
  race: Race;
  sessionType: string;
  sessionName: string;
  dateStart: string;
  dateEnd: string;
}

function findActiveCalendarSession(races: Race[], nowMs = Date.now()): ActiveCalendarSession | null {
  for (const race of races) {
    const candidateSessions: Array<{ name: string; type: string; date?: string; time?: string; durationMinutes: number }> = [
      { name: 'Practice 1', type: 'Practice', date: race.FirstPractice?.date, time: race.FirstPractice?.time, durationMinutes: 60 },
      { name: 'Practice 2', type: 'Practice', date: race.SecondPractice?.date, time: race.SecondPractice?.time, durationMinutes: 60 },
      { name: 'Practice 3', type: 'Practice', date: race.ThirdPractice?.date, time: race.ThirdPractice?.time, durationMinutes: 60 },
      { name: 'Sprint Qualifying', type: 'Sprint Qualifying', date: race.SprintQualifying?.date, time: race.SprintQualifying?.time, durationMinutes: 44 },
      { name: 'Sprint', type: 'Sprint', date: race.Sprint?.date, time: race.Sprint?.time, durationMinutes: 60 },
      { name: 'Qualifying', type: 'Qualifying', date: race.Qualifying?.date, time: race.Qualifying?.time, durationMinutes: 60 },
      { name: 'Race', type: 'Race', date: race.date, time: race.time, durationMinutes: 150 },
    ];

    for (const session of candidateSessions) {
      if (!session.date) continue;
      const timeStr = session.time ? (session.time.endsWith('Z') ? session.time : `${session.time}Z`) : '13:00:00Z';
      const startMs = new Date(`${session.date}T${timeStr}`).getTime() - 15 * 60 * 1000;
      const endMs = startMs + 15 * 60 * 1000 + (session.durationMinutes + 20) * 60 * 1000;

      if (nowMs >= startMs && nowMs <= endMs) {
        return {
          race,
          sessionType: session.type,
          sessionName: `${race.raceName} — ${session.name}`,
          dateStart: `${session.date}T${timeStr}`,
          dateEnd: new Date(startMs + 15 * 60 * 1000 + session.durationMinutes * 60 * 1000).toISOString(),
        };
      }
    }
  }

  return null;
}

const CHECK_INTERVAL_MS = 60000; // 60s background check
const LAZY_CHECK_THROTTLE_MS = 20000; // 20s throttle on client requests
const SNAPSHOT_CACHE_TTL_SEC = 3600; // 1 hour for completed sessions

export class SessionWatcher {
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;
  private lastCheckTimestamp = 0;
  private cachedSnapshot: LiveSessionState | null = null;

  /**
   * Starts the background lifecycle checker (runs every 60s).
   */
  public startWatcher(intervalMs = CHECK_INTERVAL_MS): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Run first check asynchronously on startup
    this.checkLifecycle().catch((err) => {
      console.warn('[SessionWatcher] Startup check error:', err instanceof Error ? err.message : err);
    });

    this.timer = setInterval(() => {
      this.checkLifecycle().catch((err) => {
        console.warn('[SessionWatcher] Lifecycle check error:', err instanceof Error ? err.message : err);
      });
    }, intervalMs);

    console.log(`[SessionWatcher] Session lifecycle watcher started (interval: ${intervalMs / 1000}s).`);
  }

  /**
   * Stops the background watcher timer.
   */
  public stopWatcher(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[SessionWatcher] Session lifecycle watcher stopped.');
    }
  }

  /**
   * Ensures live session state is current.
   * Called by /api/live/state and /api/live/stream for instant wakeups.
   */
  public async ensureSessionState(): Promise<LiveSessionState> {
    if (livePollingEngine.isActive()) {
      return livePollingEngine.getState();
    }

    const now = Date.now();
    // Throttle checks on high-traffic client requests
    if (now - this.lastCheckTimestamp < LAZY_CHECK_THROTTLE_MS) {
      return this.cachedSnapshot || livePollingEngine.getState();
    }

    await this.checkLifecycle();

    if (livePollingEngine.isActive()) {
      return livePollingEngine.getState();
    }

    return this.cachedSnapshot || livePollingEngine.getState();
  }

  /**
   * Evaluates OpenF1 latest session time window against current time.
   * Auto-starts engine when in-session, auto-stops when concluded,
   * and hydrates completed snapshot when idle.
   */
  public async checkLifecycle(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    this.lastCheckTimestamp = Date.now();

    try {
      let isOpenF1Restricted = false;
      const latestSessions = await openF1Fetch<OpenF1Session>('/sessions', { session_key: 'latest' })
        .catch((err) => {
          if (
            err?.status === 401 ||
            err?.isLiveRestricted ||
            (typeof err?.message === 'string' &&
              (err.message.includes('401') || err.message.includes('Live F1 session in progress')))
          ) {
            isOpenF1Restricted = true;
          }
          return [];
        });

      const now = Date.now();

      // If OpenF1 blocked the request with 401 (or returned no sessions during an active weekend),
      // cross-reference against the official Jolpica race calendar
      if (isOpenF1Restricted || latestSessions.length === 0) {
        const schedule = await getRaceSchedule(getCurrentSeason()).catch(() => []);
        const activeCalendar = findActiveCalendarSession(schedule, now);

        if (activeCalendar) {
          if (livePollingEngine.isActive()) {
            livePollingEngine.stop();
          }

          const liveRestrictedState: LiveSessionState = {
            sessionKey: null,
            meetingKey: null,
            sessionType: activeCalendar.sessionType,
            sessionName: activeCalendar.sessionName,
            circuitShortName: activeCalendar.race.Circuit.circuitName,
            countryName: activeCalendar.race.Circuit.Location.country,
            dateStart: activeCalendar.dateStart,
            dateEnd: activeCalendar.dateEnd,
            isActive: true,
            status: 'LIVE',
            isRestricted: true,
            restrictionMessage: isOpenF1Restricted
              ? 'OpenF1 live telemetry is restricted to authenticated accounts during official live F1 sessions. Configure OPENF1_API_KEY in packages/backend/.env for full live telemetry streaming.'
              : 'Official live session in progress according to FIA schedule.',
            lastUpdated: new Date().toISOString(),
            drivers: [],
            raceControlFeed: [],
            weather: null,
          };

          this.cachedSnapshot = liveRestrictedState;
          livePollingEngine.setCompletedState(liveRestrictedState);
          return;
        }

        // If neither OpenF1 nor calendar indicates a live session, and snapshot was restricted, clear it
        if (this.cachedSnapshot?.isRestricted) {
          this.cachedSnapshot = null;
        }
        return;
      }

      const session = latestSessions[0];
      if (!session.date_start || !session.date_end) {
        return;
      }

      // Active window: 15 minutes before green light to 20 minutes after chequered flag
      const startMs = new Date(session.date_start).getTime() - 15 * 60 * 1000;
      const endMs = new Date(session.date_end).getTime() + 20 * 60 * 1000;
      const isCurrentlyActive = now >= startMs && now <= endMs;

      if (isCurrentlyActive) {
        const engineActive = livePollingEngine.isActive();
        const currentSessionKey = livePollingEngine.getSessionKey();

        if (!engineActive || currentSessionKey !== session.session_key) {
          console.log(
            `[SessionWatcher] Active session detected: "${session.session_name}" at ${session.circuit_short_name} (${session.session_key}). Auto-starting live engine...`
          );
          await livePollingEngine.start(session.session_key);
        }
      } else if (now > endMs) {
        // Concluded session: stop live engine if still running and hydrate completed snapshot
        if (livePollingEngine.isActive()) {
          console.log(
            `[SessionWatcher] Session "${session.session_name}" (${session.session_key}) window has ended. Auto-stopping live engine...`
          );
          livePollingEngine.stop();
        }

        // Hydrate latest completed session snapshot so users have full classifications
        await this.hydrateCompletedSnapshot(session);
      } else {
        // Upcoming session (now < startMs): publish UPCOMING state, do not hydrate as completed
        if (livePollingEngine.isActive()) {
          livePollingEngine.stop();
        }

        const upcomingState: LiveSessionState = {
          sessionKey: session.session_key,
          meetingKey: session.meeting_key,
          sessionType: session.session_type,
          sessionName: session.session_name,
          circuitShortName: session.circuit_short_name,
          countryName: session.country_name,
          dateStart: session.date_start,
          dateEnd: session.date_end,
          isActive: false,
          status: 'UPCOMING',
          lastUpdated: new Date().toISOString(),
          drivers: [],
          raceControlFeed: [],
          weather: null,
        };

        this.cachedSnapshot = upcomingState;
        livePollingEngine.setCompletedState(upcomingState);
      }
    } catch (err) {
      console.warn('[SessionWatcher] Error checking session lifecycle:', err instanceof Error ? err.message : err);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Fetches and aggregates the latest completed session classification and telemetry snapshot.
   */
  public async hydrateCompletedSnapshot(session: OpenF1Session): Promise<LiveSessionState | null> {
    const sessionKey = session.session_key;
    const cacheKey = `f1:openf1:completed_snapshot:v2:${sessionKey}`;

    // 1. Check Redis cache first
    const cached = await cache.get<LiveSessionState>(cacheKey);
    if (cached) {
      this.cachedSnapshot = cached;
      livePollingEngine.setCompletedState(cached);
      return cached;
    }

    try {
      // 2. Fetch session records in parallel
      const [
        drivers,
        canonicalMap,
        positions,
        intervals,
        laps,
        stints,
        weather,
        raceControl,
      ] = await Promise.all([
        getOpenF1Drivers(sessionKey).catch(() => [] as OpenF1Driver[]),
        buildDriverMap(sessionKey).catch(() => new Map<number, string>()),
        openF1Fetch<OpenF1Position>('/position', { session_key: sessionKey }).catch(() => [] as OpenF1Position[]),
        openF1Fetch<OpenF1Interval>('/intervals', { session_key: sessionKey }).catch(() => [] as OpenF1Interval[]),
        openF1Fetch<OpenF1Lap>('/laps', { session_key: sessionKey }).catch(() => [] as OpenF1Lap[]),
        getOpenF1Stints(sessionKey).catch(() => [] as OpenF1Stint[]),
        getOpenF1Weather(sessionKey).catch(() => [] as OpenF1Weather[]),
        getOpenF1RaceControlEvents(sessionKey).catch(() => [] as OpenF1RaceControl[]),
      ]);

      if (drivers.length === 0) {
        return null;
      }

      // Map final positions (last recorded position sample per driver)
      const lastPosByDriver = new Map<number, number>();
      for (const p of positions) {
        lastPosByDriver.set(p.driver_number, p.position);
      }

      // Map latest valid lap duration per driver
      const latestLapByDriver = new Map<number, { lapNumber: number; duration: number }>();
      for (const l of laps) {
        if (typeof l.lap_duration === 'number' && l.lap_duration > 0 && typeof l.lap_number === 'number') {
          const current = latestLapByDriver.get(l.driver_number);
          if (!current || l.lap_number > current.lapNumber) {
            latestLapByDriver.set(l.driver_number, {
              lapNumber: l.lap_number,
              duration: l.lap_duration,
            });
          }
        }
      }

      // Map latest interval / gap
      const lastIntervalByDriver = new Map<number, { gap: string | number | null; interval: string | number | null }>();
      for (const it of intervals) {
        lastIntervalByDriver.set(it.driver_number, {
          gap: it.gap_to_leader,
          interval: it.interval,
        });
      }

      // Map latest compound per driver
      const latestCompoundByDriver = new Map<number, { compound: string; stintLaps: number }>();
      for (const s of stints) {
        latestCompoundByDriver.set(s.driver_number, {
          compound: s.compound,
          stintLaps: (s.lap_end || 1) - (s.lap_start || 1) + 1,
        });
      }

      // Build classified drivers
      const classifiedDrivers: LiveDriverState[] = drivers.map((d) => {
        const canonicalId = canonicalMap.get(d.driver_number) || (d.last_name
          ? `${d.first_name || ''}_${d.last_name}`.toLowerCase().replace(/\s+/g, '_')
          : `driver_${d.driver_number}`);

        const position = lastPosByDriver.get(d.driver_number) ?? 20;
        const lastLap = latestLapByDriver.get(d.driver_number)?.duration ?? null;
        const intervalData = lastIntervalByDriver.get(d.driver_number);
        const compoundData = latestCompoundByDriver.get(d.driver_number);

        return {
          driverNumber: d.driver_number,
          driverId: canonicalId,
          code: d.name_acronym,
          name: d.full_name || `${d.first_name} ${d.last_name}`,
          teamName: d.team_name,
          teamColour: d.team_colour ? `#${d.team_colour}` : undefined,
          position,
          gapToLeader: position === 1 ? null : intervalData?.gap ?? '—',
          interval: position === 1 ? null : intervalData?.interval ?? '—',
          lastLapDuration: lastLap,
          currentCompound: normalizeCompound(compoundData?.compound),
          currentStintLaps: compoundData?.stintLaps ?? 0,
          sector1: null,
          sector2: null,
          sector3: null,
          speedTrap: null,
          isPitOutLap: false,
        };
      });

      // Sort by final position
      classifiedDrivers.sort((a, b) => a.position - b.position);

      const mappedWeather = mapWeather(weather);
      const mappedRaceControl = mapRaceControlEvents(raceControl);

      const snapshot: LiveSessionState = {
        sessionKey: session.session_key,
        meetingKey: session.meeting_key,
        sessionType: session.session_type,
        sessionName: session.session_name,
        circuitShortName: session.circuit_short_name,
        countryName: session.country_name,
        dateStart: session.date_start,
        dateEnd: session.date_end,
        isActive: false,
        status: 'COMPLETED',
        lastUpdated: new Date().toISOString(),
        drivers: classifiedDrivers,
        raceControlFeed: mappedRaceControl,
        weather: mappedWeather.length > 0 ? mappedWeather[mappedWeather.length - 1] : null,
      };

      // Cache snapshot
      await cache.set(cacheKey, snapshot, SNAPSHOT_CACHE_TTL_SEC);
      this.cachedSnapshot = snapshot;
      livePollingEngine.setCompletedState(snapshot);

      console.log(
        `[SessionWatcher] Hydrated completed session snapshot for "${session.session_name}" (${session.session_key}) with ${classifiedDrivers.length} classified drivers.`
      );
      return snapshot;
    } catch (err) {
      console.warn('[SessionWatcher] Error hydrating completed snapshot:', err instanceof Error ? err.message : err);
      return null;
    }
  }
}

// Singleton export
export const sessionWatcher = new SessionWatcher();
export const startSessionWatcher = () => sessionWatcher.startWatcher();
