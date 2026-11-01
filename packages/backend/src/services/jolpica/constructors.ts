import type {
  Constructor,
  ConstructorProfile,
  ConstructorMeta,
  ConstructorCareerStats,
  ConstructorDriverHistory,
} from '../../types/f1';
import { cache } from '../cache';
import { getOfficialF1TeamDetails } from '../f1-official';
import {
  TTL,
  getCurrentSeason,
  jolpicaFetch,
  cachedFetch,
  type JolpicaResponse,
  type NegativeCacheSentinel,
  isNegativeCacheSentinel,
} from './client';
import { lookupDriverRegistry, type JolpicaDriversResponse } from './drivers';
import type { JolpicaRaceResultsResponse } from './races';

export interface ConstructorTable {
  season?: string;
  constructorId?: string;
  Constructors: Constructor[];
}

export interface SeasonTable {
  constructorId?: string;
  Seasons: Array<{ season: string; url: string }>;
}

export type JolpicaConstructorsResponse = JolpicaResponse<'ConstructorTable', ConstructorTable>;
export type JolpicaSeasonsResponse = JolpicaResponse<'SeasonTable', SeasonTable>;

export interface ConstructorRegistryData extends ConstructorMeta {
  currentDrivers: string[];
  stats?: {
    championships: number;
    totalRaces: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps?: number;
  };
}

