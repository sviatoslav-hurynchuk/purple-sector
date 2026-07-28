import { Router, Request, Response } from 'express';
import { getDriverStandings, getConstructorStandings, isRaceWeekend } from '../services/jolpica';

const router: Router = Router();

function parseRound(raw: unknown): { isValid: boolean; value?: string } {
  if (raw === undefined) {
    return { isValid: true, value: undefined };
  }
  if (typeof raw !== 'string') {
    return { isValid: false };
  }
  if (!/^[1-9]\d*$/.test(raw)) {
    return { isValid: false };
  }
  return { isValid: true, value: raw };
}

function setCacheHeaders(res: Response, maxAgeSeconds: number): void {
  res.setHeader(
    'Cache-Control',
    `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=30`
  );
}

/**
 * GET /api/standings/drivers?season=2025
 * Returns the drivers championship standings for a given season.
 * Defaults to the current year if no season is provided.
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const season = (req.query['season'] as string) ?? new Date().getFullYear().toString();
    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }
    const standings = await getDriverStandings(season, roundResult.value);
    setCacheHeaders(res, isRaceWeekend() ? 60 : 300);
    res.json({ season, round: roundResult.value, standings });
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
    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }
    const standings = await getConstructorStandings(season, roundResult.value);
    setCacheHeaders(res, isRaceWeekend() ? 60 : 300);
    res.json({ season, round: roundResult.value, standings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;