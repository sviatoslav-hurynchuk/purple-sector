'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarTelemetrySample } from '@/types/f1';
import { clientFetchNullable } from '@/lib/api-client';

interface UseLiveTelemetryOptions {
  sessionKey?: number | null;
  driverNumber?: number | null;
  compareDriverNumber?: number | null;
  lapNumber?: number;
  windowSeconds?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

interface TelemetryResponse {
  sessionKey: number;
  driverNumber?: number;
  driver1?: number;
  driver2?: number;
  lapNumber?: number;
  windowSeconds?: number;
  samples?: CarTelemetrySample[];
  data?: {
    driver1: CarTelemetrySample[];
    driver2: CarTelemetrySample[];
  };
}

interface UseLiveTelemetryReturn {
  samples: CarTelemetrySample[];
  compareSamples: CarTelemetrySample[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLiveTelemetry(options: UseLiveTelemetryOptions = {}): UseLiveTelemetryReturn {
  const {
    sessionKey,
    driverNumber,
    compareDriverNumber,
    lapNumber,
    windowSeconds = 15,
    pollIntervalMs = 3500,
    enabled = true,
  } = options;

  const [samples, setSamples] = useState<CarTelemetrySample[]>([]);
  const [compareSamples, setCompareSamples] = useState<CarTelemetrySample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchTelemetry = useCallback(async () => {
    if (!driverNumber || !sessionKey || !enabled) return;

    try {
      if (compareDriverNumber) {
        // Comparison route
        const queryParams = new URLSearchParams({
          sessionKey: String(sessionKey),
          window: String(windowSeconds),
        });
        if (lapNumber) queryParams.set('lap', String(lapNumber));

        const res = await clientFetchNullable<TelemetryResponse>(
          `/api/live/telemetry/compare/${driverNumber}/${compareDriverNumber}?${queryParams.toString()}`
        );

        if (isMountedRef.current && res?.data) {
          setSamples(res.data.driver1 || []);
          setCompareSamples(res.data.driver2 || []);
          setError(null);
        }
      } else {
        // Single driver route
        const queryParams = new URLSearchParams({
          sessionKey: String(sessionKey),
          window: String(windowSeconds),
        });
        if (lapNumber) queryParams.set('lap', String(lapNumber));

        const res = await clientFetchNullable<TelemetryResponse>(
          `/api/live/telemetry/${driverNumber}?${queryParams.toString()}`
        );

        if (isMountedRef.current && res?.samples) {
          setSamples(res.samples);
          setCompareSamples([]);
          setError(null);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch telemetry');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionKey, driverNumber, compareDriverNumber, lapNumber, windowSeconds, enabled]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!driverNumber || !sessionKey || !enabled) {
      setSamples([]);
      setCompareSamples([]);
      return;
    }

    setIsLoading(true);
    fetchTelemetry();

    // Only poll continuously if not viewing a specific static completed lap
    if (!lapNumber) {
      const interval = setInterval(fetchTelemetry, pollIntervalMs);
      return () => {
        clearInterval(interval);
        isMountedRef.current = false;
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [sessionKey, driverNumber, compareDriverNumber, lapNumber, enabled, pollIntervalMs, fetchTelemetry]);

  return {
    samples,
    compareSamples,
    isLoading,
    error,
    refetch: fetchTelemetry,
  };
}
