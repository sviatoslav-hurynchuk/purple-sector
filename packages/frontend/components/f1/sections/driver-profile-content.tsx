import Link from 'next/link';
import Image from 'next/image';
import type { DriverProfile, DriverSeasonStanding } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { getTeamTheme } from '@/lib/team-colors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Trophy } from 'lucide-react';

interface DriverProfileContentProps {
  profile: DriverProfile;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const ageMs = Date.now() - dob.getTime();
  return Math.abs(new Date(ageMs).getUTCFullYear() - 1970);
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** A single stats row: label on left, value on right, with a bottom divider */
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-zinc-800/70 last:border-0">
      <span className="text-sm text-zinc-400 font-medium">{label}</span>
      <span className="text-xl font-black font-mono tabular-nums text-white">{value}</span>
    </div>
  );
}

export function DriverProfileContent({ profile }: DriverProfileContentProps) {
  const { driver, careerStats, seasonHistory } = profile;
  const photoUrl = getDriverPhotoUrl(driver.driverId, driver.givenName, driver.familyName);
  const age = calculateAge(driver.dateOfBirth);

  // Current season = most recent entry in seasonHistory (already sorted desc)
  const currentSeason: DriverSeasonStanding | undefined = seasonHistory[0];
  const currentSeasonYear = currentSeason?.season;

  // Current team from latest season
  const currentConstructorId = currentSeason?.constructors[0]?.constructorId;
  const currentTeamName = currentSeason?.constructors[0]?.name ?? '—';
  const teamTheme = getTeamTheme(currentConstructorId);
  const isLightTeam = teamTheme.textColor === 'dark';

  // Career points — computed from all seasons
  const careerPoints = Math.round(
    seasonHistory.reduce((sum, s) => sum + parseFloat(s.points || '0'), 0)
  );

  return (
    <div className="space-y-0">
      {/* ── Back button ──────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/drivers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>All Drivers</span>
        </Link>
      </div>

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border mb-3">
        {/* Team color background strip */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(120deg, ${teamTheme.primary}CC 0%, ${teamTheme.primary}66 35%, transparent 65%)`,
          }}
        />
        {/* Dark overlay to keep readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-black/50" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: driver info */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            {/* Nationality row */}
            <div className="flex items-center gap-3">
              <CountryFlag countryName={driver.nationality} />
              <span className="text-sm font-semibold uppercase tracking-widest text-white/70">
                {driver.nationality}
              </span>
            </div>

            {/* Name block */}
            <div>
              <p className="text-sm sm:text-lg font-medium uppercase tracking-widest text-white/60 mb-1">
                {driver.givenName}
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none">
                {driver.familyName}
              </h1>

              {/* Team badge */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
                  style={{
                    backgroundColor: teamTheme.primary,
                    color: isLightTeam ? '#000' : '#fff',
                    borderColor: isLightTeam ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {currentTeamName}
                </span>
                {driver.code && (
                  <Badge variant="outline" className="font-mono text-sm font-bold border-white/30 text-white/80">
                    {driver.code}
                  </Badge>
                )}
                {driver.permanentNumber && (
                  <Badge className="bg-white/10 text-white font-mono text-sm font-bold border-0 backdrop-blur">
                    #{driver.permanentNumber}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bio info row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10 pt-5">
              {driver.dateOfBirth && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Date of Birth</p>
                  <p className="font-mono font-semibold text-white mt-1 text-sm">
                    {driver.dateOfBirth}
                    {age !== null && <span className="text-white/50 ml-1">({age})</span>}
                  </p>
                </div>
              )}
              {driver.url && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Wikipedia</p>
                  <a
                    href={driver.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline mt-1 text-sm"
                  >
                    Biography <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {careerStats.championships > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40 font-medium">Championships</p>
                  <p className="font-mono font-black text-amber-400 text-2xl mt-0.5">
                    {careerStats.championships}× 🏆
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: driver photo */}
          <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-auto min-h-[260px] flex items-end justify-center lg:justify-end overflow-hidden">
            <div className="relative w-full h-full max-h-[420px] lg:max-h-none">
              <Image
                src={photoUrl}
                alt={`${driver.givenName} ${driver.familyName}`}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-contain object-bottom drop-shadow-2xl"
                priority
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STATISTICS SECTION ───────────────────────────────── */}
      <div className="mt-8">
        {/* Section header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black uppercase tracking-widest text-foreground">
            Statistics
          </h2>
          <div className="h-0.5 mt-2" style={{ backgroundColor: teamTheme.primary }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Season stats */}
          <div className="lg:col-span-7">
            {currentSeason ? (
              <>
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground mb-4">
                  {currentSeasonYear} Season
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    <StatRow
                      label="Championship Position"
                      value={ordinal(parseInt(currentSeason.position, 10))}
                    />
                    <StatRow label="Season Points" value={currentSeason.points} />
                    <StatRow label="Race Wins" value={currentSeason.wins} />
                    <StatRow label="Seasons in F1" value={seasonHistory.length} />
                  </div>
                  <div>
                    <StatRow label="Career Points" value={careerPoints} />
                    <StatRow label="Career Wins" value={careerStats.wins} />
                    <StatRow label="Career Podiums" value={careerStats.podiums} />
                    <StatRow label="Pole Positions" value={careerStats.poles} />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-muted-foreground">No season data available.</div>
            )}
          </div>

          {/* Right: Career stats card */}
          <div className="lg:col-span-5">
            <Card className="border-border bg-zinc-900/80 h-full">
              <CardHeader className="pb-2 pt-5 px-5">
                <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
                  Career Stats
                </h3>
                <div className="h-0.5 mt-1 bg-border" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {careerStats.totalRaces > 0 && (
                  <StatRow label="Grands Prix Entered" value={careerStats.totalRaces} />
                )}
                <StatRow label="Career Points" value={careerPoints} />
                {careerStats.championships > 0 && (
                  <StatRow label="World Championships" value={careerStats.championships} />
                )}
                <StatRow label="Race Wins" value={careerStats.wins} />
                <StatRow label="Podiums" value={careerStats.podiums} />
                <StatRow label="Pole Positions" value={careerStats.poles} />
                <StatRow label="Seasons in F1" value={seasonHistory.length} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── SEASON HISTORY TABLE ─────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-2xl font-black uppercase tracking-widest text-foreground">
            Season History
          </h2>
          <div className="h-0.5 mt-2 bg-border" />
        </div>

        {seasonHistory.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground font-bold w-20">
                    Season
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Team
                  </th>
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-widest text-muted-foreground font-bold w-24">
                    Position
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    Points
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-widest text-muted-foreground font-bold w-16">
                    Wins
                  </th>
                </tr>
              </thead>
              <tbody>
                {seasonHistory.map((sh, idx) => {
                  const isChampion = sh.position === '1';
                  const pos = parseInt(sh.position, 10);
                  const constructorId = sh.constructors[0]?.constructorId;
                  const rowTheme = getTeamTheme(constructorId);

                  return (
                    <tr
                      key={`${sh.season}-${idx}`}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Team color indicator + season */}
                      <td className="px-4 py-3 font-mono font-bold tabular-nums">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-1 h-5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: rowTheme.primary }}
                          />
                          <Link
                            href={`/standings?season=${sh.season}`}
                            className="hover:text-primary transition-colors"
                          >
                            {sh.season}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-semibold">
                        {sh.constructors.map((c) => c.name).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold tabular-nums">
                        {isChampion ? (
                          <span className="inline-flex items-center justify-center gap-1 text-amber-400 font-extrabold">
                            <Trophy className="size-3.5" />1
                          </span>
                        ) : (
                          <span className={pos <= 3 ? 'text-primary' : ''}>{sh.position}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-foreground">
                        {sh.points}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {sh.wins}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No championship history available for this driver.
          </div>
        )}
      </div>
    </div>
  );
}
