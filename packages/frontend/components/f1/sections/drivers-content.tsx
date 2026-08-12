import Link from 'next/link';
import Image from 'next/image';
import { getSeasonDrivers } from '@/lib/api';
import { SeasonSelector } from '@/components/f1/season-selector';
import { CountryFlag } from '@/components/f1/country-flag';
import { getDriverPhotoUrl } from '@/lib/driver-photos';
import { parseYear, getMaxYear } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Driver } from '@/types/f1';

interface DriversContentProps {
  searchParams: Promise<{ season?: string }>;
  allYears: number[];
}

export async function DriversContent({ searchParams, allYears }: DriversContentProps) {
  const { season } = await searchParams;

  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  const drivers: Driver[] = await getSeasonDrivers(year).catch(() => []);

  return (
    <div className="space-y-8">
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {year} Formula 1 Drivers
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete driver lineup and athlete profiles for the {year} Championship.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <SeasonSelector currentSeason={year} allYears={allYears} />
        </div>
      </div>

      {/* Driver Cards Grid */}
      {drivers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {drivers.map((driver) => {
            const photoUrl = getDriverPhotoUrl(driver.driverId);

            return (
              <Link
                key={driver.driverId}
                href={`/drivers/${driver.driverId}`}
                className="group block transition-transform duration-200 hover:-translate-y-1"
              >
                <Card className="h-full border-border bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all overflow-hidden relative">
                  {/* Driver Number Badge in Top Right */}
                  {driver.permanentNumber && (
                    <div className="absolute top-3 right-3 z-10 font-mono font-black text-3xl text-zinc-700/80 group-hover:text-primary/90 transition-colors select-none">
                      {driver.permanentNumber}
                    </div>
                  )}

                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    {/* Top: Flag + Code */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <CountryFlag countryName={driver.nationality} />
                      {driver.code && (
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold border-zinc-800 group-hover:border-primary/50 text-muted-foreground group-hover:text-foreground transition-colors"
                        >
                          {driver.code}
                        </Badge>
                      )}
                    </div>

                    {/* Photo Container */}
                    <div className="relative w-full h-48 my-2 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-zinc-900/20 to-zinc-950/60">
                      <Image
                        src={photoUrl}
                        alt={`${driver.givenName} ${driver.familyName}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </div>

                    {/* Bottom: Driver Name & Nationality */}
                    <div className="mt-3 border-t border-zinc-800/60 pt-3">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {driver.givenName}
                      </p>
                      <h2 className="text-xl font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                        {driver.familyName}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {driver.nationality}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No driver data available for season {year}.
        </div>
      )}
    </div>
  );
}
