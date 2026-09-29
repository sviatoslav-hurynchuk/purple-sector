export default function DriverProfileLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Navigation Skeleton ─────────────────────────────────────── */}
      <div className="h-4 w-28 bg-zinc-800/80 rounded" />

      {/* ── Main Two-Column Layout Skeleton ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Vertical Hero Cockpit Skeleton */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between h-full min-h-[660px] sm:min-h-[720px] lg:min-h-[760px] xl:min-h-[780px]">
            <div className="h-[3px] w-full bg-zinc-800/60" />

            {/* Standing Driver Portrait Skeleton on the Right */}
            <div className="absolute right-4 bottom-0 w-[48%] h-[90%] flex items-end justify-center pointer-events-none">
              <div className="w-full h-full max-h-[580px] bg-zinc-800/20 rounded-2xl" />
            </div>

            {/* Left Content Column Skeleton */}
            <div className="p-6 sm:p-7 lg:p-8 relative z-10 flex flex-col justify-between h-full space-y-6 max-w-[60%] sm:max-w-[56%] lg:max-w-[56%]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-24 bg-zinc-800/80 rounded-xl" />
                  <div className="h-7 w-28 bg-zinc-800/60 rounded-xl" />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="h-4 w-16 bg-zinc-800/70 rounded" />
                  <div className="h-12 sm:h-14 w-48 sm:w-64 bg-zinc-800 rounded" />
                </div>

                <div className="h-12 w-24 bg-zinc-800/50 rounded-lg pt-1" />
              </div>

              {/* Spacious Season Telemetry & Bio Skeleton */}
              <div className="space-y-3.5 pt-2">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="px-4 py-2.5 border-b border-white/10 bg-zinc-900/80 flex items-center justify-between">
                    <div className="h-4 w-28 bg-zinc-800 rounded" />
                    <div className="h-4 w-10 bg-zinc-800/80 rounded" />
                  </div>

                  {/* 2-col KPI */}
                  <div className="grid grid-cols-2 divide-x divide-white/10 p-4 bg-zinc-950/40">
                    <div className="space-y-1 pr-3">
                      <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-14 bg-zinc-700 rounded" />
                    </div>
                    <div className="space-y-1 pl-3">
                      <div className="h-3 w-14 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-16 bg-zinc-700 rounded" />
                    </div>
                  </div>

                  {/* 3-col KPI */}
                  <div className="grid grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3 border-b border-r border-white/10 bg-zinc-900/20 space-y-1 text-center flex flex-col items-center">
                        <div className="h-2.5 w-10 bg-zinc-800/80 rounded" />
                        <div className="h-6 w-10 bg-zinc-700 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bio Meta Footer */}
                <div className="flex items-center justify-between px-1">
                  <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stacked Career Benchmarks & Trajectory Table Skeleton */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-between">
          {/* Card 1: All-Time Career Benchmarks Skeleton */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
                  <div className="h-3 w-20 bg-zinc-800/80 rounded" />
                  <div className="h-7 w-16 bg-zinc-700 rounded" />
                  <div className="h-2.5 w-24 bg-zinc-800/60 rounded" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 border-t border-l border-white/10 bg-zinc-900/20 p-3">
              <div className="h-3 w-20 bg-zinc-800/60 rounded" />
              <div className="h-3 w-20 bg-zinc-800/60 rounded mx-auto" />
              <div className="h-3 w-20 bg-zinc-800/60 rounded ml-auto" />
            </div>
          </div>

          {/* Card 2: Championship Trajectory Table Skeleton */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex-1 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
            </div>

            <div className="divide-y divide-white/5 p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
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
      </div>
    </div>
  );
}
