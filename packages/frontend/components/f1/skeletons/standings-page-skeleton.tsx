export function StandingsPageSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 animate-pulse" aria-hidden="true">
            {/* ── Cockpit Header Skeleton ──────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="h-10 sm:h-12 w-80 sm:w-[480px] bg-zinc-800 rounded" />
                    <div className="h-4 w-64 sm:w-96 bg-zinc-850 rounded mt-2" />
                </div>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="h-10 w-44 bg-zinc-800/60 rounded-full border border-white/5" />
                    <div className="h-10 w-44 bg-zinc-800/60 rounded-xl border border-white/5" />
                </div>
            </div>

            {/* ── Telemetry Ribbon Skeleton (4-Metric Bar) ─────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 sm:p-5 flex flex-col justify-between gap-2.5 min-h-[96px]">
                        <div className="h-3 w-24 bg-zinc-800 rounded" />
                        <div className="h-7 w-32 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-20 bg-zinc-850 rounded" />
                    </div>
                ))}
            </div>

            {/* ── Standings Matrix Skeleton ─────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 items-stretch">
                {[0, 1].map((col) => (
                    <div
                        key={col}
                        className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between"
                    >
                        <div className="h-10 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/30 flex items-center justify-between">
                            <div className="h-4 w-48 bg-zinc-800 rounded" />
                        </div>
                        <div className="divide-y divide-white/5">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-2 sm:py-2.5 px-4 sm:px-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-6 bg-zinc-800 rounded" />
                                        <div className="h-4 w-32 sm:w-44 bg-zinc-800 rounded" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-4 w-12 bg-zinc-800 rounded" />
                                        <div className="h-4 w-8 bg-zinc-850 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
