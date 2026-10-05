import React from 'react';
import { cn } from '@/lib/utils';

export interface TelemetryRibbonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

/**
 * Monolithic telemetry summary ribbon container.
 * Centralizes the layout, border matrix, background, and sizing
 * for 2-4 cell KPI bars across the application.
 */
export function TelemetryRibbon({
  children,
  className,
  columns = 4,
  ...props
}: TelemetryRibbonProps) {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-2 lg:grid-cols-4';

  return (
    <div
      className={cn(
        'grid rounded-2xl border border-white/10 bg-zinc-950/90 divide-y sm:divide-y-0 sm:divide-x divide-white/10 overflow-hidden shadow-xl backdrop-blur-sm',
        colClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TelemetryRibbonCellProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Individual KPI metric tile within a TelemetryRibbon.
 * Standardizes vertical padding, internal spacing, and hover states.
 * Height can be adjusted centrally via py-2.5 sm:py-3.
 */
export function TelemetryRibbonCell({
  label,
  value,
  sub,
  children,
  className,
  ...props
}: TelemetryRibbonCellProps) {
  return (
    <div
      className={cn(
        'py-2.5 sm:py-3 px-4 sm:px-5 flex flex-col justify-between gap-1 transition-colors hover:bg-white/[0.02]',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {label && (
            <span className="text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider leading-none">
              {label}
            </span>
          )}
          {value && (
            <div className="text-xl sm:text-2xl font-black font-mono text-white leading-tight">
              {value}
            </div>
          )}
          {sub && (
            <div className="text-[11px] font-mono text-zinc-400 leading-tight truncate">
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Metric category label with standard typography and contrast */
export function TelemetryRibbonLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-zinc-400 text-xs font-mono uppercase font-bold tracking-wider leading-none',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** Primary metric value with bold monospace typography */
export function TelemetryRibbonValue({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-xl sm:text-2xl font-black font-mono text-white leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/** Metric subtitle or secondary annotation */
export function TelemetryRibbonSub({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'text-[11px] font-mono text-zinc-400 leading-tight truncate',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Animated skeleton placeholder for TelemetryRibbon with matching height and padding.
 */
export function TelemetryRibbonSkeleton({
  columns = 4,
  className,
}: {
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <TelemetryRibbon columns={columns} className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="py-2.5 sm:py-3 px-4 sm:px-5 flex flex-col justify-between gap-1.5 min-h-[76px]"
        >
          <div className="h-2.5 w-24 bg-zinc-800 rounded" />
          <div className="h-6 w-32 bg-zinc-800 rounded-md" />
          <div className="h-2 w-20 bg-zinc-800/60 rounded" />
        </div>
      ))}
    </TelemetryRibbon>
  );
}
