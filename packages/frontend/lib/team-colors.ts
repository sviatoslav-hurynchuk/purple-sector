/**
 * Team color themes for F1 constructors.
 * Includes 2025/2026 F1 season teams and historical constructors.
 */
export interface TeamTheme {
  /** Main team color (hex) */
  primary: string;
  /** Recommended text color on primary background */
  textColor: 'light' | 'dark';
  /** Authentic secondary/accent team color for teammate comparisons */
  secondary?: string;
  /** Recommended text color on secondary background */
  secondaryTextColor?: 'light' | 'dark';
}

const TEAM_THEMES: Record<string, TeamTheme> = {
  // 2025/2026 F1 Season Teams
  mercedes: { primary: '#00D2BE', textColor: 'dark', secondary: '#C0C0C0', secondaryTextColor: 'dark' },
  ferrari: { primary: '#E8002D', textColor: 'light', secondary: '#FFF200', secondaryTextColor: 'dark' },
  red_bull: { primary: '#3671C6', textColor: 'light', secondary: '#EA1D2D', secondaryTextColor: 'light' },
  mclaren: { primary: '#FF8000', textColor: 'dark', secondary: '#47C7FC', secondaryTextColor: 'dark' },
  aston_martin: { primary: '#229971', textColor: 'light', secondary: '#CEDC00', secondaryTextColor: 'dark' },
  alpine: { primary: '#0093CC', textColor: 'light', secondary: '#FD4BC7', secondaryTextColor: 'light' },
  williams: { primary: '#005AFF', textColor: 'light', secondary: '#00A3E0', secondaryTextColor: 'light' },
  rb: { primary: '#6692FF', textColor: 'light', secondary: '#E2E8F0', secondaryTextColor: 'dark' },
  racing_bulls: { primary: '#6692FF', textColor: 'light', secondary: '#E2E8F0', secondaryTextColor: 'dark' },
  kick_sauber: { primary: '#52E252', textColor: 'dark', secondary: '#27272A', secondaryTextColor: 'light' },
  sauber: { primary: '#52E252', textColor: 'dark', secondary: '#27272A', secondaryTextColor: 'light' },
  audi: { primary: '#7800FF', textColor: 'light', secondary: '#E5E7EB', secondaryTextColor: 'dark' },
  haas: { primary: '#E6002B', textColor: 'light', secondary: '#E2E8F0', secondaryTextColor: 'dark' },
  cadillac: { primary: '#7822FF', textColor: 'light', secondary: '#E2E8F0', secondaryTextColor: 'dark' },

  // Historical teams
  renault: { primary: '#FFF500', textColor: 'dark', secondary: '#18181B', secondaryTextColor: 'light' },
  force_india: { primary: '#FF80C7', textColor: 'dark', secondary: '#FF8000', secondaryTextColor: 'dark' },
  racing_point: { primary: '#F596C8', textColor: 'dark', secondary: '#005AFF', secondaryTextColor: 'light' },
  toro_rosso: { primary: '#469BFF', textColor: 'light', secondary: '#DC2626', secondaryTextColor: 'light' },
  lotus_f1: { primary: '#FFB800', textColor: 'dark', secondary: '#18181B', secondaryTextColor: 'light' },
  lotus: { primary: '#FFB800', textColor: 'dark', secondary: '#18181B', secondaryTextColor: 'light' },
  brawn: { primary: '#00E5A3', textColor: 'dark', secondary: '#FFFFFF', secondaryTextColor: 'dark' },
  toyota: { primary: '#CC0000', textColor: 'light', secondary: '#FFFFFF', secondaryTextColor: 'dark' },
  bmw_sauber: { primary: '#6CC0E5', textColor: 'dark', secondary: '#1E3A8A', secondaryTextColor: 'light' },
  honda: { primary: '#C8102E', textColor: 'light', secondary: '#FFFFFF', secondaryTextColor: 'dark' },
};

const DEFAULT_THEME: TeamTheme = { primary: '#7C3AED', textColor: 'light' };

/**
 * Returns the color theme for a given constructor ID.
 */
export function getTeamTheme(constructorId?: string | null): TeamTheme {
  if (!constructorId) return DEFAULT_THEME;
  const key = constructorId.trim().toLowerCase().replace(/-/g, '_');
  return TEAM_THEMES[key] ?? DEFAULT_THEME;
}
