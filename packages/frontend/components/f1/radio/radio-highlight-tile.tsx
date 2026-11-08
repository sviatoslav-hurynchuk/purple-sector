'use client';

import React from 'react';
import Link from 'next/link';
import type { RaceHighlight } from '@/types/f1';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Wrench,
  Trophy,
  AlertOctagon,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WAVE_BARS, getWaveformBarStyle } from '@/lib/f1-waveform';

interface RadioHighlightTileProps {
  highlight: RaceHighlight;
  isPlaying: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPlayToggle: () => void;
  currentTime: number;
  duration: number;
  transcriptText?: string;
  replayLink?: string;
  className?: string;
}

/**
 * RadioHighlightTile renders an individual F1 team radio highlight card.
 * Supports compact preview and expanded cockpit views with telemetry wave visualization.
 */
export function RadioHighlightTile({
  highlight: hl,
  isPlaying,
  isExpanded,
  onToggleExpand,
  onPlayToggle,
  currentTime,
  duration,
  transcriptText,
  replayLink,
  className,
}: RadioHighlightTileProps) {
  const livery = hl.teamColour || '#e10600';
  const displayQuote = transcriptText || hl.transcript;

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getCategoryBadge = (compact = false) => {
    if (hl.category === 'victory') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-500/40 text-yellow-300 bg-yellow-500/15 shrink-0">
          <Trophy className="size-2.5 text-yellow-400" />
          <span>VICTORY</span>
        </span>
      );
    }
    if (hl.category === 'safety_car' || hl.category === 'vsc' || hl.category === 'red_flag') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-orange-500/40 text-orange-300 bg-orange-500/15 shrink-0">
          <ShieldAlert className="size-2.5 text-orange-400" />
          <span>{hl.category === 'safety_car' ? 'SC' : hl.category === 'vsc' ? 'VSC' : 'RED FLAG'}</span>
        </span>
      );
    }
    if (hl.category === 'dnf') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/40 text-rose-300 bg-rose-500/15 shrink-0">
          <AlertOctagon className="size-2.5 text-rose-400" />
          <span>RETIREMENT</span>
        </span>
      );
    }
    if (hl.category === 'pit_stop') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-blue-500/40 text-blue-300 bg-blue-500/15 shrink-0">
          <Wrench className="size-2.5 text-blue-400" />
          <span>PIT CALL</span>
        </span>
      );
    }
    if (compact) return null;
    return (
      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-zinc-900/80 shrink-0">
        TEAM RADIO
      </span>
    );
  };

  const progressRatio = isPlaying && duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playedBarsCount = Math.floor(progressRatio * WAVE_BARS.length);

  // ── Mode 1: Compact Mini-Tile (Collapsing into sleek cockpit row) ─────────
  if (!isExpanded) {
    return (
      <div
        data-highlight-id={hl.id}
        data-active={isPlaying}
        onClick={onPlayToggle}
        className={cn(
          'group relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer select-none',
          'flex items-center justify-between gap-3 p-2.5 sm:p-3',
          isPlaying
            ? 'border-white/50 bg-zinc-900/95 shadow-lg shadow-black/40 scale-[1.005]'
            : 'border-white/10 bg-zinc-950/70 hover:bg-zinc-900/70 hover:border-white/25',
          className
        )}
      >
        {/* Left vertical team livery stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-200"
          style={{ backgroundColor: livery }}
        />

        {/* Driver identity, lap, category, and quote teaser */}
        <div className="flex-1 min-w-0 pl-1.5 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-black text-white uppercase tracking-wider truncate">
              {hl.title.replace(/\s*RADIO$/i, '') || hl.driverName.split(' ').pop()}
            </span>
            <span className="text-xs font-mono font-black" style={{ color: livery }}>
              #{hl.driverNumber}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1 py-0.2 rounded border border-white/10 text-zinc-400 bg-zinc-900">
              L{hl.lap}
            </span>
            {getCategoryBadge(true)}
          </div>

          <p className="text-[11px] font-mono text-zinc-400 truncate italic">
            {displayQuote
              ? displayQuote.startsWith('"')
                ? displayQuote
                : `"${displayQuote}"`
              : hl.description.replace(/\s*(?:·|on|-)\s*Lap\s*\d+\s*$/i, '')}
          </p>
        </div>

        {/* Right action cluster: Play button & Expand chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayToggle();
            }}
            className={cn(
              'size-8 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-sm',
              isPlaying
                ? 'bg-white text-black ring-2 ring-white/30'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
            )}
            aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
          >
            {isPlaying ? (
              <Pause className="size-3.5 fill-black" />
            ) : (
              <Play className="size-3.5 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="size-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 transition-colors"
            aria-label="Expand radio card"
            title="Expand radio card"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Mode 2: Full Expanded F1 TV Broadcast Graphic Card ─────────────────────
  return (
    <div
      data-highlight-id={hl.id}
      data-active={isPlaying}
      className={cn(
        'relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between select-none shadow-xl',
        isPlaying
          ? 'border-white/50 bg-zinc-950 shadow-2xl scale-[1.01]'
          : 'border-white/15 bg-zinc-950/90 hover:border-white/30',
        className
      )}
    >
      {/* Top livery stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: livery }} />

      {/* Header: Title, Team, Lap Badge, and Collapse button */}
      <div className="p-3 pb-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className="w-1.5 h-3 rounded-full shrink-0"
              style={{ backgroundColor: livery }}
            />
            <Radio className="size-3 text-red-500 shrink-0" />
            <h4 className="text-xs sm:text-sm font-black font-mono tracking-wider text-white uppercase truncate">
              {hl.title}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono font-black" style={{ color: livery }}>
              #{hl.driverNumber}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-zinc-900/80">
              Lap {hl.lap}
            </span>
            <button
              type="button"
              onClick={onToggleExpand}
              className="size-6 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors ml-1"
              aria-label="Collapse radio card"
              title="Collapse"
            >
              <ChevronUp className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400">
          <span className="truncate">{hl.teamName || 'Formula 1 Team'}</span>
          {getCategoryBadge(false)}
        </div>
      </div>

      {/* Middle: Authentic F1 Broadcast Sound Waveform Section */}
      <div className="bg-zinc-900/80 border-y border-white/5 px-3 py-2 flex items-center justify-between gap-2.5 relative">
        <button
          type="button"
          onClick={onPlayToggle}
          className={cn(
            'size-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md',
            isPlaying ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'
          )}
          aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
        >
          {isPlaying ? <Pause className="size-3.5 fill-black" /> : <Play className="size-3.5 fill-white ml-0.5" />}
        </button>

        {/* 28 Animated Soundwave Frequency Bars (buttery smooth 60/120fps) */}
        <div className="flex-1 flex items-center justify-center gap-[2.5px] h-7 overflow-hidden px-1">
          {WAVE_BARS.map((heightPct, idx) => {
            const isPlayed = isPlaying && idx <= playedBarsCount;

            return (
              <span
                key={idx}
                className="w-[3px] min-w-[2px] rounded-full shrink-0"
                style={getWaveformBarStyle({
                  idx,
                  isPlaying,
                  baseHeightPct: heightPct,
                  isPlayed,
                  livery,
                })}
              />
            );
          })}
        </div>

        {/* Time Digits */}
        <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums shrink-0">
          {isPlaying ? `${formatSecs(currentTime)} / ${formatSecs(duration)}` : 'AUDIO'}
        </span>
      </div>

      {/* Bottom: Authentic Speech-to-Text Quotation */}
      <div className="p-3 pt-2.5 space-y-2">
        {displayQuote ? (
          <p className="text-xs font-mono font-bold text-zinc-100 italic leading-snug line-clamp-3 animate-in fade-in duration-300">
            {displayQuote.startsWith('"') ? displayQuote : `"${displayQuote}"`}
          </p>
        ) : (
          <p className="text-[11px] font-mono text-zinc-400 leading-snug line-clamp-2">
            {hl.description.replace(/\s*(?:·|on|-)\s*Lap\s*\d+\s*$/i, '')}
          </p>
        )}

        {/* Optional deep-link to Lap Replay Chart */}
        {replayLink && (
          <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500 text-[10px]">Lap-by-lap trace:</span>
            <Link
              href={replayLink}
              className="text-zinc-300 hover:text-white flex items-center gap-1 font-bold transition-colors group/link"
            >
              <span>Jump to Lap {hl.lap}</span>
              <ExternalLink className="size-3 text-zinc-400 group-hover/link:text-white transition-colors" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
