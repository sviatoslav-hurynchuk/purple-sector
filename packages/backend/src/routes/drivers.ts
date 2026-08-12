import { Router, Request, Response } from 'express';
import { getSeasonDrivers, getDriverProfile, isRaceWeekend } from '../services/jolpica';

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
 * GET /api/drivers?season=YYYY
 * Returns drivers list for a given season (defaults to current season).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentSeason = getCurrentSeason();
    const season = (req.query['season'] as string) ?? currentSeason;

    if (isNaN(Number(season))) {
      res.status(400).json({ error: 'Invalid season parameter. Must be a valid year.' });
      return;
    }

    const drivers = await getSeasonDrivers(season);
    const maxAge = season === currentSeason ? (isRaceWeekend() ? 300 : 3600) : 86400;
    setCacheHeaders(res, maxAge);
    res.json({ season, drivers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/drivers/:driverId
 * Returns full driver profile including info, career stats, and season standings history.
 */
router.get('/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    if (!driverId || driverId.trim() === '') {
      res.status(400).json({ error: 'Invalid driverId parameter' });
      return;
    }

    const profile = await getDriverProfile(driverId);

    if (!profile) {
      res.status(404).json({ error: `Driver not found: ${driverId}` });
      return;
    }

    setCacheHeaders(res, 86400); // 24h cache for driver profiles
    res.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
