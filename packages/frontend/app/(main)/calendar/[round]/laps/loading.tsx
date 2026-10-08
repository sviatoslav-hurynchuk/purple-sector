export default function LapsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Dual F1 Racing Speed Stripes Skeleton ─────────────────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1 sm:h-1.5 w-full bg-red-600/30 rounded-full" />
        <div className="h-0.5 sm:h-1 w-3/4 bg-red-700/20 rounded-full" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-zinc-900 rounded" />
          <div className="h-10 w-80 sm:w-96 bg-zinc-900 rounded-xl" />
          <div className="h-4 w-64 bg-zinc-900/60 rounded" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-7 w-28 bg-zinc-900/80 rounded-lg border border-white/5" />
          <div className="h-7 w-24 bg-zinc-900/80 rounded-lg border border-white/5" />
        </div>
      </div>

      {/* 2-Cell KPI / Overview Instrument Cluster Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 divide-y md:divide-y-0 md:divide-x divide-white/10 grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 space-y-3">
          <div className="h-4 w-32 bg-zinc-900 rounded" />
          <div className="h-8 w-48 bg-zinc-900/80 rounded-lg" />
          <div className="h-3 w-64 bg-zinc-900/60 rounded" />
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          <div className="h-4 w-36 bg-zinc-900 rounded" />
          <div className="h-8 w-44 bg-zinc-900/80 rounded-lg" />
          <div className="h-3 w-56 bg-zinc-900/60 rounded" />
        </div>
      </div>

      {/* Main Content Grid Skeleton: 4 cols Leaderboard | 8 cols Chart & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Leaderboard Column Skeleton */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-zinc-950/90 p-4 sm:p-5 space-y-4 shadow-xl min-h-[520px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="h-4 w-28 bg-zinc-900 rounded" />
            <div className="h-4 w-20 bg-zinc-900 rounded" />
          </div>
          <div className="space-y-2 pt-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-zinc-800" />
                  <div className="size-5 rounded bg-zinc-800/80" />
                  <div className="h-3.5 w-20 bg-zinc-800 rounded" />
                </div>
                <div className="h-3.5 w-14 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart & Controls Column Skeleton */}
        <div className="lg:col-span-8 space-y-4">
          <div className="h-[540px] rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="h-4 w-24 bg-zinc-900 rounded" />
              <div className="h-6 w-48 bg-zinc-900/80 rounded-lg" />
            </div>
            <div className="flex-1 my-4 rounded-xl bg-zinc-900/30 border border-white/5" />
            <div className="h-4 w-full bg-zinc-900/40 rounded" />
          </div>
          <div className="h-28 rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-zinc-900 rounded" />
              <div className="h-4 w-20 bg-zinc-900 rounded" />
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full" />
            <div className="h-8 w-48 bg-zinc-900 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
