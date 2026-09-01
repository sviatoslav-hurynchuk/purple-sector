export type WidgetId =
  | 'banner'
  | 'weather'
  | 'timing_tower'
  | 'track_map'
  | 'telemetry'
  | 'race_control';

export type WidgetSpan = 'full' | 'two-thirds' | 'half' | 'third';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  enabled: boolean;
  span: WidgetSpan;
  minimized?: boolean;
}

export type LayoutPreset = 'default' | 'pitwall' | 'driver_focus' | 'track_radar' | 'custom';

export interface LiveLayoutState {
  preset: LayoutPreset;
  widgets: WidgetConfig[];
}

export const PRESET_CONFIGS: Record<Exclude<LayoutPreset, 'custom'>, WidgetConfig[]> = {
  default: [
    { id: 'banner', title: 'Session Status & Leader', enabled: true, span: 'two-thirds' },
    { id: 'weather', title: 'Track Conditions & Weather', enabled: true, span: 'third' },
    { id: 'timing_tower', title: 'Live Timing Tower', enabled: true, span: 'two-thirds' },
    { id: 'track_map', title: '2D Track Map', enabled: true, span: 'third' },
    { id: 'telemetry', title: 'Driver Telemetry Trace', enabled: true, span: 'third' },
    { id: 'race_control', title: 'FIA Race Control Feed', enabled: true, span: 'full' },
  ],
  pitwall: [
    { id: 'banner', title: 'Session Status & Leader', enabled: true, span: 'full' },
    { id: 'timing_tower', title: 'Live Timing Tower', enabled: true, span: 'half' },
    { id: 'telemetry', title: 'Driver Telemetry Trace', enabled: true, span: 'half' },
    { id: 'weather', title: 'Track Conditions & Weather', enabled: true, span: 'third' },
    { id: 'race_control', title: 'FIA Race Control Feed', enabled: true, span: 'two-thirds' },
    { id: 'track_map', title: '2D Track Map', enabled: false, span: 'half' },
  ],
  driver_focus: [
    { id: 'banner', title: 'Session Status & Leader', enabled: true, span: 'full' },
    { id: 'telemetry', title: 'Driver Telemetry Trace', enabled: true, span: 'two-thirds' },
    { id: 'track_map', title: '2D Track Map', enabled: true, span: 'third' },
    { id: 'timing_tower', title: 'Live Timing Tower', enabled: true, span: 'half' },
    { id: 'race_control', title: 'FIA Race Control Feed', enabled: true, span: 'half' },
    { id: 'weather', title: 'Track Conditions & Weather', enabled: false, span: 'third' },
  ],
  track_radar: [
    { id: 'banner', title: 'Session Status & Leader', enabled: true, span: 'full' },
    { id: 'track_map', title: '2D Track Map', enabled: true, span: 'two-thirds' },
    { id: 'weather', title: 'Track Conditions & Weather', enabled: true, span: 'third' },
    { id: 'timing_tower', title: 'Live Timing Tower', enabled: true, span: 'half' },
    { id: 'race_control', title: 'FIA Race Control Feed', enabled: true, span: 'half' },
    { id: 'telemetry', title: 'Driver Telemetry Trace', enabled: false, span: 'third' },
  ],
};
