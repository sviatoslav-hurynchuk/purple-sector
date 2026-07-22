'use client';

import React, { useState, useEffect } from 'react';
import type { Race } from '@/types/f1';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeInTimezone } from '@/lib/timezones';

interface NextRaceCardProps {
  race: Race;
}

/**
 * Formats YYYY-MM-DD date string to DD.MM.YYYY format.
 */
function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}

/**
 * Formats a Date object into DD.MM.YYYY string in a given timezone.
 */
function formatDateInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('uk-UA', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return formatter.format(date);
  } catch {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

export function NextRaceCard({ race }: NextRaceCardProps) {
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) setUserTimeZone(tz);
      } catch {
        setUserTimeZone('UTC');
      }
      setIsClient(true);
    }, 0);

    return () => clearTimeout(initTimer);
  }, []);

  // Helper to get formatted date & time for a session
  const getSessionInfo = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;

    let formattedDate = formatDateDDMMYYYY(dateStr);
    let formattedTime = timeStr ? timeStr.replace('Z', ' UTC') : null;

    if (isClient && timeStr) {
      const cleanTime = timeStr.endsWith('Z') ? timeStr : `${timeStr}Z`;
      const rawDate = new Date(`${dateStr}T${cleanTime}`);
      if (!isNaN(rawDate.getTime())) {
        formattedDate = formatDateInTimezone(rawDate, userTimeZone);
        formattedTime = formatTimeInTimezone(rawDate, userTimeZone);
      }
    }

    return { formattedDate, formattedTime };
  };

  const mainRaceInfo = getSessionInfo(race.date, race.time);
  const qualyInfo = race.Qualifying ? getSessionInfo(race.Qualifying.date, race.Qualifying.time) : null;
  const sprintInfo = race.Sprint ? getSessionInfo(race.Sprint.date, race.Sprint.time) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription className="mb-1 uppercase tracking-widest text-xs font-semibold text-primary">
              Next Race
            </CardDescription>
            <CardTitle className="text-2xl font-black">
              {race.raceName}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {race.Circuit.circuitName} — {race.Circuit.Location.locality},{' '}
              {race.Circuit.Location.country}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="outline" className="text-sm border-primary text-primary">
              Round {race.round}
            </Badge>
            {isClient && (
              <span className="text-[11px] text-muted-foreground font-mono">
                Local Time ({userTimeZone.split('/')[1]?.replace('_', ' ') ?? userTimeZone})
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {qualyInfo && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Qualifying</p>
              <p className="font-semibold text-sm mt-0.5">{qualyInfo.formattedDate}</p>
              {qualyInfo.formattedTime && (
                <p className="text-xs text-primary font-mono font-medium mt-0.5">{qualyInfo.formattedTime}</p>
              )}
            </div>
          )}
          {sprintInfo && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Sprint</p>
              <p className="font-semibold text-sm mt-0.5">{sprintInfo.formattedDate}</p>
              {sprintInfo.formattedTime && (
                <p className="text-xs text-primary font-mono font-medium mt-0.5">{sprintInfo.formattedTime}</p>
              )}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Race Day</p>
            <p className="font-semibold text-sm mt-0.5">{mainRaceInfo?.formattedDate}</p>
          </div>
          {mainRaceInfo?.formattedTime && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Race Start</p>
              <p className="font-semibold text-sm mt-0.5 text-primary font-mono">{mainRaceInfo.formattedTime}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
