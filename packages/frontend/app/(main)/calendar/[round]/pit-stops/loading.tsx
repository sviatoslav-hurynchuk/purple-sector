export default function PitStopsLoading() {
  return (
    <div className="space-y-6 pb-16 animate-pulse">
      {/* ── Top Dual F1 Racing Speed Stripes (Poster Header Hook) ─────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
        <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-44 bg-zinc-900 rounded" />
        <div className="h-10 sm:h-12 w-80 bg-zinc-900 rounded-xl" />
        <div className="h-4 w-96 bg-zinc-900/60 rounded" />
      </div>

      {/* Monolithic KPI Cluster Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="h-10 border-b border-white/10 bg-zinc-900/30" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-white/10 bg-zinc-950/80">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 border-b border-r border-white/10 bg-zinc-900/20 p-5 space-y-3">
              <div className="h-3 w-28 bg-zinc-800/80 rounded" />
              <div className="h-8 w-24 bg-zinc-800 rounded" />
              <div className="h-3 w-40 bg-zinc-850 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="h-4 w-40 bg-zinc-900 rounded" />
        <div className="h-9 w-72 bg-zinc-900 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="h-96 rounded-3xl border border-white/10 bg-zinc-950/80" />
    </div>
  );
}