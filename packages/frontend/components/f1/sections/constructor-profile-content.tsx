import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Trophy,
  ChevronLeft,
  MapPin,
  User,
  Wrench,
  Zap,
  Shield,
  Flag,
  Calendar,
  ExternalLink,
  Award,
} from 'lucide-react';
import { getConstructorProfile } from '@/lib/api';
import { getTeamTheme } from '@/lib/team-colors';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { CountryFlag } from '@/components/f1/country-flag';
import { ConstructorDriverRoster } from '@/components/f1/constructor-driver-roster';

interface ConstructorProfileContentProps {
  constructorId: string;
}

export async function ConstructorProfileContent({ constructorId }: ConstructorProfileContentProps) {
  const profile = await getConstructorProfile(constructorId);

  if (!profile) {
    notFound();
  }

  const { constructor: team, meta, stats, currentDrivers, historicalDrivers, seasonsCount } = profile;
  const theme = getTeamTheme(team.constructorId);
  const isLight = theme.textColor === 'dark';

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/constructors"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Teams</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
        {/* Accent team background header */}
        <div
          className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, rgba(20,20,20,0.95) 100%)`,
          }}
        >
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <CountryFlag countryName={team.nationality} />
              <span
                className={[
                  'text-xs font-bold uppercase tracking-wider',
                  isLight ? 'text-black/80' : 'text-white/80',
                ].join(' ')}
              >
                {team.nationality}
              </span>
              {meta.firstEntry && (
                <span
                  className={[
                    'text-xs px-2 py-0.5 rounded font-mono',
                    isLight ? 'bg-black/15 text-black' : 'bg-white/15 text-white',
                  ].join(' ')}
                >
                  Est. {meta.firstEntry}
                </span>
              )}
            </div>

            <h1
              className={[
                'text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight',
                isLight ? 'text-black' : 'text-white',
              ].join(' ')}
            >
              {meta.fullName || team.name}
            </h1>

            {meta.base && (
              <div
                className={[
                  'flex items-center gap-1.5 text-xs sm:text-sm font-medium',
                  isLight ? 'text-black/75' : 'text-white/75',
                ].join(' ')}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>{meta.base}</span>
              </div>
            )}
          </div>

          {/* Championships trophy badge */}
          {stats.championships > 0 && (
            <div
              className={[
                'z-10 self-start md:self-auto px-4 py-3 rounded-xl border flex items-center gap-3 backdrop-blur-md',
                isLight
                  ? 'bg-black/10 border-black/20 text-black'
                  : 'bg-white/10 border-white/20 text-white',
              ].join(' ')}
            >
              <Trophy className="h-8 w-8 text-amber-400 drop-shadow shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  Constructors&apos; Titles
                </p>
                <p className="text-2xl font-black font-mono">
                  {stats.championships}x <span className="text-xs font-bold uppercase">World Champion</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Career Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 bg-zinc-900/60 border-b border-white/10">
          <div className="p-4 sm:p-5 text-center">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Race Entries
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              {stats.totalRaces > 0 ? stats.totalRaces : '—'}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Grand Prix Wins
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
              {stats.wins}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Podiums
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              {stats.podiums}
            </p>
          </div>

          <div className="p-4 sm:p-5 text-center">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Pole Positions
            </p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              {stats.poles}
            </p>
          </div>
        </div>
      </div>

      {/* Leadership & Technical Specs */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5 text-zinc-400" />
          Team Leadership &amp; Technical Specs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-card/60 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Team Principal
              </p>
              <p className="text-sm font-bold text-foreground truncate">{meta.teamPrincipal || '—'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-card/60 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
              <Wrench className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Technical Chief
              </p>
              <p className="text-sm font-bold text-foreground truncate">{meta.technicalChief || '—'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-card/60 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Power Unit
              </p>
              <p className="text-sm font-bold text-foreground truncate">{meta.powerUnit || '—'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-card/60 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
              <Flag className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Chassis
              </p>
              <p className="text-sm font-bold text-foreground truncate">{meta.chassis || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Drivers Lineup */}
      {currentDrivers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-zinc-400" />
            Official Driver Lineup
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {currentDrivers.map((driver) => {
              const photoUrl = getDriverPhotoUrl(
                driver.driverId,
                driver.givenName,
                driver.familyName,
                '2026',
                team.constructorId
              );

              return (
                <Link
                  key={driver.driverId}
                  href={`/drivers/${driver.driverId}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 min-h-[220px] flex flex-col justify-between hover:border-white/25 transition-all shadow-lg"
                >
                  <div className="relative z-10 space-y-1">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      {driver.givenName}
                    </p>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                      {driver.familyName}
                    </h3>
                    {driver.permanentNumber && (
                      <p className="text-3xl font-black italic text-zinc-500 font-mono">
                        #{driver.permanentNumber}
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center gap-2 pt-4">
                    <CountryFlag countryName={driver.nationality} />
                    <span className="text-xs text-zinc-400 font-medium">{driver.nationality}</span>
                  </div>

                  {/* Driver Cutout */}
                  <div className="absolute top-2 -right-2 sm:right-2 h-[190%] w-[60%] sm:w-[50%] pointer-events-none select-none">
                    <Image
                      src={photoUrl}
                      alt={`${driver.givenName} ${driver.familyName}`}
                      fill
                      sizes="300px"
                      className="object-contain object-top transition-transform duration-300 group-hover:scale-105 origin-top drop-shadow-lg"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Drivers Roster */}
      {historicalDrivers.length > 0 && (
        <div className="pt-4 border-t border-border">
          <ConstructorDriverRoster drivers={historicalDrivers} teamPrimaryColor={theme.primary} />
        </div>
      )}
    </div>
  );
}
