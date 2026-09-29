import React from 'react';

interface ConstructorsPageSkeletonProps {
  onlyGrid?: boolean;
}

export function ConstructorsPageSkeleton({ onlyGrid = false }: ConstructorsPageSkeletonProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-hidden="true">
      {!onlyGrid && (
        /* ── Cockpit Header Skeleton ──────────────────────────────────── */
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="h-10 sm:h-12 w-80 sm:w-[480px] bg-zinc-800 rounded" />
            <div className="h-4 w-64 sm:w-96 bg-zinc-800/60 rounded mt-2" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-44 bg-zinc-800/60 rounded-full border border-white/5" />
          </div>
        </div>
      )}

      {/* ── Constructors Cards Matrix Skeleton ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col min-h-[270px] sm:min-h-[295px]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {/* Livery Pill Placeholder */}
                <div className="w-1.5 h-8 sm:h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="size-10 sm:size-11 rounded-2xl bg-zinc-900 border border-white/10 p-2 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                  <div className="h-5 w-36 sm:w-44 bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-8 w-24 bg-zinc-900/60 border border-white/10 rounded-xl shrink-0" />
            </div>

            {/* Dual Drivers Split */}
            <div className="grid grid-cols-2 divide-x divide-white/10 flex-1 p-4 sm:p-5 bg-zinc-950">
              <div className="flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                  <div className="h-5 w-28 bg-zinc-800 rounded" />
                  <div className="h-6 w-12 bg-zinc-800/40 rounded mt-2" />
                </div>
                <div className="h-4 w-24 bg-zinc-800/60 rounded" />
              </div>
              <div className="flex flex-col justify-between pl-4 sm:pl-5">
                <div className="space-y-1.5">
                  <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                  <div className="h-5 w-28 bg-zinc-800 rounded" />
                  <div className="h-6 w-12 bg-zinc-800/40 rounded mt-2" />
                </div>
                <div className="h-4 w-24 bg-zinc-800/60 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
