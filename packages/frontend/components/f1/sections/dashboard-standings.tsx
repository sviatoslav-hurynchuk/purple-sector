import { getDriverStandings, getConstructorStandings } from '@/lib/api';
import type { DriverStanding, ConstructorStanding } from '@/types/f1';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export async function DashboardStandings() {
    const [driverStandings, constructorStandings] = await Promise.all([
        getDriverStandings().catch(() => []),
        getConstructorStandings().catch(() => []),
    ]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Driver Standings</CardTitle>
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
                            {driverStandings.slice(0, 10).map((item: DriverStanding) => (
                                <TableRow key={`${item.Driver.driverId}-${item.position}`}>
                                    <TableCell className="text-center font-bold font-mono">
                                        {item.position}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.Driver.givenName} {item.Driver.familyName}{' '}
                                        <span className="text-xs text-muted-foreground uppercase font-mono">
                                            {item.Driver.code}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {item.Constructors[0]?.name ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {item.points}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">
                                        {item.wins}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Constructor Standings</CardTitle>
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
                            {constructorStandings.map((item: ConstructorStanding) => (
                                <TableRow key={`${item.Constructor.constructorId}-${item.position}`}>
                                    <TableCell className="text-center font-bold font-mono">
                                        {item.position}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {item.Constructor.name}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {item.points}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">
                                        {item.wins}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
