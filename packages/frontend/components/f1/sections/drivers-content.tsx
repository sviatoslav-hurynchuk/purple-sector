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
  bestPosition: number;
}

export async function DriversContent({ searchParams, allYears }: DriversContentProps) {
  const { season } = await searchParams;

  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  const [drivers, standings] = await Promise.all([
    getSeasonDrivers(year).catch(() => [] as Driver[]),
    getDriverStandings(year).catch(() => [] as DriverStanding[]),
  ]);

  // Map standings by driverId for fast lookup
  const standingsMap = new Map<string, DriverStanding>(
    standings.map((s) => [s.Driver.driverId, s])
  );

  // Enrich each driver with team info from standings
  const enriched: DriverWithStanding[] = drivers.map((driver) => {
    const standing = standingsMap.get(driver.driverId);
    return {
      driver,
      standing,
      constructorId: standing?.Constructors[0]?.constructorId ?? 'unknown',
      constructorName: standing?.Constructors[0]?.name ?? 'Unknown',
    };
  });

  // Group into team buckets
  const teamMap = new Map<string, DriverWithStanding[]>();
  for (const item of enriched) {
    const key = item.constructorId;
    if (!teamMap.has(key)) teamMap.set(key, []);
    teamMap.get(key)!.push(item);
  }

  // Build sorted team groups (by best championship position)
  const teams: TeamGroup[] = Array.from(teamMap.entries())
    .map(([constructorId, driverList]) => {
      const sortedDrivers = [...driverList].sort((a, b) => {
        const posA = parseInt(a.standing?.position ?? '999', 10);
        const posB = parseInt(b.standing?.position ?? '999', 10);
        return posA - posB;
      });
      const bestPosition = sortedDrivers[0]?.standing
        ? parseInt(sortedDrivers[0].standing.position, 10)
        : 999;
      return {
        constructorId,
        constructorName: driverList[0].constructorName,
        drivers: sortedDrivers,
        bestPosition,
      };
    })
    .sort((a, b) => a.bestPosition - b.bestPosition);

  const hasTeamData = teams.length > 0 && teams.some((t) => t.constructorId !== 'unknown');

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

      {/* Team-grouped grid */}
      {hasTeamData ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {teams.map((team) => {
            const theme = getTeamTheme(team.constructorId);
            const isLight = theme.textColor === 'dark';

            return (
              <div
                key={team.constructorId}
                className="grid grid-cols-2 rounded-2xl overflow-hidden border border-white/5"
              >
                {team.drivers.slice(0, 2).map((item, driverIdx) => {
                  const { driver, standing } = item;
                  const photoUrl = getDriverPhotoUrl(driver.driverId, driver.givenName, driver.familyName);
                  const driverNumber =
                    standing?.Driver?.permanentNumber ?? driver.permanentNumber;

                  return (
                    <Link
                      key={driver.driverId}
                      href={`/drivers/${driver.driverId}`}
                      className={[
                        'group relative overflow-hidden',
                        'h-52 sm:h-56 flex flex-col justify-between p-4 sm:p-5',
                        'transition-all duration-200',
                        driverIdx === 0 ? 'border-r border-black/20' : '',
                      ].join(' ')}
                      style={{ backgroundColor: theme.primary }}
                    >
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />

                      {/* Content above photo */}
                      <div className="relative z-10">
                        {/* Driver name */}
                        <p
                          className={[
                            'text-xs font-semibold leading-tight opacity-90',
                            isLight ? 'text-black/80' : 'text-white/80',
                          ].join(' ')}
                        >
                          {driver.givenName}
                        </p>
                        <h2
                          className={[
                            'text-lg sm:text-xl font-black leading-tight tracking-tight',
                            isLight ? 'text-black' : 'text-white',
                          ].join(' ')}
                        >
                          {driver.familyName}
                        </h2>
                        {/* Team name */}
                        <p
                          className={[
                            'text-xs mt-0.5 leading-none',
                            isLight ? 'text-black/60' : 'text-white/60',
                          ].join(' ')}
                        >
                          {team.constructorName}
                        </p>

                        {/* Driver number — large italic */}
                        {driverNumber && (
                          <p
                            className={[
                              'text-3xl sm:text-4xl font-black italic mt-1 leading-none',
                              isLight ? 'text-black/90' : 'text-white/90',
                            ].join(' ')}
                          >
                            {driverNumber}
                          </p>
                        )}
                      </div>

                      {/* Flag at bottom left */}
                      <div className="relative z-10">
                        <CountryFlag countryName={driver.nationality} />
                      </div>

                      {/* Driver photo — bottom-right, transparent cut-out */}
                      <div className="absolute bottom-0 right-0 h-[130%] w-[60%] pointer-events-none select-none">
                        <Image
                          src={photoUrl}
                          alt={`${driver.givenName} ${driver.familyName}`}
                          fill
                          sizes="200px"
                          className="object-contain object-bottom transition-transform duration-300 group-hover:scale-[1.04]"
                          unoptimized
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback: simple grid when no standings (pre-season / historical) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {drivers.map((driver) => {
            const photoUrl = getDriverPhotoUrl(driver.driverId, driver.givenName, driver.familyName);
            return (
              <Link
                key={driver.driverId}
                href={`/drivers/${driver.driverId}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 h-56 flex flex-col justify-between p-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CountryFlag countryName={driver.nationality} />
                    {driver.code && (
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {driver.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{driver.givenName}</p>
                  <h2 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                    {driver.familyName}
                  </h2>
                  {driver.permanentNumber && (
                    <p className="text-4xl font-black italic text-muted-foreground/30 mt-1">
                      {driver.permanentNumber}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 h-[80%] w-[55%] pointer-events-none">
                  <Image
                    src={photoUrl}
                    alt={`${driver.givenName} ${driver.familyName}`}
                    fill
                    sizes="160px"
                    className="object-contain object-bottom"
                    unoptimized
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {drivers.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          No driver data available for {year}. Try a different season.
        </div>
      )}
    </div>
  );
}
