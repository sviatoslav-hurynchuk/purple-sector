'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { Race } from '@/types/f1';
import { cn } from '@/lib/utils';
import {
  type SessionCode,
  getRaceCalendarSessions,
  generateRaceWeekendICS,
  downloadICS,
} from '@/lib/ics-generator';
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  getWebcalSubscribeUrl,
} from '@/lib/calendar-links';

export interface AddToCalendarMenuProps {
  /** Optional race. If provided, enables single-weekend export and session picker */
  race?: Race;
  /** Championship season year */
  season: number | string;
  /** Visual variant: full button with text, or compact icon button */
  variant?: 'full' | 'compact';
  /** Button style variant: 'primary' (vibrant F1 red) or 'default' (zinc) */
  triggerVariant?: 'primary' | 'default';
  /** Extra trigger class names */
  className?: string;
  /** Custom label for the button */
  label?: string;
}

const SESSION_DISPLAY_NAMES: Record<SessionCode, string> = {
  P1: 'FP1',
  P2: 'FP2',
  P3: 'FP3',
  SQ: 'Sprint Qualy',
  SPRINT: 'Sprint',
  QUALY: 'Qualifying',
  RACE: 'Race',
};

export function AddToCalendarMenu({
  race,
  season,
  variant = 'full',
  triggerVariant = 'primary',
  className,
  label = 'Add to Calendar',
}: AddToCalendarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Available sessions for the given race
  const availableSessions = useMemo(() => {
    return race ? getRaceCalendarSessions(race) : [];
  }, [race]);

  // Selected session codes (default to all available sessions)
  const [selectedSessionCodes, setSelectedSessionCodes] = useState<SessionCode[]>(() =>
    availableSessions.map((s) => s.code)
  );

  // Sync state during render if race changes (React pattern: adjusting state based on props)
  const [prevRaceKey, setPrevRaceKey] = useState<string | null>(
    race ? `${race.season}-${race.round}` : null
  );
  const currentRaceKey = race ? `${race.season}-${race.round}` : null;
  if (prevRaceKey !== currentRaceKey) {
    setPrevRaceKey(currentRaceKey);
    setSelectedSessionCodes(availableSessions.map((s) => s.code));
  }

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleSession = (code: SessionCode) => {
    setSelectedSessionCodes((prev) => {
      if (prev.includes(code)) {
        // Keep at least one session selected
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const selectAllSessions = () => {
    setSelectedSessionCodes(availableSessions.map((s) => s.code));
  };

  // Primary session for 1-click Google/Outlook (prefers RACE, else first selected)
  const primarySessionCode = useMemo(() => {
    if (selectedSessionCodes.includes('RACE')) return 'RACE';
    return selectedSessionCodes[0] ?? 'RACE';
  }, [selectedSessionCodes]);

  const googleUrl = race
    ? getGoogleCalendarUrl(race, { sessionCode: primarySessionCode })
    : null;

  const outlookUrl = race
    ? getOutlookCalendarUrl(race, { sessionCode: primarySessionCode })
    : null;

  const webcalUrl = useMemo(() => {
    return getWebcalSubscribeUrl(season);
  }, [season]);

  const handleDownloadWeekendICS = () => {
    if (!race) return;
    const content = generateRaceWeekendICS(race, {
      sessionCodes: selectedSessionCodes,
    });
    const safeName = race.raceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadICS(content, `f1-${race.season}-${safeName}.ics`);
    setIsOpen(false);
  };

  const handleCopyWebcal = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
      const input = document.createElement('input');
      input.value = webcalUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* ── Trigger Button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer select-none',
          triggerVariant === 'primary'
            ? 'bg-primary text-zinc-200 hover:text-white hover:bg-primary/85'
            : 'bg-zinc-900/80 hover:bg-white/10 text-zinc-300 hover:text-white',
          isOpen &&
            (triggerVariant === 'primary'
              ? 'border-white/20 bg-primary/80 text-white'
              : 'border-white/20 bg-white/10 text-white'),
          className
        )}
      >
        <Calendar
          className={cn(
            'size-3.5 shrink-0',
            triggerVariant === 'primary' ? 'text-zinc-200' : 'text-red-500'
          )}
        />
        {variant === 'full' && <span>{label}</span>}
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            triggerVariant === 'primary' ? 'text-zinc-300' : 'text-zinc-400',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* ── Dropdown Panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-[310px] sm:w-[340px] z-50 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-3.5 space-y-3.5 font-mono animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Section 1: Session Selector (Only if race provided) */}
          {race && availableSessions.length > 0 && (
            <div className="space-y-2 border-b border-white/10 pb-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Select Sessions</span>
                {selectedSessionCodes.length < availableSessions.length && (
                  <button
                    type="button"
                    onClick={selectAllSessions}
                    className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableSessions.map((session) => {
                  const isSelected = selectedSessionCodes.includes(session.code);
                  return (
                    <button
                      key={session.code}
                      type="button"
                      onClick={() => toggleSession(session.code)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-all border cursor-pointer min-h-[30px] flex items-center gap-1.5',
                        isSelected
                          ? 'border-red-500/40 bg-red-500/15 text-red-300 shadow-sm'
                          : 'border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 hover:border-white/10'
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          isSelected ? 'bg-red-400' : 'bg-zinc-600'
                        )}
                      />
                      <span>{SESSION_DISPLAY_NAMES[session.code] ?? session.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: This Weekend Exports (Only if race provided) */}
          {race && (
            <div className="space-y-1.5 border-b border-white/10 pb-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                This Weekend ({race.Circuit.Location.locality})
              </p>

              {/* Download .ics file */}
              <button
                type="button"
                onClick={handleDownloadWeekendICS}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="size-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Apple Calendar / Outlook</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Download .ics ({selectedSessionCodes.length} sessions)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold group-hover:text-zinc-300">
                  .ICS
                </span>
              </button>

              {/* Google Calendar Web Link */}
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="size-4 text-blue-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold">Google Calendar</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Add {SESSION_DISPLAY_NAMES[primarySessionCode]} to web calendar
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold group-hover:text-zinc-300">
                    WEB
                  </span>
                </a>
              )}

              {/* Outlook Web Deeplink */}
              {outlookUrl && (
                <a
                  href={outlookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="size-4 text-sky-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold">Outlook Web</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Add {SESSION_DISPLAY_NAMES[primarySessionCode]} to Outlook.com
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold group-hover:text-zinc-300">
                    WEB
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Section 3: Full Season Subscription */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Full {season} Championship
            </p>

            {/* Subscribe via Webcal (Live Feed) */}
            <a
              href={webcalUrl}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="size-4 text-amber-400 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                <div className="flex flex-col">
                  <span className="font-bold">Subscribe to Full Season</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Auto-updates with schedule changes
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold">
                WEBCAL
              </span>
            </a>

            {/* Copy Webcal Feed URL */}
            <button
              type="button"
              onClick={handleCopyWebcal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                {copied ? (
                  <Check className="size-4 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="size-4 text-zinc-400 group-hover:text-white shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="font-bold">
                    {copied ? 'Copied Feed URL!' : 'Copy Feed URL'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Paste in Google Calendar or CalDAV
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                {copied ? 'DONE' : 'COPY'}
              </span>
            </button>

            {/* Download Season .ICS File */}
            <a
              href={`/api/calendar/${season}`}
              download={`f1-${season}-season.ics`}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Download className="size-4 text-zinc-400 group-hover:text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Download All Rounds</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Offline .ics file with all 24 races
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                .ICS
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
