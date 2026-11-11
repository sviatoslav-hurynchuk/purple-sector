import { Router, Request, Response } from 'express';
import { getSeasonDrivers, getDriverProfile } from '../services/jolpica';
import { CACHE_TTL, F1_HISTORICAL_BOUNDS } from '../constants';
import { getCurrentSeason, resolveCurrentSeason, getMaxSupportedSeason, isRaceWeekend } from '../utils/season';
import { setCacheHeaders } from '../utils/http';
import { isValidSeason } from '../utils/validation';

const router: Router = Router();

/**
 * GET /api/drivers?season=YYYY
 * Returns drivers list for a given season (defaults to current season).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentSeason = getCurrentSeason();
    const seasonQuery = req.query['season'];
    const season = resolveCurrentSeason(typeof seasonQuery === 'string' ? seasonQuery : undefined);

    if (!isValidSeason(season)) {
      res.status(400).json({
        error: `Invalid season parameter. Must be a 4-digit year between ${F1_HISTORICAL_BOUNDS.FIRST_SEASON} and ${getMaxSupportedSeason()}.`,
      });
      return;
    }

    const drivers = await getSeasonDrivers(season);
    const maxAge =
      season === currentSeason
        ? isRaceWeekend()
          ? CACHE_TTL.FIVE_MINUTES
          : CACHE_TTL.ONE_HOUR
        : CACHE_TTL.ONE_DAY;
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
    if (!driverId || !/^[a-z0-9_-]{1,64}$/i.test(driverId.trim())) {
      res.status(400).json({ error: 'Invalid driverId parameter. Must be an alphanumeric identifier.' });
      return;
    }

    const profile = await getDriverProfile(driverId);

    if (!profile) {
      res.status(404).json({ error: `Driver not found: ${driverId}` });
      return;
    }

    setCacheHeaders(res, CACHE_TTL.ONE_DAY);
    res.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
