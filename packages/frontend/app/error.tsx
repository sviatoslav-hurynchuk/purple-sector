'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Root error boundary for the dashboard route.
 * Must be a Client Component.
 */
export default function RootError({
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
                    <CardTitle className="text-destructive">Something went wrong</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                    {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground">
                            Error ID: {error.digest}
                        </p>
                    )}
                    <Button onClick={reset} variant="outline" className="w-full">
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}