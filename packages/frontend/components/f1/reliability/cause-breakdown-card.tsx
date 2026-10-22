'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ReliabilityCauseBreakdown } from '@/types/f1';

interface CauseBreakdownCardProps {
  causeBreakdown: ReliabilityCauseBreakdown;
  season: number;
}

const CATEGORY_COLORS: Record<string, { fill: string; text: string; bg: string; border: string }> = {
  mechanical: {
    fill: '#F59E0B',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  incident: {
    fill: '#EF4444',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  retired: {
    fill: '#94A3B8',
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  dsq: {
    fill: '#A855F7',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  dns: {
    fill: '#71717A',
    text: 'text-zinc-400',
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
  },
};

export function CauseBreakdownCard({ causeBreakdown, season: _season }: CauseBreakdownCardProps) {
  const { categories, detailedCauses } = causeBreakdown;
  const totalFailures = categories.reduce((sum, c) => sum + c.count, 0);

  if (!categories || categories.length === 0 || totalFailures === 0) {
    return null;
  }

  // Adjust grid columns so fewer items expand naturally instead of leaving empty void
  const gridColsClass =
    detailedCauses.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : detailedCauses.length <= 4
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Proportional Segmented Telemetry Bar */}
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex border border-white/10">
            {categories.map((cat) => (
              <div
                key={cat.category}
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: CATEGORY_COLORS[cat.category]?.fill || '#71717A',
                }}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                title={`${cat.label}: ${cat.count} (${cat.percentage}%)`}
              />
            ))}
          </div>

          {/* Micro Legend Chips */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
            {categories.map((cat) => {
              const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.retired;
              return (
                <div key={cat.category} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-xs shrink-0"
                    style={{ backgroundColor: colors.fill }}
                  />
                  <span className="text-zinc-300">{cat.label}</span>
                  <span className="font-bold text-white">({cat.count})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Balanced Causes Grid */}
        <div className={cn('grid gap-2.5 pt-2 border-t border-white/5', gridColsClass)}>
          {detailedCauses.map((item, idx) => {
            const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.retired;
            const pct = ((item.count / totalFailures) * 100).toFixed(1);

            return (
              <div
                key={`${item.cause}-${idx}`}
                className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between text-xs font-mono hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-zinc-500 font-bold w-4 text-right shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white truncate text-xs sm:text-sm">
                      {item.cause}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-mono font-bold border',
                      colors.bg,
                      colors.text,
                      colors.border
                    )}
                  >
                    {item.count}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono w-10 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
