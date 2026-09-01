'use client';

import React from 'react';
import { useLiveSession } from '@/hooks/use-live-session';
import { LiveSessionBanner } from '@/components/live/live-session-banner';
import { WeatherWidget } from '@/components/live/weather-widget';
import { RaceControlFeed } from '@/components/live/race-control-feed';

export function DashboardLiveSection() {
  const { state } = useLiveSession();

  if (!state || !state.isActive) {
    return null;
  }

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LiveSessionBanner state={state} showLiveLink={true} />
        </div>
        <WeatherWidget weather={state.weather} />
      </div>

      {state.raceControlFeed && state.raceControlFeed.length > 0 && (
        <RaceControlFeed
          events={state.raceControlFeed}
          maxHeight="max-h-[220px]"
        />
      )}
    </section>
  );
}
