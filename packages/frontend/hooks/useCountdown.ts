'use client';

import { useSyncExternalStore } from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMs: number;
  isReady: boolean;
}

let currentNowMs = typeof window !== 'undefined' ? Date.now() : 0;
const listeners = new Set<() => void>();
let timer: NodeJS.Timeout | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (!timer) {
    timer = setInterval(() => {
      currentNowMs = Date.now();
      listeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getClientSnapshot = () => currentNowMs;
const getServerSnapshot = () => null;

export function useCountdown(targetDate?: Date | null): CountdownTime {
  const nowMs = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  if (!targetDate || nowMs === null) {
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

  const diff = targetDate.getTime() - nowMs;

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
