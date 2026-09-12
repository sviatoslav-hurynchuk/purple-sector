/**
 * Mapping table for F1 circuit IDs to their Wikimedia Commons SVG URLs.
 */
const WIKIMEDIA_CIRCUIT_MAP: Record<string, string> = {
  hungaroring: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hungaroring.svg',
  monaco: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_Monaco.svg',
  silverstone: 'https://commons.wikimedia.org/wiki/Special:FilePath/Silverstone_Circuit_2011.svg',
  spa: 'https://commons.wikimedia.org/wiki/Special:FilePath/Spa-Francorchamps_of_Belgium.svg',
  monza: 'https://commons.wikimedia.org/wiki/Special:FilePath/Autodromo_Nazionale_Monza_2024.svg',
  red_bull_ring: 'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Bull_Ring_2022.svg',
  americas: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_of_the_Americas.svg',
  marina_bay: 'https://commons.wikimedia.org/wiki/Special:FilePath/Marina_Bay_Street_Circuit_2023.svg',
  suzuka: 'https://commons.wikimedia.org/wiki/Special:FilePath/Suzuka_circuit_map_2005.svg',
  albert_park: 'https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Park_Circuit_2022.svg',
  bahrain: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_International_Circuit_--_Grand_Prix_Layout.svg',
  jeddah: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jeddah_Street_Circuit_2021.svg',
  miami: 'https://commons.wikimedia.org/wiki/Special:FilePath/Miami_International_Autodrome_2022.svg',
  baku: 'https://commons.wikimedia.org/wiki/Special:FilePath/Baku_City_Circuit.svg',
  zandvoort: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_Zandvoort_2020.svg',
  losail: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lusail_International_Circuit_2023.svg',
  interlagos: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aut%C3%B3dromo_Jos%C3%A9_Carlos_Pace_2014.svg',
  vegas: 'https://commons.wikimedia.org/wiki/Special:FilePath/Las_Vegas_Strip_Circuit_2023.svg',
  yas_marina: 'https://commons.wikimedia.org/wiki/Special:FilePath/Yas_Marina_Circuit_2021.svg',
  catalunya: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_de_Barcelona-Catalunya_2023.svg',
  madring: 'https://commons.wikimedia.org/wiki/Special:FilePath/Madring_(2026).svg',
  jarama: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuito_del_Jarama.svg',
  jerez: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuito_de_Jerez.svg',
  valencia: 'https://commons.wikimedia.org/wiki/Special:FilePath/Valencia_Street_Circuit.svg',
  shanghai: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shanghai_International_Circuit.svg',
  rodriguez: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg',
  villeneuve: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circuit_Gilles_Villeneuve.svg',
};

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
      ? WIKIMEDIA_CIRCUIT_MAP.jarama
      : WIKIMEDIA_CIRCUIT_MAP.madring;
  }

  if (id === 'madring') {
    // Madring did not exist prior to 2026
    if (isValidYear && yearNum < 2026) return null;
    return WIKIMEDIA_CIRCUIT_MAP.madring;
  }

  return WIKIMEDIA_CIRCUIT_MAP[id] ?? null;
}
