import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StandingsPageSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
                <div>
                    <div className="h-9 w-80 bg-muted rounded-md" />
                    <div className="h-4 w-96 bg-muted rounded mt-2" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="h-9 w-28 bg-muted rounded-md" />
                    <div className="h-9 w-44 bg-muted rounded-md" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {[0, 1].map((col) => (
                    <Card key={col} className="border-border">
                        <CardHeader>
                            <div className="h-6 w-44 bg-muted rounded" />
                            <div className="h-3.5 w-64 bg-muted rounded mt-1.5" />
                        </CardHeader>
                        <CardContent className="p-0">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex gap-4 px-4 py-3.5 border-t border-border first:border-t-0"
                                >
                                    <div className="h-4 w-8 bg-muted rounded" />
                                    <div className="h-4 flex-1 bg-muted rounded" />
                                    <div className="h-4 w-20 bg-muted rounded" />
                                    <div className="h-4 w-12 bg-muted rounded" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
