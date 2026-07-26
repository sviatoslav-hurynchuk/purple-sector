import {
    getDriverStandings,
    getConstructorStandings,
    getRaceSchedule,
} from '@/lib/api';
import type { DriverStanding, ConstructorStanding, Race } from '@/types/f1';
import { SeasonSelector } from '@/components/f1/season-selector';
import { RoundSelector } from '@/components/f1/round-selector';
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

interface StandingsContentProps {
    year: number;
    selectedRound?: number;
    allYears: number[];
}

export async function StandingsContent({ year, selectedRound, allYears }: StandingsContentProps) {
    const [driverStandings, constructorStandings, races] = await Promise.all([
        getDriverStandings(year, selectedRound).catch(() => [] as DriverStanding[]),
        getConstructorStandings(year, selectedRound).catch(() => [] as ConstructorStanding[]),
        getRaceSchedule(year).catch(() => [] as Race[]),
    ]);

    const activeRoundRace = selectedRound
        ? races.find((r) => parseInt(r.round, 10) === selectedRound)
        : undefined;

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">
                        {year} Championship Standings
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {activeRoundRace
                            ? `Classifications after Round ${activeRoundRace.round}: ${activeRoundRace.raceName}`
                            : `Overall season standings for the ${year} Formula 1 championship.`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <SeasonSelector currentSeason={year} allYears={allYears} />
                    {races.length > 0 && (
                        <RoundSelector
                            currentSeason={year}
                            currentRound={selectedRound}
                            races={races}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <span>Driver Standings</span>
                        </CardTitle>
                        <CardDescription>
                            {activeRoundRace
                                ? `Standings after ${activeRoundRace.raceName}`
                                : `Final / Current standings for ${year}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {driverStandings.length > 0 ? (
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
                                            <TableCell className="text-center font-mono font-bold text-muted-foreground">
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
                                            <TableCell className="text-right font-bold tabular-nums text-primary">
                                                {s.points}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {s.wins}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                No driver standings available for this selection.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <span>Constructor Standings</span>
                        </CardTitle>
                        <CardDescription>
                            {activeRoundRace
                                ? `Team standings after ${activeRoundRace.raceName}`
                                : `Final / Current team standings for ${year}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {constructorStandings.length > 0 ? (
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
                                            <TableCell className="text-center font-mono font-bold text-muted-foreground">
                                                {s.position}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {s.Constructor.name}
                                            </TableCell>
                                            <TableCell className="text-right font-bold tabular-nums text-primary">
                                                {s.points}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {s.wins}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                No constructor standings available for this selection.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
