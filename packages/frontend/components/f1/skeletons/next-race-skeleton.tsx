import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function NextRaceSkeleton() {
    return (
        <Card className="border-border animate-pulse">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="h-3 w-20 bg-muted rounded mb-2" />
                        <div className="h-8 w-72 bg-muted rounded" />
                        <div className="h-4 w-96 bg-muted rounded mt-2" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>
                            <div className="h-3 w-16 bg-muted rounded" />
                            <div className="h-5 w-24 bg-muted rounded mt-1" />
                            <div className="h-3 w-16 bg-muted rounded mt-1" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
