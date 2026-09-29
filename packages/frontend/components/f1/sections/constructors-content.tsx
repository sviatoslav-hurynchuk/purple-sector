import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DriverImage } from '@/components/f1/driver-image';
import { getSeasonConstructors, getDriverStandings, getConstructorStandings } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { parseYear, getMaxYear, cn } from '@/lib/utils';
import { PreloadedContent } from '@/components/f1/preloaded-content';
import { ConstructorsPageSkeleton } from '@/components/f1/skeletons/constructors-page-skeleton';
import type { DriverStanding, ConstructorStanding } from '@/types/f1';

interface ConstructorsContentProps {
  searchParams: Promise<{ season?: string }>;
  allYears: number[];
}

/** 2026 Known Driver Pairings fallback when official season standings are not yet populated */
const SEASON_2026_LINEUP: Record<
  string,
  Array<{
    driverId: string;
    givenName: string;
    familyName: string;
    permanentNumber?: string;
    nationality: string;
  }>
> = {
  mercedes: [
    { driverId: 'russell', givenName: 'George', familyName: 'Russell', permanentNumber: '63', nationality: 'British' },
    { driverId: 'antonelli', givenName: 'Andrea Kimi', familyName: 'Antonelli', permanentNumber: '12', nationality: 'Italian' },
  ],
  ferrari: [
    { driverId: 'leclerc', givenName: 'Charles', familyName: 'Leclerc', permanentNumber: '16', nationality: 'Monegasque' },
    { driverId: 'hamilton', givenName: 'Lewis', familyName: 'Hamilton', permanentNumber: '44', nationality: 'British' },
  ],
  mclaren: [
    { driverId: 'norris', givenName: 'Lando', familyName: 'Norris', permanentNumber: '4', nationality: 'British' },
    { driverId: 'piastri', givenName: 'Oscar', familyName: 'Piastri', permanentNumber: '81', nationality: 'Australian' },
  ],
  red_bull: [
    { driverId: 'max_verstappen', givenName: 'Max', familyName: 'Verstappen', permanentNumber: '1', nationality: 'Dutch' },
    { driverId: 'hadjar', givenName: 'Isack', familyName: 'Hadjar', permanentNumber: '6', nationality: 'French' },
  ],
  williams: [
    { driverId: 'sainz', givenName: 'Carlos', familyName: 'Sainz', permanentNumber: '55', nationality: 'Spanish' },
    { driverId: 'albon', givenName: 'Alexander', familyName: 'Albon', permanentNumber: '23', nationality: 'Thai' },
  ],
  aston_martin: [
    { driverId: 'alonso', givenName: 'Fernando', familyName: 'Alonso', permanentNumber: '14', nationality: 'Spanish' },
    { driverId: 'stroll', givenName: 'Lance', familyName: 'Stroll', permanentNumber: '18', nationality: 'Canadian' },
  ],
  alpine: [
    { driverId: 'gasly', givenName: 'Pierre', familyName: 'Gasly', permanentNumber: '10', nationality: 'French' },
    { driverId: 'colapinto', givenName: 'Franco', familyName: 'Colapinto', permanentNumber: '43', nationality: 'Argentine' },
  ],
  haas: [
    { driverId: 'bearman', givenName: 'Oliver', familyName: 'Bearman', permanentNumber: '87', nationality: 'British' },
    { driverId: 'ocon', givenName: 'Esteban', familyName: 'Ocon', permanentNumber: '31', nationality: 'French' },
  ],
  rb: [
    { driverId: 'lawson', givenName: 'Liam', familyName: 'Lawson', permanentNumber: '30', nationality: 'New Zealander' },
    { driverId: 'arvid_lindblad', givenName: 'Arvid', familyName: 'Lindblad', permanentNumber: '41', nationality: 'British' },
  ],
  cadillac: [
    { driverId: 'bottas', givenName: 'Valtteri', familyName: 'Bottas', permanentNumber: '77', nationality: 'Finnish' },
    { driverId: 'perez', givenName: 'Sergio', familyName: 'Perez', permanentNumber: '11', nationality: 'Mexican' },
  ],
  audi: [
    { driverId: 'hulkenberg', givenName: 'Nico', familyName: 'Hülkenberg', permanentNumber: '27', nationality: 'German' },
    { driverId: 'bortoleto', givenName: 'Gabriel', familyName: 'Bortoleto', permanentNumber: '5', nationality: 'Brazilian' },
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

interface TeamDriverWithPhoto extends TeamDriverDisplay {
  photoUrl: string;
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

  // Calculate unique drivers count
  const uniqueDriverIds = new Set<string>();
  for (const s of driverStandings) {
    uniqueDriverIds.add(s.Driver.driverId);
  }

  // Prepare teams data with resolved drivers and image URLs
  const teamEntries = sortedConstructors.map((team) => {
    const theme = getTeamTheme(team.constructorId);
    const standing = constructorStandingsMap.get(team.constructorId);

    let teamDrivers: TeamDriverDisplay[] = constructorDriversMap.get(team.constructorId) ?? [];
    if (teamDrivers.length === 0 && year === 2026 && SEASON_2026_LINEUP[team.constructorId]) {
      teamDrivers = SEASON_2026_LINEUP[team.constructorId].map((d) => ({
        driver: {
          driverId: d.driverId,
          givenName: d.givenName,
          familyName: d.familyName,
          permanentNumber: d.permanentNumber,
          nationality: d.nationality,
          url: '',
        },
      }));
    }

    // Register drivers in global unique set
    for (const td of teamDrivers) {
      uniqueDriverIds.add(td.driver.driverId);
    }

    const sortedDrivers = [...teamDrivers].sort((a, b) => {
      const pA = parseFloat(a.standing?.points ?? '0');
      const pB = parseFloat(b.standing?.points ?? '0');
      if (pB !== pA) return pB - pA;
      return parseInt(a.standing?.position ?? '999', 10) - parseInt(b.standing?.position ?? '999', 10);
    });
    const primaryDrivers = sortedDrivers.slice(0, 2);

    // Resolve photos with authentic inwards orientation:
    // Left driver (index 0) faces inward right ('left' cutout)
    // Right driver (index 1) faces inward left ('right' cutout)
    const driversWithPhotos: TeamDriverWithPhoto[] = primaryDrivers.map((item, idx) => {
      const orientation = idx === 0 ? 'left' : 'right';
      const photoUrl = getDriverPhotoUrl(
        item.driver.driverId,
        item.driver.givenName,
        item.driver.familyName,
        String(year),
        team.constructorId,
        orientation
      );
      return {
        ...item,
        photoUrl,
      };
    });

    const isLight = theme.textColor === 'dark';

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
    <div className="space-y-6 sm:space-y-8">
      {/* ── Main Cockpit Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
            <span>{year}</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              TEAMS &amp; DRIVERS
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{sortedConstructors.length} Constructors</span>
            <span className="text-zinc-600">•</span>
            <span>{uniqueDriverIds.size} Drivers</span>
            <span className="text-zinc-600">•</span>
            <span>Official FIA World Championship Grid</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SeasonSelector currentSeason={year} allYears={allYears} />
        </div>
      </div>

      {/* ── Constructors Grid with Image Preloading Skeleton Barrier ── */}
      {teamEntries.length > 0 ? (
        <PreloadedContent imageUrls={allPhotoUrls} skeleton={<ConstructorsPageSkeleton onlyGrid />}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
            {teamEntries.map(({ team, theme, isLight, standing, primaryDrivers }) => {
              const posNum = standing ? parseInt(standing.position, 10) : NaN;
              const posLabel = Number.isFinite(posNum) ? posNum.toString().padStart(2, '0') : '—';

              return (
                <div
                  key={team.constructorId}
                  className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col hover:border-white/20 transition-all duration-300 group"
                >
                  {/* ── Top Header Strip (Full-bleed team theme) ────────────── */}
                  <Link
                    href={`/constructors/${team.constructorId}`}
                    className="group/header p-4 sm:p-5 flex items-center justify-between border-b border-black/15 transition-all hover:brightness-105"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div
                        className={cn(
                          'size-10 sm:size-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner p-2',
                          isLight ? 'bg-black/10 border-black/15' : 'bg-black/20 border-white/20'
                        )}
                      >
                        <TeamLogo constructorId={team.constructorId} season={year} size={26} />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CountryFlag countryName={team.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                          <span
                            className={cn(
                              'text-xs font-mono font-bold uppercase tracking-wider truncate',
                              isLight ? 'text-black/75' : 'text-white/75'
                            )}
                          >
                            {team.nationality}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <h2
                            className={cn(
                              'text-xl sm:text-2xl font-black font-sans uppercase tracking-tight truncate',
                              isLight ? 'text-black' : 'text-white'
                            )}
                          >
                            {team.name}
                          </h2>
                          <ChevronRight
                            className={cn(
                              'size-4 sm:size-5 transition-transform group-hover/header:translate-x-1 shrink-0',
                              isLight ? 'text-black/70' : 'text-white/70'
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {standing ? (
                        <div
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm shrink-0 backdrop-blur-sm',
                            isLight
                              ? 'bg-black/10 border-black/20 text-black'
                              : 'bg-black/20 border-white/20 text-white'
                          )}
                        >
                          <span className="font-black">P{posLabel}</span>
                          <span className={cn('text-xs font-mono', isLight ? 'text-black/40' : 'text-white/40')}>•</span>
                          <span className="font-bold">
                            {standing.points}{' '}
                            <span className={cn('text-[10px] font-normal', isLight ? 'text-black/70' : 'text-white/70')}>
                              pts
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'text-xs font-mono font-bold uppercase tracking-wider shrink-0 px-3 py-1.5 rounded-xl border',
                            isLight
                              ? 'bg-black/10 border-black/15 text-black/75'
                              : 'bg-white/10 border-white/15 text-white/75'
                          )}
                        >
                          GRID ENTRY
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* ── Driver Showcase (Split 2-column arena with authentic cutouts) ── */}
                  {primaryDrivers.length > 0 ? (
                    <div className="grid grid-cols-2 divide-x divide-white/10 flex-1 relative bg-zinc-950">
                      {primaryDrivers.map((item, idx) => {
                        const { driver, standing: dStanding, photoUrl } = item;
                        const driverNumber = dStanding?.Driver?.permanentNumber ?? driver.permanentNumber;
                        const dPosNum = dStanding ? parseInt(dStanding.position, 10) : NaN;
                        const dPosLabel = Number.isFinite(dPosNum) ? dPosNum.toString().padStart(2, '0') : '—';

                        // Harmonized Driver Comparison Colors (Apex benchmark from Head-to-Head)
                        const rawSecondary =
                          theme.secondary ||
                          (theme.textColor === 'dark' ? '#A1A1AA' : '#E2E8F0');
                        const secondaryColor =
                          rawSecondary === '#27272A' || rawSecondary === '#18181B'
                            ? '#71717A'
                            : rawSecondary;
                        let driverColor = idx === 0 ? theme.primary : secondaryColor;

                        // Ferrari color swap: Charles Leclerc gets Rosso Corsa (#E8002D), Lewis Hamilton gets Giallo Modena (#FFF200)
                        if (team.constructorId === 'ferrari') {
                          if (driver.driverId === 'leclerc') {
                            driverColor = theme.primary;
                          } else if (driver.driverId === 'hamilton') {
                            driverColor = secondaryColor;
                          } else {
                            driverColor = idx === 0 ? secondaryColor : theme.primary;
                          }
                        }

                        return (
                          <Link
                            key={driver.driverId}
                            href={`/drivers/${driver.driverId}`}
                            className="group/driver relative overflow-hidden min-h-[185px] sm:min-h-[210px] flex flex-col justify-between p-4 sm:p-5 hover:bg-zinc-900/30 transition-all duration-300"
                          >
                            {/* Ambient Driver Livery Glow (Harmonized with Head-to-Head Comparison Colors) */}
                            <div
                              className={cn(
                                'absolute -top-10 size-36 sm:size-44 rounded-full opacity-20 blur-3xl pointer-events-none transition-opacity duration-500 group-hover/driver:opacity-35',
                                idx === 0 ? '-left-10' : '-right-10'
                              )}
                              style={{ backgroundColor: driverColor }}
                            />

                            {/* Driver Identity */}
                            <div className="relative z-10 space-y-0.5 max-w-[65%]">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="size-1.5 rounded-full shrink-0 shadow-xs"
                                  style={{
                                    backgroundColor: driverColor,
                                    boxShadow: `0 0 6px ${driverColor}80`,
                                  }}
                                />
                                <p className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider truncate">
                                  {driver.givenName}
                                </p>
                              </div>
                              <h3 className="text-lg sm:text-2xl font-black font-sans text-white uppercase tracking-tight transition-colors drop-shadow-sm truncate group-hover/driver:text-zinc-100">
                                {driver.familyName}
                              </h3>
                              {driverNumber && (
                                <p className="text-2xl sm:text-3xl font-black italic text-zinc-700/80 font-mono tracking-tighter transition-colors group-hover/driver:text-zinc-500">
                                  #{driverNumber}
                                </p>
                              )}
                            </div>

                            {/* Bottom Metadata */}
                            <div className="relative z-10 mt-auto pt-2 flex items-center gap-2">
                              <CountryFlag countryName={driver.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                              {dStanding ? (
                                <span className="text-xs font-mono font-bold text-zinc-300">
                                  P{dPosLabel} <span className="text-zinc-500 font-normal">({dStanding.points} pts)</span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {driver.nationality}
                                </span>
                              )}
                            </div>

                            {/* Authentic Driver Cutout Photo */}
                            <div className="absolute top-1 -right-3 sm:-right-1 h-[250%] sm:h-[270%] w-[80%] sm:w-[74%] pointer-events-none select-none">
                              <DriverImage
                                src={photoUrl}
                                alt={`${driver.givenName} ${driver.familyName}`}
                                fill
                                sizes="(max-width: 640px) 250px, 300px"
                                className="object-contain object-top transition-transform duration-300 group-hover/driver:scale-105 origin-top drop-shadow-lg"
                              />
                            </div>

                            {/* Base fade */}
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-5" />

                            {/* Subtle Driver Livery Accent on Hover */}
                            <div
                              className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover/driver:opacity-100 transition-opacity duration-300 pointer-events-none"
                              style={{ backgroundColor: driverColor }}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs font-mono text-zinc-500 uppercase tracking-wider">
                      No drivers classified
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PreloadedContent>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-12 text-center text-sm font-mono text-zinc-400">
          No constructor data available for season {year}.
        </div>
      )}
    </div>
  );
}
