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
  shanghai: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shanghai_International_Circuit.svg',
  rodriguez: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg',
};

/**
 * Returns the track layout SVG URL for a given circuit ID.
 */
export function getCircuitTrackLayoutUrl(circuitId: string): string | null {
  if (!circuitId) return null;
  const id = circuitId.toLowerCase().trim();
  return WIKIMEDIA_CIRCUIT_MAP[id] ?? null;
}
