import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton loader for the Dashboard page.
 * Automatically wraps page.tsx in a Suspense boundary.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-9 w-48 bg-muted rounded-md" />
                <div className="h-4 w-64 bg-muted rounded mt-2" />
            </div>

            {/* Next Race skeleton */}
            <Card>
                <CardHeader>
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-7 w-72 bg-muted rounded mt-2" />
                    <div className="h-4 w-96 bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <div className="h-3 w-16 bg-muted rounded" />
                                <div className="h-5 w-24 bg-muted rounded mt-1" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Standings skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
        </div>
    );
}