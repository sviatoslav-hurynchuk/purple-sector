import Link from 'next/link';

export default function RaceNotFound() {
    return (
        <div>
            <h2>Race not found</h2>
            <p>The race you are looking for does not exist or has no results yet.</p>
            <Link href="/calendar">Back to Calendar</Link>
        </div>
    );
}