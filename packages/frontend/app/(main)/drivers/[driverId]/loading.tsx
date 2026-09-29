export default function DriverProfileLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Navigation Skeleton ─────────────────────────────────────── */}
      <div className="h-4 w-28 bg-zinc-800/80 rounded" />

      {/* ── Main Two-Column Layout Skeleton ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Hero Cockpit Skeleton */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between min-h-[660px] sm:min-h-[700px] lg:min-h-[740px]">
            <div className="h-[3px] w-full bg-zinc-800/60" />

            {/* Standing Driver Portrait Skeleton on the Right */}
            <div className="absolute right-4 bottom-0 w-[48%] h-[90%] flex items-end justify-center pointer-events-none">
              <div className="w-full h-full max-h-[580px] bg-zinc-800/20 rounded-2xl" />
            </div>

            {/* Left Content Column Skeleton */}
            <div className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full space-y-6 max-w-[55%] sm:max-w-[52%] lg:max-w-[54%]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-zinc-800/80 rounded-lg" />
                  <div className="h-6 w-24 bg-zinc-800/60 rounded-lg" />
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-16 bg-zinc-800/70 rounded" />
                  <div className="h-10 sm:h-12 w-44 sm:w-56 bg-zinc-800 rounded" />
                </div>

                <div className="h-10 w-20 bg-zinc-800/50 rounded-lg pt-1" />
              </div>

              {/* Integrated Campaign Telemetry & Bio Skeleton */}
              <div className="space-y-3 pt-2">
                <div className="h-4 w-36 bg-zinc-800/70 rounded pb-1 border-b border-white/5" />

                <div className="rounded-2xl border border-white/10 bg-zinc-950/80 overflow-hidden shadow-lg">
                  {/* 2-col KPI: Standing & Season Pts */}
                  <div className="grid grid-cols-2 divide-x divide-white/10 p-3 bg-zinc-900/40">
                    <div className="space-y-1 pr-2">
                      <div className="h-2.5 w-14 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-12 bg-zinc-700 rounded" />
                    </div>
                    <div className="space-y-1 pl-3">
                      <div className="h-2.5 w-14 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-14 bg-zinc-700 rounded" />
                    </div>
                  </div>

                  {/* 4-col Campaign Execution Grid */}
                  <div className="grid grid-cols-2 border-t border-white/10 divide-x divide-white/10 bg-zinc-900/20">
                    <div className="p-3 space-y-1">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-6 w-10 bg-zinc-700 rounded" />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-6 w-10 bg-zinc-700 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-t border-white/10 divide-x divide-white/10 bg-zinc-900/10">
                    <div className="p-3 space-y-1">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-6 w-10 bg-zinc-700 rounded" />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-6 w-10 bg-zinc-700 rounded" />
                    </div>
                  </div>
                </div>

                {/* Bio Meta Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-14 bg-zinc-800/60 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Single Unified Monolithic Career Panel Skeleton */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            {/* Section 1: Career Benchmarks Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
            </div>

            {/* 6-Grid Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-white/10 bg-zinc-950/60">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
                  <div className="h-3 w-20 bg-zinc-800/80 rounded" />
                  <div className="h-7 w-16 bg-zinc-700 rounded" />
                  <div className="h-2.5 w-24 bg-zinc-800/60 rounded" />
                </div>
              ))}
            </div>

            {/* 4-col Secondary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/10 bg-zinc-900/20 p-3">
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
            </div>

            {/* Section 2: Championship Trajectory */}
            <div className="border-t border-white/10">
              <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="h-5 w-48 bg-zinc-800 rounded" />
                <div className="h-6 w-24 bg-zinc-800/70 rounded-xl" />
              </div>

              <div className="divide-y divide-white/5 p-4 space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="pt-2 flex items-center justify-between">
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
    </div>
  );
}
