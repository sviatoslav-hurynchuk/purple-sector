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
        onLapChange(Math.max(1, currentLap - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onLapChange(Math.min(totalLaps, currentLap + 1));
      } else if (e.code === 'Home') {
        e.preventDefault();
        onLapChange(1);
      } else if (e.code === 'End') {
        e.preventDefault();
        onLapChange(totalLaps);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLap, totalLaps, onPlayToggle, onLapChange]);

  const progressPercent = totalLaps > 1 ? ((currentLap - 1) / (totalLaps - 1)) * 100 : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 shadow-lg backdrop-blur-sm space-y-4">
      {/* Top row: Lap indicator & Timeline scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="font-semibold text-foreground">
            LAP <span className="text-base font-bold text-primary tabular-nums">{currentLap}</span> / {totalLaps}
          </span>
          <span className="text-zinc-400 font-medium">
            {Math.round(progressPercent)}% of Grand Prix
          </span>
        </div>

        {/* Interactive Lap Slider */}
        <div className="relative flex items-center group/slider py-1">
          <input
            type="range"
            min={1}
            max={Math.max(1, totalLaps)}
            value={currentLap}
            disabled={disabled}
            onChange={(e) => onLapChange(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none transition-all disabled:opacity-50"
            aria-label="Race Lap Timeline Scrubber"
          />
        </div>
      </div>

      {/* Bottom row: Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-900">
        {/* Playback step buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jump to start */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(1)}
            disabled={currentLap === 1 || disabled}
            title="Jump to Start (Home)"
            className="size-8 sm:size-9 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5 sm:size-4" />
          </Button>

          {/* Previous Lap */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onLapChange(Math.max(1, currentLap - 1))}
            disabled={currentLap === 1 || disabled}
            title="Previous Lap (←)"
            className="size-8 sm:size-9 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
          >
            <SkipBack className="size-3.5 sm:size-4" />
          </Button>

          {/* Play / Pause Main Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onPlayToggle}
            disabled={disabled}
            className="px-4 h-8 sm:h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform active:scale-95 gap-2 select-none"
          >
            {isPlaying ? (
              <>
                <Pause className="size-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
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
            className="size-8 sm:size-9 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
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
            className="size-8 sm:size-9 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
          >
            <FastForward className="size-3.5 sm:size-4" />
          </Button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 p-0.5 rounded-lg">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSpeedChange(speed)}
              className={cn(
                'px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors',
                playbackSpeed === speed
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-zinc-800/60'
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
