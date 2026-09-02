'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { LiveDriverState } from '@/types/f1';
import {
  TimingTowerColumnSelector,
  type VisibleColumns,
  DEFAULT_VISIBLE_COLUMNS,
} from './timing-tower-column-selector';
import { DriverRow } from './driver-row';
import { Search, Trophy, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimingTowerProps {
  drivers: LiveDriverState[];
  selectedDriverNumber?: number | null;
  onSelectDriver?: (driverNumber: number) => void;
  className?: string;
}

export function TimingTower({
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  className,
}: TimingTowerProps) {
  const [columns, setColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [search, setSearch] = useState('');

  // Load user column preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ps_timing_columns');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<VisibleColumns>;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setColumns({ ...DEFAULT_VISIBLE_COLUMNS, ...parsed });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.teamName && d.teamName.toLowerCase().includes(q)) ||
        String(d.driverNumber) === q
    );
  }, [drivers, search]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-red-500" />
          <h3 className="font-black text-sm text-zinc-100 uppercase tracking-tight">
            Timing Tower
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            ({filteredDrivers.length} / {drivers.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter driver..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg bg-zinc-900 border border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 w-28 sm:w-36 transition-all"
            />
          </div>

          <TimingTowerColumnSelector columns={columns} onChange={setColumns} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10 select-none">
            <tr>
              <th className="py-2.5 pl-3 pr-2 text-left w-12">Pos</th>
              <th className="py-2.5 px-2 text-left">Driver</th>
              {columns.tyres && <th className="py-2.5 px-2 text-center w-16">Tyre</th>}
              {columns.gap && <th className="py-2.5 px-2 text-right">Gap</th>}
              {columns.interval && <th className="py-2.5 px-2 text-right">Int</th>}
              {columns.lastLap && <th className="py-2.5 px-2 text-right">Last Lap</th>}
              {columns.s1 && <th className="py-2.5 px-2 text-right">S1</th>}
              {columns.s2 && <th className="py-2.5 px-2 text-right">S2</th>}
              {columns.s3 && <th className="py-2.5 px-2 text-right">S3</th>}
              {columns.speedTrap && <th className="py-2.5 px-3 text-right">Speed</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-500 text-xs font-mono">
                  No drivers matching &quot;{search}&quot;
                </td>
              </tr>
            ) : (
              filteredDrivers.map((driver) => (
                <DriverRow
                  key={driver.driverNumber}
                  driver={driver}
                  visibleColumns={columns}
                  isSelected={selectedDriverNumber === driver.driverNumber}
                  onSelect={onSelectDriver}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
