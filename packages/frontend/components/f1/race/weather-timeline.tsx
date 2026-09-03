'use client';

import React, { useMemo } from 'react';
import type { WeatherSnapshot } from '@/types/f1';
import { CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherTimelineProps {
  weather: WeatherSnapshot[];
  className?: string;
}

export function WeatherTimeline({ weather, className }: WeatherTimelineProps) {
  const width = 600;
  const height = 140;
  const pad = 24;

  const { trackPath, airPath, minTemp, maxTemp, rainPeriods } = useMemo(() => {
    if (!weather || weather.length < 2) {
      return { trackPath: '', airPath: '', minTemp: 0, maxTemp: 50, rainPeriods: [] };
    }

    const allTemps = [
      ...weather.map((w) => w.trackTemperature || 0),
      ...weather.map((w) => w.airTemperature || 0),
    ];

    const minT = Math.floor(Math.min(...allTemps) - 2);
    const maxT = Math.ceil(Math.max(...allTemps) + 2);
    const tempSpan = maxT - minT || 1;

    const plotW = width - pad * 2;
    const plotH = height - pad * 2;

    const scaleX = (idx: number) => pad + (idx / (weather.length - 1)) * plotW;
    const scaleY = (temp: number) => height - pad - ((temp - minT) / tempSpan) * plotH;

    const tPath = weather
      .map((w, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(w.trackTemperature).toFixed(1)}`)
      .join(' ');

    const aPath = weather
      .map((w, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(idx).toFixed(1)} ${scaleY(w.airTemperature).toFixed(1)}`)
      .join(' ');

    // Extract rain index ranges
    const rains: Array<{ startX: number; endX: number }> = [];
    let curStart: number | null = null;

    weather.forEach((w, idx) => {
      if (w.rainfall && curStart === null) {
        curStart = idx;
      } else if (!w.rainfall && curStart !== null) {
        rains.push({ startX: scaleX(curStart), endX: scaleX(idx) });
        curStart = null;
      }
    });
    if (curStart !== null) {
      rains.push({ startX: scaleX(curStart), endX: scaleX(weather.length - 1) });
    }

    return {
      trackPath: tPath,
      airPath: aPath,
      minTemp: minT,
      maxTemp: maxT,
      rainPeriods: rains,
    };
  }, [weather]);

  if (!weather || weather.length < 2) {
    return null;
  }

  const latest = weather[weather.length - 1];

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-sm space-y-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-red-400" />
          <h3 className="font-black text-sm text-zinc-100 uppercase tracking-tight">
            Weather Timeline
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            ({weather.length} snapshots)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-0.5 bg-red-400 rounded-full" />
            <span className="font-semibold">Track Temp ({latest?.trackTemperature?.toFixed(1)}°C)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full" />
            <span className="font-semibold">Air Temp ({latest?.airTemperature?.toFixed(1)}°C)</span>
          </div>
          {rainPeriods.length > 0 && (
            <div className="flex items-center gap-1 text-blue-400 font-bold">
              <CloudRain className="h-3.5 w-3.5" />
              <span>Rain</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full h-[140px] bg-zinc-950/80 rounded-xl border border-white/5 p-1 overflow-hidden">
        {/* Rain Bands */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {rainPeriods.map((r, i) => (
            <rect
              key={i}
              x={r.startX}
              y={0}
              width={Math.max(4, r.endX - r.startX)}
              height={height}
              fill="rgba(59, 130, 246, 0.15)"
            />
          ))}

          {/* Grid lines */}
          <line x1={pad} y1={pad} x2={width - pad} y2={pad} stroke="rgba(255,255,255,0.05)" />
          <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="rgba(255,255,255,0.05)" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.05)" />

          {/* Air Temperature Trace */}
          {airPath && (
            <path
              d={airPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Track Temperature Trace */}
          {trackPath && (
            <path
              d={trackPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Y-Axis scale label */}
        <div className="absolute left-2 top-2 text-[9px] font-mono text-zinc-500">
          {maxTemp}°C
        </div>
        <div className="absolute left-2 bottom-2 text-[9px] font-mono text-zinc-500">
          {minTemp}°C
        </div>
      </div>
    </div>
  );
}
