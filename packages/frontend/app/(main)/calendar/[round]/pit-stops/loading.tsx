export default function PitStopsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-36 bg-zinc-900 rounded" />
        <div className="h-10 w-72 bg-zinc-900 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-900/60 rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-8 w-20 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-96 rounded-xl border border-zinc-800 bg-zinc-900/30" />
    </div>
  );
}