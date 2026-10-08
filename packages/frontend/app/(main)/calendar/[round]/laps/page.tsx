import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceDetail, getRaceLaps, getRacePitStops, getRaceSchedule, getOpenF1RaceData, isBackendReachable } from '@/lib/api';
import { LapChartPageContent } from '@/components/f1/laps/lap-chart-page-content';
import { RaceCockpitHeader } from '@/components/f1/race-cockpit-header';
import { parseYear, parseRound, getMaxYear } from '@/lib/utils';
import type { Race, RaceResult } from '@/types/f1';
import LapsLoading from './loading';

export const revalidate = 3600;

/** Pre-render all 24 championship rounds for instant SSG page loads */
export async function generateStaticParams() {
  if (!(await isBackendReachable())) {
    return [];
  }

  return Array.from({ length: 24 }, (_, i) => ({
    round: String(i + 1),
  }));
}

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
      <div className="space-y-6 sm:space-y-8">
        {/* ── Top Dual F1 Racing Speed Stripes ───────────────────────────── */}
        <div className="space-y-1.5" aria-hidden="true">
          <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
          <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
        </div>

        <RaceCockpitHeader
          race={race}
          sectionTag="Lap-by-Lap Replay"
        />

        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 sm:p-12 text-center space-y-4 shadow-xl max-w-2xl mx-auto">
          <div className="size-14 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto font-mono text-2xl">
            📊
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono uppercase tracking-wider text-white">
              Lap-by-Lap Data Not Available Yet
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Lap times and position tracking become available once the Grand Prix has started or concluded.
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
