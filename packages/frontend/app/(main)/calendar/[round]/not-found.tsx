import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Shown when a race round is not found (404 from backend).
 * Triggered by notFound() call in [round]/page.tsx.
 */
export default function RaceNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="text-5xl font-black text-muted-foreground/30 mb-2">404</div>
          <CardTitle>Race not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This race does not exist or results are not available yet.
          </p>
          <Link
            href="/calendar"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          >
            ← Back to Calendar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}