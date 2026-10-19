import type {
  Race,
  SeasonReliabilityResponse,
  SeasonReliabilityKpis,
  ConstructorReliability,
  DriverReliability,
  SeasonAttritionMatrix,
  AttritionRoundMeta,
  DriverAttritionRow,
  RoundAttritionEntry,
  ReliabilityCauseBreakdown,
  ReliabilityCategory,
  ConstructorMultiSeasonReliabilityResponse,
  ConstructorSeasonHistoryEntry,
  ConstructorRoundResult,
  ConstructorRoundCarResult,
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

// ── Status Classification Helpers ────────────────────────────────────────────

/**
 * Determines whether a race result status represents a classified finish
 * ("Finished", "Lapped", or lap gap like "+1 Lap").
 */
export function isFinishedStatus(status?: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'finished' || s === 'lapped' || status.startsWith('+');
}

/**
 * Categorizes a race outcome status and positionText into a standard ReliabilityCategory.
 */
export function classifyRaceOutcome(
  status: string,
  positionText?: string
): ReliabilityCategory {
  if (!status) return 'retired';
  const s = status.trim().toLowerCase();
  const p = (positionText ?? '').trim().toUpperCase();

  // 1. Disqualification
  if (
    p === 'D' ||
    s.includes('disqualif') ||
    s.includes('excluded') ||
    s.includes('underweight')
  ) {
    return 'dsq';
  }

  // 2. Did Not Start / Withdrawn
  if (
    p === 'W' ||
    s === 'did not start' ||
    s === 'withdrew' ||
    s === 'not restarted' ||
    s === 'failed to qualify' ||
    s === 'did not qualify'
  ) {
    return 'dns';
  }

  // 3. Classified Finished
  if (isFinishedStatus(s)) {
    return 'finished';
  }

  // 4. Incident / Collision / Accident
  const incidentKeywords = [
    'collision',
    'accident',
    'spun off',
    'spin',
    'damage',
    'debris',
    'crash',
    'fatal accident',
  ];
  if (incidentKeywords.some((kw) => s.includes(kw))) {
    return 'incident';
  }

  // 5. Mechanical / Technical Failures
  const mechanicalKeywords = [
    'engine',
    'gearbox',
    'transmission',
    'clutch',
    'hydraulics',
    'electrical',
    'electronic',
    'overheating',
    'throttle',
    'exhaust',
    'oil leak',
    'oil pressure',
    'oil pump',
    'oil line',
    'oil pipe',
    'power loss',
    'drivetrain',
    'ignition',
    'battery',
    'alternator',
    'turbo',
    'supercharger',
    'misfire',
    'power unit',
    'ers',
    'radiator',
    'suspension',
    'brakes',
    'brake duct',
    'differential',
    'mechanical',
    'driveshaft',
    'wing',
    'steering',
    'technical',
    'track rod',
    'handling',
    'wheel',
    'bearing',
    'vibrations',
    'chassis',
    'halfshaft',
    'cv joint',
    'axle',
    'undertray',
    'puncture',
    'tyre',
    'tire',
    'fuel',
    'water',
    'cooling',
    'heat',
    'pneumatics',
  ];
  if (mechanicalKeywords.some((kw) => s.includes(kw))) {
    return 'mechanical';
  }

  // 6. Generic Retirement (used in modern 2023+ Jolpica data for all unclassified non-finishes)
  return 'retired';
}

/** Human-readable label for each reliability outcome category. */
export const CATEGORY_LABELS: Record<ReliabilityCategory, string> = {
  finished: 'Finished Race',
  incident: 'Collision / Incident',
  mechanical: 'Mechanical / Power Unit',
  retired: 'Retired (Unspecified)',
  dsq: 'Disqualified',
  dns: 'Did Not Start',
};

// ── Core Reliability Analytics Service ───────────────────────────────────────

/**
 * Aggregates reliability, DNF causes, completion rates, and round-by-round
 * attrition for an entire Formula 1 season.
 *
 * Fetches all official race classifications, analyzes finishing statuses,
 * computes team & driver bulletproof reliability ratings, builds the
 * full season attrition matrix, and identifies chaotic attrition rounds.
 *
 * Caches in Redis/In-memory with dynamic TTL.
 */
export async function getSeasonReliability(
  season: string | number
): Promise<SeasonReliabilityResponse> {
  const s = String(season);
  const cacheKey = `f1:reliability:season:${s}:v1`;

  return cachedFetch<SeasonReliabilityResponse>(
    cacheKey,
    async (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      // Past seasons are immutable -> 24 hours
      if (s !== getCurrentSeason()) return TTL.H2H;
      // Active season -> 60s during race weekend, 15m otherwise
      return isRaceWeekend() ? 60 : 15 * 60;
    },
    async () => {
      // 1. Fetch race schedule for season round metadata
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

      // 3. Group results by round and extract completed round numbers
      const resultsByRound = new Map<number, RaceResultEntry[]>();
      for (const race of allResultRaces) {
        const rNum = parseInt(race.round, 10);
        const existing = resultsByRound.get(rNum) || [];
        if (race.Results) {
          existing.push(...race.Results);
        }
        resultsByRound.set(rNum, existing);
      }

      const completedRoundNumbers = Array.from(resultsByRound.keys()).sort((a, b) => a - b);
      const totalRaces = schedule.length > 0 ? schedule.length : completedRoundNumbers.length;
      const completedRaces = completedRoundNumbers.length;

      // Handle empty season gracefully
      if (completedRaces === 0) {
        return {
          season: s,
          totalRaces,
          completedRaces: 0,
          kpis: {
            totalStarts: 0,
            totalFinishes: 0,
            totalDnfs: 0,
            totalDsq: 0,
            totalDns: 0,
            overallReliabilityRate: 100,
            totalLapsScheduled: 0,
            totalLapsCompleted: 0,
            lapCompletionRate: 100,
            mostReliableConstructor: null,
            leastReliableConstructor: null,
            mostChaoticRound: null,
          },
          constructors: [],
          drivers: [],
          matrix: { rounds: [], drivers: [] },
          causeBreakdown: { categories: [], detailedCauses: [] },
        };
      }

      // 4. Compute per-round metadata and lap counts
      const roundMetaMap = new Map<number, AttritionRoundMeta>();
      const roundLapsMap = new Map<number, number>();

      for (const rNum of completedRoundNumbers) {
        const results = resultsByRound.get(rNum) || [];
        const sched = scheduleMap.get(rNum);

        let maxLaps = 0;
        let starters = 0;
        let finishers = 0;
        let dnfCount = 0;

        for (const res of results) {
          const laps = parseInt(res.laps, 10) || 0;
          if (laps > maxLaps) maxLaps = laps;

          const cat = classifyRaceOutcome(res.status, res.positionText);
          if (cat !== 'dns') starters++;
          if (cat === 'finished') finishers++;
          if (cat === 'retired' || cat === 'mechanical' || cat === 'incident') dnfCount++;
        }

        roundLapsMap.set(rNum, maxLaps);

        roundMetaMap.set(rNum, {
          round: rNum,
          raceName: sched?.raceName || `Round ${rNum}`,
          circuitId: sched?.Circuit.circuitId || '',
          circuitName: sched?.Circuit.circuitName || '',
          country: sched?.Circuit.Location.country || '',
          date: sched?.date || '',
          totalLaps: maxLaps,
          starters,
          finishers,
          dnfCount,
        });
      }

      // 5. Aggregators for Constructors, Drivers, Causes, and KPIs
      interface RawDriverAgg {
        driverId: string;
        code: string;
        givenName: string;
        familyName: string;
        constructorId: string;
        constructorName: string;
        starts: number;
        finishes: number;
        dnfs: number;
        dsqs: number;
        dnss: number;
        lapsCompleted: number;
        totalPossibleLaps: number;
        roundResults: Map<number, RoundAttritionEntry>;
      }

      interface RawConstructorAgg {
        constructorId: string;
        name: string;
        nationality: string;
        starts: number;
        finishes: number;
        dnfs: number;
        dsqs: number;
        dnss: number;
        lapsCompleted: number;
        totalPossibleLaps: number;
        drivers: Map<string, {
          driverId: string;
          code: string;
          name: string;
          starts: number;
          finishes: number;
          dnfs: number;
          dsqs: number;
          dnss: number;
          lapsCompleted: number;
        }>;
        causes: Record<string, number>;
      }

      const driverAggMap = new Map<string, RawDriverAgg>();
      const constructorAggMap = new Map<string, RawConstructorAgg>();
      const causeCountsMap = new Map<string, { count: number; category: ReliabilityCategory }>();

      let globalTotalStarts = 0;
      let globalTotalFinishes = 0;
      let globalTotalDnfs = 0;
      let globalTotalDsq = 0;
      let globalTotalDns = 0;
      let globalLapsScheduled = 0;
      let globalLapsCompleted = 0;

      for (const rNum of completedRoundNumbers) {
        const results = resultsByRound.get(rNum) || [];
        const roundMaxLaps = roundLapsMap.get(rNum) || 0;

        for (const res of results) {
          const dId = res.Driver.driverId;
          const cId = res.Constructor.constructorId;
          const laps = parseInt(res.laps, 10) || 0;
          const pos = parseInt(res.position, 10) || null;
          const points = parseFloat(res.points) || 0;
          const cat = classifyRaceOutcome(res.status, res.positionText);

          // Track cause stats (skip finished)
          if (cat !== 'finished') {
            const rawStatus = res.status.trim() || 'Retired';
            const existingCause = causeCountsMap.get(rawStatus) || { count: 0, category: cat };
            existingCause.count++;
            causeCountsMap.set(rawStatus, existingCause);
          }

          const isStart = cat !== 'dns';
          const isFinish = cat === 'finished';
          const isDnf = cat === 'retired' || cat === 'mechanical' || cat === 'incident';
          const isDsq = cat === 'dsq';
          const isDns = cat === 'dns';

          // Update global counters
          if (isStart) globalTotalStarts++;
          if (isFinish) globalTotalFinishes++;
          if (isDnf) globalTotalDnfs++;
          if (isDsq) globalTotalDsq++;
          if (isDns) globalTotalDns++;
          if (isStart) globalLapsScheduled += roundMaxLaps;
          globalLapsCompleted += laps;

          // ── Update Driver Aggregator ─────────────────────────────────────────
          let dAgg = driverAggMap.get(dId);
          if (!dAgg) {
            dAgg = {
              driverId: dId,
              code: res.Driver.code || dId.slice(0, 3).toUpperCase(),
              givenName: res.Driver.givenName,
              familyName: res.Driver.familyName,
              constructorId: cId,
              constructorName: res.Constructor.name,
              starts: 0,
              finishes: 0,
              dnfs: 0,
              dsqs: 0,
              dnss: 0,
              lapsCompleted: 0,
              totalPossibleLaps: 0,
              roundResults: new Map(),
            };
            driverAggMap.set(dId, dAgg);
          }

          // Update primary constructor to the latest race
          dAgg.constructorId = cId;
          dAgg.constructorName = res.Constructor.name;

          if (isStart) {
            dAgg.starts++;
            dAgg.totalPossibleLaps += roundMaxLaps;
          }
          if (isFinish) dAgg.finishes++;
          if (isDnf) dAgg.dnfs++;
          if (isDsq) dAgg.dsqs++;
          if (isDns) dAgg.dnss++;
          dAgg.lapsCompleted += laps;

          dAgg.roundResults.set(rNum, {
            round: rNum,
            position: pos,
            positionText: res.positionText,
            laps,
            totalRoundLaps: roundMaxLaps,
            status: res.status,
            category: cat,
            points,
          });

          // ── Update Constructor Aggregator ────────────────────────────────────
          let cAgg = constructorAggMap.get(cId);
          if (!cAgg) {
            cAgg = {
              constructorId: cId,
              name: res.Constructor.name,
              nationality: res.Constructor.nationality,
              starts: 0,
              finishes: 0,
              dnfs: 0,
              dsqs: 0,
              dnss: 0,
              lapsCompleted: 0,
              totalPossibleLaps: 0,
              drivers: new Map(),
              causes: {},
            };
            constructorAggMap.set(cId, cAgg);
          }

          if (isStart) {
            cAgg.starts++;
            cAgg.totalPossibleLaps += roundMaxLaps;
          }
          if (isFinish) cAgg.finishes++;
          if (isDnf) cAgg.dnfs++;
          if (isDsq) cAgg.dsqs++;
          if (isDns) cAgg.dnss++;
          cAgg.lapsCompleted += laps;

          if (cat !== 'finished') {
            const rawStatus = res.status.trim() || 'Retired';
            cAgg.causes[rawStatus] = (cAgg.causes[rawStatus] || 0) + 1;
          }

          // Driver breakdown in constructor
          let cDriver = cAgg.drivers.get(dId);
          if (!cDriver) {
            cDriver = {
              driverId: dId,
              code: res.Driver.code || dId.slice(0, 3).toUpperCase(),
              name: `${res.Driver.givenName} ${res.Driver.familyName}`,
              starts: 0,
              finishes: 0,
              dnfs: 0,
              dsqs: 0,
              dnss: 0,
              lapsCompleted: 0,
            };
            cAgg.drivers.set(dId, cDriver);
          }
          if (isStart) cDriver.starts++;
          if (isFinish) cDriver.finishes++;
          if (isDnf) cDriver.dnfs++;
          if (isDsq) cDriver.dsqs++;
          if (isDns) cDriver.dnss++;
          cDriver.lapsCompleted += laps;
        }
      }

      // 6. Build Final Constructors Array
      const constructors: ConstructorReliability[] = Array.from(constructorAggMap.values()).map(
        (c) => {
          const relRate = c.starts > 0 ? (c.finishes / c.starts) * 100 : 0;
          const lapRate =
            c.totalPossibleLaps > 0 ? (c.lapsCompleted / c.totalPossibleLaps) * 100 : 0;

          const driverBreakdown = Array.from(c.drivers.values()).map((d) => ({
            ...d,
            reliabilityRate:
              d.starts > 0 ? Number(((d.finishes / d.starts) * 100).toFixed(1)) : 0,
          }));

          // Sort drivers by starts descending
          driverBreakdown.sort((a, b) => b.starts - a.starts);

          return {
            constructorId: c.constructorId,
            name: c.name,
            nationality: c.nationality,
            totalStarts: c.starts,
            finishes: c.finishes,
            dnfs: c.dnfs,
            dsqs: c.dsqs,
            dnss: c.dnss,
            reliabilityRate: Number(relRate.toFixed(1)),
            lapsCompleted: c.lapsCompleted,
            totalPossibleLaps: c.totalPossibleLaps,
            lapCompletionRate: Number(lapRate.toFixed(1)),
            driverBreakdown,
            causes: c.causes,
          };
        }
      );

      // Rank constructors: highest reliability rate first, then highest lap completion rate, then lowest DNFs
      constructors.sort((a, b) => {
        if (b.reliabilityRate !== a.reliabilityRate) {
          return b.reliabilityRate - a.reliabilityRate;
        }
        if (b.lapCompletionRate !== a.lapCompletionRate) {
          return b.lapCompletionRate - a.lapCompletionRate;
        }
        return a.dnfs - b.dnfs;
      });

      // 7. Build Final Drivers Array
      const drivers: DriverReliability[] = Array.from(driverAggMap.values()).map((d) => {
        const relRate = d.starts > 0 ? (d.finishes / d.starts) * 100 : 0;
        const lapRate =
          d.totalPossibleLaps > 0 ? (d.lapsCompleted / d.totalPossibleLaps) * 100 : 0;

        return {
          driverId: d.driverId,
          code: d.code,
          givenName: d.givenName,
          familyName: d.familyName,
          constructorId: d.constructorId,
          constructorName: d.constructorName,
          starts: d.starts,
          finishes: d.finishes,
          dnfs: d.dnfs,
          dsqs: d.dsqs,
          dnss: d.dnss,
          reliabilityRate: Number(relRate.toFixed(1)),
          lapsCompleted: d.lapsCompleted,
          totalPossibleLaps: d.totalPossibleLaps,
          lapCompletionRate: Number(lapRate.toFixed(1)),
        };
      });

      // Rank drivers by reliability rate descending
      drivers.sort((a, b) => {
        if (b.reliabilityRate !== a.reliabilityRate) {
          return b.reliabilityRate - a.reliabilityRate;
        }
        if (b.lapCompletionRate !== a.lapCompletionRate) {
          return b.lapCompletionRate - a.lapCompletionRate;
        }
        return a.dnfs - b.dnfs;
      });

      // 8. Build Season Attrition Matrix
      const matrixRounds: AttritionRoundMeta[] = completedRoundNumbers.map(
        (rNum) => roundMetaMap.get(rNum)!
      );

      // Order driver rows in the matrix: group by constructor ranking, then driver code
      const constructorRankMap = new Map<string, number>();
      constructors.forEach((c, idx) => constructorRankMap.set(c.constructorId, idx));

      const sortedRawDrivers = Array.from(driverAggMap.values()).sort((a, b) => {
        const rankA = constructorRankMap.get(a.constructorId) ?? 999;
        const rankB = constructorRankMap.get(b.constructorId) ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        return a.familyName.localeCompare(b.familyName);
      });

      const matrixDrivers: DriverAttritionRow[] = sortedRawDrivers.map((d) => {
        const results: RoundAttritionEntry[] = completedRoundNumbers.map((rNum) => {
          const entry = d.roundResults.get(rNum);
          if (entry) return entry;
          // If the driver did not enter this round
          const rMeta = roundMetaMap.get(rNum);
          return {
            round: rNum,
            position: null,
            positionText: '—',
            laps: 0,
            totalRoundLaps: rMeta?.totalLaps || 0,
            status: 'Did not participate',
            category: 'dns',
            points: 0,
          };
        });

        return {
          driverId: d.driverId,
          driverCode: d.code,
          driverName: `${d.givenName} ${d.familyName}`,
          constructorId: d.constructorId,
          constructorName: d.constructorName,
          results,
        };
      });

      const matrix: SeasonAttritionMatrix = {
        rounds: matrixRounds,
        drivers: matrixDrivers,
      };

      // 9. Build Cause Breakdown
      const detailedCauses: Array<{
        cause: string;
        count: number;
        category: ReliabilityCategory;
      }> = Array.from(causeCountsMap.entries())
        .map(([cause, info]) => ({
          cause,
          count: info.count,
          category: info.category,
        }))
        .sort((a, b) => b.count - a.count);

      const categoryCounts = new Map<ReliabilityCategory, number>();
      let totalNonFinishes = 0;
      for (const item of detailedCauses) {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + item.count);
        totalNonFinishes += item.count;
      }

      const categories: ReliabilityCauseBreakdown['categories'] = (
        ['mechanical', 'incident', 'retired', 'dsq', 'dns'] as ReliabilityCategory[]
      )
        .map((cat) => {
          const count = categoryCounts.get(cat) || 0;
          const percentage =
            totalNonFinishes > 0 ? Number(((count / totalNonFinishes) * 100).toFixed(1)) : 0;
          return {
            category: cat,
            label: CATEGORY_LABELS[cat],
            count,
            percentage,
          };
        })
        .filter((c) => c.count > 0);

      const causeBreakdown: ReliabilityCauseBreakdown = {
        categories,
        detailedCauses,
      };

      // 10. Compute Executive KPIs
      const overallReliabilityRate =
        globalTotalStarts > 0
          ? Number(((globalTotalFinishes / globalTotalStarts) * 100).toFixed(1))
          : 100;
      const lapCompletionRate =
        globalLapsScheduled > 0
          ? Number(((globalLapsCompleted / globalLapsScheduled) * 100).toFixed(1))
          : 100;

      const mostReliableConstructor =
        constructors.length > 0
          ? {
              constructorId: constructors[0].constructorId,
              name: constructors[0].name,
              reliabilityRate: constructors[0].reliabilityRate,
              dnfCount: constructors[0].dnfs,
            }
          : null;

      const leastReliableConstructor =
        constructors.length > 0
          ? {
              constructorId: constructors[constructors.length - 1].constructorId,
              name: constructors[constructors.length - 1].name,
              reliabilityRate: constructors[constructors.length - 1].reliabilityRate,
              dnfCount: constructors[constructors.length - 1].dnfs,
            }
          : null;

      // Find round with highest DNF count
      let mostChaoticRound: SeasonReliabilityKpis['mostChaoticRound'] = null;
      let maxDnfs = -1;
      for (const r of matrixRounds) {
        if (r.dnfCount > maxDnfs) {
          maxDnfs = r.dnfCount;
          const dnfRate =
            r.starters > 0 ? Number(((r.dnfCount / r.starters) * 100).toFixed(1)) : 0;
          mostChaoticRound = {
            round: r.round,
            raceName: r.raceName,
            country: r.country,
            dnfCount: r.dnfCount,
            dnfRate,
          };
        }
      }

      const kpis: SeasonReliabilityKpis = {
        totalStarts: globalTotalStarts,
        totalFinishes: globalTotalFinishes,
        totalDnfs: globalTotalDnfs,
        totalDsq: globalTotalDsq,
        totalDns: globalTotalDns,
        overallReliabilityRate,
        totalLapsScheduled: globalLapsScheduled,
        totalLapsCompleted: globalLapsCompleted,
        lapCompletionRate,
        mostReliableConstructor,
        leastReliableConstructor,
        mostChaoticRound,
      };

      return {
        season: s,
        totalRaces,
        completedRaces,
        kpis,
        constructors,
        drivers,
        matrix,
        causeBreakdown,
      };
    },
    TTL.NEGATIVE_CACHE
  );
}

