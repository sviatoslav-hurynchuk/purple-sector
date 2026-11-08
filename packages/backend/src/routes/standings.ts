import { Router, Request, Response } from 'express';
import { cache } from '../services/cache';
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

const EMPTY_STANDINGS_TTL = 300; // 5 minutes fallback for empty/unpopulated standings

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
    const rawSeason = (req.query['season'] as string) ?? currentSeason;
    const season = rawSeason === 'current' ? currentSeason : rawSeason;

    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }

    const isCurrent = season === currentSeason;
    const standardSoftTtl = isCurrent ? (isRaceWeekend() ? 60 : 300) : 86400; // 24h for past seasons
    const standardHardTtl = isCurrent ? 86400 : 604800; // 7d for past seasons
    const swrKey = `f1:swr:standings:drivers:${season}:${roundResult.value ?? 'latest'}`;

    const result = await cache.swr<EnrichedDriverStandingsResponse>(
      swrKey,
      () => getEnrichedDriverStandings(season, roundResult.value),
      {
        softTtlSeconds: (data) => (data.standings.length > 0 ? standardSoftTtl : EMPTY_STANDINGS_TTL),
        hardTtlSeconds: (data) => (data.standings.length > 0 ? standardHardTtl : 600),
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
    const rawSeason = (req.query['season'] as string) ?? currentSeason;
    const season = rawSeason === 'current' ? currentSeason : rawSeason;

    const roundResult = parseRound(req.query['round']);
    if (!roundResult.isValid) {
      res.status(400).json({ error: 'Invalid round parameter. Must be a positive integer.' });
      return;
    }

    const isCurrent = season === currentSeason;
    const standardSoftTtl = isCurrent ? (isRaceWeekend() ? 60 : 300) : 86400; // 24h for past seasons
    const standardHardTtl = isCurrent ? 86400 : 604800; // 7d for past seasons
    const swrKey = `f1:swr:standings:constructors:${season}:${roundResult.value ?? 'latest'}`;

    const result = await cache.swr<EnrichedConstructorStandingsResponse>(
      swrKey,
      () => getEnrichedConstructorStandings(season, roundResult.value),
      {
        softTtlSeconds: (data) => (data.standings.length > 0 ? standardSoftTtl : EMPTY_STANDINGS_TTL),
        hardTtlSeconds: (data) => (data.standings.length > 0 ? standardHardTtl : 600),
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
