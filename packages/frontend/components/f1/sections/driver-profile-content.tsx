import Link from 'next/link';
import { DriverImage } from '@/components/f1/driver-image';
import type { DriverProfile, DriverSeasonStanding } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Trophy,
  ExternalLink,
} from 'lucide-react';

interface DriverProfileContentProps {
  profile: DriverProfile;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  if (dob.getTime() > Date.now()) return null;
  const ageMs = Date.now() - dob.getTime();
  return new Date(ageMs).getUTCFullYear() - 1970;
}

export function DriverProfileContent({ profile }: DriverProfileContentProps) {
  const { driver, careerStats, seasonHistory, officialStats } = profile;
  const age = calculateAge(driver.dateOfBirth);

  // Current / latest season entry (already sorted descending)
  const currentSeason: DriverSeasonStanding | undefined = seasonHistory[0];
  const currentConstructor = currentSeason?.constructors[0];
  const currentConstructorId = currentConstructor?.constructorId;
  const currentTeamName = currentConstructor?.name ?? '—';
  const teamTheme = getTeamTheme(currentConstructorId);

  const activeSeason =
    officialStats?.season?.year ?? currentSeason?.season ?? '2026';

  const photoUrl = getDriverPhotoUrl(
    driver.driverId,
    driver.givenName,
    driver.familyName,
    activeSeason,
    currentConstructorId
  );

  // Current in-season campaign telemetry (strictly unique to the active season)
  const seasonPosRaw =
    officialStats?.season?.position ?? currentSeason?.position ?? '—';
  const seasonPosNum = parseInt(seasonPosRaw, 10);
  const posLabel = Number.isFinite(seasonPosNum)
    ? seasonPosNum.toString().padStart(2, '0')
    : seasonPosRaw;

  const seasonPoints =
    officialStats?.season?.points ?? currentSeason?.points ?? '0';
  const gpRaces = officialStats?.season?.gpRaces ?? (currentSeason ? 1 : 0);
  const gpTop10s = officialStats?.season?.gpTop10s ?? 0;
  const fastestLaps = officialStats?.season?.fastestLaps ?? 0;
  const sprintPoints = officialStats?.season?.sprintPoints ?? 0;

  // Career calculations (all-time benchmark numbers)
  const careerPoints =
    officialStats?.career?.careerPoints ??
    seasonHistory.reduce((sum, s) => sum + parseFloat(s.points || '0'), 0);
  const grandsPrixEntered =
    officialStats?.career?.grandsPrixEntered ?? careerStats.totalRaces;
  const worldChampionships =
    officialStats?.career?.worldChampionships ?? careerStats.championships;
  const careerWins = careerStats.wins;
  const careerPodiums = officialStats?.career?.podiums ?? careerStats.podiums;
  const careerPoles =
    officialStats?.career?.polePositions ?? careerStats.poles;

  const startsSafe = Math.max(grandsPrixEntered, 1);
  const winRate = ((careerWins / startsSafe) * 100).toFixed(1);
  const podiumRate = ((careerPodiums / startsSafe) * 100).toFixed(1);
  const pointsPerRace = (careerPoints / startsSafe).toFixed(1);

  const highestRaceFinish =
    officialStats?.career?.highestRaceFinish ||
    (careerWins > 0 ? 'P1' : posLabel !== '—' ? `P${posLabel}` : '—');

  const highestGridPosition =
    officialStats?.career?.highestGridPosition
      ? `P${officialStats.career.highestGridPosition}`
      : careerPoles > 0
        ? 'P1'
        : '—';

  const careerDNFs = officialStats?.career?.dnfs ?? officialStats?.season?.dnfs ?? 0;
  const placeOfBirth = officialStats?.bio?.placeOfBirth;
  const driverNumber = driver.permanentNumber;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Top Navigation ──────────────────────────────────────────────── */}
      <div>
        <Link
          href="/drivers"
          className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
          <span>ALL DRIVERS</span>
        </Link>
      </div>

      {/* ── Main Two-Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Vertical Hero Cockpit with Full-Body Driver ──── */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between min-h-[660px] sm:min-h-[700px] lg:min-h-[740px]">
            {/* Dynamic Top Livery Accent Strip */}
            <div className="h-[3px] w-full" style={{ backgroundColor: teamTheme.primary }} />

            {/* Ambient Livery Lighting */}
            <div
              className="absolute -top-24 -right-24 size-80 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{ backgroundColor: teamTheme.primary }}
            />

            {/* Standing Driver Portrait (Placed on the RIGHT side, full body height) */}
            <div className="absolute right-0 bottom-0 top-6 w-[50%] sm:w-[48%] lg:w-[50%] flex items-end justify-end pointer-events-none select-none overflow-hidden z-0">
              {/* Spotlight glow behind driver */}
              <div
                className="absolute bottom-16 right-4 size-64 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ backgroundColor: teamTheme.primary }}
              />

              <div className="relative w-full h-[98%] sm:h-full flex items-end justify-end">
                <DriverImage
                  src={photoUrl}
                  alt={`${driver.givenName} ${driver.familyName}`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 30vw"
                  className="object-contain object-bottom drop-shadow-2xl"
                  priority
                  unoptimized
                />
              </div>

              {/* Base Fade Gradient */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
            </div>

            {/* Left Content Column (Identity, Name, Number, Active Campaign & Bio) */}
            <div className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full space-y-6 max-w-[55%] sm:max-w-[52%] lg:max-w-[54%]">
              <div className="space-y-4">
                {/* Nationality & Constructor Header Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
                    <CountryFlag countryName={driver.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                      {driver.nationality}
                    </span>
                  </div>

                  {currentConstructorId && (
                    <Link
                      href={`/constructors/${currentConstructorId}`}
                      className="group/team inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900/60 backdrop-blur-sm hover:border-white/20 hover:bg-zinc-900/90 transition-all"
                    >
                      <div className="size-4 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        <TeamLogo constructorId={currentConstructorId} season={activeSeason} size={16} />
                      </div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 group-hover/team:text-white transition-colors truncate max-w-[110px]">
                        {currentTeamName}
                      </span>
                    </Link>
                  )}
                </div>

                {/* Typographic Nameplate */}
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    {driver.givenName}
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-sans uppercase tracking-tight text-white leading-none mt-1">
                    {driver.familyName}
                  </h1>
                </div>

                {/* Number & Champion Status */}
                <div className="flex flex-wrap items-center gap-3">
                  {driverNumber && (
                    <span className="text-4xl sm:text-5xl font-black italic text-zinc-700 font-mono tracking-tighter select-none">
                      #{driverNumber}
                    </span>
                  )}
                  {worldChampionships > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-[11px] font-black tracking-wide">
                      <Trophy className="size-3.5 fill-amber-400/20 text-amber-400 shrink-0" />
                      <span>{worldChampionships}× CHAMPION</span>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Season Active Campaign Telemetry (Zero overlap with career benchmarks) */}
              <div className="space-y-3 pt-2">
                {/* Campaign Header Bar */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: teamTheme.primary }}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                      {activeSeason} Campaign
                    </span>
                  </div>
                  {posLabel !== '—' && (
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10">
                      P{posLabel}
                    </span>
                  )}
                </div>

                {/* Monolithic 1px Grid Container for In-Season KPIs */}
                <div className="rounded-2xl border-t border-l border-white/10 bg-zinc-950/80 overflow-hidden shadow-lg">
                  {/* Primary Standing & Points Row */}
                  <div className="grid grid-cols-2">
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/40">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Standing
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                        {posLabel !== '—' ? `P${posLabel}` : '—'}
                      </p>
                    </div>
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/40">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Season Points
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
                        {seasonPoints}
                      </p>
                    </div>
                  </div>

                  {/* 4-Cell Campaign Performance Grid (Unique in-season execution) */}
                  <div className="grid grid-cols-2 text-xs font-mono">
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        GPs Contested
                      </span>
                      <span className="text-lg font-black font-mono text-white mt-0.5">
                        {gpRaces}
                      </span>
                    </div>
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Top 10 Finishes
                      </span>
                      <span className="text-lg font-black font-mono text-zinc-200 mt-0.5">
                        {gpTop10s}
                      </span>
                    </div>
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Fastest Laps
                      </span>
                      <span className="text-lg font-black font-mono text-amber-400 mt-0.5">
                        {fastestLaps > 0 ? `${fastestLaps}×` : '—'}
                      </span>
                    </div>
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Sprint Points
                      </span>
                      <span className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                        {sprintPoints > 0 ? `+${sprintPoints}` : '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver Bio & Details Strip */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="space-y-0.5">
                    <div>
                      <span>Born: </span>
                      <span className="text-zinc-200 font-bold">{driver.dateOfBirth || '—'}</span>
                      {age !== null && <span className="text-zinc-400 ml-1">({age} y/o)</span>}
                    </div>
                    {placeOfBirth && (
                      <div className="text-zinc-400 truncate max-w-[170px]">
                        {placeOfBirth}
                      </div>
                    )}
                  </div>

                  {driver.url && (
                    <a
                      href={driver.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors shrink-0"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Unified Monolithic Career Record & Trajectory ─── */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            {/* Section 1: All-Time Career Benchmarks */}
            <div>
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4.5 rounded-full shrink-0 bg-amber-400" />
                  <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                    <Trophy className="size-4 text-amber-400 shrink-0" />
                    <span>All-Time Career Benchmarks</span>
                  </h2>
                </div>

                <div className="font-mono text-xs font-bold text-zinc-300 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80">
                  <span>{grandsPrixEntered} CAREER STARTS</span>
                </div>
              </div>

              {/* 6-Grid Matrix for Career Benchmarks */}
              <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60">
                {/* World Championships */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    World Titles
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                        {worldChampionships}×
                      </p>
                      {worldChampionships > 0 && (
                        <Trophy className="size-5 text-amber-400 fill-amber-400/20 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {worldChampionships > 0 ? 'F1 World Champion' : 'Championship Titles'}
                    </p>
                  </div>
                </div>

                {/* Grand Prix Wins */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Grand Prix Wins
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {careerWins}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {winRate}% Win Conversion
                    </p>
                  </div>
                </div>

                {/* Career Podiums */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Career Podiums
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {careerPodiums}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {podiumRate}% Podium Rate
                    </p>
                  </div>
                </div>

                {/* Pole Positions */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Pole Positions
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {careerPoles}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {((careerPoles / startsSafe) * 100).toFixed(1)}% Front-Row Starts
                    </p>
                  </div>
                </div>

                {/* Career Points */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Career Points
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {careerPoints.toLocaleString('en-US')}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {pointsPerRace} Points / GP Avg
                    </p>
                  </div>
                </div>

                {/* Highest Race Finish */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Highest Finish
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {highestRaceFinish}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      Grid Best: {highestGridPosition}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Precision Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/10 bg-zinc-900/20 text-xs font-mono">
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 uppercase text-[11px] font-bold">Starts</span>
                  <span className="font-bold text-white">{grandsPrixEntered}</span>
                </div>
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 uppercase text-[11px] font-bold">Grid Best</span>
                  <span className="font-bold text-white">{highestGridPosition}</span>
                </div>
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 uppercase text-[11px] font-bold">Retirements</span>
                  <span className="font-bold text-zinc-300">{careerDNFs} DNFs</span>
                </div>
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 uppercase text-[11px] font-bold">F1 Seasons</span>
                  <span className="font-bold text-white">{seasonHistory.length}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Championship Trajectory (Integrated seamlessly directly below) */}
            <div className="border-t border-white/10">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4.5 rounded-full shrink-0 bg-amber-400" />
                  <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white">
                    CHAMPIONSHIP TRAJECTORY
                  </h2>
                </div>

                <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300">
                  {seasonHistory.length} {seasonHistory.length === 1 ? 'CAMPAIGN' : 'CAMPAIGNS'}
                </span>
              </div>

              {/* Trajectory Table */}
              <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-900/80 text-zinc-300 text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
                      <th className="py-3 px-4 w-28 sm:w-32">Season</th>
                      <th className="py-3 px-4">Constructor Team</th>
                      <th className="py-3 px-4 text-center min-w-[170px]">Standing</th>
                      <th className="py-3 px-4 text-right w-24 sm:w-28">Points</th>
                      <th className="py-3 px-4 text-right w-20 sm:w-24">Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {seasonHistory.map((sh, idx) => {
                      const pos = parseInt(sh.position, 10);
                      const constructorId = sh.constructors[0]?.constructorId;
                      const rowTheme = getTeamTheme(constructorId);
                      const isCurrentRow = sh.season === activeSeason;
                      const isChampion = sh.position === '1' && !isCurrentRow;
                      const isChampionshipLeader = sh.position === '1' && isCurrentRow;

                      return (
                        <tr
                          key={`${sh.season}-${idx}`}
                          className={cn(
                            'hover:bg-zinc-900/40 transition-colors group',
                            isCurrentRow && 'bg-white/[0.02]'
                          )}
                        >
                          {/* Season Year + Team Indicator */}
                          <td className="py-3 px-4 font-bold tabular-nums">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="inline-block w-1.5 h-4.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: rowTheme.primary }}
                              />
                              <Link
                                href={`/standings?season=${sh.season}`}
                                className="text-white hover:text-primary transition-colors text-sm font-bold"
                              >
                                {sh.season}
                              </Link>
                              {isCurrentRow && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 uppercase">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Constructor Team with Logo */}
                          <td className="py-3 px-4 font-sans font-bold">
                            {constructorId ? (
                              <Link
                                href={`/constructors/${constructorId}`}
                                className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group/c"
                              >
                                <div className="size-4.5 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                  <TeamLogo constructorId={constructorId} season={sh.season} size={18} />
                                </div>
                                <span className="truncate">
                                  {sh.constructors.map((c) => c.name).join(', ') || '—'}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-zinc-500">—</span>
                            )}
                          </td>

                          {/* Championship Finish Standing */}
                          <td className="py-3 px-4 text-center tabular-nums">
                            {isChampionshipLeader ? (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-md font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs shadow-xs whitespace-nowrap">
                                <Trophy className="size-3 text-amber-400 shrink-0" />
                                CHAMPIONSHIP LEADER
                              </span>
                            ) : isChampion ? (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-md font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs shadow-xs whitespace-nowrap">
                                <Trophy className="size-3 text-amber-400 shrink-0" />
                                CHAMPION
                              </span>
                            ) : Number.isFinite(pos) && (pos === 2 || pos === 3) ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold bg-zinc-800 text-white border border-white/20 text-xs">
                                P{pos.toString().padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-zinc-300 font-bold text-xs">
                                {Number.isFinite(pos) ? `P${pos.toString().padStart(2, '0')}` : sh.position || '—'}
                              </span>
                            )}
                          </td>

                          {/* Season Points */}
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-white text-sm">
                            {sh.points}{' '}
                            <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                          </td>

                          {/* Season Wins */}
                          <td className="py-3 px-4 text-right tabular-nums">
                            {parseInt(sh.wins || '0', 10) > 0 ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs">
                                {sh.wins}W
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
