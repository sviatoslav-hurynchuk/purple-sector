'use client';

import React, { useMemo } from 'react';
import type { CarTelemetrySample, LiveDriverState } from '@/types/f1';
import { Activity, Gauge, Zap, Disc, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelemetryPanelProps {
  driver: LiveDriverState | null;
  samples: CarTelemetrySample[];
  compareDriver?: LiveDriverState | null;
  compareSamples?: CarTelemetrySample[];
  isLoading?: boolean;
  className?: string;
}

export function TelemetryPanel({
  driver,
  samples,
  compareDriver,
  compareSamples = [],
  isLoading = false,
  className,
}: TelemetryPanelProps) {
  // Compute key telemetry metrics from the latest sample
  const latestSample = samples.length > 0 ? samples[samples.length - 1] : null;
  const maxSpeed = useMemo(() => {
    if (samples.length === 0) return 0;
    return Math.max(...samples.map((s) => s.speed || 0));
  }, [samples]);

  // Dimensions for SVG graphs
  const width = 500;
  const speedHeight = 110;
  const throttleBrakeHeight = 80;

  // Build SVG Path for Speed
  const speedPath = useMemo(() => {
    if (samples.length < 2) return '';
    const maxSpd = 360;
    return samples
      .map((s, idx) => {
        const x = (idx / (samples.length - 1)) * width;
        const y = speedHeight - (Math.min(s.speed || 0, maxSpd) / maxSpd) * speedHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples]);

  // Build SVG Path for Compare Speed
  const compareSpeedPath = useMemo(() => {
    if (compareSamples.length < 2) return '';
    const maxSpd = 360;
    return compareSamples
      .map((s, idx) => {
        const x = (idx / (compareSamples.length - 1)) * width;
        const y = speedHeight - (Math.min(s.speed || 0, maxSpd) / maxSpd) * speedHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [compareSamples]);

  // Build SVG Paths for Throttle & Brake
  const throttlePath = useMemo(() => {
    if (samples.length < 2) return '';
    return samples
      .map((s, idx) => {
        const x = (idx / (samples.length - 1)) * width;
        const y = throttleBrakeHeight - ((s.throttle || 0) / 100) * throttleBrakeHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples]);

  const brakePath = useMemo(() => {
    if (samples.length < 2) return '';
    return samples
      .map((s, idx) => {
        const x = (idx / (samples.length - 1)) * width;
        const y = throttleBrakeHeight - ((s.brake || 0) / 100) * throttleBrakeHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [samples]);

  if (!driver) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900/80 border border-white/10 text-center min-h-[360px]',
          className
        )}
      >
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/5 text-zinc-500 mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-zinc-300">Live Driver Telemetry</h4>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Select any driver from the timing tower to inspect live speed traces, throttle, braking, and gear telemetry.
        </p>
      </div>
    );
  }

  const teamColor = driver.teamColour || '#e10600';
  const compareTeamColor = compareDriver?.teamColour || '#3b82f6';

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1.5 h-6 rounded-full shrink-0"
            style={{ backgroundColor: teamColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-zinc-100 tracking-wider font-mono">
                {driver.code || `#${driver.driverNumber}`}
              </h3>
              <span className="text-xs text-zinc-400">{driver.name}</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                P{driver.position}
              </span>
            </div>
          </div>
        </div>

        {compareDriver && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500">VS</span>
            <span
              className="font-bold px-1.5 py-0.5 rounded border"
              style={{
                borderColor: compareTeamColor,
                color: compareTeamColor,
                backgroundColor: `${compareTeamColor}15`,
              }}
            >
              {compareDriver.code || `#${compareDriver.driverNumber}`}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 border-b border-white/5 bg-zinc-950/20">
        {/* Speed */}
        <div className="flex flex-col p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Gauge className="h-3 w-3 text-red-400" /> Speed
          </span>
          <span className="font-mono font-black text-xl text-white mt-1">
            {latestSample?.speed ?? '—'}{' '}
            <span className="text-xs font-normal text-zinc-400">km/h</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
            Peak: {maxSpeed} km/h
          </span>
        </div>

        {/* Gear & RPM */}
        <div className="flex flex-col p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Play className="h-3 w-3 text-amber-400" /> Gear & RPM
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono font-black text-xl text-amber-400">
              G{latestSample?.gear ?? '—'}
            </span>
            <span className="font-mono text-xs text-zinc-300">
              {latestSample?.rpm ? `${latestSample.rpm.toLocaleString()} RPM` : '—'}
            </span>
          </div>
        </div>

        {/* Throttle */}
        <div className="flex flex-col p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Disc className="h-3 w-3 text-emerald-400" /> Throttle
          </span>
          <span className="font-mono font-black text-xl text-emerald-400 mt-1">
            {latestSample?.throttle ?? 0}%
          </span>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full transition-all duration-150"
              style={{ width: `${latestSample?.throttle ?? 0}%` }}
            />
          </div>
        </div>

        {/* Brake & DRS */}
        <div className="flex flex-col p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Zap className="h-3 w-3 text-cyan-400" /> Brake / DRS
          </span>
          <div className="flex items-center justify-between mt-1">
            <span
              className={cn(
                'font-mono font-bold text-sm',
                (latestSample?.brake ?? 0) > 10 ? 'text-red-400' : 'text-zinc-500'
              )}
            >
              {(latestSample?.brake ?? 0) > 10 ? 'BRAKING' : 'OFF'}
            </span>
            <span
              className={cn(
                'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase',
                latestSample?.drs === 1
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-500'
              )}
            >
              DRS {latestSample?.drs === 1 ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Charts */}
      <div className="p-4 space-y-4">
        {/* Speed Chart */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Speed Trace (km/h)</span>
            <span className="font-mono text-[10px] text-zinc-500">0 - 360 km/h</span>
          </div>
          <div className="relative w-full h-[110px] bg-zinc-950/80 rounded-xl border border-white/5 p-1 overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
              <div className="border-b border-zinc-700 w-full" />
              <div className="border-b border-zinc-700 w-full" />
              <div className="border-b border-zinc-700 w-full" />
            </div>

            {samples.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600 font-mono">
                {isLoading ? 'Acquiring telemetry...' : 'Waiting for telemetry samples...'}
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${width} ${speedHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Compare speed trace */}
                {compareSpeedPath && (
                  <path
                    d={compareSpeedPath}
                    fill="none"
                    stroke={compareTeamColor}
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    opacity="0.75"
                  />
                )}
                {/* Primary driver speed trace */}
                <path
                  d={speedPath}
                  fill="none"
                  stroke={teamColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Throttle & Brake Overlay */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Throttle
              </span>
              <span className="flex items-center gap-1 text-red-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Brake
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500">0 - 100%</span>
          </div>

          <div className="relative w-full h-[80px] bg-zinc-950/80 rounded-xl border border-white/5 p-1 overflow-hidden">
            {samples.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600 font-mono">
                No throttle/brake telemetry
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${width} ${throttleBrakeHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Brake Line */}
                {brakePath && (
                  <path
                    d={brakePath}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
                {/* Throttle Line */}
                {throttlePath && (
                  <path
                    d={throttlePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
