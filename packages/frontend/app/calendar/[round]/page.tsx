import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceDetail } from '@/lib/api';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RaceDetailPageProps {
    params: Promise<{ round: string }>;
    searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params, searchParams }: RaceDetailPageProps): Promise<Metadata> {
    const { round } = await params;
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();
    const race = await getRaceDetail(year, parseInt(round, 10));
    return {
        title: race ? `${race.raceName} ${year}` : 'Race Detail',
    };
}

export default async function RaceDetailPage({ params, searchParams }: RaceDetailPageProps) {
    const { round } = await params;
    const { season } = await searchParams;
    const year = season ? parseInt(season, 10) : new Date().getFullYear();

    const race = await getRaceDetail(year, parseInt(round, 10));

    if (!race) notFound();

    return (
        <div className="space-y-8">

            {/* Back link */}
            <Link
                href={`/calendar?season=${year}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
                ← Back to {year} Calendar
            </Link>

            {/* Race header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                        Round {race.round} · {year}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">{race.raceName}</h1>
                    <p className="text-muted-foreground mt-1">
                        {race.Circuit.circuitName} — {race.Circuit.Location.locality},{' '}
                        {race.Circuit.Location.country}
                    </p>
                </div>
                <Badge variant="outline" className="self-start border-border text-muted-foreground">
                    {race.date}
                </Badge>
            </div>

            {/* Session dates */}
            {(race.FirstPractice || race.Qualifying || race.Sprint) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Weekend Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {race.FirstPractice && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">FP1</p>
                                    <p className="font-semibold text-sm mt-0.5">{race.FirstPractice.date}</p>
                                </div>
                            )}
                            {race.SecondPractice && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">FP2</p>
                                    <p className="font-semibold text-sm mt-0.5">{race.SecondPractice.date}</p>
                                </div>
                            )}
                            {race.ThirdPractice && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">FP3</p>
                                    <p className="font-semibold text-sm mt-0.5">{race.ThirdPractice.date}</p>
                                </div>
                            )}
                            {race.Sprint && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Sprint</p>
                                    <p className="font-semibold text-sm mt-0.5">{race.Sprint.date}</p>
                                </div>
                            )}
                            {race.Qualifying && (
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Qualifying</p>
                                    <p className="font-semibold text-sm mt-0.5">{race.Qualifying.date}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Race results */}
            {'Results' in race && Array.isArray(race.Results) && race.Results.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Race Results</CardTitle>
                        <CardDescription>Final classified order.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">Pos</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-center">Grid</TableHead>
                                    <TableHead className="text-center">Laps</TableHead>
                                    <TableHead>Time / Status</TableHead>
                                    <TableHead className="text-right">Pts</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {race.Results.map((result) => (
                                    <TableRow key={result.Driver.driverId}>
                                        <TableCell className="text-center font-mono font-semibold">
                                            {result.positionText}
                                        </TableCell>
                                        <TableCell>
                      <span className="font-semibold">
                        {result.Driver.givenName} {result.Driver.familyName}
                      </span>
                                            {result.Driver.code && (
                                                <span className="ml-2 text-xs font-mono text-muted-foreground">
                          {result.Driver.code}
                        </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {result.Constructor.name}
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums text-muted-foreground">
                                            {result.grid}
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums text-muted-foreground">
                                            {result.laps}
                                        </TableCell>
                                        <TableCell className="text-sm tabular-nums">
                                            {result.Time?.time ?? (
                                                <span className="text-muted-foreground">{result.status}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold tabular-nums">
                                            {result.points}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Results not yet available for this race.
                    </CardContent>
                </Card>
            )}

        </div>
    );
}