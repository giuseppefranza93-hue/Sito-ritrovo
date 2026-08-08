/**
 * Packs the built site into one self-contained HTML file, for sharing a
 * clickable preview before there is any hosting.
 *
 * The preview host blocks every external request, so stylesheet, script, fonts
 * and images are all inlined as data URIs. This is a preview artefact only —
 * the real deployment ships dist/ as-is, where the browser caches each asset
 * separately instead of re-downloading one large document.
 *
 * Uso:
 *   node scripts/build-anteprima.mjs                  -> completo.html (home + tessera)
 *   node scripts/build-anteprima.mjs tessera/ tessera -> solo /tessera/
 *
 * In modalità completa le due pagine diventano due <main> nello stesso file e
 * si alternano via hash, così "Crea la tua tessera" funziona dentro un unico
 * link condivisibile.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const outDir = fileURLToPath(new URL('../dist-anteprima/', import.meta.url));

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
  for (const p of [...new Set(text.match(pattern) ?? [])]) {
    text = text.split(p).join(await dataUri(p));
  }
  return text;
}

/** Loads one built page and folds every external asset into the markup. */
async function preparaPagina(pagina = '') {
  let html = await readFile(`${dist}${pagina.replace(/^\/+/, '')}index.html`, 'utf8');

  const cssHref = html.match(/<link rel="stylesheet" href="([^"]+)">/)?.[1];
  if (cssHref) {
    let css = await readFile(dist + cssHref.replace(/^\//, ''), 'utf8');
    css = await inlineAssetPaths(css, /\/_astro\/[A-Za-z0-9_.-]+\.woff2/g);
    html = html.replace(/<link rel="stylesheet" href="[^"]+">/, `<style>${css}</style>`);
  }

  const jsSrc = html.match(/<script type="module" src="([^"]+)"><\/script>/)?.[1];
  if (jsSrc) {
    const js = await readFile(dist + jsSrc.replace(/^\//, ''), 'utf8');
    html = html.replace(/<script type="module" src="[^"]+"><\/script>/, `<script type="module">${js}</script>`);
  }

  html = await inlineAssetPaths(html, /\/_astro\/[A-Za-z0-9_.-]+\.(?:webp|jpe?g|png)/g);
  html = await inlineAssetPaths(html, /\/logo\/[A-Za-z0-9_.-]+\.png/g);

  html = html
    .replace(/<link rel="(?:canonical|sitemap|icon|apple-touch-icon)"[^>]*>/g, '')
    .replace(/<meta property="og:image"[^>]*>/g, '');

  return {
    titolo: html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Il Ritrovo della Compagnia',
    stile: html.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? '',
    jsonLd: html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/)?.[0] ?? '',
    body: estraiCorpo(html),
  };
}

/**
 * Everything from <body> to the end of the document.
 *
 * Not `<body>…</body>`: Astro emits a page's own <script> after the closing
 * </body> tag. Browsers reparent it, but a regex that stops at </body> silently
 * drops it — which is how the signature pad ended up inert in the first build
 * of this preview.
 */
function estraiCorpo(html) {
  const apertura = html.search(/<body[^>]*>/);
  if (apertura === -1) return '';
  const inizio = apertura + html.match(/<body[^>]*>/)[0].length;
  return html
    .slice(inizio)
    .replace(/<\/body>/, '')
    .replace(/<\/html>\s*$/, '');
}

/** Splits a page body around its single <main id="contenuto"> element. */
function scomponi(body) {
  const apertura = body.indexOf('<main id="contenuto">');
  const chiusura = body.lastIndexOf('</main>');
  return {
    prima: body.slice(0, apertura),
    main: body.slice(apertura + '<main id="contenuto">'.length, chiusura),
    dopo: body.slice(chiusura + '</main>'.length),
  };
}

/*
 * The router. Both pages ship their own header and footer; the combined file
 * keeps only the home copy, so there are no duplicate ids and no second,
 * unwired mobile menu. Which <main> is visible follows the hash, which means
 * the browser's back button keeps working for free.
 */
const ROUTER = `<script>
  (() => {
    const home = document.querySelector('[data-vista="home"]');
    const tessera = document.querySelector('[data-vista="tessera"]');
    if (!home || !tessera) return;

    const applica = (scorri) => {
      const suTessera = location.hash === '#area-tessera';
      home.hidden = suTessera;
      tessera.hidden = !suTessera;
      if (suTessera && scorri) window.scrollTo({ top: 0 });
    };

    window.addEventListener('hashchange', () => applica(true));
    applica(false);
  })();
</script>`;

const argomento = process.argv[2];

await mkdir(outDir, { recursive: true });

if (argomento && argomento !== '--completo') {
  // Modalità pagina singola.
  const nome = process.argv[3] ?? 'anteprima';
  const p = await preparaPagina(argomento);
  const out = `<title>${p.titolo}</title>\n${p.stile}\n${p.jsonLd}\n<div lang="it">\n${p.body}\n</div>\n`;
  await writeFile(outDir + nome + '.html', out);
  console.log(`${nome}.html — ${Math.round(Buffer.byteLength(out) / 1024)} kB`);
} else {
  // Modalità completa: home + area tessera in un unico file.
  const home = await preparaPagina('');
  const tess = await preparaPagina('tessera/');

  const h = scomponi(home.body);
  const t = scomponi(tess.body);

  /*
   * Of the tessera page only its <main> and its trailing scripts are kept: the
   * header and footer come from the home copy, so nothing is duplicated and the
   * mobile menu stays wired to a single set of elements.
   */
  t.dopo = t.dopo.replace(/<footer[\s\S]*<\/footer>/, '');

  // I link fra le due viste diventano hash interni.
  const mainTessera = t.main.split('href="/#tessera"').join('href="#tessera"');
  const testa = h.prima.split('href="/tessera/"').join('href="#area-tessera"');
  const corpoHome = h.main.split('href="/tessera/"').join('href="#area-tessera"');

  const out = `<title>${home.titolo}</title>
${home.stile}
${home.jsonLd}
<div lang="it">
${testa}
<main id="contenuto" data-vista="home">
${corpoHome}
</main>
<main id="area-tessera" data-vista="tessera" hidden>
${mainTessera}
</main>
${h.dopo}
${t.dopo}
${ROUTER}
</div>
`;

  await writeFile(outDir + 'completo.html', out);
  console.log(`completo.html — ${Math.round(Buffer.byteLength(out) / 1024)} kB (${cache.size} asset inlinati)`);
}
