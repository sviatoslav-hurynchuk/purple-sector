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
  locations: CarLocationSample[];
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

const EMPTY_LOCATIONS = new Map<number, DriverLatestLocation>();
const EMPTY_SAMPLES: CarLocationSample[] = [];

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
  const requestIdRef = useRef(0);

  const [prevSessionKey, setPrevSessionKey] = useState(sessionKey);
  if (prevSessionKey !== sessionKey) {
    setPrevSessionKey(sessionKey);
    setLocations(new Map());
    setRawSamples([]);
    setError(null);
    setIsLoading(Boolean(sessionKey && enabled));
  }

  const fetchPositions = useCallback(async (explicitRequestId?: number) => {
    if (!sessionKey || !enabled) return;
    const currentRequestId = explicitRequestId ?? ++requestIdRef.current;

    try {
      const queryParams = new URLSearchParams({
        sessionKey: String(sessionKey),
        window: String(windowSeconds),
      });

      const res = await clientFetchNullable<MapPositionsResponse>(
        `/api/live/map/positions?${queryParams.toString()}`
      );

      if (isMountedRef.current && requestIdRef.current === currentRequestId && res?.locations) {
        setRawSamples(res.locations);

        // Group by driver and find the most recent sample
        const latestMap = new Map<number, DriverLatestLocation>();
        for (const s of res.locations) {
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
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        setError(err instanceof Error ? err.message : 'Failed to fetch car positions');
      }
    } finally {
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        setIsLoading(false);
      }
    }
  }, [sessionKey, windowSeconds, enabled]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!sessionKey || !enabled) {
      return;
    }

    const initTimer = setTimeout(() => {
      fetchPositions();
    }, 0);

    const interval = setInterval(() => {
      fetchPositions();
    }, pollIntervalMs);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, [sessionKey, enabled, pollIntervalMs, fetchPositions]);

  const isActive = Boolean(sessionKey && enabled);

  return {
    locations: isActive ? locations : EMPTY_LOCATIONS,
    rawSamples: isActive ? rawSamples : EMPTY_SAMPLES,
    isLoading: isActive ? isLoading : false,
    error: isActive ? error : null,
    refetch: fetchPositions,
  };
}
