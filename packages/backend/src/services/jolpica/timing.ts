import type {
  Race,
  PitStopEntry,
  LapData,
  DriverLapSummary,
  RaceLapsResponse,
} from '../../types/f1';
import {
  TTL,
  getCurrentSeason,
  isRaceWeekend,
  jolpicaFetch,
  cachedFetch,
  type JolpicaResponse,
} from './client';
import { getRaceResult, type RaceResultEntry } from './races';

// Pit stop table shape returned by Jolpica /{season}/{round}/pitstops.json
export interface PitStopRaceRow extends Race {
  PitStops: PitStopEntry[];
}

export interface PitStopTable {
  season: string;
  round?: string;
  Races: PitStopRaceRow[];
}

export type JolpicaPitStopsResponse = JolpicaResponse<'RaceTable', PitStopTable>;

// Lap timing table shape returned by Jolpica /{season}/{round}/laps.json
export interface LapRaceRow extends Race {
  Laps: LapData[];
}

export interface LapTable {
  season: string;
  round?: string;
  Races: LapRaceRow[];
}

export type JolpicaLapsResponse = JolpicaResponse<'RaceTable', LapTable>;

// ── Pit Stops ─────────────────────────────────────────────────────────────────

/**
 * Returns all pit stops for a given race round.
 *
 * Data is fetched from Jolpica /{season}/{round}/pitstops.json with limit=100
 * (covers the theoretical maximum of ~50 stops in a 20-car race).
 * Results are cached for 24 h because pit stop records are immutable once a race ends.
 * Returns null when pit stop data is unavailable (pre-2012 races, future races,
 * or Jolpica lookup failure), which triggers a 5-min negative-cache sentinel.
 */
export async function getRacePitStops(
  season: string | number,
  round: string | number
): Promise<PitStopEntry[] | null> {
  const s = String(season);
  const r = String(round);
  const cacheKey = `f1:race:pitstops:${s}:${r}`;

  return cachedFetch<PitStopEntry[] | null>(
    cacheKey,
    async (data) => {
      if (!data || data.length === 0) return TTL.NEGATIVE_CACHE;
      // Past seasons are immutable -> 24h
      if (s !== getCurrentSeason()) return TTL.PIT_STOPS;

      // For current season, check if the race has official results completed
      const race = await getRaceResult(s, r).catch(() => null);
      const isCompleted =
        race &&
        'Results' in race &&
        Array.isArray(race.Results) &&
        race.Results.length > 0;

      return isCompleted ? TTL.PIT_STOPS : (isRaceWeekend() ? 60 : 300);
    },
    async () => {
      const res = await jolpicaFetch<JolpicaPitStopsResponse>(
        `/${s}/${r}/pitstops?limit=100`
      );

      const pitStops = res?.MRData.RaceTable.Races[0]?.PitStops;
      if (!pitStops || pitStops.length === 0) return null;

      // Sort chronologically: by lap number first, then by time-of-day string
      return [...pitStops].sort((a, b) => {
        const lapDiff = parseInt(a.lap, 10) - parseInt(b.lap, 10);
        if (lapDiff !== 0) return lapDiff;
        return a.time.localeCompare(b.time);
      });
    },
    TTL.NEGATIVE_CACHE
  );
}

// ── Lap Data ──────────────────────────────────────────────────────────────────

/**
 * Returns all lap-by-lap timing data for a given race round.
 *
 * Lap data is fetched from Jolpica /{season}/{round}/laps.json with paginated
 * requests (max 100 records per page). A typical race has 1000-1400 records
 * (50-70 laps × 20 drivers), requiring ~11-14 sequential page fetches.
 * Results are also fetched to build driver summary information (grid, finish,
 * status, fastest lap, constructor mapping).
 *
 * Returns null when lap data is unavailable (future races, pre-1996 races,
 * or Jolpica lookup failure), which triggers a 5-min negative-cache sentinel.
 */
