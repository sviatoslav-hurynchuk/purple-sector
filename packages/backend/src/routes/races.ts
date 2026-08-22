import { Router, Request, Response } from 'express';
import { getRaceSchedule, getRaceResult, getNextRace, isRaceWeekend, getRacePitStops } from '../services/jolpica';

const router: Router = Router();
function getCurrentSeason(): string {
  return new Date().getFullYear().toString();
}

function setCacheHeaders(res: Response, maxAgeSeconds: number): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=30`
  );
}

/**
 * GET /api/races/next
 * Returns the next upcoming race.
 * Placed BEFORE /:season to prevent matching "next" as a season parameter.
 */
router.get('/next', async (_req: Request, res: Response) => {
  try {
    const race = await getNextRace();
    if (!race) {
      res.status(404).json({ error: 'No upcoming races found' });
      return;
    }
    setCacheHeaders(res, isRaceWeekend() ? 20 : 60);
    res.json(race);
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
    const races = await getRaceSchedule(season);
    const maxAge = season === getCurrentSeason() ? 21600 : 86400; // 6h vs 24h
    setCacheHeaders(res, maxAge);
    res.json({ season, races });
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
    const race = await getRaceResult(season, round);

    if (!race) {
      res.status(404).json({ error: `Race not found: season ${season}, round ${round}` });
      return;
    }

    const hasResults = 'Results' in race && Array.isArray(race.Results) && race.Results.length > 0;
    setCacheHeaders(res, hasResults ? 86400 : (isRaceWeekend() ? 60 : 300));
    res.json(race);
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
    const pitStops = await getRacePitStops(season, round);

    if (!pitStops) {
      res.status(404).json({
        error: `Pit stop data not available for season ${season}, round ${round}. Data is available from 2012 onwards for completed races.`,
      });
      return;
    }

    // Pit stop records are immutable after a race ends — cache aggressively
    setCacheHeaders(res, 86400);
    res.json({ season, round, pitStops });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});


export default router;