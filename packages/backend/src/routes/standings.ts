import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * GET /api/standings/drivers?season=2025
 * Returns the drivers championship standings for a given season.
 */
router.get('/drivers', async (req: Request, res: Response) => {
  // TODO: call jolpicaService.getDriverStandings(season)
  const season = req.query['season'] ?? new Date().getFullYear().toString();
  res.json({ message: 'TODO: driver standings route', season });
});

/**
 * GET /api/standings/constructors?season=2025
 * Returns the constructors championship standings for a given season.
 */
router.get('/constructors', async (req: Request, res: Response) => {
  // TODO: call jolpicaService.getConstructorStandings(season)
  const season = req.query['season'] ?? new Date().getFullYear().toString();
  res.json({ message: 'TODO: constructor standings route', season });
});

export default router;
