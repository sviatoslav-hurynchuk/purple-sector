'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Race, RaceResult, RaceLapsResponse, PitStopEntry, RaceResultEntry, RaceSessionData } from '@/types/f1';
import { CountryFlag } from '@/components/f1/country-flag';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LineChart, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { PlaybackControls } from './playback-controls';
import { RaceLeaderboard } from './race-leaderboard';
import { PositionChart } from './position-chart';
import { RaceEventsOverlay } from './race-events-overlay';
import { PaceComparison } from './pace-comparison';

interface LapChartPageContentProps {
  race: Race | RaceResult;
  lapsData: RaceLapsResponse;
  pitStops: PitStopEntry[];
  openF1Data?: RaceSessionData | null;
}

export function LapChartPageContent({
  race,
  lapsData,
  pitStops,
  openF1Data,
}: LapChartPageContentProps) {
  const totalLaps = Math.max(1, lapsData.totalLaps);
  const [currentLap, setCurrentLap] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Fullscreen keyboard shortcut ('Escape' to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(200, Math.round(1000 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentLap((prev) => (prev >= totalLaps ? totalLaps : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalLaps]);

  // Auto-stop playback when race ends
  useEffect(() => {
    if (isPlaying && currentLap >= totalLaps) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentLap, totalLaps]);

  const handlePlayToggle = useCallback(() => {
    if (currentLap >= totalLaps && !isPlaying) {
      setCurrentLap(1);
    }
    setIsPlaying((prev) => !prev);
  }, [currentLap, totalLaps, isPlaying]);

  const handleLapChange = useCallback((lap: number) => {
    setCurrentLap(Math.min(Math.max(1, lap), totalLaps));
  }, [totalLaps]);

  const handleToggleDriver = useCallback((driverId: string) => {
    // Only allow selecting drivers when paused!
    if (isPlaying) return;

    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) {
        next.delete(driverId);
      } else if (next.size < 4) {
        next.add(driverId);
      }
      return next;
    });
  }, [isPlaying]);

  const handleRemoveDriver = useCallback((driverId: string) => {
    setSelectedDriverIds((prev) => {
      const next = new Set(prev);
      next.delete(driverId);
      return next;
    });
  }, []);

  const handleClearDrivers = useCallback(() => {
    setSelectedDriverIds(new Set());
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          href={`/calendar/${race.round}?season=${race.season}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-3 group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to {race.raceName}</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">
              <LineChart className="size-3.5 text-primary" />
              <span>Lap-by-Lap Replay</span>
              <span>·</span>
              <span>Round {race.round}</span>
              <span>·</span>
              <span>{race.date}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
              <span>{race.raceName}</span>
              <CountryFlag
                countryName={race.Circuit.Location.country}
                className="w-7 h-5 rounded-xs shrink-0 shadow-xs"
              />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {race.Circuit.circuitName} · {race.Circuit.Location.locality}, {race.Circuit.Location.country}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono border-zinc-700 bg-zinc-900/60 px-3 py-1">
              {totalLaps} Total Laps
            </Badge>
            <Badge variant="outline" className="text-xs font-mono border-zinc-700 bg-zinc-900/60 px-3 py-1">
              {lapsData.drivers.length} Drivers
            </Badge>
          </div>
        </div>
      </div>

      {/* Fastest Lap & Race Control Overview Cards */}
      <RaceEventsOverlay
        drivers={lapsData.drivers}
        raceEvents={openF1Data?.raceControlEvents}
        currentLap={currentLap}
        totalLaps={totalLaps}
      />

      {/* Main Grid: Leaderboard (4 cols) | Position Chart & Controls (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Leaderboard (Strictly bounded by right column height with internal scroll) */}
        <div className="lg:col-span-4 w-full relative min-h-[520px] lg:min-h-0">
          <div className="lg:absolute lg:inset-0 flex flex-col">
            <RaceLeaderboard
              currentLap={currentLap}
              totalLaps={totalLaps}
              lapsData={lapsData.laps}
              drivers={lapsData.drivers}
              pitStops={pitStops}
              selectedDriverIds={selectedDriverIds}
              isPaused={!isPlaying}
              season={race.season}
              className="h-full flex-1"
              onToggleDriver={handleToggleDriver}
            />
          </div>
        </div>

        {/* Right Column: Chart + Playback Controls */}
        <div className="lg:col-span-8 w-full space-y-4">
          <PositionChart
            currentLap={currentLap}
            totalLaps={totalLaps}
            lapsData={lapsData.laps}
            drivers={lapsData.drivers}
            pitStops={pitStops}
            selectedDriverIds={selectedDriverIds}
            raceEvents={openF1Data?.raceControlEvents}
            isPaused={!isPlaying}
            isFullscreen={false}
            onLapChange={handleLapChange}
            onToggleDriver={handleToggleDriver}
            onToggleFullscreen={() => setIsFullscreen(true)}
          />

          <PlaybackControls
            currentLap={currentLap}
            totalLaps={totalLaps}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            disabled={isFullscreen}
            onPlayToggle={handlePlayToggle}
            onLapChange={handleLapChange}
            onSpeedChange={setPlaybackSpeed}
          />
        </div>
      </div>

      {/* Bottom Section: Pace Comparison (Appears when 1+ drivers are selected) */}
      {selectedDriverIds.size > 0 && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <PaceComparison
            selectedDriverIds={selectedDriverIds}
            totalLaps={totalLaps}
            lapsData={lapsData.laps}
            drivers={lapsData.drivers}
            pitStops={pitStops}
            openF1Stints={openF1Data?.stints}
            onRemoveDriver={handleRemoveDriver}
            onClearAll={handleClearDrivers}
          />
        </div>
      )}

      {/* Fullscreen Replay Theater Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/98 p-4 sm:p-6 flex flex-col justify-between overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Fullscreen Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2.5">
                <span>{race.raceName}</span>
                <CountryFlag
                  countryName={race.Circuit.Location.country}
                  className="w-7 h-5 rounded-xs shrink-0 shadow-xs"
                />
              </h2>
              <Badge variant="outline" className="font-mono text-xs sm:text-sm border-zinc-700 bg-zinc-900/80 px-2.5 py-0.5">
                Round {race.round} · Lap {currentLap}/{totalLaps}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="h-8 sm:h-9 px-3 sm:px-4 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-foreground text-xs sm:text-sm font-semibold gap-2 shadow-sm"
              >
                <Minimize2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Fullscreen Main View: Driver Position Strips (Left) + Chart (Right) */}
          <div className="flex-1 min-h-0 py-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
            {/* Left: Real-time Driver Position Strips Leaderboard */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full overflow-hidden">
              <RaceLeaderboard
                currentLap={currentLap}
                totalLaps={totalLaps}
                lapsData={lapsData.laps}
                drivers={lapsData.drivers}
                pitStops={pitStops}
                selectedDriverIds={selectedDriverIds}
                isPaused={!isPlaying}
                season={race.season}
                isFullscreen={true}
                onToggleDriver={handleToggleDriver}
              />
            </div>

            {/* Right: Expanded Bump Chart */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full overflow-hidden">
              <PositionChart
                currentLap={currentLap}
                totalLaps={totalLaps}
                lapsData={lapsData.laps}
                drivers={lapsData.drivers}
                pitStops={pitStops}
                selectedDriverIds={selectedDriverIds}
                raceEvents={openF1Data?.raceControlEvents}
                isPaused={!isPlaying}
                isFullscreen={true}
                onLapChange={handleLapChange}
                onToggleDriver={handleToggleDriver}
                onToggleFullscreen={() => setIsFullscreen(false)}
              />
            </div>
          </div>

          {/* Fullscreen Bottom Playback Controls */}
          <div className="pt-2 shrink-0">
            <PlaybackControls
              currentLap={currentLap}
              totalLaps={totalLaps}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlayToggle={handlePlayToggle}
              onLapChange={handleLapChange}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
