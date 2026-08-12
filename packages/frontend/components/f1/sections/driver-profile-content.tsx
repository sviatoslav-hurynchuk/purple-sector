import Link from 'next/link';
import Image from 'next/image';
import type { DriverProfile } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Trophy, Award, Zap, Flag } from 'lucide-react';

interface DriverProfileContentProps {
  profile: DriverProfile;
}

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export function DriverProfileContent({ profile }: DriverProfileContentProps) {
  const { driver, careerStats, seasonHistory } = profile;
  const photoUrl = getDriverPhotoUrl(driver.driverId);
  const age = calculateAge(driver.dateOfBirth);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/drivers"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Drivers</span>
        </Link>
      </div>

      {/* Hero Profile Header */}
      <Card className="border-border overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Driver Photo */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="relative w-full max-w-[280px] h-72 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-800/40 to-zinc-950/90 border border-zinc-800 flex items-center justify-center">
                <Image
                  src={photoUrl}
                  alt={`${driver.givenName} ${driver.familyName}`}
                  fill
                  sizes="(max-width: 1024px) 280px, 280px"
                  className="object-contain object-bottom drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Driver Info Details */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CountryFlag countryName={driver.nationality} />
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {driver.nationality}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {driver.code && (
                    <Badge variant="outline" className="font-mono text-sm font-bold border-zinc-700">
                      {driver.code}
                    </Badge>
                  )}
                  {driver.permanentNumber && (
                    <Badge className="bg-primary text-primary-foreground font-mono text-sm font-bold">
                      #{driver.permanentNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm sm:text-base font-semibold uppercase tracking-widest text-muted-foreground">
                  {driver.givenName}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground">
                  {driver.familyName}
                </h1>
              </div>

              {/* Bio info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border/80 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-medium">Date of Birth</p>
                  <p className="font-mono font-semibold text-foreground mt-0.5">
                    {driver.dateOfBirth} {age !== null && <span className="text-muted-foreground">({age} y/o)</span>}
                  </p>
                </div>

                {driver.permanentNumber && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-medium">Permanent Number</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">#{driver.permanentNumber}</p>
                  </div>
                )}

                {driver.url && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-medium">Biography</p>
                    <a
                      href={driver.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline mt-0.5"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Statistics Cards (Grid of 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Championships</p>
              <p className="text-3xl font-black font-mono text-foreground mt-0.5">{careerStats.championships}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Flag className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Race Wins</p>
              <p className="text-3xl font-black font-mono text-foreground mt-0.5">{careerStats.wins}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Award className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Podiums</p>
              <p className="text-3xl font-black font-mono text-foreground mt-0.5">{careerStats.podiums}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-zinc-900/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Zap className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pole Positions</p>
              <p className="text-3xl font-black font-mono text-foreground mt-0.5">{careerStats.poles}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Season History Table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl font-bold">Championship & Team History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {seasonHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase text-muted-foreground tracking-wider">
                    <th className="px-4 py-3 text-left w-20">Season</th>
                    <th className="px-4 py-3 text-left">Team(s)</th>
                    <th className="px-4 py-3 text-center w-20">Position</th>
                    <th className="px-4 py-3 text-right">Points</th>
                    <th className="px-4 py-3 text-right">Wins</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonHistory.map((sh, idx) => {
                    const isChampion = sh.position === '1';

                    return (
                      <tr
                        key={`${sh.season}-${idx}`}
                        className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold tabular-nums">
                          <Link
                            href={`/standings?season=${sh.season}`}
                            className="hover:text-primary transition-colors"
                          >
                            {sh.season}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-semibold text-muted-foreground">
                          {sh.constructors.map((c) => c.name).join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold tabular-nums">
                          <span
                            className={
                              isChampion
                                ? 'text-amber-400 font-extrabold flex items-center justify-center gap-1'
                                : Number(sh.position) <= 3
                                ? 'text-primary'
                                : ''
                            }
                          >
                            {isChampion && <Trophy className="size-3.5 inline text-amber-400" />}
                            {sh.position}
                          </span>
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
        </CardContent>
      </Card>
    </div>
  );
}
