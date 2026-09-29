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

  const startsSafe = Math.max(grandsPrixEntered, 1);
  const winRate = ((careerWins / startsSafe) * 100).toFixed(1);
  const podiumRate = ((careerPodiums / startsSafe) * 100).toFixed(1);
  const pointsPerRace = (careerPoints / startsSafe).toFixed(1);

  // Show trajectory only if multi-season history exists (avoid redundant 1-row table for active season)
  const isSingleActiveSeason =
    seasonHistory.length === 1 && seasonHistory[0].season === activeSeason;
  const hasMultiSeasonHistory = seasonHistory.length > 0 && !isSingleActiveSeason;

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

            {/* Left Content Column (Nationality, Name, #Number, Compact Season & Bio Block) */}
            <div className="p-5 sm:p-6 lg:p-7 relative z-10 flex flex-col justify-between h-full space-y-5 max-w-[62%] sm:max-w-[58%] lg:max-w-[60%]">
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

                {/* Number & Champion Status */}
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

              {/* Compact Season Telemetry & Bio Pack */}
              <div className="space-y-2.5 pt-2">
                {/* Season Performance Container */}
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xl">
                  {/* Season Header Bar */}
                  <div className="px-3.5 py-2 border-b border-white/10 bg-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: teamTheme.primary }}
                      />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                        {activeSeason} Season
                      </span>
                    </div>
                    {posLabel !== '—' && (
                      <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10">
                        P{posLabel}
                      </span>
                    )}
                  </div>

                  {/* Primary Standing & Points Row */}
                  <div className="grid grid-cols-2 divide-x divide-white/10 p-3 bg-zinc-950/40">
                    <div className="pr-3">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Standing
                      </p>
                      <p className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
                        {posLabel !== '—' ? `P${posLabel}` : '—'}
                      </p>
                    </div>
                    <div className="pl-3">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Points
                      </p>
                      <p className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-0.5">
                        {seasonPoints}
                      </p>
                    </div>
                  </div>

                  {/* Secondary KPI Row: Wins, Podiums, Poles */}
                  <div className="grid grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 text-center">
                    <div className="p-2 border-b border-r border-white/10 bg-zinc-900/20">
                      <p className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Wins
                      </p>
                      <p className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                        {gpWins}
                      </p>
                    </div>
                    <div className="p-2 border-b border-r border-white/10 bg-zinc-900/20">
                      <p className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Podiums
                      </p>
                      <p className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                        {gpPodiums}
                      </p>
                    </div>
                    <div className="p-2 border-b border-r border-white/10 bg-zinc-900/20">
                      <p className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Poles
                      </p>
                      <p className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                        {gpPoles}
                      </p>
                    </div>
                  </div>

                  {/* Optional Micro Telemetry: Top 10s, Fastest Laps, Sprint PTS, DNFs */}
                  {(gpTop10s > 0 || fastestLaps > 0 || sprintPoints > 0 || dnfs > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-900/20 text-xs">
                      {gpTop10s > 0 && (
                        <div className="p-1.5 border-b border-r border-white/10 flex items-center justify-between px-2.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Top 10s</span>
                          <span className="text-xs font-mono font-bold text-zinc-200">{gpTop10s}</span>
                        </div>
                      )}
                      {fastestLaps > 0 && (
                        <div className="p-1.5 border-b border-r border-white/10 flex items-center justify-between px-2.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Fastest</span>
                          <span className="text-xs font-mono font-bold text-amber-400">{fastestLaps}x</span>
                        </div>
                      )}
                      {sprintPoints > 0 && (
                        <div className="p-1.5 border-b border-r border-white/10 flex items-center justify-between px-2.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Sprint PTS</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">+{sprintPoints}</span>
                        </div>
                      )}
                      {dnfs > 0 && (
                        <div className="p-1.5 border-b border-r border-white/10 flex items-center justify-between px-2.5">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">DNFs</span>
                          <span className="text-xs font-mono font-bold text-rose-400">{dnfs}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Driver Bio Meta Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-zinc-400">
                  {driver.dateOfBirth && (
                    <span className="text-zinc-300">
                      Born {driver.dateOfBirth}
                      {age !== null && <span className="text-zinc-400 ml-1">({age} y/o)</span>}
                    </span>
                  )}
                  {driver.url && (
                    <a
                      href={driver.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: All-Time Career Benchmarks ─────────────────────── */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col justify-between">
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

            {/* 3x3 Monolithic Matrix for Career Benchmarks */}
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

              {/* Win Rate */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Win Rate
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 mt-2">
                  {winRate}%
                </p>
              </div>

              {/* Podium Rate */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Podium Rate
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 mt-2">
                  {podiumRate}%
                </p>
              </div>

              {/* Points per Race */}
              <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Pts / Race
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 mt-2">
                  {pointsPerRace}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Monolithic Season Trajectory & Championship History (Multi-Season only) ─ */}
      {hasMultiSeasonHistory && (
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
        </div>
      )}
    </div>
  );
}
