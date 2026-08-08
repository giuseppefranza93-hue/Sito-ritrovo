/**
 * Packs the built site into one self-contained HTML file, for publishing a
 * shareable preview.
 *
 * The preview host blocks every external request, so stylesheet, script, fonts
 * and images are all inlined as data URIs. This is a preview artefact only —
 * the real deployment ships dist/ as-is, where the browser can cache each asset
 * separately instead of re-downloading one large document.
 *
 * Run with: npm run anteprima
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

const mime = {
  woff2: 'font/woff2',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
};

const cache = new Map();

/** Reads an absolute site path (/_astro/x.webp) out of dist/ as a data URI. */
async function dataUri(sitePath) {
  if (cache.has(sitePath)) return cache.get(sitePath);
  const ext = sitePath.split('.').pop().toLowerCase();
  const buf = await readFile(dist + sitePath.replace(/^\//, ''));
  const uri = `data:${mime[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;
  cache.set(sitePath, uri);
  return uri;
}

/** Replaces every occurrence of a site-absolute asset path with its data URI. */
async function inlineAssetPaths(text, pattern) {
  const paths = [...new Set(text.match(pattern) ?? [])];
  for (const p of paths) {
    const uri = await dataUri(p);
    text = text.split(p).join(uri);
  }
  return text;
}

let html = await readFile(dist + 'index.html', 'utf8');

// --- stylesheet, with its fonts folded in ---
const cssHref = html.match(/<link rel="stylesheet" href="([^"]+)">/)?.[1];
let css = await readFile(dist + cssHref.replace(/^\//, ''), 'utf8');
css = await inlineAssetPaths(css, /\/_astro\/[A-Za-z0-9_.-]+\.woff2/g);
html = html.replace(/<link rel="stylesheet" href="[^"]+">/, `<style>${css}</style>`);

// --- module script ---
const jsSrc = html.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1];
if (jsSrc) {
  const js = await readFile(dist + jsSrc.replace(/^\//, ''), 'utf8');
  html = html.replace(/<script type="module" src="[^"]+"><\/script>/, `<script type="module">${js}</script>`);
}

// --- images, in src, srcset and anywhere else they appear ---
html = await inlineAssetPaths(html, /\/_astro\/[A-Za-z0-9_.-]+\.(?:webp|jpe?g|png)/g);
html = await inlineAssetPaths(html, /\/logo\/[A-Za-z0-9_.-]+\.png/g);

// --- strip what cannot resolve off-domain ---
html = html
  .replace(/<link rel="(?:canonical|sitemap|icon|apple-touch-icon)"[^>]*>/g, '')
  .replace(/<meta property="og:image"[^>]*>/g, '');

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Il Ritrovo della Compagnia';
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
const styleBlock = html.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '';
const jsonLd = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/)?.[0] ?? '';

/*
 * The host wraps the file in its own <!doctype>/<head>/<body>, so only the page
 * content is emitted here. The wrapper wins on lang, hence the lang="it" div —
 * without it screen readers and hyphenation treat Italian copy as English.
 */
const out = `<title>${title}</title>
${styleBlock}
${jsonLd}
<div lang="it">
${body}
</div>
`;

const target = fileURLToPath(new URL('../dist-anteprima/anteprima.html', import.meta.url));
await writeFile(target, out);

const kb = Math.round(Buffer.byteLength(out) / 1024);
console.log(`anteprima.html — ${kb} kB (${cache.size} asset inlinati)`);
