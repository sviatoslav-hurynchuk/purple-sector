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
};

export function getCircuitDetails(circuitId?: string): CircuitDetails | null {
  if (!circuitId) return null;
  const id = circuitId.toLowerCase().trim();
  return F1_CIRCUIT_DETAILS[id] ?? null;
}
