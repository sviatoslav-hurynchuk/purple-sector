'use client';

export default function RaceDetailError({
                                            error,
                                            reset,
                                        }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div>
            <h2>Failed to load race results</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Try again</button>
        </div>
    );
}