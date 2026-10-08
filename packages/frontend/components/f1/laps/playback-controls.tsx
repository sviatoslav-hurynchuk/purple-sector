'use client';

import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  currentLap: number;
  totalLaps: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayToggle: () => void;
  onLapChange: (lap: number) => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

const SPEED_OPTIONS = [0.5, 1, 2, 5];

export function PlaybackControls({
  currentLap,
  totalLaps,
  isPlaying,
  playbackSpeed,
  onPlayToggle,
  onLapChange,
  onSpeedChange,
  disabled = false,
}: PlaybackControlsProps) {
  // Keyboard navigation shortcuts
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayToggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onLapChange(Math.max(0, currentLap - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onLapChange(Math.min(totalLaps, currentLap + 1));
      } else if (e.code === 'Home') {
        e.preventDefault();
        onLapChange(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        onLapChange(totalLaps);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLap, totalLaps, onPlayToggle, onLapChange, disabled]);

  const progressPercent = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-4 sm:p-5 shadow-xl backdrop-blur-xs space-y-4">
      {/* Top row: Lap indicator & Timeline scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          {currentLap === 0 ? (
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black text-amber-400 tracking-wider">STARTING GRID</span>
              <span className="text-zinc-400 font-normal">/ {totalLaps} Laps</span>
            </span>
          ) : (
            <span className="font-bold text-zinc-300 uppercase tracking-wider">
              LAP <span className="text-base sm:text-lg font-black text-white tabular-nums">{currentLap}</span> <span className="text-zinc-400 font-normal">/ {totalLaps}</span>
            </span>
          )}
          <span className="text-zinc-400 font-medium">
            {currentLap === 0 ? 'Pre-Race' : `${Math.round(progressPercent)}% of Grand Prix`}
          </span>
        </div>

        {/* Interactive Lap Slider */}
        <div className="relative flex items-center group/slider py-1">
          <input
            type="range"
            min={0}
            max={Math.max(1, totalLaps)}
            value={currentLap}
            disabled={disabled}
            onChange={(e) => onLapChange(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none transition-all disabled:opacity-50"
            aria-label="Race Lap Timeline Scrubber"
          />
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
        {/* Playback step buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jump to start */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(0)}
            disabled={currentLap === 0 || disabled}
            title="Jump to Starting Grid (Home)"
            className="size-8 sm:size-9 border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg"
          >
            <RotateCcw className="size-3.5 sm:size-4" />
          </Button>

          {/* Previous Lap */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(Math.max(0, currentLap - 1))}
            disabled={currentLap === 0 || disabled}
            title="Previous Lap (←)"
            className="size-8 sm:size-9 border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg"
          >
            <SkipBack className="size-3.5 sm:size-4" />
          </Button>

          {/* Play / Pause Main Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onPlayToggle}
            disabled={disabled}
            className="px-4 h-8 sm:h-9 font-mono font-bold uppercase tracking-wider text-xs bg-[#e10600] hover:bg-[#c00500] text-white rounded-lg shadow-md shadow-red-950/40 transition-transform active:scale-95 gap-2 select-none"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Play Replay</span>
              </>
            )}
          </Button>

          {/* Next Lap */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(Math.min(totalLaps, currentLap + 1))}
            disabled={currentLap === totalLaps || disabled}
            title="Next Lap (→)"
            className="size-8 sm:size-9 border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg"
          >
            <SkipForward className="size-3.5 sm:size-4" />
          </Button>

          {/* Jump to finish */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(totalLaps)}
            disabled={currentLap === totalLaps || disabled}
            title="Jump to Finish (End)"
            className="size-8 sm:size-9 border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg"
          >
            <FastForward className="size-3.5 sm:size-4" />
          </Button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 p-0.5 rounded-lg shadow-xs">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              disabled={disabled}
              onClick={() => onSpeedChange(speed)}
              className={cn(
                'px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none',
                playbackSpeed === speed
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
