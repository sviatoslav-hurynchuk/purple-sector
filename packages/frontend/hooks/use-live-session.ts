'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveSessionState, RaceEvent, WeatherSnapshot } from '@/types/f1';
import { clientFetchNullable } from '@/lib/api-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface UseLiveSessionOptions {
  /** Enable/disable connection (default: true) */
  enabled?: boolean;
  /** Auto-reconnect delay in ms for SSE (default: 3000) */
  reconnectDelay?: number;
  /** Fallback polling interval in ms when SSE is unavailable (default: 4000) */
  fallbackPollInterval?: number;
}

export interface UseLiveSessionReturn {
  state: LiveSessionState | null;
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useLiveSession(options: UseLiveSessionOptions = {}): UseLiveSessionReturn {
  const {
    enabled = true,
    reconnectDelay = 3000,
    fallbackPollInterval = 4000,
  } = options;

  const [state, setState] = useState<LiveSessionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Direct fetch snapshot
  const fetchSnapshot = useCallback(async () => {
    try {
      const data = await clientFetchNullable<LiveSessionState>('/api/live/state');
      if (isMountedRef.current) {
        if (data) {
          setState(data);
          setIsConnected(true);
          setError(null);
        } else {
          setIsConnected(false);
        }
      }
      return data;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch live state');
        setIsConnected(false);
      }
      return null;
    }
  }, []);

  // Connect SSE
  const connectSSE = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clean up existing
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const sseUrl = `${BACKEND_URL}/api/live/stream`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (isMountedRef.current) {
          setIsConnected(true);
          setIsStreaming(true);
          setError(null);
        }
      };

      es.addEventListener('state', (e: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(e.data) as LiveSessionState;
          setState(payload);
          setIsConnected(true);
          setIsStreaming(true);
        } catch {
          // ignore parse error
        }
      });

      es.addEventListener('raceControl', (e: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const newEvents = JSON.parse(e.data) as RaceEvent[];
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              raceControlFeed: [...prev.raceControlFeed, ...newEvents],
            };
          });
        } catch {
          // ignore parse error
        }
      });

      es.addEventListener('weather', (e: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const freshWeather = JSON.parse(e.data) as WeatherSnapshot;
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              weather: freshWeather,
            };
          });
        } catch {
          // ignore parse error
        }
      });

      es.onerror = () => {
        if (!isMountedRef.current) return;
        setIsStreaming(false);
        es.close();
        eventSourceRef.current = null;

        // Start fallback polling if SSE dropped
        if (enabled && !pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchSnapshot, fallbackPollInterval);
        }

        // Schedule SSE reconnect
        if (enabled && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            connectSSE();
          }, reconnectDelay);
        }
      };
    } catch {
      setIsStreaming(false);
      // Fallback to polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchSnapshot, fallbackPollInterval);
      }
    }
  }, [enabled, reconnectDelay, fallbackPollInterval, fetchSnapshot]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    fetchSnapshot();
    connectSSE();
  }, [fetchSnapshot, connectSSE]);

  useEffect(() => {
    isMountedRef.current = true;
    if (enabled) {
      fetchSnapshot();
      connectSSE();
    }

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, fetchSnapshot, connectSSE]);

  return {
    state,
    isConnected,
    isStreaming,
    error,
    reconnect,
  };
}
