import type { DriverStanding, ConstructorStanding, Race } from '../../types/f1';
import { cachedFetch, TTL, getCurrentSeason, jolpicaFetch, type JolpicaResponse } from './client';
import { getRaceSchedule } from './races';
import { getDriverStandings, getConstructorStandings } from './standings';

export interface ChampionshipClinchStatus {
  season: string;
  isClinched: boolean;
  championId?: string;
  championName?: string;
  leaderPoints: number;
  challengerId?: string;
  challengerName?: string;
  challengerMaxPoints: number;
  margin: number;
  maxRemainingPoints: number;
  remainingRounds: number;
  totalRounds: number;
  completedRounds: number;
  decidedByTiebreaker: boolean;
  tiebreakerReason?: string;
}

/**
 * Helper to fetch finishes breakdown (P1..P10 counts) for a driver in a season.
 * Used for countback tiebreaker evaluation per FIA Sporting Regulations Art. 7.2.
 */
async function getDriverFinishes(season: string, driverId: string): Promise<number[]> {
  try {
    const res = await jolpicaFetch<
      JolpicaResponse<
        'RaceTable',
        {
          season: string;
          driverId?: string;
          Races: Array<{
            round: string;
            Results?: Array<{ position: string }>;
          }>;
        }
      >
    >(`/${season}/drivers/${driverId}/results.json?limit=100`);

    const counts = new Array(10).fill(0);
    const races = res?.MRData?.RaceTable?.Races ?? [];
    for (const r of races) {
      const pos = parseInt(r.Results?.[0]?.position ?? '0', 10);
      if (pos >= 1 && pos <= 10) {
        counts[pos - 1]++;
      }
    }
    return counts;
  } catch {
    return new Array(10).fill(0);
  }
}

/**
 * Evaluates FIA Formula 1 Sporting Regulations Article 7.2 Tiebreaker
 * (countback of 1st places, then 2nd places, then 3rd places, etc.)
 */
export function evaluateCountbackTiebreaker(
  leaderWins: number,
  challengerWins: number,
  remainingGPs: number,
  leaderFinishes?: number[],
  challengerFinishes?: number[]
): { isClinched: boolean; reason: string } {
  // To tie on points, challenger MUST win every remaining Grand Prix race
  const challengerMaxWins = challengerWins + remainingGPs;

  if (leaderWins > challengerMaxWins) {
    return {
      isClinched: true,
      reason: `Leader has ${leaderWins} wins; challenger can reach at most ${challengerMaxWins} wins if tying on points (FIA Art. 7.2(a) win countback).`,
    };
  }

  if (leaderWins < challengerMaxWins) {
    return {
      isClinched: false,
      reason: `Challenger could potentially achieve ${challengerMaxWins} wins vs leader's ${leaderWins} wins if tying on points.`,
    };
  }

  // If wins would also tie (leaderWins === challengerMaxWins),
  // challenger needed to win EVERY remaining race to tie on points,
  // meaning challenger scores 0 additional 2nd places, 3rd places, etc.
  if (leaderFinishes && challengerFinishes) {
    for (let pos = 1; pos < Math.min(leaderFinishes.length, challengerFinishes.length); pos++) {
      const leaderCount = leaderFinishes[pos] ?? 0;
      const challengerCount = challengerFinishes[pos] ?? 0;
      if (leaderCount > challengerCount) {
        return {
          isClinched: true,
          reason: `Tied on wins (${leaderWins}); leader has ${leaderCount} P${pos + 1} finishes vs challenger's ${challengerCount} (FIA Art. 7.2(b) P${pos + 1} countback).`,
        };
      }
      if (leaderCount < challengerCount) {
        return {
          isClinched: false,
          reason: `Tied on wins (${leaderWins}); challenger holds more P${pos + 1} finishes (${challengerCount} vs ${leaderCount}).`,
        };
      }
    }
  }

  return {
    isClinched: false,
    reason: 'Countback is currently tied or inconclusive.',
  };
}

/**
 * Calculates remaining available points in the season for drivers:
 * 25 points per remaining GP race + 8 points per remaining Sprint.
 * (Fastest lap bonus point was removed by FIA starting from the 2025 season).
 */
export function calculateRemainingDriverPoints(
  schedule: Race[],
  completedRoundNumber: number
): { maxRemainingPoints: number; remainingGPs: number; remainingSprints: number } {
  let remainingGPs = 0;
  let remainingSprints = 0;

  for (const race of schedule) {
    const roundNum = parseInt(race.round, 10);
    if (roundNum > completedRoundNumber) {
      remainingGPs++;
      if (race.Sprint) {
        remainingSprints++;
      }
    }
  }

  const maxRemainingPoints = remainingGPs * 25 + remainingSprints * 8;
  return { maxRemainingPoints, remainingGPs, remainingSprints };
}

/**
 * Determines whether the Drivers' World Championship has been mathematically clinched.
 */
