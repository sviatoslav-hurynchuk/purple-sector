'use client';

import React, { useState, useCallback } from 'react';
import type { PitStopEntry, RaceResultEntry } from '@/types/f1';
import {
  Dialog, DialogPanel, DialogHeader, DialogClose, DialogTitle, DialogContent,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PitStopChronicle, pitStopKey } from './pit-stop-chronicle';
import { PitStopFastest } from './pit-stop-fastest';
import { PitStopDuel } from './pit-stop-duel';

interface PitStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pitStops: PitStopEntry[];
  raceResults: RaceResultEntry[];
  raceName: string;
  season: string;
  round: string;
}

/**
 * Modal dialog that houses the full Pit Stop Strategy panel.
 *
 * Layout (top → bottom):
 *   - Header: race name + "PIT STOP STRATEGY" title + close button
 *   - Tabs: "Chronicle" (chronological) | "Fastest" (ranked by duration)
 *   - Sticky footer: PitStopDuel (animated comparison), appears once ≥1 row is selected
 */
export function PitStopDialog({
  open,
  onOpenChange,
  pitStops,
  raceResults,
  raceName,
  season,
  round,
}: PitStopDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < 4) {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const totalStops = pitStops.length;
  // Count unique drivers
  const uniqueDrivers = new Set(pitStops.map((s) => s.driverId)).size;
  const fastestStop = [...pitStops].sort(
    (a, b) => parseFloat(a.duration) - parseFloat(b.duration)
  )[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPanel className="max-w-4xl">
        {/* Header */}
        <DialogHeader>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">
              {raceName} · {season} · Round {round}
            </p>
            <DialogTitle>Pit Stop Strategy</DialogTitle>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 font-mono">
              <span>{totalStops} stops</span>
              <span>{uniqueDrivers} drivers</span>
              {fastestStop && (
                <span>
                  Fastest:{' '}
                  <span className="text-primary font-bold">
                    {parseFloat(fastestStop.duration).toFixed(3)}s
                  </span>
                </span>
              )}
            </div>
            <DialogClose />
          </div>
        </DialogHeader>

        {/* Tabs + scrollable body */}
        <DialogContent>
          <Tabs defaultValue="chronicle" className="flex flex-col h-full">
            <div className="px-6 pt-4 pb-0 border-b border-zinc-800/60 shrink-0">
              <TabsList>
                <TabsTrigger value="chronicle">📋 Chronicle</TabsTrigger>
                <TabsTrigger value="fastest">🏆 Fastest Pit Stop</TabsTrigger>
              </TabsList>
              {selectedIds.size > 0 && (
                <span className="ml-3 text-xs text-primary font-mono">
                  {selectedIds.size} selected for Duel
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              <TabsContent value="chronicle">
                <PitStopChronicle
                  pitStops={pitStops}
                  raceResults={raceResults}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                />
              </TabsContent>

              <TabsContent value="fastest">
                <PitStopFastest
                  pitStops={pitStops}
                  raceResults={raceResults}
                  selectedIds={selectedIds}
                  onToggle={handleToggle}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>

        {/* Sticky Pit Stop Duel at the bottom */}
        <PitStopDuel
          pitStops={pitStops}
          raceResults={raceResults}
          selectedIds={selectedIds}
          onClear={handleClear}
        />
      </DialogPanel>
    </Dialog>
  );
}