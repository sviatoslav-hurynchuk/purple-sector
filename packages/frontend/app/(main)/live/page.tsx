'use client';

import React, { useState } from 'react';
import { useSharedLiveSession } from '@/components/live/live-session-provider';
import { useLiveTelemetry } from '@/hooks/use-live-telemetry';
import { useTrackPositions } from '@/hooks/use-track-positions';
import { LiveLayoutProvider, useLiveLayout } from '@/components/live/layout/live-layout-context';
import { WidgetContainer } from '@/components/live/layout/widget-container';
import { LayoutCustomizerModal } from '@/components/live/layout/layout-customizer-modal';
import { WeatherWidget } from '@/components/live/weather-widget';
import { TimingTower } from '@/components/live/timing-tower';
import { TelemetryPanel } from '@/components/live/telemetry-panel';
import { TrackMap } from '@/components/live/track-map';
import { RaceControlFeed } from '@/components/live/race-control-feed';
import { LiveStatusIndicator } from '@/components/live/live-status-indicator';
import { Radio, RefreshCw, Layers, Activity, MapPin, Flag, ShieldAlert, Trophy, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type { LiveDriverState, LiveSessionState } from '@/types/f1';

function resolveTrackFlag(state: LiveSessionState | null) {
  if (!state || !state.raceControlFeed || state.raceControlFeed.length === 0) {
    return { flag: 'GREEN', label: 'TRACK CLEAR', color: 'emerald' };
  }

  const recentEvents = state.raceControlFeed.slice(-5);
  for (let i = recentEvents.length - 1; i >= 0; i--) {
    const e = recentEvents[i];
    if (e.type === 'safety_car') return { flag: 'SC', label: 'SAFETY CAR', color: 'amber' };
    if (e.type === 'vsc') return { flag: 'VSC', label: 'VSC DEPLOYED', color: 'amber' };
    if (e.type === 'red_flag') return { flag: 'RED', label: 'RED FLAG', color: 'red' };
    if (e.type === 'yellow_flag') return { flag: 'YELLOW', label: 'YELLOW FLAG', color: 'yellow' };
    if (e.type === 'chequered_flag') return { flag: 'CHEQUERED', label: 'SESSION FINISHED', color: 'zinc' };
  }

  return { flag: 'GREEN', label: 'TRACK CLEAR', color: 'emerald' };
}

function LiveTimingContent() {
  const { state, isStreaming, reconnect } = useSharedLiveSession();
  const { layout } = useLiveLayout();
  const [selectedDriverNumberState, setSelectedDriverNumber] = useState<number | null>(null);

  // Derive leader from live session state
  const leader = state?.drivers?.find((d: LiveDriverState) => d.position === 1);

  // Derive selectedDriverNumber: prefer explicit user selection, then actual P1 race leader, before index fallback
  const selectedDriverNumber =
    selectedDriverNumberState !== null && state?.drivers?.some((d: LiveDriverState) => d.driverNumber === selectedDriverNumberState)
      ? selectedDriverNumberState
      : (leader?.driverNumber ?? state?.drivers?.[0]?.driverNumber ?? null);

  const selectedDriver = state?.drivers
    ? state.drivers.find((d: LiveDriverState) => d.driverNumber === selectedDriverNumber) ?? null
    : null;

  // Live telemetry hook for selected driver
  const { samples: telemetrySamples, isLoading: isTelemetryLoading } = useLiveTelemetry({
    sessionKey: state?.sessionKey,
    driverNumber: selectedDriverNumber,
    windowSeconds: 20,
    enabled: !!state?.isActive,
  });

  // Track map positions hook
  const { locations, rawSamples } = useTrackPositions({
    sessionKey: state?.sessionKey,
    windowSeconds: 5,
    enabled: !!state?.isActive,
  });

  const trackStatus = resolveTrackFlag(state);
  const p2 = state?.drivers?.find((d: LiveDriverState) => d.position === 2);
  const sessionDisplayName =
    state?.sessionName && state.sessionName !== 'No Active Session'
      ? state.sessionName
      : 'Live Control Room';

  // Helper to render widget by ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'weather':
        return <WeatherWidget weather={state?.weather ?? null} />;

      case 'timing_tower':
        return (
          <TimingTower
            drivers={state?.drivers || []}
            selectedDriverNumber={selectedDriverNumber}
            onSelectDriver={setSelectedDriverNumber}
            isRestricted={state?.isRestricted}
          />
        );

      case 'track_map':
        return (
          <TrackMap
            locations={locations}
            rawSamples={rawSamples}
            drivers={state?.drivers || []}
            selectedDriverNumber={selectedDriverNumber}
            onSelectDriver={setSelectedDriverNumber}
            isRestricted={state?.isRestricted}
          />
        );

      case 'telemetry':
        return (
          <TelemetryPanel
            driver={selectedDriver}
            samples={telemetrySamples}
            isLoading={isTelemetryLoading}
            season={state?.sessionName?.match(/\b(20\d\d)\b/)?.[1]}
          />
        );

      case 'race_control':
        return <RaceControlFeed events={state?.raceControlFeed || []} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── Monolithic Live Cockpit Header ────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Official F1 Dual Racing Stripes Header */}
        <div className="w-full flex flex-col">
          <div className="h-1 bg-[#e10600] w-full" />
          <div className="h-0.5 bg-[#e10600]/60 w-full mt-0.5" />
        </div>

        {/* Ambient livery glow */}
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#e10600]/10 blur-3xl pointer-events-none" />

        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Active Session Identity */}
          <div className="space-y-1.5 min-w-0">
            {/* Metadata Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              {state?.isActive ? (
                <>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider',
                      trackStatus.color === 'emerald' && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      trackStatus.color === 'amber' && 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
                      trackStatus.color === 'yellow' && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
                      trackStatus.color === 'red' && 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
                      trackStatus.color === 'zinc' && 'bg-zinc-800 text-zinc-300 border-white/10'
                    )}
                  >
                    {trackStatus.flag === 'SC' || trackStatus.flag === 'VSC' ? (
                      <ShieldAlert className="size-3" />
                    ) : (
                      <Flag className="size-3" />
                    )}
                    <span>{trackStatus.label}</span>
                  </span>

                  {state.sessionType && (
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-white/10 uppercase tracking-wider">
                      {state.sessionType}
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-zinc-900 text-zinc-400 border-white/10">
                  <Clock className="size-3 text-zinc-500" />
                  <span>{state?.status === 'COMPLETED' ? 'COMPLETED SESSION SNAPSHOT' : 'STANDBY MODE'}</span>
                </span>
              )}

              {(state?.circuitShortName || state?.countryName) && (
                <span className="text-xs font-mono text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span className="text-zinc-600">·</span>
                  <span>{state.circuitShortName}</span>
                  {state.countryName && <span>({state.countryName})</span>}
                </span>
              )}
            </div>

            {/* Title & Leader */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase truncate">
                {sessionDisplayName}
              </h1>

              {state?.isActive && leader && !state.isRestricted && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 text-xs font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Trophy className="size-3" />
                    <span>P1</span>
                  </span>
                  <span
                    className="h-2.5 w-1 rounded-full"
                    style={{ backgroundColor: leader.teamColour || '#e10600' }}
                  />
                  <span className="font-bold text-white">
                    {leader.code || leader.name || `#${leader.driverNumber}`}
                  </span>
                  {p2?.interval && (
                    <span className="text-zinc-400 text-[11px]">
                      (+{typeof p2.interval === 'number' ? `${p2.interval.toFixed(3)}s` : p2.interval})
                    </span>
                  )}
                </div>
              )}
            </div>

            {state?.isRestricted && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300">
                <ShieldAlert className="size-3.5 text-amber-400 shrink-0" />
                <span>Live stream restricted (Official Session in Progress)</span>
              </div>
            )}
          </div>

          {/* Right: Unified Monolithic Cockpit Toolbar */}
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-zinc-900/80 p-1 divide-x divide-white/10 shadow-lg backdrop-blur-md shrink-0">
            {/* Live status segment */}
            <div className="px-2.5 py-1 flex items-center">
              <LiveStatusIndicator
                isActive={state?.isActive}
                isStreaming={isStreaming && !state?.isRestricted}
                status={state?.status}
                label={state?.isRestricted ? 'RESTRICTED' : undefined}
                size="sm"
                variant="toolbar"
              />
            </div>

            {/* Reconnect button */}
            <button
              onClick={reconnect}
              title="Reconnect live telemetry stream"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/5 transition-colors rounded-lg"
            >
              <RefreshCw className="size-3.5 text-zinc-400" />
              <span>Reconnect</span>
            </button>

            {/* Customize Layout button */}
            <LayoutCustomizerModal
              className="rounded-lg bg-transparent border-none text-zinc-300 hover:text-white hover:bg-white/5 shadow-none text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5"
              label="Layout"
            />
          </div>
        </div>
      </div>

      {/* Desktop Customizable Dynamic Grid */}
      <div className="hidden lg:grid grid-cols-12 gap-5 items-start">
        {layout.widgets
          .filter((w) => w.enabled)
          .map((widget) => (
            <WidgetContainer key={widget.id} widget={widget}>
              {renderWidgetContent(widget.id)}
            </WidgetContainer>
          ))}
      </div>

      {/* Mobile Tabbed Fallback */}
      <div className="lg:hidden">
        <Tabs defaultValue="tower" className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-zinc-900 border border-white/10 p-1 mb-4">
            <TabsTrigger value="tower" className="text-xs font-bold gap-1">
              <Layers className="h-3 w-3" />
              <span>Tower</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs font-bold gap-1">
              <MapPin className="h-3 w-3" />
              <span>Map</span>
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="text-xs font-bold gap-1">
              <Activity className="h-3 w-3" />
              <span>Telemetry</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="text-xs font-bold gap-1">
              <Radio className="h-3 w-3" />
              <span>Feed</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tower" className="space-y-4">
            <TimingTower
              drivers={state?.drivers || []}
              selectedDriverNumber={selectedDriverNumber}
              onSelectDriver={setSelectedDriverNumber}
              isRestricted={state?.isRestricted}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <TrackMap
              locations={locations}
              rawSamples={rawSamples}
              drivers={state?.drivers || []}
              selectedDriverNumber={selectedDriverNumber}
              onSelectDriver={setSelectedDriverNumber}
              isRestricted={state?.isRestricted}
            />
          </TabsContent>

          <TabsContent value="telemetry" className="space-y-4">
            <TelemetryPanel
              driver={selectedDriver}
              samples={telemetrySamples}
              isLoading={isTelemetryLoading}
              season={state?.sessionName?.match(/\b(20\d\d)\b/)?.[1]}
            />
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            <WeatherWidget weather={state?.weather ?? null} />
            <RaceControlFeed events={state?.raceControlFeed || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function LiveTimingPage() {
  return (
    <LiveLayoutProvider>
      <LiveTimingContent />
    </LiveLayoutProvider>
  );
}