export const CONSTRUCTOR_REGISTRY: Record<string, ConstructorRegistryData> = {
  ferrari: {
    fullName: 'Scuderia Ferrari HP',
    base: 'Maranello, Italy',
    teamPrincipal: 'Frédéric Vasseur',
    technicalChief: 'Loïc Serra',
    chassis: 'SF-26',
    powerUnit: 'Ferrari',
    firstEntry: 1950,
    worldChampionships: [1961, 1964, 1975, 1976, 1977, 1979, 1982, 1983, 1999, 2000, 2001, 2002, 2003, 2004, 2007, 2008],
    currentDrivers: ['hamilton', 'leclerc'],
    stats: { championships: 16, totalRaces: 1135, wins: 251, podiums: 857, poles: 253, fastestLaps: 264 },
  },
  mclaren: {
    fullName: 'McLaren Formula 1 Team',
    base: 'Woking, United Kingdom',
    teamPrincipal: 'Andrea Stella',
    technicalChief: 'Peter Prodromou / Neil Houldey',
    chassis: 'MCL40',
    powerUnit: 'Mercedes',
    firstEntry: 1966,
    worldChampionships: [1974, 1984, 1985, 1988, 1989, 1990, 1991, 1998, 2024],
    currentDrivers: ['norris', 'piastri'],
    stats: { championships: 10, totalRaces: 965, wins: 200, podiums: 547, poles: 178, fastestLaps: 178 },
  },
  mercedes: {
    fullName: 'Mercedes-AMG PETRONAS F1 Team',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Toto Wolff',
    technicalChief: 'James Allison',
    chassis: 'F1 W17',
    powerUnit: 'Mercedes',
    firstEntry: 1954,
    worldChampionships: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
    currentDrivers: ['russell', 'antonelli'],
    stats: { championships: 8, totalRaces: 352, wins: 139, podiums: 324, poles: 146, fastestLaps: 114 },
  },
  red_bull: {
    fullName: 'Oracle Red Bull Racing',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Christian Horner',
    technicalChief: 'Pierre Waché',
    chassis: 'RB22',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2005,
    worldChampionships: [2010, 2011, 2012, 2013, 2022, 2023],
    currentDrivers: ['max_verstappen', 'hadjar'],
    stats: { championships: 6, totalRaces: 429, wins: 130, podiums: 301, poles: 107, fastestLaps: 104 },
  },
  williams: {
    fullName: 'Williams Racing',
    base: 'Grove, United Kingdom',
    teamPrincipal: 'James Vowles',
    technicalChief: 'Pat Fry',
    chassis: 'FW48',
    powerUnit: 'Mercedes',
    firstEntry: 1978,
    worldChampionships: [1980, 1981, 1986, 1987, 1992, 1993, 1994, 1996, 1997],
    currentDrivers: ['sainz', 'albon'],
    stats: { championships: 9, totalRaces: 878, wins: 114, podiums: 316, poles: 128, fastestLaps: 133 },
  },
  aston_martin: {
    fullName: 'Aston Martin Aramco F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Mike Krack',
    technicalChief: 'Dan Fallows',
    chassis: 'AMR26',
    powerUnit: 'Honda',
    firstEntry: 1959,
    worldChampionships: [],
    currentDrivers: ['alonso', 'stroll'],
    stats: { championships: 0, totalRaces: 115, wins: 0, podiums: 9, poles: 0, fastestLaps: 3 },
  },
  alpine: {
    fullName: 'BWT Alpine F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Oliver Oakes',
    technicalChief: 'David Sanchez',
    chassis: 'A526',
    powerUnit: 'Mercedes',
    firstEntry: 1986,
    worldChampionships: [2005, 2006],
    currentDrivers: ['gasly', 'colapinto'],
    stats: { championships: 2, totalRaces: 490, wins: 22, podiums: 108, poles: 20, fastestLaps: 15 },
  },
  haas: {
    fullName: 'MoneyGram Haas F1 Team',
    base: 'Kannapolis, United States',
    teamPrincipal: 'Ayao Komatsu',
    technicalChief: 'Andrea De Zordo',
    chassis: 'VF-26',
    powerUnit: 'Ferrari',
    firstEntry: 2016,
    worldChampionships: [],
    currentDrivers: ['bearman', 'ocon'],
    stats: { championships: 0, totalRaces: 208, wins: 0, podiums: 0, poles: 1, fastestLaps: 2 },
  },
  rb: {
    fullName: 'Visa Cash App RB Formula One Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Laurent Mekies',
    technicalChief: 'Jody Egginton',
    chassis: 'VCARB 03',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: ['lawson', 'arvid_lindblad'],
    stats: { championships: 0, totalRaces: 395, wins: 2, podiums: 5, poles: 1, fastestLaps: 4 },
  },
  racing_bulls: {
    fullName: 'Visa Cash App RB Formula One Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Laurent Mekies',
    technicalChief: 'Jody Egginton',
    chassis: 'VCARB 03',
    powerUnit: 'Red Bull Ford Powertrains',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: ['lawson', 'arvid_lindblad'],
    stats: { championships: 0, totalRaces: 395, wins: 2, podiums: 5, poles: 1, fastestLaps: 4 },
  },
  sauber: {
    fullName: 'Stake F1 Team Kick Sauber',
    base: 'Hinwil, Switzerland',
    teamPrincipal: 'Mattia Binotto',
    technicalChief: 'James Key',
    chassis: 'C46',
    powerUnit: 'Ferrari',
    firstEntry: 1993,
    worldChampionships: [],
    currentDrivers: ['hulkenberg', 'bortoleto'],
    stats: { championships: 0, totalRaces: 480, wins: 1, podiums: 27, poles: 1, fastestLaps: 7 },
  },
  audi: {
    fullName: 'Audi Revolut F1 Team',
    base: 'Neuburg, Germany / Hinwil, Switzerland',
    teamPrincipal: 'Mattia Binotto',
    technicalChief: 'James Key',
    chassis: 'R26',
    powerUnit: 'Audi',
    firstEntry: 2026,
    worldChampionships: [],
    currentDrivers: ['hulkenberg', 'bortoleto'],
    stats: { championships: 0, totalRaces: 0, wins: 0, podiums: 0, poles: 0 },
  },
  cadillac: {
    fullName: 'Cadillac Formula 1 Team',
    base: 'Fishers, Indiana, United States / Silverstone, UK',
    teamPrincipal: 'Graeme Lowdon',
    technicalChief: 'Nick Chester',
    chassis: 'CT-26',
    powerUnit: 'Ferrari',
    firstEntry: 2026,
    worldChampionships: [],
    currentDrivers: ['bottas', 'perez'],
    stats: { championships: 0, totalRaces: 0, wins: 0, podiums: 0, poles: 0 },
  },
  renault: {
    fullName: 'Renault F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Cyril Abiteboul',
    powerUnit: 'Renault',
    firstEntry: 1977,
    worldChampionships: [2005, 2006],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 403, wins: 35, podiums: 107, poles: 51, fastestLaps: 33 },
  },
  benetton: {
    fullName: 'Benetton Formula',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Flavio Briatore',
    powerUnit: 'Ford / Renault',
    firstEntry: 1986,
    worldChampionships: [1995],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 260, wins: 27, podiums: 102, poles: 15, fastestLaps: 36 },
  },
  brawn: {
    fullName: 'Brawn GP Formula One Team',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Ross Brawn',
    powerUnit: 'Mercedes',
    firstEntry: 2009,
    worldChampionships: [2009],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 17, wins: 8, podiums: 15, poles: 5, fastestLaps: 4 },
  },
  tyrrell: {
    fullName: 'Tyrrell Racing Organisation',
    base: 'Ockham, United Kingdom',
    teamPrincipal: 'Ken Tyrrell',
    powerUnit: 'Ford Cosworth / Yamaha',
    firstEntry: 1970,
    worldChampionships: [1971],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 430, wins: 23, podiums: 77, poles: 14, fastestLaps: 20 },
  },
  lotus: {
    fullName: 'Team Lotus',
    base: 'Hethel, United Kingdom',
    teamPrincipal: 'Colin Chapman',
    powerUnit: 'Climax / Ford Cosworth',
    firstEntry: 1958,
    worldChampionships: [1963, 1965, 1968, 1970, 1972, 1973, 1978],
    currentDrivers: [],
    stats: { championships: 7, totalRaces: 491, wins: 73, podiums: 171, poles: 107, fastestLaps: 65 },
  },
  team_lotus: {
    fullName: 'Team Lotus',
    base: 'Hethel, United Kingdom',
    teamPrincipal: 'Colin Chapman',
    powerUnit: 'Climax / Ford Cosworth',
    firstEntry: 1958,
    worldChampionships: [1963, 1965, 1968, 1970, 1972, 1973, 1978],
    currentDrivers: [],
    stats: { championships: 7, totalRaces: 491, wins: 73, podiums: 171, poles: 107, fastestLaps: 65 },
  },
  lotus_f1: {
    fullName: 'Lotus F1 Team',
    base: 'Enstone, United Kingdom',
    teamPrincipal: 'Éric Boullier / Matthew Carter',
    powerUnit: 'Renault / Mercedes',
    firstEntry: 2012,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 77, wins: 2, podiums: 25, poles: 0, fastestLaps: 5 },
  },
  force_india: {
    fullName: 'Sahara Force India F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Vijay Mallya / Otmar Szafnauer',
    powerUnit: 'Mercedes',
    firstEntry: 2008,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 212, wins: 0, podiums: 6, poles: 1, fastestLaps: 5 },
  },
  racing_point: {
    fullName: 'BWT Racing Point F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Otmar Szafnauer',
    powerUnit: 'BWT Mercedes',
    firstEntry: 2019,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 38, wins: 1, podiums: 4, poles: 1, fastestLaps: 0 },
  },
  toro_rosso: {
    fullName: 'Scuderia Toro Rosso',
    base: 'Faenza, Italy',
    teamPrincipal: 'Franz Tost',
    powerUnit: 'Ferrari / Renault / Honda',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 268, wins: 1, podiums: 3, poles: 1, fastestLaps: 1 },
  },
  alphatauri: {
    fullName: 'Scuderia AlphaTauri',
    base: 'Faenza, Italy',
    teamPrincipal: 'Franz Tost',
    powerUnit: 'Honda / Red Bull Powertrains',
    firstEntry: 2020,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 83, wins: 1, podiums: 2, poles: 0, fastestLaps: 2 },
  },
  bmw_sauber: {
    fullName: 'BMW Sauber F1 Team',
    base: 'Hinwil, Switzerland / Munich, Germany',
    teamPrincipal: 'Mario Theissen',
    powerUnit: 'BMW',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 70, wins: 1, podiums: 17, poles: 1, fastestLaps: 2 },
  },
  jordan: {
    fullName: 'Jordan Grand Prix',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Eddie Jordan',
    powerUnit: 'Ford / Mugen-Honda / Jordan',
    firstEntry: 1991,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 250, wins: 4, podiums: 19, poles: 2, fastestLaps: 2 },
  },
  minardi: {
    fullName: 'Minardi F1 Team',
    base: 'Faenza, Italy',
    teamPrincipal: 'Giancarlo Minardi / Paul Stoddart',
    powerUnit: 'Ford Cosworth / Asiatech',
    firstEntry: 1985,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 340, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  stewart: {
    fullName: 'Stewart Grand Prix',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Jackie Stewart',
    powerUnit: 'Ford',
    firstEntry: 1997,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 49, wins: 1, podiums: 5, poles: 1, fastestLaps: 0 },
  },
  jaguar: {
    fullName: 'Jaguar Racing F1 Team',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Bobby Rahal / Niki Lauda / Tony Purnell',
    powerUnit: 'Cosworth',
    firstEntry: 2000,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 85, wins: 0, podiums: 2, poles: 0, fastestLaps: 0 },
  },
  bar: {
    fullName: 'British American Racing',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Craig Pollock / David Richards / Nick Fry',
    powerUnit: 'Supertec / Honda',
    firstEntry: 1999,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 117, wins: 0, podiums: 15, poles: 2, fastestLaps: 0 },
  },
  honda: {
    fullName: 'Honda Racing F1 Team',
    base: 'Brackley, United Kingdom',
    teamPrincipal: 'Nick Fry / Ross Brawn',
    powerUnit: 'Honda',
    firstEntry: 1964,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 88, wins: 3, podiums: 9, poles: 2, fastestLaps: 2 },
  },
  toyota: {
    fullName: 'Panasonic Toyota Racing',
    base: 'Cologne, Germany',
    teamPrincipal: 'Ove Andersson / Tsutomu Tomita / Tadashi Yamashina',
    powerUnit: 'Toyota',
    firstEntry: 2002,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 140, wins: 0, podiums: 13, poles: 3, fastestLaps: 3 },
  },
  alfa: {
    fullName: 'Alfa Romeo F1 Team',
    base: 'Hinwil, Switzerland / Milan, Italy',
    teamPrincipal: 'Frédéric Vasseur / Alessandro Alunni Bravi',
    powerUnit: 'Ferrari',
    firstEntry: 1950,
    worldChampionships: [1950, 1951],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 214, wins: 11, podiums: 26, poles: 12, fastestLaps: 16 },
  },
  marussia: {
    fullName: 'Marussia F1 Team',
    base: 'Banbury, United Kingdom',
    teamPrincipal: 'John Booth',
    powerUnit: 'Cosworth / Ferrari',
    firstEntry: 2012,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 73, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  manor: {
    fullName: 'Manor Racing MRT',
    base: 'Banbury, United Kingdom',
    teamPrincipal: 'Dave Ryan',
    powerUnit: 'Mercedes',
    firstEntry: 2016,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 21, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  caterham: {
    fullName: 'Caterham F1 Team',
    base: 'Leafield, United Kingdom',
    teamPrincipal: 'Tony Fernandes / Cyril Abiteboul / Christijan Albers',
    powerUnit: 'Renault',
    firstEntry: 2012,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 56, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  hrt: {
    fullName: 'HRT Formula 1 Team',
    base: 'Madrid, Spain',
    teamPrincipal: 'Colin Kolles / Luis Pérez-Sala',
    powerUnit: 'Cosworth',
    firstEntry: 2010,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 56, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  virgin: {
    fullName: 'Virgin Racing',
    base: 'Dinnington, United Kingdom',
    teamPrincipal: 'John Booth',
    powerUnit: 'Cosworth',
    firstEntry: 2010,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 38, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  lotus_racing: {
    fullName: 'Lotus Racing',
    base: 'Hingham, United Kingdom',
    teamPrincipal: 'Tony Fernandes',
    powerUnit: 'Cosworth',
    firstEntry: 2010,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 19, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  arrows: {
    fullName: 'Arrows Grand Prix International',
    base: 'Milton Keynes / Leafield, United Kingdom',
    teamPrincipal: 'Jackie Oliver / Tom Walkinshaw',
    powerUnit: 'Ford / Yamaha / Supertec / Asiatech',
    firstEntry: 1978,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 382, wins: 0, podiums: 8, poles: 1, fastestLaps: 1 },
  },
  prost: {
    fullName: 'Prost Grand Prix',
    base: 'Guyancourt, France',
    teamPrincipal: 'Alain Prost',
    powerUnit: 'Mugen-Honda / Peugeot / Acer',
    firstEntry: 1997,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 83, wins: 0, podiums: 3, poles: 0, fastestLaps: 0 },
  },
  ligier: {
    fullName: 'Equipe Ligier',
    base: 'Abrest / Magny-Cours, France',
    teamPrincipal: 'Guy Ligier / Flavio Briatore',
    powerUnit: 'Matra / Renault / Mugen-Honda',
    firstEntry: 1976,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 326, wins: 9, podiums: 50, poles: 9, fastestLaps: 10 },
  },
  march: {
    fullName: 'March Engineering',
    base: 'Bicester, United Kingdom',
    teamPrincipal: 'Max Mosley / Robin Herd',
    powerUnit: 'Ford Cosworth / Ilmor',
    firstEntry: 1970,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 207, wins: 3, podiums: 21, poles: 5, fastestLaps: 7 },
  },
  brabham: {
    fullName: 'Motor Racing Developments (Brabham)',
    base: 'Chessington, United Kingdom',
    teamPrincipal: 'Jack Brabham / Bernie Ecclestone',
    powerUnit: 'Repco / Ford Cosworth / Alfa Romeo / BMW',
    firstEntry: 1962,
    worldChampionships: [1966, 1967],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 394, wins: 35, podiums: 124, poles: 39, fastestLaps: 41 },
  },
  cooper: {
    fullName: 'Cooper Car Company',
    base: 'Surbiton, United Kingdom',
    teamPrincipal: 'John Cooper',
    powerUnit: 'Bristol / Climax / Maserati',
    firstEntry: 1950,
    worldChampionships: [1959, 1960],
    currentDrivers: [],
    stats: { championships: 2, totalRaces: 129, wins: 16, podiums: 58, poles: 11, fastestLaps: 14 },
  },
  brm: {
    fullName: 'British Racing Motors (BRM)',
    base: 'Bourne, United Kingdom',
    teamPrincipal: 'Alfred Owen / Louis Stanley',
    powerUnit: 'BRM',
    firstEntry: 1951,
    worldChampionships: [1962],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 197, wins: 17, podiums: 61, poles: 11, fastestLaps: 15 },
  },
  matra: {
    fullName: 'Matra Sports',
    base: 'Vélizy-Villacoublay, France',
    teamPrincipal: 'Jean-Luc Lagardère / Ken Tyrrell',
    powerUnit: 'Ford Cosworth / Matra',
    firstEntry: 1967,
    worldChampionships: [1969],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 125, wins: 9, podiums: 21, poles: 4, fastestLaps: 12 },
  },
  vanwall: {
    fullName: 'Vandervell Products (Vanwall)',
    base: 'Acton, London, United Kingdom',
    teamPrincipal: 'Tony Vandervell',
    powerUnit: 'Vanwall',
    firstEntry: 1954,
    worldChampionships: [1958],
    currentDrivers: [],
    stats: { championships: 1, totalRaces: 28, wins: 9, podiums: 13, poles: 7, fastestLaps: 6 },
  },
  maserati: {
    fullName: 'Officine Alfieri Maserati',
    base: 'Modena, Italy',
    teamPrincipal: 'Adolfo Orsi',
    powerUnit: 'Maserati',
    firstEntry: 1950,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 70, wins: 9, podiums: 37, poles: 10, fastestLaps: 15 },
  },
  lancia: {
    fullName: 'Scuderia Lancia',
    base: 'Turin, Italy',
    teamPrincipal: 'Gianni Lancia / Vittorio Jano',
    powerUnit: 'Lancia',
    firstEntry: 1954,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 4, wins: 0, podiums: 1, poles: 2, fastestLaps: 1 },
  },
  porsche: {
    fullName: 'Porsche System Engineering',
    base: 'Stuttgart, Germany',
    teamPrincipal: 'Ferry Porsche / Huschke von Hanstein',
    powerUnit: 'Porsche',
    firstEntry: 1957,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 31, wins: 1, podiums: 5, poles: 1, fastestLaps: 0 },
  },
  shadow: {
    fullName: 'Shadow Racing Cars',
    base: 'Northampton, United Kingdom',
    teamPrincipal: 'Don Nichols',
    powerUnit: 'Ford Cosworth / Matra',
    firstEntry: 1973,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 104, wins: 1, podiums: 7, poles: 3, fastestLaps: 2 },
  },
  surtees: {
    fullName: 'Surtees Racing Organisation',
    base: 'Edenbridge, United Kingdom',
    teamPrincipal: 'John Surtees',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1970,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 118, wins: 0, podiums: 2, poles: 0, fastestLaps: 3 },
  },
  wolf: {
    fullName: 'Walter Wolf Racing',
    base: 'Reading, United Kingdom',
    teamPrincipal: 'Walter Wolf / Peter Warr',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1977,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 47, wins: 3, podiums: 13, poles: 1, fastestLaps: 2 },
  },
  penske: {
    fullName: 'Penske Cars',
    base: 'Poole, United Kingdom',
    teamPrincipal: 'Roger Penske',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1974,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 30, wins: 1, podiums: 3, poles: 0, fastestLaps: 0 },
  },
  parnelli: {
    fullName: 'Vel\'s Parnelli Jones Racing',
    base: 'Torrance, California, United States',
    teamPrincipal: 'Parnelli Jones / Vel Miletich',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1974,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 16, wins: 0, podiums: 0, poles: 0, fastestLaps: 1 },
  },
  hesketh: {
    fullName: 'Hesketh Racing',
    base: 'Towcester, United Kingdom',
    teamPrincipal: 'Lord Hesketh / Anthony Horsley',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1974,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 52, wins: 1, podiums: 7, poles: 0, fastestLaps: 1 },
  },
  ensign: {
    fullName: 'Team Ensign',
    base: 'Walsall, United Kingdom',
    teamPrincipal: 'Mo Nunn',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1973,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 99, wins: 0, podiums: 0, poles: 0, fastestLaps: 1 },
  },
  fittipaldi: {
    fullName: 'Fittipaldi Automotive (Copersucar)',
    base: 'São Paulo, Brazil / Reading, UK',
    teamPrincipal: 'Wilson Fittipaldi',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1975,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 103, wins: 0, podiums: 3, poles: 0, fastestLaps: 0 },
  },
  ats: {
    fullName: 'Auto Technisches Spezialzubehör (ATS)',
    base: 'Bad Dürkheim, Germany',
    teamPrincipal: 'Günter Schmid',
    powerUnit: 'Ford Cosworth / BMW',
    firstEntry: 1977,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 89, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  theodore: {
    fullName: 'Theodore Racing',
    base: 'Hong Kong / Reading, United Kingdom',
    teamPrincipal: 'Teddy Yip / Sid Taylor',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1978,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 33, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  osella: {
    fullName: 'Osella Squadra Corse',
    base: 'Volpiano, Italy',
    teamPrincipal: 'Enzo Osella',
    powerUnit: 'Ford Cosworth / Alfa Romeo',
    firstEntry: 1980,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 132, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  toleman: {
    fullName: 'Toleman Motorsport',
    base: 'Witney, United Kingdom',
    teamPrincipal: 'Ted Toleman / Alex Hawkridge',
    powerUnit: 'Hart',
    firstEntry: 1981,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 57, wins: 0, podiums: 3, poles: 1, fastestLaps: 2 },
  },
  dallara: {
    fullName: 'BMS Scuderia Italia (Dallara)',
    base: 'Brescia, Italy',
    teamPrincipal: 'Giuseppe Lucchini',
    powerUnit: 'Ford Cosworth / Judd / Ferrari',
    firstEntry: 1988,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 78, wins: 0, podiums: 2, poles: 0, fastestLaps: 0 },
  },
  larrousse: {
    fullName: 'Larrousse Calmels / Team Larrousse',
    base: 'Antony / Signes, France',
    teamPrincipal: 'Gérard Larrousse / Didier Calmels',
    powerUnit: 'Ford Cosworth / Lamborghini',
    firstEntry: 1987,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 127, wins: 0, podiums: 1, poles: 0, fastestLaps: 0 },
  },
  leyton_house: {
    fullName: 'Leyton House Racing',
    base: 'Bicester, United Kingdom',
    teamPrincipal: 'Akira Akagi / Ian Phillips',
    powerUnit: 'Judd / Ilmor',
    firstEntry: 1990,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 30, wins: 0, podiums: 1, poles: 0, fastestLaps: 0 },
  },
  footwork: {
    fullName: 'Footwork Grand Prix International',
    base: 'Milton Keynes, United Kingdom',
    teamPrincipal: 'Wataru Ohashi / Jackie Oliver',
    powerUnit: 'Porsche / Ford / Mugen-Honda / Hart',
    firstEntry: 1991,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 91, wins: 0, podiums: 1, poles: 0, fastestLaps: 0 },
  },
  simtek: {
    fullName: 'Simtek Grand Prix',
    base: 'Banbury, United Kingdom',
    teamPrincipal: 'Nick Wirth',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1994,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 21, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  pacific: {
    fullName: 'Pacific Grand Prix',
    base: 'Thetford, United Kingdom',
    teamPrincipal: 'Keith Wiggins',
    powerUnit: 'Ilmor / Ford Cosworth',
    firstEntry: 1994,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 22, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  forti: {
    fullName: 'Forti Corse',
    base: 'Alessandria, Italy',
    teamPrincipal: 'Guido Forti',
    powerUnit: 'Ford Cosworth',
    firstEntry: 1995,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 23, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  super_aguri: {
    fullName: 'Super Aguri F1 Team',
    base: 'Leafield, United Kingdom / Tokyo, Japan',
    teamPrincipal: 'Aguri Suzuki',
    powerUnit: 'Honda',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 39, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  spyker: {
    fullName: 'Spyker F1 Team',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Colin Kolles / Michiel Mol',
    powerUnit: 'Ferrari',
    firstEntry: 2007,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 17, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
  midland: {
    fullName: 'Midland F1 Racing',
    base: 'Silverstone, United Kingdom',
    teamPrincipal: 'Colin Kolles',
    powerUnit: 'Toyota',
    firstEntry: 2006,
    worldChampionships: [],
    currentDrivers: [],
    stats: { championships: 0, totalRaces: 18, wins: 0, podiums: 0, poles: 0, fastestLaps: 0 },
  },
};

export function lookupConstructorRegistry(key: string): ConstructorRegistryData | undefined {
  return Object.prototype.hasOwnProperty.call(CONSTRUCTOR_REGISTRY, key) ? CONSTRUCTOR_REGISTRY[key] : undefined;
}

export async function getSeasonConstructors(season?: string | number): Promise<Constructor[]> {
  const s = season ? String(season) : getCurrentSeason();
  const cacheKey = `f1:constructors:${s}`;

  return cachedFetch(cacheKey, TTL.SCHEDULE_PAST, async () => {
    const data = await jolpicaFetch<JolpicaConstructorsResponse>(`/${s}/constructors.json?limit=100`);
    const constructors = data.MRData.ConstructorTable.Constructors ?? [];

    // Ensure season has debut/newly registered constructors if not yet in Jolpica API
    const currentYearNum = Number(s);
    const existingIds = new Set(constructors.map((c) => c.constructorId));
    for (const [id, meta] of Object.entries(CONSTRUCTOR_REGISTRY)) {
      if (!existingIds.has(id) && meta.firstEntry === currentYearNum) {
        constructors.push({
          constructorId: id,
          name: meta.fullName,
          nationality: meta.base.includes('Italy')
            ? 'Italian'
            : meta.base.includes('United States')
            ? 'American'
            : meta.base.includes('Germany')
            ? 'German'
            : meta.base.includes('France')
            ? 'French'
            : meta.base.includes('Japan')
            ? 'Japanese'
            : meta.base.includes('Switzerland')
            ? 'Swiss'
            : 'British',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(meta.fullName)}`,
        });
      }
    }

    return constructors;
  });
}

const inFlightConstructorProfiles = new Map<string, Promise<ConstructorProfile | null>>();

export async function getConstructorProfile(constructorId: string): Promise<ConstructorProfile | null> {
  const rawId = constructorId.trim().toLowerCase();
  const idMap: Record<string, string> = {
    redbull: 'red_bull',
    'red-bull': 'red_bull',
    redbullracing: 'red_bull',
    racingbulls: 'rb',
    'racing-bulls': 'rb',
    racing_bulls: 'rb',
    astonmartin: 'aston_martin',
    'aston-martin': 'aston_martin',
    'kick-sauber': 'sauber',
    'kick_sauber': 'sauber',
    kicksauber: 'sauber',
    'alfa-romeo': 'alfa',
    'alfaromeo': 'alfa',
    alfa_romeo: 'alfa',
    'team-lotus': 'lotus',
    'team_lotus': 'lotus',
    'lotus-f1': 'lotus_f1',
    'force-india': 'force_india',
    forceindia: 'force_india',
    'racing-point': 'racing_point',
    racingpoint: 'racing_point',
    'toro-rosso': 'toro_rosso',
    tororosso: 'toro_rosso',
    'bmw-sauber': 'bmw_sauber',
    bmwsauber: 'bmw_sauber',
  };
  const id = idMap[rawId] ?? rawId;
  const cacheKey = `f1:constructor:profile:${id}`;

  const registryEntry = lookupConstructorRegistry(id) ?? lookupConstructorRegistry(rawId);
  const isDebutTeam = registryEntry?.firstEntry === 2026;

  // Check cache first with sanity validation (established teams must have >0 races)
  const cached = await cache.get<ConstructorProfile | NegativeCacheSentinel>(cacheKey);
  if (cached !== null && cached !== undefined) {
    if (isNegativeCacheSentinel(cached)) {
      console.log(`[Cache NEGATIVE HIT] ${cacheKey}`);
      return null;
    }
    if (isDebutTeam || registryEntry === undefined || (cached.stats && cached.stats.totalRaces > 0)) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached;
    }
    console.log(`[Cache STALE/INVALID] ${cacheKey} had 0 races for established team, refreshing...`);
  }

  // Deduplicate concurrent in-flight requests for the same constructor
  const inFlight = inFlightConstructorProfiles.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      // Lean requests via throttled queue + official F1 scraper
      const [constructorRes, driversRes, seasonsRes, racesRes, p1Res, p2Res, p3Res, officialDetails] = await Promise.all([
        jolpicaFetch<JolpicaConstructorsResponse>(`/constructors/${id}.json`).catch(() => null),
        jolpicaFetch<JolpicaDriversResponse>(`/constructors/${id}/drivers.json?limit=100`).catch(() => null),
        jolpicaFetch<JolpicaSeasonsResponse>(`/constructors/${id}/seasons.json?limit=100`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/races.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/1.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/2.json?limit=1`).catch(() => null),
        jolpicaFetch<JolpicaRaceResultsResponse>(`/constructors/${id}/results/3.json?limit=1`).catch(() => null),
        getOfficialF1TeamDetails(id).catch(() => null),
      ]);

      let constructorEntity: Constructor | undefined = constructorRes?.MRData.ConstructorTable.Constructors[0];

      if (!constructorEntity) {
        if (registryEntry) {
          constructorEntity = {
            constructorId: id,
            name: registryEntry.fullName,
            nationality: registryEntry.base.includes('Italy')
              ? 'Italian'
              : registryEntry.base.includes('United States')
              ? 'American'
              : registryEntry.base.includes('Germany')
              ? 'German'
              : registryEntry.base.includes('France')
              ? 'French'
              : registryEntry.base.includes('Japan')
              ? 'Japanese'
              : registryEntry.base.includes('Switzerland')
              ? 'Swiss'
              : 'British',
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(registryEntry.fullName)}`,
          };
        } else {
          const sentinel: NegativeCacheSentinel = { __negativeCache: true };
          await cache.set(cacheKey, sentinel, TTL.NEGATIVE_CACHE);
          return null;
        }
      }

      const validConstructor: Constructor = constructorEntity;

      // Aggregate drivers list
      const rawDrivers = driversRes?.MRData.DriverTable.Drivers ?? [];
      const historicalDrivers: ConstructorDriverHistory[] = rawDrivers.map((d) => ({
        driverId: d.driverId,
        givenName: d.givenName,
        familyName: d.familyName,
        code: d.code,
        permanentNumber: d.permanentNumber,
        nationality: d.nationality,
      }));

      // Current drivers from registry / 2026 grid
      const currentDriverIds = registryEntry?.currentDrivers ?? [];
      const currentDrivers: ConstructorDriverHistory[] = currentDriverIds.map((driverKey) => {
        const foundHistorical = historicalDrivers.find((h) => h.driverId === driverKey);
        if (foundHistorical) return foundHistorical;
        const driverFallback = lookupDriverRegistry(driverKey);
        return {
          driverId: driverKey,
          givenName: driverFallback?.givenName ?? driverKey,
          familyName: driverFallback?.familyName ?? '',
          code: driverFallback?.code,
          permanentNumber: driverFallback?.permanentNumber,
          nationality: driverFallback?.nationality ?? 'International',
        };
      });

      // Ensure current drivers are also in historical list
      for (const cd of currentDrivers) {
        if (!historicalDrivers.some((h) => h.driverId === cd.driverId)) {
          historicalDrivers.unshift(cd);
        }
      }

      const fallbackStats = registryEntry?.stats;
      const jolpicaRaces = parseInt(racesRes?.MRData.total ?? '0', 10);
      const jolpicaWins = parseInt(p1Res?.MRData.total ?? '0', 10);
      const p2Count = parseInt(p2Res?.MRData.total ?? '0', 10);
      const p3Count = parseInt(p3Res?.MRData.total ?? '0', 10);
      const jolpicaPodiums = jolpicaWins + p2Count + p3Count;

      // Use higher of live Jolpica count, official F1 details, and verified registry baseline
      const totalRaces = Math.max(jolpicaRaces, fallbackStats?.totalRaces ?? 0);
      const wins = Math.max(jolpicaWins, fallbackStats?.wins ?? 0);
      const podiums = Math.max(jolpicaPodiums, fallbackStats?.podiums ?? 0);
      const poles = Math.max(officialDetails?.polePositions ?? 0, fallbackStats?.poles ?? 0);
      const fastestLaps = Math.max(officialDetails?.fastestLaps ?? 0, fallbackStats?.fastestLaps ?? 0);
      const championships = Math.max(
        officialDetails?.worldChampionships ?? 0,
        registryEntry?.worldChampionships?.length ?? 0,
        fallbackStats?.championships ?? 0
      );

      const seasonsCount = parseInt(
        seasonsRes?.MRData.total ??
          (registryEntry?.firstEntry ? String(Number(getCurrentSeason()) - registryEntry.firstEntry + 1) : '1'),
        10
      );

      const stats: ConstructorCareerStats = {
        championships,
        totalRaces,
        wins,
        podiums,
        poles,
        fastestLaps,
      };

      const meta: ConstructorMeta = {
        fullName: officialDetails?.fullName ?? registryEntry?.fullName ?? validConstructor.name,
        base: officialDetails?.base ?? registryEntry?.base ?? 'United Kingdom',
        teamPrincipal: officialDetails?.teamPrincipal ?? registryEntry?.teamPrincipal ?? 'Team Leadership',
        technicalChief: officialDetails?.technicalChief ?? registryEntry?.technicalChief,
        chassis: officialDetails?.chassis ?? registryEntry?.chassis,
        powerUnit: officialDetails?.powerUnit ?? registryEntry?.powerUnit,
        firstEntry: officialDetails?.firstEntry ?? registryEntry?.firstEntry,
        worldChampionships: registryEntry?.worldChampionships ?? [],
      };

      const result: ConstructorProfile = {
        constructor: validConstructor,
        meta,
        stats,
        currentDrivers,
        historicalDrivers,
        seasonsCount,
        officialDetails,
      };

      await cache.set(cacheKey, result, TTL.CONSTRUCTOR_PROFILE);
      return result;
    } finally {
      inFlightConstructorProfiles.delete(cacheKey);
    }
  })();

  inFlightConstructorProfiles.set(cacheKey, promise);
  return promise;
}
