'use client';

import React, { useState, useEffect } from 'react';
import { useLiveSession } from '@/hooks/use-live-session';
import { useLiveTelemetry } from '@/hooks/use-live-telemetry';
import { useTrackPositions } from '@/hooks/use-track-positions';
import { LiveLayoutProvider, useLiveLayout } from '@/components/live/layout/live-layout-context';
import { WidgetContainer } from '@/components/live/layout/widget-container';
import { LayoutCustomizerModal } from '@/components/live/layout/layout-customizer-modal';
import { LiveSessionBanner } from '@/components/live/live-session-banner';
import { WeatherWidget } from '@/components/live/weather-widget';
import { TimingTower } from '@/components/live/timing-tower';
import { TelemetryPanel } from '@/components/live/telemetry-panel';
import { TrackMap } from '@/components/live/track-map';
import { RaceControlFeed } from '@/components/live/race-control-feed';
import { LiveStatusIndicator } from '@/components/live/live-status-indicator';
import { Radio, RefreshCw, Layers, Activity, MapPin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function LiveTimingContent() {
  const { state, isConnected, isStreaming, reconnect } = useLiveSession();
  const { layout } = useLiveLayout();
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null);

  // Auto-select P1 driver on initial load
  useEffect(() => {
    if (state?.drivers && state.drivers.length > 0 && selectedDriverNumber === null) {
      setSelectedDriverNumber(state.drivers[0].driverNumber);
    }
  }, [state?.drivers, selectedDriverNumber]);

  const selectedDriver = state?.drivers.find((d) => d.driverNumber === selectedDriverNumber) || null;

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

  // Helper to render widget by ID
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'banner':
        return state?.isActive ? (
          <LiveSessionBanner state={state} showLiveLink={false} />
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <Radio className="h-5 w-5 text-zinc-500 opacity-50" />
            <h4 className="font-bold text-xs text-zinc-300">No Active Session</h4>
          </div>
        );

      case 'weather':
        return <WeatherWidget weather={state?.weather ?? null} />;

      case 'timing_tower':
        return (
          <TimingTower
            drivers={state?.drivers || []}
            selectedDriverNumber={selectedDriverNumber}
            onSelectDriver={setSelectedDriverNumber}
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
      {/* Top Header & Layout Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              Live Timing Console
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LiveStatusIndicator isActive={state?.isActive} isStreaming={isStreaming} size="md" />

          <button
            onClick={reconnect}
            title="Reconnect stream"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reconnect</span>
          </button>

          <LayoutCustomizerModal />
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
            {state?.isActive && <LiveSessionBanner state={state} showLiveLink={false} />}
            <TimingTower
              drivers={state?.drivers || []}
              selectedDriverNumber={selectedDriverNumber}
              onSelectDriver={setSelectedDriverNumber}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <TrackMap
              locations={locations}
              rawSamples={rawSamples}
              drivers={state?.drivers || []}
              selectedDriverNumber={selectedDriverNumber}
              onSelectDriver={setSelectedDriverNumber}
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
