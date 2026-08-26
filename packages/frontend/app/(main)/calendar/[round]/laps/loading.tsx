export default function LapsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-zinc-900 rounded" />
        <div className="h-10 w-72 bg-zinc-900 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-900/60 rounded" />
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leaderboard Column Skeleton */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
          <div className="h-5 w-32 bg-zinc-800 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-zinc-800/50" />
            ))}
          </div>
        </div>

        {/* Chart & Controls Column Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-[460px] rounded-xl border border-zinc-800 bg-zinc-900/30" />
          <div className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/50" />
        </div>
      </div>
    </div>
  );
}
