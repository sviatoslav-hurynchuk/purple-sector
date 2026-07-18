import { Router, Request, Response } from 'express';
import { getRaceSchedule, getRaceResult, getNextRace } from '../services/jolpica';

const router: Router = Router();

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

    res.json(race);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;