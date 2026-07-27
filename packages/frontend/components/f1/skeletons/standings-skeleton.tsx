import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StandingsSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-pulse">
            {[0, 1].map((col) => (
                <Card key={col}>
                    <CardHeader>
                        <div className="h-5 w-40 bg-muted rounded" />
                        <div className="h-3 w-56 bg-muted rounded mt-1" />
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex gap-4 px-4 py-3 border-t border-border first:border-t-0">
                                <div className="h-4 w-6 bg-muted rounded" />
                                <div className="h-4 flex-1 bg-muted rounded" />
                                <div className="h-4 w-16 bg-muted rounded" />
                                <div className="h-4 w-10 bg-muted rounded" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
