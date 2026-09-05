import type {
  SeasonHeadToHeadResponse,
  TeammatePairBattle,
  DriverH2HSummary,
  RoundBattle,
  TeammatePairStats,
  Race,
  QualifyingResultEntry,
} from '../types/f1';
import {
  getRaceSchedule,
  jolpicaFetch,
  cachedFetch,
  TTL,
  isRaceWeekend,
  getCurrentSeason,
  RaceResultEntry,
} from './jolpica';

// ── Jolpica Paginated Response Types ─────────────────────────────────────────

interface JolpicaResultsResponse {
  MRData: {
    total: string;
    limit: string;
    offset: string;
    RaceTable: {
      season: string;
      Races: Array<Race & { Results?: RaceResultEntry[] }>;
    };
  };
}

interface JolpicaQualyResponse {
  MRData: {
    total: string;
    limit: string;
    offset: string;
    RaceTable: {
      season: string;
      Races: Array<Race & { QualifyingResults?: QualifyingResultEntry[] }>;
    };
  };
}

// ── Timing & Status Helpers ──────────────────────────────────────────────────

/**
 * Parses an F1 lap time string (e.g. "1:29.179" or "58.456") into milliseconds.
 * Returns null if the format is invalid or undefined.
 */
export function parseTimeToMs(timeStr?: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const [minutesStr, secondsStr] = trimmed.split(':');
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseFloat(secondsStr);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    return Math.round((minutes * 60 + seconds) * 1000);
  }

  const seconds = parseFloat(trimmed);
  if (Number.isNaN(seconds)) return null;
  return Math.round(seconds * 1000);
}

/**
 * Determines whether a race result status represents a classified finish
 * ("Finished", "+1 Lap", "+2 Laps", etc.).
 */
export function isFinishedStatus(status?: string): boolean {
  if (!status) return false;
  return status === 'Finished' || status.startsWith('+');
}

// ── Core Service ─────────────────────────────────────────────────────────────

/**
 * Aggregates teammate head-to-head statistics across an entire F1 season.
 *
 * Fetches all race results and qualifying classifications for the given season,
 * groups drivers by constructor to identify teammate pairings, and computes:
 * - Qualifying H2H wins, pole counts, and median/mean lap time deltas (ms)
 * - Race H2H finishes, classified completion count, and total points share
 * - Podiums, wins, fastest laps, and best grid / race finishes
 * - Round-by-round breakdown with circuits, dates, lap times, and finishing statuses
 *
 * Results are cached in Redis under `f1:h2h:season:${season}:v1`.
 */
