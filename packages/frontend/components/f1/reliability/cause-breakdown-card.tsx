'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ReliabilityCauseBreakdown } from '@/types/f1';

interface CauseBreakdownCardProps {
  causeBreakdown: ReliabilityCauseBreakdown;
  season?: number;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    fill: string;
    text: string;
    bg: string;
    border: string;
    shortLabel: string;
    gradient: string;
  }
> = {
  mechanical: {
    fill: '#D97706', // amber-600
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    shortLabel: 'MECHANICAL',
    gradient: 'from-amber-500/30 via-transparent to-black/60',
  },
  incident: {
    fill: '#E11D48', // rose-600
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    shortLabel: 'INCIDENT',
    gradient: 'from-rose-500/30 via-transparent to-black/60',
  },
  retired: {
    fill: '#64748B', // slate-500
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    shortLabel: 'RETIRED',
    gradient: 'from-slate-500/30 via-transparent to-black/60',
  },
  dsq: {
    fill: '#9333EA', // purple-600
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    shortLabel: 'DSQ',
    gradient: 'from-purple-500/30 via-transparent to-black/60',
  },
  dns: {
    fill: '#52525B', // zinc-600
    text: 'text-zinc-400',
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
    shortLabel: 'DNS',
    gradient: 'from-zinc-500/30 via-transparent to-black/60',
  },
};

