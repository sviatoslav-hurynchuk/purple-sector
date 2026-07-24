'use client';

import { useState, useEffect } from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMs: number;
  isReady: boolean;
}

/**
 * Custom React hook that calculates time remaining until a target Date.
 * Updates live every second. Safe against SSR hydration mismatches.
 */
export function useCountdown(targetDate?: Date | null): CountdownTime {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Initial sync
    setNow(new Date());

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!targetDate || !now) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      totalMs: 0,
      isReady: false,
    };
  }

  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: diff,
      isReady: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs: diff,
    isReady: true,
  };
}
