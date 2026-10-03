export default function ConstructorProfileLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* ── Top Navigation Skeleton ─────────────────────────────────────── */}
      <div className="h-4 w-28 bg-zinc-800/80 rounded" />

      {/* ── Main Two-Column Layout Skeleton ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Team Identity Cockpit Skeleton */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative flex flex-col justify-between min-h-[660px] sm:min-h-[700px] lg:min-h-[740px]">
            <div className="h-[3px] w-full bg-zinc-800/60" />

            <div className="p-6 sm:p-7 relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                {/* Pills strip */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-zinc-800/80 rounded-lg" />
                  <div className="h-6 w-24 bg-zinc-800/60 rounded-lg" />
                  <div className="h-6 w-32 bg-zinc-800/40 rounded-lg" />
                </div>

                {/* Team emblem & nameplate */}
                <div className="flex items-start gap-4 pt-1">
                  <div className="size-16 sm:size-20 rounded-2xl bg-zinc-800/70 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                    <div className="h-8 sm:h-10 w-48 sm:w-60 bg-zinc-700 rounded" />
                  </div>
                </div>

                {/* Championship badge */}
                <div className="h-12 w-64 bg-zinc-800/50 rounded-xl" />
              </div>

              {/* In-Season Campaign Matrix Skeleton */}
              <div className="space-y-3 pt-2">
                <div className="h-4 w-44 bg-zinc-800/70 rounded pb-1 border-b border-white/5" />

                <div className="rounded-2xl border border-white/10 bg-zinc-950/80 overflow-hidden shadow-lg">
                  {/* Standing & Season Pts */}
                  <div className="grid grid-cols-2 divide-x divide-white/10 p-3.5 bg-zinc-900/40">
                    <div className="space-y-1 pr-2">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-14 bg-zinc-700 rounded" />
                    </div>
                    <div className="space-y-1 pl-3">
                      <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                      <div className="h-7 w-16 bg-zinc-700 rounded" />
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

                {/* Footer Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="h-3 w-36 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: All-Time Record, Drivers & Specs Skeleton */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
            {/* Career Benchmarks Header */}
            <div className="py-2.5 sm:py-3 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-6 w-28 bg-zinc-800/70 rounded-xl" />
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
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-white/10 bg-zinc-900/30 p-3">
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
              <div className="h-3 w-16 bg-zinc-800/60 rounded" />
            </div>

            {/* Compact 2-Cell Driver Lineup Skeleton */}
            <div className="border-t border-white/10">
              <div className="py-2.5 sm:py-3 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div className="h-5 w-36 bg-zinc-800 rounded" />
                <div className="h-6 w-24 bg-zinc-800/60 rounded-lg" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10 bg-zinc-950/60">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="border-b border-r border-white/10 bg-zinc-900/20 flex items-stretch overflow-hidden">
                    <div className="w-16 sm:w-20 bg-zinc-800/80 shrink-0 border-r border-white/10 min-h-[76px] sm:min-h-[82px]" />
                    <div className="py-2.5 sm:py-3 px-3 sm:px-4 flex-1 flex items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2.5 w-16 bg-zinc-800/80 rounded" />
                        <div className="h-4 w-28 bg-zinc-700 rounded" />
                        <div className="h-2.5 w-20 bg-zinc-800/60 rounded" />
                      </div>
                      <div className="h-7 w-9 bg-zinc-800/60 rounded-md shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Leadership 4-Cell Grid */}
            <div className="border-t border-white/10">
              <div className="py-2.5 sm:py-3 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/40">
                <div className="h-5 w-48 bg-zinc-800 rounded" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10 bg-zinc-950/60">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-r border-white/10 bg-zinc-900/20 flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-zinc-800 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2.5 w-20 bg-zinc-800/80 rounded" />
                      <div className="h-4 w-32 bg-zinc-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Historical Roster Skeleton ──────────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
        <div className="py-2.5 sm:py-3 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
          <div className="h-5 w-48 bg-zinc-800 rounded" />
          <div className="h-8 w-60 bg-zinc-800/70 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 border-t border-l border-white/10 bg-zinc-950/60">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-r border-white/10 bg-zinc-900/20 space-y-2">
              <div className="h-2.5 w-12 bg-zinc-800/80 rounded" />
              <div className="h-4 w-20 bg-zinc-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
