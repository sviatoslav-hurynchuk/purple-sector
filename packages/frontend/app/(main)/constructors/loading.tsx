export default function ConstructorsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-zinc-850 animate-pulse rounded" />
          <div className="h-4 w-80 bg-zinc-850/60 animate-pulse rounded" />
        </div>
        <div className="h-10 w-36 bg-zinc-850 animate-pulse rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-zinc-900/60 overflow-hidden h-[300px] flex flex-col justify-between p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-zinc-800 rounded" />
                <div className="h-7 w-48 bg-zinc-800 rounded" />
              </div>
              <div className="h-12 w-28 bg-zinc-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="h-28 bg-zinc-800/50 rounded-xl" />
              <div className="h-28 bg-zinc-800/50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
