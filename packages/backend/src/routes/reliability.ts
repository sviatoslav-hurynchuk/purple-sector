import { Router, Request, Response } from 'express';
import { getSeasonReliability } from '../services/reliability';
import { isRaceWeekend, getCurrentSeason } from '../services/jolpica';

const router: Router = Router();

function setCacheHeaders(res: Response, maxAgeSeconds: number): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=30`
  );
}

function isValidSeason(season: string): boolean {
  if (!/^\d{4}$/.test(season)) return false;
  const year = Number(season);
  return year >= 1950 && year <= Number(getCurrentSeason()) + 1;
}

/**
 * GET /api/reliability/:season/constructor/:constructorId
 * Returns reliability analytics for a specific constructor in a given season.
 * Placed before /:season to avoid route collision.
 */
router.get('/:season/constructor/:constructorId', async (req: Request, res: Response) => {
  const { season, constructorId } = req.params;
  if (!isValidSeason(season)) {
    res.status(400).json({
      error: `Invalid season: ${season}. Season must be a 4-digit year between 1950 and ${Number(getCurrentSeason()) + 1}.`,
    });
    return;
  }

  try {
    const data = await getSeasonReliability(season);
    const constructor = data.constructors.find(
      (c) => c.constructorId.toLowerCase() === constructorId.toLowerCase()
    );

    if (!constructor) {
      res.status(404).json({
        error: `Constructor ${constructorId} not found in season ${season}.`,
      });
      return;
    }

    const maxAge =
      season === getCurrentSeason() ? (isRaceWeekend() ? 60 : 900) : 86400;
    setCacheHeaders(res, maxAge);
    res.json(constructor);
  } catch (err) {
    console.error(`[Reliability] Failed to load constructor ${constructorId} in season ${season}:`, err);
    res.status(500).json({ error: 'Failed to load constructor reliability data.' });
  }
});

/**
 * GET /api/reliability/:season
 * Returns full season reliability analytics, including KPIs, constructor rankings,
 * driver rankings, round-by-round attrition matrix, and failure cause breakdown.
 */
router.get('/:season', async (req: Request, res: Response) => {
  const { season } = req.params;
  if (!isValidSeason(season)) {
    res.status(400).json({
      error: `Invalid season: ${season}. Season must be a 4-digit year between 1950 and ${Number(getCurrentSeason()) + 1}.`,
    });
    return;
  }

  try {
    const data = await getSeasonReliability(season);

    const maxAge =
      season === getCurrentSeason() ? (isRaceWeekend() ? 60 : 900) : 86400;
    setCacheHeaders(res, maxAge);
    res.json(data);
  } catch (err) {
    console.error(`[Reliability] Failed to load season reliability for ${season}:`, err);
    res.status(500).json({ error: 'Failed to load season reliability analytics.' });
  }
});

export default router;
