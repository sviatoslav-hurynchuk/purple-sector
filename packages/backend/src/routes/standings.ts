import { Router, Request, Response } from 'express';
import { getDriverStandings, getConstructorStandings } from '../services/jolpica';

const router: Router = Router();

/**
 * GET /api/standings/drivers?season=2025
 * Returns the drivers championship standings for a given season.
 * Defaults to the current year if no season is provided.
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const season = (req.query['season'] as string) ?? new Date().getFullYear().toString();
    const round = req.query['round'] as string | undefined;
    const standings = await getDriverStandings(season, round);
    res.json({ season, round, standings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/standings/constructors?season=2025&round=5
 * Returns the constructors championship standings for a given season and optional round.
 * Defaults to the current year if no season is provided.
 */
router.get('/constructors', async (req: Request, res: Response) => {
  try {
    const season = (req.query['season'] as string) ?? new Date().getFullYear().toString();
    const round = req.query['round'] as string | undefined;
    const standings = await getConstructorStandings(season, round);
    res.json({ season, round, standings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;