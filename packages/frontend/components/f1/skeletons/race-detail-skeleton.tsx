import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RaceDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-9 w-80 bg-muted rounded mt-2" />
                    <div className="h-4 w-96 bg-muted rounded mt-1" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
            </div>

            <Card>
                <CardHeader>
                    <div className="h-5 w-40 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <div className="h-3 w-12 bg-muted rounded" />
                                <div className="h-5 w-20 bg-muted rounded mt-1" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent className="p-0 pt-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="flex gap-4 px-4 py-3 border-t border-border first:border-t-0">
                            <div className="h-4 w-6 bg-muted rounded" />
                            <div className="h-4 flex-1 bg-muted rounded" />
                            <div className="h-4 w-28 bg-muted rounded" />
                            <div className="h-4 w-8 bg-muted rounded" />
                            <div className="h-4 w-8 bg-muted rounded" />
                            <div className="h-4 w-20 bg-muted rounded" />
                            <div className="h-4 w-8 bg-muted rounded" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
