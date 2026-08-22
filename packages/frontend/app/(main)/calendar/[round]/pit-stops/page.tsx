import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRaceDetail, getRacePitStops, getRaceSchedule } from '@/lib/api';
import { PitStopPageContent } from '@/components/f1/pit-stops/pit-stop-page-content';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race, RaceResult } from '@/types/f1';

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

  const [raceDetail, pitStops] = await Promise.all([
    getRaceDetail(year, parsedRound),
    getRacePitStops(year, parsedRound),
  ]);

  let race: Race | RaceResult | null = raceDetail;

  if (!race) {
    const schedule = await getRaceSchedule(year).catch(() => [] as Race[]);
    race = schedule.find((r) => parseInt(r.round, 10) === parsedRound) ?? null;
  }

  if (!race || !pitStops || pitStops.length === 0) {
    notFound();
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
      />
    </Suspense>
  );
}