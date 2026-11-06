'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { RaceHighlight } from '@/types/f1';
import {
  Radio,
  Play,
  Pause,
  X,
  ExternalLink,
} from 'lucide-react';
import { fetchRadioTranscript, getProxiedRadioAudioUrl } from '@/lib/api';
import { playF1RadioChime } from '@/lib/f1-radio-sound';
import { cn } from '@/lib/utils';
import { WAVE_BARS, getWaveformBarStyle } from '@/lib/f1-waveform';

interface BestRaceRadioRibbonProps {
  highlights: RaceHighlight[];
  season: number | string;
  round: number | string;
  className?: string;
  seamless?: boolean;
}

/**
 * BestRaceRadioRibbon renders the apex 4-tile F1 cockpit radio highlight bar
 * displayed on the Grand Prix details page, replacing generic telemetry distance cells.
 * It provides top 3 curated audio broadcast moments with synchronized, GPU-accelerated
 * frequency waveforms, authentic F1 broadcast chimes, and live speech-to-text quotes.
 */
export function BestRaceRadioRibbon({
  highlights = [],
  season,
  round,
  className,
  seamless = false,
}: BestRaceRadioRibbonProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [transcriptsMap, setTranscriptsMap] = useState<Record<string, string>>({});

  const inFlightTranscriptsRef = useRef<Set<string>>(new Set());
  const playRequestRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceConnectedRef = useRef<boolean>(false);

  // Pick top 3 most significant, distinct-driver highlights (filtering out 1-sec static/bleeps)
  const bestHighlights = useMemo(() => {
    if (!highlights || highlights.length === 0) return [];

    // Filter out invalid/empty/bleeped noise clips using Unicode letter/number support
    const valid = highlights.filter((h) => {
      // 1. If transcript is present, filter out "." or single characters or whitespace
      const text = h.transcript || transcriptsMap[h.id];
      if (text != null) {
        const alphanumeric = text.replace(/[^\p{L}\p{N}]/gu, '').trim();
        if (alphanumeric.length < 3) return false;
      }
      // 2. Filter out lap 1 generic team_radio checks (which are 99% static/bleeps)
      if (h.lap <= 1 && h.category === 'team_radio') {
        return false;
      }
      return true;
    });

    const candidates = valid;

    // Calculate quality ranking score for each highlight
    const scored = candidates.map((h) => {
      let qScore = h.significanceScore || 50;

      // Category priorities
      if (h.category === 'victory') qScore += 100;
      else if (h.category === 'dnf') qScore += 60;
      else if (h.category === 'safety_car' || h.category === 'vsc' || h.category === 'red_flag') qScore += 50;
      else if (h.category === 'pit_stop') qScore += 40;

      // Heavily penalize lap 1 generic radios
      if (h.lap <= 1 && h.category === 'team_radio') {
        qScore -= 80;
      }

      // Bonus for clips with substantial speech (Unicode-aware)
      const text = h.transcript || transcriptsMap[h.id];
      if (text) {
        const letters = text.replace(/[^\p{L}]/gu, '').length;
        if (letters > 20) qScore += 25;
        else if (letters < 4) qScore -= 60;
      }

      // Bonus for late race drama
      if (h.lap >= 45) qScore += 15;

      return { highlight: h, score: qScore };
    });

    // Sort descending by calculated quality score
    scored.sort((a, b) => b.score - a.score);

    // Pick top 3 ensuring distinct drivers whenever possible
    const picked: RaceHighlight[] = [];
    const seenDrivers = new Set<number>();

    // 1. Pick top distinct drivers
    for (const item of scored) {
      if (!seenDrivers.has(item.highlight.driverNumber) && picked.length < 3) {
        picked.push(item.highlight);
        seenDrivers.add(item.highlight.driverNumber);
      }
    }

    // 2. Fill if fewer than 3 distinct drivers found
    for (const item of scored) {
      if (picked.length >= 3) break;
      if (!picked.some((p) => p.id === item.highlight.id)) {
        picked.push(item.highlight);
      }
    }

    return picked;
  }, [highlights, transcriptsMap]);

  // Stop playback when the active highlight leaves the selected set
  useEffect(() => {
    if (playingId === null || bestHighlights.some((h) => h.id === playingId)) return;
    playRequestRef.current += 1;
    audioRef.current?.pause();
    fallbackAudioRef.current?.pause();
    const timer = setTimeout(() => {
      setPlayingId(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [playingId, bestHighlights]);

  // Web Audio pipeline
  const initWebAudio = useCallback(() => {
    if (typeof window === 'undefined' || !audioRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      const ctx = audioCtxRef.current;
      if (!gainNodeRef.current || !compressorRef.current) {
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-24, ctx.currentTime);
        comp.knee.setValueAtTime(10, ctx.currentTime);
        comp.ratio.setValueAtTime(6, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.2, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.value = 0.85;

        comp.connect(gain);
        gain.connect(ctx.destination);

        compressorRef.current = comp;
        gainNodeRef.current = gain;
      }

      if (!sourceConnectedRef.current && audioRef.current && compressorRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(compressorRef.current);
        sourceConnectedRef.current = true;
      }
    } catch {
      // AudioContext fallback
    }
  }, []);

  // Cleanup Web Audio on unmount
  useEffect(() => {
    const audioEl = audioRef.current;
    const fallbackAudioEl = fallbackAudioRef.current;
    return () => {
      audioEl?.pause();
      fallbackAudioEl?.pause();
      gainNodeRef.current?.disconnect();
      compressorRef.current?.disconnect();
      sourceConnectedRef.current = false;

      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      gainNodeRef.current = null;
      compressorRef.current = null;

      if (ctx && ctx.state !== 'closed') {
        void ctx.close().catch(() => {});
      }
    };
  }, []);

  // Keyboard accessibility shortcuts: Space to toggle pause/play, Esc to close
  useEffect(() => {
    if (!playingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
        if (fallbackAudioRef.current && !fallbackAudioRef.current.paused) fallbackAudioRef.current.pause();
        setPlayingId(null);
      } else if (e.code === 'Space') {
        e.preventDefault();
        const audio = audioRef.current;
        const fallbackAudio = fallbackAudioRef.current;
        if (audio && audio.src) {
          if (audio.paused) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
          }
        } else if (fallbackAudio && fallbackAudio.src) {
          if (fallbackAudio.paused) {
            fallbackAudio.play().catch(() => {});
          } else {
            fallbackAudio.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingId]);

  // Playback control
  const handlePlayToggle = useCallback(
    (highlight: RaceHighlight, initialSeekRatio?: number) => {
      const audio = audioRef.current;
      const fallbackAudio = fallbackAudioRef.current;
      if (!audio) return;

      initWebAudio();

      if (playingId === highlight.id && initialSeekRatio === undefined) {
        playRequestRef.current += 1;
        if (!audio.paused) audio.pause();
        if (fallbackAudio && !fallbackAudio.paused) fallbackAudio.pause();
        setPlayingId(null);
      } else {
        if (!audio.paused) audio.pause();
        if (fallbackAudio && !fallbackAudio.paused) fallbackAudio.pause();

        setPlayingId(highlight.id);

        const requestId = ++playRequestRef.current;
        const proxiedUrl = getProxiedRadioAudioUrl(highlight.radioClip.recordingUrl);
        try {
          audio.crossOrigin = 'anonymous';
        } catch {
          // ignore
        }
        audio.src = proxiedUrl;
        audio.volume = sourceConnectedRef.current ? 1 : 0.85;
        audio.load();
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);

        playF1RadioChime(0.85).finally(() => {
          if (!audioRef.current || requestId !== playRequestRef.current) return;

          if (typeof initialSeekRatio === 'number' && audioRef.current.duration) {
            audioRef.current.currentTime = initialSeekRatio * audioRef.current.duration;
            setCurrentTime(audioRef.current.currentTime);
          }

          audioRef.current
            .play()
            .then(() => {
              if (requestId === playRequestRef.current) {
                setPlayingId(highlight.id);
                if (typeof initialSeekRatio === 'number' && audioRef.current?.duration) {
                  audioRef.current.currentTime = initialSeekRatio * audioRef.current.duration;
                  setCurrentTime(audioRef.current.currentTime);
                }
              }
            })
            .catch(() => {
              const fb = fallbackAudioRef.current;
              if (fb && requestId === playRequestRef.current) {
                fb.src = highlight.radioClip.recordingUrl;
                fb.volume = 0.85;
                if (typeof initialSeekRatio === 'number' && fb.duration) {
                  fb.currentTime = initialSeekRatio * fb.duration;
                  setCurrentTime(fb.currentTime);
                }
                fb
                  .play()
                  .then(() => {
                    if (requestId === playRequestRef.current) {
                      setPlayingId(highlight.id);
                    }
                  })
                  .catch(() => {
                    if (requestId === playRequestRef.current) {
                      setPlayingId(null);
                    }
                  });
              }
            });
        });

        // Background Whisper transcription
        const existingTranscript = highlight.transcript || transcriptsMap[highlight.id];
        if (!existingTranscript && !inFlightTranscriptsRef.current.has(highlight.id)) {
          inFlightTranscriptsRef.current.add(highlight.id);
          fetchRadioTranscript(highlight.radioClip.recordingUrl, highlight.driverNumber)
            .then((res) => {
              if (res?.transcript) {
                setTranscriptsMap((prev) => ({ ...prev, [highlight.id]: res.transcript! }));
              }
            })
            .catch(() => {})
            .finally(() => {
              inFlightTranscriptsRef.current.delete(highlight.id);
            });
        }
      }
    },
    [playingId, initWebAudio, transcriptsMap]
  );

  // Waveform click seeking handler
  const handleWaveformSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, highlight: RaceHighlight) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = clickX / rect.width;

      const audio = audioRef.current;
      const fallbackAudio = fallbackAudioRef.current;

      if (playingId === highlight.id && duration > 0) {
        const targetTime = ratio * duration;
        if (audio && !isNaN(targetTime)) {
          audio.currentTime = targetTime;
          setCurrentTime(targetTime);
        }
        if (fallbackAudio && !isNaN(targetTime)) {
          fallbackAudio.currentTime = targetTime;
        }
      } else {
        handlePlayToggle(highlight, ratio);
      }
    },
    [playingId, duration, handlePlayToggle]
  );

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderCategoryLabel = (category: string) => {
    if (category === 'victory') {
      return (
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-yellow-400 uppercase tracking-wider">
          VICTORY
        </span>
      );
    }
    if (category === 'safety_car' || category === 'vsc' || category === 'red_flag') {
      return (
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">
          {category === 'safety_car' ? 'SC' : category === 'vsc' ? 'VSC' : 'RED FLAG'}
        </span>
      );
    }
    if (category === 'pit_stop') {
      return (
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
          PIT
        </span>
      );
    }
    if (category === 'dnf') {
      return (
        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
          DNF
        </span>
      );
    }
    return null;
  };

  if (!bestHighlights || bestHighlights.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        seamless
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[120px_1fr_1fr_1fr] bg-zinc-950 relative transition-all w-full divide-y sm:divide-y-0 divide-zinc-800/80 sm:[&>*:not(:last-child)]:border-r sm:[&>*:not(:last-child)]:border-zinc-800/80'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/10 bg-zinc-950/90 shadow-xl backdrop-blur-sm relative transition-all max-lg:[&>*:nth-child(-n+2)]:border-b max-lg:[&>*:nth-child(-n+2)]:border-white/10 max-lg:[&>*:nth-child(odd)]:border-r max-lg:[&>*:nth-child(odd)]:border-white/10 lg:[&>*:not(:last-child)]:border-r lg:[&>*:not(:last-child)]:border-white/10',
        playingId ? 'z-40' : 'z-20',
        className
      )}
    >
      {/* Invisible global audio elements */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          setPlayingId(null);
          setCurrentTime(0);
        }}
        onError={() => {
          setPlayingId(null);
          setCurrentTime(0);
        }}
      />
      <audio
        ref={fallbackAudioRef}
        preload="none"
        onTimeUpdate={() => {
          if (fallbackAudioRef.current) setCurrentTime(fallbackAudioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (fallbackAudioRef.current) setDuration(fallbackAudioRef.current.duration || 0);
        }}
        onEnded={() => {
          setPlayingId(null);
          setCurrentTime(0);
        }}
        onError={() => {
          setPlayingId(null);
          setCurrentTime(0);
        }}
      />

      {/* ── Tile 1: BEST RACE RADIO Title Cell (clean, static without pulsing) ── */}
      <div className={cn(
        'py-2.5 sm:py-3 flex items-center justify-center transition-colors bg-zinc-950 select-none shrink-0',
        seamless ? 'px-2 sm:px-2.5' : 'px-4 sm:px-5'
      )}>
        <div className="font-black font-mono text-white leading-tight flex items-center gap-1.5 sm:gap-2">
          <Radio className="size-3.5 sm:size-4 text-red-500 shrink-0" />
          <span className={cn(
            'font-black font-mono uppercase tracking-wider',
            seamless ? 'text-[11px] sm:text-xs leading-tight' : 'text-sm sm:text-base'
          )}>
            BEST RACE<br className="block" />RADIO
          </span>
        </div>
      </div>

      {/* ── Tiles 2, 3, 4: Top 3 Radio Highlights (1:1 with User Sketch) ── */}
      {bestHighlights.map((hl) => {
        const isPlaying = playingId === hl.id;
        const livery = hl.teamColour || '#e10600';
        const surname = hl.title.replace(/\s*RADIO$/i, '') || hl.driverName.split(' ').pop() || '';
        const displayQuote = transcriptsMap[hl.id] || hl.transcript;

        return (
          <div
            key={hl.id}
            data-highlight-id={hl.id}
            onClick={() => handlePlayToggle(hl)}
            className={cn(
              'relative py-2 sm:py-2.5 px-2.5 sm:px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer select-none group min-h-[60px] min-w-0',
              isPlaying ? 'bg-white/[0.04] z-50' : 'hover:bg-white/[0.02] z-10'
            )}
          >
            {/* ── MINI VERSION (Document flow: Matching user sketch) ── */}
            {/* Left team livery bar */}
            <span
              className="w-1 self-stretch rounded-full shrink-0 transition-transform group-hover:scale-y-105"
              style={{ backgroundColor: livery }}
            />

            {/* Center Info Block: Row 1 (Identity & Category), Row 2 (#num · Llap & Waveform) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1 py-0.5">
              {/* Row 1: SURNAME ... CATEGORY */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span
                  className="text-xs font-black font-mono tracking-tight uppercase truncate"
                  style={{ color: livery }}
                  title={`${surname} #${hl.driverNumber}`}
                >
                  {surname}
                </span>

                <div className="shrink-0">
                  {renderCategoryLabel(hl.category)}
                </div>
              </div>

              {/* Row 2: #NUM · LLAP + Waveform visualizer */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                  #{hl.driverNumber} · L{hl.lap}
                </span>

                {/* Waveform visualizer in team color (frameless & borderless, buttery smooth 60/120fps) */}
                <div
                  onClick={(e) => handleWaveformSeek(e, hl)}
                  className="flex items-center gap-[2px] h-4 overflow-hidden flex-1 max-w-[70px] sm:max-w-[85px] cursor-pointer hover:opacity-85 transition-opacity"
                  title="Click to seek"
                >
                  {WAVE_BARS.slice(0, 12).map((heightPct, idx) => {
                    const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
                    const playedBarsCount = Math.floor(progressRatio * 12);
                    const isPlayed = isPlaying && idx <= playedBarsCount;

                    return (
                      <span
                        key={idx}
                        className="w-[2px] rounded-full shrink-0"
                        style={getWaveformBarStyle({
                          idx,
                          isPlaying,
                          baseHeightPct: heightPct,
                          isPlayed,
                          livery,
                        })}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Far Right: Circular Play Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayToggle(hl);
              }}
              className={cn(
                'size-7 sm:size-7.5 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md',
                isPlaying
                  ? 'bg-white text-black ring-2 ring-white/30'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              )}
              aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
            >
              {isPlaying ? (
                <Pause className="size-3 fill-black" />
              ) : (
                <Play className="size-3 fill-white ml-0.5" />
              )}
            </button>

            {/* ── EXPANDED OVERLAY (Solid opaque background, no transmission icon) ── */}
            {isPlaying && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'absolute z-50 top-0 left-0 right-0',
                  seamless
                    ? 'rounded-b-xl border-x border-b border-white/20'
                    : 'sm:-top-2 sm:-left-2 sm:-right-2 rounded-2xl border border-white/20',
                  'bg-zinc-950 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.95)] p-3 sm:p-3.5 space-y-2 select-none animate-in fade-in zoom-in-95 duration-150'
                )}
              >
                {/* Top team livery accent stripe */}
                <div
                  className="h-1 -mx-3.5 -mt-3.5 mb-2 rounded-t-2xl transition-all"
                  style={{ backgroundColor: livery }}
                />

                {/* Header: Title, Driver number, Lap badge & Close button (without broadcast icon) */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-1.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: livery }}
                    />
                    <span className="text-xs font-black font-mono text-white tracking-wider uppercase truncate">
                      {hl.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-black" style={{ color: livery }}>
                      #{hl.driverNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-zinc-900/80">
                      Lap {hl.lap}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(hl)}
                      className="size-5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors ml-0.5"
                      aria-label="Close radio"
                      title="Close"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Team Name & Category Badge */}
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400">
                  <span className="truncate">{hl.teamName || 'Formula 1 Team'}</span>
                  {renderCategoryLabel(hl.category)}
                </div>

                {/* Waveform Section */}
                <div className="bg-zinc-900/90 border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayToggle(hl)}
                    className="size-6 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow transition-transform active:scale-95"
                    aria-label="Pause radio"
                  >
                    <Pause className="size-3 fill-black" />
                  </button>

                  <div
                    onClick={(e) => handleWaveformSeek(e, hl)}
                    className="flex-1 flex items-center justify-center gap-[2px] h-6 overflow-hidden px-1 cursor-pointer hover:opacity-85 transition-opacity"
                    title="Click to seek"
                  >
                    {WAVE_BARS.map((heightPct, idx) => {
                      const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
                      const playedBarsCount = Math.floor(progressRatio * WAVE_BARS.length);
                      const isPlayed = idx <= playedBarsCount;

                      return (
                        <span
                          key={idx}
                          className="w-[2.5px] rounded-full"
                          style={getWaveformBarStyle({
                            idx,
                            isPlaying: true,
                            baseHeightPct: heightPct,
                            isPlayed,
                            livery,
                          })}
                        />
                      );
                    })}
                  </div>

                  <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums shrink-0">
                    {formatSecs(currentTime)} / {formatSecs(duration)}
                  </span>
                </div>

                {/* Live Whisper Speech-to-Text Quotation */}
                <div className="pt-0.5 space-y-1.5">
                  <p className="text-xs font-mono font-bold text-zinc-100 italic leading-snug line-clamp-3">
                    {displayQuote
                      ? displayQuote.startsWith('"')
                        ? displayQuote
                        : `"${displayQuote}"`
                      : hl.description.replace(/\s*(?:·|on|-)\s*Lap\s*\d+\s*$/i, '')}
                  </p>

                  <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Lap trace:</span>
                    <Link
                      href={`/calendar/${round}/laps?season=${season}&lap=${hl.lap}`}
                      className="text-zinc-300 hover:text-white flex items-center gap-1 font-bold transition-colors"
                    >
                      <span>Jump to Lap {hl.lap}</span>
                      <ExternalLink className="size-2.5 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
