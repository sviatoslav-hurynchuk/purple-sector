import Link from 'next/link';
import type { QualifyingResultEntry } from '@/types/f1';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface QualifyingResultsTableProps {
    results: QualifyingResultEntry[];
}

export function QualifyingResultsTable({ results }: QualifyingResultsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-12 text-center">Pos</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">Q1</TableHead>
                    <TableHead className="text-center">Q2</TableHead>
                    <TableHead className="text-center">Q3</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {results.map((result, idx) => (
                    <TableRow key={`${result.Driver.driverId}-${result.position}-${idx}`}>
                        <TableCell className="text-center font-mono font-semibold">
                            {result.position}
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
                        <TableCell className="text-center font-mono text-sm tabular-nums text-muted-foreground">
                            {result.Q1 ?? '—'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm tabular-nums text-muted-foreground">
                            {result.Q2 ?? '—'}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-sm tabular-nums text-foreground">
                            {result.Q3 ?? '—'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
