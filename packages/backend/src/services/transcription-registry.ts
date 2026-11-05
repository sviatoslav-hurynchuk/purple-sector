/**
 * Registry of iconic Formula 1 Team Radio broadcast moments.
 * Provides authentic dialogue transcripts and metadata for memorable clips
 * without requiring external paid speech-to-text API calls.
 */

export interface IconicRadioEntry {
  id: string;
  driverNumber: number;
  driverCode: string;
  driverName: string;
  teamName: string;
  title: string;
  quote: string;
  keywords?: string[];
  approxLap?: number;
}

export const ICONIC_RADIO_REGISTRY: IconicRadioEntry[] = [
  // ── Lando Norris (#4, McLaren) ───────────────────────────────────────────
  {
    id: 'norris-talent',
    driverNumber: 4,
    driverCode: 'NOR',
    driverName: 'Lando Norris',
    teamName: 'McLaren',
    title: 'NORRIS RADIO',
    quote: '"LANDO WHAT DAMAGE DO YOU HAVE?" — "UH, TALENT!"',
    keywords: ['damage', 'talent', 'lando'],
  },
  {
    id: 'norris-friday',
    driverNumber: 4,
    driverCode: 'NOR',
    driverName: 'Lando Norris',
    teamName: 'McLaren',
    title: 'NORRIS RADIO',
    quote: '"IT\'S FRIDAY THEN... SATURDAY, SUNDAY, WHAT!"',
    keywords: ['friday', 'sunday'],
  },
  {
    id: 'norris-scenario-7',
    driverNumber: 4,
    driverCode: 'NOR',
    driverName: 'Lando Norris',
    teamName: 'McLaren',
    title: 'NORRIS RADIO',
    quote: '"SCENARIO 7, PRESS AND HOLD OVERTAKE. GIVE IT EVERYTHING!"',
    keywords: ['scenario', 'overtake'],
  },

  // ── Charles Leclerc (#16, Ferrari) ────────────────────────────────────────
  {
    id: 'leclerc-forza-ferrari',
    driverNumber: 16,
    driverCode: 'LEC',
    driverName: 'Charles Leclerc',
    teamName: 'Ferrari',
    title: 'LECLERC RADIO',
    quote: '"MAMMA MIA, MAMMA MIA! FORZA FERRARI! GRAZIE A TUTTI!"',
    keywords: ['mamma', 'forza', 'ferrari'],
  },
  {
    id: 'leclerc-nooo',
    driverNumber: 16,
    driverCode: 'LEC',
    driverName: 'Charles Leclerc',
    teamName: 'Ferrari',
    title: 'LECLERC RADIO',
    quote: '"NOOOOOOOOOOO! NOOOOO!"',
    keywords: ['noooo', 'crash'],
  },

  // ── Max Verstappen (#1, Red Bull Racing) ───────────────────────────────────
  {
    id: 'verstappen-monaco-1972',
    driverNumber: 1,
    driverCode: 'VER',
    driverName: 'Max Verstappen',
    teamName: 'Red Bull Racing',
    title: 'VERSTAPPEN RADIO',
    quote: '"MY SHIFTS FEEL LIKE MONACO GRAND PRIX 1972!"',
    keywords: ['shifts', 'monaco', '1972'],
  },
  {
    id: 'verstappen-simply-lovely',
    driverNumber: 1,
    driverCode: 'VER',
    driverName: 'Max Verstappen',
    teamName: 'Red Bull Racing',
    title: 'VERSTAPPEN RADIO',
    quote: '"SIMPLY LOVELY! WHAT A RACE GUYS, THE CAR WAS ON RAILS!"',
    keywords: ['simply', 'lovely', 'rails'],
  },
  {
    id: 'verstappen-disasta',
    driverNumber: 1,
    driverCode: 'VER',
    driverName: 'Max Verstappen',
    teamName: 'Red Bull Racing',
    title: 'VERSTAPPEN RADIO',
    quote: '"HAHA, YES BOYS! WHAT A DISASTER FOR THEM!"',
    keywords: ['disaster', 'disasta'],
  },

  // ── Lewis Hamilton (#44, Mercedes / Ferrari) ──────────────────────────────
  {
    id: 'hamilton-hammer-time',
    driverNumber: 44,
    driverCode: 'HAM',
    driverName: 'Lewis Hamilton',
    teamName: 'Mercedes',
    title: 'HAMILTON RADIO',
    quote: '"OKAY LEWIS, CLOSE THAT GAP AS MUCH AS YOU CAN. IT\'S HAMMER TIME."',
    keywords: ['hammer', 'time', 'gap'],
  },
  {
    id: 'hamilton-tyres-gone',
    driverNumber: 44,
    driverCode: 'HAM',
    driverName: 'Lewis Hamilton',
    teamName: 'Mercedes',
    title: 'HAMILTON RADIO',
    quote: '"BONO, MY TYRES ARE GONE MAN!"',
    keywords: ['bono', 'tyres', 'gone'],
  },
  {
    id: 'hamilton-silverstone-win',
    driverNumber: 44,
    driverCode: 'HAM',
    driverName: 'Lewis Hamilton',
    teamName: 'Mercedes',
    title: 'HAMILTON RADIO',
    quote: '"THANK YOU SO MUCH GUYS! THIS MEANS THE WORLD TO ME. KEEP PUSHING!"',
    keywords: ['silverstone', 'pushing', 'means'],
  },

  // ── George Russell (#63, Mercedes) ────────────────────────────────────────
  {
    id: 'russell-prefer-not-speak',
    driverNumber: 63,
    driverCode: 'RUS',
    driverName: 'George Russell',
    teamName: 'Mercedes',
    title: 'RUSSELL RADIO',
    quote: '"SO WE\'VE GOT A DRIVE THROUGH PENALTY, BUT WE\'LL DELAY IT AS LONG AS WE CAN." — "TO BE HONEST, I PREFER NOT TO SPEAK."',
    keywords: ['penalty', 'prefer', 'speak'],
  },
  {
    id: 'russell-crikey',
    driverNumber: 63,
    driverCode: 'RUS',
    driverName: 'George Russell',
    teamName: 'Mercedes',
    title: 'RUSSELL RADIO',
    quote: '"CRIKEY! HE JUST TURNED RIGHT ACROSS ME!"',
    keywords: ['crikey', 'turned'],
  },

  // ── Oscar Piastri (#81, McLaren) ──────────────────────────────────────────
  {
    id: 'piastri-drink',
    driverNumber: 81,
    driverCode: 'PIA',
    driverName: 'Oscar Piastri',
    teamName: 'McLaren',
    title: 'PIASTRI RADIO',
    quote: '"REMEMBER TO USE THE DRINK." — "I WOULD IF IT WAS WORKING."',
    keywords: ['drink', 'working'],
  },
  {
    id: 'piastri-first-win',
    driverNumber: 81,
    driverCode: 'PIA',
    driverName: 'Oscar Piastri',
    teamName: 'McLaren',
    title: 'PIASTRI RADIO',
    quote: '"YES GUYS! THANK YOU VERY MUCH FOR THAT. FIRST WIN, SPECIAL DAY."',
    keywords: ['first', 'win', 'special'],
  },

  // ── Oliver Bearman (#87 / #38, Haas / Ferrari) ───────────────────────────
  {
    id: 'bearman-nice-one',
    driverNumber: 87,
    driverCode: 'BEA',
    driverName: 'Oliver Bearman',
    teamName: 'Haas F1 Team',
    title: 'BEARMAN RADIO',
    quote: '"NICE ONE, OLLIE!" — "CIAO!"',
    keywords: ['ollie', 'ciao', 'nice'],
  },
  {
    id: 'bearman-saudi-points',
    driverNumber: 38,
    driverCode: 'BEA',
    driverName: 'Oliver Bearman',
    teamName: 'Ferrari',
    title: 'BEARMAN RADIO',
    quote: '"MEGA DRIVE, OLLIE! P7 ON DEBUT!" — "THANK YOU GUYS, CAR WAS AWESOME!"',
    keywords: ['debut', 'p7', 'mega'],
  },

  // ── Alex Albon (#23, Williams) ────────────────────────────────────────────
  {
    id: 'albon-not-stupid',
    driverNumber: 23,
    driverCode: 'ALB',
    driverName: 'Alexander Albon',
    teamName: 'Williams',
    title: 'ALBON RADIO',
    quote: '"GUYS, COME ON. LET\'S NOT BE STUPID!"',
    keywords: ['stupid', 'come on'],
  },

  // ── Carlos Sainz (#55, Ferrari / Williams) ────────────────────────────────
  {
    id: 'sainz-smooth-operator',
    driverNumber: 55,
    driverCode: 'SAI',
    driverName: 'Carlos Sainz',
    teamName: 'Ferrari',
    title: 'SAINZ RADIO',
    quote: '"SMOOTH OPERATOR... SMOOOOOOTH OPERAAATOR!"',
    keywords: ['smooth', 'operator'],
  },
  {
    id: 'sainz-stop-inventing',
    driverNumber: 55,
    driverCode: 'SAI',
    driverName: 'Carlos Sainz',
    teamName: 'Ferrari',
    title: 'SAINZ RADIO',
    quote: '"STOP INVENTING, STOP INVENTING! PLEASE GUYS, WE ARE UNDER PRESSURE!"',
    keywords: ['stop', 'inventing'],
  },

  // ── Fernando Alonso (#14, Aston Martin) ───────────────────────────────────
  {
    id: 'alonso-undriveable',
    driverNumber: 14,
    driverCode: 'ALO',
    driverName: 'Fernando Alonso',
    teamName: 'Aston Martin',
    title: 'ALONSO RADIO',
    quote: '"THE CAR IS UNDRIVEABLE! IT\'S UNBELIEVABLE!"',
    keywords: ['undriveable', 'unbelievable'],
  },

  // ── Yuki Tsunoda (#22, RB) ────────────────────────────────────────────────
  {
    id: 'tsunoda-traffic',
    driverNumber: 22,
    driverCode: 'TSU',
    driverName: 'Yuki Tsunoda',
    teamName: 'RB',
    title: 'TSUNODA RADIO',
    quote: '"TRAFFIC PARADISE! ARE YOU KIDDING ME?!"',
    keywords: ['traffic', 'paradise'],
  },
];

/**
 * Looks up iconic transcript by driver number and URL or keywords.
 */
export function findIconicTranscript(
  driverNumber: number,
  recordingUrl?: string
): IconicRadioEntry | null {
  const byDriver = ICONIC_RADIO_REGISTRY.filter((e) => e.driverNumber === driverNumber);
  if (byDriver.length === 0) return null;

  if (recordingUrl) {
    const urlLower = recordingUrl.toLowerCase();
    for (const entry of byDriver) {
      if (entry.keywords && entry.keywords.some((k) => urlLower.includes(k))) {
        return entry;
      }
    }
  }

  return null;
}
