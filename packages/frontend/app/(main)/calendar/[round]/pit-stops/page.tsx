import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceDetail, getRacePitStops, getRaceSchedule, getOpenF1RaceData } from '@/lib/api';
import { PitStopPageContent } from '@/components/f1/pit-stops/pit-stop-page-content';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race, RaceResult } from '@/types/f1';

export const revalidate = 3600;

/** Pre-render all 24 championship rounds for instant SSG page loads */
export async function generateStaticParams() {
  return Array.from({ length: 24 }, (_, i) => ({
    round: String(i + 1),
  }));
}

interface PitStopsPageProps {
  params: Promise<{ round: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: PitStopsPageProps): Promise<Metadata> {
  const { round } = await params;
  const { season } = await searchParams;
  const parsedRound = parseRound(round);
  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  if (parsedRound === null) {
    return { title: 'Pit Stops Not Found' };
  }

  return {
    title: `Pit Stops · Round ${parsedRound} · ${year}`,
    description: `Complete pit stop chronology, fastest pit stop awards, and telemetry comparison for Round ${parsedRound} of the ${year} Formula 1 season.`,
  };
}

export default async function PitStopsPage({ params, searchParams }: PitStopsPageProps) {
  const { round } = await params;
  const { season } = await searchParams;

  const parsedRound = parseRound(round);
  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  if (parsedRound === null) {
    notFound();
  }

  const [raceDetail, pitStops, openF1Data] = await Promise.all([
    getRaceDetail(year, parsedRound),
    getRacePitStops(year, parsedRound),
    getOpenF1RaceData(year, parsedRound).catch(() => null),
  ]);

  let race: Race | RaceResult | null = raceDetail;

  if (!race) {
    const schedule = await getRaceSchedule(year).catch(() => [] as Race[]);
    race = schedule.find((r) => parseInt(r.round, 10) === parsedRound) ?? null;
  }

  if (!race) {
    notFound();
  }

  // If the race is valid but pit stops data is not yet available (e.g. upcoming race)
  if (!pitStops || pitStops.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/calendar/${race.round}?season=${race.season}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors mb-3 group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to {race.raceName}</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
            {race.raceName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-mono">
            {race.Circuit.circuitName} · Round {race.round} · {year}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-xl max-w-2xl mx-auto">
          <div className="size-14 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto font-mono text-2xl">
            ⏱
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-wider text-white">
              Pit Stop Telemetry Not Available Yet
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Pit stop timing, tire compound stints, and station durations will become available once the Grand Prix has concluded.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/calendar/${race.round}?season=${race.season}`}
              className="inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-950/20"
            >
              Back to Race Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validResults =
    'Results' in race &&
    Array.isArray((race as { Results?: unknown[] }).Results) &&
    (race as { Results: unknown[] }).Results.every((r) => Boolean(r && typeof r === 'object'))
      ? (race as { Results: import('@/types/f1').RaceResultEntry[] }).Results
      : undefined;

  return (
    <Suspense fallback={<div className="animate-pulse space-y-6"><div className="h-20 bg-zinc-900 rounded-xl" /><div className="h-64 bg-zinc-900 rounded-xl" /></div>}>
      <PitStopPageContent
        race={race}
        pitStops={pitStops}
        raceResults={validResults}
        openF1Data={openF1Data}
      />
    </Suspense>
  );
}