'use client';

import React, { useState, useEffect } from 'react';
import type { Race } from '@/types/f1';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeInTimezone } from '@/lib/timezones';
import { formatDateDDMMYYYY, formatDateInTimezone } from '@/lib/utils';
import { CountryFlag } from '@/components/f1/country-flag';
import { CountdownWidget } from '@/components/f1/countdown-widget';

interface NextRaceCardProps {
  race: Race;
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
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold text-primary">
                Next Race
              </CardDescription>
              <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                Round {race.round}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-black flex items-center gap-3">
                <span>{race.raceName}</span>
                <CountryFlag countryName={race.Circuit.Location.country} preload />
              </CardTitle>
              <CountdownWidget race={race} size="sm" showCountry={false} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {race.Circuit.circuitName} — {race.Circuit.Location.locality},{' '}
              {race.Circuit.Location.country}
            </p>
            {isClient && (
              <span className="text-[11px] text-muted-foreground font-mono mt-1 inline-block">
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
          {mainRaceInfo && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Race Day</p>
              <p className="font-semibold text-sm mt-0.5">{mainRaceInfo.formattedDate}</p>
            </div>
          )}
          {mainRaceInfo?.formattedTime && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Race Start</p>
              <p className="font-semibold text-sm text-primary font-mono mt-0.5">{mainRaceInfo.formattedTime}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
