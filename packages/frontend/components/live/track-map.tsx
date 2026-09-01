'use client';

import React, { useMemo, useState } from 'react';
import type { LiveDriverState, CarLocationSample } from '@/types/f1';
import type { DriverLatestLocation } from '@/hooks/use-track-positions';
import { CarDot } from './car-dot';
import { MapPin, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackMapProps {
  locations: Map<number, DriverLatestLocation>;
  rawSamples?: CarLocationSample[];
  drivers: LiveDriverState[];
  selectedDriverNumber?: number | null;
  onSelectDriver?: (driverNumber: number) => void;
  className?: string;
}

export function TrackMap({
  locations,
  rawSamples = [],
  drivers,
  selectedDriverNumber,
  onSelectDriver,
  className,
}: TrackMapProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const driverMap = useMemo(() => {
    const map = new Map<number, LiveDriverState>();
    for (const d of drivers) {
      map.set(d.driverNumber, d);
    }
    return map;
  }, [drivers]);

  // Compute SVG viewBox dimensions & scale functions based on coordinate bounds
  const { viewBox, scaleX, scaleY, trackOutlinePath } = useMemo(() => {
    const defaultView = {
      viewBox: '0 0 600 450',
      scaleX: (x: number) => x,
      scaleY: (y: number) => y,
      trackOutlinePath: '',
    };

    const locationList = Array.from(locations.values());
    if (locationList.length === 0 && rawSamples.length === 0) {
      return defaultView;
    }

    const allPoints = rawSamples.length > 0 ? rawSamples : locationList;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of allPoints) {
      if (p.x === 0 && p.y === 0) continue; // skip uncalibrated 0,0 points
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) {
      return defaultView;
    }

    const pad = 40;
    const svgWidth = 600;
    const svgHeight = 450;

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const scaleXFn = (x: number) => pad + ((x - minX) / spanX) * (svgWidth - pad * 2);
    // Invert Y for standard 2D cartesian coordinates to SVG coordinate system
    const scaleYFn = (y: number) => svgHeight - (pad + ((y - minY) / spanY) * (svgHeight - pad * 2));

    // Build track outline path from raw location samples
    let pathD = '';
    const validSamples = rawSamples.filter((s) => s.x !== 0 || s.y !== 0);
    if (validSamples.length > 20) {
      pathD = validSamples
        .map((s, idx) => {
          const sx = scaleXFn(s.x);
          const sy = scaleYFn(s.y);
          return `${idx === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
        })
        .join(' ');
    }

    return {
      viewBox: `0 0 ${svgWidth} ${svgHeight}`,
      scaleX: scaleXFn,
      scaleY: scaleYFn,
      trackOutlinePath: pathD,
    };
  }, [locations, rawSamples]);

  const activeCarCount = locations.size;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl overflow-hidden shadow-sm relative',
        isFullscreen && 'fixed inset-4 z-50 rounded-2xl shadow-2xl bg-zinc-950 border-white/20',
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/5 bg-zinc-950/40 z-10">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-red-500" />
          <h3 className="font-black text-sm text-zinc-100 uppercase tracking-tight">
            Live Track Map
          </h3>
          <span className="text-[11px] font-mono text-zinc-400">
            ({activeCarCount} cars tracking)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-1 px-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            className="p-1 px-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            -
          </button>
          <button
            onClick={() => setZoom(1)}
            title="Reset Zoom"
            className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-zinc-950/90 flex items-center justify-center overflow-hidden">
        {activeCarCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-500 text-xs">
            <MapPin className="h-8 w-8 text-zinc-600 opacity-40 mb-2 animate-bounce" />
            <span>Waiting for car GPS coordinates...</span>
          </div>
        ) : (
          <svg
            viewBox={viewBox}
            className="w-full h-full select-none transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Background Grid Accent */}
            <defs>
              <pattern id="trackGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trackGrid)" />

            {/* Circuit Outline Trail */}
            {trackOutlinePath && (
              <path
                d={trackOutlinePath}
                fill="none"
                stroke="#3f3f46"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
            )}
            {trackOutlinePath && (
              <path
                d={trackOutlinePath}
                fill="none"
                stroke="#71717a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            )}

            {/* Car Dots */}
            {Array.from(locations.values()).map((loc) => {
              const driver = driverMap.get(loc.driverNumber);
              return (
                <CarDot
                  key={loc.driverNumber}
                  location={loc}
                  driver={driver}
                  isSelected={selectedDriverNumber === loc.driverNumber}
                  scaleX={scaleX}
                  scaleY={scaleY}
                  onClick={onSelectDriver}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
