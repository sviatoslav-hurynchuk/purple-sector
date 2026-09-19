'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore } from 'react';
import type {
  WidgetId,
  WidgetSpan,
  LayoutPreset,
  LiveLayoutState,
} from '@/types/live-layout';
import { PRESET_CONFIGS } from '@/types/live-layout';

const STORAGE_KEY = 'ps_live_layout_config_v3';
const LEGACY_STORAGE_KEY = 'ps_live_layout_config_v2';

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

const DEFAULT_LAYOUT_STATE: LiveLayoutState = {
  preset: 'default',
  widgets: PRESET_CONFIGS.default,
};

function normalizeLayout(parsed: LiveLayoutState): LiveLayoutState {
  if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
    return DEFAULT_LAYOUT_STATE;
  }

  // Filter out deprecated banner widget from legacy saves
  const cleaned = parsed.widgets.filter((w) => (w.id as string) !== 'banner');
  const existingIds = new Set(cleaned.map((w) => w.id));
  const mergedWidgets = [...cleaned];

  for (const defaultWidget of PRESET_CONFIGS.default) {
    if (!existingIds.has(defaultWidget.id)) {
      mergedWidgets.push(defaultWidget);
    }
  }

  return {
    preset: parsed.preset || 'custom',
    widgets: mergedWidgets,
  };
}

// In-memory store cache for useSyncExternalStore
let currentLayout: LiveLayoutState = DEFAULT_LAYOUT_STATE;
let lastRawStorage: string | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): LiveLayoutState {
  if (typeof window === 'undefined') {
    return DEFAULT_LAYOUT_STATE;
  }

  try {
    const v3Saved = localStorage.getItem(STORAGE_KEY);
    if (v3Saved) {
      if (v3Saved !== lastRawStorage) {
        lastRawStorage = v3Saved;
        const parsed = JSON.parse(v3Saved) as LiveLayoutState;
        currentLayout = normalizeLayout(parsed);
      }
      return currentLayout;
    }

    // Fall back to legacy v2 storage key if v3 is absent
    const v2Saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (v2Saved) {
      if (v2Saved !== lastRawStorage) {
        lastRawStorage = v2Saved;
        const parsed = JSON.parse(v2Saved) as LiveLayoutState;
        currentLayout = normalizeLayout(parsed);
        // Persist normalized layout under v3, then remove v2
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLayout));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      return currentLayout;
    }
  } catch {
    // ignore JSON parsing or storage access errors
  }

  if (lastRawStorage !== null) {
    lastRawStorage = null;
    currentLayout = DEFAULT_LAYOUT_STATE;
  }

  return currentLayout;
}

function getServerSnapshot(): LiveLayoutState {
  return DEFAULT_LAYOUT_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function LiveLayoutProvider({ children }: { children: React.ReactNode }) {
  // Synchronize state with external localStorage safely across SSR and hydration
  const layout = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveLayout = useCallback((nextState: LiveLayoutState) => {
    try {
      const serialized = JSON.stringify(nextState);
      lastRawStorage = serialized;
      currentLayout = nextState;
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // ignore quota exceeded or permission errors
    }
    notifyListeners();
  }, []);

  const updateLayout = useCallback(
    (updater: (prev: LiveLayoutState) => LiveLayoutState) => {
      const next = updater(currentLayout);
      saveLayout(next);
    },
    [saveLayout]
  );

  const setPreset = useCallback(
    (preset: LayoutPreset) => {
      if (preset === 'custom') return;
      const nextWidgets = PRESET_CONFIGS[preset];
      saveLayout({
        preset,
        widgets: nextWidgets,
      });
    },
    [saveLayout]
  );

  const toggleWidget = useCallback(
    (id: WidgetId) => {
      updateLayout((prev) => ({
        preset: 'custom',
        widgets: prev.widgets.map((w) =>
          w.id === id ? { ...w, enabled: !w.enabled } : w
        ),
      }));
    },
    [updateLayout]
  );

  const setWidgetSpan = useCallback(
    (id: WidgetId, span: WidgetSpan) => {
      updateLayout((prev) => ({
        preset: 'custom',
        widgets: prev.widgets.map((w) =>
          w.id === id ? { ...w, span } : w
        ),
      }));
    },
    [updateLayout]
  );

  const reorderWidget = useCallback(
    (id: WidgetId, direction: 'up' | 'down') => {
      updateLayout((prev) => {
        const idx = prev.widgets.findIndex((w) => w.id === id);
        if (idx === -1) return prev;
        if (direction === 'up' && idx === 0) return prev;
        if (direction === 'down' && idx === prev.widgets.length - 1) return prev;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const nextWidgets = [...prev.widgets];
        const temp = nextWidgets[idx];
        nextWidgets[idx] = nextWidgets[targetIdx];
        nextWidgets[targetIdx] = temp;

        return {
          preset: 'custom',
          widgets: nextWidgets,
        };
      });
    },
    [updateLayout]
  );

  const toggleMinimize = useCallback(
    (id: WidgetId) => {
      updateLayout((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === id ? { ...w, minimized: !w.minimized } : w
        ),
      }));
    },
    [updateLayout]
  );

  const resetLayout = useCallback(() => {
    try {
      lastRawStorage = null;
      currentLayout = DEFAULT_LAYOUT_STATE;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    notifyListeners();
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
