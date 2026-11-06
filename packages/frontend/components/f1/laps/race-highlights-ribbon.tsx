'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { RaceHighlight } from '@/types/f1';
import {
  Radio,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Trophy,
  AlertOctagon,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchRadioTranscript, getProxiedRadioAudioUrl } from '@/lib/api';
import { playF1RadioChime } from '@/lib/f1-radio-sound';
import { cn } from '@/lib/utils';
import { WAVE_BARS, getWaveformBarStyle } from '@/lib/f1-waveform';

interface RaceHighlightsRibbonProps {
  highlights: RaceHighlight[];
  currentLap: number;
  isReplayPlaying?: boolean;
  onLapChange?: (lap: number) => void;
  className?: string;
}

type FilterCategory = 'all' | 'safety_car' | 'pit_stop' | 'dnf' | 'victory';

export function RaceHighlightsRibbon({
  highlights = [],
  currentLap,
  isReplayPlaying = false,
  onLapChange,
  className,
}: RaceHighlightsRibbonProps) {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [graphReady, setGraphReady] = useState<boolean>(false);
  const [transcriptsMap, setTranscriptsMap] = useState<Record<string, string>>({});

  const inFlightTranscriptsRef = useRef<Set<string>>(new Set());
  const playRequestRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceConnectedRef = useRef<boolean>(false);

  // Initialize Web Audio graph on user gesture: Broadcast Compressor + Super Boost GainNode
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
        // 1. Broadcast vocal compressor: brings quiet whispering voices up while preventing clipping distortion
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-24, ctx.currentTime);
        comp.knee.setValueAtTime(10, ctx.currentTime);
        comp.ratio.setValueAtTime(6, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.2, ctx.currentTime);

        // 2. High-headroom GainNode for massive volume boost
        const gain = ctx.createGain();

        // Audio pipeline: source -> compressor -> gain -> destination
        comp.connect(gain);
        gain.connect(ctx.destination);

        compressorRef.current = comp;
        gainNodeRef.current = gain;
      }

      if (!sourceConnectedRef.current && audioRef.current && compressorRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(compressorRef.current);
        sourceConnectedRef.current = true;
        setGraphReady(true);
      }
    } catch {
      // AudioContext fallback
    }
  }, []);

  // Cleanup Web Audio resources on unmount
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

  // Sync volume with Web Audio GainNode and HTMLMediaElement fallback
  useEffect(() => {
    const userVolume = isMuted ? 0 : volume / 100;
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = userVolume;
    }
    if (audioRef.current) {
      // Standard HTMLMediaElement.volume is strictly clamped [0, 1]
      audioRef.current.volume = sourceConnectedRef.current
        ? 1
        : Math.min(1, Math.max(0, userVolume));
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.volume = userVolume;
    }
  }, [volume, isMuted, graphReady]);

  // Filtered highlights based on category and driver
  const filteredHighlights = useMemo(() => {
    let list = highlights;
    if (filter === 'safety_car') {
      list = list.filter((h) => h.category === 'safety_car' || h.category === 'vsc' || h.category === 'red_flag');
    } else if (filter !== 'all') {
      list = list.filter((h) => h.category === filter);
    }

    if (selectedDriver !== 'all') {
      list = list.filter((h) => String(h.driverNumber) === selectedDriver || h.driverId === selectedDriver);
    }
    return list;
  }, [highlights, filter, selectedDriver]);

  // Unique drivers for driver filter dropdown
  const uniqueDrivers = useMemo(() => {
    const map = new Map<string, { number: number; name: string; code?: string; teamColour?: string }>();
    for (const h of highlights) {
      const key = String(h.driverNumber);
      if (!map.has(key)) {
        map.set(key, {
          number: h.driverNumber,
          name: h.driverName,
          code: h.driverCode,
          teamColour: h.teamColour,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.number - b.number);
  }, [highlights]);

  // Mouse wheel horizontal scroll handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY * 1.1;
    }
  };

  // Replay Lap Synchronization: smooth auto-scroll when replaying laps
  useEffect(() => {
    if (!isReplayPlaying || currentLap <= 0 || !scrollContainerRef.current) return;
    const match = filteredHighlights.find((h) => h.lap === currentLap);
    if (match) {
      const el = scrollContainerRef.current.querySelector<HTMLElement>(`[data-highlight-id="${match.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentLap, isReplayPlaying, filteredHighlights]);

  // Audio Playback Controls with signature F1 TV radio intro chime & 200% Web Audio Gain
  const handlePlayToggle = useCallback(
    (highlight: RaceHighlight, initialSeekRatio?: number) => {
      const audio = audioRef.current;
      const fallbackAudio = fallbackAudioRef.current;
      if (!audio) return;

      initWebAudio();

      if (playingId === highlight.id && initialSeekRatio === undefined) {
        if (!audio.paused) {
          audio.pause();
        }
        if (fallbackAudio && !fallbackAudio.paused) {
          fallbackAudio.pause();
        }
        setPlayingId(null);
      } else {
        // Pause any previous playback
        if (!audio.paused) audio.pause();
        if (fallbackAudio && !fallbackAudio.paused) fallbackAudio.pause();

        const requestId = ++playRequestRef.current;
        const proxiedUrl = getProxiedRadioAudioUrl(highlight.radioClip.recordingUrl);
        try {
          audio.crossOrigin = 'anonymous';
        } catch {
          // ignore
        }
        audio.src = proxiedUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);

        // 1. Play signature F1 TV radio intro chime at calibrated broadcast volume (balanced with radio voice)
        const userVolume = isMuted ? 0 : volume / 100;
        playF1RadioChime(userVolume).finally(() => {
          if (!audioRef.current || requestId !== playRequestRef.current) return;

          if (typeof initialSeekRatio === 'number' && audioRef.current.duration) {
            audioRef.current.currentTime = initialSeekRatio * audioRef.current.duration;
            setCurrentTime(audioRef.current.currentTime);
          }

          // 2. Play driver team radio recording through Web Audio graph
          audioRef.current
            .play()
            .then(() => {
              if (requestId === playRequestRef.current) {
                setPlayingId(highlight.id);
                if (typeof initialSeekRatio === 'number' && audioRef.current?.duration) {
                  audioRef.current.currentTime = initialSeekRatio * audioRef.current.duration;
                  setCurrentTime(audioRef.current.currentTime);
                }
                if (onLapChange && highlight.lap > 0) {
                  onLapChange(highlight.lap);
                }
              }
            })
            .catch(() => {
              // Direct fallback without Web Audio graph if proxy or CORS blocks Web Audio
              const fb = fallbackAudioRef.current;
              if (fb && requestId === playRequestRef.current) {
                fb.src = highlight.radioClip.recordingUrl;
                fb.volume = isMuted ? 0 : volume / 100;
                if (typeof initialSeekRatio === 'number' && fb.duration) {
                  fb.currentTime = initialSeekRatio * fb.duration;
                  setCurrentTime(fb.currentTime);
                }
                fb
                  .play()
                  .then(() => {
                    if (requestId === playRequestRef.current) {
                      setPlayingId(highlight.id);
                      if (onLapChange && highlight.lap > 0) {
                        onLapChange(highlight.lap);
                      }
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

        // 3. Auto-transcribe on the fly in background if not already available
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
    [playingId, onLapChange, volume, isMuted, initWebAudio, transcriptsMap]
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

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlayingId(null);
    setCurrentTime(0);
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
    if (isMuted && val > 0) setIsMuted(false);
  };

  const handleScrollNav = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const getCategoryBadge = (hl: RaceHighlight) => {
    if (hl.category === 'victory') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-yellow-500/40 text-yellow-300 bg-yellow-500/15">
          <Trophy className="size-2.5 text-yellow-400" />
          <span>VICTORY</span>
        </span>
      );
    }
    if (hl.category === 'safety_car' || hl.category === 'vsc' || hl.category === 'red_flag') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-orange-500/40 text-orange-300 bg-orange-500/15">
          <ShieldAlert className="size-2.5 text-orange-400" />
          <span>{hl.category === 'safety_car' ? 'SC' : hl.category === 'vsc' ? 'VSC' : 'RED FLAG'}</span>
        </span>
      );
    }
    if (hl.category === 'dnf') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-500/40 text-rose-300 bg-rose-500/15">
          <AlertOctagon className="size-2.5 text-rose-400" />
          <span>RETIREMENT</span>
        </span>
      );
    }
    if (hl.category === 'pit_stop') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-blue-500/40 text-blue-300 bg-blue-500/15">
          <Wrench className="size-2.5 text-blue-400" />
          <span>PIT CALL</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-zinc-900/80">
        TEAM RADIO
      </span>
    );
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-zinc-950/90 shadow-xl backdrop-blur-sm p-3.5 sm:p-4 space-y-3 relative overflow-hidden',
        className
      )}
    >
      {/* Invisible global audio element routed through Web Audio Gain/Compressor */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      {/* Un-routed fallback audio element for direct stream playback if CORS/proxy fails */}
      <audio
        ref={fallbackAudioRef}
        preload="none"
        onTimeUpdate={() => {
          if (fallbackAudioRef.current) setCurrentTime(fallbackAudioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (fallbackAudioRef.current) setDuration(fallbackAudioRef.current.duration || 0);
        }}
        onEnded={handleEnded}
      />

      {/* ── Header: Title, Counts, Volume Slider, Category & Driver Filter Pills ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
            <Radio className="size-4 text-red-500 animate-pulse" />
            <span>F1 Team Radio Broadcast</span>
          </div>

          <Badge
            variant="outline"
            className="text-[11px] font-mono font-bold text-zinc-400 border-white/10 bg-zinc-900/80 px-2 py-0.2"
          >
            {highlights.length} Broadcast Clips
          </Badge>
        </div>

        {/* Filter & Audio Controls: Category Pills, Driver Selector & Volume Slider */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors',
                filter === 'all'
                  ? 'bg-zinc-800 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('safety_car')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors flex items-center gap-1',
                filter === 'safety_car'
                  ? 'bg-orange-950/50 text-orange-300 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-orange-300 hover:bg-zinc-900'
              )}
            >
              <ShieldAlert className="size-2.5" />
              <span>Safety Cars</span>
            </button>
            <button
              onClick={() => setFilter('pit_stop')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors flex items-center gap-1',
                filter === 'pit_stop'
                  ? 'bg-blue-950/50 text-blue-300 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-blue-300 hover:bg-zinc-900'
              )}
            >
              <Wrench className="size-2.5" />
              <span>Box Calls</span>
            </button>
            <button
              onClick={() => setFilter('dnf')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors flex items-center gap-1',
                filter === 'dnf'
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-zinc-900'
              )}
            >
              <AlertOctagon className="size-2.5" />
              <span>DNFs</span>
            </button>
            <button
              onClick={() => setFilter('victory')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors flex items-center gap-1',
                filter === 'victory'
                  ? 'bg-yellow-950/50 text-yellow-300 border border-yellow-500/30'
                  : 'text-zinc-400 hover:text-yellow-300 hover:bg-zinc-900'
              )}
            >
              <Trophy className="size-2.5" />
              <span>Victory</span>
            </button>
          </div>

          {/* Driver Filter Dropdown */}
          {uniqueDrivers.length > 1 && (
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="h-6 text-[11px] font-mono font-semibold bg-zinc-900 text-zinc-300 border border-white/10 rounded px-1.5 focus:outline-none focus:border-white/30"
              aria-label="Filter by driver"
            >
              <option value="all">All Drivers ({uniqueDrivers.length})</option>
              {uniqueDrivers.map((d) => (
                <option key={d.number} value={String(d.number)}>
                  #{d.number} {d.code || d.name}
                </option>
              ))}
            </select>
          )}

          {/* ── Neat Audio Volume Slider & Mute Toggle with 0-100% Visual Scale (Boosted Under The Hood) ── */}
          <div
            className="flex items-center gap-1.5 bg-zinc-900/90 border border-white/10 rounded px-2 py-0.5 h-6"
            title="Radio Volume (0% - 100%)"
          >
            <button
              type="button"
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-3 text-red-400" />
              ) : volume < 50 ? (
                <Volume1 className="size-3 text-zinc-300" />
              ) : (
                <Volume2 className="size-3 text-zinc-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-white hover:accent-zinc-300 transition-all"
              aria-label="Radio Volume (0% - 100%)"
            />
            <span className="text-[10px] font-mono tabular-nums min-w-[28px] text-right text-zinc-300 font-semibold">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Horizontal Scrollable Ribbon with Mouse Wheel Support ── */}
      <div className="relative group/ribbon">
        {/* Navigation scroll buttons */}
        <button
          onClick={() => handleScrollNav('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-zinc-950/90 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/ribbon:opacity-100 transition-opacity hover:bg-zinc-900 shadow-xl -translate-x-2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          onClick={() => handleScrollNav('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-zinc-950/90 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/ribbon:opacity-100 transition-opacity hover:bg-zinc-900 shadow-xl translate-x-2"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>

        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent snap-x"
        >
          {filteredHighlights.map((hl) => {
            const isPlayingThis = playingId === hl.id;
            const isCurrentLapMatch = currentLap > 0 && currentLap === hl.lap;
            const livery = hl.teamColour || '#e10600';

            // Audio progress for this tile
            const progressRatio = isPlayingThis && duration > 0 ? Math.min(1, currentTime / duration) : 0;
            const playedBarsCount = Math.floor(progressRatio * WAVE_BARS.length);

            return (
              <div
                key={hl.id}
                data-highlight-id={hl.id}
                data-active={isPlayingThis || isCurrentLapMatch}
                onClick={() => handlePlayToggle(hl)}
                className={cn(
                  'w-[280px] sm:w-[310px] shrink-0 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between snap-start cursor-pointer select-none group',
                  isPlayingThis
                    ? 'border-white/50 bg-zinc-950 shadow-2xl scale-[1.01]'
                    : isCurrentLapMatch
                    ? 'border-amber-400/60 bg-zinc-950/90 shadow-[0_0_16px_rgba(251,191,36,0.15)]'
                    : 'border-white/10 bg-zinc-950/70 hover:bg-zinc-900/80 hover:border-white/25'
                )}
              >
                {/* ── Official F1 Top Team Colored Livery Stripe ── */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all duration-200"
                  style={{ backgroundColor: livery }}
                />

                {/* ── Top Header: {DRIVER} RADIO, Number & Lap Badge ── */}
                <div className="p-3 pb-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-1.5 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: livery }}
                      />
                      <h4 className="text-xs sm:text-sm font-black font-mono tracking-wider text-white uppercase truncate">
                        {hl.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-mono font-black" style={{ color: livery }}>
                        #{hl.driverNumber}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border',
                          isCurrentLapMatch
                            ? 'border-amber-500/40 text-amber-300 bg-amber-500/20 animate-pulse'
                            : 'border-white/10 text-zinc-400 bg-zinc-900/80'
                        )}
                      >
                        Lap {hl.lap}
                      </span>
                    </div>
                  </div>

                  {/* Category Chip + Team Name */}
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400">
                    <span className="truncate">{hl.teamName || 'Formula 1 Team'}</span>
                    {getCategoryBadge(hl)}
                  </div>
                </div>

                {/* ── Middle: Authentic F1 Broadcast Sound Waveform Section ── */}
                <div className="bg-zinc-900/80 border-y border-white/5 px-3 py-2 flex items-center justify-between gap-2.5 relative">
                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayToggle(hl);
                    }}
                    className={cn(
                      'size-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md',
                      isPlayingThis
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    )}
                    aria-label={isPlayingThis ? 'Pause radio' : 'Play radio'}
                  >
                    {isPlayingThis ? (
                      <Pause className="size-3.5 fill-black" />
                    ) : (
                      <Play className="size-3.5 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* 28 Animated Soundwave Frequency Bars (buttery smooth 60/120fps with click seeking) */}
                  <div
                    onClick={(e) => handleWaveformSeek(e, hl)}
                    className="flex-1 flex items-center justify-center gap-[2.5px] h-7 overflow-hidden px-1 cursor-pointer hover:opacity-85 transition-opacity"
                    title="Click to seek"
                  >
                    {WAVE_BARS.map((heightPct, idx) => {
                      const isPlayed = isPlayingThis && idx <= playedBarsCount;

                      return (
                        <span
                          key={idx}
                          className="w-[3px] rounded-full"
                          style={getWaveformBarStyle({
                            idx,
                            isPlaying: isPlayingThis,
                            baseHeightPct: heightPct,
                            isPlayed,
                            livery,
                          })}
                        />
                      );
                    })}
                  </div>

                  {/* Time Digits */}
                  <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums shrink-0">
                    {isPlayingThis ? `${formatSecs(currentTime)} / ${formatSecs(duration)}` : 'AUDIO'}
                  </span>
                </div>

                {/* ── Bottom: Authentic Quotation / Broadcast Context ── */}
                <div className="p-3 pt-2.5">
                  {transcriptsMap[hl.id] || hl.transcript ? (
                    <p className="text-xs font-mono font-bold text-zinc-100 italic leading-snug line-clamp-3 animate-in fade-in duration-300">
                      {(transcriptsMap[hl.id] || hl.transcript)!.startsWith('"')
                        ? transcriptsMap[hl.id] || hl.transcript
                        : `"${transcriptsMap[hl.id] || hl.transcript}"`}
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-zinc-400 leading-snug line-clamp-2">
                      {hl.description.replace(/\s*(?:·|on|-)\s*Lap\s*\d+\s*$/i, '')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
