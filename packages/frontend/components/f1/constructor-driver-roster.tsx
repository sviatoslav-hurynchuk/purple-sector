'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { CountryFlag } from '@/components/f1/country-flag';
import type { ConstructorDriverHistory } from '@/types/f1';

interface ConstructorDriverRosterProps {
  drivers: ConstructorDriverHistory[];
  teamPrimaryColor: string;
}

export function ConstructorDriverRoster({ drivers, teamPrimaryColor }: ConstructorDriverRosterProps) {
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
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-zinc-400" />
            Historical Driver Roster ({drivers.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All drivers who have raced for this constructor in Formula 1 history.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drivers or nationality..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-white/10 bg-zinc-900/80 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Drivers Roster Grid */}
      {filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredDrivers.map((d) => (
            <Link
              key={d.driverId}
              href={`/drivers/${d.driverId}`}
              className="p-3 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <CountryFlag countryName={d.nationality || 'International'} />
                  {d.code && (
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {d.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate">{d.givenName || ''}</p>
                <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                  {d.familyName || d.driverId}
                </p>
              </div>

              {d.permanentNumber && (
                <p className="text-xs font-mono font-bold text-zinc-500 mt-2">
                  #{d.permanentNumber}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground bg-zinc-900/30 rounded-xl border border-dashed border-white/10">
          No drivers matching &ldquo;{search}&rdquo; found.
        </div>
      )}
    </div>
  );
}
