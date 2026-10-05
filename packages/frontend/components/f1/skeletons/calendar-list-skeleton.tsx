import React from 'react';
import { TelemetryRibbonSkeleton } from '@/components/f1/telemetry-ribbon';

export function CalendarListSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse pb-16">
      {/* ── Dual Speed Lines Skeleton ── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
        <div className="h-1 w-3/4 bg-zinc-800/60 rounded-full" />
      </div>

      {/* ── Cockpit Header Skeleton ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="h-10 w-72 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-56 bg-zinc-800/60 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-16 bg-zinc-800 rounded-full" />
          ))}
        </div>
      </div>

      {/* ── Season Pulse Telemetry Ribbon Skeleton ── */}
      <TelemetryRibbonSkeleton />

      {/* ── Filter Toolbar Skeleton ── */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-28 bg-zinc-900 rounded-xl border border-white/5" />
        ))}
      </div>

      {/* ── Monolithic 1px Dual-Column Matrix Skeleton ── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-white/10 lg:divide-y-0 lg:divide-x">
          {/* Column 1 */}
          <div className="divide-y divide-white/10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-10 bg-zinc-800 rounded-md shrink-0" />
                  <div className="h-6 w-9 bg-zinc-800 rounded-xs shrink-0" />
                  <div className="space-y-1 w-[44px] sm:w-[48px] shrink-0">
                    <div className="h-2.5 w-8 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-800 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                    <div className="h-5 w-36 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-zinc-800/50 rounded shrink-0" />
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="divide-y divide-white/10 hidden lg:block">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-10 bg-zinc-800 rounded-md shrink-0" />
                  <div className="h-6 w-9 bg-zinc-800 rounded-xs shrink-0" />
                  <div className="space-y-1 w-[44px] sm:w-[48px] shrink-0">
                    <div className="h-2.5 w-8 bg-zinc-800 rounded" />
                    <div className="h-4 w-12 bg-zinc-800 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                    <div className="h-5 w-36 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-zinc-800/50 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
