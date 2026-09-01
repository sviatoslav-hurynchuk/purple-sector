import { EventEmitter } from 'events';
import type {
  LiveSessionState,
  LiveDriverState,
  RaceEvent,
  WeatherSnapshot,
  TireCompound,
} from '../types/f1';
import type {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Interval,
  OpenF1Position,
  OpenF1RaceControl,
  OpenF1Weather,
  OpenF1Stint,
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
import { cache } from './cache';

const POLL_INTERVAL_MS = 3500; // 3.5s per cycle (~17 req/min per endpoint)

interface DriverMeta {
  driverId: string;
  driverNumber: number;
  code?: string;
  name?: string;
  teamName?: string;
  teamColour?: string;
}

export class LivePollingEngine extends EventEmitter {
  private isRunning = false;
  private isPolling = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private sessionKey: number | null = null;
  private meetingKey: number | null = null;
  private sessionMeta: OpenF1Session | null = null;
  private driverMap = new Map<number, DriverMeta>();
  private cycleCount = 0;

  // Watermarks for incremental polling
  private lastIntervalDate: string | null = null;
  private lastPositionDate: string | null = null;
  private lastRaceControlDate: string | null = null;
  private lastWeatherDate: string | null = null;

  // In-memory aggregate state
  private state: LiveSessionState = {
    sessionKey: null,
    meetingKey: null,
    sessionType: 'Race',
    sessionName: 'No Active Session',
    isActive: false,
    lastUpdated: new Date().toISOString(),
    drivers: [],
    raceControlFeed: [],
    weather: null,
  };

  /**
   * Returns current aggregate live session state.
   */
  public getState(): LiveSessionState {
    return this.state;
  }

  /**
   * Returns whether the polling engine is currently active.
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Starts the polling loop for a given sessionKey (or resolves latest active session).
   */
  public async start(targetSessionKey?: number): Promise<boolean> {
    if (this.isRunning) {
      if (targetSessionKey && targetSessionKey === this.sessionKey) {
        return true;
      }
      this.stop();
    }

    let sKey = targetSessionKey;

    // Clear stale metadata from prior session
    this.sessionMeta = null;

    // 1. If sessionKey not provided, query latest session from OpenF1
    if (!sKey) {
      const latestSessions = await openF1Fetch<OpenF1Session>('/sessions', { session_key: 'latest' }).catch(() => []);
      if (!latestSessions || latestSessions.length === 0) {
        console.log('[LivePolling] No latest session found on OpenF1.');
        return false;
      }
      this.sessionMeta = latestSessions[0];
      sKey = this.sessionMeta.session_key;
    } else {
      // Fetch metadata for the explicit session key
      const sessions = await openF1Fetch<OpenF1Session>('/sessions', { session_key: sKey }).catch(() => []);
      if (sessions.length > 0) {
        this.sessionMeta = sessions[0];
      }
    }

    this.sessionKey = sKey;
    this.meetingKey = this.sessionMeta?.meeting_key ?? null;

    console.log(`[LivePolling] Starting live polling for session_key=${this.sessionKey}...`);

    // 2. Fetch session drivers and build driver registry with canonical Jolpica driver IDs
    const [openF1Drivers, canonicalMap] = await Promise.all([
      getOpenF1Drivers(this.sessionKey).catch(() => []),
      buildDriverMap(this.sessionKey).catch(() => new Map<number, string>()),
    ]);
    this.driverMap.clear();

    for (const d of openF1Drivers) {
      const canonicalId = canonicalMap.get(d.driver_number) || (d.last_name
        ? `${d.first_name || ''}_${d.last_name}`.toLowerCase().replace(/\s+/g, '_')
        : `driver_${d.driver_number}`);

      this.driverMap.set(d.driver_number, {
        driverId: canonicalId,
        driverNumber: d.driver_number,
        code: d.name_acronym,
        name: d.full_name || `${d.first_name} ${d.last_name}`,
        teamName: d.team_name,
        teamColour: d.team_colour ? `#${d.team_colour}` : undefined,
      });
    }

    // 3. Initialize driver states
    const initialDrivers: LiveDriverState[] = Array.from(this.driverMap.values()).map((meta, idx) => ({
      driverNumber: meta.driverNumber,
      driverId: meta.driverId,
      code: meta.code,
      name: meta.name,
      teamName: meta.teamName,
      teamColour: meta.teamColour,
      position: idx + 1,
      gapToLeader: idx === 0 ? null : '—',
      interval: idx === 0 ? null : '—',
      lastLapDuration: null,
      currentCompound: 'UNKNOWN',
      currentStintLaps: 0,
      sector1: null,
      sector2: null,
      sector3: null,
      speedTrap: null,
      isPitOutLap: false,
    }));

    // 4. Hydrate initial state
    const [initialStints, initialRaceControl, initialWeather] = await Promise.all([
      getOpenF1Stints(this.sessionKey).catch(() => []),
      getOpenF1RaceControlEvents(this.sessionKey).catch(() => []),
      getOpenF1Weather(this.sessionKey).catch(() => []),
    ]);

    // Apply stints to drivers
    for (const stint of initialStints) {
      const driver = initialDrivers.find((d) => d.driverNumber === stint.driver_number);
      if (driver) {
        driver.currentCompound = normalizeCompound(stint.compound);
        driver.currentStintLaps = (stint.lap_end || 1) - (stint.lap_start || 1) + 1;
      }
    }

    const mappedWeather = mapWeather(initialWeather);
    const mappedRaceControl = mapRaceControlEvents(initialRaceControl);

    this.state = {
      sessionKey: this.sessionKey,
      meetingKey: this.meetingKey,
      sessionType: this.sessionMeta?.session_type ?? 'Race',
      sessionName: this.sessionMeta?.session_name ?? 'Live Session',
      circuitShortName: this.sessionMeta?.circuit_short_name,
      countryName: this.sessionMeta?.country_name,
      dateStart: this.sessionMeta?.date_start,
      dateEnd: this.sessionMeta?.date_end,
      isActive: true,
      lastUpdated: new Date().toISOString(),
      drivers: initialDrivers,
      raceControlFeed: mappedRaceControl,
      weather: mappedWeather.length > 0 ? mappedWeather[mappedWeather.length - 1] : null,
    };

    // Set initial watermarks
    if (initialRaceControl.length > 0) {
      this.lastRaceControlDate = initialRaceControl[initialRaceControl.length - 1].date;
    }
    if (initialWeather.length > 0) {
      this.lastWeatherDate = initialWeather[initialWeather.length - 1].date;
    }

    this.isRunning = true;
    this.emit('start', { sessionKey: this.sessionKey });
    this.emit('state', this.state);

    // Save initial snapshot to Redis
    await cache.set(`f1:session:${this.sessionKey}:snapshot`, this.state, 15);

    // 5. Start poll loop
    this.scheduleNextPoll();
    return true;
  }

  /**
   * Stops the live polling loop and updates state.
   */
  public stop(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.isRunning = false;
    this.state.isActive = false;
    this.state.lastUpdated = new Date().toISOString();
    console.log(`[LivePolling] Stopped live polling for session_key=${this.sessionKey}`);
    this.emit('stop');
    this.emit('state', this.state);
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) return;

    this.pollTimer = setTimeout(async () => {
      await this.pollCycle();
      this.scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Executes a single polling iteration.
   */
  private async pollCycle(): Promise<void> {
    if (!this.isRunning || !this.sessionKey || this.isPolling) return;
    this.isPolling = true;
    this.cycleCount++;

    try {
      const sKey = this.sessionKey;

      // Intervals & Positions params with incremental watermark
      const intervalParams: Record<string, string | number> = { session_key: sKey };
      if (this.lastIntervalDate) {
        intervalParams['date>='] = this.lastIntervalDate;
      }

      const positionParams: Record<string, string | number> = { session_key: sKey };
      if (this.lastPositionDate) {
        positionParams['date>='] = this.lastPositionDate;
      }

      const raceControlParams: Record<string, string | number> = { session_key: sKey };
      if (this.lastRaceControlDate) {
        raceControlParams['date>='] = this.lastRaceControlDate;
      }

      // Fetch lightweight endpoints concurrently
      const [intervals, positions, raceControl] = await Promise.all([
        openF1Fetch<OpenF1Interval>('/intervals', intervalParams).catch(() => []),
        openF1Fetch<OpenF1Position>('/position', positionParams).catch(() => []),
        openF1Fetch<OpenF1RaceControl>('/race_control', raceControlParams).catch(() => []),
      ]);

      let stateChanged = false;

      // 1. Process Positions
      if (positions.length > 0) {
        for (const p of positions) {
          let driver = this.state.drivers.find((d) => d.driverNumber === p.driver_number);
          if (!driver) {
            const meta = this.driverMap.get(p.driver_number);
            driver = {
              driverNumber: p.driver_number,
              driverId: meta?.driverId ?? `driver_${p.driver_number}`,
              code: meta?.code,
              name: meta?.name,
              teamName: meta?.teamName,
              teamColour: meta?.teamColour,
              position: p.position,
              gapToLeader: '—',
              interval: '—',
              lastLapDuration: null,
              currentCompound: 'UNKNOWN',
              currentStintLaps: 0,
              sector1: null,
              sector2: null,
              sector3: null,
              speedTrap: null,
              isPitOutLap: false,
            };
            this.state.drivers.push(driver);
          }
          driver.position = p.position;
        }

        // Keep drivers array sorted by track position
        this.state.drivers.sort((a, b) => a.position - b.position);
        this.lastPositionDate = positions[positions.length - 1].date;
        stateChanged = true;
      }

      // 2. Process Intervals
      if (intervals.length > 0) {
        for (const it of intervals) {
          const driver = this.state.drivers.find((d) => d.driverNumber === it.driver_number);
          if (driver) {
            driver.gapToLeader = it.gap_to_leader;
            driver.interval = it.interval;
          }
        }
        this.lastIntervalDate = intervals[intervals.length - 1].date;
        stateChanged = true;
      }

      // 3. Process Race Control Messages (Safety Car, Flags, Penalties)
      if (raceControl.length > 0) {
        // Deduplicate: date>= is inclusive, so filter out events at the exact watermark
        const freshRaceControl = this.lastRaceControlDate
          ? raceControl.filter((rc) => rc.date > this.lastRaceControlDate!)
          : raceControl;

        if (freshRaceControl.length > 0) {
          const mappedEvents = mapRaceControlEvents(freshRaceControl);
          this.state.raceControlFeed = [...this.state.raceControlFeed, ...mappedEvents];
          this.emit('raceControl', mappedEvents);
          stateChanged = true;
        }
        this.lastRaceControlDate = raceControl[raceControl.length - 1].date;
      }

      // 4. Process Weather (every ~4 cycles / ~14s)
      if (this.cycleCount % 4 === 0) {
        const weatherParams: Record<string, string | number> = { session_key: sKey };
        if (this.lastWeatherDate) {
          weatherParams['date>='] = this.lastWeatherDate;
        }
        const freshWeather = await openF1Fetch<OpenF1Weather>('/weather', weatherParams).catch(() => []);
        if (freshWeather.length > 0) {
          const mapped = mapWeather(freshWeather);
          if (mapped.length > 0) {
            this.state.weather = mapped[mapped.length - 1];
            this.lastWeatherDate = freshWeather[freshWeather.length - 1].date;
            this.emit('weather', this.state.weather);
            stateChanged = true;
          }
        }
      }

      // 5. Process Stints (every ~8 cycles / ~28s)
      if (this.cycleCount % 8 === 0) {
        const stints = await openF1Fetch<OpenF1Stint>('/stints', { session_key: sKey }).catch(() => []);
        if (stints.length > 0) {
          for (const s of stints) {
            const driver = this.state.drivers.find((d) => d.driverNumber === s.driver_number);
            if (driver) {
              driver.currentCompound = normalizeCompound(s.compound);
              driver.currentStintLaps = (s.lap_end || 1) - (s.lap_start || 1) + 1;
            }
          }
          stateChanged = true;
        }
      }

      if (stateChanged) {
        this.state.lastUpdated = new Date().toISOString();
        this.emit('state', this.state);

        // Update Redis snapshot & interval keys with short TTLs
        await Promise.all([
          cache.set(`f1:session:${sKey}:snapshot`, this.state, 10),
          cache.set(
            `f1:session:${sKey}:intervals`,
            this.state.drivers.map((d) => ({
              driverNumber: d.driverNumber,
              position: d.position,
              gapToLeader: d.gapToLeader,
              interval: d.interval,
            })),
            5
          ),
        ]);
      }
    } catch (err) {
      console.warn('[LivePolling] Error in poll cycle:', err instanceof Error ? err.message : err);
      this.emit('pollError', err);
    } finally {
      this.isPolling = false;
    }
  }
}

// Singleton export
export const livePollingEngine = new LivePollingEngine();
