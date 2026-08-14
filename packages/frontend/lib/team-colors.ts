/**
 * Team color themes for F1 constructors.
 * Includes 2025/2026 F1 season teams and historical constructors.
 */
export interface TeamTheme {
  /** Main team color (hex) */
  primary: string;
  /** Recommended text color on team background */
  textColor: 'light' | 'dark';
}

const TEAM_THEMES: Record<string, TeamTheme> = {
  // 2025/2026 F1 Season Teams
  mercedes: { primary: '#00D2BE', textColor: 'dark' },
  ferrari: { primary: '#E8002D', textColor: 'light' },
  red_bull: { primary: '#3671C6', textColor: 'light' },
  mclaren: { primary: '#FF8000', textColor: 'dark' },
  aston_martin: { primary: '#229971', textColor: 'light' },
  alpine: { primary: '#0093CC', textColor: 'light' },
  williams: { primary: '#005AFF', textColor: 'light' },
  rb: { primary: '#6692FF', textColor: 'light' },
  racing_bulls: { primary: '#6692FF', textColor: 'light' },
  kick_sauber: { primary: '#52E252', textColor: 'dark' },
  sauber: { primary: '#52E252', textColor: 'dark' },
  audi: { primary: '#7800FF', textColor: 'light' },
  haas: { primary: '#E6002B', textColor: 'light' }, // Haas Red theme
  cadillac: { primary: '#7822FF', textColor: 'light' },

  // Historical teams
  renault: { primary: '#FFF500', textColor: 'dark' },
  force_india: { primary: '#FF80C7', textColor: 'dark' },
  racing_point: { primary: '#F596C8', textColor: 'dark' },
  toro_rosso: { primary: '#469BFF', textColor: 'light' },
  lotus_f1: { primary: '#FFB800', textColor: 'dark' },
  lotus: { primary: '#FFB800', textColor: 'dark' },
  brawn: { primary: '#00E5A3', textColor: 'dark' },
  toyota: { primary: '#CC0000', textColor: 'light' },
  bmw_sauber: { primary: '#6CC0E5', textColor: 'dark' },
  honda: { primary: '#C8102E', textColor: 'light' },
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
