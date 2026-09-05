import React from 'react';

export default function HeadToHeadLoading() {
  return (
    <div className="space-y-8 pb-16 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded-full" />
          <div className="h-10 w-72 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-zinc-800/60 rounded-md" />
        </div>
        <div className="h-9 w-48 bg-zinc-800 rounded-full" />
      </div>

      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2"
          >
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-7 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Control Bar Skeleton */}
      <div className="h-12 w-full bg-zinc-900/50 rounded-2xl border border-zinc-800" />

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-36 bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 items-center py-2">
              <div className="col-span-4 flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800" />
                <div className="h-3 w-16 bg-zinc-800 rounded" />
              </div>
              <div className="col-span-4 flex flex-col items-center gap-1.5">
                <div className="h-3 w-8 bg-zinc-800/60 rounded" />
                <div className="h-5 w-20 bg-zinc-800 rounded-full" />
              </div>
              <div className="col-span-4 flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-zinc-800" />
                <div className="h-3 w-16 bg-zinc-800 rounded" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-zinc-800/50">
              <div className="h-2 w-full bg-zinc-800 rounded-full" />
              <div className="h-2 w-full bg-zinc-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
