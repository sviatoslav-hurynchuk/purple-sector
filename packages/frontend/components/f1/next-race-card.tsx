'use client';

import React, { useState, useEffect } from 'react';
import type { Race } from '@/types/f1';
import { formatTimeInTimezone } from '@/lib/timezones';
import { formatDateDDMMYYYY, formatDateInTimezone, cn } from '@/lib/utils';
import { CountryFlag } from '@/components/f1/country-flag';
import { CountdownWidget } from '@/components/f1/countdown-widget';
import { useCurrentNowMs } from '@/hooks/useCountdown';
import { Clock, Calendar, Zap, Flag, AlertTriangle } from 'lucide-react';
import { SessionRecapModal } from '@/components/live/session-recap-modal';

interface NextRaceCardProps {
  race: Race;
  isEmbedded?: boolean;
  className?: string;
}

export function NextRaceCard({ race, isEmbedded = false, className }: NextRaceCardProps) {
  const currentNowMs = useCurrentNowMs();
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

  const isSessionEnded = (dateStr?: string, timeStr?: string, durationMinutes = 75): boolean => {
    if (!dateStr || currentNowMs === null) return false;
    const cleanTime = timeStr ? (timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`) : '12:00:00Z';
    const start = new Date(`${dateStr}T${cleanTime}`);
    if (isNaN(start.getTime())) return false;
    return currentNowMs > start.getTime() + durationMinutes * 60 * 1000;
  };

  const isQualyEnded = isSessionEnded(race.Qualifying?.date, race.Qualifying?.time, 75);
  const isSprintEnded = isSessionEnded(race.Sprint?.date, race.Sprint?.time, 60);
  const isRaceEnded = isSessionEnded(race.date, race.time, 150);

  const qualyOverride = !isQualyEnded ? race.scheduleOverrides?.find((o) => o.sessionCode === 'QUALY' && !o.isCompleted) : undefined;
  const sprintOverride = !isSprintEnded ? race.scheduleOverrides?.find((o) => o.sessionCode === 'SPRINT' && !o.isCompleted) : undefined;
  const raceOverride = !isRaceEnded ? race.scheduleOverrides?.find((o) => o.sessionCode === 'RACE' && !o.isCompleted) : undefined;

  const activeOverrides = (race.scheduleOverrides ?? []).filter((o) => {
    if (o.isCompleted) return false;
    if (o.sessionCode === 'P1') return !isSessionEnded(race.FirstPractice?.date, race.FirstPractice?.time, 60);
    if (o.sessionCode === 'P2') return !isSessionEnded(race.SecondPractice?.date, race.SecondPractice?.time, 60);
    if (o.sessionCode === 'P3') return !isSessionEnded(race.ThirdPractice?.date, race.ThirdPractice?.time, 60);
    if (o.sessionCode === 'SQ') {
      const sq = race.SprintQualifying || race.SprintShootout;
      return !isSessionEnded(sq?.date, sq?.time, 45);
    }
    if (o.sessionCode === 'SPRINT') return !isSprintEnded;
    if (o.sessionCode === 'QUALY') return !isQualyEnded;
    if (o.sessionCode === 'RACE') return !isRaceEnded;
    return false;
  });

  return (
    <div
      className={cn(
        isEmbedded
          ? 'relative'
          : 'rounded-3xl border border-white/10 bg-zinc-950 overflow-hidden shadow-2xl relative',
        className
      )}
    >

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
            <p className="text-xs sm:text-sm font-mono text-zinc-300 flex flex-wrap items-center gap-2">
              <span className="font-bold text-white">{race.Circuit.circuitName}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </span>
              {isClient && (
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono bg-zinc-900/80 px-2 py-0.5 rounded border border-white/5">
                  <Clock className="size-3 text-zinc-500" />
                  <span>{userTimeZone.split('/')[1]?.replace(/_/g, ' ') ?? userTimeZone}</span>
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <CountdownWidget race={race} size="sm" showCountry={false} />
            <SessionRecapModal nextRace={race} />
          </div>
        </div>
      </div>

      {/* ── Compact FIA Schedule Notice (Only if active schedule delay or revision) ── */}
      {activeOverrides.length > 0 && (
        <div className="border-t border-white/10 bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-zinc-950/60 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-amber-300 min-w-0">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
              <AlertTriangle className="size-3 text-amber-400" />
              FIA NOTICE
            </span>
            <span className="text-zinc-200 text-xs truncate">
              {activeOverrides[0].sessionName} schedule revised: {activeOverrides[0].reason || 'Start time adjusted by Race Control.'}
            </span>
          </div>
          {activeOverrides[0].deltaMinutes !== 0 && (
            <span className="text-[11px] font-bold text-amber-400 shrink-0 hidden sm:inline">
              {activeOverrides[0].deltaMinutes > 0 ? `+${activeOverrides[0].deltaMinutes} min` : `${activeOverrides[0].deltaMinutes} min`}
            </span>
          )}
        </div>
      )}

      {/* Monolithic 1px Session Timetable Matrix */}
      <div
        className={cn(
          'border-t border-l border-white/10 bg-zinc-950/80 grid grid-cols-2',
          sprintInfo ? 'md:grid-cols-4' : 'md:grid-cols-3'
        )}
      >
        {qualyInfo && (
          <div className="border-b border-r border-white/10 bg-zinc-900/20 hover:bg-zinc-900/40 p-3 sm:p-3.5 transition-colors flex flex-col justify-between gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400" />
                <span>Qualifying</span>
              </span>
              {qualyOverride && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider',
                    qualyOverride.status === 'DELAYED'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  )}
                  title={qualyOverride.reason}
                >
                  <AlertTriangle className="size-2.5" />
                  <span>
                    {qualyOverride.status === 'DELAYED'
                      ? `DELAYED ${qualyOverride.deltaMinutes > 0 ? `+${qualyOverride.deltaMinutes}M` : ''}`
                      : 'REVISED'}
                  </span>
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-zinc-300">{qualyInfo.formattedDate}</p>
              {qualyInfo.formattedTime && (
                <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                  {qualyInfo.formattedTime}
                </p>
              )}
              {qualyOverride?.reason && (
                <p className="text-[10px] font-mono text-amber-300/90 mt-1 truncate" title={qualyOverride.reason}>
                  {qualyOverride.reason}
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
              {sprintOverride && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider',
                    sprintOverride.status === 'DELAYED'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  )}
                  title={sprintOverride.reason}
                >
                  <AlertTriangle className="size-2.5" />
                  <span>
                    {sprintOverride.status === 'DELAYED'
                      ? `DELAYED ${sprintOverride.deltaMinutes > 0 ? `+${sprintOverride.deltaMinutes}M` : ''}`
                      : 'REVISED'}
                  </span>
                </span>
              )}
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-zinc-300">{sprintInfo.formattedDate}</p>
              {sprintInfo.formattedTime && (
                <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                  {sprintInfo.formattedTime}
                </p>
              )}
              {sprintOverride?.reason && (
                <p className="text-[10px] font-mono text-amber-300/90 mt-1 truncate" title={sprintOverride.reason}>
                  {sprintOverride.reason}
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
              {raceOverride && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider',
                    raceOverride.status === 'DELAYED'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  )}
                  title={raceOverride.reason}
                >
                  <AlertTriangle className="size-2.5" />
                  <span>
                    {raceOverride.status === 'DELAYED'
                      ? `DELAYED ${raceOverride.deltaMinutes > 0 ? `+${raceOverride.deltaMinutes}M` : ''}`
                      : 'REVISED'}
                  </span>
                </span>
              )}
            </div>
            <div>
              <p className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                {mainRaceInfo.formattedTime}
              </p>
              <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                {isClient ? userTimeZone.split('/')[1]?.replace(/_/g, ' ') ?? userTimeZone : 'Local Time'}
              </p>
              {raceOverride?.reason && (
                <p className="text-[10px] font-mono text-amber-300/90 mt-1 truncate" title={raceOverride.reason}>
                  {raceOverride.reason}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
