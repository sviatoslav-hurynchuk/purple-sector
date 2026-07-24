import type { Metadata } from 'next';
import { getDriverStandings, getConstructorStandings, getNextRace } from '@/lib/api';
import type { DriverStanding, ConstructorStanding } from '@/types/f1';
import { NextRaceCard } from '@/components/f1/next-race-card';
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

export const metadata: Metadata = {
    title: 'Dashboard',
};

export default async function DashboardPage() {
    const [driverStandings, constructorStandings, nextRace] = await Promise.all([
        getDriverStandings(),
        getConstructorStandings(),
        getNextRace(),
    ]);

    return (
        <div className="space-y-8">

            {/* Page header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Current season standings and upcoming race.
                </p>
            </div>

            {/* Next Race card */}
            {nextRace && <NextRaceCard race={nextRace} />}

            {/* Standings grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Driver Standings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Driver Standings</CardTitle>
                        <CardDescription>Points after the latest round.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">Pos</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-right">Pts</TableHead>
                                    <TableHead className="text-right">Wins</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {driverStandings.map((s: DriverStanding, idx: number) => (
                                    <TableRow key={`${s.Driver.driverId}-${s.position}-${idx}`}>
                                        <TableCell className="text-center font-mono text-muted-foreground">
                                            {s.position}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {s.Driver.givenName} {s.Driver.familyName}
                                            {s.Driver.code && (
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">
                          {s.Driver.code}
                        </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {s.Constructors[0]?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold tabular-nums">
                                            {s.points}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {s.wins}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Constructor Standings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Constructor Standings</CardTitle>
                        <CardDescription>Team points after the latest round.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">Pos</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-right">Pts</TableHead>
                                    <TableHead className="text-right">Wins</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {constructorStandings.map((s: ConstructorStanding, idx: number) => (
                                    <TableRow key={`${s.Constructor.constructorId}-${s.position}-${idx}`}>
                                        <TableCell className="text-center font-mono text-muted-foreground">
                                            {s.position}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {s.Constructor.name}
                                        </TableCell>
                                        <TableCell className="text-right font-bold tabular-nums">
                                            {s.points}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {s.wins}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}