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
  Zap,
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

  // Current season calculations
  const seasonPosRaw =
    officialStats?.season?.position ?? currentSeason?.position ?? '—';
  const seasonPosNum = parseInt(seasonPosRaw, 10);
  const posLabel = Number.isFinite(seasonPosNum)
    ? seasonPosNum.toString().padStart(2, '0')
    : seasonPosRaw;

  const seasonPoints =
    officialStats?.season?.points ?? currentSeason?.points ?? '0';
  const gpWins =
    officialStats?.season?.gpWins ??
    (currentSeason ? parseInt(currentSeason.wins || '0', 10) : 0);
  const gpPodiums = officialStats?.season?.gpPodiums ?? 0;
  const gpPoles = officialStats?.season?.gpPoles ?? 0;
  const gpTop10s = officialStats?.season?.gpTop10s ?? 0;
  const fastestLaps = officialStats?.season?.fastestLaps ?? 0;
  const dnfs = officialStats?.season?.dnfs ?? 0;
  const sprintPoints = officialStats?.season?.sprintPoints ?? 0;

  // Career calculations
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ── LEFT COLUMN: Vertical Hero Cockpit with Full-Body Driver ──── */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between h-full min-h-[500px] sm:min-h-[540px] lg:min-h-[570px]">
            {/* Dynamic Top Livery Accent Strip */}
            <div className="h-[2px] w-full" style={{ backgroundColor: teamTheme.primary }} />

            {/* Ambient Livery Lighting */}
            <div
              className="absolute -top-20 -right-20 size-72 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ backgroundColor: teamTheme.primary }}
            />

            {/* Standing Driver Portrait (Placed on the RIGHT side of the card, full body height) */}
            <div className="absolute right-0 bottom-0 top-10 w-[50%] sm:w-[48%] lg:w-[50%] flex items-end justify-end pointer-events-none select-none overflow-hidden z-0">
              {/* Subtle spotlight glow behind driver */}
              <div
                className="absolute bottom-10 right-4 size-56 rounded-full opacity-25 blur-3xl pointer-events-none"
                style={{ backgroundColor: teamTheme.primary }}
              />

              <div className="relative w-full h-[95%] sm:h-full flex items-end justify-center sm:justify-end">
                <DriverImage
                  src={photoUrl}
                  alt={`${driver.givenName} ${driver.familyName}`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-contain object-bottom drop-shadow-2xl"
                  priority
                  unoptimized
                />
              </div>

              {/* Base Fade Gradient */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />
            </div>

            {/* Left Content Column (Nationality, Name, #Number, Bio 2x2 Matrix) */}
            <div className="p-5 sm:p-6 lg:p-7 relative z-10 flex flex-col justify-between h-full space-y-6 max-w-[62%] sm:max-w-[58%] lg:max-w-[60%]">
              <div className="space-y-4">
                {/* Nationality & Constructor Header Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
                    <CountryFlag countryName={driver.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                      {driver.nationality}
                    </span>
                  </div>

                  {currentConstructorId && (
                    <Link
                      href={`/constructors/${currentConstructorId}`}
                      className="group/team inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-sm hover:border-white/20 hover:bg-zinc-900/90 transition-all"
                    >
                      <div className="size-4.5 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        <TeamLogo constructorId={currentConstructorId} season={activeSeason} size={18} />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 group-hover/team:text-white transition-colors">
                        {currentTeamName}
                      </span>
                    </Link>
                  )}
                </div>

                {/* Typographic Nameplate */}
                <div>
                  <p className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-zinc-400">
                    {driver.givenName}
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black font-sans uppercase tracking-tight text-white leading-none mt-1">
                    {driver.familyName}
                  </h1>
                </div>

                {/* Number & Champion Status (Moved to left under the name) */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {driverNumber && (
                    <span className="text-3xl sm:text-4xl font-black italic text-zinc-700 font-mono tracking-tighter select-none">
                      #{driverNumber}
                    </span>
                  )}
                  {worldChampionships > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs font-black tracking-wide shadow-sm">
                      <Trophy className="size-3.5 fill-amber-400/20 text-amber-400 shrink-0" />
                      <span>{worldChampionships}× WORLD CHAMPION</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio & Details 2x2 Grid (Moved UP into left space under the name) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10 bg-zinc-950/60 rounded-2xl overflow-hidden shadow-xl mt-4">
                <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20">
                  <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Date of Birth
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5">
                    {driver.dateOfBirth || '—'}
                    {age !== null && (
                      <span className="text-xs font-normal text-zinc-400 ml-1">({age} y/o)</span>
                    )}
                  </p>
                </div>

                <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20">
                  <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Driver Code
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5">
                    {driver.code || '—'}
                  </p>
                </div>

                <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20">
                  <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Constructor
                  </p>
                  <p className="text-xs sm:text-sm font-sans font-bold text-white mt-0.5 truncate">
                    {currentTeamName}
                  </p>
                </div>

                <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20">
                  <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    Biography
                  </p>
                  {driver.url ? (
                    <a
                      href={driver.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-mono font-semibold text-zinc-300 hover:text-white hover:underline mt-0.5"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-xs sm:text-sm font-mono text-zinc-500 mt-0.5">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Separated Season & Career Statistics ──────────── */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-between">
          {/* Card 1: Current Season Performance */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 rounded-full shrink-0" style={{ backgroundColor: teamTheme.primary }} />
                <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                  <Zap className="size-4 text-amber-400 shrink-0" />
                  <span>{activeSeason} Season Performance</span>
                </h2>
              </div>

              <div className="font-mono text-xs font-bold text-zinc-300 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80">
                <span>P{posLabel}</span>
                <span className="text-zinc-600 mx-1.5">•</span>
                <span className="text-amber-400">{seasonPoints} PTS</span>
              </div>
            </div>

            {/* 6-Grid Matrix for Season */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 flex-1">
              {/* Standings Position */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Championship Pos
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  P{posLabel}
                </p>
              </div>

              {/* Season Points */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Points
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-2">
                  {seasonPoints}
                </p>
              </div>

              {/* Grand Prix Wins */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Grand Prix Wins
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {gpWins}
                </p>
              </div>

              {/* Podiums */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Podiums
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {gpPodiums}
                </p>
              </div>

              {/* Pole Positions */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Pole Positions
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {gpPoles}
                </p>
              </div>

              {/* Top 10 Finishes */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Top 10 Finishes
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {gpTop10s}
                </p>
              </div>
            </div>

            {/* Optional Secondary Line (Fastest laps, DNFs, Sprint Points) */}
            {(fastestLaps > 0 || dnfs > 0 || sprintPoints > 0) && (
              <div className="grid grid-cols-3 border-t border-l border-white/10 bg-zinc-900/10">
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Fastest Laps</span>
                  <span className="text-sm font-mono font-black text-amber-400">{fastestLaps}x</span>
                </div>
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Retirements</span>
                  <span className="text-sm font-mono font-black text-zinc-300">{dnfs}</span>
                </div>
                <div className="p-3 border-b border-r border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Sprint PTS</span>
                  <span className="text-sm font-mono font-black text-emerald-400">+{sprintPoints}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: All-Time Career Statistics */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 rounded-full shrink-0 bg-amber-400" />
                <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                  <Trophy className="size-4 text-amber-400 shrink-0" />
                  <span>All-Time Career Benchmarks</span>
                </h2>
              </div>

              <div className="font-mono text-xs font-bold text-zinc-300 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80">
                <span>{grandsPrixEntered} STARTS</span>
              </div>
            </div>

            {/* 6-Grid Matrix for Career */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 flex-1">
              {/* World Championships */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  World Titles
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                    {worldChampionships}×
                  </p>
                  {worldChampionships > 0 && (
                    <Trophy className="size-5 text-amber-400 fill-amber-400/20 shrink-0" />
                  )}
                </div>
              </div>

              {/* Career Starts */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Career Starts
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {grandsPrixEntered}
                </p>
              </div>

              {/* Career Points */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Career Points
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {careerPoints.toLocaleString('en-US')}
                </p>
              </div>

              {/* Career Wins */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Career Wins
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {careerWins}
                </p>
              </div>

              {/* Career Podiums */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Career Podiums
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {careerPodiums}
                </p>
              </div>

              {/* Career Poles */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Career Poles
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
                  {careerPoles}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Monolithic Season Trajectory & Championship History ─ */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full shrink-0 bg-amber-400" />
            <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white">
              CHAMPIONSHIP TRAJECTORY
            </h2>
          </div>

          <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300">
            {seasonHistory.length} SEASONS
          </span>
        </div>

        {seasonHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-900/80 text-zinc-300 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-28">Season</th>
                  <th className="py-3 px-4">Constructor Team</th>
                  <th className="py-3 px-4 text-center w-36">Standing</th>
                  <th className="py-3 px-4 text-right w-28">Points</th>
                  <th className="py-3 px-4 text-right w-20">Wins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {seasonHistory.map((sh, idx) => {
                  const isChampion = sh.position === '1';
                  const pos = parseInt(sh.position, 10);
                  const constructorId = sh.constructors[0]?.constructorId;
                  const rowTheme = getTeamTheme(constructorId);
                  const isCurrentRow = sh.season === activeSeason;

                  return (
                    <tr
                      key={`${sh.season}-${idx}`}
                      className={cn(
                        'hover:bg-zinc-900/40 transition-colors group',
                        isCurrentRow && 'bg-white/[0.02]'
                      )}
                    >
                      {/* Season Year + Team Indicator */}
                      <td className="py-3.5 px-4 font-bold tabular-nums">
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
                      <td className="py-3.5 px-4 font-sans font-bold">
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
                      <td className="py-3.5 px-4 text-center tabular-nums">
                        {isChampion ? (
                          <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-md font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs shadow-xs">
                            <Trophy className="size-3 text-amber-400 shrink-0" />
                            CHAMPION
                          </span>
                        ) : Number.isFinite(pos) && (pos === 2 || pos === 3) ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold bg-zinc-800 text-white border border-white/20 text-xs">
                            P{pos.toString().padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-bold text-xs">
                            {Number.isFinite(pos) ? `P${pos.toString().padStart(2, '0')}` : sh.position || '—'}
                          </span>
                        )}
                      </td>

                      {/* Season Points */}
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-white text-sm">
                        {sh.points}{' '}
                        <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                      </td>

                      {/* Season Wins */}
                      <td className="py-3.5 px-4 text-right tabular-nums">
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
        ) : (
          <div className="py-12 text-center text-sm font-mono text-zinc-500">
            No championship history available for this driver.
          </div>
        )}
      </div>
    </div>
  );
}
