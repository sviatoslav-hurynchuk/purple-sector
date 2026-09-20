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
import { CountryFlag } from '@/components/f1/country-flag';
import { Radio, RefreshCw, Layers, Activity, MapPin, Flag, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-8 pb-16 animate-in fade-in duration-300">
      {/* ── Top Dual F1 Racing Speed Stripes ───────────────────────────── */}
      <div className="space-y-1.5" aria-hidden="true">
        <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent rounded-full opacity-90" />
        <div className="h-0.5 sm:h-1 w-3/4 bg-gradient-to-r from-red-700 via-red-600 to-transparent rounded-full opacity-60" />
      </div>

      {/* ── Main Cockpit Title & Live Toolbar ─────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white uppercase flex flex-wrap items-baseline gap-3">
            <span>LIVE</span>
            <span className="text-zinc-400 font-sans font-black tracking-tighter text-2xl sm:text-3xl lg:text-4xl">
              CONTROL ROOM
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{sessionDisplayName}</span>
            <span className="text-zinc-600">•</span>
            <span>Real-time pit wall telemetry & session tracking</span>
          </p>
        </div>

        <div className="shrink-0">
          <div className="inline-flex items-center rounded-xl border border-white/10 bg-zinc-950/90 p-1 divide-x divide-white/10 shadow-xl backdrop-blur-md">
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

      {/* ── Live Pulse Telemetry Ribbon (Monolithic 4-Metric Bar) ─────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl">
        {/* Metric 1: Track Status */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Track Status
          </span>
          <div className="flex items-center gap-2">
            {trackStatus.flag === 'SC' || trackStatus.flag === 'VSC' ? (
              <ShieldAlert className={cn('size-5 shrink-0', trackStatus.color === 'amber' ? 'text-amber-400' : 'text-zinc-400')} />
            ) : (
              <Flag className={cn(
                'size-5 shrink-0',
                trackStatus.color === 'emerald' && 'text-emerald-400',
                trackStatus.color === 'red' && 'text-red-500',
                trackStatus.color === 'yellow' && 'text-yellow-400',
                trackStatus.color === 'amber' && 'text-amber-400',
                trackStatus.color === 'zinc' && 'text-zinc-400'
              )} />
            )}
            <span
              className={cn(
                'text-xl sm:text-2xl font-black font-mono uppercase tracking-tight truncate',
                trackStatus.color === 'emerald' && 'text-emerald-400',
                trackStatus.color === 'amber' && 'text-amber-400',
                trackStatus.color === 'yellow' && 'text-yellow-400',
                trackStatus.color === 'red' && 'text-red-500',
                trackStatus.color === 'zinc' && 'text-zinc-300'
              )}
            >
              {trackStatus.label}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            FIA Sector Clearance{state?.sessionType ? ` • ${state.sessionType}` : ''}
          </span>
        </div>

        {/* Metric 2: Circuit & Location */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Circuit Venue
          </span>
          <div className="flex items-center gap-2 min-w-0">
            {state?.countryName && (
              <CountryFlag
                countryName={state.countryName}
                className="w-6 h-4 sm:w-7 sm:h-4.5 object-cover rounded-xs border border-white/15 shadow-sm shrink-0"
              />
            )}
            <p className="text-xl sm:text-2xl font-black font-mono text-white truncate">
              {state?.circuitShortName || state?.countryName || 'Championship Track'}
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {state?.countryName ? `${state.countryName} • ` : ''}
            {state?.isActive ? 'Official Session' : 'Standby Mode'}
          </span>
        </div>

        {/* Metric 3: Race Leader (P1) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Session Leader
          </span>
          {leader ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-4 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: leader.teamColour || '#e10600' }}
              />
              <p className="text-xl sm:text-2xl font-black font-mono text-white truncate">
                {leader.code || leader.name || `#${leader.driverNumber}`}
              </p>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded shrink-0">
                P1
              </span>
            </div>
          ) : (
            <p className="text-xl sm:text-2xl font-black font-mono text-zinc-500 truncate">
              {state?.isActive ? 'Timing In...' : 'Standby'}
            </p>
          )}
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {leader && p2?.interval
              ? `Lead Gap: +${typeof p2.interval === 'number' ? `${p2.interval.toFixed(3)}s` : p2.interval}`
              : leader?.teamName || 'Awaiting classification'}
          </span>
        </div>

        {/* Metric 4: Pit Wall Conditions */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-1">
          <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider">
            Track Environment
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono text-white truncate">
            {state?.weather?.trackTemperature != null
              ? `${Math.round(state.weather.trackTemperature)}°C Track`
              : `${locations.size || state?.drivers?.length || 0} Cars Active`}
          </p>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {state?.weather
              ? `${state.weather.rainfall ? 'Wet Conditions' : 'Dry Surface'} • ${locations.size || state?.drivers?.length || 0} Cars Monitored`
              : 'GPS & Telemetry Online'}
          </span>
        </div>
      </div>

      {/* Restricted Stream Banner (if applicable) */}
      {state?.isRestricted && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
          <ShieldAlert className="size-4 text-amber-400 shrink-0" />
          <span>Live stream restricted during official session by FIA regulation. Real-time timing classification remains active.</span>
        </div>
      )}

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
          <TabsList className="grid grid-cols-4 w-full bg-zinc-950/90 border border-white/10 p-1 mb-4 rounded-xl">
            <TabsTrigger value="tower" className="text-xs font-mono font-bold uppercase tracking-wider gap-1.5">
              <Layers className="size-3.5" />
              <span>Tower</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs font-mono font-bold uppercase tracking-wider gap-1.5">
              <MapPin className="size-3.5" />
              <span>Map</span>
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="text-xs font-mono font-bold uppercase tracking-wider gap-1.5">
              <Activity className="size-3.5" />
              <span>Telemetry</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="text-xs font-mono font-bold uppercase tracking-wider gap-1.5">
              <Radio className="size-3.5" />
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
