export function RaceDetailSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 animate-pulse" aria-hidden="true">
            {/* ── Main Cockpit Header Skeleton ─────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="h-3.5 w-36 bg-zinc-800/80 rounded mb-2" />
                    <div className="h-10 sm:h-12 w-80 sm:w-[480px] bg-zinc-800 rounded" />
                    <div className="h-4 w-64 sm:w-96 bg-zinc-850 rounded mt-2" />
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="h-9 w-40 bg-zinc-800/60 rounded-xl border border-white/5" />
                    <div className="h-9 w-40 bg-zinc-800/60 rounded-xl border border-white/5" />
                </div>
            </div>

            {/* ── Race Pulse Telemetry Ribbon Skeleton (4-Metric Bar) ──────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 sm:p-5 flex flex-col justify-between gap-2.5 min-h-[96px]">
                        <div className="h-3 w-24 bg-zinc-800 rounded" />
                        <div className="h-7 w-32 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-20 bg-zinc-850 rounded" />
                    </div>
                ))}
            </div>

            {/* ── Timetable Section Skeleton ───────────────────────────────── */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="h-7 w-48 bg-zinc-800 rounded" />
                    <div className="h-9 w-64 bg-zinc-800/60 rounded-xl border border-white/5" />
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl divide-y divide-white/10">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                <div className="w-12 sm:w-14 border-r border-white/10 pr-4 sm:pr-6 flex flex-col items-center gap-1">
                                    <div className="h-6 w-8 bg-zinc-800 rounded" />
                                    <div className="h-3 w-6 bg-zinc-850 rounded" />
                                </div>
                                <div className="h-5 w-36 sm:w-48 bg-zinc-800 rounded" />
                            </div>
                            <div className="h-5 w-16 sm:w-24 bg-zinc-800/80 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Circuit Specifications Card Skeleton ─────────────────────── */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
                <div className="h-10 px-6 border-b border-white/10 bg-zinc-900/30 flex items-center justify-between">
                    <div className="h-3.5 w-40 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-20 bg-zinc-800 rounded" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[260px]">
                    <div className="lg:col-span-7 p-6 flex items-center justify-center">
                        <div className="h-44 w-72 bg-zinc-850/60 rounded-xl" />
                    </div>
                    <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/10 divide-y divide-white/10 bg-zinc-950/40">
                        <div className="p-4">
                            <div className="h-3 w-28 bg-zinc-800 rounded mb-2" />
                            <div className="h-8 w-36 bg-zinc-800 rounded" />
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-white/10">
                            <div className="p-4 space-y-2">
                                <div className="h-3 w-20 bg-zinc-800 rounded" />
                                <div className="h-6 w-16 bg-zinc-800 rounded" />
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="h-3 w-20 bg-zinc-800 rounded" />
                                <div className="h-6 w-16 bg-zinc-800 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
