export function StandingsSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 animate-pulse items-stretch">
            {/* Drivers Standings Skeleton */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
                {/* Stripes */}
                <div className="w-full flex flex-col">
                    <div className="h-1.5 bg-[#e10600]/40 w-full" />
                    <div className="h-0.5 bg-[#e10600]/20 w-full mt-0.5" />
                </div>

                {/* Sub-Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/10 bg-zinc-900/30">
                    <div className="h-3.5 w-44 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-2 px-2 sm:px-2.5">
                            <div className="h-4 w-7 bg-zinc-800 rounded" />
                            <div className="h-4 flex-1 max-w-[140px] bg-zinc-800/80 rounded" />
                            <div className="h-4 w-20 bg-zinc-850 rounded hidden sm:block" />
                            <div className="h-4 w-10 bg-zinc-800 rounded" />
                            <div className="h-4 w-7 bg-zinc-850 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Constructors Standings Skeleton */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
                {/* Stripes */}
                <div className="w-full flex flex-col">
                    <div className="h-1.5 bg-amber-500/40 w-full" />
                    <div className="h-0.5 bg-amber-500/20 w-full mt-0.5" />
                </div>

                {/* Sub-Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/10 bg-zinc-900/30">
                    <div className="h-3.5 w-52 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-2 px-2 sm:px-2.5">
                            <div className="h-4 w-7 bg-zinc-800 rounded" />
                            <div className="h-4 flex-1 max-w-[160px] bg-zinc-800/80 rounded" />
                            <div className="h-4 w-10 bg-zinc-800 rounded" />
                            <div className="h-4 w-7 bg-zinc-850 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
