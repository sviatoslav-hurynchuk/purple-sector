import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceLaps, getRacePitStops, getRaceSchedule, getOpenF1RaceData } from '@/lib/api';
import { LapChartPageContent } from '@/components/f1/laps/lap-chart-page-content';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race, RaceResult } from '@/types/f1';
import LapsLoading from './loading';

interface LapsPageProps {
  params: Promise<{ round: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: LapsPageProps): Promise<Metadata> {
  const { round } = await params;
  const { season } = await searchParams;
  const parsedRound = parseRound(round);
  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  if (parsedRound === null) {
    return { title: 'Lap Chart Not Found' };
  }

  return {
    title: `Lap Chart & Race Replay · Round ${parsedRound} · ${year}`,
    description: `Interactive lap-by-lap race trace, position changes, and teammate pace battle for Round ${parsedRound} of the ${year} Formula 1 season.`,
  };
}

export default async function LapsPage({ params, searchParams }: LapsPageProps) {
  const { round } = await params;
  const { season } = await searchParams;

  const parsedRound = parseRound(round);
  const maxYear = getMaxYear();
  const year = parseYear(season, maxYear);

  if (parsedRound === null) {
    notFound();
  }

  const [raceDetail, lapsData, pitStops, openF1Data] = await Promise.all([
    getRaceDetail(year, parsedRound),
    getRaceLaps(year, parsedRound),
    getRacePitStops(year, parsedRound).catch(() => null),
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

  // If the race is valid but lap data is not yet available (e.g. upcoming race)
  if (!lapsData || lapsData.laps.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/calendar/${race.round}?season=${race.season}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-3 group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to {race.raceName}</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            {race.raceName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {race.Circuit.circuitName} · Round {race.round} · {year}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-8 sm:p-12 text-center space-y-4 shadow-lg max-w-2xl mx-auto">
          <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-muted-foreground mx-auto">
            📊
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Lap-by-Lap Data Not Available Yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Lap times and position tracking become available once the Grand Prix has started or concluded.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/calendar/${race.round}?season=${race.season}`}
              className="inline-flex items-center justify-center font-bold px-5 py-2.5 rounded-xl text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              Back to Race Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LapsLoading />}>
      <LapChartPageContent
        race={race}
        lapsData={lapsData}
        pitStops={pitStops ?? []}
        openF1Data={openF1Data}
      />
    </Suspense>
  );
}
