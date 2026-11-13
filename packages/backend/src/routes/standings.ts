import { Router, Request, Response } from 'express';
import { cache } from '../services/cache';
import type { DriverStanding, ConstructorStanding } from '../types/f1';
import {
  getDriverStandings,
  getConstructorStandings,
  getDriverChampionshipStatus,
  getConstructorChampionshipStatus,
  type ChampionshipClinchStatus,
} from '../services/jolpica';
import { CACHE_TTL } from '../constants';
import { getCurrentSeason, resolveCurrentSeason, isRaceWeekend } from '../utils/season';
import { setCacheHeaders } from '../utils/http';
import { parseRound } from '../utils/validation';

const router: Router = Router();

const EMPTY_STANDINGS_TTL = CACHE_TTL.FIVE_MINUTES;

export interface EnrichedDriverStandingsResponse {
  season: string;
  round?: string;
  standings: DriverStanding[];
  championship: ChampionshipClinchStatus | null;
}

export interface EnrichedConstructorStandingsResponse {
  season: string;
  round?: string;
  standings: ConstructorStanding[];
  championship: ChampionshipClinchStatus | null;
}

/**
 * Reusable fetcher for driver standings enriched with mathematical championship clinch detection.
 */
export async function getEnrichedDriverStandings(
  season: string,
  round?: string
): Promise<EnrichedDriverStandingsResponse> {
  const standings = await getDriverStandings(season, round);
  let championshipStatus: ChampionshipClinchStatus | null = null;
  if (!round && standings.length > 0) {
    championshipStatus = await getDriverChampionshipStatus(season).catch(() => null);
    if (championshipStatus?.isClinched && championshipStatus.championId) {
      const leader = standings.find((s) => s.Driver.driverId === championshipStatus?.championId);
      if (leader) {
        (leader as DriverStanding & { isClinchedChampion?: boolean }).isClinchedChampion = true;
      }
    }
  }
  return { season, round, standings, championship: championshipStatus };
}

/**
 * Reusable fetcher for constructor standings enriched with mathematical championship clinch detection.
 */
export async function getEnrichedConstructorStandings(
  season: string,
  round?: string
): Promise<EnrichedConstructorStandingsResponse> {
  const standings = await getConstructorStandings(season, round);
  let championshipStatus: ChampionshipClinchStatus | null = null;
  if (!round && standings.length > 0) {
    championshipStatus = await getConstructorChampionshipStatus(season).catch(() => null);
    if (championshipStatus?.isClinched && championshipStatus.championId) {
      const leader = standings.find((s) => s.Constructor.constructorId === championshipStatus?.championId);
      if (leader) {
        (leader as ConstructorStanding & { isClinchedChampion?: boolean }).isClinchedChampion = true;
      }
    }
  }
  return { season, round, standings, championship: championshipStatus };
}

/**
 * GET /api/standings/drivers?season=2025
 * Returns the drivers championship standings for a given season.
 * Defaults to the current year if no season is provided.
 */
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const currentSeason = getCurrentSeason();
    const season = resolveCurrentSeason(req.query['season'] as string | undefined);

    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }

    const isCurrent = season === currentSeason;
    const standardSoftTtl = isCurrent
      ? (isRaceWeekend() ? CACHE_TTL.ONE_MINUTE : CACHE_TTL.FIVE_MINUTES)
      : CACHE_TTL.ONE_DAY;
    const standardHardTtl = isCurrent ? CACHE_TTL.ONE_DAY : CACHE_TTL.ONE_WEEK;
    const swrKey = `f1:swr:standings:drivers:${season}:${roundResult.value ?? 'latest'}`;

    const result = await cache.swr<EnrichedDriverStandingsResponse>(
      swrKey,
      () => getEnrichedDriverStandings(season, roundResult.value),
      {
        softTtlSeconds: (data) => (data.standings.length > 0 ? standardSoftTtl : EMPTY_STANDINGS_TTL),
        hardTtlSeconds: (data) => (data.standings.length > 0 ? standardHardTtl : CACHE_TTL.TEN_MINUTES),
      }
    );

    const hasData = result.data.standings.length > 0;
    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, hasData ? standardSoftTtl : EMPTY_STANDINGS_TTL);
    res.json(result.data);
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
    const season = resolveCurrentSeason(req.query['season'] as string | undefined);

    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }

    const isCurrent = season === currentSeason;
    const standardSoftTtl = isCurrent
      ? (isRaceWeekend() ? CACHE_TTL.ONE_MINUTE : CACHE_TTL.FIVE_MINUTES)
      : CACHE_TTL.ONE_DAY;
    const standardHardTtl = isCurrent ? CACHE_TTL.ONE_DAY : CACHE_TTL.ONE_WEEK;
    const swrKey = `f1:swr:standings:constructors:${season}:${roundResult.value ?? 'latest'}`;

    const result = await cache.swr<EnrichedConstructorStandingsResponse>(
      swrKey,
      () => getEnrichedConstructorStandings(season, roundResult.value),
      {
        softTtlSeconds: (data) => (data.standings.length > 0 ? standardSoftTtl : EMPTY_STANDINGS_TTL),
        hardTtlSeconds: (data) => (data.standings.length > 0 ? standardHardTtl : CACHE_TTL.TEN_MINUTES),
      }
    );

    const hasData = result.data.standings.length > 0;
    res.setHeader('X-Cache-Status', result.status);
    setCacheHeaders(res, hasData ? standardSoftTtl : EMPTY_STANDINGS_TTL);
    res.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
