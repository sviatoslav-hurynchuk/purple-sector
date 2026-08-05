export interface CircuitDetails {
  circuitId: string;
  country: string;
  circuitLength: string;
  firstGrandPrix: string;
  numberOfLaps: string;
  raceDistance: string;
  fastestLap: {
    time: string;
    driver: string;
    year: string;
  };
  officialMapUrl: string;
}

const F1_CIRCUIT_DETAILS: Record<string, CircuitDetails> = {
  hungaroring: {
    circuitId: 'hungaroring',
    country: 'Hungary',
    circuitLength: '4.381km',
    firstGrandPrix: '1986',
    numberOfLaps: '70',
    raceDistance: '306.63km',
    fastestLap: {
      time: '1:16.627',
      driver: 'Lewis Hamilton',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Hungary_Circuit.png',
  },
  bahrain: {
    circuitId: 'bahrain',
    country: 'Bahrain',
    circuitLength: '5.412km',
    firstGrandPrix: '2004',
    numberOfLaps: '57',
    raceDistance: '308.238km',
    fastestLap: {
      time: '1:31.447',
      driver: 'Pedro de la Rosa',
      year: '2005',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Bahrain_Circuit.png',
  },
  jeddah: {
    circuitId: 'jeddah',
    country: 'Saudi Arabia',
    circuitLength: '6.174km',
    firstGrandPrix: '2021',
    numberOfLaps: '50',
    raceDistance: '308.45km',
    fastestLap: {
      time: '1:30.734',
      driver: 'Lewis Hamilton',
      year: '2021',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Saudi_Arabia_Circuit.png',
  },
  albert_park: {
    circuitId: 'albert_park',
    country: 'Australia',
    circuitLength: '5.278km',
    firstGrandPrix: '1996',
    numberOfLaps: '58',
    raceDistance: '306.124km',
    fastestLap: {
      time: '1:19.813',
      driver: 'Charles Leclerc',
      year: '2024',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Australia_Circuit.png',
  },
  suzuka: {
    circuitId: 'suzuka',
    country: 'Japan',
    circuitLength: '5.807km',
    firstGrandPrix: '1987',
    numberOfLaps: '53',
    raceDistance: '307.471km',
    fastestLap: {
      time: '1:30.983',
      driver: 'Lewis Hamilton',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Japan_Circuit.png',
  },
  shanghai: {
    circuitId: 'shanghai',
    country: 'China',
    circuitLength: '5.451km',
    firstGrandPrix: '2004',
    numberOfLaps: '56',
    raceDistance: '305.066km',
    fastestLap: {
      time: '1:32.238',
      driver: 'Michael Schumacher',
      year: '2004',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/China_Circuit.png',
  },
  miami: {
    circuitId: 'miami',
    country: 'USA',
    circuitLength: '5.412km',
    firstGrandPrix: '2022',
    numberOfLaps: '57',
    raceDistance: '308.326km',
    fastestLap: {
      time: '1:29.708',
      driver: 'Max Verstappen',
      year: '2023',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Miami_Circuit.png',
  },
  imola: {
    circuitId: 'imola',
    country: 'Italy',
    circuitLength: '4.909km',
    firstGrandPrix: '1980',
    numberOfLaps: '63',
    raceDistance: '309.049km',
    fastestLap: {
      time: '1:15.484',
      driver: 'Lewis Hamilton',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Emilia_Romagna_Circuit.png',
  },
  monaco: {
    circuitId: 'monaco',
    country: 'Monaco',
    circuitLength: '3.337km',
    firstGrandPrix: '1950',
    numberOfLaps: '78',
    raceDistance: '260.286km',
    fastestLap: {
      time: '1:12.909',
      driver: 'Lewis Hamilton',
      year: '2021',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Monaco_Circuit.png',
  },
  villeneuve: {
    circuitId: 'villeneuve',
    country: 'Canada',
    circuitLength: '4.361km',
    firstGrandPrix: '1978',
    numberOfLaps: '70',
    raceDistance: '305.27km',
    fastestLap: {
      time: '1:13.078',
      driver: 'Valtteri Bottas',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Canada_Circuit.png',
  },
  catalunya: {
    circuitId: 'catalunya',
    country: 'Spain',
    circuitLength: '4.657km',
    firstGrandPrix: '1991',
    numberOfLaps: '66',
    raceDistance: '307.236km',
    fastestLap: {
      time: '1:16.330',
      driver: 'Max Verstappen',
      year: '2023',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Spain_Circuit.png',
  },
  red_bull_ring: {
    circuitId: 'red_bull_ring',
    country: 'Austria',
    circuitLength: '4.318km',
    firstGrandPrix: '1970',
    numberOfLaps: '71',
    raceDistance: '306.452km',
    fastestLap: {
      time: '1:05.619',
      driver: 'Carlos Sainz',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Austria_Circuit.png',
  },
  silverstone: {
    circuitId: 'silverstone',
    country: 'UK',
    circuitLength: '5.891km',
    firstGrandPrix: '1950',
    numberOfLaps: '52',
    raceDistance: '306.198km',
    fastestLap: {
      time: '1:27.097',
      driver: 'Max Verstappen',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Great_Britain_Circuit.png',
  },
  spa: {
    circuitId: 'spa',
    country: 'Belgium',
    circuitLength: '7.004km',
    firstGrandPrix: '1950',
    numberOfLaps: '44',
    raceDistance: '308.052km',
    fastestLap: {
      time: '1:46.286',
      driver: 'Valtteri Bottas',
      year: '2018',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Belgium_Circuit.png',
  },
  zandvoort: {
    circuitId: 'zandvoort',
    country: 'Netherlands',
    circuitLength: '4.259km',
    firstGrandPrix: '1952',
    numberOfLaps: '72',
    raceDistance: '306.587km',
    fastestLap: {
      time: '1:11.097',
      driver: 'Lewis Hamilton',
      year: '2021',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Netherlands_Circuit.png',
  },
  monza: {
    circuitId: 'monza',
    country: 'Italy',
    circuitLength: '5.793km',
    firstGrandPrix: '1950',
    numberOfLaps: '53',
    raceDistance: '306.72km',
    fastestLap: {
      time: '1:21.046',
      driver: 'Rubens Barrichello',
      year: '2004',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Italy_Circuit.png',
  },
  baku: {
    circuitId: 'baku',
    country: 'Azerbaijan',
    circuitLength: '6.003km',
    firstGrandPrix: '2016',
    numberOfLaps: '51',
    raceDistance: '306.049km',
    fastestLap: {
      time: '1:43.009',
      driver: 'Charles Leclerc',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Baku_Circuit.png',
  },
  marina_bay: {
    circuitId: 'marina_bay',
    country: 'Singapore',
    circuitLength: '4.940km',
    firstGrandPrix: '2008',
    numberOfLaps: '62',
    raceDistance: '306.143km',
    fastestLap: {
      time: '1:35.867',
      driver: 'Lewis Hamilton',
      year: '2023',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Singapore_Circuit.png',
  },
  americas: {
    circuitId: 'americas',
    country: 'USA',
    circuitLength: '5.513km',
    firstGrandPrix: '2012',
    numberOfLaps: '56',
    raceDistance: '308.405km',
    fastestLap: {
      time: '1:36.169',
      driver: 'Charles Leclerc',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/USA_Circuit.png',
  },
  rodriguez: {
    circuitId: 'rodriguez',
    country: 'Mexico',
    circuitLength: '4.304km',
    firstGrandPrix: '1963',
    numberOfLaps: '71',
    raceDistance: '305.354km',
    fastestLap: {
      time: '1:17.774',
      driver: 'Valtteri Bottas',
      year: '2021',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Mexico_Circuit.png',
  },
  interlagos: {
    circuitId: 'interlagos',
    country: 'Brazil',
    circuitLength: '4.309km',
    firstGrandPrix: '1973',
    numberOfLaps: '71',
    raceDistance: '305.879km',
    fastestLap: {
      time: '1:10.540',
      driver: 'Valtteri Bottas',
      year: '2018',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Brazil_Circuit.png',
  },
  vegas: {
    circuitId: 'vegas',
    country: 'USA',
    circuitLength: '6.201km',
    firstGrandPrix: '2023',
    numberOfLaps: '50',
    raceDistance: '310.05km',
    fastestLap: {
      time: '1:35.490',
      driver: 'Oscar Piastri',
      year: '2023',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Las_Vegas_Circuit.png',
  },
  losail: {
    circuitId: 'losail',
    country: 'Qatar',
    circuitLength: '5.419km',
    firstGrandPrix: '2021',
    numberOfLaps: '57',
    raceDistance: '308.611km',
    fastestLap: {
      time: '1:24.319',
      driver: 'Max Verstappen',
      year: '2023',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Qatar_Circuit.png',
  },
  yas_marina: {
    circuitId: 'yas_marina',
    country: 'UAE',
    circuitLength: '5.281km',
    firstGrandPrix: '2009',
    numberOfLaps: '58',
    raceDistance: '306.183km',
    fastestLap: {
      time: '1:26.103',
      driver: 'Max Verstappen',
      year: '2021',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Abu_Dhabi_Circuit.png',
  },
  ricard: {
    circuitId: 'ricard',
    country: 'France',
    circuitLength: '5.842km',
    firstGrandPrix: '1971',
    numberOfLaps: '53',
    raceDistance: '309.69km',
    fastestLap: {
      time: '1:32.740',
      driver: 'Sebastian Vettel',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/France_Circuit.png',
  },
  hockenheimring: {
    circuitId: 'hockenheimring',
    country: 'Germany',
    circuitLength: '4.574km',
    firstGrandPrix: '1970',
    numberOfLaps: '67',
    raceDistance: '306.458km',
    fastestLap: {
      time: '1:13.780',
      driver: 'Kimi Räikkönen',
      year: '2004',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Germany_Circuit.png',
  },
  sochi: {
    circuitId: 'sochi',
    country: 'Russia',
    circuitLength: '5.848km',
    firstGrandPrix: '2014',
    numberOfLaps: '53',
    raceDistance: '309.745km',
    fastestLap: {
      time: '1:35.761',
      driver: 'Lewis Hamilton',
      year: '2019',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Russia_Circuit.png',
  },
  mugello: {
    circuitId: 'mugello',
    country: 'Italy',
    circuitLength: '5.245km',
    firstGrandPrix: '2020',
    numberOfLaps: '59',
    raceDistance: '309.455km',
    fastestLap: {
      time: '1:18.833',
      driver: 'Lewis Hamilton',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Tuscany_Circuit.png',
  },
  nurburgring: {
    circuitId: 'nurburgring',
    country: 'Germany',
    circuitLength: '5.148km',
    firstGrandPrix: '1951',
    numberOfLaps: '60',
    raceDistance: '308.617km',
    fastestLap: {
      time: '1:28.139',
      driver: 'Max Verstappen',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Eifel_Circuit.png',
  },
  portimao: {
    circuitId: 'portimao',
    country: 'Portugal',
    circuitLength: '4.653km',
    firstGrandPrix: '2020',
    numberOfLaps: '66',
    raceDistance: '306.826km',
    fastestLap: {
      time: '1:18.750',
      driver: 'Lewis Hamilton',
      year: '2020',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Portugal_Circuit.png',
  },
  istanbul: {
    circuitId: 'istanbul',
    country: 'Turkey',
    circuitLength: '5.338km',
    firstGrandPrix: '2005',
    numberOfLaps: '58',
    raceDistance: '309.396km',
    fastestLap: {
      time: '1:24.770',
      driver: 'Juan Pablo Montoya',
      year: '2005',
    },
    officialMapUrl:
      'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Turkey_Circuit.png',
  },
  sepang: {
    circuitId: 'sepang',
    country: 'Malaysia',
    circuitLength: '5.543km',
    firstGrandPrix: '1999',
    numberOfLaps: '56',
    raceDistance: '310.408km',
    fastestLap: {
      time: '1:34.080',
      driver: 'Sebastian Vettel',
      year: '2017',
    },
    officialMapUrl: '',
  },
  buddh: {
    circuitId: 'buddh',
    country: 'India',
    circuitLength: '5.125km',
    firstGrandPrix: '2011',
    numberOfLaps: '60',
    raceDistance: '307.249km',
    fastestLap: {
      time: '1:27.249',
      driver: 'Sebastian Vettel',
      year: '2011',
    },
    officialMapUrl: '',
  },
  yeongam: {
    circuitId: 'yeongam',
    country: 'Korea',
    circuitLength: '5.615km',
    firstGrandPrix: '2010',
    numberOfLaps: '55',
    raceDistance: '308.63km',
    fastestLap: {
      time: '1:39.605',
      driver: 'Sebastian Vettel',
      year: '2011',
    },
    officialMapUrl: '',
  },
  magny_cours: {
    circuitId: 'magny_cours',
    country: 'France',
    circuitLength: '4.411km',
    firstGrandPrix: '1991',
    numberOfLaps: '70',
    raceDistance: '308.586km',
    fastestLap: {
      time: '1:15.377',
      driver: 'Michael Schumacher',
      year: '2004',
    },
    officialMapUrl: '',
  },
  valencia: {
    circuitId: 'valencia',
    country: 'Spain',
    circuitLength: '5.419km',
    firstGrandPrix: '2008',
    numberOfLaps: '57',
    raceDistance: '308.883km',
    fastestLap: {
      time: '1:38.683',
      driver: 'Timo Glock',
      year: '2009',
    },
    officialMapUrl: '',
  },
  estoril: {
    circuitId: 'estoril',
    country: 'Portugal',
    circuitLength: '4.360km',
    firstGrandPrix: '1984',
    numberOfLaps: '71',
    raceDistance: '309.56km',
    fastestLap: {
      time: '1:22.448',
      driver: 'Damon Hill',
      year: '1993',
    },
    officialMapUrl: '',
  },
  jerez: {
    circuitId: 'jerez',
    country: 'Spain',
    circuitLength: '4.428km',
    firstGrandPrix: '1986',
    numberOfLaps: '69',
    raceDistance: '305.532km',
    fastestLap: {
      time: '1:23.135',
      driver: 'Heinz-Harald Frentzen',
      year: '1997',
    },
    officialMapUrl: '',
  },
  indianapolis: {
    circuitId: 'indianapolis',
    country: 'USA',
    circuitLength: '4.192km',
    firstGrandPrix: '1950',
    numberOfLaps: '73',
    raceDistance: '306.016km',
    fastestLap: {
      time: '1:10.399',
      driver: 'Rubens Barrichello',
      year: '2004',
    },
    officialMapUrl: '',
  },
  fuji: {
    circuitId: 'fuji',
    country: 'Japan',
    circuitLength: '4.563km',
    firstGrandPrix: '1976',
    numberOfLaps: '67',
    raceDistance: '305.721km',
    fastestLap: {
      time: '1:18.426',
      driver: 'Felipe Massa',
      year: '2008',
    },
    officialMapUrl: '',
  },
  kyalami: {
    circuitId: 'kyalami',
    country: 'South Africa',
    circuitLength: '4.261km',
    firstGrandPrix: '1967',
    numberOfLaps: '72',
    raceDistance: '306.792km',
    fastestLap: {
      time: '1:17.578',
      driver: 'Nigel Mansell',
      year: '1992',
    },
    officialMapUrl: '',
  },
  adelaide: {
    circuitId: 'adelaide',
    country: 'Australia',
    circuitLength: '3.780km',
    firstGrandPrix: '1985',
    numberOfLaps: '81',
    raceDistance: '306.18km',
    fastestLap: {
      time: '1:15.381',
      driver: 'Damon Hill',
      year: '1993',
    },
    officialMapUrl: '',
  },
};

/** Alias mapping for variant Ergast circuit IDs */
const CIRCUIT_ALIASES: Record<string, string> = {
  paul_ricard: 'ricard',
  paulricard: 'ricard',
  hockenheim: 'hockenheimring',
  sochi_autodrom: 'sochi',
  algarve: 'portimao',
  istanbul_park: 'istanbul',
  sepang_international_circuit: 'sepang',
  buddh_international_circuit: 'buddh',
  korean_international_circuit: 'yeongam',
  magny_cours_circuit: 'magny_cours',
  valencia_street_circuit: 'valencia',
  autodromo_do_estoril: 'estoril',
  circuito_de_jerez: 'jerez',
  indianapolis_motor_speedway: 'indianapolis',
  fuji_speedway: 'fuji',
  adelaide_street_circuit: 'adelaide',
};

export function getCircuitDetails(circuitId?: string): CircuitDetails | null {
  if (!circuitId) return null;
  const normalizedKey = circuitId.toLowerCase().trim().replace(/[-\s]/g, '_');
  const targetKey = CIRCUIT_ALIASES[normalizedKey] ?? normalizedKey;
  return F1_CIRCUIT_DETAILS[targetKey] ?? null;
}