export async function getDriverChampionshipStatus(
  season?: string | number
): Promise<ChampionshipClinchStatus> {
  const s = season ? String(season) : getCurrentSeason();
  const cacheKey = `f1:championship:drivers:${s}`;

  return cachedFetch<ChampionshipClinchStatus>(cacheKey, TTL.SCHEDULE_CURRENT, async () => {
    const [standings, schedule] = await Promise.all([
      getDriverStandings(s).catch(() => [] as DriverStanding[]),
      getRaceSchedule(s).catch(() => [] as Race[]),
    ]);

    if (standings.length < 2 || schedule.length === 0) {
      return {
        season: s,
        isClinched: false,
        leaderPoints: 0,
        challengerMaxPoints: 0,
        margin: 0,
        maxRemainingPoints: 0,
        remainingRounds: 0,
        totalRounds: schedule.length,
        completedRounds: 0,
        decidedByTiebreaker: false,
      };
    }

    // Determine current completed round from latest standings or schedule
    // Query Jolpica StandingsTable round
    const standingsRes = await jolpicaFetch<
      JolpicaResponse<
        'StandingsTable',
        { StandingsLists: Array<{ season: string; round: string }> }
      >
    >(`/${s}/driverStandings.json`).catch(() => null);

    const completedRoundNumber = parseInt(
      standingsRes?.MRData?.StandingsTable?.StandingsLists?.[0]?.round ?? '0',
      10
    );

    const { maxRemainingPoints, remainingGPs } = calculateRemainingDriverPoints(
      schedule,
      completedRoundNumber
    );

    const remainingRounds = schedule.filter(
      (r) => parseInt(r.round, 10) > completedRoundNumber
    ).length;

    const leader = standings[0];
    const leaderPoints = parseFloat(leader.points || '0');
    const leaderWins = parseInt(leader.wins || '0', 10);
    const leaderId = leader.Driver.driverId;
    const leaderName = `${leader.Driver.givenName} ${leader.Driver.familyName}`;

    // If season is completely finished (0 remaining rounds), P1 is the champion
    if (remainingRounds === 0) {
      return {
        season: s,
        isClinched: true,
        championId: leaderId,
        championName: leaderName,
        leaderPoints,
        challengerId: standings[1]?.Driver.driverId,
        challengerName: standings[1]
          ? `${standings[1].Driver.givenName} ${standings[1].Driver.familyName}`
          : undefined,
        challengerMaxPoints: parseFloat(standings[1]?.points || '0'),
        margin: leaderPoints - parseFloat(standings[1]?.points || '0'),
        maxRemainingPoints: 0,
        remainingRounds: 0,
        totalRounds: schedule.length,
        completedRounds: completedRoundNumber,
        decidedByTiebreaker: false,
      };
    }

    // Evaluate every contender in the standings from P2 downwards
    let allContendersEliminated = true;
    let primaryChallengerId = standings[1].Driver.driverId;
    let primaryChallengerName = `${standings[1].Driver.givenName} ${standings[1].Driver.familyName}`;
    let highestChallengerMax = 0;
    let decidedByTiebreaker = false;
    let tiebreakerReason: string | undefined;

    let leaderFinishes: number[] | null = null;

    for (let i = 1; i < standings.length; i++) {
      const challenger = standings[i];
      const challengerPoints = parseFloat(challenger.points || '0');
      const challengerMaxPoints = challengerPoints + maxRemainingPoints;

      if (challengerMaxPoints > highestChallengerMax) {
        highestChallengerMax = challengerMaxPoints;
        primaryChallengerId = challenger.Driver.driverId;
        primaryChallengerName = `${challenger.Driver.givenName} ${challenger.Driver.familyName}`;
      }

      if (leaderPoints > challengerMaxPoints) {
        // Strictly eliminated on pure points margin
        continue;
      }

      if (leaderPoints === challengerMaxPoints) {
        // Tied potential points: invoke FIA Sporting Regulations Article 7.2 Countback
        if (!leaderFinishes) {
          leaderFinishes = await getDriverFinishes(s, leaderId);
        }
        const challengerFinishes = await getDriverFinishes(s, challenger.Driver.driverId);
        const challengerWins = parseInt(challenger.wins || '0', 10);

        const tieResult = evaluateCountbackTiebreaker(
          leaderWins,
          challengerWins,
          remainingGPs,
          leaderFinishes,
          challengerFinishes
        );

        if (tieResult.isClinched) {
          decidedByTiebreaker = true;
          tiebreakerReason = tieResult.reason;
          continue; // Eliminated via tiebreaker!
        }
      }

      // If we reach here, this contender can still mathematically win
      allContendersEliminated = false;
      break;
    }

    const margin = leaderPoints - highestChallengerMax;

    return {
      season: s,
      isClinched: allContendersEliminated,
      championId: allContendersEliminated ? leaderId : undefined,
      championName: allContendersEliminated ? leaderName : undefined,
      leaderPoints,
      challengerId: primaryChallengerId,
      challengerName: primaryChallengerName,
      challengerMaxPoints: highestChallengerMax,
      margin,
      maxRemainingPoints,
      remainingRounds,
      totalRounds: schedule.length,
      completedRounds: completedRoundNumber,
      decidedByTiebreaker,
      tiebreakerReason,
    };
  });
}
