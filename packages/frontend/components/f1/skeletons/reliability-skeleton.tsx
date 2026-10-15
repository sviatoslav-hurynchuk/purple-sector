import React from 'react';

export function ReliabilitySkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse pb-20">
      {/* Stripes Skeleton */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
        <div className="h-1 w-3/4 bg-zinc-850 rounded-full" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 w-72 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-52 bg-zinc-850 rounded" />
        </div>
        <div className="h-10 w-36 bg-zinc-800 rounded-xl" />
      </div>

      {/* KPI Ribbon Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-5 space-y-2">
            <div className="h-3.5 w-24 bg-zinc-800 rounded" />
            <div className="h-8 w-20 bg-zinc-700/80 rounded" />
            <div className="h-3 w-32 bg-zinc-850 rounded" />
          </div>
        ))}
      </div>

      {/* Matrix Table Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden h-[340px] p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="h-5 w-48 bg-zinc-800 rounded" />
          <div className="h-6 w-32 bg-zinc-850 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-zinc-900/60 rounded flex gap-2" />
          ))}
        </div>
        <div className="h-4 w-60 bg-zinc-900 rounded" />
      </div>

      {/* Constructor Standings Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex justify-between">
          <div className="h-5 w-52 bg-zinc-800 rounded" />
          <div className="h-4 w-24 bg-zinc-850 rounded" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-6 bg-zinc-800 rounded" />
                <div className="h-5 w-36 bg-zinc-800 rounded" />
              </div>
              <div className="h-5 w-48 bg-zinc-850 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
