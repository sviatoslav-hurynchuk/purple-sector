'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getTeamTheme } from '@/lib/team-colors';

interface TeamLogoProps {
  constructorId?: string | null;
  season?: string | number;
  className?: string;
  size?: number;
}

/**
 * Mapping of constructor IDs to official broadcast-style team logos/icons.
 * Sourced from official F1 broadcast assets and verified authentic emblems.
 */
const LOGO_MAP: Record<string, string> = {
  // Current Grid (2024–2026)
  ferrari: '/teams/ferrari.webp',
  mercedes: '/teams/mercedes.webp',
  red_bull: '/teams/red_bull.webp',
  mclaren: '/teams/mclaren.webp',
  aston_martin: '/teams/aston_martin.webp',
  alpine: '/teams/alpine.webp',
  williams: '/teams/williams.webp',
  haas: '/teams/haas.webp',
  rb: '/teams/rb.webp',
  audi: '/teams/audi.webp',
  cadillac: '/teams/cadillac.webp',
  kick_sauber: '/teams/kick_sauber.webp',

  // Distinct Sauber Eras
  sauber: '/teams/sauber.jpg',
  alfa_romeo: '/teams/alfa_romeo.svg',
  alfa: '/teams/alfa_romeo.svg',

  // 2010–2023 Era
  alphatauri: '/teams/alphatauri.svg',
  racing_point: '/teams/racing_point.svg',
  toro_rosso: '/teams/toro_rosso.svg',
  force_india: '/teams/force_india.svg',
  renault: '/teams/renault.png',
  lotus: '/teams/lotus.png',
  caterham: '/teams/caterham.png',
  marussia: '/teams/marussia.png',
  hrt: '/teams/hrt.svg',
  virgin: '/teams/virgin.png',

  // 2000–2009 Era
  bmw_sauber: '/teams/bmw_sauber.svg',
  brawn: '/teams/brawn.svg',
  toyota: '/teams/toyota.svg',
  honda: '/teams/honda.svg',
  jordan: '/teams/jordan.png',
  jaguar: '/teams/jaguar.png',
  prost: '/teams/prost.png',
  arrows: '/teams/arrows.png',

  // 1990s Era
  benetton: '/teams/benetton.jpg',
  ligier: '/teams/ligier.png',
  tyrrell: '/teams/tyrrell.svg',
};

/**
 * Constructors with dark/black/monochrome logos that require a white contrast underlay
 * to remain clearly visible, legible and punchy on dark theme.
 */
const DARK_LOGO_TEAMS = new Set([
  'audi',
  'mercedes',
  'aston_martin',
  'kick_sauber',
  'sauber',
  'alfa_romeo',
  'alfa',
  'alphatauri',
  'cadillac',
  'caterham',
  'marussia',
  'hrt',
  'hispania',
  'lotus',
  'lotus_f1',
  'ligier',
  'prost',
  'arrows',
  'footwork',
  'jaguar',
  'benetton',
  'virgin',
  'tyrrell',
  'renault',
  'renault_f1',
]);

/** Common aliases for constructor IDs from Jolpica / Ergast API. */
const ALIASES: Record<string, string> = {
  redbull: 'red_bull',
  redbullracing: 'red_bull',
  astonmartin: 'aston_martin',
  haasf1team: 'haas',
  racing_bulls: 'rb',
  racingbulls: 'rb',
  kicksauber: 'kick_sauber',
  alfaromeo: 'alfa_romeo',
  scuderia_alphatauri: 'alphatauri',
  racingpoint: 'racing_point',
  tororosso: 'toro_rosso',
  forceindia: 'force_india',
  lotus_f1: 'lotus',
  hispania: 'hrt',
  footwork: 'arrows',
  brawn_gp: 'brawn',
  bmw: 'bmw_sauber',
  marussia_f1: 'marussia',
  caterham_f1: 'caterham',
};

/**
 * Resolve constructorId to a local logo file path.
 */
function resolveLogoSrc(constructorId: string): string | null {
  const key = constructorId.trim().toLowerCase().replace(/-/g, '_');
  if (LOGO_MAP[key]) return LOGO_MAP[key];
  const alias = ALIASES[key];
  if (alias && LOGO_MAP[alias]) return LOGO_MAP[alias];
  return null;
}

/**
 * F1 broadcast-style team logo component.
 * Renders official colored broadcast team icons with white contrast underlays
 * for dark-themed / monochrome logos to guarantee high readability.
 */
export function TeamLogo({
  constructorId,
  className,
  size = 22,
}: TeamLogoProps) {
  const id = constructorId ?? '';
  const key = id.trim().toLowerCase().replace(/-/g, '_');
  const normalizedKey = ALIASES[key] ?? key;
  const src = resolveLogoSrc(id);
  const needsWhiteBackdrop = DARK_LOGO_TEAMS.has(normalizedKey);

  if (src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          'relative shrink-0 flex items-center justify-center',
          needsWhiteBackdrop && 'bg-white rounded-sm p-0.5 shadow-xs',
          className
        )}
      >
        <Image
          src={src}
          alt={id}
          width={size * 2}
          height={size * 2}
          className="object-contain w-full h-full drop-shadow-sm"
          unoptimized
        />
      </div>
    );
  }

  // Fallback badge with team theme color and 3-letter code
  const theme = getTeamTheme(constructorId);
  const code = (constructorId ?? 'F1').slice(0, 3).toUpperCase();
  return (
    <div
      style={{ backgroundColor: theme.primary, width: size, height: size }}
      className={cn(
        'rounded-sm flex items-center justify-center font-mono font-black text-[8px] leading-none text-white shrink-0',
        className
      )}
      aria-label={constructorId ?? 'Team'}
    >
      {code}
    </div>
  );
}