/**
 * Returns multi-season reliability history and active-season detailed breakdown
 * for a specific constructor across recent seasons (up to 5 seasons).
 */
export async function getConstructorMultiSeasonReliability(
  constructorId: string,
  season?: string | number
): Promise<ConstructorMultiSeasonReliabilityResponse | null> {
  const currentSeasonStr = getCurrentSeason();
  const activeSeason = season ? Number(season) : Number(currentSeasonStr);
  const cacheKey = `f1:reliability:history:v2:${constructorId.toLowerCase()}:${activeSeason}`;

  // Analyze active season plus up to 4 preceding seasons (5 total)
  const seasonsToFetch: number[] = [];
  for (let y = activeSeason; y >= Math.max(1950, activeSeason - 4); y--) {
    seasonsToFetch.push(y);
  }

  let failedSeasonFetches = 0;

  return cachedFetch<ConstructorMultiSeasonReliabilityResponse | null>(
    cacheKey,
    async (data) => {
      if (!data) return TTL.NEGATIVE_CACHE;
      // If incomplete history due to fetch failures, revalidate soon
      if (failedSeasonFetches > 0) return 60;
      if (activeSeason < Number(currentSeasonStr)) return TTL.LAPS; // Past season immutable
      return isRaceWeekend() ? 60 : 300;
    },
    async () => {
      const seasonResults: (SeasonReliabilityResponse | null)[] = [];
      for (const y of seasonsToFetch) {
        const res = await getSeasonReliability(y).catch(() => {
          failedSeasonFetches++;
          return null;
        });
        seasonResults.push(res);
      }

      const activeIdx = seasonsToFetch.indexOf(activeSeason);
      const activeData = seasonResults[activeIdx];
      const activeConstructor = activeData?.constructors.find(
        (c) => c.constructorId.toLowerCase() === constructorId.toLowerCase()
      );

      // If active data doesn't have the constructor, check other fetched seasons for metadata
      let constructorName = activeConstructor?.name ?? '';
      let constructorNationality = activeConstructor?.nationality ?? '';

      if (!constructorName) {
        for (const data of seasonResults) {
          const match = data?.constructors.find(
            (c) => c.constructorId.toLowerCase() === constructorId.toLowerCase()
          );
          if (match) {
            constructorName = match.name;
            constructorNationality = match.nationality;
            break;
          }
        }
      }

      // If constructor not found in any season:
      // If any season fetch failed, throw an error to prevent negative caching a valid constructor
      if (!constructorName) {
        if (failedSeasonFetches > 0) {
          throw new Error(
            `Failed to load reliability history for constructor ${constructorId} due to upstream fetch failure.`
          );
        }
        return null;
      }

      // Compile multi-season history
      const history: ConstructorSeasonHistoryEntry[] = [];
      for (let i = 0; i < seasonsToFetch.length; i++) {
        const y = seasonsToFetch[i];
        const data = seasonResults[i];
        if (!data) continue;

        const cIndex = data.constructors.findIndex(
          (c) => c.constructorId.toLowerCase() === constructorId.toLowerCase()
        );
        if (cIndex === -1) continue;

        const c = data.constructors[cIndex];
        if (c.totalStarts === 0) continue;

        let mechanicalDnfs = 0;
        let incidentDnfs = 0;
        for (const [cause, count] of Object.entries(c.causes)) {
          const category = classifyRaceOutcome(cause);
          if (category === 'mechanical') mechanicalDnfs += count;
          else if (category === 'incident') incidentDnfs += count;
        }

        history.push({
          season: y,
          totalStarts: c.totalStarts,
          finishes: c.finishes,
          dnfs: c.dnfs,
          dsqs: c.dsqs,
          dnss: c.dnss,
          mechanicalDnfs,
          incidentDnfs,
          reliabilityRate: c.reliabilityRate,
          lapCompletionRate: c.lapCompletionRate,
          lapsCompleted: c.lapsCompleted,
          totalPossibleLaps: c.totalPossibleLaps,
          gridReliabilityRank: cIndex + 1,
          totalConstructors: data.constructors.length,
        });
      }

      // Build active season details (or fallback to empty if active season has no data yet)
      const fallbackConstructor: ConstructorReliability = activeConstructor || {
        constructorId: constructorId.toLowerCase(),
        name: constructorName,
        nationality: constructorNationality,
        totalStarts: 0,
        finishes: 0,
        dnfs: 0,
        dsqs: 0,
        dnss: 0,
        reliabilityRate: 100,
        lapsCompleted: 0,
        totalPossibleLaps: 0,
        lapCompletionRate: 100,
        driverBreakdown: [],
        causes: {},
      };

      // Detailed causes for active season
      const detailedCauses = Object.entries(fallbackConstructor.causes)
        .map(([cause, count]) => ({
          cause,
          count,
          category: classifyRaceOutcome(cause),
        }))
        .sort((a, b) => b.count - a.count);

      const catCountMap = new Map<ReliabilityCategory, number>();
      let totalCauses = 0;
      for (const item of detailedCauses) {
        catCountMap.set(item.category, (catCountMap.get(item.category) || 0) + item.count);
        totalCauses += item.count;
      }

      const categories = Array.from(catCountMap.entries())
        .map(([cat, count]) => ({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          count,
          percentage: totalCauses > 0 ? Number(((count / totalCauses) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const causeBreakdown: ReliabilityCauseBreakdown = {
        categories,
        detailedCauses,
      };

      // Rounds for active season
      const rounds: ConstructorRoundResult[] = [];
      if (activeData?.matrix) {
        const teamDrivers = activeData.matrix.drivers.filter(
          (d) => d.constructorId.toLowerCase() === constructorId.toLowerCase()
        );

        for (const roundMeta of activeData.matrix.rounds) {
          const cars: ConstructorRoundCarResult[] = [];
          for (const d of teamDrivers) {
            const rEntry = d.results.find((r) => r.round === roundMeta.round);
            if (rEntry) {
              cars.push({
                driverId: d.driverId,
                driverCode: d.driverCode,
                driverName: d.driverName,
                positionText: rEntry.positionText,
                position: rEntry.position,
                status: rEntry.status,
                category: rEntry.category,
                lapsCompleted: rEntry.laps,
                points: rEntry.points,
              });
            }
          }

          rounds.push({
            round: roundMeta.round,
            raceName: roundMeta.raceName,
            circuitId: roundMeta.circuitId,
            circuitName: roundMeta.circuitName,
            country: roundMeta.country,
            date: roundMeta.date,
            cars,
          });
        }
      }

      // Aggregate all-time KPIs across analyzed seasons
      const totalStarts = history.reduce((sum, h) => sum + h.totalStarts, 0);
      const totalFinishes = history.reduce((sum, h) => sum + h.finishes, 0);
      const totalMechanicalDnfs = history.reduce((sum, h) => sum + h.mechanicalDnfs, 0);
      const totalIncidentDnfs = history.reduce((sum, h) => sum + h.incidentDnfs, 0);
      const overallReliabilityRate =
        totalStarts > 0 ? Number(((totalFinishes / totalStarts) * 100).toFixed(1)) : 0;

      return {
        constructorId: constructorId.toLowerCase(),
        name: constructorName,
        nationality: constructorNationality,
        activeSeason,
        allTimeKpis: {
          seasonsAnalyzed: history.length,
          totalStarts,
          totalFinishes,
          overallReliabilityRate,
          totalMechanicalDnfs,
          totalIncidentDnfs,
        },
        history,
        activeSeasonDetails: {
          constructor: fallbackConstructor,
          causeBreakdown,
          rounds,
        },
      };
    },
    TTL.NEGATIVE_CACHE
  );
}
