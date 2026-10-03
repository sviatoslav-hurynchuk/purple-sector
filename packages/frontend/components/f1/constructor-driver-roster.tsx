'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { CountryFlag } from '@/components/f1/country-flag';
import type { ConstructorDriverHistory } from '@/types/f1';
import { cn } from '@/lib/utils';

interface ConstructorDriverRosterProps {
  drivers: ConstructorDriverHistory[];
  teamPrimaryColor: string;
  className?: string;
}

export function ConstructorDriverRoster({
  drivers,
  teamPrimaryColor,
  className,
}: ConstructorDriverRosterProps) {
  const [search, setSearch] = useState('');

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase().trim();
    return drivers.filter(
      (d) =>
        (d.givenName?.toLowerCase() ?? '').includes(q) ||
        (d.familyName?.toLowerCase() ?? '').includes(q) ||
        (d.nationality?.toLowerCase() ?? '').includes(q) ||
        (d.code?.toLowerCase() ?? '').includes(q)
    );
  }, [drivers, search]);

  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl flex flex-col',
        className
      )}
    >
      {/* ── Monolithic Header ─────────────────────────────────────────── */}
      <div className="py-2.5 sm:py-3 px-4 sm:px-5 border-b border-white/10 bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-3.5 rounded-full shrink-0"
            style={{ backgroundColor: teamPrimaryColor }}
          />
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black font-sans uppercase tracking-wider text-white">
              Historical Driver Roster
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5">
              {drivers.length}
            </span>
          </div>
        </div>

        {/* Integrated Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver, code, nationality..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-xl border border-white/10 bg-zinc-900/90 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      {/* ── Monolithic 1px Grid Matrix of Drivers ─────────────────────── */}
      {filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 border-t border-l border-white/10 bg-zinc-950/60">
          {filteredDrivers.map((d) => (
            <Link
              key={d.driverId}
              href={`/drivers/${d.driverId}`}
              className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/50 p-3.5 transition-colors group flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <CountryFlag
                    countryName={d.nationality || 'International'}
                    className="w-4 h-3 rounded-xs shrink-0"
                  />
                  {d.code && (
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      {d.code}
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-zinc-400 truncate">
                  {d.givenName || ''}
                </p>
                <p className="text-sm font-black font-sans uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">
                  {d.familyName || d.driverId}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] font-mono">
                {d.permanentNumber ? (
                  <span className="text-zinc-500 font-bold">#{d.permanentNumber}</span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
                <ChevronRight className="size-3 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 px-4 text-center border-t border-white/10 bg-zinc-900/10">
          <p className="text-xs font-mono text-zinc-400">
            No drivers found matching &ldquo;<span className="text-white font-bold">{search}</span>&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
