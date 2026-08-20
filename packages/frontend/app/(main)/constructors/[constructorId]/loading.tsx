export default function ConstructorProfileLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-32 bg-zinc-850 rounded" />

      {/* Hero Card skeleton */}
      <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/60 shadow-xl">
        <div className="p-8 space-y-4 border-b border-white/5">
          <div className="h-4 w-36 bg-zinc-800 rounded" />
          <div className="h-12 w-80 bg-zinc-800 rounded" />
          <div className="h-4 w-48 bg-zinc-800/60 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 bg-zinc-900/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 space-y-2 text-center">
              <div className="h-3 w-20 bg-zinc-800 mx-auto rounded" />
              <div className="h-8 w-16 bg-zinc-800 mx-auto rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Leadership specs skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-60 bg-zinc-850 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900/60 rounded-xl border border-white/5" />
          ))}
        </div>
      </div>

      {/* Driver Lineup skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-zinc-850 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-56 bg-zinc-900/60 rounded-2xl border border-white/5" />
          <div className="h-56 bg-zinc-900/60 rounded-2xl border border-white/5" />
        </div>
      </div>
    </div>
  );
}
