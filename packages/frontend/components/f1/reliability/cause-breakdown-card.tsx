'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PieChart, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';
import type { ReliabilityCauseBreakdown } from '@/types/f1';

interface CauseBreakdownCardProps {
  causeBreakdown: ReliabilityCauseBreakdown;
  season: number;
}

const CATEGORY_COLORS: Record<string, { fill: string; text: string; bg: string; border: string }> = {
  mechanical: {
    fill: '#F59E0B', // Amber
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  incident: {
    fill: '#EF4444', // Red
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  retired: {
    fill: '#64748B', // Slate
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
  dsq: {
    fill: '#A855F7', // Purple
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  dns: {
    fill: '#71717A', // Zinc
    text: 'text-zinc-400',
    bg: 'bg-zinc-800',
    border: 'border-zinc-700',
  },
};

export function CauseBreakdownCard({ causeBreakdown, season }: CauseBreakdownCardProps) {
  const { categories, detailedCauses } = causeBreakdown;
  const totalFailures = categories.reduce((sum, c) => sum + c.count, 0);

  if (!categories || categories.length === 0 || totalFailures === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center text-zinc-400 font-mono text-sm">
        No failure or retirement causes recorded for season {season}.
      </div>
    );
  }

  // Calculate SVG Donut slices
  let cumulativePercent = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left 1/3: Category Summary & Donut ────────────────────────────── */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="size-4 text-emerald-400" />
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
              Attrition Taxonomy
            </h3>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Breakdown across {totalFailures} recorded non-finishes in {season}
          </p>
        </div>

        {/* SVG Donut */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative size-36 sm:size-40 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-zinc-900 fill-none"
                strokeWidth="14"
              />
              {categories.map((cat) => {
                const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += cat.percentage;
                const color = CATEGORY_COLORS[cat.category]?.fill || '#71717A';

                return (
                  <circle
                    key={cat.category}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="14"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:opacity-80"
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {totalFailures}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Outcomes
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          {categories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.retired;

            return (
              <div
                key={cat.category}
                className="flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: colors.fill }}
                  />
                  <span className="text-zinc-300 truncate">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-white">{cat.count}</span>
                  <span className="text-zinc-500 text-[11px] w-10 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right 2/3: Specific Causes List ──────────────────────────────── */}
      <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-sky-400" />
            <h3 className="text-sm font-black font-mono tracking-wider text-white uppercase">
              Specific Failure Causes & Triggers
            </h3>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Official FIA and team status classifications registered throughout the season
          </p>
        </div>

        {/* Causes Grid / Table */}
        <div className="mt-4 divide-y divide-white/5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {detailedCauses.map((item, idx) => {
            const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.retired;
            const pct = ((item.count / totalFailures) * 100).toFixed(1);

            return (
              <div
                key={`${item.cause}-${idx}`}
                className="py-2.5 flex items-center justify-between gap-3 text-xs font-mono hover:bg-white/[0.01] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-right font-mono text-zinc-500 text-[11px] shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="font-bold text-white truncate text-sm">
                    {item.cause}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0',
                      colors.bg,
                      colors.text,
                      colors.border
                    )}
                  >
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono font-bold text-white">
                    {item.count} {item.count === 1 ? 'incident' : 'incidents'}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 w-12 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Note for Modern Seasons */}
        <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500 flex items-center gap-2">
          <AlertCircle className="size-3.5 text-zinc-400 shrink-0" />
          <span>
            {season >= 2023
              ? 'Modern FIA classifications (2023+) consolidate non-finishes as "Retired". For granular components (Engine/Gearbox), explore seasons up to 2022.'
              : 'Historical seasons feature comprehensive telemetry status codes for power units, hydraulics, brakes, and chassis.'}
          </span>
        </div>
      </div>
    </div>
  );
}
