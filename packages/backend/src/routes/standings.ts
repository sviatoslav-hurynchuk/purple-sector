import { Router, Request, Response } from 'express';
import type { DriverStanding, ConstructorStanding } from '../types/f1';
import {
  getDriverStandings,
  getConstructorStandings,
  isRaceWeekend,
  getDriverChampionshipStatus,
  getConstructorChampionshipStatus,
  type ChampionshipClinchStatus,
} from '../services/jolpica';

const router: Router = Router();

function getCurrentSeason(): string {
  return new Date().getFullYear().toString();
}

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
    const currentSeason = getCurrentSeason();
    const season = (req.query['season'] as string) ?? currentSeason;
    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }
    const standings = await getDriverStandings(season, roundResult.value);
    let championshipStatus: ChampionshipClinchStatus | null = null;
    if (!roundResult.value && standings.length > 0) {
      championshipStatus = await getDriverChampionshipStatus(season).catch(() => null);
      if (championshipStatus?.isClinched && championshipStatus.championId) {
        const leader = standings.find((s) => s.Driver.driverId === championshipStatus?.championId);
        if (leader) {
          (leader as DriverStanding & { isClinchedChampion?: boolean }).isClinchedChampion = true;
        }
      }
    }
    const maxAge = season === currentSeason ? (isRaceWeekend() ? 60 : 300) : 86400; // 24h for past seasons
    setCacheHeaders(res, maxAge);
    res.json({ season, round: roundResult.value, standings, championship: championshipStatus });
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
    const currentSeason = getCurrentSeason();
    const season = (req.query['season'] as string) ?? currentSeason;
    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }
    const standings = await getConstructorStandings(season, roundResult.value);
    let championshipStatus: ChampionshipClinchStatus | null = null;
    if (!roundResult.value && standings.length > 0) {
      championshipStatus = await getConstructorChampionshipStatus(season).catch(() => null);
      if (championshipStatus?.isClinched && championshipStatus.championId) {
        const leader = standings.find((s) => s.Constructor.constructorId === championshipStatus?.championId);
        if (leader) {
          (leader as ConstructorStanding & { isClinchedChampion?: boolean }).isClinchedChampion = true;
        }
      }
    }
    const maxAge = season === currentSeason ? (isRaceWeekend() ? 60 : 300) : 86400; // 24h for past seasons
    setCacheHeaders(res, maxAge);
    res.json({ season, round: roundResult.value, standings, championship: championshipStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;