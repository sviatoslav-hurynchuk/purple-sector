import Link from 'next/link';
import Image from 'next/image';
import { getSeasonDrivers, getDriverStandings } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { parseYear, getMaxYear } from '@/lib/utils';
import type { Driver, DriverStanding } from '@/types/f1';

interface DriversContentProps {
  searchParams: Promise<{ season?: string }>;
  allYears: number[];
}

interface DriverWithStanding {
  driver: Driver;
  standing: DriverStanding | undefined;
  constructorId: string;
  constructorName: string;
}

interface TeamGroup {
  constructorId: string;
  constructorName: string;
  drivers: DriverWithStanding[];
  reserves?: DriverWithStanding[];
  bestPosition: number;
}

/**
 * Known 2026 grid team assignments for pairing when standings API has not populated yet.
 */
const SEASON_2026_TEAMS: Record<string, { constructorId: string; constructorName: string }> = {
  russell: { constructorId: 'mercedes', constructorName: 'Mercedes' },
  antonelli: { constructorId: 'mercedes', constructorName: 'Mercedes' },
  leclerc: { constructorId: 'ferrari', constructorName: 'Ferrari' },
  hamilton: { constructorId: 'ferrari', constructorName: 'Ferrari' },
  norris: { constructorId: 'mclaren', constructorName: 'McLaren' },
  piastri: { constructorId: 'mclaren', constructorName: 'McLaren' },
  max_verstappen: { constructorId: 'red_bull', constructorName: 'Red Bull Racing' },
  hadjar: { constructorId: 'red_bull', constructorName: 'Red Bull Racing' },
  lawson: { constructorId: 'racing_bulls', constructorName: 'Racing Bulls' },
  lindblad: { constructorId: 'racing_bulls', constructorName: 'Racing Bulls' },
  gasly: { constructorId: 'alpine', constructorName: 'Alpine' },
  colapinto: { constructorId: 'alpine', constructorName: 'Alpine' },
  bearman: { constructorId: 'haas', constructorName: 'Haas F1 Team' },
  ocon: { constructorId: 'haas', constructorName: 'Haas F1 Team' },
  bortoleto: { constructorId: 'audi', constructorName: 'Audi' },
  hulkenberg: { constructorId: 'audi', constructorName: 'Audi' },
  sainz: { constructorId: 'williams', constructorName: 'Williams' },
  albon: { constructorId: 'williams', constructorName: 'Williams' },
  alonso: { constructorId: 'aston_martin', constructorName: 'Aston Martin' },
  stroll: { constructorId: 'aston_martin', constructorName: 'Aston Martin' },
  bottas: { constructorId: 'cadillac', constructorName: 'Cadillac F1 Team' },
  perez: { constructorId: 'cadillac', constructorName: 'Cadillac F1 Team' },
};

