export default function DriverProfileLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Navigation Skeleton ─────────────────────────────────────── */}
      <div className="h-4 w-28 bg-zinc-800/80 rounded" />

      {/* ── Main Two-Column Layout Skeleton ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Vertical Hero Cockpit Skeleton */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between h-full min-h-[500px] sm:min-h-[540px] lg:min-h-[570px]">
            <div className="h-[2px] w-full bg-zinc-800/60" />

            {/* Standing Driver Portrait Skeleton on the Right */}
            <div className="absolute right-4 bottom-0 w-[46%] h-[85%] flex items-end justify-center pointer-events-none">
              <div className="w-full h-full max-h-[460px] bg-zinc-800/20 rounded-2xl" />
            </div>

            {/* Left Content Column Skeleton */}
            <div className="p-5 sm:p-6 lg:p-7 relative z-10 flex flex-col justify-between h-full space-y-6 max-w-[62%] sm:max-w-[58%] lg:max-w-[60%]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-24 bg-zinc-800/80 rounded-xl" />
                  <div className="h-7 w-28 bg-zinc-800/60 rounded-xl" />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="h-4 w-16 bg-zinc-800/70 rounded" />
                  <div className="h-10 sm:h-12 w-44 sm:w-56 bg-zinc-800 rounded" />
                </div>

                <div className="h-9 w-20 bg-zinc-800/50 rounded-lg pt-1" />
              </div>

              {/* Bio Grid Skeleton (2x2 under name) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10 bg-zinc-950/60 rounded-2xl overflow-hidden shadow-xl mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-3 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
                    <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                    <div className="h-4 w-20 bg-zinc-700/80 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Separated Season & Career Stats Skeletons */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-between">
          {/* Card 1: Season Performance Skeleton */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-28 bg-zinc-800/70 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 flex-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 border-b border-r border-white/10 bg-zinc-900/20 space-y-3">
                  <div className="h-3 w-20 bg-zinc-800/80 rounded" />
                  <div className="h-8 w-16 bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Career Statistics Skeleton */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60 flex-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 border-b border-r border-white/10 bg-zinc-900/20 space-y-3">
                  <div className="h-3 w-20 bg-zinc-800/80 rounded" />
                  <div className="h-8 w-16 bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Trajectory Table Skeleton ────────────────────────── */}
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
