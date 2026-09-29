export default function DriverProfileLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Navigation Bar Skeleton ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-28 bg-zinc-800/80 rounded" />
        <div className="h-4 w-36 bg-zinc-800/60 rounded" />
      </div>

      {/* ── Section 1: Monolithic Hero Cockpit Shell Skeleton ───────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]">
        {/* Top accent line */}
        <div className="h-[2px] w-full bg-zinc-800/60" />

        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
          {/* Left Column */}
          <div className="lg:col-span-7 p-5 sm:p-7 lg:p-9 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-28 bg-zinc-800/80 rounded-xl" />
                <div className="h-7 w-32 bg-zinc-800/60 rounded-xl" />
              </div>

              {/* Nameplate */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-24 bg-zinc-800/70 rounded" />
                <div className="h-12 sm:h-16 w-64 sm:w-80 bg-zinc-800 rounded" />
              </div>

              {/* Secondary badges */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-8 w-14 bg-zinc-800/50 rounded" />
                <div className="h-7 w-20 bg-zinc-800/70 rounded-xl" />
              </div>
            </div>

            {/* Seamless 1px Bio Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 rounded-2xl overflow-hidden mt-6">
              <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
                <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                <div className="h-4 w-24 bg-zinc-700 rounded" />
              </div>
              <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
                <div className="h-3 w-20 bg-zinc-800/80 rounded" />
                <div className="h-4 w-28 bg-zinc-700 rounded" />
              </div>
              <div className="p-4 border-b border-r border-white/10 bg-zinc-900/20 space-y-2 col-span-2 sm:col-span-1">
                <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                <div className="h-4 w-20 bg-zinc-700 rounded" />
              </div>
            </div>
          </div>

          {/* Right Column: Driver Cutout Skeleton */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-white/10 bg-zinc-900/20 flex flex-col justify-end">
            <div className="h-12 border-t border-white/10 bg-zinc-950/80 px-5 flex items-center justify-between">
              <div className="h-4 w-32 bg-zinc-800/80 rounded" />
              <div className="h-4 w-16 bg-zinc-800/80 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Monolithic Telemetry Matrix Skeleton ──────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-56 sm:w-72 bg-zinc-800 rounded" />
            <div className="h-3 w-40 sm:w-60 bg-zinc-800/60 rounded" />
          </div>
          <div className="h-7 w-32 bg-zinc-800/70 rounded-xl" />
        </div>

        {/* Subheader */}
        <div className="px-5 py-2.5 bg-zinc-900/60 border-b border-white/10 flex items-center justify-between">
          <div className="h-3 w-44 bg-zinc-800/80 rounded" />
          <div className="h-3 w-28 bg-zinc-800/60 rounded" />
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-l border-white/10 bg-zinc-950/60">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="p-4 border-b border-r border-white/10 bg-zinc-900/20 space-y-3"
            >
              <div className="h-3 w-16 bg-zinc-800/80 rounded" />
              <div className="h-6 w-12 bg-zinc-700 rounded" />
              <div className="h-2.5 w-20 bg-zinc-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Monolithic Trajectory Skeleton ────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="h-5 w-48 bg-zinc-800 rounded" />
          <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
        </div>

        <div className="divide-y divide-white/5 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="pt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-12 bg-zinc-800 rounded" />
                <div className="h-4 w-32 bg-zinc-800/80 rounded" />
              </div>
              <div className="h-5 w-20 bg-zinc-800/60 rounded" />
              <div className="h-4 w-14 bg-zinc-800/80 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
