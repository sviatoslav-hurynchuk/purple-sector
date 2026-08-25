import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceLaps, getRacePitStops, getRaceSchedule } from '@/lib/api';
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

  const [raceDetail, lapsData, pitStops] = await Promise.all([
    getRaceDetail(year, parsedRound),
    getRaceLaps(year, parsedRound),
    getRacePitStops(year, parsedRound).catch(() => null),
  ]);

  let race: Race | RaceResult | null = raceDetail;

  if (!race) {
    const schedule = await getRaceSchedule(year).catch(() => [] as Race[]);
    race = schedule.find((r) => parseInt(r.round, 10) === parsedRound) ?? null;
  }

  if (!race || !lapsData || lapsData.laps.length === 0) {
    notFound();
  }

  const validResults =
    'Results' in race &&
    Array.isArray((race as { Results?: unknown[] }).Results) &&
    (race as { Results: unknown[] }).Results.every((r) => Boolean(r && typeof r === 'object'))
      ? (race as { Results: import('@/types/f1').RaceResultEntry[] }).Results
      : undefined;

  return (
    <Suspense fallback={<LapsLoading />}>
      <LapChartPageContent
        race={race}
        lapsData={lapsData}
        pitStops={pitStops ?? []}
        raceResults={validResults}
      />
    </Suspense>
  );
}
