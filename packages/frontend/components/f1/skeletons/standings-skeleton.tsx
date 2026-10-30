export function StandingsSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 animate-pulse items-stretch">
            {/* Drivers Standings Skeleton */}
            <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between text-xs font-mono">
                    <div className="h-3.5 w-44 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
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
            </div>

            {/* Constructors Standings Skeleton */}
            <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between text-xs font-mono">
                    <div className="h-3.5 w-52 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
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
        </div>
    );
}
