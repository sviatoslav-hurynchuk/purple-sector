/**
 * Raw OpenF1 API (v1) Response Interfaces.
 * Mirrors the payloads returned by https://api.openf1.org/v1/
 */

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  country_key: number;
  location: string;
  date_start: string;
  gmt_offset: string;
}

export interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  year: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  country_key: number;
  location: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  country_code: string;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Lap {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
  segments_sector_1?: number[];
  segments_sector_2?: number[];
  segments_sector_3?: number[];
  date_start: string;
}

export interface OpenF1Stint {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}

export interface OpenF1RaceControl {
  date: string;
  driver_number: number | null;
  category: string;
  flag: string | null;
  scope: string | null;
  sector: number | null;
  qualifying_phase?: string | null;
  message: string;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Weather {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  wind_direction: number;
  wind_speed: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Pit {
  date: string;
  driver_number: number;
  lap_number: number;
  lane_duration: number;
  stop_duration: number | null;
  pit_duration?: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | string | null;
  interval: number | string | null;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1CarData {
  date: string;
  driver_number: number;
  rpm: number;
  speed: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1Location {
  date: string;
  driver_number: number;
  x: number;
  y: number;
  z: number;
  meeting_key: number;
  session_key: number;
}

export interface OpenF1TeamRadio {
  date: string;
  driver_number: number;
  recording_url: string;
  meeting_key: number;
  session_key: number;
}
