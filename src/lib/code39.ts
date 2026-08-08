/**
 * Code 39 barcode encoder.
 *
 * The club's till reads member cards with an ordinary barcode scanner in Code
 * 39, so this has to be a real, scannable barcode and not a decorative
 * stand-in. Generated at build time as plain SVG rectangles — no library, no
 * canvas, works in an email or a print-out just as well as on screen.
 *
 * Each character is nine elements (five bars, four spaces) alternating
 * bar/space, of which exactly three are wide. Characters are separated by one
 * narrow space, and the whole code is wrapped in the '*' start/stop character.
 */

const PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw',
  C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww',
  O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn',
  S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw',
  W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

export interface Code39Options {
  /** Width of a narrow element, in SVG user units. */
  narrow?: number;
  /** Ratio of a wide element to a narrow one. Must be between 2 and 3. */
  ratio?: number;
  height?: number;
  /** Quiet zone either side, in narrow-element multiples. Never below 10. */
  quietZone?: number;
}

export interface Code39Result {
  /** Ready-to-inline SVG rectangles for the bars. */
  bars: { x: number; width: number }[];
  width: number;
  height: number;
}

/**
 * Encodes `value` and returns the bar geometry.
 * Throws on characters Code 39 cannot represent, rather than silently emitting
 * a barcode that scans as something other than the printed text.
 */
export function code39(value: string, options: Code39Options = {}): Code39Result {
  const { narrow = 2, ratio = 3, height = 120, quietZone = 12 } = options;

  const testo = value.toUpperCase();
  for (const char of testo) {
    if (!(char in PATTERNS)) {
      throw new Error(`Code 39 non può rappresentare il carattere ${JSON.stringify(char)} in "${value}".`);
    }
  }

  const wide = narrow * ratio;
  const bars: { x: number; width: number }[] = [];

  let x = quietZone * narrow;

  for (const char of `*${testo}*`) {
    const pattern = PATTERNS[char];
    for (let i = 0; i < pattern.length; i += 1) {
      const larghezza = pattern[i] === 'w' ? wide : narrow;
      // Even indices are bars, odd indices are spaces.
      if (i % 2 === 0) bars.push({ x, width: larghezza });
      x += larghezza;
    }
    x += narrow; // inter-character gap
  }

  return { bars, width: x - narrow + quietZone * narrow, height };
}
