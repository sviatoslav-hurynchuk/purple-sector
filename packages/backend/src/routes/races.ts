import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * GET /api/races/:season
 * Returns the race schedule for a given season.
 * Season defaults to current year if not provided.
 */
router.get('/:season', async (req: Request, res: Response) => {
  // TODO: call jolpicaService.getRaceSchedule(season)
  const { season } = req.params;
  res.json({ message: 'TODO: races route', season });
});

/**
 * GET /api/races/:season/:round
 * Returns detailed results for a specific race.
 */
router.get('/:season/:round', async (req: Request, res: Response) => {
  // TODO: call jolpicaService.getRaceResult(season, round)
  const { season, round } = req.params;
  res.json({ message: 'TODO: race detail route', season, round });
});

export default router;
