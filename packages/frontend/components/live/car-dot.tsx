'use client';

import React from 'react';
import type { LiveDriverState } from '@/types/f1';
import type { DriverLatestLocation } from '@/hooks/use-track-positions';
import { cn } from '@/lib/utils';

interface CarDotProps {
  location: DriverLatestLocation;
  driver?: LiveDriverState;
  isSelected?: boolean;
  scaleX: (x: number) => number;
  scaleY: (y: number) => number;
  onClick?: (driverNumber: number) => void;
}

export function CarDot({
  location,
  driver,
  isSelected = false,
  scaleX,
  scaleY,
  onClick,
}: CarDotProps) {
  const cx = scaleX(location.x);
  const cy = scaleY(location.y);
  const teamColor = driver?.teamColour || '#e10600';
  const code = driver?.code || `#${location.driverNumber}`;
  const pos = driver?.position;

  return (
    <g
      onClick={() => onClick?.(location.driverNumber)}
      className="cursor-pointer transition-all duration-1000 ease-out group"
      style={{
        transform: `translate(${cx}px, ${cy}px)`,
      }}
    >
      {/* Selected Halo Ring */}
      {isSelected && (
        <circle
          r="14"
          fill="none"
          stroke={teamColor}
          strokeWidth="2"
          className="animate-ping opacity-75"
        />
      )}

      {/* Car Base Dot */}
      <circle
        r={isSelected ? '9' : '7'}
        fill={teamColor}
        stroke="#ffffff"
        strokeWidth={isSelected ? '2' : '1.5'}
        className="drop-shadow-md transition-all group-hover:scale-125"
      />

      {/* Driver Label */}
      <text
        y="-11"
        textAnchor="middle"
        className={cn(
          'text-[9px] font-mono font-black select-none pointer-events-none fill-white',
          isSelected ? 'font-black scale-110' : 'opacity-85 group-hover:opacity-100'
        )}
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
      >
        {pos ? `P${pos} ${code}` : code}
      </text>
    </g>
  );
}
