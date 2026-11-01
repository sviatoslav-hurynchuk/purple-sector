import { warmOfficialDriverStats } from '../f1-official';
import { getCurrentSeason, mapConcurrent } from './client';
import { getNextRace, getRaceSchedule, getRaceResult } from './races';
import { getDriverStandings, getConstructorStandings } from './standings';
import { CONSTRUCTOR_REGISTRY, getConstructorProfile } from './constructors';
import { DRIVER_2026_REGISTRY, getDriverProfile } from './drivers';
import { getRacePitStops, getRaceLaps } from './timing';

export async function warmCache(): Promise<void> {
  console.log('[CacheWarming] Pre-fetching core F1 baseline data...');
  const start = Date.now();
  const currentSeason = getCurrentSeason();

  try {
    // 1. Core baseline data
    await Promise.all([
      getNextRace().catch((err) => console.warn('[CacheWarming] Failed next race:', err instanceof Error ? err.message : err)),
      getRaceSchedule(currentSeason).catch((err) => console.warn('[CacheWarming] Failed schedule:', err instanceof Error ? err.message : err)),
      getDriverStandings(currentSeason).catch((err) => console.warn('[CacheWarming] Failed driver standings:', err instanceof Error ? err.message : err)),
      getConstructorStandings(currentSeason).catch((err) => console.warn('[CacheWarming] Failed constructor standings:', err instanceof Error ? err.message : err)),
      warmOfficialDriverStats().catch((err) => console.warn('[CacheWarming] Failed official driver stats:', err instanceof Error ? err.message : err)),
    ]);

    // 2. Active constructor profiles (10 current championship teams)
    const activeConstructorIds = Object.entries(CONSTRUCTOR_REGISTRY)
      .filter(([, meta]) => meta.currentDrivers.length > 0)
      .map(([id]) => id);
    console.log(`[CacheWarming] Pre-fetching ${activeConstructorIds.length} active constructor profiles...`);
    await mapConcurrent(activeConstructorIds, 2, async (cid) => {
      try {
        await getConstructorProfile(cid);
      } catch (err) {
        console.warn(`[CacheWarming] Failed constructor ${cid}:`, err instanceof Error ? err.message : err);
      }
    });

    // 3. All primary active drivers
    const driverIdSet = new Set<string>();
    for (const meta of Object.values(CONSTRUCTOR_REGISTRY)) {
      for (const d of meta.currentDrivers) {
        driverIdSet.add(d);
      }
    }
    for (const d of Object.keys(DRIVER_2026_REGISTRY)) {
      driverIdSet.add(d);
    }
    const driverIds = Array.from(driverIdSet);
    console.log(`[CacheWarming] Pre-fetching ${driverIds.length} driver profiles...`);
    await mapConcurrent(driverIds, 2, async (did) => {
      try {
        await getDriverProfile(did);
      } catch (err) {
        console.warn(`[CacheWarming] Failed driver ${did}:`, err instanceof Error ? err.message : err);
      }
    });

    // 4. Completed races for current season (require confirmed start time + results)
    const schedule = await getRaceSchedule(currentSeason).catch(() => []);
    const now = new Date();
    // Candidate completed races whose scheduled start was at least 3 hours ago
    const candidateRaces = schedule.filter((r) => {
      const raceStartTime = r.time ? new Date(`${r.date}T${r.time}`) : new Date(`${r.date}T15:00:00Z`);
      return now.getTime() - raceStartTime.getTime() > 3 * 60 * 60 * 1000;
    });

    if (candidateRaces.length > 0) {
      const recentCandidates = candidateRaces.slice(-2);
      console.log(`[CacheWarming] Verifying completion & pre-fetching telemetry for ${recentCandidates.length} candidate race(s)...`);
      await mapConcurrent(recentCandidates, 1, async (r) => {
        const raceResult = await getRaceResult(currentSeason, r.round).catch(() => null);
        const hasFinished =
          raceResult &&
          'Results' in raceResult &&
          Array.isArray(raceResult.Results) &&
          raceResult.Results.length > 0;

        if (hasFinished) {
          await Promise.allSettled([
            getRacePitStops(currentSeason, r.round),
            getRaceLaps(currentSeason, r.round),
          ]);
        }
      });
    }

    console.log(`[CacheWarming] Successfully completed in ${Date.now() - start}ms`);
  } catch (err) {
    console.warn('[CacheWarming] Unexpected error:', err instanceof Error ? err.message : err);
  }
}
