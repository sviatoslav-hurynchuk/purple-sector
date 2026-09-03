'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CarLocationSample } from '@/types/f1';
import { clientFetchNullable } from '@/lib/api-client';

interface UseTrackPositionsOptions {
  sessionKey?: number | null;
  windowSeconds?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

interface MapPositionsResponse {
  sessionKey: number;
  windowSeconds: number;
  samples: CarLocationSample[];
}

export interface DriverLatestLocation {
  driverNumber: number;
  x: number;
  y: number;
  z: number;
  date: string;
}

interface UseTrackPositionsReturn {
  locations: Map<number, DriverLatestLocation>;
  rawSamples: CarLocationSample[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrackPositions(options: UseTrackPositionsOptions = {}): UseTrackPositionsReturn {
  const {
    sessionKey,
    windowSeconds = 5,
    pollIntervalMs = 2500,
    enabled = true,
  } = options;

  const [locations, setLocations] = useState<Map<number, DriverLatestLocation>>(new Map());
  const [rawSamples, setRawSamples] = useState<CarLocationSample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchPositions = useCallback(async () => {
    if (!sessionKey || !enabled) return;

    try {
      const queryParams = new URLSearchParams({
        sessionKey: String(sessionKey),
        window: String(windowSeconds),
      });

      const res = await clientFetchNullable<MapPositionsResponse>(
        `/api/live/map/positions?${queryParams.toString()}`
      );

      if (isMountedRef.current && res?.samples) {
        setRawSamples(res.samples);

        // Group by driver and find the most recent sample
        const latestMap = new Map<number, DriverLatestLocation>();
        for (const s of res.samples) {
          const existing = latestMap.get(s.driverNumber);
          if (!existing || new Date(s.date).getTime() > new Date(existing.date).getTime()) {
            latestMap.set(s.driverNumber, {
              driverNumber: s.driverNumber,
              x: s.x,
              y: s.y,
              z: s.z,
              date: s.date,
            });
          }
        }

        setLocations(latestMap);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch car positions');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionKey, windowSeconds, enabled]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!sessionKey || !enabled) {
      setLocations(new Map());
      setRawSamples([]);
      return;
    }

    setIsLoading(true);
    fetchPositions();

    const interval = setInterval(fetchPositions, pollIntervalMs);
    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, [sessionKey, enabled, pollIntervalMs, fetchPositions]);

  return {
    locations,
    rawSamples,
    isLoading,
    error,
    refetch: fetchPositions,
  };
}
