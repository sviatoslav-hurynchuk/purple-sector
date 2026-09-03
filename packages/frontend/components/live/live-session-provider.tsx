'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLiveSession, type UseLiveSessionReturn } from '@/hooks/use-live-session';

export const LiveSessionContext = createContext<UseLiveSessionReturn | null>(null);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const session = useLiveSession();

  return (
    <LiveSessionContext.Provider value={session}>
      {children}
    </LiveSessionContext.Provider>
  );
}

export function useSharedLiveSession(): UseLiveSessionReturn {
  const context = useContext(LiveSessionContext);
  if (!context) {
    throw new Error('useSharedLiveSession must be used within a LiveSessionProvider');
  }
  return context;
}
