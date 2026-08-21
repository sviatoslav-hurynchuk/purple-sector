import { Router, Request, Response } from 'express';
import { getSeasonConstructors, getConstructorProfile, isRaceWeekend } from '../services/jolpica';

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
 * GET /api/constructors?season=YYYY
 * Returns constructors list for a given season (defaults to current season).
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentSeason = getCurrentSeason();
    const seasonQuery = req.query['season'];
    const season = typeof seasonQuery === 'string' ? seasonQuery.trim() : currentSeason;

    const seasonNum = parseInt(season, 10);
    const maxSupportedYear = new Date().getFullYear() + 1;
    if (!/^\d{4}$/.test(season) || seasonNum < 1950 || seasonNum > maxSupportedYear) {
      res.status(400).json({ error: `Invalid season parameter. Must be a 4-digit year between 1950 and ${maxSupportedYear}.` });
      return;
    }

    const constructors = await getSeasonConstructors(season);
    const maxAge = season === currentSeason ? (isRaceWeekend() ? 300 : 3600) : 86400;
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

    setCacheHeaders(res, 300); // 5m cache on constructor profile
    res.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
