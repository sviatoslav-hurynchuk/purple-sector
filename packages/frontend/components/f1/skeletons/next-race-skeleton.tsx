export function NextRaceSkeleton() {
    return (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl animate-pulse">
            {/* Main Stage Skeleton */}
            <div className="p-4 sm:p-5 lg:p-6 space-y-2">
                <div className="h-8 sm:h-10 w-72 sm:w-96 bg-zinc-800/80 rounded-lg" />
                <div className="h-4 w-60 sm:w-80 bg-zinc-850 rounded" />
            </div>

            {/* Monolithic 1px Grid Timetable Skeleton */}
            <div className="border-t border-l border-white/10 bg-zinc-950/80 grid grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border-b border-r border-white/10 bg-zinc-900/20 p-3 sm:p-3.5 space-y-1.5">
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                        <div className="h-4 w-28 bg-zinc-850 rounded" />
                        <div className="h-5 w-24 bg-zinc-800 rounded mt-1" />
                    </div>
                ))}
            </div>

            {/* Circuit & Telemetry Stage Skeleton */}
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
                    <div className="grid grid-cols-2 divide-x divide-white/10">
                        <div className="p-4 space-y-2">
                            <div className="h-3 w-20 bg-zinc-800 rounded" />
                            <div className="h-6 w-16 bg-zinc-800 rounded" />
                            <div className="h-3 w-24 bg-zinc-850 rounded" />
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="h-3 w-20 bg-zinc-800 rounded" />
                            <div className="h-6 w-16 bg-zinc-800 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
