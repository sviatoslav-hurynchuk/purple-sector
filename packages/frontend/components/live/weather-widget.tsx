'use client';

import React from 'react';
import type { WeatherSnapshot } from '@/types/f1';
import { CloudRain, Wind, Thermometer, Gauge, Droplets, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  weather: WeatherSnapshot | null;
  className?: string;
}

export function WeatherWidget({ weather, className }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl bg-zinc-900/60 border border-white/5 backdrop-blur-sm text-zinc-500 text-xs flex items-center justify-center min-h-[90px]',
          className
        )}
      >
        <span>Weather telemetry unavailable</span>
      </div>
    );
  }

  const isRaining = weather.rainfall;
  const windDegrees = weather.windDirection ?? 0;

  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-zinc-900/80 border border-white/10 backdrop-blur-md shadow-sm',
        isRaining && 'border-blue-500/30 bg-blue-950/20',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
          {isRaining ? (
            <CloudRain className="h-4 w-4 text-blue-400 animate-pulse" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
          <span>Track Conditions</span>
        </div>
        <span
          className={cn(
            'text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider',
            isRaining
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          )}
        >
          {isRaining ? 'WET TRACK' : 'DRY TRACK'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Track Temp */}
        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Thermometer className="h-3 w-3 text-red-400" />
            <span>Track</span>
          </div>
          <span className="font-mono font-bold text-base text-zinc-100">
            {weather.trackTemperature?.toFixed(1) ?? '—'}°C
          </span>
        </div>

        {/* Air Temp */}
        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Thermometer className="h-3 w-3 text-amber-400" />
            <span>Air</span>
          </div>
          <span className="font-mono font-bold text-base text-zinc-100">
            {weather.airTemperature?.toFixed(1) ?? '—'}°C
          </span>
        </div>

        {/* Humidity */}
        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Droplets className="h-3 w-3 text-cyan-400" />
            <span>Humidity</span>
          </div>
          <span className="font-mono font-bold text-base text-zinc-100">
            {weather.humidity ? `${Math.round(weather.humidity)}%` : '—'}
          </span>
        </div>

        {/* Wind */}
        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-zinc-950/60 border border-white/5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Wind className="h-3 w-3 text-teal-400" />
            <span>Wind</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-base text-zinc-100">
              {weather.windSpeed?.toFixed(1) ?? '—'}{' '}
              <span className="text-[10px] font-normal text-zinc-400">m/s</span>
            </span>
            <span
              className="inline-block transition-transform duration-500 text-teal-400 text-xs font-bold"
              style={{ transform: `rotate(${windDegrees}deg)` }}
              title={`Direction: ${windDegrees}°`}
            >
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
