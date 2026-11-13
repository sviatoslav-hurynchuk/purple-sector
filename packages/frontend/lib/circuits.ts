import { WIKIMEDIA_COMMONS_BASE_URL } from '@/lib/constants/urls';

/**
 * Mapping table for F1 circuit IDs to their Wikimedia Commons SVG filenames.
 */
const CIRCUIT_SVG_FILES: Record<string, string> = {
  hungaroring: 'Hungaroring.svg',
  monaco: 'Circuit_Monaco.svg',
  silverstone: 'Silverstone_Circuit_2011.svg',
  spa: 'Spa-Francorchamps_of_Belgium.svg',
  monza: 'Autodromo_Nazionale_Monza_2024.svg',
  red_bull_ring: 'Red_Bull_Ring_2022.svg',
  americas: 'Circuit_of_the_Americas.svg',
  marina_bay: 'Marina_Bay_Street_Circuit_2023.svg',
  suzuka: 'Suzuka_circuit_map_2005.svg',
  albert_park: 'Albert_Park_Circuit_2022.svg',
  bahrain: 'Bahrain_International_Circuit_--_Grand_Prix_Layout.svg',
  jeddah: 'Jeddah_Street_Circuit_2021.svg',
  miami: 'Miami_International_Autodrome_2022.svg',
  baku: 'Baku_City_Circuit.svg',
  zandvoort: 'Circuit_Zandvoort_2020.svg',
  losail: 'Lusail_International_Circuit_2023.svg',
  interlagos: 'Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_2014.svg',
  vegas: 'Las_Vegas_Strip_Circuit_2023.svg',
  yas_marina: 'Yas_Marina_Circuit_2021.svg',
  catalunya: 'Circuit_de_Barcelona-Catalunya_2023.svg',
  madring: 'Madring_(2026).svg',
  jarama: 'Circuito_del_Jarama.svg',
  jerez: 'Circuito_de_Jerez.svg',
  valencia: 'Valencia_Street_Circuit.svg',
  shanghai: 'Shanghai_International_Circuit.svg',
  rodriguez: 'Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg',
  villeneuve: 'Circuit_Gilles_Villeneuve.svg',
  sepang: 'Sepang.svg',
  kuala_lumpur: 'Sepang.svg',
};

function getCircuitSvgUrl(circuitKey: string): string | null {
  const file = CIRCUIT_SVG_FILES[circuitKey];
  return file ? `${WIKIMEDIA_COMMONS_BASE_URL}/${file}` : null;
}

/**
 * Returns the track layout SVG URL for a given circuit ID with optional season awareness.
 * Prevents conflating 2026+ Madring with historical Madrid (Jarama) or Spanish (Catalunya/Jerez) circuits.
 */
export function getCircuitTrackLayoutUrl(circuitId: string, seasonYear?: number | string): string | null {
  if (!circuitId) return null;
  const id = circuitId.toLowerCase().trim();
  const yearNum = seasonYear ? Number(seasonYear) : undefined;
  const isValidYear = yearNum !== undefined && !isNaN(yearNum);

  if (id === 'madrid') {
    // Madrid hosted F1 at Jarama before 2026; Madring from 2026+
    return isValidYear && yearNum < 2026
      ? getCircuitSvgUrl('jarama')
      : getCircuitSvgUrl('madring');
  }

  if (id === 'madring') {
    // Madring did not exist prior to 2026
    if (isValidYear && yearNum < 2026) return null;
    return getCircuitSvgUrl('madring');
  }

  return getCircuitSvgUrl(id);
}
