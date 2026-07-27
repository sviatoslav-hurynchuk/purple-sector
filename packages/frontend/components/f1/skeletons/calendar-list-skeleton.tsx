import { Card, CardHeader } from '@/components/ui/card';

export function CalendarListSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-9 w-56 bg-muted rounded-md" />
                    <div className="h-4 w-36 bg-muted rounded mt-2" />
                </div>
                <div className="flex gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-8 w-16 bg-muted rounded-full" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 bg-muted rounded" />
                                    <div>
                                        <div className="h-5 w-48 bg-muted rounded" />
                                        <div className="h-3 w-72 bg-muted rounded mt-1.5" />
                                    </div>
                                </div>
                                <div className="h-6 w-24 bg-muted rounded-full shrink-0" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
