import { cache } from './cache';
import { getCurrentSeason, isRaceWeekend } from './jolpica/client';
import { getNextRace, getRaceSchedule } from './jolpica/races';
import { getDriverStandings, getConstructorStandings } from './jolpica/standings';
import { getRaceSessionData } from './openf1';
import { enrichRaceWithScheduleOverrides } from './schedule-detector';

/**
 * Autonomous Background Cache Refresher Service.
 *
 * Implements proactive cache warming and background revalidation inspired by
 * high-throughput distributed architectures. Continuously keeps high-frequency
 * API routes fresh in Redis/Memory before users ever request them, eliminating
 * cold-start latency (0ms latency for end users) and protecting OpenF1 / Jolpica
 * from thundering herd spikes.
 */
class CacheRefresherService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isRefreshing = false;

  /**
   * Starts the background refresher loop.
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[CacheRefresher] Autonomous background cache refresher started.');

    // Initial warm-up tick delayed by 5 seconds to let server finish initial startup
    this.timer = setTimeout(() => {
      void this.tick();
    }, 5000);
  }

  /**
   * Stops the background refresher cleanly (e.g. on SIGTERM/SIGINT).
   */
  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[CacheRefresher] Autonomous background cache refresher stopped.');
  }

  /**
   * Execution cycle of the refresher.
   */
  private async tick(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.refreshHotKeys();
    } catch (err) {
      console.warn(
        '[CacheRefresher] Error during proactive cache refresh:',
        err instanceof Error ? err.message : err
      );
    } finally {
      if (this.isRunning) {
        // Dynamic interval: 35s during race weekends (live action), 180s mid-week
        const intervalMs = isRaceWeekend() ? 35_000 : 180_000;
        this.timer = setTimeout(() => {
          void this.tick();
        }, intervalMs);
      }
    }
  }

  /**
   * Proactively warms hot keys using SWR.
   */
  private async refreshHotKeys(): Promise<void> {
    if (this.isRefreshing) return;

    // Acquire distributed lock to ensure only one instance refreshes across clustered workers
    const lockAcquired = await cache.acquireLock('service:cache-refresher:lock', 60);
    if (!lockAcquired) {
      return;
    }

    this.isRefreshing = true;
    const currentSeason = getCurrentSeason();

    try {
      // 1. Proactively warm Next Race & dynamic schedule overrides
      await cache.swr(
        'f1:swr:races:next',
        async () => {
          const race = await getNextRace();
          if (!race) return null;
          return enrichRaceWithScheduleOverrides(race);
        },
        { softTtlSeconds: isRaceWeekend() ? 20 : 60, hardTtlSeconds: 12 * 3600 }
      );

      // 2. Proactively warm Drivers Championship Standings
      await cache.swr(
        `f1:swr:standings:drivers:${currentSeason}:latest`,
        async () => {
          const standings = await getDriverStandings(currentSeason);
          return { season: currentSeason, round: undefined, standings, championship: null };
        },
        { softTtlSeconds: isRaceWeekend() ? 60 : 300, hardTtlSeconds: 86400 }
      );

      // 3. Proactively warm Constructors Championship Standings
      await cache.swr(
        `f1:swr:standings:constructors:${currentSeason}:latest`,
        async () => {
          const standings = await getConstructorStandings(currentSeason);
          return { season: currentSeason, round: undefined, standings, championship: null };
        },
        { softTtlSeconds: isRaceWeekend() ? 60 : 300, hardTtlSeconds: 86400 }
      );

      // 4. Proactively warm Current Season Full Schedule
      await cache.swr(
        `f1:swr:races:schedule:${currentSeason}`,
        () => getRaceSchedule(currentSeason),
        { softTtlSeconds: 21600, hardTtlSeconds: 86400 }
      );

      // 5. If race weekend is active, proactively warm next/current round OpenF1 session data
      if (isRaceWeekend()) {
        const nextRace = await getNextRace().catch(() => null);
        if (nextRace?.round) {
          await cache.swr(
            `f1:swr:openf1:race:${currentSeason}:${nextRace.round}`,
            () => getRaceSessionData(currentSeason, nextRace.round),
            { softTtlSeconds: 60, hardTtlSeconds: 86400 }
          ).catch(() => {});
        }
      }
    } finally {
      this.isRefreshing = false;
      await cache.releaseLock('service:cache-refresher:lock').catch(() => {});
    }
  }
}

export const cacheRefresher = new CacheRefresherService();

export function startCacheRefresher(): void {
  cacheRefresher.start();
}

export function stopCacheRefresher(): void {
  cacheRefresher.stop();
}
