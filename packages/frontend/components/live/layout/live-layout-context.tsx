'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  WidgetId,
  WidgetSpan,
  WidgetConfig,
  LayoutPreset,
  LiveLayoutState,
} from '@/types/live-layout';
import { PRESET_CONFIGS } from '@/types/live-layout';

const STORAGE_KEY = 'ps_live_layout_config_v2';

interface LiveLayoutContextValue {
  layout: LiveLayoutState;
  setPreset: (preset: LayoutPreset) => void;
  toggleWidget: (id: WidgetId) => void;
  setWidgetSpan: (id: WidgetId, span: WidgetSpan) => void;
  reorderWidget: (id: WidgetId, direction: 'up' | 'down') => void;
  toggleMinimize: (id: WidgetId) => void;
  resetLayout: () => void;
  isCustomized: boolean;
}

const LiveLayoutContext = createContext<LiveLayoutContextValue | null>(null);

export function LiveLayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = useState<LiveLayoutState>({
    preset: 'default',
    widgets: PRESET_CONFIGS.default,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LiveLayoutState;
        if (parsed.widgets && Array.isArray(parsed.widgets)) {
          // Merge with any newly added widgets to guarantee backward compatibility
          const existingIds = new Set(parsed.widgets.map((w) => w.id));
          const mergedWidgets = [...parsed.widgets];

          for (const defaultWidget of PRESET_CONFIGS.default) {
            if (!existingIds.has(defaultWidget.id)) {
              mergedWidgets.push(defaultWidget);
            }
          }

          setLayout({
            preset: parsed.preset || 'custom',
            widgets: mergedWidgets,
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveLayout = useCallback((nextState: LiveLayoutState) => {
    setLayout(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
  }, []);

  const setPreset = useCallback((preset: LayoutPreset) => {
    if (preset === 'custom') return;
    const nextWidgets = PRESET_CONFIGS[preset];
    saveLayout({
      preset,
      widgets: nextWidgets,
    });
  }, [saveLayout]);

  const toggleWidget = useCallback((id: WidgetId) => {
    setLayout((prev) => {
      const nextWidgets = prev.widgets.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      );
      const nextState: LiveLayoutState = {
        preset: 'custom',
        widgets: nextWidgets,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }, []);

  const setWidgetSpan = useCallback((id: WidgetId, span: WidgetSpan) => {
    setLayout((prev) => {
      const nextWidgets = prev.widgets.map((w) =>
        w.id === id ? { ...w, span } : w
      );
      const nextState: LiveLayoutState = {
        preset: 'custom',
        widgets: nextWidgets,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }, []);

  const reorderWidget = useCallback((id: WidgetId, direction: 'up' | 'down') => {
    setLayout((prev) => {
      const idx = prev.widgets.findIndex((w) => w.id === id);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.widgets.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const nextWidgets = [...prev.widgets];
      const temp = nextWidgets[idx];
      nextWidgets[idx] = nextWidgets[targetIdx];
      nextWidgets[targetIdx] = temp;

      const nextState: LiveLayoutState = {
        preset: 'custom',
        widgets: nextWidgets,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }, []);

  const toggleMinimize = useCallback((id: WidgetId) => {
    setLayout((prev) => {
      const nextWidgets = prev.widgets.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w
      );
      const nextState: LiveLayoutState = {
        ...prev,
        widgets: nextWidgets,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }, []);

  const resetLayout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setLayout({
      preset: 'default',
      widgets: PRESET_CONFIGS.default,
    });
  }, []);

  const isCustomized = layout.preset === 'custom';

  return (
    <LiveLayoutContext.Provider
      value={{
        layout,
        setPreset,
        toggleWidget,
        setWidgetSpan,
        reorderWidget,
        toggleMinimize,
        resetLayout,
        isCustomized,
      }}
    >
      {children}
    </LiveLayoutContext.Provider>
  );
}

export function useLiveLayout() {
  const ctx = useContext(LiveLayoutContext);
  if (!ctx) {
    throw new Error('useLiveLayout must be used within a LiveLayoutProvider');
  }
  return ctx;
}