export function CauseBreakdownCard({ causeBreakdown }: CauseBreakdownCardProps) {
  const { categories, detailedCauses } = causeBreakdown;

  // Filter out zero-count categories and sort descending by count
  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [categories]);

  const totalFailures = useMemo(() => {
    return sortedCategories.reduce((sum, c) => sum + c.count, 0);
  }, [sortedCategories]);

  if (!sortedCategories || sortedCategories.length === 0 || totalFailures === 0) {
    return null;
  }

  const primaryCat = sortedCategories[0];
  const isTied =
    sortedCategories.length > 1 && sortedCategories[0].count === sortedCategories[1].count;
  const dominantText =
    sortedCategories.length === 1
      ? `${totalFailures} TOTAL • 100% ${CATEGORY_CONFIG[primaryCat.category]?.shortLabel || primaryCat.label}`
      : isTied
        ? `${totalFailures} TOTAL • TIED ATTRITION CAUSES`
        : `${totalFailures} TOTAL • ${primaryCat.percentage.toFixed(0)}% ${CATEGORY_CONFIG[primaryCat.category]?.shortLabel || primaryCat.label} DOMINANT`;

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col select-none">
      {/* ── 1. Proportional Arena Split Zone (Apex Head-to-Head Benchmark) ── */}
      <div className="relative min-h-[125px] sm:min-h-[145px] lg:min-h-[160px] overflow-hidden select-none flex items-center justify-between">
        {/* Proportional Split Background Slices */}
        <div className="absolute inset-0 flex pointer-events-none select-none">
          {sortedCategories.map((cat) => {
            const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.retired;
            return (
              <div
                key={cat.category}
                className="h-full transition-all duration-700 relative border-r last:border-r-0 border-black/40"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: config.fill,
                }}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/50 pointer-events-none',
                    config.gradient
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Clean Architectural Center Typography (Watermark + Telemetry Badge) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-2 sm:px-4">
          <span className="text-xl sm:text-4xl lg:text-5xl font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] text-white/20 mix-blend-overlay whitespace-nowrap">
            FAILURE CAUSES
          </span>
          <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5 text-center">
            {dominantText}
          </span>
        </div>

        {/* Foreground Telemetry Values */}
        {sortedCategories.length === 2 ? (
          /* Duel Layout (Exact 1:1 match for 2 categories like Head-to-Head) */
          <div className="relative z-20 w-full flex items-center justify-between px-4 sm:px-8 pointer-events-none">
            {/* Left Category */}
            <div className="flex flex-col items-start drop-shadow-md">
              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none text-white">
                {sortedCategories[0].count}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 text-white/90 drop-shadow-xs">
                {CATEGORY_CONFIG[sortedCategories[0].category]?.shortLabel || sortedCategories[0].label} (
                {sortedCategories[0].percentage.toFixed(1)}%)
              </span>
            </div>

            {/* Right Category */}
            <div className="flex flex-col items-end drop-shadow-md text-right">
              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black leading-none text-white">
                {sortedCategories[1].count}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 text-white/90 drop-shadow-xs">
                {CATEGORY_CONFIG[sortedCategories[1].category]?.shortLabel || sortedCategories[1].label} (
                {sortedCategories[1].percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ) : (
          /* Multi-Segment Layout (Handles 1, 3, 4, 5 categories seamlessly) */
          <div className="relative z-20 w-full h-full flex items-center pointer-events-none">
            {sortedCategories.map((cat, idx) => {
              const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.retired;
              const isFirst = idx === 0;
              const isLast = idx === sortedCategories.length - 1;
              const isNarrow = cat.percentage < 15;
              const isUltraNarrow = cat.percentage < 8;

              return (
                <div
                  key={cat.category}
                  style={{ width: `${cat.percentage}%` }}
                  className={cn(
                    'flex flex-col h-full justify-center drop-shadow-md',
                    isFirst
                      ? 'items-start pl-4 sm:pl-8'
                      : isLast
                        ? 'items-end pr-4 sm:pr-8 text-right'
                        : 'items-center px-1 text-center'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono font-black leading-none text-white',
                      isUltraNarrow
                        ? 'text-lg sm:text-xl'
                        : isNarrow
                          ? 'text-xl sm:text-2xl'
                          : 'text-3xl sm:text-4xl lg:text-5xl'
                    )}
                  >
                    {cat.count}
                  </span>
                  {!isUltraNarrow && (
                    <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider mt-1 text-white/90 drop-shadow-xs truncate max-w-full">
                      {isNarrow ? `${cat.percentage.toFixed(0)}%` : `${config.shortLabel} (${cat.percentage.toFixed(1)}%)`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Monolithic 1px Shared Breakdown Ribbon (Zero Floating Clutter) ── */}
      <div
        className={cn(
          'grid -mt-px -ml-px border-t border-l border-white/10 bg-zinc-950 font-mono text-xs',
          sortedCategories.length === 1
            ? 'grid-cols-1'
            : sortedCategories.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : sortedCategories.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4'
        )}
      >
        {sortedCategories.map((cat, idx) => {
          const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.retired;

          // Filter out redundant subcauses that only repeat the generic status or category name with same count
          const distinctSubCauses = detailedCauses
            .filter((d) => d.category === cat.category)
            .filter((sc) => {
              const norm = sc.cause.toLowerCase().trim();
              const catLabelNorm = cat.label.toLowerCase().trim();
              const catNorm = cat.category.toLowerCase().trim();
              if (
                sc.count === cat.count &&
                (norm === 'retired' ||
                  norm === 'did not start' ||
                  norm === 'dns' ||
                  norm === catNorm ||
                  norm === catLabelNorm)
              ) {
                return false;
              }
              return true;
            });

          return (
            <div
              key={cat.category}
              className="p-4 sm:p-5 border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex flex-col justify-between gap-3 relative overflow-hidden group"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
                style={{ backgroundColor: config.fill }}
              />

              {/* Header: Rank + Category Label on Left, Percentage Badge on Right */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-mono font-black text-zinc-500">
                    #{idx + 1}
                  </span>
                  <span className="font-mono font-black text-zinc-200 uppercase tracking-wider text-xs truncate">
                    {cat.label}
                  </span>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono font-black border uppercase tracking-wider shrink-0',
                    config.bg,
                    config.text,
                    config.border
                  )}
                >
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>

              {/* Big Metrics: Count + Context Ratio (No Tautological Wording) */}
              <div className="flex items-baseline gap-2 pt-1">
                <span className="font-mono text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {cat.count}
                </span>
                <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider font-semibold">
                  / {totalFailures} {totalFailures === 1 ? 'incident' : 'incidents'}
                </span>
              </div>

              {/* Detailed Sub-causes Pills (rendered only when meaningful distinct triggers exist) */}
              {distinctSubCauses.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
                    Triggers:
                  </span>
                  {distinctSubCauses.map((sc, sIdx) => {
                    const pct = totalFailures > 0 ? ((sc.count / totalFailures) * 100).toFixed(1) : '0.0';
                    return (
                      <span
                        key={`${sc.cause}-${sIdx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/5 text-[11px] font-mono text-zinc-400"
                      >
                        <span className="truncate max-w-[140px]">{sc.cause}:</span>
                        <span className="font-bold text-zinc-200">{sc.count}</span>
                        <span className="text-zinc-500 text-[10px]">({pct}%)</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
