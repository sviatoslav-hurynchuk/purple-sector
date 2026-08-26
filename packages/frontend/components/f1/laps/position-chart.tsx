'use client';

import React, { useMemo, useState, useRef } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { isDnfStatus, isLappedStatus } from '@/lib/f1-status';
import { Maximize2, Minimize2 } from 'lucide-react';
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
  onLapChange,
  onToggleDriver,
  onToggleFullscreen,
}: PositionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDriverId, setHoveredDriverId] = useState<string | null>(null);
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
    x: number;
    y: number;
  } | null>(null);

  // SVG dimensions - dynamically expands height in fullscreen
  const SVG_WIDTH = Math.max(960, totalLaps * 18);
  const SVG_HEIGHT = isFullscreen ? 640 : 540;
  const PADDING_TOP = 44;
  const PADDING_BOTTOM = 44;
  const PADDING_LEFT = 44;
  const PADDING_RIGHT = 75;

  const chartWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const maxPosition = 20;

  // Coordinate conversion helpers
  const getX = useMemo(() => {
    return (lap: number) => {
      if (totalLaps <= 1) return PADDING_LEFT + chartWidth / 2;
      return PADDING_LEFT + ((lap - 1) / (totalLaps - 1)) * chartWidth;
    };
  }, [totalLaps, chartWidth]);

  const getY = useMemo(() => {
    return (position: number) => {
      const clamped = Math.min(Math.max(1, position), maxPosition);
      return PADDING_TOP + ((clamped - 1) / (maxPosition - 1)) * chartHeight;
    };
  }, [chartHeight]);

  // Pit stop lookup map: "driverId:lap" -> PitStopEntry
  const pitMap = useMemo(() => {
    const map = new Set<string>();
    for (const p of pitStops) {
      map.add(`${p.driverId}:${p.lap}`);
    }
    return map;
  }, [pitStops]);

  // Build driver lines and SVG paths
  const driverLines = useMemo<DriverLine[]>(() => {
    const lines: DriverLine[] = [];

    // Pre-organize timings by driverId
    const driverPointsMap = new Map<string, Point[]>();
    for (const d of drivers) {
      driverPointsMap.set(d.driverId, []);
    }

    for (const lap of lapsData) {
      const lapNum = parseInt(lap.number, 10);
      for (const t of lap.Timings) {
        const pos = parseInt(t.position, 10);
        const list = driverPointsMap.get(t.driverId);
        if (list && pos > 0 && pos <= 22) {
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

  // X-axis lap ticks (every 5 or 10 laps)
  const lapTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = totalLaps > 50 ? 5 : totalLaps > 25 ? 2 : 1;
    for (let l = 1; l <= totalLaps; l++) {
      if (l === 1 || l === totalLaps || l % step === 0) {
        ticks.push(l);
      }
    }
    return ticks;
  }, [totalLaps]);

  // Y-axis position ticks (P1..P20 in fullscreen, key ticks in normal view)
  const positionTicks = useMemo(() => {
    if (isFullscreen) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    }
    return [1, 2, 3, 5, 8, 10, 12, 15, 18, 20];
  }, [isFullscreen]);

  const currentLapX = getX(currentLap);
  const hasSelectedDrivers = selectedDriverIds.size > 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4 shadow-lg flex flex-col justify-between relative overflow-hidden',
        isFullscreen ? 'h-full' : 'space-y-2'
      )}
    >
      {/* Chart Title & Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Lap Chart</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3.5 text-xs sm:text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded-full bg-amber-400 border border-zinc-950 inline-block shadow-xs" /> Pit Stop
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-3 rounded-full bg-blue-400 border border-zinc-950 inline-block shadow-xs" /> Lapped
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-red-400 font-extrabold text-sm leading-none">✕</span> DNF
          </span>

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

      {/* SVG Scroll Container - horizontal only, no vertical scrollbar */}
      <div
        ref={containerRef}
        className={cn(
          'w-full overflow-x-auto overflow-y-hidden custom-scrollbar relative select-none',
          isFullscreen ? 'flex-1 flex flex-col justify-center min-h-0' : ''
        )}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className={cn(
            'w-full h-auto min-w-[760px] block',
            isFullscreen ? 'max-h-[calc(100vh-230px)]' : 'max-h-[580px]'
          )}
          style={{ overflow: 'visible' }}
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
                  fill={lap === currentLap ? '#f43f5e' : '#d4d4d8'}
                  fontWeight={lap === currentLap ? 'bold' : 'normal'}
                  className="cursor-pointer hover:fill-primary transition-colors"
                  onClick={() => onLapChange(lap)}
                >
                  {lap}
                </text>
              </g>
            );
          })}

          {/* Active Current Lap Vertical Indicator Band */}
          <g>
            <line
              x1={currentLapX}
              y1={PADDING_TOP - 10}
              x2={currentLapX}
              y2={SVG_HEIGHT - PADDING_BOTTOM + 6}
              stroke="var(--primary, #e10600)"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity={0.95}
            />
            {/* Lap Tag at Top */}
            <rect
              x={currentLapX - 24}
              y={PADDING_TOP - 28}
              width={48}
              height={20}
              rx={5}
              fill="var(--primary, #e10600)"
              className="shadow-sm"
            />
            <text
              x={currentLapX}
              y={PADDING_TOP - 14}
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              fill="#ffffff"
            >
              L {currentLap}
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
                        const rect = e.currentTarget.getBoundingClientRect();
                        const containerRect = containerRef.current?.getBoundingClientRect();
                        const clientX = rect.left - (containerRect?.left ?? 0) + rect.width / 2;
                        const clientY = rect.top - (containerRect?.top ?? 0);

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
                          x: clientX,
                          y: clientY,
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
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-zinc-700 bg-zinc-900/95 p-2.5 shadow-xl text-xs font-mono backdrop-blur-sm"
          style={{
            left: `${Math.max(10, Math.min(hoveredPoint.x - 70, (containerRef.current?.clientWidth ?? 800) - 160))}px`,
            top: `${Math.max(10, hoveredPoint.y - 75)}px`,
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
            <div>Lap {hoveredPoint.lap} · <span className="font-bold text-foreground">P{hoveredPoint.position}</span></div>
            <div>Time: <span className="text-zinc-300">{hoveredPoint.time}</span></div>
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
  );
}
