'use client';

import React, { useState } from 'react';
import { useLiveLayout } from './live-layout-context';
import type { LayoutPreset, WidgetId, WidgetSpan } from '@/types/live-layout';
import {
  Sliders,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Radio,
  Gauge,
  MapPin,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_DESCRIPTIONS: Record<
  Exclude<LayoutPreset, 'custom'>,
  { title: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  default: {
    title: 'Balanced',
    description: 'Standard 2-column view with timing tower, track map, telemetry, and race control.',
    icon: LayoutGrid,
  },
  pitwall: {
    title: 'Pitwall Engineer',
    description: 'Data-dense view with large timing tower, side-by-side telemetry, and race control feed.',
    icon: Gauge,
  },
  driver_focus: {
    title: 'Driver Focus',
    description: 'Expanded telemetry traces & speed telemetry with 2D track map.',
    icon: Radio,
  },
  track_radar: {
    title: 'Track Radar',
    description: 'Maximized 2D GPS track layout with car coordinates & race control messages.',
    icon: MapPin,
  },
};

export function LayoutCustomizerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    layout,
    setPreset,
    toggleWidget,
    setWidgetSpan,
    reorderWidget,
    resetLayout,
    isCustomized,
  } = useLiveLayout();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <Sliders className="h-3.5 w-3.5 text-primary" />
        <span>Customize Layout</span>
        {isCustomized && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Customized layout active" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-white/15 p-5 sm:p-6 shadow-2xl z-10 space-y-6 animate-in zoom-in-95 fade-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight uppercase">
                    Live Layout Customizer
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose a preset or customize widget visibility, order, and column widths.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Layout Presets
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  Object.keys(PRESET_DESCRIPTIONS) as Array<Exclude<LayoutPreset, 'custom'>>
                ).map((key) => {
                  const preset = PRESET_DESCRIPTIONS[key];
                  const Icon = preset.icon;
                  const isSelected = layout.preset === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setPreset(key)}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 group',
                        isSelected
                          ? 'bg-primary/10 border-primary text-white shadow-sm'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-900 hover:border-white/15'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0 transition-colors',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-zinc-800 text-zinc-400'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{preset.title}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Widgets List & Customizer */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Widgets &amp; Arrange
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Drag / reorder &amp; change width
                </span>
              </div>

              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-900/50 overflow-hidden">
                {layout.widgets.map((widget, idx) => (
                  <div
                    key={widget.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Widget Enable Toggle & Name */}
                    <div className="flex items-center gap-2.5 min-w-[180px]">
                      <button
                        onClick={() => toggleWidget(widget.id)}
                        className={cn(
                          'flex items-center justify-center h-6 w-6 rounded-md border transition-colors',
                          widget.enabled
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                        )}
                        title={widget.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                      >
                        {widget.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>

                      <div className="flex flex-col">
                        <span
                          className={cn(
                            'text-xs font-bold',
                            widget.enabled ? 'text-zinc-100' : 'text-zinc-500 line-through'
                          )}
                        >
                          {widget.title}
                        </span>
                      </div>
                    </div>

                    {/* Width Span Selector */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg bg-zinc-950 border border-white/10 p-0.5 text-[10px] font-mono">
                        {(['third', 'half', 'two-thirds', 'full'] as WidgetSpan[]).map((s) => (
                          <button
                            key={s}
                            disabled={!widget.enabled}
                            onClick={() => setWidgetSpan(widget.id, s)}
                            className={cn(
                              'px-2 py-1 rounded uppercase font-bold transition-colors disabled:opacity-30',
                              widget.span === s
                                ? 'bg-white/15 text-white'
                                : 'text-zinc-400 hover:text-zinc-200'
                            )}
                          >
                            {s === 'two-thirds' ? '2/3' : s === 'third' ? '1/3' : s === 'half' ? '1/2' : 'Full'}
                          </button>
                        ))}
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          disabled={idx === 0}
                          onClick={() => reorderWidget(widget.id, 'up')}
                          className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={idx === layout.widgets.length - 1}
                          onClick={() => reorderWidget(widget.id, 'down')}
                          className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button
                onClick={resetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Default</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
