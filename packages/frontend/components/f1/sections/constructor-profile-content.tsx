import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  Trophy,
  ExternalLink,
  MapPin,
  User,
  Wrench,
  Zap,
  Flag,
  Shield,
  Award,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import {
  getConstructorProfile,
  getConstructorHeadToHead,
  getConstructorStandings,
  getDriverStandings,
} from '@/lib/api';
import { getTeamTheme } from '@/lib/team-colors';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { CountryFlag } from '@/components/f1/country-flag';
import { TeamLogo } from '@/components/f1/team-logo';
import { DriverImage } from '@/components/f1/driver-image';
import { ConstructorDriverRoster } from '@/components/f1/constructor-driver-roster';
import { ConstructorDuelWidget } from '@/components/f1/head-to-head/constructor-duel-widget';
import type { ConstructorStanding, DriverStanding } from '@/types/f1';

interface ConstructorProfileContentProps {
  constructorId: string;
}

export async function ConstructorProfileContent({ constructorId }: ConstructorProfileContentProps) {
  const currentYear = new Date().getFullYear();

  // Fetch constructor profile, standings, and head-to-head battles in parallel
  const [profile, constructorStandings, driverStandings, h2hCurrent, h2hFallback] = await Promise.all([
    getConstructorProfile(constructorId),
    getConstructorStandings(currentYear).catch(() => [] as ConstructorStanding[]),
    getDriverStandings(currentYear).catch(() => [] as DriverStanding[]),
    getConstructorHeadToHead(currentYear, constructorId).catch(() => null),
    getConstructorHeadToHead(2024, constructorId).catch(() => null),
  ]);

  if (!profile) {
    notFound();
  }

  const { constructor: team, meta, stats, currentDrivers, historicalDrivers, seasonsCount } = profile;
  const theme = getTeamTheme(team.constructorId);

  // Active season standing and points
  const currentStanding = constructorStandings.find(
    (cs) => cs.Constructor.constructorId === team.constructorId
  );
  const activeSeason = String(currentYear);
  const seasonPosRaw = currentStanding?.position ?? '—';
  const seasonPosNum = parseInt(seasonPosRaw, 10);
  const posLabel = Number.isFinite(seasonPosNum)
    ? seasonPosNum.toString().padStart(2, '0')
    : seasonPosRaw;
  const seasonPoints = currentStanding?.points ?? '0';
  const seasonWins = currentStanding?.wins ?? '0';

  // Driver standings contribution
  const teamDriverStandings = driverStandings.filter((ds) =>
    ds.Constructors.some((c) => c.constructorId === team.constructorId)
  );

  // Intra-team head-to-head battles (prefer active season, fallback to prior completed season)
  let h2hBattles = h2hCurrent;
  let h2hSeason: string | number = currentYear;
  if (!h2hBattles || h2hBattles.length === 0 || h2hBattles[0]?.rounds.length === 0) {
    h2hBattles = h2hFallback;
    h2hSeason = 2024;
  }

  // All-Time Career Calculations
  const startsSafe = Math.max(stats.totalRaces, 1);
  const winRate = ((stats.wins / startsSafe) * 100).toFixed(1);
  const podiumRate = ((stats.podiums / startsSafe) * 100).toFixed(1);
  const poleRate = ((stats.poles / startsSafe) * 100).toFixed(1);
  const highestFinish =
    stats.wins > 0 ? 'P1' : profile.officialDetails?.highestRaceFinish || '—';

  // Resolved Primary Drivers with Authentic Inward Orientation
  const primaryDrivers = currentDrivers.slice(0, 2);
  const driver1 = primaryDrivers[0];
  const driver2 = primaryDrivers[1];

  const d1Photo = driver1
    ? getDriverPhotoUrl(
        driver1.driverId,
        driver1.givenName,
        driver1.familyName,
        activeSeason,
        team.constructorId,
        'left' // Inward facing right
      )
    : '';

  const d2Photo = driver2
    ? getDriverPhotoUrl(
        driver2.driverId,
        driver2.givenName,
        driver2.familyName,
        activeSeason,
        team.constructorId,
        'right' // Inward facing left
      )
    : '';

  const d1Standing = driver1
    ? teamDriverStandings.find((s) => s.Driver.driverId === driver1.driverId)
    : undefined;
  const d2Standing = driver2
    ? teamDriverStandings.find((s) => s.Driver.driverId === driver2.driverId)
    : undefined;

  const d1Pts = parseFloat(d1Standing?.points ?? '0');
  const d2Pts = parseFloat(d2Standing?.points ?? '0');
  const totalTeamDriverPts = Math.max(d1Pts + d2Pts, 1);
  const d1PtsPct = d1Pts + d2Pts > 0 ? Math.round((d1Pts / totalTeamDriverPts) * 100) : 50;
  const d2PtsPct = 100 - d1PtsPct;

  const championshipYears = meta.worldChampionships ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Top Navigation ──────────────────────────────────────────────── */}
      <div>
        <Link
          href="/constructors"
          className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="size-4 text-zinc-500 group-hover:-translate-x-0.5 group-hover:text-white transition-all" />
          <span>ALL CONSTRUCTORS</span>
        </Link>
      </div>

      {/* ── Main Two-Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Team Identity Cockpit & In-Season Campaign ──── */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between min-h-[660px] sm:min-h-[700px] lg:min-h-[740px]">
            {/* Dynamic Top Livery Accent Strip */}
            <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: theme.primary }} />

            {/* Ambient Livery Lighting Glow */}
            <div
              className="absolute -top-24 -right-24 size-80 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{ backgroundColor: theme.primary }}
            />

            {/* Main Stage Content */}
            <div className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-5">
                {/* Header Pills & Nationality Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
                    <CountryFlag countryName={team.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                      {team.nationality}
                    </span>
                  </div>

                  {meta.firstEntry && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900/60 backdrop-blur-sm">
                      <Calendar className="size-3 text-zinc-400" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                        EST. {meta.firstEntry}
                      </span>
                    </div>
                  )}

                  {meta.base && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-zinc-900/40 backdrop-blur-sm text-zinc-400 text-[11px] font-mono">
                      <MapPin className="size-3 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{meta.base}</span>
                    </div>
                  )}
                </div>

                {/* Team Logo Emblem & Typographic Nameplate */}
                <div className="flex items-start gap-4 pt-1">
                  <div className="size-16 sm:size-20 rounded-2xl border border-white/10 bg-zinc-900/80 p-2.5 backdrop-blur-md shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
                    <TeamLogo
                      constructorId={team.constructorId}
                      season={currentYear}
                      size={64}
                      className="!w-full !h-full rounded-none shadow-none object-contain"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                      Formula 1 Constructor
                    </p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans uppercase tracking-tight text-white leading-tight">
                      {meta.fullName || team.name}
                    </h1>
                  </div>
                </div>

                {/* World Championships Accolade Strip */}
                {stats.championships > 0 && (
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-lg">
                    <Trophy className="size-5 fill-amber-400/20 text-amber-400 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono font-black tracking-wide uppercase">
                        {stats.championships}× Constructors&apos; World Champion
                      </p>
                      <p className="text-[10px] font-mono text-amber-400/80">
                        Official FIA Formula One World Championship
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Season Active Campaign Telemetry */}
              <div className="space-y-3 pt-3">
                {/* Campaign Header Bar */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                      {activeSeason} Championship Campaign
                    </span>
                  </div>
                  {posLabel !== '—' && (
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10 border border-white/10">
                      P{posLabel}
                    </span>
                  )}
                </div>

                {/* Monolithic 1px Grid Container for In-Season KPIs */}
                <div className="rounded-2xl border-t border-l border-white/10 bg-zinc-950/80 overflow-hidden shadow-lg">
                  {/* Primary Standing & Points Row */}
                  <div className="grid grid-cols-2">
                    <div className="p-3.5 border-b border-r border-white/10 bg-zinc-900/40">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Grid Standing
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">
                        {posLabel !== '—' ? `P${posLabel}` : '—'}
                      </p>
                    </div>

                    <div className="p-3.5 border-b border-r border-white/10 bg-zinc-900/40">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Season Points
                      </p>
                      <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-0.5">
                        {seasonPoints}
                      </p>
                    </div>
                  </div>

                  {/* 4-Cell Campaign Performance Grid */}
                  <div className="grid grid-cols-2 text-xs font-mono">
                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Season Wins
                      </span>
                      <span className="text-lg font-black font-mono text-white mt-0.5">
                        {seasonWins}
                      </span>
                    </div>

                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/20 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Active Pilots
                      </span>
                      <span className="text-lg font-black font-mono text-zinc-200 mt-0.5">
                        {currentDrivers.length}
                      </span>
                    </div>

                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Seasons in F1
                      </span>
                      <span className="text-lg font-black font-mono text-amber-400 mt-0.5">
                        {seasonsCount}
                      </span>
                    </div>

                    <div className="p-3 border-b border-r border-white/10 bg-zinc-900/10 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Roster Size
                      </span>
                      <span className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                        {historicalDrivers.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Driver In-Season Split Contribution (if drivers exist) */}
                {driver1 && driver2 && (d1Pts > 0 || d2Pts > 0) && (
                  <div className="p-3 rounded-xl border border-white/10 bg-zinc-900/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-bold">
                        {driver1.code || driver1.familyName}: {d1Pts} pts
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Points Share
                      </span>
                      <span className="text-zinc-300 font-bold">
                        {driver2.code || driver2.familyName}: {d2Pts} pts
                      </span>
                    </div>

                    <div className="h-2 w-full bg-zinc-900 border border-white/10 rounded-full overflow-hidden flex">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${d1PtsPct}%`, backgroundColor: theme.primary }}
                      />
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${d2PtsPct}%`, backgroundColor: theme.secondary || '#52525b' }}
                      />
                    </div>
                  </div>
                )}

                {/* Team Bio & Wikipedia Footer Strip */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="truncate max-w-[220px]">
                    <span>Factory: </span>
                    <span className="text-zinc-200 font-bold">{meta.base || 'Classified'}</span>
                  </div>

                  {team.url && (
                    <a
                      href={team.url}
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

        {/* ── RIGHT COLUMN: All-Time Record & Technical Blueprint ─────── */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            {/* Section 1: All-Time Career Benchmarks */}
            <div>
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-4.5 rounded-full shrink-0 bg-amber-400" />
                  <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                    <Trophy className="size-4 text-amber-400 shrink-0" />
                    <span>All-Time Constructor Benchmarks</span>
                  </h2>
                </div>

                <div className="font-mono text-xs font-bold text-zinc-300 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80">
                  <span>{stats.totalRaces} GRAND PRIX STARTS</span>
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
                        {stats.championships}×
                      </p>
                      {stats.championships > 0 && (
                        <Trophy className="size-5 text-amber-400 fill-amber-400/20 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {stats.championships > 0 ? "Constructors' Champion" : 'Championship Titles'}
                    </p>
                  </div>
                </div>

                {/* Grand Prix Wins */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Grand Prix Wins
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                      {stats.wins}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {winRate}% Win Conversion
                    </p>
                  </div>
                </div>

                {/* Podiums */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Podium Finishes
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {stats.podiums}
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
                      {stats.poles}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {poleRate}% Pole Rate
                    </p>
                  </div>
                </div>

                {/* Fastest Laps */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Fastest Laps
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-purple-400">
                      {stats.fastestLaps ?? 0}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      Official Lap Records
                    </p>
                  </div>
                </div>

                {/* Seasons in Formula 1 */}
                <div className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between">
                  <p className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    F1 Longevity
                  </p>
                  <div className="mt-2">
                    <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                      {seasonsCount}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">
                      {meta.firstEntry ? `${meta.firstEntry} – Present` : 'Seasons Competed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary 4-Column Metric Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/10 bg-zinc-900/30 text-xs font-mono">
                <div className="p-3 border-b border-r border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Win Ratio
                  </span>
                  <span className="text-base font-black font-mono text-white mt-0.5">
                    {winRate}%
                  </span>
                </div>

                <div className="p-3 border-b border-r border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Podium Ratio
                  </span>
                  <span className="text-base font-black font-mono text-white mt-0.5">
                    {podiumRate}%
                  </span>
                </div>

                <div className="p-3 border-b border-r border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Peak Result
                  </span>
                  <span className="text-base font-black font-mono text-emerald-400 mt-0.5">
                    {highestFinish}
                  </span>
                </div>

                <div className="p-3 border-b border-r border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Pilots Roster
                  </span>
                  <span className="text-base font-black font-mono text-zinc-300 mt-0.5">
                    {historicalDrivers.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Championship Roll of Honor (if titles exist) */}
            {championshipYears.length > 0 && (
              <div className="border-t border-white/10 p-4 sm:p-5 bg-zinc-950/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-amber-400" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                    Constructors&apos; Championship Roll of Honor ({championshipYears.length})
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {championshipYears.map((yr) => (
                    <span
                      key={yr}
                      className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs font-black tracking-wide"
                    >
                      {yr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Technical Blueprint & Operations Leadership */}
            <div className="border-t border-white/10">
              <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center gap-2.5">
                <div className="w-1.5 h-4.5 rounded-full shrink-0 bg-blue-400" />
                <h3 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                  <Shield className="size-4 text-blue-400 shrink-0" />
                  <span>Technical Blueprint &amp; Leadership</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10 bg-zinc-950/60">
                {/* Team Principal */}
                <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 shrink-0 border border-white/5">
                    <User className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Team Principal
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {meta.teamPrincipal || 'Team Leadership'}
                    </p>
                  </div>
                </div>

                {/* Technical Chief */}
                <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 shrink-0 border border-white/5">
                    <Wrench className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Technical Chief
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {meta.technicalChief || 'Technical Operations'}
                    </p>
                  </div>
                </div>

                {/* Power Unit */}
                <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400 shrink-0 border border-white/5">
                    <Zap className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Power Unit Supplier
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {meta.powerUnit || 'Formula 1 Hybrid'}
                    </p>
                  </div>
                </div>

                {/* Chassis Designation */}
                <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 shrink-0 border border-white/5">
                    <Flag className="size-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Chassis Designation
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {meta.chassis || 'F1 Monocoque'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL-WIDTH SECTION: Official Driver Lineup & Duel Arena ─────── */}
      {primaryDrivers.length > 0 && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-1.5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: theme.primary }}
                />
                <div>
                  <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-tight text-white flex items-center gap-2">
                    <Award className="size-4 text-zinc-400" />
                    <span>Official {activeSeason} Driver Lineup</span>
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Active pilots representing {team.name} in the FIA Formula One World Championship
                  </p>
                </div>
              </div>

              <div className="font-mono text-xs font-bold text-zinc-400 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/60 hidden sm:block">
                <span>{primaryDrivers.length} ACTIVE DRIVERS</span>
              </div>
            </div>

            {/* Matched Driver Duel Cards with Inward Cutout Portraits */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-zinc-950/60">
              {/* Driver 1 (Facing Inward Right) */}
              {driver1 && (
                <Link
                  href={`/drivers/${driver1.driverId}`}
                  className="group relative overflow-hidden p-6 sm:p-7 min-h-[260px] sm:min-h-[280px] flex flex-col justify-between hover:bg-zinc-900/30 transition-all"
                >
                  {/* Ambient accent glow */}
                  <div
                    className="absolute -top-12 -left-12 size-48 rounded-full opacity-15 blur-2xl pointer-events-none group-hover:opacity-25 transition-opacity"
                    style={{ backgroundColor: theme.primary }}
                  />

                  {/* Driver Information */}
                  <div className="relative z-10 space-y-1.5 max-w-[60%]">
                    <div className="flex items-center gap-2">
                      <CountryFlag countryName={driver1.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        {driver1.nationality}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        {driver1.givenName}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                        {driver1.familyName}
                      </h3>
                    </div>

                    {driver1.permanentNumber && (
                      <p className="text-3xl sm:text-4xl font-black italic text-zinc-700 font-mono tracking-tighter select-none">
                        #{driver1.permanentNumber}
                      </p>
                    )}
                  </div>

                  {/* Standing Telemetry Badge */}
                  <div className="relative z-10 pt-4 flex items-center gap-3">
                    {d1Standing ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs">
                        <span className="text-amber-400 font-black">P{d1Standing.position}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-white font-bold">{d1Standing.points} PTS</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs text-zinc-400">
                        <span>VIEW PROFILE</span>
                        <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Driver Inward Cutout (Placed on the right, facing inward) */}
                  <div className="absolute right-0 bottom-0 top-2 w-[48%] pointer-events-none select-none overflow-hidden">
                    <div className="relative w-full h-full flex items-end justify-end">
                      <DriverImage
                        src={d1Photo}
                        alt={`${driver1.givenName} ${driver1.familyName}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 30vw"
                        className="object-contain object-bottom drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                        priority
                        unoptimized
                      />
                    </div>
                    {/* Subtle Base Fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                  </div>
                </Link>
              )}

              {/* Driver 2 (Facing Inward Left) */}
              {driver2 && (
                <Link
                  href={`/drivers/${driver2.driverId}`}
                  className="group relative overflow-hidden p-6 sm:p-7 min-h-[260px] sm:min-h-[280px] flex flex-col justify-between hover:bg-zinc-900/30 transition-all"
                >
                  {/* Ambient accent glow */}
                  <div
                    className="absolute -top-12 -right-12 size-48 rounded-full opacity-15 blur-2xl pointer-events-none group-hover:opacity-25 transition-opacity"
                    style={{ backgroundColor: theme.secondary || theme.primary }}
                  />

                  {/* Driver Information */}
                  <div className="relative z-10 space-y-1.5 max-w-[60%]">
                    <div className="flex items-center gap-2">
                      <CountryFlag countryName={driver2.nationality} className="w-4 h-3 rounded-xs shrink-0" />
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        {driver2.nationality}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        {driver2.givenName}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                        {driver2.familyName}
                      </h3>
                    </div>

                    {driver2.permanentNumber && (
                      <p className="text-3xl sm:text-4xl font-black italic text-zinc-700 font-mono tracking-tighter select-none">
                        #{driver2.permanentNumber}
                      </p>
                    )}
                  </div>

                  {/* Standing Telemetry Badge */}
                  <div className="relative z-10 pt-4 flex items-center gap-3">
                    {d2Standing ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs">
                        <span className="text-amber-400 font-black">P{d2Standing.position}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-white font-bold">{d2Standing.points} PTS</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-white/10 bg-zinc-900/80 font-mono text-xs text-zinc-400">
                        <span>VIEW PROFILE</span>
                        <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {/* Driver Inward Cutout (Placed on the right, facing inward left) */}
                  <div className="absolute right-0 bottom-0 top-2 w-[48%] pointer-events-none select-none overflow-hidden">
                    <div className="relative w-full h-full flex items-end justify-end">
                      <DriverImage
                        src={d2Photo}
                        alt={`${driver2.givenName} ${driver2.familyName}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 30vw"
                        className="object-contain object-bottom drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
                        priority
                        unoptimized
                      />
                    </div>
                    {/* Subtle Base Fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Integrated Teammate Head-to-Head Duel Matrix */}
          {h2hBattles && h2hBattles.length > 0 && (
            <ConstructorDuelWidget battles={h2hBattles} season={h2hSeason} />
          )}
        </div>
      )}

      {/* ── FULL-WIDTH SECTION: Historical Driver Roster ────────────────── */}
      {historicalDrivers.length > 0 && (
        <ConstructorDriverRoster
          drivers={historicalDrivers}
          teamPrimaryColor={theme.primary}
        />
      )}
    </div>
  );
}
