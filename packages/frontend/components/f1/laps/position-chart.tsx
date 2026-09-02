'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry, RaceEvent } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { isDnfStatus, isLappedStatus } from '@/lib/f1-status';
import {
  Maximize2,
  Minimize2,
  X,
  ShieldAlert,
  AlertTriangle,
  Flag,
  Trophy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PositionChartProps {
  currentLap: number;
  totalLaps: number;
  lapsData: LapData[];
  drivers: DriverLapSummary[];
  pitStops: PitStopEntry[];
  selectedDriverIds: Set<string>;
  isPaused: boolean;
  isFullscreen?: boolean;
  raceEvents?: RaceEvent[];
  onLapChange: (lap: number) => void;
  onToggleDriver: (driverId: string) => void;
  onToggleFullscreen?: () => void;
}

interface Point {
  lap: number;
  position: number;
  time: string;
  x: number;
  y: number;
}

interface DriverLine {
  driverId: string;
  code: string;
  name: string;
  constructorId: string;
  color: string;
  points: Point[];
  pathD: string;
  lastPoint?: Point;
  isDnf: boolean;
  dnfStatus?: string;
  isLapped: boolean;
  lappedStatus?: string;
  finishPosition?: number;
  pitPoints: Point[];
}

export function PositionChart({
  currentLap,
  totalLaps,
  lapsData,
  drivers,
  pitStops,
  selectedDriverIds,
  isPaused,
  isFullscreen = false,
  raceEvents = [],
  onLapChange,
  onToggleDriver,
  onToggleFullscreen,
}: PositionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDriverId, setHoveredDriverId] = useState<string | null>(null);
  const fastestLapDriver = useMemo(() => drivers.find((d) => d.fastestLap?.rank === 1), [drivers]);

  // Normalize events to guarantee lap number resolution even on older cached payloads
  const effectiveEvents = useMemo(() => {
    return raceEvents.map((e) => {
      let lap = e.lap;
      if (!lap && e.message) {
        const match = e.message.match(/(?:LAP|L)\s*(\d+)/i) ?? e.message.match(/ON\s+LAP\s*(\d+)/i);
        if (match) lap = parseInt(match[1], 10);
      }
      return { ...e, lap };
    });
  }, [raceEvents]);
  const [hoveredPoint, setHoveredPoint] = useState<{
    driverId: string;
    code: string;
    name: string;
    lap: number;
    position: number;
    time: string;
    color: string;
    isDnf: boolean;
    dnfStatus?: string;
    isLapped: boolean;
    lappedStatus?: string;
    pitStop?: {
      stop: number;
      duration: string;
      time?: string;
    };
    x: number;
    y: number;
  } | null>(null);

  // Zoom scale state for touch pinch-to-zoom and precision inspection (1.0x to 3.0x)
  const [zoomScale, setZoomScale] = useState(1);
  const zoomScaleRef = useRef(1);
  zoomScaleRef.current = zoomScale;

  // Touch pinch-to-zoom & double-tap zoom for mobile devices
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDist = 0;
    let initialScale = 1;
    let isPinching = false;
    let lastTap = 0;

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialDist = getDistance(e.touches);
        initialScale = zoomScaleRef.current;
        if (e.cancelable) e.preventDefault();
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          if (e.cancelable) e.preventDefault();
          setZoomScale((prev) => (prev > 1.2 ? 1 : 1.8));
        }
        lastTap = now;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const currentDist = getDistance(e.touches);
        if (initialDist > 0) {
          const factor = currentDist / initialDist;
          const nextScale = Math.min(3, Math.max(1, initialScale * factor));
          setZoomScale(Number(nextScale.toFixed(2)));
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // SVG dimensions - dynamically expands height in fullscreen
  const SVG_WIDTH = Math.max(960, totalLaps * 18);
  const SVG_HEIGHT = isFullscreen ? 620 : 540;
  const PADDING_TOP = 56;
  const PADDING_BOTTOM = 54;
  const PADDING_LEFT = 48;
  const PADDING_RIGHT = 80;

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Dynamically derive the maximum grid/track position from drivers and lap data (e.g. 20, 22, 24, 26)
  const maxPosition = useMemo(() => {
    let max = Math.max(20, drivers.length);
    for (const d of drivers) {
      if (d.gridPosition && d.gridPosition > max) max = d.gridPosition;
      if (d.finishPosition && d.finishPosition > max) max = d.finishPosition;
    }
    for (const lap of lapsData) {
      for (const t of lap.Timings) {
        const p = parseInt(t.position, 10);
        if (p > max && p <= 34) max = p;
      }
    }
    return max;
  }, [drivers, lapsData]);

  // Coordinate conversion helpers
  const getX = useMemo(() => {
    return (lap: number) => {
      if (totalLaps <= 0) return PADDING_LEFT + chartWidth / 2;
      return PADDING_LEFT + (lap / totalLaps) * chartWidth;
    };
  }, [totalLaps, chartWidth]);

  const getY = useMemo(() => {
    return (position: number) => {
      const clamped = Math.min(Math.max(1, position), maxPosition);
      return PADDING_TOP + ((clamped - 1) / (maxPosition - 1)) * chartHeight;
    };
  }, [chartHeight, maxPosition]);

  // Pit stop lookup map: "driverId:lap" -> PitStopEntry
  const pitMap = useMemo(() => {
    const map = new Map<string, PitStopEntry>();
    for (const p of pitStops) {
      map.set(`${p.driverId}:${p.lap}`, p);
    }
    return map;
  }, [pitStops]);

  // Build driver lines and SVG paths
  const driverLines = useMemo<DriverLine[]>(() => {
    const lines: DriverLine[] = [];

    // Pre-organize timings by driverId, starting with Lap 0 (Grid)
    const driverPointsMap = new Map<string, Point[]>();
    for (const d of drivers) {
      const gridPos = d.gridPosition > 0 ? d.gridPosition : (d.finishPosition || maxPosition);
      driverPointsMap.set(d.driverId, [
        {
          lap: 0,
          position: gridPos,
          time: 'Grid',
          x: getX(0),
          y: getY(gridPos),
        },
      ]);
    }

    for (const lap of lapsData) {
      const lapNum = parseInt(lap.number, 10);
      for (const t of lap.Timings) {
        const pos = parseInt(t.position, 10);
        const list = driverPointsMap.get(t.driverId);
        if (list && pos > 0 && pos <= maxPosition) {
          list.push({
            lap: lapNum,
            position: pos,
            time: t.time,
            x: getX(lapNum),
            y: getY(pos),
          });
        }
      }
    }

    for (const d of drivers) {
      const pts = driverPointsMap.get(d.driverId) ?? [];
      pts.sort((a, b) => a.lap - b.lap);

      if (pts.length === 0) continue;

      // Construct smooth SVG Bezier path
      let pathD = '';
      if (pts.length === 1) {
        pathD = `M ${pts[0].x} ${pts[0].y}`;
      } else {
        pathD = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const cpX1 = p0.x + (p1.x - p0.x) * 0.5;
          const cpX2 = p0.x + (p1.x - p0.x) * 0.5;
          pathD += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
        }
      }

      const theme = getTeamTheme(d.constructorId);
      const isDnf = isDnfStatus(d.status, d.positionText);
      const isLapped = isLappedStatus(d.status);
      const pitPoints = pts.filter((pt) => pitMap.has(`${d.driverId}:${pt.lap}`));

      lines.push({
        driverId: d.driverId,
        code: d.code,
        name: `${d.givenName} ${d.familyName}`,
        constructorId: d.constructorId,
        color: theme.primary,
        points: pts,
        pathD,
        lastPoint: pts[pts.length - 1],
        isDnf,
        dnfStatus: d.status,
        isLapped,
        lappedStatus: d.status,
        finishPosition: d.finishPosition,
        pitPoints,
      });
    }

    return lines;
  }, [drivers, lapsData, pitMap, getX, getY, totalLaps]);

  // X-axis lap ticks (Lap 0 Grid, then regular intervals)
  const lapTicks = useMemo(() => {
    const ticks: number[] = [0];
    const step = totalLaps > 50 ? 5 : totalLaps > 25 ? 2 : 1;
    for (let l = step; l <= totalLaps; l += step) {
      ticks.push(l);
    }
    if (ticks[ticks.length - 1] !== totalLaps) {
      ticks.push(totalLaps);
    }
    return ticks;
  }, [totalLaps]);

  // Y-axis position ticks dynamically generated based on maxPosition
  const positionTicks = useMemo(() => {
    if (isFullscreen) {
      const ticks: number[] = [];
      for (let p = 1; p <= maxPosition; p++) {
        ticks.push(p);
      }
      return ticks;
    }
    const ticks: number[] = [1, 2, 3];
    const step = maxPosition > 22 ? 3 : 2;
    for (let p = 5; p < maxPosition; p += step) {
      ticks.push(p);
    }
    if (ticks[ticks.length - 1] !== maxPosition) {
      ticks.push(maxPosition);
    }
    return ticks;
  }, [isFullscreen, maxPosition]);

  const currentLapX = getX(currentLap);
  const hasSelectedDrivers = selectedDriverIds.size > 0;

  // Auto-scroll container to keep the replay playhead in view while playing
  useEffect(() => {
    if (isPaused) return;
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollWidth <= container.clientWidth) return;

    const scaleFactor = container.scrollWidth / SVG_WIDTH;
    const targetPixelX = currentLapX * scaleFactor;
    const visibleLeft = container.scrollLeft;
    const visibleRight = container.scrollLeft + container.clientWidth;

    // Smoothly keep playhead in the viewport
    if (targetPixelX > visibleRight - 100 || targetPixelX < visibleLeft + 60) {
      const newScrollLeft = Math.max(0, targetPixelX - container.clientWidth / 2);
      container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  }, [currentLap, isPaused, currentLapX, SVG_WIDTH]);

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4 shadow-lg flex flex-col justify-between relative overflow-hidden',
        isFullscreen ? 'h-full' : 'space-y-2'
      )}
    >
      {/* Chart Title & Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2 shrink-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Lap Chart</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1 font-medium">
            <span className="size-2.5 rounded-full bg-amber-400 border border-zinc-950 inline-block shadow-xs" /> Pit Stop
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="size-2.5 rounded-full bg-blue-400 border border-zinc-950 inline-block shadow-xs" /> Lapped
          </span>
          <span className="flex items-center gap-1 font-medium">
            <X className="size-3 text-red-400 stroke-[3]" /> DNF
          </span>

          {effectiveEvents.some((e) => e.type === 'safety_car') && (
            <span className="flex items-center gap-1 font-medium text-amber-300">
              <ShieldAlert className="size-3.5 text-amber-400" /> SC
            </span>
          )}
          {effectiveEvents.some((e) => e.type === 'vsc') && (
            <span className="flex items-center gap-1 font-medium text-orange-300">
              <AlertTriangle className="size-3.5 text-orange-400" /> VSC
            </span>
          )}
          {effectiveEvents.some((e) => e.type === 'red_flag') && (
            <span className="flex items-center gap-1 font-medium text-red-300">
              <Flag className="size-3.5 text-red-500 fill-red-500/20" /> Red Flag
            </span>
          )}
          {fastestLapDriver?.fastestLap && (
            <span className="flex items-center gap-1 font-medium text-purple-300">
              <Trophy className="size-3.5 text-purple-400" /> Fastest Lap
            </span>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-zinc-900/80 border border-zinc-800 rounded-md p-0.5 shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoomScale((s) => Math.max(1, Number((s - 0.25).toFixed(2))))}
              disabled={zoomScale <= 1}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              title="Zoom Out"
            >
              <ZoomOut className="size-3" />
            </Button>
            <span className="text-[10px] font-mono font-bold px-1 text-zinc-300 min-w-[34px] text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoomScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))}
              disabled={zoomScale >= 3}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              title="Zoom In (Pinch on Mobile)"
            >
              <ZoomIn className="size-3" />
            </Button>
            {zoomScale > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setZoomScale(1)}
                className="h-6 px-1.5 text-[10px] font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1"
                title="Reset Zoom"
              >
                <RotateCcw className="size-3" />
                <span>1x</span>
              </Button>
            )}
          </div>

          {onToggleFullscreen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
              className="h-7 px-2.5 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-foreground text-xs gap-1.5 ml-1 font-medium"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="size-3.5" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* SVG Scroll Container - horizontal and vertical scroll with touch pinch-to-zoom */}
      <div
        ref={containerRef}
        className={cn(
          'w-full overflow-auto custom-scrollbar relative select-none',
          isFullscreen
            ? 'flex-1 min-h-0'
            : 'max-h-[min(540px,calc(100vh-260px))]'
        )}
        style={{
          touchAction: zoomScale > 1 ? 'pan-x pan-y' : 'pan-x',
        }}
      >
        <div
          style={{
            width: zoomScale > 1 ? `${Math.round(zoomScale * 100)}%` : '100%',
            minWidth: zoomScale > 1 ? `${Math.round(640 * zoomScale)}px` : '640px',
            height:
              zoomScale > 1
                ? `${Math.round((isFullscreen ? 620 : 540) * zoomScale)}px`
                : undefined,
          }}
          className={cn(
            'relative transition-[width,height] duration-150 mx-auto',
            isFullscreen && zoomScale <= 1 ? 'h-full flex items-center' : 'block'
          )}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className={cn(
              'w-full block mx-auto',
              isFullscreen && zoomScale <= 1
                ? 'h-full max-h-full max-w-full'
                : zoomScale > 1
                ? 'h-full'
                : 'h-auto max-h-[min(520px,calc(100vh-280px))]'
            )}
            style={{
              maxHeight:
                isFullscreen && zoomScale <= 1
                  ? '100%'
                  : zoomScale > 1
                  ? undefined
                  : 'min(520px, calc(100vh - 280px))',
            }}
          >
          {/* Background Grid Lines (Horizontal Positions) */}
          {positionTicks.map((pos) => {
            const y = getY(pos);
            const isP1 = pos === 1;
            const isP2 = pos === 2;
            const isP3 = pos === 3;
            const labelColor = isP1 ? '#facc15' : isP2 ? '#e4e4e7' : isP3 ? '#fb923c' : '#a1a1aa';

            return (
              <g key={`y-grid-${pos}`}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke={isP1 ? '#eab308' : '#27272a'}
                  strokeWidth={isP1 ? 1.5 : 1}
                  strokeDasharray={isP1 ? 'none' : '3 3'}
                  opacity={isP1 ? 0.9 : pos % 5 === 0 ? 0.5 : 0.25}
                />
                <text
                  x={PADDING_LEFT - 10}
                  y={y + 4.5}
                  textAnchor="end"
                  fontSize={isFullscreen ? '12' : '11'}
                  fontFamily="monospace"
                  fill={labelColor}
                  fontWeight="bold"
                >
                  P{pos}
                </text>
              </g>
            );
          })}

          {/* Race Control Shaded Event Zones (Safety Car, VSC, Red Flag) */}
          {effectiveEvents.map((evt, idx) => {
            const isSafetyCar = evt.type === 'safety_car';
            const isVsc = evt.type === 'vsc';
            const isRedFlag = evt.type === 'red_flag';

            if ((!isSafetyCar && !isVsc && !isRedFlag) || !evt.lap) return null;

            const lap = evt.lap;
            const startX = getX(Math.max(1, lap));
            const endLapNum = typeof evt.endLap === 'number' && evt.endLap >= lap ? evt.endLap : lap;
            const endX = getX(Math.min(totalLaps, endLapNum));
            const nextLapX = getX(Math.min(totalLaps, lap + 1));
            const width = endLapNum > lap ? Math.max(18, endX - startX) : Math.max(16, nextLapX - startX);

            const fillColor = isSafetyCar ? '#f59e0b' : isVsc ? '#f97316' : '#ef4444';
            const label = isSafetyCar ? 'SC' : isVsc ? 'VSC' : 'RED';
            const badgeWidth = isRedFlag ? 32 : 26;

            return (
              <g key={`event-zone-${idx}-${evt.type}-${evt.lap}`}>
                <rect
                  x={startX}
                  y={PADDING_TOP}
                  width={width}
                  height={SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM}
                  fill={fillColor}
                  opacity={isRedFlag ? 0.22 : 0.14}
                  stroke={fillColor}
                  strokeWidth={isRedFlag ? 1.5 : 1}
                  strokeDasharray={isRedFlag ? 'none' : '3 3'}
                  strokeOpacity={0.6}
                />
                {/* Zone Label Badge on Top */}
                <g transform={`translate(${startX + width / 2}, ${PADDING_TOP - 16})`}>
                  <rect
                    x={-badgeWidth / 2}
                    y={-7}
                    width={badgeWidth}
                    height={13}
                    rx={3}
                    fill={isRedFlag ? '#450a0a' : '#09090b'}
                    stroke={fillColor}
                    strokeWidth="1.2"
                  />
                  <text
                    x={0}
                    y={2}
                    textAnchor="middle"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="black"
                    fill={isRedFlag ? '#fca5a5' : fillColor}
                  >
                    {label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Vertical Lap Grid Lines */}
          {lapTicks.map((lap) => {
            const x = getX(lap);
            return (
              <g key={`x-grid-${lap}`}>
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={SVG_HEIGHT - PADDING_BOTTOM}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity={0.35}
                />
                {/* Clickable Lap Label on X-axis */}
                <text
                  x={x}
                  y={SVG_HEIGHT - PADDING_BOTTOM + 22}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fill={lap === currentLap ? '#38bdf8' : '#d4d4d8'}
                  fontWeight={lap === currentLap ? 'bold' : 'normal'}
                  className="cursor-pointer hover:fill-primary transition-colors"
                  onClick={() => onLapChange(lap)}
                >
                  {lap === 0 ? 'GRID' : lap}
                </text>
              </g>
            );
          })}

          {/* Official Fastest Lap Marker */}
          {fastestLapDriver?.fastestLap && (
            <g key="fastest-lap-zone">
              <line
                x1={getX(fastestLapDriver.fastestLap.lap)}
                y1={PADDING_TOP}
                x2={getX(fastestLapDriver.fastestLap.lap)}
                y2={SVG_HEIGHT - PADDING_BOTTOM}
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity={0.65}
              />
              <g transform={`translate(${getX(fastestLapDriver.fastestLap.lap)}, ${PADDING_TOP - 16})`}>
                <rect
                  x={-13}
                  y={-7}
                  width={26}
                  height={13}
                  rx={3}
                  fill="#2e1065"
                  stroke="#a855f7"
                  strokeWidth="1"
                />
                <text
                  x={0}
                  y={2}
                  textAnchor="middle"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="black"
                  fill="#e9d5ff"
                >
                  FL
                </text>
              </g>
            </g>
          )}

          {/* Active Current Lap Playhead Indicator (Cyan / Laser line, distinct from Red Flag) */}
          <g>
            <line
              x1={currentLapX}
              y1={PADDING_TOP - 8}
              x2={currentLapX}
              y2={SVG_HEIGHT - PADDING_BOTTOM + 6}
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity={0.9}
            />
            {/* Lap Playhead Tag at Top */}
            <rect
              x={currentLap === 0 ? currentLapX - 18 : currentLapX - 22}
              y={PADDING_TOP - 26}
              width={currentLap === 0 ? 36 : 44}
              height={18}
              rx={4}
              fill="#082f49"
              stroke="#38bdf8"
              strokeWidth="1.5"
              className="shadow-sm"
            />
            <text
              x={currentLapX}
              y={PADDING_TOP - 13}
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="monospace"
              fontWeight="black"
              fill="#7dd3fc"
            >
              {currentLap === 0 ? 'GRID' : `LAP ${currentLap}`}
            </text>
          </g>

          {/* Driver Position Lines */}
          {driverLines.map((line) => {
            const isSelected = selectedDriverIds.has(line.driverId);
            const isHovered = hoveredDriverId === line.driverId;

            let strokeWidth = 2.4;
            let opacity = 0.75;

            if (hasSelectedDrivers) {
              if (isSelected) {
                strokeWidth = 4.2;
                opacity = 1;
              } else {
                strokeWidth = 1.8;
                opacity = 0.22;
              }
            } else if (isHovered) {
              strokeWidth = 4.2;
              opacity = 1;
            }

            return (
              <g
                key={`line-${line.driverId}`}
                className={cn(isPaused ? 'cursor-pointer' : 'cursor-default')}
                onMouseEnter={() => setHoveredDriverId(line.driverId)}
                onMouseLeave={() => setHoveredDriverId(null)}
                onClick={() => isPaused && onToggleDriver(line.driverId)}
              >
                {/* Thick Invisible Hover Hit-box Line */}
                <path
                  d={line.pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Visible Trace Line */}
                <path
                  d={line.pathD}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={opacity}
                  style={{
                    transition: 'stroke-width 0.2s, opacity 0.2s',
                    filter: isSelected || isHovered ? `drop-shadow(0 0 5px ${line.color}90)` : 'none',
                  }}
                />

                {/* Driver End Code & Status Label */}
                {line.lastPoint && (
                  <g>
                    <text
                      x={line.lastPoint.x + 10}
                      y={line.lastPoint.y + 4}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight={isSelected || isHovered ? 'bold' : 'bold'}
                      fill={isSelected || isHovered ? '#ffffff' : line.color}
                      opacity={hasSelectedDrivers && !isSelected ? 0.35 : 1}
                    >
                      {line.code}
                    </text>
                    {line.isLapped && !line.isDnf && (
                      <text
                        x={line.lastPoint.x + 36}
                        y={line.lastPoint.y + 4}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#60a5fa"
                        opacity={hasSelectedDrivers && !isSelected ? 0.35 : 0.9}
                      >
                        {line.lappedStatus ? line.lappedStatus.replace(' Laps', 'L').replace(' Lap', 'L') : '+1L'}
                      </text>
                    )}
                  </g>
                )}

                {/* Pit Stop Dots */}
                {line.pitPoints.map((pitPt) => (
                  <circle
                    key={`pit-${line.driverId}-${pitPt.lap}`}
                    cx={pitPt.x}
                    cy={pitPt.y}
                    r={isSelected || isHovered ? 5.5 : 4.5}
                    fill="#fbbf24"
                    stroke="#18181b"
                    strokeWidth="2"
                    opacity={hasSelectedDrivers && !isSelected ? 0.25 : 0.95}
                  />
                ))}

                {/* Lapped Finish Indicator Dot */}
                {line.isLapped && !line.isDnf && line.lastPoint && (
                  <circle
                    cx={line.lastPoint.x}
                    cy={line.lastPoint.y}
                    r="4.5"
                    fill="#60a5fa"
                    stroke="#18181b"
                    strokeWidth="2"
                    opacity={hasSelectedDrivers && !isSelected ? 0.3 : 0.95}
                  />
                )}

                {/* DNF Marker (Only for true retired/DNF cars) */}
                {line.isDnf && line.lastPoint && (
                  <g>
                    <circle
                      cx={line.lastPoint.x}
                      cy={line.lastPoint.y}
                      r="7.5"
                      fill="#ef4444"
                      stroke="#18181b"
                      strokeWidth="2"
                    />
                    <text
                      x={line.lastPoint.x}
                      y={line.lastPoint.y + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      ✕
                    </text>
                  </g>
                )}

                {/* Current Lap Position Node */}
                {(() => {
                  const currPt = line.points.find((p) => p.lap === currentLap);
                  if (!currPt) return null;
                  return (
                    <circle
                      cx={currPt.x}
                      cy={currPt.y}
                      r={isSelected || isHovered ? 6.5 : 5}
                      fill={line.color}
                      stroke="#18181b"
                      strokeWidth="2.5"
                      opacity={hasSelectedDrivers && !isSelected ? 0.35 : 1}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        const pitEntry = pitMap.get(`${line.driverId}:${currPt.lap}`);

                        setHoveredPoint({
                          driverId: line.driverId,
                          code: line.code,
                          name: line.name,
                          lap: currPt.lap,
                          position: currPt.position,
                          time: currPt.time,
                          color: line.color,
                          isDnf: line.isDnf,
                          dnfStatus: line.dnfStatus,
                          isLapped: line.isLapped,
                          lappedStatus: line.lappedStatus,
                          pitStop: pitEntry
                            ? {
                                stop: parseInt(pitEntry.stop, 10) || 1,
                                duration: pitEntry.duration,
                                time: pitEntry.time,
                              }
                            : undefined,
                          x: currPt.x,
                          y: currPt.y,
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })()}
              </g>
            );
          })}
        </svg>

          {/* Floating Hover Tooltip positioned accurately in zoom coordinate space */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none rounded-lg border border-zinc-700 bg-zinc-900/95 p-2.5 shadow-xl text-xs font-mono backdrop-blur-sm -translate-x-1/2 -translate-y-full -mt-2.5 pointer-events-none"
              style={{
                left: `${(hoveredPoint.x / SVG_WIDTH) * 100}%`,
                top: `${(hoveredPoint.y / SVG_HEIGHT) * 100}%`,
              }}
            >
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span
                  className="size-2 rounded-full inline-block"
                  style={{ backgroundColor: hoveredPoint.color }}
                />
                <span>{hoveredPoint.name} ({hoveredPoint.code})</span>
              </div>
              <div className="text-muted-foreground mt-1 space-y-0.5 text-[11px]">
                <div>
                  {hoveredPoint.lap === 0 ? 'Starting Grid' : `Lap ${hoveredPoint.lap}`} ·{' '}
                  <span className="font-bold text-foreground">P{hoveredPoint.position}</span>
                </div>
                <div>
                  {hoveredPoint.lap === 0 ? (
                    <span className="text-zinc-400">Grid Slot {hoveredPoint.position}</span>
                  ) : (
                    <>Time: <span className="text-zinc-300">{hoveredPoint.time}</span></>
                  )}
                </div>
                {hoveredPoint.pitStop && (
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 mt-1 text-[10px]">
                    <span className="size-2 rounded-full bg-amber-400 inline-block shadow-xs" />
                    <span>Pit Stop #{hoveredPoint.pitStop.stop}:</span>
                    <span className="font-mono text-foreground font-bold">
                      {hoveredPoint.pitStop.duration}s
                    </span>
                    {hoveredPoint.pitStop.time && (
                      <span className="text-zinc-400 font-normal">
                        ({hoveredPoint.pitStop.time})
                      </span>
                    )}
                  </div>
                )}
                {hoveredPoint.isDnf && (
                  <div className="text-red-400 font-bold">
                    DNF · {hoveredPoint.dnfStatus}
                  </div>
                )}
                {hoveredPoint.isLapped && (
                  <div className="text-blue-400 font-medium">
                    {hoveredPoint.lappedStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Reset Zoom Badge for Touch Devices */}
      {zoomScale > 1 && (
        <button
          type="button"
          onClick={() => setZoomScale(1)}
          className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-zinc-900/95 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-full shadow-2xl text-xs font-mono backdrop-blur-md transition-transform active:scale-95 animate-in fade-in zoom-in-95 duration-150"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset {Math.round(zoomScale * 100)}%</span>
        </button>
      )}
    </div>
  );
}
