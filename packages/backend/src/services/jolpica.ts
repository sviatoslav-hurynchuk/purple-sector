/**
 * Jolpica F1 API Service
 *
 * Wraps calls to https://api.jolpi.ca/ergast/f1/
 * Rate limits: 4 req/s, 200 req/hour
 *
 * Docs: https://github.com/jolpica/jolpica-f1
 */

const BASE_URL = process.env.JOLPICA_BASE_URL ?? 'https://api.jolpi.ca/ergast/f1';

// TODO: implement getRaceSchedule(season: string)
// TODO: implement getRaceResult(season: string, round: string)
// TODO: implement getDriverStandings(season: string)
// TODO: implement getConstructorStandings(season: string)
// TODO: implement getNextRace()

export const jolpicaService = {
  baseUrl: BASE_URL,
};
