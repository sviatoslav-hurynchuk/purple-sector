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
  ChevronRight,
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
  const gpRaces =
    officialStats?.season?.gpRaces ??
    (currentSeason ? parseInt(currentSeason.round || '0', 10) : 0);
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
      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/drivers"
          className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
          <span>ALL DRIVERS</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
          <span className="size-2 rounded-full" style={{ backgroundColor: teamTheme.primary }} />
          <span>{activeSeason} DRIVER PROFILE</span>
        </div>
      </div>

      {/* ── Section 1: Monolithic Hero Cockpit Shell ─────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative">
        {/* Dynamic Top Livery Accent Strip */}
        <div className="h-[2px] w-full" style={{ backgroundColor: teamTheme.primary }} />

        {/* Ambient Livery Lighting */}
        <div
          className="absolute -top-24 -left-24 size-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: teamTheme.primary }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
          {/* Left Column: Driver Identity & Bio Matrix */}
          <div className="lg:col-span-7 p-5 sm:p-7 lg:p-9 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Header Badges: Nationality + Team Link */}
              <div className="flex flex-wrap items-center gap-2.5">
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
                    <ChevronRight className="size-3 text-zinc-500 group-hover/team:translate-x-0.5 group-hover/team:text-white transition-all" />
                  </Link>
                )}
              </div>

              {/* Typographic Nameplate */}
              <div>
                <p className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-zinc-400">
                  {driver.givenName}
                </p>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-sans uppercase tracking-tight text-white leading-none mt-1">
                  {driver.familyName}
                </h1>
              </div>

              {/* Badges Row: Permanent Number + Code + World Champion Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {driverNumber && (
                  <span className="text-3xl sm:text-4xl font-black italic text-zinc-700 font-mono tracking-tighter select-none">
                    #{driverNumber}
                  </span>
                )}
                {driver.code && (
                  <span className="px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs font-black uppercase tracking-wider text-zinc-200">
                    {driver.code}
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

            {/* Seamless Architectural Bio Matrix (1px Contiguous Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 rounded-2xl overflow-hidden shadow-xl">
              {/* Cell 1: Date of Birth */}
              <div className="p-3 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Date of Birth
                </p>
                <p className="text-sm font-mono font-bold text-white mt-1">
                  {driver.dateOfBirth || '—'}
                  {age !== null && (
                    <span className="text-xs font-normal text-zinc-400 ml-1">({age} y/o)</span>
                  )}
                </p>
              </div>

              {/* Cell 2: Primary Constructor */}
              <div className="p-3 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Constructor
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: teamTheme.primary }} />
                  <p className="text-sm font-sans font-bold text-white truncate">
                    {currentTeamName}
                  </p>
                </div>
              </div>

              {/* Cell 3: Biography */}
              <div className="p-3 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors col-span-2 sm:col-span-1">
                <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Biography
                </p>
                {driver.url ? (
                  <a
                    href={driver.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-mono font-semibold text-primary hover:underline mt-1 truncate"
                  >
                    <span>Wikipedia</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm font-mono text-zinc-500 mt-1">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Driver Cutout Area & Telemetry Ribbon */}
          <div className="lg:col-span-5 relative overflow-hidden min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex items-end justify-center lg:justify-end border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-950/40">
            {/* Ambient Cutout Glow */}
            <div
              className="absolute -top-10 -right-10 size-64 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ backgroundColor: teamTheme.primary }}
            />

            {/* Inward Facing Authentic Driver Photo */}
            <div className="relative w-full h-[260%] sm:h-[280%] top-2 sm:top-4 flex items-start justify-center">
              <DriverImage
                src={photoUrl}
                alt={`${driver.givenName} ${driver.familyName}`}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-contain object-top drop-shadow-2xl"
                priority
                unoptimized
              />
            </div>

            {/* Base Fade Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10" />

            {/* Integrated Bottom Telemetry Ribbon */}
            <div className="absolute bottom-0 inset-x-0 h-12 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md px-5 flex items-center justify-between z-20">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span>{activeSeason} STANDING:</span>
                <span className="text-white font-black">P{posLabel}</span>
              </div>
              <div className="font-mono text-sm font-black text-amber-400 tracking-tight">
                {seasonPoints} <span className="text-[10px] text-zinc-500 font-bold uppercase">PTS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Monolithic Telemetry & Performance Matrix ──────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: teamTheme.primary }} />
            <div>
              <h2 className="text-base sm:text-lg font-black font-sans uppercase tracking-tight text-white">
                PERFORMANCE METRICS &amp; CAREER TELEMETRY
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Official campaign telemetry combined with all-time historical benchmarks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs font-bold text-zinc-300">
            <span className="size-2 rounded-full" style={{ backgroundColor: teamTheme.primary }} />
            <span>{currentTeamName} {driverNumber ? `• #${driverNumber}` : ''}</span>
          </div>
        </div>

        {/* ── Cluster A: Current Season Telemetry ── */}
        <div className="px-5 py-2.5 bg-zinc-900/60 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Zap className="size-3.5 text-amber-400" />
            {activeSeason} Season Championship Record
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {gpRaces > 0 ? `${gpRaces} Grands Prix Contested` : 'Season active'}
          </span>
        </div>

        {/* Row 1: Primary Season Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-white/10 border-l border-white/10 bg-zinc-950/60">
          {/* 1. Standings Position */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Standing Pos
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                P{posLabel}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {seasonPosNum === 1 ? 'Championship Leader' : 'World Classification'}
              </p>
            </div>
          </div>

          {/* 2. Season Points */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Points
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {seasonPoints}{' '}
                <span className="text-xs text-zinc-400 font-normal">pts</span>
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {sprintPoints > 0 ? `incl. +${sprintPoints} sprint` : 'Total accumulated'}
              </p>
            </div>
          </div>

          {/* 3. Grand Prix Wins */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Grand Prix Wins
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {gpWins}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {gpRaces > 0 ? `${((gpWins / gpRaces) * 100).toFixed(0)}% win rate` : 'Victories'}
              </p>
            </div>
          </div>

          {/* 4. Podiums */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Podiums
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {gpPodiums}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">Top-3 finishes</p>
            </div>
          </div>

          {/* 5. Pole Positions */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Pole Positions
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {gpPoles}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">P1 in qualifying</p>
            </div>
          </div>

          {/* 6. Top 10 Finishes */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Top 10 Finishes
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {gpTop10s}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">Points finishes</p>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Season Telemetry (Fastest laps, DNFs, etc.) */}
        {(fastestLaps > 0 || dnfs > 0 || sprintPoints > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 border-b border-white/10 border-l border-white/10 bg-zinc-900/10">
            <div className="p-3 sm:p-3.5 border-b border-r border-white/10 bg-zinc-900/15 hover:bg-zinc-900/30 transition-colors flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Fastest Laps
              </span>
              <span className="text-sm font-black font-mono text-amber-400">
                {fastestLaps}x
              </span>
            </div>

            <div className="p-3 sm:p-3.5 border-b border-r border-white/10 bg-zinc-900/15 hover:bg-zinc-900/30 transition-colors flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Retirements (DNF)
              </span>
              <span className="text-sm font-black font-mono text-zinc-300">
                {dnfs}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 border-b border-r border-white/10 bg-zinc-900/15 hover:bg-zinc-900/30 transition-colors flex items-center justify-between col-span-2 sm:col-span-1">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                Sprint Points
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                +{sprintPoints} pts
              </span>
            </div>
          </div>
        )}

        {/* ── Cluster B: All-Time Career Historic Milestones ── */}
        <div className="px-5 py-2.5 bg-zinc-900/60 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Trophy className="size-3.5 text-amber-400" />
            All-Time Career Historic Milestones
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {grandsPrixEntered} Grands Prix Entered
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-l border-white/10 bg-zinc-950/60">
          {/* 1. World Championships */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              World Titles
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {worldChampionships}×
                </p>
                {worldChampionships > 0 && (
                  <Trophy className="size-4.5 text-amber-400 fill-amber-400/20" />
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {worldChampionships > 0 ? 'F1 World Champion' : 'Championships'}
              </p>
            </div>
          </div>

          {/* 2. Total Career Starts */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Career Starts
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {grandsPrixEntered}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">Grands Prix entered</p>
            </div>
          </div>

          {/* 3. Career Points */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Career Points
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {careerPoints.toLocaleString('en-US')}{' '}
                <span className="text-xs text-zinc-400 font-normal">pts</span>
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">All-time total</p>
            </div>
          </div>

          {/* 4. Career Wins */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Career Wins
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {careerWins}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {grandsPrixEntered > 0
                  ? `${((careerWins / grandsPrixEntered) * 100).toFixed(1)}% victory rate`
                  : 'Victories'}
              </p>
            </div>
          </div>

          {/* 5. Career Podiums */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Career Podiums
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {careerPodiums}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">Top-3 podium finishes</p>
            </div>
          </div>

          {/* 6. Career Poles */}
          <div className="p-3.5 sm:p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
            <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Career Poles
            </p>
            <div className="pt-2">
              <p className="text-xl sm:text-2xl font-black font-mono text-white">
                {careerPoles}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">Qualifying poles</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Monolithic Season Trajectory & Championship History ─ */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full shrink-0 bg-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black font-sans uppercase tracking-tight text-white">
                CHAMPIONSHIP TRAJECTORY
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Complete progression across {seasonHistory.length} Formula 1 championship seasons
              </p>
            </div>
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
