'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LiveStatusIndicatorProps {
  isActive?: boolean;
  isStreaming?: boolean;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveStatusIndicator({
  isActive = false,
  isStreaming = false,
  label,
  className,
  size = 'md',
}: LiveStatusIndicatorProps) {
  const dotSize = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }[size];

  const textSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  if (isActive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
          'bg-red-500/10 text-red-400 border border-red-500/20',
          textSize,
          className
        )}
      >
        <span className="relative flex">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75',
              dotSize
            )}
          />
          <span className={cn('relative inline-flex rounded-full bg-red-500', dotSize)} />
        </span>
        <span>{label ?? (isStreaming ? 'LIVE' : 'ACTIVE')}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-900/60 border border-white/5',
        textSize,
        className
      )}
    >
      <span className={cn('inline-flex rounded-full bg-zinc-600', dotSize)} />
      <span>{label ?? 'OFFLINE'}</span>
    </span>
  );
}
