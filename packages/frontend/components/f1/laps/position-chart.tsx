'use client';

import React, { useMemo, useState, useRef } from 'react';
import type { LapData, DriverLapSummary, PitStopEntry } from '@/types/f1';
import { getTeamTheme } from '@/lib/team-colors';
import { cn } from '@/lib/utils';

interface PositionChartProps {
  currentLap: number;
  totalLaps: number;
  lapsData: LapData[];
  drivers: DriverLapSummary[];
  pitStops: PitStopEntry[];
  selectedDriverIds: Set<string>;
  isPaused: boolean;
  onLapChange: (lap: number) => void;
  onToggleDriver: (driverId: string) => void;
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
  onLapChange,
  onToggleDriver,
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
    x: number;
    y: number;
  } | null>(null);

  // SVG dimensions
  const SVG_WIDTH = Math.max(860, totalLaps * 16);
  const SVG_HEIGHT = 480;
  const PADDING_TOP = 28;
  const PADDING_BOTTOM = 36;
  const PADDING_LEFT = 36;
  const PADDING_RIGHT = 54;

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
      const isDnf = d.totalLaps < totalLaps && d.status !== 'Finished' && !d.status.startsWith('+');
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

  // Y-axis position ticks (P1, P5, P10, P15, P20)
  const positionTicks = [1, 5, 10, 15, 20];

  const currentLapX = getX(currentLap);
  const hasSelectedDrivers = selectedDriverIds.size > 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5 shadow-lg flex flex-col space-y-3 relative overflow-hidden">
      {/* Chart Title & Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Lap Chart · Race Trace</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              (Position evolution across {totalLaps} laps)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400 inline-block" /> Pit Stop
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold">✕</span> DNF
          </span>
          {isPaused && (
            <span className="text-primary font-medium hidden md:inline">
              ✦ Click any line to compare pace
            </span>
          )}
        </div>
      </div>

      {/* SVG Scroll Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto custom-scrollbar relative select-none"
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto min-w-[720px] max-h-[500px]"
          style={{ overflow: 'visible' }}
        >
          {/* Background Grid Lines (Horizontal Positions) */}
          {positionTicks.map((pos) => {
            const y = getY(pos);
            return (
              <g key={`y-grid-${pos}`}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray={pos === 1 ? 'none' : '3 3'}
                  opacity={pos === 1 ? 0.8 : 0.4}
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#71717a"
                  fontWeight={pos === 1 ? 'bold' : 'normal'}
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
                  opacity={0.3}
                />
                {/* Clickable Lap Label on X-axis */}
                <text
                  x={x}
                  y={SVG_HEIGHT - PADDING_BOTTOM + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={lap === currentLap ? '#f43f5e' : '#a1a1aa'}
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
              y1={PADDING_TOP - 6}
              x2={currentLapX}
              y2={SVG_HEIGHT - PADDING_BOTTOM + 4}
              stroke="var(--primary, #e10600)"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity={0.9}
            />
            {/* Lap Tag at Top */}
            <rect
              x={currentLapX - 22}
              y={PADDING_TOP - 22}
              width={44}
              height={18}
              rx={4}
              fill="var(--primary, #e10600)"
            />
            <text
              x={currentLapX}
              y={PADDING_TOP - 9}
              textAnchor="middle"
              fontSize="9"
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

            let strokeWidth = 2;
            let opacity = 0.7;

            if (hasSelectedDrivers) {
              if (isSelected) {
                strokeWidth = 3.5;
                opacity = 1;
              } else {
                strokeWidth = 1.2;
                opacity = 0.15;
              }
            } else if (isHovered) {
              strokeWidth = 3.5;
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
                  strokeWidth="14"
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
                    filter: isSelected || isHovered ? `drop-shadow(0 0 4px ${line.color}80)` : 'none',
                  }}
                />

                {/* Driver End Code Label */}
                {line.lastPoint && (
                  <text
                    x={line.lastPoint.x + 8}
                    y={line.lastPoint.y + 3.5}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                    fill={isSelected || isHovered ? '#ffffff' : line.color}
                    opacity={hasSelectedDrivers && !isSelected ? 0.3 : 1}
                  >
                    {line.code}
                  </text>
                )}

                {/* Pit Stop Dots */}
                {line.pitPoints.map((pitPt) => (
                  <circle
                    key={`pit-${line.driverId}-${pitPt.lap}`}
                    cx={pitPt.x}
                    cy={pitPt.y}
                    r={isSelected || isHovered ? 4.5 : 3.5}
                    fill="#fbbf24"
                    stroke="#18181b"
                    strokeWidth="1.5"
                    opacity={hasSelectedDrivers && !isSelected ? 0.2 : 0.9}
                  />
                ))}

                {/* DNF Marker */}
                {line.isDnf && line.lastPoint && (
                  <g>
                    <circle
                      cx={line.lastPoint.x}
                      cy={line.lastPoint.y}
                      r="6"
                      fill="#ef4444"
                      stroke="#18181b"
                      strokeWidth="1.5"
                    />
                    <text
                      x={line.lastPoint.x}
                      y={line.lastPoint.y + 3}
                      textAnchor="middle"
                      fontSize="8"
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
                      r={isSelected || isHovered ? 5.5 : 4}
                      fill={line.color}
                      stroke="#18181b"
                      strokeWidth="2"
                      opacity={hasSelectedDrivers && !isSelected ? 0.3 : 1}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredPoint({
                          driverId: line.driverId,
                          code: line.code,
                          name: line.name,
                          lap: currPt.lap,
                          position: currPt.position,
                          time: currPt.time,
                          color: line.color,
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
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-zinc-700 bg-zinc-900/95 p-2.5 shadow-xl text-xs font-mono backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max(10, hoveredPoint.x - 40), SVG_WIDTH - 150)}px`,
            top: `${Math.max(10, hoveredPoint.y - 70)}px`,
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
          </div>
        </div>
      )}
    </div>
  );
}
