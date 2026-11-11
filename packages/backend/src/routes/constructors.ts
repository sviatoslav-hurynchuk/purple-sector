import { Router, Request, Response } from 'express';
import { getSeasonConstructors, getConstructorProfile } from '../services/jolpica';
import { CACHE_TTL, F1_HISTORICAL_BOUNDS } from '../constants';
import { getCurrentSeason, resolveCurrentSeason, getMaxSupportedSeason, isRaceWeekend } from '../utils/season';
import { setCacheHeaders } from '../utils/http';
import { isValidSeason } from '../utils/validation';

const router: Router = Router();

/**
 * GET /api/constructors?season=YYYY
 * Returns constructors list for a given season (defaults to current season).
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

    const constructors = await getSeasonConstructors(season);
    const maxAge =
      season === currentSeason
        ? isRaceWeekend()
          ? CACHE_TTL.FIVE_MINUTES
          : CACHE_TTL.ONE_HOUR
        : CACHE_TTL.ONE_DAY;
    setCacheHeaders(res, maxAge);
    res.json({ season, constructors });
  } catch (err) {
    console.error('[constructors] season listing failed:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Failed to load constructors.' });
  }
});

/**
 * GET /api/constructors/:constructorId
 * Returns full constructor profile including statistics, current lineup, and all-time driver roster.
 */
router.get('/:constructorId', async (req: Request, res: Response) => {
  try {
    const { constructorId } = req.params;
    if (!constructorId || !/^[a-z0-9_-]{1,64}$/i.test(constructorId.trim())) {
      res.status(400).json({ error: 'Invalid constructorId parameter. Must be an alphanumeric identifier.' });
      return;
    }

    const profile = await getConstructorProfile(constructorId);

    if (!profile) {
      res.status(404).json({ error: `Constructor not found: ${constructorId}` });
      return;
    }

    setCacheHeaders(res, CACHE_TTL.FIVE_MINUTES);
    res.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