export async function getSeasonHeadToHead(
  season: string | number
): Promise<SeasonHeadToHeadResponse> {
  const s = String(season);
  const cacheKey = `f1:h2h:season:${s}:v1`;

  return cachedFetch<SeasonHeadToHeadResponse>(
    cacheKey,
    async (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      // Past seasons are immutable -> 24h cache
      if (s !== getCurrentSeason()) return TTL.H2H;
      // Active season: dynamic TTL based on race weekend
      return isRaceWeekend() ? 60 : 15 * 60;
    },
    async () => {
      // 1. Fetch race schedule for round metadata (raceName, Circuit, date)
      const schedule = await getRaceSchedule(s);
      const scheduleMap = new Map<number, Race>();
      for (const race of schedule) {
        scheduleMap.set(parseInt(race.round, 10), race);
      }

      // 2. Fetch all season race results via paginated Jolpica requests
      const firstResultsPage = await jolpicaFetch<JolpicaResultsResponse>(
        `/${s}/results?limit=100&offset=0`
      );
      const totalResults = parseInt(firstResultsPage.MRData.total, 10) || 0;
      const allResultRaces = [...(firstResultsPage.MRData.RaceTable.Races || [])];

      if (totalResults > 100) {
        const remainingPages = Math.ceil((totalResults - 100) / 100);
        const pagePromises: Promise<JolpicaResultsResponse>[] = [];
        for (let i = 1; i <= remainingPages; i++) {
          const offset = i * 100;
          pagePromises.push(
            jolpicaFetch<JolpicaResultsResponse>(`/${s}/results?limit=100&offset=${offset}`)
          );
        }
        const pages = await Promise.all(pagePromises);
        for (const p of pages) {
          if (p.MRData.RaceTable.Races) {
            allResultRaces.push(...p.MRData.RaceTable.Races);
          }
        }
      }

      // Merge race results by round
      const resultsByRound = new Map<number, RaceResultEntry[]>();
      for (const race of allResultRaces) {
        const rNum = parseInt(race.round, 10);
        const existing = resultsByRound.get(rNum) || [];
        if (race.Results) {
          existing.push(...race.Results);
        }
        resultsByRound.set(rNum, existing);
      }

      // 3. Fetch all season qualifying results via paginated Jolpica requests
      const firstQualyPage = await jolpicaFetch<JolpicaQualyResponse>(
        `/${s}/qualifying?limit=100&offset=0`
      );
      const totalQualy = parseInt(firstQualyPage.MRData.total, 10) || 0;
      const allQualyRaces = [...(firstQualyPage.MRData.RaceTable.Races || [])];

      if (totalQualy > 100) {
        const remainingPages = Math.ceil((totalQualy - 100) / 100);
        const pagePromises: Promise<JolpicaQualyResponse>[] = [];
        for (let i = 1; i <= remainingPages; i++) {
          const offset = i * 100;
          pagePromises.push(
            jolpicaFetch<JolpicaQualyResponse>(`/${s}/qualifying?limit=100&offset=${offset}`)
          );
        }
        const pages = await Promise.all(pagePromises);
        for (const p of pages) {
          if (p.MRData.RaceTable.Races) {
            allQualyRaces.push(...p.MRData.RaceTable.Races);
          }
        }
      }

      // Merge qualifying results by round
      const qualyByRound = new Map<number, QualifyingResultEntry[]>();
      for (const race of allQualyRaces) {
        const rNum = parseInt(race.round, 10);
        const existing = qualyByRound.get(rNum) || [];
        if (race.QualifyingResults) {
          existing.push(...race.QualifyingResults);
        }
        qualyByRound.set(rNum, existing);
      }

      // Count completed races
      let completedRaces = 0;
      for (const [roundNum] of scheduleMap) {
        const raceResults = resultsByRound.get(roundNum);
        if (raceResults && raceResults.length > 0) {
          completedRaces++;
        }
      }

      // 4. Identify all constructor teammate pairings across all rounds
      // Pair key: `${constructorId}:${[driverIdA, driverIdB].sort().join(':')}`
      interface PairCandidate {
        pairKey: string;
        constructorId: string;
        constructorName: string;
        driverA: DriverH2HSummary;
        driverB: DriverH2HSummary;
        rounds: number[];
      }

      const pairMap = new Map<string, PairCandidate>();

      // Track all drivers who raced for each constructor in each round
      for (const [roundNum] of scheduleMap) {
        const raceEntries = resultsByRound.get(roundNum) || [];
        const qualyEntries = qualyByRound.get(roundNum) || [];

        // Group entries by constructor for this round
        const constructorDrivers = new Map<
          string,
          { constructorName: string; drivers: Map<string, DriverH2HSummary> }
        >();

        for (const re of raceEntries) {
          const cId = re.Constructor.constructorId;
          const group = constructorDrivers.get(cId) || {
            constructorName: re.Constructor.name,
            drivers: new Map(),
          };
          group.drivers.set(re.Driver.driverId, {
            driverId: re.Driver.driverId,
            code: re.Driver.code ?? re.Driver.driverId.slice(0, 3).toUpperCase(),
            givenName: re.Driver.givenName,
            familyName: re.Driver.familyName,
            permanentNumber: re.Driver.permanentNumber,
            nationality: re.Driver.nationality,
          });
          constructorDrivers.set(cId, group);
        }

        for (const qe of qualyEntries) {
          const cId = qe.Constructor.constructorId;
          const group = constructorDrivers.get(cId) || {
            constructorName: qe.Constructor.name,
            drivers: new Map(),
          };
          if (!group.drivers.has(qe.Driver.driverId)) {
            group.drivers.set(qe.Driver.driverId, {
              driverId: qe.Driver.driverId,
              code: qe.Driver.code ?? qe.Driver.driverId.slice(0, 3).toUpperCase(),
              givenName: qe.Driver.givenName,
              familyName: qe.Driver.familyName,
              permanentNumber: qe.Driver.permanentNumber,
              nationality: qe.Driver.nationality,
            });
          }
          constructorDrivers.set(cId, group);
        }

        // Form teammate pairs for constructors with 2+ drivers in this round
        for (const [cId, group] of constructorDrivers) {
          const driverList = Array.from(group.drivers.values());
          if (driverList.length >= 2) {
            // Usually exactly 2 drivers
            for (let i = 0; i < driverList.length; i++) {
              for (let j = i + 1; j < driverList.length; j++) {
                const [dA, dB] = [driverList[i], driverList[j]].sort((a, b) =>
                  a.driverId.localeCompare(b.driverId)
                );
                const pairKey = `${cId}:${dA.driverId}:${dB.driverId}`;
                const existing = pairMap.get(pairKey) || {
                  pairKey,
                  constructorId: cId,
                  constructorName: group.constructorName,
                  driverA: dA,
                  driverB: dB,
                  rounds: [],
                };
                if (!existing.rounds.includes(roundNum)) {
                  existing.rounds.push(roundNum);
                }
                pairMap.set(pairKey, existing);
              }
            }
          }
        }
      }

      // 5. Build TeammatePairBattle for each identified pair
      const battles: TeammatePairBattle[] = [];

      for (const candidate of pairMap.values()) {
        const { constructorId, constructorName, driverA, driverB } = candidate;
        candidate.rounds.sort((a, b) => a - b);

        // Pre-calculate points and finishes to determine driver1 (higher rank) vs driver2
        let dAPointsTotal = 0;
        let dBPointsTotal = 0;
        let dABestFinish = 999;
        let dBBestFinish = 999;

        for (const rNum of candidate.rounds) {
          const rEntries = resultsByRound.get(rNum) || [];
          const aRes = rEntries.find((e) => e.Driver.driverId === driverA.driverId);
          const bRes = rEntries.find((e) => e.Driver.driverId === driverB.driverId);

          if (aRes) {
            dAPointsTotal += parseFloat(aRes.points) || 0;
            const pos = parseInt(aRes.position, 10);
            if (!Number.isNaN(pos) && pos < dABestFinish) dABestFinish = pos;
          }
          if (bRes) {
            dBPointsTotal += parseFloat(bRes.points) || 0;
            const pos = parseInt(bRes.position, 10);
            if (!Number.isNaN(pos) && pos < dBBestFinish) dBBestFinish = pos;
          }
        }

        // Driver 1 is the primary/higher performer in the pairing
        const aIsDriver1 =
          dAPointsTotal > dBPointsTotal ||
          (dAPointsTotal === dBPointsTotal && dABestFinish <= dBBestFinish);

        const driver1 = aIsDriver1 ? driverA : driverB;
        const driver2 = aIsDriver1 ? driverB : driverA;

        // Build RoundBattle records
        const roundBattles: RoundBattle[] = [];
        const signedDeltasMs: number[] = [];

        let qD1Wins = 0;
        let qD2Wins = 0;
        let qD1Poles = 0;
        let qD2Poles = 0;
        let qTotal = 0;

        let rD1Wins = 0;
        let rD2Wins = 0;
        let bothFinishedCount = 0;

        let d1Podiums = 0;
        let d2Podiums = 0;
        let d1Wins = 0;
        let d2Wins = 0;
        let d1FastestLaps = 0;
        let d2FastestLaps = 0;
        let d1BestFinish = 999;
        let d2BestFinish = 999;
        let d1BestGrid = 999;
        let d2BestGrid = 999;
        let d1PointsSum = 0;
        let d2PointsSum = 0;

        for (const rNum of candidate.rounds) {
          const raceMeta = scheduleMap.get(rNum);
          const rEntries = resultsByRound.get(rNum) || [];
          const qEntries = qualyByRound.get(rNum) || [];

          const d1Res = rEntries.find((e) => e.Driver.driverId === driver1.driverId);
          const d2Res = rEntries.find((e) => e.Driver.driverId === driver2.driverId);
          const d1Qualy = qEntries.find((e) => e.Driver.driverId === driver1.driverId);
          const d2Qualy = qEntries.find((e) => e.Driver.driverId === driver2.driverId);

          // ── Qualifying Battle ──
          const d1QPos = d1Qualy ? parseInt(d1Qualy.position, 10) : undefined;
          const d2QPos = d2Qualy ? parseInt(d2Qualy.position, 10) : undefined;

          if (d1QPos && d1QPos < d1BestGrid) d1BestGrid = d1QPos;
          if (d2QPos && d2QPos < d2BestGrid) d2BestGrid = d2QPos;
          if (d1QPos === 1) qD1Poles++;
          if (d2QPos === 1) qD2Poles++;

          let qWinnerId: string | undefined;
          if (d1QPos && d2QPos) {
            qTotal++;
            if (d1QPos < d2QPos) {
              qWinnerId = driver1.driverId;
              qD1Wins++;
            } else if (d2QPos < d1QPos) {
              qWinnerId = driver2.driverId;
              qD2Wins++;
            }
          } else if (d1QPos) {
            qTotal++;
            qWinnerId = driver1.driverId;
            qD1Wins++;
          } else if (d2QPos) {
            qTotal++;
            qWinnerId = driver2.driverId;
            qD2Wins++;
          }

          // Shared qualifying session delta (Q3 > Q2 > Q1)
          let d1Time: string | undefined;
          let d2Time: string | undefined;
          let deltaMs: number | undefined;

          if (d1Qualy && d2Qualy) {
            const q3_1 = parseTimeToMs(d1Qualy.Q3);
            const q3_2 = parseTimeToMs(d2Qualy.Q3);
            const q2_1 = parseTimeToMs(d1Qualy.Q2);
            const q2_2 = parseTimeToMs(d2Qualy.Q2);
            const q1_1 = parseTimeToMs(d1Qualy.Q1);
            const q1_2 = parseTimeToMs(d2Qualy.Q1);

            let t1: number | null = null;
            let t2: number | null = null;

            if (q3_1 !== null && q3_2 !== null) {
              t1 = q3_1;
              t2 = q3_2;
              d1Time = d1Qualy.Q3;
              d2Time = d2Qualy.Q3;
            } else if (q2_1 !== null && q2_2 !== null) {
              t1 = q2_1;
              t2 = q2_2;
              d1Time = d1Qualy.Q2;
              d2Time = d2Qualy.Q2;
            } else if (q1_1 !== null && q1_2 !== null) {
              t1 = q1_1;
              t2 = q1_2;
              d1Time = d1Qualy.Q1;
              d2Time = d2Qualy.Q1;
            }

            if (t1 !== null && t2 !== null) {
              deltaMs = Math.abs(t1 - t2);
              // signed delta: negative means driver1 is faster by |diff| ms
              const signedDiff = t1 - t2;
              signedDeltasMs.push(signedDiff);
            }
          }

          // ── Race Battle ──
          const d1RPos = d1Res ? parseInt(d1Res.position, 10) : undefined;
          const d2RPos = d2Res ? parseInt(d2Res.position, 10) : undefined;
          const d1Status = d1Res?.status || 'Did not start';
          const d2Status = d2Res?.status || 'Did not start';
          const d1Pts = d1Res ? parseFloat(d1Res.points) || 0 : 0;
          const d2Pts = d2Res ? parseFloat(d2Res.points) || 0 : 0;

          d1PointsSum += d1Pts;
          d2PointsSum += d2Pts;

          if (d1RPos) {
            if (d1RPos < d1BestFinish) d1BestFinish = d1RPos;
            if (d1RPos <= 3) d1Podiums++;
            if (d1RPos === 1) d1Wins++;
          }
          if (d2RPos) {
            if (d2RPos < d2BestFinish) d2BestFinish = d2RPos;
            if (d2RPos <= 3) d2Podiums++;
            if (d2RPos === 1) d2Wins++;
          }

          if (d1Res?.FastestLap?.rank === '1') d1FastestLaps++;
          if (d2Res?.FastestLap?.rank === '1') d2FastestLaps++;

          let rWinnerId: string | undefined;
          const d1Finished = isFinishedStatus(d1Status);
          const d2Finished = isFinishedStatus(d2Status);

          if (d1Finished && d2Finished) {
            bothFinishedCount++;
            if (d1RPos && d2RPos) {
              if (d1RPos < d2RPos) {
                rWinnerId = driver1.driverId;
                rD1Wins++;
              } else if (d2RPos < d1RPos) {
                rWinnerId = driver2.driverId;
                rD2Wins++;
              }
            }
          } else if (d1Finished && !d2Finished) {
            rWinnerId = driver1.driverId;
            rD1Wins++;
          } else if (!d1Finished && d2Finished) {
            rWinnerId = driver2.driverId;
            rD2Wins++;
          } else {
            // Both DNF'd: treated as draw / no winner
            rWinnerId = undefined;
          }

          roundBattles.push({
            round: rNum,
            raceName: raceMeta?.raceName || `Round ${rNum}`,
            circuitName: raceMeta?.Circuit?.circuitName || 'Unknown Circuit',
            circuitId: raceMeta?.Circuit?.circuitId,
            country: raceMeta?.Circuit?.Location?.country || '',
            date: raceMeta?.date || '',
            qualifying: {
              d1Position: d1QPos,
              d2Position: d2QPos,
              d1Time,
              d2Time,
              winnerId: qWinnerId,
              deltaMs,
            },
            race: {
              d1Position: d1RPos,
              d2Position: d2RPos,
              d1Status,
              d2Status,
              winnerId: rWinnerId,
              d1Points: d1Pts,
              d2Points: d2Pts,
            },
          });
        }

        // Calculate delta statistics
        let medianDeltaMs = 0;
        let meanDeltaMs = 0;

        if (signedDeltasMs.length > 0) {
          signedDeltasMs.sort((a, b) => a - b);
          meanDeltaMs = Math.round(
            signedDeltasMs.reduce((sum, val) => sum + val, 0) / signedDeltasMs.length
          );
          const mid = Math.floor(signedDeltasMs.length / 2);
          medianDeltaMs =
            signedDeltasMs.length % 2 === 1
              ? signedDeltasMs[mid]
              : Math.round((signedDeltasMs[mid - 1] + signedDeltasMs[mid]) / 2);
        }

        const totalPoints = d1PointsSum + d2PointsSum;
        const d1SharePercent =
          totalPoints > 0
            ? Math.round((d1PointsSum / totalPoints) * 1000) / 10
            : 50;

        const stats: TeammatePairStats = {
          qualifying: {
            d1Wins: qD1Wins,
            d2Wins: qD2Wins,
            total: qTotal,
            medianDeltaMs,
            meanDeltaMs,
            d1Poles: qD1Poles,
            d2Poles: qD2Poles,
          },
          race: {
            d1Wins: rD1Wins,
            d2Wins: rD2Wins,
            bothFinishedCount,
            totalRaces: candidate.rounds.length,
          },
          points: {
            d1Points: d1PointsSum,
            d2Points: d2PointsSum,
            total: totalPoints,
            d1SharePercent,
          },
          podiums: {
            d1: d1Podiums,
            d2: d2Podiums,
          },
          wins: {
            d1: d1Wins,
            d2: d2Wins,
          },
          fastestLaps: {
            d1: d1FastestLaps,
            d2: d2FastestLaps,
          },
          bestFinish: {
            d1: d1BestFinish === 999 ? 0 : d1BestFinish,
            d2: d2BestFinish === 999 ? 0 : d2BestFinish,
          },
          bestGrid: {
            d1: d1BestGrid === 999 ? 0 : d1BestGrid,
            d2: d2BestGrid === 999 ? 0 : d2BestGrid,
          },
        };

        battles.push({
          id: `${constructorId}:${driver1.driverId}:${driver2.driverId}`,
          constructorId,
          constructorName,
          driver1,
          driver2,
          stats,
          rounds: roundBattles,
          isPrimary: false, // will mark primary below
        });
      }

      // 6. Mark primary battle for each constructor (pair with highest rounds count)
      const constructorPairsMap = new Map<string, TeammatePairBattle[]>();
      for (const battle of battles) {
        const list = constructorPairsMap.get(battle.constructorId) || [];
        list.push(battle);
        constructorPairsMap.set(battle.constructorId, list);
      }

      for (const pairList of constructorPairsMap.values()) {
        pairList.sort((a, b) => {
          if (b.rounds.length !== a.rounds.length) {
            return b.rounds.length - a.rounds.length;
          }
          return b.stats.points.total - a.stats.points.total;
        });
        if (pairList[0]) {
          pairList[0].isPrimary = true;
        }
      }

      // 7. Sort all battles:
      // Group by constructor points, primary pairs first
      const constructorTotalPoints = new Map<string, number>();
      for (const battle of battles) {
        if (battle.isPrimary) {
          constructorTotalPoints.set(
            battle.constructorId,
            battle.stats.points.total
          );
        }
      }

      battles.sort((a, b) => {
        const ptsA = constructorTotalPoints.get(a.constructorId) || 0;
        const ptsB = constructorTotalPoints.get(b.constructorId) || 0;
        if (ptsB !== ptsA) return ptsB - ptsA;
        if (a.constructorId !== b.constructorId) {
          return a.constructorId.localeCompare(b.constructorId);
        }
        // Within the same constructor: primary pair first, then more rounds
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return b.rounds.length - a.rounds.length;
      });

      return {
        season: s,
        totalRaces: schedule.length,
        completedRaces,
        teams: battles,
      };
    },
    TTL.NEGATIVE_CACHE
  );
}

/**
 * Returns a specific teammate head-to-head battle between two drivers for a season.
 * Order of driver arguments is commutative (driver1/driver2 or driver2/driver1).
 */
export async function getTeammateBattle(
  season: string | number,
  driver1Id: string,
  driver2Id: string
): Promise<TeammatePairBattle | null> {
  const data = await getSeasonHeadToHead(season);
  const d1 = driver1Id.toLowerCase();
  const d2 = driver2Id.toLowerCase();

  const match = data.teams.find(
    (team) =>
      (team.driver1.driverId.toLowerCase() === d1 &&
        team.driver2.driverId.toLowerCase() === d2) ||
      (team.driver1.driverId.toLowerCase() === d2 &&
        team.driver2.driverId.toLowerCase() === d1)
  );

  return match || null;
}

/**
 * Returns all head-to-head battles for a specific constructor in a season.
 */
export async function getConstructorBattles(
  season: string | number,
  constructorId: string
): Promise<TeammatePairBattle[]> {
  const data = await getSeasonHeadToHead(season);
  const cId = constructorId.toLowerCase();
  return data.teams.filter((team) => team.constructorId.toLowerCase() === cId);
}
