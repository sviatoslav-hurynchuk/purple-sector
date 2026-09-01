'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { RaceEvent, RaceEventType } from '@/types/f1';
import {
  ShieldAlert,
  Flag,
  Zap,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Filter,
  ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RaceControlFeedProps {
  events: RaceEvent[];
  className?: string;
  maxHeight?: string;
}

function getEventBadge(event: RaceEvent) {
  switch (event.type) {
    case 'safety_car':
      return {
        label: 'SAFETY CAR',
        icon: ShieldAlert,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotClass: 'bg-amber-400',
      };
    case 'vsc':
      return {
        label: 'VSC',
        icon: ShieldAlert,
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case 'red_flag':
      return {
        label: 'RED FLAG',
        icon: Flag,
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
        dotClass: 'bg-red-500',
      };
    case 'yellow_flag':
      return {
        label: 'YELLOW FLAG',
        icon: Flag,
        badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
        dotClass: 'bg-yellow-400',
      };
    case 'drs_enabled':
      return {
        label: 'DRS ENABLED',
        icon: Zap,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    case 'drs_disabled':
      return {
        label: 'DRS DISABLED',
        icon: Zap,
        badgeClass: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
        dotClass: 'bg-zinc-400',
      };
    case 'chequered_flag':
      return {
        label: 'CHEQUERED FLAG',
        icon: CheckCircle2,
        badgeClass: 'bg-white/10 text-white border-white/20',
        dotClass: 'bg-white',
      };
    case 'penalty':
    case 'warning':
      return {
        label: event.type.toUpperCase(),
        icon: AlertTriangle,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        dotClass: 'bg-orange-400',
      };
    default:
      return {
        label: 'NOTICE',
        icon: Radio,
        badgeClass: 'bg-zinc-800 text-zinc-300 border-white/10',
        dotClass: 'bg-zinc-400',
      };
  }
}

function formatEventTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return dateStr;
  }
}

export function RaceControlFeed({
  events,
  className,
  maxHeight = 'max-h-[380px]',
}: RaceControlFeedProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');

  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(() => {
    let list = [...events];

    if (filterType === 'safety_car') {
      list = list.filter((e) => e.type === 'safety_car' || e.type === 'vsc');
    } else if (filterType === 'flags') {
      list = list.filter((e) => e.type === 'red_flag' || e.type === 'yellow_flag' || e.type === 'chequered_flag');
    } else if (filterType === 'drs') {
      list = list.filter((e) => e.type === 'drs_enabled' || e.type === 'drs_disabled');
    } else if (filterType === 'penalties') {
      list = list.filter((e) => e.type === 'penalty' || e.type === 'warning');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          (e.driverNumber && String(e.driverNumber) === q) ||
          e.type.toLowerCase().includes(q)
      );
    }

    if (order === 'newest') {
      list.reverse();
    }

    return list;
  }, [events, filterType, searchQuery, order]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <h3 className="font-bold text-sm text-zinc-100 tracking-tight">Race Control Feed</h3>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
            {events.length}
          </span>
        </div>

        {/* Filters and Order Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-zinc-900 border border-white/5 p-0.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                filterType === 'all' ? 'bg-white/10 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('safety_car')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                filterType === 'safety_car' ? 'bg-white/10 text-amber-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              SC/VSC
            </button>
            <button
              onClick={() => setFilterType('flags')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                filterType === 'flags' ? 'bg-white/10 text-yellow-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Flags
            </button>
            <button
              onClick={() => setFilterType('drs')}
              className={cn(
                'px-2 py-0.5 rounded font-medium transition-colors',
                filterType === 'drs' ? 'bg-white/10 text-emerald-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              DRS
            </button>
          </div>

          <button
            onClick={() => setOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            title={order === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
            className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-mono"
          >
            {order === 'newest' ? '↓ New' : '↑ Old'}
          </button>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className={cn('overflow-y-auto p-2 space-y-1.5 divide-y divide-white/5 scroll-smooth', maxHeight)}
      >
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
            <Radio className="h-6 w-6 text-zinc-600 opacity-40" />
            <span>No race control events recorded yet.</span>
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const badge = getEventBadge(event);
            const Icon = badge.icon;

            return (
              <div
                key={`${event.date ?? ''}-${idx}`}
                className="pt-1.5 first:pt-0 flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
              >
                {/* Time & Lap */}
                <div className="flex flex-col items-start shrink-0 w-16 text-[11px] font-mono text-zinc-400">
                  <span className="text-zinc-300 font-semibold">{formatEventTime(event.date)}</span>
                  {typeof event.lap === 'number' && (
                    <span className="text-[10px] text-zinc-500">Lap {event.lap}</span>
                  )}
                </div>

                {/* Badge */}
                <div className="shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider',
                      badge.badgeClass
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-200 font-medium leading-relaxed break-words">
                    {event.message}
                  </p>
                  {event.driverNumber && (
                    <span className="inline-block mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/5">
                      CAR #{event.driverNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