export async function DriversContent({ searchParams, allYears }: DriversContentProps) {
  const { season } = await searchParams;

  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  const [drivers, standings] = await Promise.all([
    getSeasonDrivers(year).catch(() => [] as Driver[]),
    getDriverStandings(year).catch(() => [] as DriverStanding[]),
  ]);

  const standingsMap = new Map<string, DriverStanding>(
    standings.map((s) => [s.Driver.driverId, s])
  );

  // Combine all known drivers for this season from standings (primary) and season driver list
  const allDriverIds = new Set<string>();
  const driverObjectsMap = new Map<string, Driver>();

  for (const s of standings) {
    allDriverIds.add(s.Driver.driverId);
    driverObjectsMap.set(s.Driver.driverId, s.Driver);
  }
  for (const d of drivers) {
    allDriverIds.add(d.driverId);
    if (!driverObjectsMap.has(d.driverId)) {
      driverObjectsMap.set(d.driverId, d);
    }
  }

  // Enrich drivers with team information
  const enriched: DriverWithStanding[] = Array.from(allDriverIds)
    .map((driverId) => {
      const driver = driverObjectsMap.get(driverId)!;
      const standing = standingsMap.get(driverId);
      const fallback = year === 2026 ? SEASON_2026_TEAMS[driverId] : undefined;

      const constructorId =
        standing?.Constructors[0]?.constructorId ?? fallback?.constructorId ?? 'unknown';
      const constructorName =
        standing?.Constructors[0]?.name ?? fallback?.constructorName ?? 'Unknown';

      return {
        driver,
        standing,
        constructorId,
        constructorName,
      };
    })
    // Filter out unassigned reserve/test drivers without a team
    .filter((item) => item.constructorId !== 'unknown');

  // Group by constructorId
  const teamMap = new Map<string, DriverWithStanding[]>();
  for (const item of enriched) {
    const key = item.constructorId;
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key)!.push(item);
  }

  // Build sorted team list (selecting top 2 primary drivers by season points / championship rank)
  const teams: TeamGroup[] = Array.from(teamMap.entries())
    .map(([constructorId, driverList]) => {
      const sortedDrivers = [...driverList].sort((a, b) => {
        const pointsA = parseFloat(a.standing?.points ?? '0');
        const pointsB = parseFloat(b.standing?.points ?? '0');
        if (pointsB !== pointsA) return pointsB - pointsA; // Higher points first

        const posA = parseInt(a.standing?.position ?? '999', 10);
        const posB = parseInt(b.standing?.position ?? '999', 10);
        return posA - posB; // Better position first
      });

      const primaryDrivers = sortedDrivers.slice(0, 2);
      const reserveDrivers = sortedDrivers.slice(2);

      const bestPosition = primaryDrivers[0]?.standing
        ? parseInt(primaryDrivers[0].standing.position, 10)
        : 999;

      return {
        constructorId,
        constructorName: driverList[0].constructorName,
        drivers: primaryDrivers,
        reserves: reserveDrivers,
        bestPosition,
      };
    })
    .sort((a, b) => a.bestPosition - b.bestPosition);

  return (
    <div className="space-y-8">
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{year} Formula 1 Drivers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete driver lineup for the {year} FIA Formula 1 World Championship.
          </p>
        </div>
        <SeasonSelector currentSeason={year} allYears={allYears} />
      </div>

      {/* Team-grouped Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {teams.map((team) => {
            const theme = getTeamTheme(team.constructorId);
            const isLight = theme.textColor === 'dark';

            return (
              <div
                key={team.constructorId}
                className="rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col"
              >
                {/* 2 Primary Drivers (Left | Right) */}
                <div className="grid grid-cols-2 flex-1">
                  {team.drivers.map((item, driverIdx) => {
                    const { driver, standing } = item;
                    const photoUrl = getDriverPhotoUrl(
                      driver.driverId,
                      driver.givenName,
                      driver.familyName,
                      String(year),
                      team.constructorId
                    );
                    const driverNumber =
                      standing?.Driver?.permanentNumber ?? driver.permanentNumber;

                    return (
                      <Link
                        key={driver.driverId}
                        href={`/drivers/${driver.driverId}`}
                        className={[
                          'group relative overflow-hidden',
                          'min-h-[220px] sm:min-h-[240px] flex flex-col justify-between p-5',
                          'transition-all duration-200',
                          driverIdx === 0 ? 'border-r border-black/20' : '',
                        ].join(' ')}
                        style={{ backgroundColor: theme.primary }}
                      >
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />

                        {/* Content block — Name & Team */}
                        <div className="relative z-10 space-y-0.5">
                          <p
                            className={[
                              'text-xs font-semibold leading-tight uppercase tracking-wider',
                              isLight ? 'text-black/80' : 'text-white/80',
                            ].join(' ')}
                          >
                            {driver.givenName}
                          </p>
                          <h2
                            className={[
                              'text-xl sm:text-2xl font-black leading-tight tracking-tight uppercase',
                              isLight ? 'text-black' : 'text-white',
                            ].join(' ')}
                          >
                            {driver.familyName}
                          </h2>
                          <p
                            className={[
                              'text-xs font-medium',
                              isLight ? 'text-black/60' : 'text-white/60',
                            ].join(' ')}
                          >
                            {team.constructorName}
                          </p>

                          {driverNumber && (
                            <p
                              className={[
                                'text-3xl sm:text-4xl font-black italic mt-1 leading-none font-mono',
                                isLight ? 'text-black/90' : 'text-white/90',
                              ].join(' ')}
                            >
                              {driverNumber}
                            </p>
                          )}
                        </div>

                        {/* Flag at bottom left */}
                        <div className="relative z-10 mt-auto pt-4">
                          <CountryFlag countryName={driver.nationality} />
                        </div>

                        {/* Driver photo cut-out — waist-up */}
                        <div className="absolute top-1 -right-2 sm:right-0 h-[210%] w-[72%] sm:w-[66%] pointer-events-none select-none">
                          <Image
                            src={photoUrl}
                            alt={`${driver.givenName} ${driver.familyName}`}
                            fill
                            sizes="(max-width: 640px) 350px, 400px"
                            className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-md"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footnote for replacement / reserve drivers in historical seasons */}
                {team.reserves && team.reserves.length > 0 && (
                  <div className="bg-black/70 border-t border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Other drivers in {year}:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {team.reserves.map((r) => (
                        <Link
                          key={r.driver.driverId}
                          href={`/drivers/${r.driver.driverId}`}
                          className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
                        >
                          {r.driver.givenName} {r.driver.familyName}
                          {r.standing?.points ? ` (${r.standing.points} pts)` : ''}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No driver data available for {year}.
        </div>
      )}
    </div>
  );
}
