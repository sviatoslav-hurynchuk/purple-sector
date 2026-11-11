import { Router, Request, Response } from 'express';
import { cache } from '../services/cache';
import {
  getRaceSchedule,
  getRaceResult,
  getNextRace,
  getRacePitStops,
  getRaceLaps,
} from '../services/jolpica';
import { enrichRaceWithScheduleOverrides } from '../services/schedule-detector';
import { CACHE_TTL } from '../constants';
import { getCurrentSeason, resolveCurrentSeason, isRaceWeekend } from '../utils/season';
import { setCacheHeaders } from '../utils/http';

const router: Router = Router();

/**
 * GET /api/races/next
 * Returns the next upcoming race.
 * Placed BEFORE /:season to prevent matching "next" as a season parameter.
 * Enriched with real-time FIA schedule revisions and delays.
 */
router.get('/next', async (req: Request, res: Response) => {
  try {
    const mockParam = (req.query.mockScheduleChange as string) || (req.query.mock as string);
    if (mockParam) {
      const race = await getNextRace();
      if (!race) {
        res.status(404).json({ error: 'No upcoming races found' });
        return;
      }
      const enrichedRace = await enrichRaceWithScheduleOverrides(race, mockParam);
      res.setHeader('X-Cache-Status', 'MISS');
      setCacheHeaders(res, isRaceWeekend() ? CACHE_TTL.TWENTY_SECONDS : CACHE_TTL.ONE_MINUTE);
      res.json(enrichedRace);
      return;
    }

    const swrKey = 'f1:swr:races:next';
    const softTtl = isRaceWeekend() ? CACHE_TTL.TWENTY_SECONDS : CACHE_TTL.ONE_MINUTE;
    const hardTtl = CACHE_TTL.TWELVE_HOURS;

    const result = await cache.swr(
      swrKey,
      async () => {
        const race = await getNextRace();
        if (!race) return null;
        return enrichRaceWithScheduleOverrides(race);
      },
      { softTtlSeconds: softTtl, hardTtlSeconds: hardTtl, retireOnNull: true }
    );

    if (!result.data) {
      res.status(404).json({ error: 'No upcoming races found' });
      return;
    }

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, softTtl);
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/races/:season
 * Returns the full race schedule for a given season.
 */
router.get('/:season', async (req: Request, res: Response) => {
  try {
    const { season } = req.params;
    const resolvedSeason = resolveCurrentSeason(season);
    const isCurrent = resolvedSeason === getCurrentSeason();
    const softTtl = isCurrent ? CACHE_TTL.SIX_HOURS : CACHE_TTL.ONE_DAY;
    const hardTtl = isCurrent ? CACHE_TTL.ONE_DAY : CACHE_TTL.ONE_WEEK;
    const swrKey = `f1:swr:races:schedule:${resolvedSeason}`;

    const result = await cache.swr(
      swrKey,
      () => getRaceSchedule(resolvedSeason),
      { softTtlSeconds: softTtl, hardTtlSeconds: hardTtl }
    );

    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, softTtl);
    res.json({ season, races: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/races/:season/:round
 * Returns detailed results for a specific race round.
 */
router.get('/:season/:round', async (req: Request, res: Response) => {
  try {
    const { season, round } = req.params;
    const resolvedSeason = resolveCurrentSeason(season);
    const mockParam = (req.query.mockScheduleChange as string) || (req.query.mock as string);

    if (mockParam) {
      const race = await getRaceResult(resolvedSeason, round);
      if (!race) {
        res.status(404).json({ error: `Race not found: season ${season}, round ${round}` });
        return;
      }
      const enriched = await enrichRaceWithScheduleOverrides(race, mockParam);
      res.setHeader('X-Cache-Status', 'MISS');
      res.json(enriched);
      return;
    }

    const swrKey = `f1:swr:races:round:${resolvedSeason}:${round}`;
    const result = await cache.swr(
      swrKey,
      async () => {
        const race = await getRaceResult(resolvedSeason, round);
        if (!race) return null;
        const hasResults = 'Results' in race && Array.isArray(race.Results) && race.Results.length > 0;
        return hasResults ? race : await enrichRaceWithScheduleOverrides(race);
      },
      { softTtlSeconds: CACHE_TTL.TWO_MINUTES, hardTtlSeconds: CACHE_TTL.ONE_DAY }
    );

    if (!result.data) {
      res.status(404).json({ error: `Race not found: season ${season}, round ${round}` });
      return;
    }

    const hasResults =
      'Results' in result.data && Array.isArray(result.data.Results) && result.data.Results.length > 0;
    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(
      res,
      hasResults ? CACHE_TTL.ONE_DAY : isRaceWeekend() ? CACHE_TTL.ONE_MINUTE : CACHE_TTL.FIVE_MINUTES
    );
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/races/:season/:round/pitstops
 * Returns all pit stops for a specific race, sorted chronologically by lap.
 * Data is available for 2012+ races. Returns 404 for pre-2012 or future races.
 *
 * NOTE: Registered after /:season/:round intentionally — Express matches the
 * 3-segment path before attempting /:season/:round on a 2-segment URL.
 */
router.get('/:season/:round/pitstops', async (req: Request, res: Response) => {
  try {
    const { season, round } = req.params;
    const resolvedSeason = resolveCurrentSeason(season);
    const swrKey = `f1:swr:races:pitstops:${resolvedSeason}:${round}`;

    const result = await cache.swr(
      swrKey,
      () => getRacePitStops(resolvedSeason, round),
      { softTtlSeconds: CACHE_TTL.FIVE_MINUTES, hardTtlSeconds: CACHE_TTL.ONE_DAY }
    );

    if (!result.data) {
      res.status(404).json({
        error: `Pit stop data not available for season ${season}, round ${round}. Data is available from 2012 onwards for completed races.`,
      });
      return;
    }

    // Pit stop records are immutable after a race ends — cache aggressively
    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, CACHE_TTL.ONE_DAY);
    res.json({ season, round, pitStops: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/races/:season/:round/laps
 * Returns all lap-by-lap timing data for a specific race.
 * Includes driver positions and lap times for every lap of the race.
 * Data is available for completed races (1996+ seasons). Returns 404 otherwise.
 */
router.get('/:season/:round/laps', async (req: Request, res: Response) => {
  try {
    const { season, round } = req.params;
    const resolvedSeason = resolveCurrentSeason(season);
    const swrKey = `f1:swr:races:laps:${resolvedSeason}:${round}`;

    const result = await cache.swr(
      swrKey,
      () => getRaceLaps(resolvedSeason, round),
      { softTtlSeconds: CACHE_TTL.FIVE_MINUTES, hardTtlSeconds: CACHE_TTL.ONE_WEEK }
    );

    if (!result.data) {
      res.status(404).json({
        error: `Lap data not available for season ${season}, round ${round}. Data is available for completed races.`,
      });
      return;
    }

    // Lap records are immutable after a race ends — cache aggressively
    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, CACHE_TTL.ONE_DAY);
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
