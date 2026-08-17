import Link from 'next/link';
import type { RaceResultEntry } from '@/types/f1';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface RaceResultsTableProps {
    results: RaceResultEntry[];
    highlightPoints?: boolean;
}

export function RaceResultsTable({ results, highlightPoints = false }: RaceResultsTableProps) {
    return (
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
                {results.map((result, idx) => (
                    <TableRow key={`${result.Driver.driverId}-${result.positionText}-${idx}`}>
                        <TableCell className="text-center font-mono font-semibold">
                            {result.positionText}
                        </TableCell>
                        <TableCell>
                            <Link
                                href={`/drivers/${result.Driver.driverId}`}
                                className="group/driver inline-flex items-center hover:text-primary transition-colors"
                            >
                                <span className="font-semibold group-hover/driver:underline">
                                    {result.Driver.givenName} {result.Driver.familyName}
                                </span>
                                {result.Driver.code && (
                                    <span className="ml-2 text-xs font-mono text-muted-foreground group-hover/driver:text-primary/70">
                                        {result.Driver.code}
                                    </span>
                                )}
                            </Link>
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
                        <TableCell
                            className={cn(
                                'text-right font-bold tabular-nums',
                                highlightPoints && 'text-primary'
                            )}
                        >
                            {result.points}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
