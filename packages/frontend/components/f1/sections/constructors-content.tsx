import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DriverImage } from '@/components/f1/driver-image';
import { getSeasonConstructors, getDriverStandings, getConstructorStandings } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { parseYear, getMaxYear } from '@/lib/utils';
import { PreloadedContent } from '@/components/f1/preloaded-content';
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
  williams: [
    { driverId: 'sainz', givenName: 'Carlos', familyName: 'Sainz', permanentNumber: '55' },
    { driverId: 'albon', givenName: 'Alexander', familyName: 'Albon', permanentNumber: '23' },
  ],
  aston_martin: [
    { driverId: 'alonso', givenName: 'Fernando', familyName: 'Alonso', permanentNumber: '14' },
    { driverId: 'stroll', givenName: 'Lance', familyName: 'Stroll', permanentNumber: '18' },
  ],
  alpine: [
    { driverId: 'gasly', givenName: 'Pierre', familyName: 'Gasly', permanentNumber: '10' },
    { driverId: 'colapinto', givenName: 'Franco', familyName: 'Colapinto', permanentNumber: '43' },
  ],
  haas: [
    { driverId: 'bearman', givenName: 'Oliver', familyName: 'Bearman', permanentNumber: '87' },
    { driverId: 'ocon', givenName: 'Esteban', familyName: 'Ocon', permanentNumber: '31' },
  ],
  rb: [
    { driverId: 'lawson', givenName: 'Liam', familyName: 'Lawson', permanentNumber: '30' },
    { driverId: 'arvid_lindblad', givenName: 'Arvid', familyName: 'Lindblad', permanentNumber: '41' },
  ],
  cadillac: [
    { driverId: 'bottas', givenName: 'Valtteri', familyName: 'Bottas', permanentNumber: '77' },
    { driverId: 'perez', givenName: 'Sergio', familyName: 'Perez', permanentNumber: '11' },
  ],
  audi: [
    { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg', permanentNumber: '27' },
    { driverId: 'bortoleto', givenName: 'Gabriel', familyName: 'Bortoleto', permanentNumber: '5' },
  ],
};

interface TeamDriverDisplay {
  driver: {
    driverId: string;
    givenName: string;
    familyName: string;
    permanentNumber?: string;
    nationality: string;
    url?: string;
    dateOfBirth?: string;
    code?: string;
  };
  standing?: DriverStanding;
}

function ConstructorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 overflow-hidden shadow-xl flex flex-col bg-card animate-pulse h-[340px]"
        >
          <div className="p-5 bg-zinc-850 flex items-center justify-between border-b border-white/5">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-zinc-700/60 rounded" />
              <div className="h-6 w-44 bg-zinc-700 rounded" />
            </div>
            <div className="h-10 w-24 bg-zinc-700/80 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/10 flex-1 bg-zinc-900/50 p-4 sm:p-5">
            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-28 bg-zinc-800 rounded" />
                <div className="h-7 w-12 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-4 w-6 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-3 flex flex-col justify-between pl-4 sm:pl-5">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-28 bg-zinc-800 rounded" />
                <div className="h-7 w-12 bg-zinc-800/60 rounded" />
              </div>
              <div className="h-4 w-6 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function ConstructorsContent({
  searchParams,
  allYears,
}: ConstructorsContentProps) {
  const params = await searchParams;
  const year = parseYear(params.season, getMaxYear());

  // Fetch constructors, driver standings, and constructor standings for the season in parallel
  const [constructors, driverStandings, constructorStandings] = await Promise.all([
    getSeasonConstructors(year),
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

  // Prepare teams data with resolved drivers and image URLs
  const teamEntries = sortedConstructors.map((team) => {
    const theme = getTeamTheme(team.constructorId);
    const isLight = theme.textColor === 'dark';
    const standing = constructorStandingsMap.get(team.constructorId);

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

    const sortedDrivers = [...teamDrivers].sort((a, b) => {
      const pA = parseFloat(a.standing?.points ?? '0');
      const pB = parseFloat(b.standing?.points ?? '0');
      if (pB !== pA) return pB - pA;
      return parseInt(a.standing?.position ?? '999', 10) - parseInt(b.standing?.position ?? '999', 10);
    });
    const primaryDrivers = sortedDrivers.slice(0, 2);

    const driversWithPhotos = primaryDrivers.map((item) => {
      const photoUrl = getDriverPhotoUrl(
        item.driver.driverId,
        item.driver.givenName,
        item.driver.familyName,
        String(year),
        team.constructorId
      );
      return {
        ...item,
        photoUrl,
      };
    });

    return {
      team,
      theme,
      isLight,
      standing,
      primaryDrivers: driversWithPhotos,
    };
  });

  // Collect all driver photos for preloading
  const allPhotoUrls: string[] = [];
  for (const entry of teamEntries) {
    for (const d of entry.primaryDrivers) {
      if (d.photoUrl) allPhotoUrls.push(d.photoUrl);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{year} Teams &amp; Drivers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Formula 1 constructors championship contenders, official driver pairings, and profiles for the {year} season.
          </p>
        </div>
        <SeasonSelector currentSeason={year} allYears={allYears} />
      </div>

      {/* Constructors Grid with Image Preloading Skeleton Barrier */}
      {teamEntries.length > 0 ? (
        <PreloadedContent imageUrls={allPhotoUrls} skeleton={<ConstructorsGridSkeleton />}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {teamEntries.map(({ team, theme, isLight, standing, primaryDrivers }) => {
              return (
                <div
                  key={team.constructorId}
                  className="rounded-2xl border border-white/10 overflow-hidden shadow-xl flex flex-col hover:border-white/20 transition-all duration-300 bg-card"
                >
                  {/* Clickable Top Header Strip */}
                  <Link
                    href={`/constructors/${team.constructorId}`}
                    className="group/header p-5 flex items-center justify-between transition-all hover:brightness-105"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CountryFlag countryName={team.nationality} />
                        <span
                          className={[
                            'text-xs font-bold uppercase tracking-wider',
                            isLight ? 'text-black/75' : 'text-white/75',
                          ].join(' ')}
                        >
                          {team.nationality}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h2
                          className={[
                            'text-2xl font-black uppercase tracking-tight',
                            isLight ? 'text-black' : 'text-white',
                          ].join(' ')}
                        >
                          {team.name}
                        </h2>
                        <ChevronRight
                          className={[
                            'h-5 w-5 transition-transform group-hover/header:translate-x-1 opacity-70 group-hover/header:opacity-100',
                            isLight ? 'text-black' : 'text-white',
                          ].join(' ')}
                        />
                      </div>
                    </div>

                    {standing && (
                      <div
                        className={[
                          'text-right px-3.5 py-1.5 rounded-lg border backdrop-blur-sm',
                          isLight
                            ? 'bg-black/10 border-black/20 text-black'
                            : 'bg-white/10 border-white/20 text-white',
                        ].join(' ')}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                          POS / PTS
                        </span>
                        <span className="text-xl font-black font-mono">
                          P{standing.position} <span className="text-xs font-normal">({standing.points} pts)</span>
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 2 Primary Drivers Grid with dimmed team background */}
                  {primaryDrivers.length > 0 && (
                    <div
                      className="grid grid-cols-2 divide-x divide-white/10 flex-1 border-t border-black/15"
                      style={{
                        background: `linear-gradient(180deg, ${theme.primary}28 0%, ${theme.primary}14 45%, rgba(12,12,14,0.94) 100%)`,
                      }}
                    >
                      {primaryDrivers.map((item) => {
                        const { driver, standing: dStanding, photoUrl } = item;
                        const driverNumber = dStanding?.Driver?.permanentNumber ?? driver.permanentNumber;

                        return (
                          <Link
                            key={driver.driverId}
                            href={`/drivers/${driver.driverId}`}
                            className="group relative overflow-hidden min-h-[190px] sm:min-h-[220px] flex flex-col justify-between p-4 sm:p-5 hover:bg-white/5 transition-all"
                          >
                            <div className="relative z-10 space-y-0.5">
                              <p className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider drop-shadow-sm">
                                {driver.givenName}
                              </p>
                              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors drop-shadow-sm">
                                {driver.familyName}
                              </h3>
                              {driverNumber && (
                                <p className="text-2xl sm:text-3xl font-black italic text-white/40 font-mono">
                                  #{driverNumber}
                                </p>
                              )}
                            </div>

                            <div className="relative z-10 mt-auto pt-2">
                              <CountryFlag countryName={driver.nationality} />
                            </div>

                            {/* Driver photo cut-out */}
                            <div className="absolute top-1 -right-2 sm:right-0 h-[210%] w-[72%] sm:w-[66%] pointer-events-none select-none">
                              <DriverImage
                                src={photoUrl}
                                alt={`${driver.givenName} ${driver.familyName}`}
                                fill
                                sizes="(max-width: 640px) 250px, 300px"
                                className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-lg"
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PreloadedContent>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No constructor data available for {year}.
        </div>
      )}
    </div>
  );
}
