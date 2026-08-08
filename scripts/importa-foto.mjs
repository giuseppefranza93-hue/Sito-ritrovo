/**
 * Imports the client's photographs into src/images/.
 *
 * One-off script, kept in the repo so the mapping between each source file and
 * where it ends up on the page is recorded rather than lost in a shell history.
 * Sources are 1448×1086 (4:3), so nothing is upscaled and only og.jpg is
 * cropped — the gallery was switched to 4:3 to match rather than cutting the
 * tops off the signs and the heads off the people.
 *
 * Run with: node scripts/importa-foto.mjs <cartella-sorgenti>
 */
import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const srcDir = process.argv[2];
if (!srcDir) {
  console.error('Uso: node scripts/importa-foto.mjs <cartella-sorgenti>');
  process.exit(1);
}

const out = fileURLToPath(new URL('../src/images/', import.meta.url));

/** Source filenames, by what each photograph actually shows. */
const foto = {
  serata: 'ce0374b4-133829.png', // primo piano serale: carte, dadi, birra
  ingresso: '71e34317-133830.png', // il cancello e le insegne di legno
  soci: 'b53a13e8-133831.png', // i due soci davanti al cancello
  ludoteca: 'f8a493c7-133832.png', // la pila di giochi davanti agli scaffali
  sala: '44b7ecdd-133833.png', // la sala grande, gruppo che gioca di giorno
};

const jpeg = { quality: 82, mozjpeg: true, progressive: true };
const src = (nome) => `${srcDir.replace(/\/?$/, '/')}${foto[nome]}`;

/** Copies at native size — no resize, so no upscaling and no crop. */
const nativa = (nome, target) => sharp(src(nome)).jpeg(jpeg).toFile(out + target);

// Gallery, in the order a visitor would experience the place.
const galleria = ['ingresso', 'sala', 'ludoteca', 'serata', 'soci'];

await mkdir(out + 'galleria/', { recursive: true });
for (const file of await readdir(out + 'galleria/')) {
  await rm(out + 'galleria/' + file);
}

await Promise.all(
  galleria.map((nome, i) => nativa(nome, `galleria/galleria-0${i + 1}.jpg`)),
);

// Section imagery.
await nativa('serata', 'hero.jpg'); // scura e calda: il logo crema ci sta sopra leggibile
await nativa('soci', 'circolo.jpg');
await nativa('ludoteca', 'ludoteca.jpg');
await nativa('sala', 'tessera.jpg');

/*
 * Open Graph is the only 1.91:1 crop. `attention` lets sharp keep the busiest
 * region rather than the geometric centre, which on the group shot means the
 * table and the faces instead of the ceiling.
 */
await sharp(src('sala'))
  .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
  .jpeg({ ...jpeg, quality: 85 })
  .toFile(out + 'og.jpg');

console.log(`Importate ${galleria.length} foto in galleria + 5 immagini di sezione.`);
