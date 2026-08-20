import Link from 'next/link';
import { DriverImage } from '@/components/f1/driver-image';
import { getSeasonDrivers, getDriverStandings } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { parseYear, getMaxYear } from '@/lib/utils';
import { PreloadedContent } from '@/components/f1/preloaded-content';
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
  photoUrl: string;
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
  max_verstappen: { constructorId: 'red_bull', constructorName: 'Red Bull' },
  hadjar: { constructorId: 'red_bull', constructorName: 'Red Bull' },
  sainz: { constructorId: 'williams', constructorName: 'Williams' },
  albon: { constructorId: 'williams', constructorName: 'Williams' },
  alonso: { constructorId: 'aston_martin', constructorName: 'Aston Martin' },
  stroll: { constructorId: 'aston_martin', constructorName: 'Aston Martin' },
  gasly: { constructorId: 'alpine', constructorName: 'Alpine' },
  colapinto: { constructorId: 'alpine', constructorName: 'Alpine' },
  bearman: { constructorId: 'haas', constructorName: 'Haas' },
  ocon: { constructorId: 'haas', constructorName: 'Haas' },
  lawson: { constructorId: 'rb', constructorName: 'Racing Bulls' },
  arvid_lindblad: { constructorId: 'rb', constructorName: 'Racing Bulls' },
  hulkenberg: { constructorId: 'sauber', constructorName: 'Sauber' },
  bortoleto: { constructorId: 'sauber', constructorName: 'Sauber' },
  bottas: { constructorId: 'cadillac', constructorName: 'Cadillac' },
  perez: { constructorId: 'cadillac', constructorName: 'Cadillac' },
};

function DriversGridSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col bg-card animate-pulse h-[240px]"
        >
          <div className="grid grid-cols-2 divide-x divide-white/10 flex-1 bg-zinc-900/50 p-5">
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-6 w-28 bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                <div className="h-8 w-12 bg-zinc-800/40 rounded" />
              </div>
              <div className="h-4 w-6 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-3 flex flex-col justify-between pl-5">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-6 w-28 bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                <div className="h-8 w-12 bg-zinc-800/40 rounded" />
              </div>
              <div className="h-4 w-6 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function DriversContent({
  searchParams,
  allYears,
}: DriversContentProps) {
  const params = await searchParams;
  const year = parseYear(params.season, getMaxYear());

  // Fetch drivers and standings for the season in parallel
  const [drivers, standings] = await Promise.all([
    getSeasonDrivers(year),
    getDriverStandings(year).catch(() => [] as DriverStanding[]),
  ]);

  // Build standings lookup by driverId
  const standingsMap = new Map<string, DriverStanding>(
    standings.map((s) => [s.Driver.driverId, s])
  );

  // Group drivers by constructor
  const teamMap = new Map<string, DriverWithStanding[]>();

  for (const driver of drivers) {
    const standing = standingsMap.get(driver.driverId);
    let constructorId = standing?.Constructors[0]?.constructorId;
    let constructorName = standing?.Constructors[0]?.name ?? 'Independent';

    // 2026 fallback team assignments
    if (!constructorId && year === 2026 && SEASON_2026_TEAMS[driver.driverId]) {
      constructorId = SEASON_2026_TEAMS[driver.driverId].constructorId;
      constructorName = SEASON_2026_TEAMS[driver.driverId].constructorName;
    }

    const key = constructorId ?? 'independent';
    if (!teamMap.has(key)) {
      teamMap.set(key, []);
    }

    const photoUrl = getDriverPhotoUrl(
      driver.driverId,
      driver.givenName,
      driver.familyName,
      String(year),
      key
    );

    teamMap.get(key)!.push({
      driver,
      standing,
      constructorId: key,
      constructorName,
      photoUrl,
    });
  }

  // Sort teams and drivers
  const teams: TeamGroup[] = Array.from(teamMap.entries())
    .map(([constructorId, driverList]) => {
      const sortedDrivers = [...driverList].sort((a, b) => {
        const pointsA = parseFloat(a.standing?.points ?? '0');
        const pointsB = parseFloat(b.standing?.points ?? '0');
        if (pointsB !== pointsA) return pointsB - pointsA;
        const posA = parseInt(a.standing?.position ?? '999', 10);
        const posB = parseInt(b.standing?.position ?? '999', 10);
        return posA - posB;
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

  // Collect all driver photos for preloading
  const allPhotoUrls: string[] = [];
  for (const team of teams) {
    for (const d of team.drivers) {
      if (d.photoUrl) allPhotoUrls.push(d.photoUrl);
    }
  }

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

      {/* Team-grouped Grid with Image Preloader */}
      {teams.length > 0 ? (
        <PreloadedContent imageUrls={allPhotoUrls} skeleton={<DriversGridSkeleton />}>
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
                      const { driver, standing, photoUrl } = item;
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
                            <DriverImage
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
        </PreloadedContent>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No driver data available for {year}.
        </div>
      )}
    </div>
  );
}
