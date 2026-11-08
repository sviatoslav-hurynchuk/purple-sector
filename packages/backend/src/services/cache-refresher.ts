import { cache } from './cache';
import { getCurrentSeason, isRaceWeekend } from './jolpica/client';
import { getNextRace, getRaceSchedule } from './jolpica/races';
import { getEnrichedDriverStandings, getEnrichedConstructorStandings } from '../routes/standings';
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
   * Proactively warms hot keys using SWR with isolated failure zones.
   */
  private async refreshHotKeys(): Promise<void> {
    if (this.isRefreshing) return;

    // Acquire distributed lock to ensure only one instance refreshes across clustered workers
    const lockToken = await cache.acquireLock('service:cache-refresher:lock', 60);
    if (!lockToken) {
      return;
    }

    this.isRefreshing = true;
    const currentSeason = getCurrentSeason();

    try {
      // 1. Proactively warm Next Race & dynamic schedule overrides (bypassing inner cache during revalidation)
      try {
        await cache.swr(
          'f1:swr:races:next',
          async () => {
            const race = await getNextRace(true);
            if (!race) return null;
            return enrichRaceWithScheduleOverrides(race);
          },
          { softTtlSeconds: isRaceWeekend() ? 20 : 60, hardTtlSeconds: 12 * 3600, retireOnNull: true }
        );
      } catch (err) {
        console.warn(
          '[CacheRefresher] Failed warming next race:',
          err instanceof Error ? err.message : err
        );
      }

      // 2. Proactively warm Drivers Championship Standings (reusing enriched route fetcher with clinch detection)
      try {
        await cache.swr(
          `f1:swr:standings:drivers:${currentSeason}:latest`,
          () => getEnrichedDriverStandings(currentSeason),
          {
            softTtlSeconds: (data) => (data.standings.length > 0 ? (isRaceWeekend() ? 60 : 300) : 300),
            hardTtlSeconds: (data) => (data.standings.length > 0 ? 86400 : 600),
          }
        );
      } catch (err) {
        console.warn(
          '[CacheRefresher] Failed warming driver standings:',
          err instanceof Error ? err.message : err
        );
      }

      // 3. Proactively warm Constructors Championship Standings (reusing enriched route fetcher with clinch detection)
      try {
        await cache.swr(
          `f1:swr:standings:constructors:${currentSeason}:latest`,
          () => getEnrichedConstructorStandings(currentSeason),
          {
            softTtlSeconds: (data) => (data.standings.length > 0 ? (isRaceWeekend() ? 60 : 300) : 300),
            hardTtlSeconds: (data) => (data.standings.length > 0 ? 86400 : 600),
          }
        );
      } catch (err) {
        console.warn(
          '[CacheRefresher] Failed warming constructor standings:',
          err instanceof Error ? err.message : err
        );
      }

      // 4. Proactively warm Current Season Full Schedule
      try {
        await cache.swr(
          `f1:swr:races:schedule:${currentSeason}`,
          () => getRaceSchedule(currentSeason),
          { softTtlSeconds: 21600, hardTtlSeconds: 86400 }
        );
      } catch (err) {
        console.warn(
          '[CacheRefresher] Failed warming season schedule:',
          err instanceof Error ? err.message : err
        );
      }

      // 5. Prewarm OpenF1 telemetry during race weekends (both upcoming and most recently completed round)
      if (isRaceWeekend()) {
        try {
          const nextRace = await getNextRace().catch(() => null);
          const upcomingSeason = nextRace?.season ?? currentSeason;
          const upcomingRound = nextRace?.round;

          // Warm upcoming round
          if (upcomingRound) {
            await cache.swr(
              `f1:swr:openf1:race:${upcomingSeason}:${upcomingRound}`,
              () => getRaceSessionData(upcomingSeason, upcomingRound),
              {
                softTtlSeconds: 60,
                hardTtlSeconds: 86400,
                shouldCache: (data) => Boolean(data?.isComplete),
              }
            ).catch(() => {});
          }

          // Also identify and prewarm most recently completed round from schedule (not assuming round - 1)
          const schedule = await getRaceSchedule(currentSeason).catch(() => []);
          const now = new Date();
          const completedRaces = schedule.filter((r) => {
            const raceTime = r.time ? new Date(`${r.date}T${r.time}`) : new Date(`${r.date}T15:00:00Z`);
            return raceTime.getTime() < now.getTime();
          });

          const lastCompleted = completedRaces[completedRaces.length - 1];
          if (lastCompleted && lastCompleted.round !== upcomingRound) {
            const completedSeason = lastCompleted.season ?? currentSeason;
            await cache.swr(
              `f1:swr:openf1:race:${completedSeason}:${lastCompleted.round}`,
              () => getRaceSessionData(completedSeason, lastCompleted.round),
              {
                softTtlSeconds: 60,
                hardTtlSeconds: 86400,
                shouldCache: (data) => Boolean(data?.isComplete),
              }
            ).catch(() => {});
          }
        } catch (err) {
          console.warn(
            '[CacheRefresher] Failed warming race weekend telemetry:',
            err instanceof Error ? err.message : err
          );
        }
      }
    } finally {
      this.isRefreshing = false;
      await cache.releaseLock('service:cache-refresher:lock', lockToken).catch(() => {});
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
