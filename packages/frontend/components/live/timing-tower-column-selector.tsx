'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VisibleColumns {
  gap: boolean;
  interval: boolean;
  lastLap: boolean;
  s1: boolean;
  s2: boolean;
  s3: boolean;
  speedTrap: boolean;
  tyres: boolean;
}

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  gap: true,
  interval: true,
  lastLap: true,
  s1: true,
  s2: true,
  s3: true,
  speedTrap: false,
  tyres: true,
};

interface TimingTowerColumnSelectorProps {
  columns: VisibleColumns;
  onChange: (cols: VisibleColumns) => void;
  className?: string;
}

const COLUMN_DEFINITIONS: Array<{ key: keyof VisibleColumns; label: string; description: string }> = [
  { key: 'gap', label: 'Gap to Leader', description: 'Total gap behind P1' },
  { key: 'interval', label: 'Interval', description: 'Gap to car directly ahead' },
  { key: 'lastLap', label: 'Last Lap', description: 'Most recently completed lap time' },
  { key: 's1', label: 'Sector 1', description: 'First timing sector' },
  { key: 's2', label: 'Sector 2', description: 'Second timing sector' },
  { key: 's3', label: 'Sector 3', description: 'Third timing sector' },
  { key: 'speedTrap', label: 'Speed Trap', description: 'Top speed on straight (km/h)' },
  { key: 'tyres', label: 'Tyre & Age', description: 'Compound & laps on current set' },
];

export function TimingTowerColumnSelector({
  columns,
  onChange,
  className,
}: TimingTowerColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (key: keyof VisibleColumns) => {
    const next = { ...columns, [key]: !columns[key] };
    onChange(next);
    try {
      localStorage.setItem('ps_timing_columns', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-white/10 p-2 shadow-xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1.5 border-b border-white/5 mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Toggle Timing Columns</span>
              <button
                onClick={() => {
                  onChange(DEFAULT_VISIBLE_COLUMNS);
                  try {
                    localStorage.removeItem('ps_timing_columns');
                  } catch {}
                }}
                className="text-[10px] text-zinc-400 hover:text-white underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-0.5">
              {COLUMN_DEFINITIONS.map(({ key, label, description }) => {
                const isSelected = columns[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleColumn(key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex flex-col">
                      <span className={cn('font-medium', isSelected ? 'text-zinc-100' : 'text-zinc-400')}>
                        {label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{description}</span>
                    </div>

                    <div
                      className={cn(
                        'flex items-center justify-center h-4 w-4 rounded border transition-colors',
                        isSelected
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'border-zinc-700 group-hover:border-zinc-500'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
