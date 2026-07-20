import Link from 'next/link';

export default function RaceNotFound() {
    return (
        <div>
            <Link
            href="/calendar" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            > ← Back to Calendar
            </Link>
            <h2>Race not found</h2>
            <p>The race you are looking for does not exist or has no results yet.</p>

        </div>
    );
}