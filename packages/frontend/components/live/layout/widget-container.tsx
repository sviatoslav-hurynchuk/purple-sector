'use client';

import React from 'react';
import type { WidgetConfig } from '@/types/live-layout';
import { cn } from '@/lib/utils';

interface WidgetContainerProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  className?: string;
}

export function WidgetContainer({ widget, children, className }: WidgetContainerProps) {
  if (!widget.enabled) {
    return null;
  }

  // Map span to 12-column grid classes
  const spanClass = {
    full: 'col-span-12',
    'two-thirds': 'col-span-12 lg:col-span-8',
    half: 'col-span-12 lg:col-span-6',
    third: 'col-span-12 lg:col-span-4',
  }[widget.span || 'full'];

  return (
    <div className={cn('w-full transition-all duration-200', spanClass, className)}>
      {children}
    </div>
  );
}
