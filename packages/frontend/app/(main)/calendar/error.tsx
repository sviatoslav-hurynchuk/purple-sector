'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CalendarError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-destructive">Failed to load calendar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        An unexpected error occurred while loading the race calendar. Please try again.
                    </p>
                    {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground">
                            Error ID: {error.digest}
                        </p>
                    )}
                    <div className="flex gap-3">
                        <Button onClick={reset} variant="outline" className="flex-1">
                            Try again
                        </Button>
                        <Link
                            href="/"
                            className={cn(buttonVariants({ variant: 'ghost' }), 'flex-1')}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}