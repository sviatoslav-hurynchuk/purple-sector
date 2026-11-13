'use client';

import React from 'react';
import type { LiveDriverState, TireCompound } from '@/types/f1';
import type { VisibleColumns } from './timing-tower-column-selector';
import { cn } from '@/lib/utils';
import { formatGap, formatInterval, formatDuration } from '@/lib/formatters';
import { TIRE_COMPOUND_CONFIG } from '@/lib/constants/tyres';

interface DriverRowProps {
  driver: LiveDriverState;
  visibleColumns: VisibleColumns;
  isSelected?: boolean;
  onSelect?: (driverNumber: number) => void;
}

function getCompoundBadge(compound: TireCompound, stintLaps?: number) {
  const config = TIRE_COMPOUND_CONFIG[compound] ?? TIRE_COMPOUND_CONFIG.UNKNOWN;

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={cn(
          'flex items-center justify-center h-4 w-4 rounded-full font-black text-[9px] border',
          config.badgeClass
        )}
      >
        {config.shortLabel}
      </span>
      {typeof stintLaps === 'number' && stintLaps > 0 && (
        <span className="text-[10px] font-mono text-zinc-400">L{stintLaps}</span>
      )}
    </div>
  );
}

export function DriverRow({
  driver,
  visibleColumns,
  isSelected = false,
  onSelect,
}: DriverRowProps) {
  const teamColor = driver.teamColour || '#71717a';

  return (
    <tr
      onClick={() => onSelect?.(driver.driverNumber)}
      className={cn(
        'group cursor-pointer transition-all duration-150 border-b border-white/[0.04]',
        isSelected
          ? 'bg-white/[0.08] shadow-[inset_2px_0_0_0_rgba(255,255,255,0.8)]'
          : 'hover:bg-white/[0.03]'
      )}
    >
      {/* Position & Team Stripe */}
      <td className="py-2.5 pl-3 pr-2 whitespace-nowrap text-left font-mono">
        <div className="flex items-center gap-2">
          <span
            className="w-1 h-5 rounded-full shrink-0"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-bold text-xs sm:text-sm text-zinc-100 w-5 text-right">
            {driver.position}
          </span>
        </div>
      </td>

      {/* Driver Code & Name */}
      <td className="py-2.5 px-2 whitespace-nowrap text-left">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-xs sm:text-sm text-white tracking-wider">
            {driver.code || `#${driver.driverNumber}`}
          </span>
          <span className="hidden md:inline text-xs text-zinc-400 truncate max-w-[120px]">
            {driver.name || driver.teamName}
          </span>
          {driver.isPitOutLap && (
            <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              OUT
            </span>
          )}
        </div>
      </td>

      {/* Tyre */}
      {visibleColumns.tyres && (
        <td className="py-2.5 px-2 whitespace-nowrap text-center">
          {getCompoundBadge(driver.currentCompound, driver.currentStintLaps)}
        </td>
      )}

      {/* Gap */}
      {visibleColumns.gap && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-200">
          {formatGap(driver.gapToLeader)}
        </td>
      )}

      {/* Interval */}
      {visibleColumns.interval && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
          {formatInterval(driver.interval)}
        </td>
      )}

      {/* Last Lap */}
      {visibleColumns.lastLap && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-300">
          {formatDuration(driver.lastLapDuration)}
        </td>
      )}

      {/* Sector 1 */}
      {visibleColumns.s1 && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
          {driver.sector1 ? driver.sector1.toFixed(3) : '—'}
        </td>
      )}

      {/* Sector 2 */}
      {visibleColumns.s2 && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
          {driver.sector2 ? driver.sector2.toFixed(3) : '—'}
        </td>
      )}

      {/* Sector 3 */}
      {visibleColumns.s3 && (
        <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
          {driver.sector3 ? driver.sector3.toFixed(3) : '—'}
        </td>
      )}

      {/* Speed Trap */}
      {visibleColumns.speedTrap && (
        <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
          {driver.speedTrap ? `${Math.round(driver.speedTrap)}` : '—'}
        </td>
      )}
    </tr>
  );
}