export async function getRaceLaps(
  season: string | number,
  round: string | number
): Promise<RaceLapsResponse | null> {
  const s = String(season);
  const r = String(round);
  const cacheKey = `f1:race:laps:${s}:${r}`;

  return cachedFetch<RaceLapsResponse | null>(
    cacheKey,
    async (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      // Past seasons are immutable -> 24h
      if (s !== getCurrentSeason()) return TTL.LAPS;

      // For current season, check if the race has official results completed
      const race = await getRaceResult(s, r).catch(() => null);
      const isCompleted =
        race &&
        'Results' in race &&
        Array.isArray(race.Results) &&
        race.Results.length > 0;

      return isCompleted ? TTL.LAPS : (isRaceWeekend() ? 60 : 300);
    },
    async () => {
      // 1. First page to determine total records
      const firstPage = await jolpicaFetch<JolpicaLapsResponse>(
        `/${s}/${r}/laps?limit=100&offset=0`
      );

      const total = parseInt(firstPage.MRData.total, 10);
      const firstRace = firstPage.MRData.RaceTable.Races[0];
      if (!firstRace || !firstRace.Laps || firstRace.Laps.length === 0) {
        return null;
      }

      let allLaps: LapData[] = [...firstRace.Laps];

      // 2. Fetch remaining pages if needed (sequentially to respect rate limits)
      if (total > 100) {
        const remainingPages = Math.ceil((total - 100) / 100);
        for (let i = 1; i <= remainingPages; i++) {
          const offset = i * 100;
          const page = await jolpicaFetch<JolpicaLapsResponse>(
            `/${s}/${r}/laps?limit=100&offset=${offset}`
          );
          const pageRace = page.MRData.RaceTable.Races[0];
          if (pageRace?.Laps) {
            allLaps = allLaps.concat(pageRace.Laps);
          }
        }
      }

      // 3. Merge duplicate LapData entries by lap number (in case a lap was split across pages)
      const lapMap = new Map<string, LapData>();
      for (const lap of allLaps) {
        const existing = lapMap.get(lap.number);
        if (existing) {
          existing.Timings.push(...lap.Timings);
        } else {
          lapMap.set(lap.number, {
            number: lap.number,
            Timings: [...lap.Timings],
          });
        }
      }

      const mergedLaps = Array.from(lapMap.values());
      mergedLaps.sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

      // 4. Fetch race results for driver summaries
      const raceResult = await getRaceResult(s, r).catch(() => null);
      const results: RaceResultEntry[] =
        raceResult &&
        'Results' in raceResult &&
        Array.isArray(raceResult.Results)
          ? raceResult.Results
          : [];

      // 5. Build driver summaries from results
      const drivers: DriverLapSummary[] = results.map((entry) => ({
        driverId: entry.Driver.driverId,
        code: entry.Driver.code ?? entry.Driver.driverId.slice(0, 3).toUpperCase(),
        givenName: entry.Driver.givenName,
        familyName: entry.Driver.familyName,
        constructorId: entry.Constructor.constructorId,
        constructorName: entry.Constructor.name,
        gridPosition: parseInt(entry.grid, 10) || 0,
        finishPosition: parseInt(entry.position, 10) || 0,
        positionText: entry.positionText,
        status: entry.status,
        totalLaps: parseInt(entry.laps, 10) || 0,
        fastestLap: entry.FastestLap
          ? {
              lap: parseInt(entry.FastestLap.lap, 10),
              time: entry.FastestLap.Time.time,
              rank: parseInt(entry.FastestLap.rank, 10),
            }
          : undefined,
      }));

      const totalLaps = mergedLaps.length > 0
        ? parseInt(mergedLaps[mergedLaps.length - 1].number, 10)
        : 0;

      return {
        season: s,
        round: r,
        totalLaps,
        laps: mergedLaps,
        drivers,
      };
    },
    TTL.NEGATIVE_CACHE
  );
}
