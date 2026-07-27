'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getCircuitTrackLayoutUrl } from '@/lib/circuits';
import { cn } from '@/lib/utils';

interface TrackLayoutProps {
  circuitId: string;
  circuitName?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function TrackLayout({
  circuitId,
  circuitName,
  className,
  width = 160,
  height = 110,
}: TrackLayoutProps) {
  const [hasError, setHasError] = useState(false);
  const trackUrl = getCircuitTrackLayoutUrl(circuitId);

  if (!trackUrl || hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-500 text-xs font-mono shrink-0',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-base mb-1">🏁</span>
        <span className="truncate max-w-[120px] text-[11px] font-semibold text-zinc-400">
          {circuitName ?? circuitId}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md backdrop-blur-sm shrink-0 overflow-hidden',
        className
      )}
    >
      <Image
        src={trackUrl}
        alt={circuitName ? `${circuitName} track layout` : 'F1 Track layout'}
        width={width}
        height={height}
        className="object-contain filter invert opacity-90 hover:opacity-100 transition-opacity"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}
