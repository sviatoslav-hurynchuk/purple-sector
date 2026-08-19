import Link from 'next/link';
import Image from 'next/image';
import { Trophy, ChevronRight, MapPin, Award } from 'lucide-react';
import { getSeasonConstructors, getDriverStandings, getConstructorStandings } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { parseYear, getMaxYear } from '@/lib/utils';
import type { Constructor, DriverStanding, ConstructorStanding, Driver } from '@/types/f1';

interface ConstructorsContentProps {
  searchParams: Promise<{ season?: string }>;
  allYears: number[];
}

/** 2026 Known Driver Pairings fallback when standings are not yet populated */
const SEASON_2026_LINEUP: Record<string, Array<{ driverId: string; givenName: string; familyName: string; permanentNumber?: string }>> = {
  mercedes: [
    { driverId: 'russell', givenName: 'George', familyName: 'Russell', permanentNumber: '63' },
    { driverId: 'antonelli', givenName: 'Andrea Kimi', familyName: 'Antonelli', permanentNumber: '12' },
  ],
  ferrari: [
    { driverId: 'leclerc', givenName: 'Charles', familyName: 'Leclerc', permanentNumber: '16' },
    { driverId: 'hamilton', givenName: 'Lewis', familyName: 'Hamilton', permanentNumber: '44' },
  ],
  mclaren: [
    { driverId: 'norris', givenName: 'Lando', familyName: 'Norris', permanentNumber: '4' },
    { driverId: 'piastri', givenName: 'Oscar', familyName: 'Piastri', permanentNumber: '81' },
  ],
  red_bull: [
    { driverId: 'max_verstappen', givenName: 'Max', familyName: 'Verstappen', permanentNumber: '1' },
    { driverId: 'hadjar', givenName: 'Isack', familyName: 'Hadjar', permanentNumber: '6' },
  ],
  racing_bulls: [
    { driverId: 'lawson', givenName: 'Liam', familyName: 'Lawson', permanentNumber: '30' },
    { driverId: 'arvid_lindblad', givenName: 'Arvid', familyName: 'Lindblad', permanentNumber: '41' },
  ],
  rb: [
    { driverId: 'lawson', givenName: 'Liam', familyName: 'Lawson', permanentNumber: '30' },
    { driverId: 'arvid_lindblad', givenName: 'Arvid', familyName: 'Lindblad', permanentNumber: '41' },
  ],
  alpine: [
    { driverId: 'gasly', givenName: 'Pierre', familyName: 'Gasly', permanentNumber: '10' },
    { driverId: 'colapinto', givenName: 'Franco', familyName: 'Colapinto', permanentNumber: '43' },
  ],
  haas: [
    { driverId: 'bearman', givenName: 'Oliver', familyName: 'Bearman', permanentNumber: '87' },
    { driverId: 'ocon', givenName: 'Esteban', familyName: 'Ocon', permanentNumber: '31' },
  ],
  audi: [
    { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg', permanentNumber: '27' },
    { driverId: 'bortoleto', givenName: 'Gabriel', familyName: 'Bortoleto', permanentNumber: '5' },
  ],
  sauber: [
    { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg', permanentNumber: '27' },
    { driverId: 'bortoleto', givenName: 'Gabriel', familyName: 'Bortoleto', permanentNumber: '5' },
  ],
  williams: [
    { driverId: 'sainz', givenName: 'Carlos', familyName: 'Sainz', permanentNumber: '55' },
    { driverId: 'albon', givenName: 'Alexander', familyName: 'Albon', permanentNumber: '23' },
  ],
  aston_martin: [
    { driverId: 'alonso', givenName: 'Fernando', familyName: 'Alonso', permanentNumber: '14' },
    { driverId: 'stroll', givenName: 'Lance', familyName: 'Stroll', permanentNumber: '18' },
  ],
  cadillac: [
    { driverId: 'bottas', givenName: 'Valtteri', familyName: 'Bottas', permanentNumber: '77' },
    { driverId: 'perez', givenName: 'Sergio', familyName: 'Pérez', permanentNumber: '11' },
  ],
};

interface TeamDriverDisplay {
  driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    permanentNumber?: string;
    nationality: string;
    code?: string;
    url?: string;
    dateOfBirth?: string;
  };
  standing?: DriverStanding;
}

export async function ConstructorsContent({ searchParams, allYears }: ConstructorsContentProps) {
  const { season } = await searchParams;

  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  const [constructors, driverStandings, constructorStandings] = await Promise.all([
    getSeasonConstructors(year).catch(() => [] as Constructor[]),
    getDriverStandings(year).catch(() => [] as DriverStanding[]),
    getConstructorStandings(year).catch(() => [] as ConstructorStanding[]),
  ]);

  const constructorStandingsMap = new Map<string, ConstructorStanding>(
    constructorStandings.map((cs) => [cs.Constructor.constructorId, cs])
  );

  // Group drivers by constructor
  const constructorDriversMap = new Map<string, TeamDriverDisplay[]>();
  for (const s of driverStandings) {
    const cId = s.Constructors[0]?.constructorId;
    if (cId) {
      if (!constructorDriversMap.has(cId)) constructorDriversMap.set(cId, []);
      constructorDriversMap.get(cId)!.push({
        driver: s.Driver,
        standing: s,
      });
    }
  }

  // Sort constructors by constructor standings position or name
  const sortedConstructors = [...constructors].sort((a, b) => {
    const posA = parseInt(constructorStandingsMap.get(a.constructorId)?.position ?? '999', 10);
    const posB = parseInt(constructorStandingsMap.get(b.constructorId)?.position ?? '999', 10);
    if (posA !== posB) return posA - posB;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8">
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{year} Formula 1 Teams</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Constructors championship contenders, lineups, and team profiles for the {year} season.
          </p>
        </div>
        <SeasonSelector currentSeason={year} allYears={allYears} />
      </div>

      {/* Constructors Grid */}
      {sortedConstructors.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedConstructors.map((team) => {
            const theme = getTeamTheme(team.constructorId);
            const isLight = theme.textColor === 'dark';
            const standing = constructorStandingsMap.get(team.constructorId);

            // Determine drivers: from standings or fallback
            let teamDrivers: TeamDriverDisplay[] = constructorDriversMap.get(team.constructorId) ?? [];
            if (teamDrivers.length === 0 && year === 2026 && SEASON_2026_LINEUP[team.constructorId]) {
              teamDrivers = SEASON_2026_LINEUP[team.constructorId].map((d) => ({
                driver: {
                  driverId: d.driverId,
                  givenName: d.givenName,
                  familyName: d.familyName,
                  permanentNumber: d.permanentNumber,
                  nationality: 'International',
                  url: '',
                },
              }));
            }

            // Top 2 primary drivers sorted by points/rank
            const sortedDrivers = [...teamDrivers].sort((a, b) => {
              const pA = parseFloat(a.standing?.points ?? '0');
              const pB = parseFloat(b.standing?.points ?? '0');
              if (pB !== pA) return pB - pA;
              return parseInt(a.standing?.position ?? '999', 10) - parseInt(b.standing?.position ?? '999', 10);
            });
            const primaryDrivers = sortedDrivers.slice(0, 2);

            return (
              <div
                key={team.constructorId}
                className="rounded-2xl border border-white/10 bg-card overflow-hidden shadow-xl flex flex-col hover:border-white/20 transition-all duration-300"
              >
                {/* Team Top Header Strip */}
                <div
                  className="p-5 flex items-center justify-between border-b border-black/20"
                  style={{ backgroundColor: theme.primary }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CountryFlag countryName={team.nationality} />
                      <span
                        className={[
                          'text-xs font-semibold uppercase tracking-wider',
                          isLight ? 'text-black/70' : 'text-white/70',
                        ].join(' ')}
                      >
                        {team.nationality}
                      </span>
                    </div>
                    <Link
                      href={`/constructors/${team.constructorId}`}
                      className={[
                        'text-2xl font-black uppercase tracking-tight block hover:opacity-85 transition-opacity',
                        isLight ? 'text-black' : 'text-white',
                      ].join(' ')}
                    >
                      {team.name}
                    </Link>
                  </div>

                  {standing && (
                    <div
                      className={[
                        'text-right px-3 py-1.5 rounded-lg border',
                        isLight
                          ? 'bg-black/10 border-black/20 text-black'
                          : 'bg-white/10 border-white/20 text-white',
                      ].join(' ')}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Pos / Pts
                      </span>
                      <span className="text-xl font-black font-mono">
                        P{standing.position} <span className="text-xs font-normal">({standing.points} pts)</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* 2 Primary Drivers Grid */}
                {primaryDrivers.length > 0 && (
                  <div className="grid grid-cols-2 bg-zinc-950/40 divide-x divide-white/5 border-b border-white/10 flex-1">
                    {primaryDrivers.map((item) => {
                      const { driver, standing: dStanding } = item;
                      const photoUrl = getDriverPhotoUrl(
                        driver.driverId,
                        driver.givenName,
                        driver.familyName,
                        String(year),
                        team.constructorId
                      );
                      const driverNumber = dStanding?.Driver?.permanentNumber ?? driver.permanentNumber;

                      return (
                        <Link
                          key={driver.driverId}
                          href={`/drivers/${driver.driverId}`}
                          className="group relative overflow-hidden min-h-[180px] sm:min-h-[200px] flex flex-col justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="relative z-10 space-y-0.5">
                            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                              {driver.givenName}
                            </p>
                            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                              {driver.familyName}
                            </h3>
                            {driverNumber && (
                              <p className="text-2xl font-black italic text-zinc-500 font-mono">
                                #{driverNumber}
                              </p>
                            )}
                          </div>

                          <div className="relative z-10 mt-auto pt-2">
                            <CountryFlag countryName={driver.nationality} />
                          </div>

                          {/* Driver photo cut-out */}
                          <div className="absolute top-1 -right-2 sm:right-0 h-[210%] w-[72%] sm:w-[66%] pointer-events-none select-none">
                            <Image
                              src={photoUrl}
                              alt={`${driver.givenName} ${driver.familyName}`}
                              fill
                              sizes="(max-width: 640px) 250px, 300px"
                              className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-md"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Team Card Footer Action */}
                <div className="px-5 py-3.5 bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>Official Constructor Profile</span>
                  </div>

                  <Link
                    href={`/constructors/${team.constructorId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4 group"
                  >
                    <span>View Team History & Stats</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No constructor data available for {year}.
        </div>
      )}
    </div>
  );
}
