/**
 * Race Detail Page (/calendar/[round])
 *
 * TODO:
 * - Fetch race detail via getRaceDetail(season, round)
 * - Render race header (name, date, circuit)
 * - Render <QualifyingResultsTable />
 * - Render <RaceResultsTable />
 * - Render <PodiumCard /> for top 3
 */
interface RaceDetailPageProps {
  params: Promise<{ round: string }>;
}

export default async function RaceDetailPage({ params }: RaceDetailPageProps) {
  const { round } = await params;

  return (
    <main>
      <h1>Race Detail — Round {round}</h1>
      <p>TODO: Qualifying results, race results, podium</p>
    </main>
  );
}
