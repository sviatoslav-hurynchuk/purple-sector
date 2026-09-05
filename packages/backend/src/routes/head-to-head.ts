import { Router, Request, Response } from 'express';
import {
  getSeasonHeadToHead,
  getTeammateBattle,
  getConstructorBattles,
} from '../services/head-to-head';
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
 * GET /api/head-to-head/:season/battle/:driver1/:driver2
 * Returns head-to-head battle between two specific drivers in a given season.
 * Placed before /:season to avoid route collision.
 */
router.get('/:season/battle/:driver1/:driver2', async (req: Request, res: Response) => {
  const { season, driver1, driver2 } = req.params;
  if (!isValidSeason(season)) {
    res.status(400).json({
      error: `Invalid season: ${season}. Season must be a 4-digit year between 1950 and ${Number(getCurrentSeason()) + 1}.`,
    });
    return;
  }

  try {
    const battle = await getTeammateBattle(season, driver1, driver2);

    if (!battle) {
      res.status(404).json({
        error: `No head-to-head battle found between ${driver1} and ${driver2} in season ${season}.`,
      });
      return;
    }

    const maxAge =
      season === getCurrentSeason() ? (isRaceWeekend() ? 60 : 900) : 86400;
    setCacheHeaders(res, maxAge);
    res.json(battle);
  } catch (err) {
    console.error(`[H2H] Failed to load battle for ${driver1} vs ${driver2} in season ${season}:`, err);
    res.status(500).json({ error: 'Failed to load head-to-head battle data.' });
  }
});

/**
 * GET /api/head-to-head/:season/constructor/:constructorId
 * Returns head-to-head battles for a specific constructor in a given season.
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
    const battles = await getConstructorBattles(season, constructorId);

    if (!battles || battles.length === 0) {
      res.status(404).json({
        error: `No head-to-head battles found for constructor ${constructorId} in season ${season}.`,
      });
      return;
    }

    const maxAge =
      season === getCurrentSeason() ? (isRaceWeekend() ? 60 : 900) : 86400;
    setCacheHeaders(res, maxAge);
    res.json(battles);
  } catch (err) {
    console.error(`[H2H] Failed to load battles for constructor ${constructorId} in season ${season}:`, err);
    res.status(500).json({ error: 'Failed to load constructor head-to-head data.' });
  }
});

/**
 * GET /api/head-to-head/:season
 * Returns full season head-to-head data across all constructors and teammate pairs.
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
    const data = await getSeasonHeadToHead(season);

    const maxAge =
      season === getCurrentSeason() ? (isRaceWeekend() ? 60 : 900) : 86400;
    setCacheHeaders(res, maxAge);
    res.json(data);
  } catch (err) {
    console.error(`[H2H] Failed to load season head-to-head for season ${season}:`, err);
    res.status(500).json({ error: 'Failed to load season head-to-head data.' });
  }
});

export default router;
