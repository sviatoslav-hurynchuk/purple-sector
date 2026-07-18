/**
 * OpenF1 API Service
 *
 * Wraps calls to https://api.openf1.org/v1/
 * Rate limits: 3 req/s, 30 req/min
 * Coverage: 2023 onwards (telemetry, positions, radio, weather)
 *
 * Docs: https://openf1.org
 */

const BASE_URL = process.env.OPENF1_BASE_URL ?? 'https://api.openf1.org/v1';

// TODO: implement getSessions(year: number)
// TODO: implement getLaps(sessionKey: number, driverNumber: number)
// TODO: implement getCarData(sessionKey: number, driverNumber: number)
// TODO: implement getWeather(sessionKey: number)
// TODO: implement getPositions(sessionKey: number)

export const openF1Service = {
  baseUrl: BASE_URL,
};
