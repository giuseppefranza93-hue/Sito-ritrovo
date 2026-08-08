/**
 * Generates the placeholder photography.
 *
 * These are real JPEGs at the exact aspect ratios the layout expects, so that
 * replacing them with the client's photos is a straight file swap: keep the
 * filename, drop in the photo, rebuild. Astro's image pipeline handles
 * resizing and AVIF/WebP conversion from there.
 *
 * Run with: npm run placeholders
 */
import sharp from 'sharp';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/*
 * The real photographs now live in src/images/. This script must never clobber
 * them, so every write is skipped when the file already exists — pass --force
 * only if you genuinely want the placeholders back.
 */
const forza = process.argv.includes('--force');

async function esiste(percorso) {
  try {
    await access(percorso);
    return true;
  } catch {
    return false;
  }
}

/** Writes a plate only when there is nothing there to protect. */
async function scrivi(percorso, opzioni) {
  if (!forza && (await esiste(percorso))) {
    console.log(`salto ${percorso.split('/src/images/').pop()} — esiste già`);
    return;
  }
  await sharp(plate(opzioni)).jpeg({ quality: 82, mozjpeg: true }).toFile(percorso);
}

const outDir = fileURLToPath(new URL('../src/images/', import.meta.url));

const NOTTE = '#171313';
const CREMA = '#fff1d6';
const LINEA = '#5c2a26';
const ROSSO = '#b31b22';

/** A muted plate with a hairline frame, a label, and the expected dimensions. */
function plate({ width, height, label, index, total }) {
  const titleSize = Math.round(width * 0.032);
  const metaSize = Math.round(width * 0.016);
  const inset = Math.round(width * 0.022);
  const counter = index ? `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}` : '';

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#1c1616"/>
      <stop offset="100%" stop-color="#0e0c0c"/>
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="1.4" fill="${CREMA}" fill-opacity="0.10"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#dots)"/>
  <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}"
        fill="none" stroke="${LINEA}" stroke-opacity="0.9" stroke-width="2"/>
  ${
    // An empty label means a plate that sits behind other content (the hero):
    // draw only the texture, since any caption would read as a mistake.
    label
      ? `<text x="50%" y="47%" text-anchor="middle" fill="${CREMA}"
        font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-style="italic">${label}</text>
  <text x="50%" y="47%" dy="${titleSize * 1.5}" text-anchor="middle" fill="${CREMA}" fill-opacity="0.55"
        font-family="Helvetica, Arial, sans-serif" font-size="${metaSize}" letter-spacing="${metaSize * 0.18}">FOTO SEGNAPOSTO · ${width}×${height}</text>`
      : ''
  }
  ${
    counter
      ? `<text x="${width - inset * 2}" y="${inset * 2.6}" text-anchor="end" fill="${ROSSO}"
        font-family="Helvetica, Arial, sans-serif" font-size="${metaSize}" font-weight="bold"
        letter-spacing="${metaSize * 0.14}">${counter}</text>`
      : ''
  }
</svg>`);
}

const gallery = [
  "L'ingresso",
  'La sala del circolo',
  'Gli scaffali della ludoteca',
  'Una serata',
  'Chi vi accoglie',
];

await mkdir(new URL('../src/images/galleria/', import.meta.url), { recursive: true });

// Carousel plates: 4:3, matching the client's photographs.
await Promise.all(
  gallery.map((label, i) =>
    scrivi(`${outDir}galleria/galleria-${String(i + 1).padStart(2, '0')}.jpg`, {
      width: 1448,
      height: 1086,
      label,
      index: i + 1,
      total: gallery.length,
    }),
  ),
);

// Hero: no label — the logo sits on top of it, and a caption showing through
// behind the wordmark reads as a mistake rather than as a placeholder.
await scrivi(`${outDir}hero.jpg`, { width: 1448, height: 1086, label: '' });

// Supporting imagery for the narrower sections.
for (const [name, label] of [
  ['ludoteca', 'La ludoteca del circolo'],
  ['tessera', 'La Compagnia Card'],
  ['circolo', 'Il circolo'],
]) {
  await scrivi(`${outDir}${name}.jpg`, { width: 1448, height: 1086, label });
}

// Open Graph card, 1.91:1.
await scrivi(`${outDir}og.jpg`, { width: 1200, height: 630, label: 'Il Ritrovo della Compagnia' });

console.log('Segnaposto aggiornati. Le foto reali esistenti non sono state toccate.');
