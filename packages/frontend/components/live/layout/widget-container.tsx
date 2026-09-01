'use client';

import React, { useState } from 'react';
import type { WidgetConfig, WidgetSpan } from '@/types/live-layout';
import { useLiveLayout } from './live-layout-context';
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  EyeOff,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetContainerProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  className?: string;
}

export function WidgetContainer({ widget, children, className }: WidgetContainerProps) {
  const { setWidgetSpan, toggleMinimize, toggleWidget, reorderWidget } = useLiveLayout();
  const [showOptions, setShowOptions] = useState(false);

  if (!widget.enabled) {
    return null;
  }

  // Map span to 12-column grid classes
  const spanClass = {
    full: 'col-span-12',
    'two-thirds': 'col-span-12 lg:col-span-8',
    half: 'col-span-12 lg:col-span-6',
    third: 'col-span-12 lg:col-span-4',
  }[widget.span];

  return (
    <div
      className={cn(
        'group flex flex-col transition-all duration-200',
        spanClass,
        className
      )}
    >
      {/* Widget Control Strip */}
      <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-mono text-zinc-500 opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-zinc-400">{widget.title}</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 border border-white/5 uppercase">
            {widget.span}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Quick span toggle */}
          <div className="hidden sm:flex items-center bg-zinc-950/80 rounded border border-white/5 p-0.5 text-[9px]">
            {(['third', 'half', 'two-thirds', 'full'] as WidgetSpan[]).map((s) => (
              <button
                key={s}
                onClick={() => setWidgetSpan(widget.id, s)}
                className={cn(
                  'px-1.5 py-0.5 rounded uppercase font-bold transition-colors',
                  widget.span === s ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'
                )}
                title={`Set width to ${s}`}
              >
                {s === 'two-thirds' ? '2/3' : s === 'third' ? '1/3' : s === 'half' ? '1/2' : 'Full'}
              </button>
            ))}
          </div>

          {/* Move Reorder */}
          <button
            onClick={() => reorderWidget(widget.id, 'up')}
            title="Move Earlier"
            className="p-1 rounded hover:bg-white/5 hover:text-zinc-200 transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            onClick={() => reorderWidget(widget.id, 'down')}
            title="Move Later"
            className="p-1 rounded hover:bg-white/5 hover:text-zinc-200 transition-colors"
          >
            <ArrowDown className="h-3 w-3" />
          </button>

          {/* Minimize / Expand */}
          <button
            onClick={() => toggleMinimize(widget.id)}
            title={widget.minimized ? 'Expand' : 'Minimize'}
            className="p-1 rounded hover:bg-white/5 hover:text-zinc-200 transition-colors"
          >
            {widget.minimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>

          {/* Hide */}
          <button
            onClick={() => toggleWidget(widget.id)}
            title="Hide Widget"
            className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <EyeOff className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      {!widget.minimized ? (
        <div className="w-full">{children}</div>
      ) : (
        <div
          onClick={() => toggleMinimize(widget.id)}
          className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-500 text-xs font-mono flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors"
        >
          <span>{widget.title} (Minimized)</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
