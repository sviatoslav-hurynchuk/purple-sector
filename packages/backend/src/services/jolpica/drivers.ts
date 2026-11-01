import type {
  Driver,
  DriverProfile,
  DriverSeasonStanding,
  DriverCareerStats,
} from '../../types/f1';
import { getOfficialF1DriverStats } from '../f1-official';
import {
  TTL,
  getCurrentSeason,
  jolpicaFetch,
  cachedFetch,
  mapConcurrent,
  type JolpicaResponse,
} from './client';
import type { JolpicaStandingsResponse } from './standings';

export interface DriverTable {
  season?: string;
  driverId?: string;
  Drivers: Driver[];
}

export type JolpicaDriversResponse = JolpicaResponse<'DriverTable', DriverTable>;

export interface Driver2026Entry {
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber?: string;
  code?: string;
  constructorId: string;
  constructorName: string;
}

export const DRIVER_2026_REGISTRY: Record<string, Driver2026Entry> = {
  antonelli: { givenName: 'Andrea Kimi', familyName: 'Antonelli', nationality: 'Italian', permanentNumber: '12', code: 'ANT', constructorId: 'mercedes', constructorName: 'Mercedes' },
  russell: { givenName: 'George', familyName: 'Russell', nationality: 'British', permanentNumber: '63', code: 'RUS', constructorId: 'mercedes', constructorName: 'Mercedes' },
  hamilton: { givenName: 'Lewis', familyName: 'Hamilton', nationality: 'British', permanentNumber: '44', code: 'HAM', constructorId: 'ferrari', constructorName: 'Ferrari' },
  leclerc: { givenName: 'Charles', familyName: 'Leclerc', nationality: 'Monegasque', permanentNumber: '16', code: 'LEC', constructorId: 'ferrari', constructorName: 'Ferrari' },
  verstappen: { givenName: 'Max', familyName: 'Verstappen', nationality: 'Dutch', permanentNumber: '1', code: 'VER', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  max_verstappen: { givenName: 'Max', familyName: 'Verstappen', nationality: 'Dutch', permanentNumber: '1', code: 'VER', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  hadjar: { givenName: 'Isack', familyName: 'Hadjar', nationality: 'French', permanentNumber: '6', code: 'HAD', constructorId: 'redbullracing', constructorName: 'Red Bull Racing' },
  norris: { givenName: 'Lando', familyName: 'Norris', nationality: 'British', permanentNumber: '4', code: 'NOR', constructorId: 'mclaren', constructorName: 'McLaren' },
  piastri: { givenName: 'Oscar', familyName: 'Piastri', nationality: 'Australian', permanentNumber: '81', code: 'PIA', constructorId: 'mclaren', constructorName: 'McLaren' },
  alonso: { givenName: 'Fernando', familyName: 'Alonso', nationality: 'Spanish', permanentNumber: '14', code: 'ALO', constructorId: 'astonmartin', constructorName: 'Aston Martin' },
  stroll: { givenName: 'Lance', familyName: 'Stroll', nationality: 'Canadian', permanentNumber: '18', code: 'STR', constructorId: 'astonmartin', constructorName: 'Aston Martin' },
  gasly: { givenName: 'Pierre', familyName: 'Gasly', nationality: 'French', permanentNumber: '10', code: 'GAS', constructorId: 'alpine', constructorName: 'Alpine' },
  colapinto: { givenName: 'Franco', familyName: 'Colapinto', nationality: 'Argentine', permanentNumber: '43', code: 'COL', constructorId: 'alpine', constructorName: 'Alpine' },
  albon: { givenName: 'Alexander', familyName: 'Albon', nationality: 'Thai', permanentNumber: '23', code: 'ALB', constructorId: 'williams', constructorName: 'Williams' },
  sainz: { givenName: 'Carlos', familyName: 'Sainz', nationality: 'Spanish', permanentNumber: '55', code: 'SAI', constructorId: 'williams', constructorName: 'Williams' },
  bearman: { givenName: 'Oliver', familyName: 'Bearman', nationality: 'British', permanentNumber: '87', code: 'BEA', constructorId: 'haas', constructorName: 'Haas' },
  ocon: { givenName: 'Esteban', familyName: 'Ocon', nationality: 'French', permanentNumber: '31', code: 'OCO', constructorId: 'haas', constructorName: 'Haas' },
  hulkenberg: { givenName: 'Nico', familyName: 'Hülkenberg', nationality: 'German', permanentNumber: '27', code: 'HUL', constructorId: 'audi', constructorName: 'Audi' },
  bortoleto: { givenName: 'Gabriel', familyName: 'Bortoleto', nationality: 'Brazilian', permanentNumber: '5', code: 'BOR', constructorId: 'audi', constructorName: 'Audi' },
  lawson: { givenName: 'Liam', familyName: 'Lawson', nationality: 'New Zealander', permanentNumber: '30', code: 'LAW', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  lindblad: { givenName: 'Arvid', familyName: 'Lindblad', nationality: 'British', permanentNumber: '41', code: 'LIN', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  arvid_lindblad: { givenName: 'Arvid', familyName: 'Lindblad', nationality: 'British', permanentNumber: '41', code: 'LIN', constructorId: 'racingbulls', constructorName: 'Racing Bulls' },
  bottas: { givenName: 'Valtteri', familyName: 'Bottas', nationality: 'Finnish', permanentNumber: '77', code: 'BOT', constructorId: 'cadillac', constructorName: 'Cadillac' },
  perez: { givenName: 'Sergio', familyName: 'Pérez', nationality: 'Mexican', permanentNumber: '11', code: 'PER', constructorId: 'cadillac', constructorName: 'Cadillac' },
};

export function lookupDriverRegistry(key: string): Driver2026Entry | undefined {
  return Object.prototype.hasOwnProperty.call(DRIVER_2026_REGISTRY, key) ? DRIVER_2026_REGISTRY[key] : undefined;
}

// ── Drivers ──────────────────────────────────────────────────────────────────

export async function getSeasonDrivers(season?: string | number): Promise<Driver[]> {
  const s = season ? String(season) : getCurrentSeason();
  const cacheKey = `f1:drivers:${s}`;

  return cachedFetch(cacheKey, TTL.SCHEDULE_PAST, async () => {
    const data = await jolpicaFetch<JolpicaDriversResponse>(`/${s}/drivers?limit=100`);
    return data.MRData.DriverTable.Drivers ?? [];
  });
}

export async function getDriverProfile(driverId: string): Promise<DriverProfile | null> {
  const rawId = driverId.trim().toLowerCase();
  // Map aliases to official Jolpica driverId
  const idMap: Record<string, string> = {
    lindblad: 'arvid_lindblad',
    aron: 'paul_aron',
    beganovic: 'dino_beganovic',
    'nico-hulkenberg': 'hulkenberg',
    'carlos-sainz': 'sainz',
    'max-verstappen': 'max_verstappen',
    verstappen: 'max_verstappen',
    'lewis-hamilton': 'hamilton',
  };
  const id = idMap[rawId] ?? rawId;
  const cacheKey = `f1:driver:profile:v2:${id}`;

  return cachedFetch<DriverProfile | null>(
    cacheKey,
    (profile) => {
      if (!profile) return TTL.NEGATIVE_CACHE;
      if (profile.seasonHistory.length === 0) return 60;
      if (profile.expectedSeasonsCount && profile.seasonHistory.length < profile.expectedSeasonsCount) {
        return 60;
      }
      return TTL.SCHEDULE_PAST;
    },
    async () => {
      // Fetch driver bio and seasons from Jolpica
      const [driverRes, seasonsRes] = await Promise.all([
        jolpicaFetch<JolpicaDriversResponse>(`/drivers/${id}`).catch(() => null),
        jolpicaFetch<
          JolpicaResponse<'SeasonTable', { driverId: string; Seasons: Array<{ season: string }> }>
        >(`/drivers/${id}/seasons.json?limit=100`).catch(() => null),
      ]);

      let driver: Driver | undefined = driverRes?.MRData.DriverTable.Drivers[0];

      // Smart Fallback: if Jolpica is temporarily down or has no entry, use registry fallback
      const fallbackMeta = lookupDriverRegistry(id) ?? lookupDriverRegistry(rawId);
      if (!driver) {
        if (fallbackMeta) {
          driver = {
            driverId: id,
            permanentNumber: fallbackMeta.permanentNumber,
            code: fallbackMeta.code,
            url: `https://www.formula1.com/en/drivers/${id.replace(/_/g, '-')}`,
            givenName: fallbackMeta.givenName,
            familyName: fallbackMeta.familyName,
            dateOfBirth: '',
            nationality: fallbackMeta.nationality,
          };
        } else {
          return null;
        }
      }

      const validDriver: Driver = driver;

      // Fetch official stats safely with givenName to prevent surname collisions
      const officialStats = await getOfficialF1DriverStats(id, validDriver.givenName).catch(() => null);
      if (officialStats?.bio?.dateOfBirth && !validDriver.dateOfBirth) {
        validDriver.dateOfBirth = officialStats.bio.dateOfBirth;
      }

      const seasons = seasonsRes?.MRData?.SeasonTable?.Seasons?.map((s) => s.season) ?? [];
      const currentSeason = getCurrentSeason();

      // If Jolpica returned seasons, fetch each season's standing (cached individually with limited concurrency)
      let seasonHistory: DriverSeasonStanding[] = [];
      if (seasons.length > 0) {
        const reversedSeasons = [...seasons].reverse();
        const standingsResults = await mapConcurrent(
          reversedSeasons,
          2, // Moderate concurrency to prevent saturating Jolpica rate limits
          async (seasonYear) => {
            const isCurrent = seasonYear === currentSeason;
            return cachedFetch<DriverSeasonStanding | null>(
              `f1:driver:${id}:standing:${seasonYear}`,
              (standing) => {
                if (!standing) return 60; // Do not permanently cache null
                return isCurrent ? 3600 : TTL.SCHEDULE_PAST;
              },
              async () => {
                const res = await jolpicaFetch<JolpicaStandingsResponse>(
                  `/${seasonYear}/drivers/${id}/driverStandings.json`
                );
                const list = res?.MRData?.StandingsTable?.StandingsLists?.[0];
                const entry = list?.DriverStandings?.[0];
                if (!entry) return null;
                return {
                  season: seasonYear,
                  round: list.round ?? '1',
                  position: entry.position,
                  points: entry.points,
                  wins: entry.wins,
                  constructors: (entry.Constructors ?? []).map((c) => ({
                    constructorId: c.constructorId,
                    name: c.name,
                  })),
                };
              },
              60
            ).catch(() => null); // Catch outside cachedFetch so one season failure doesn't abort the rest
          }
        );
        seasonHistory = standingsResults.filter((s): s is DriverSeasonStanding => s !== null);
      }

      // Ensure active season from official stats is present if missing from Jolpica
      const activeOfficialSeason = officialStats?.season?.year ?? currentSeason;
      if (officialStats?.season && !seasonHistory.some((s) => s.season === activeOfficialSeason)) {
        const constructors = fallbackMeta
          ? [
              {
                constructorId: fallbackMeta.constructorId,
                name: fallbackMeta.constructorName,
              },
            ]
          : [];
        seasonHistory.unshift({
          season: activeOfficialSeason,
          round: '1',
          position: officialStats.season.position || '—',
          points: officialStats.season.points || '0',
          wins: String(officialStats.season.gpWins || 0),
          constructors,
        });
      }

      seasonHistory.sort((a, b) => Number(b.season) - Number(a.season));

      // Fallback for rookie drivers without past season standings history
      if (seasonHistory.length === 0) {
        const rookieFallbackMeta = lookupDriverRegistry(id) ?? lookupDriverRegistry(rawId);
        if (rookieFallbackMeta && officialStats?.season) {
          seasonHistory = [
            {
              season: officialStats.season.year ?? getCurrentSeason(),
              round: '1',
              position: officialStats.season.position || '—',
              points: officialStats.season.points || '0',
              wins: String(officialStats.season.gpWins || 0),
              constructors: [
                {
                  constructorId: rookieFallbackMeta.constructorId,
                  name: rookieFallbackMeta.constructorName,
                },
              ],
            },
          ];
        }
      }

      const calcWins = () => {
        if (officialStats?.career) {
          const m = officialStats.career.highestRaceFinish.match(/1\s*\(x(\d+)\)/);
          if (m) return parseInt(m[1], 10);
          if (officialStats.career.highestRaceFinish === '1') return 1;
        }
        return seasonHistory.reduce((sum, s) => sum + parseInt(s.wins || '0', 10), 0);
      };

      const careerStats: DriverCareerStats = {
        wins: calcWins(),
        podiums: officialStats?.career?.podiums ?? 0,
        poles: officialStats?.career?.polePositions ?? 0,
        championships: officialStats?.career?.worldChampionships ?? 0,
        totalRaces: officialStats?.career?.grandsPrixEntered ?? 0,
      };

      return {
        driver: validDriver,
        careerStats,
        seasonHistory,
        officialStats,
        expectedSeasonsCount: seasons.length,
      };
    }
  );
}
