'use client';

import React, { useState, useEffect } from 'react';
import type { Race } from '@/types/f1';
import { formatTimeInTimezone } from '@/lib/timezones';
import { formatDateDDMMYYYY, formatDateInTimezone, cn } from '@/lib/utils';
import { CountryFlag } from '@/components/f1/country-flag';
import { CountdownWidget } from '@/components/f1/countdown-widget';
import { Clock, Calendar, Zap, Flag } from 'lucide-react';

interface NextRaceCardProps {
  race: Race;
  className?: string;
}

export function NextRaceCard({ race, className }: NextRaceCardProps) {
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setUserTimeZone(tz);
      } catch {
        setUserTimeZone('UTC');
      }
      setIsClient(true);
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  const getSessionInfo = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;

    let formattedDate = formatDateDDMMYYYY(dateStr);
    let formattedTime = timeStr ? timeStr.replace('Z', ' UTC') : null;

    if (isClient && timeStr) {
      const cleanTime = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
      const rawDate = new Date(`${dateStr}T${cleanTime}`);
      if (!isNaN(rawDate.getTime())) {
        formattedDate = formatDateInTimezone(rawDate, userTimeZone);
        formattedTime = formatTimeInTimezone(rawDate, userTimeZone);
      }
    }

    return { formattedDate, formattedTime };
  };

  const mainRaceInfo = getSessionInfo(race.date, race.time);
  const qualyInfo = race.Qualifying ? getSessionInfo(race.Qualifying.date, race.Qualifying.time) : null;
  const sprintInfo = race.Sprint ? getSessionInfo(race.Sprint.date, race.Sprint.time) : null;

  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative',
        className
      )}
    >
      {/* Official F1 Dual Racing Stripes Header */}
      <div className="w-full flex flex-col">
        <div className="h-1.5 bg-[#e10600] w-full" />
        <div className="h-0.5 bg-[#e10600]/80 w-full mt-0.5" />
      </div>

      {/* Cockpit Sub-Header */}
      <div className="flex items-center justify-end gap-3 px-5 sm:px-7 py-2.5 border-b border-white/10 bg-zinc-900/30">
        <div className="flex items-center gap-2">
          <CountryFlag countryName={race.Circuit.Location.country} className="w-5 h-3.5 shadow-sm rounded-xs" />
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
            {race.Circuit.Location.country}
          </span>
        </div>
        {isClient && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-white/5">
            <Clock className="size-3 text-zinc-500" />
            <span>{userTimeZone.split('/')[1]?.replace(/_/g, ' ') ?? userTimeZone}</span>
          </span>
        )}
      </div>

      {/* Main Hero Header Stage */}
      <div className="p-4 sm:p-5 lg:p-6 relative overflow-hidden bg-zinc-950/60">
        {/* Ambient livery glow */}
        <div className="absolute top-0 inset-x-0 h-36 bg-[#e10600]/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <span>{race.raceName}</span>
                <CountryFlag countryName={race.Circuit.Location.country} preload className="w-7 h-5 rounded shadow" />
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
              <span className="font-bold text-white">{race.Circuit.circuitName}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <CountdownWidget race={race} size="sm" showCountry={false} />
          </div>
        </div>
      </div>

      {/* Monolithic 1px Session Timetable Matrix */}
      <div className="border-t border-l border-white/10 bg-zinc-950/80 grid grid-cols-2 md:grid-cols-4">
        {qualyInfo && (
          <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-3 sm:p-3.5 transition-colors flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400" />
                <span>Qualifying</span>
              </span>
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-zinc-300">{qualyInfo.formattedDate}</p>
              {qualyInfo.formattedTime && (
                <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                  {qualyInfo.formattedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {sprintInfo && (
          <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-3 sm:p-3.5 transition-colors flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="size-3.5 text-red-400" />
                <span>Sprint</span>
              </span>
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-zinc-300">{sprintInfo.formattedDate}</p>
              {sprintInfo.formattedTime && (
                <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                  {sprintInfo.formattedTime}
                </p>
              )}
            </div>
          </div>
        )}

        {mainRaceInfo && (
          <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-3 sm:p-3.5 transition-colors flex flex-col justify-start gap-1 sm:gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-400" />
                <span>Race Day</span>
              </span>
            </div>
            <div>
              <p className="font-mono font-black text-white text-lg sm:text-xl lg:text-2xl tracking-tight">
                {mainRaceInfo.formattedDate}
              </p>
            </div>
          </div>
        )}

        {mainRaceInfo?.formattedTime && (
          <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-3 sm:p-3.5 transition-colors flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="size-3.5 text-[#e10600]" />
                <span>Race Start</span>
              </span>
            </div>
            <div>
              <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                {mainRaceInfo.formattedTime}
              </p>
              <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                {isClient ? userTimeZone.split('/')[1]?.replace(/_/g, ' ') ?? userTimeZone : 'Local Time'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
