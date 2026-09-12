export function NextRaceSkeleton() {
    return (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl animate-pulse">
            {/* Official F1 Dual Racing Stripes Header */}
            <div className="w-full flex flex-col">
                <div className="h-1.5 bg-[#e10600]/40 w-full" />
                <div className="h-0.5 bg-[#e10600]/20 w-full mt-0.5" />
            </div>

            {/* Cockpit Sub-Header Skeleton */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-2.5 border-b border-white/10 bg-zinc-900/30">
                <div className="h-3 w-40 bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-800 rounded" />
            </div>

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
        </div>
    );
}
