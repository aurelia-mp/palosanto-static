// Genera y verifica las anotaciones hreflang del sitio.
// Fuente única: el mapa PAIRS. Cada par declara es, en y x-default (-> en).
//   node scripts/hreflang.mjs          reescribe el bloque <!-- hreflang --> de cada HTML y los xhtml:link del sitemap
//   node scripts/hreflang.mjs --check  no escribe nada; sale con código 1 si algo no coincide (corre en npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.palosantohotel.com';
const X_DEFAULT = 'en';

// [ES, EN]
const PAIRS = [
  ['/', '/en/'],
  ['/es/hotel', '/en/hotel'],
  ['/es/habitaciones', '/en/rooms'],
  ['/es/habitaciones-premium', '/en/premium-rooms'],
  ['/es/habitaciones-deluxe', '/en/deluxe-rooms'],
  ['/es/suite-palo-santo', '/en/palo-santo-suite'],
  ['/es/suite-terrace', '/en/terrace-suite'],
  ['/es/verde', '/en/green'],
  ['/es/hotel-palermo-buenos-aires', '/en/hotel-palermo-buenos-aires'],
  ['/es/quienes-somos', '/en/about-us'],
  ['/es/galeria-de-fotos', '/en/photo-gallery'],
  ['/es/palermo', '/en/palermo'],
  ['/es/restaurante', '/en/restaurant'],
  ['/es/contacto', '/en/contact-us'],
];

// Páginas que no se indexan y no llevan hreflang.
const EXCLUDED = ['404.html'];

const CHECK = process.argv.includes('--check');
const errors = [];

const fileFor = (p) => (p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1) + '.html');

const alternates = ([es, en]) => {
  const urls = { es: BASE + es, en: BASE + en };
  return [
    ['es', urls.es],
    ['en', urls.en],
    ['x-default', urls[X_DEFAULT]],
  ];
};

const pages = PAIRS.flatMap((pair) => [
  { lang: 'es', path: pair[0], other: pair[1], pair },
  { lang: 'en', path: pair[1], other: pair[0], pair },
]);

// --- HTML ---
const HEAD_BLOCK = /^([ \t]*)<!-- hreflang -->\n(?:[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\n)*/m;

for (const page of pages) {
  const file = fileFor(page.path);
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) {
    errors.push(`${file}: no existe`);
    continue;
  }
  const html = fs.readFileSync(abs, 'utf8');
  const match = html.match(HEAD_BLOCK);
  if (!match) {
    errors.push(`${file}: no tiene el bloque <!-- hreflang -->`);
    continue;
  }
  const indent = match[1];
  const block =
    `${indent}<!-- hreflang -->\n` +
    alternates(page.pair)
      .map(([code, url]) => `${indent}<link rel="alternate" hreflang="${code}" href="${url}">\n`)
      .join('');

  const lang = html.match(/<html[^>]*\blang="([^"]*)"/)?.[1];
  if (lang !== page.lang) errors.push(`${file}: <html lang="${lang}">, se esperaba "${page.lang}"`);
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"\s*\/?>/)?.[1];
  if (canonical !== BASE + page.path) errors.push(`${file}: canonical ${canonical}, se esperaba ${BASE + page.path}`);
  if (!html.includes(`href="${page.other}"`)) errors.push(`${file}: el selector de idioma no enlaza a ${page.other}`);

  if (match[0] === block) continue;
  if (CHECK) errors.push(`${file}: bloque hreflang desactualizado`);
  else fs.writeFileSync(abs, html.replace(HEAD_BLOCK, block));
}

// Toda página publicada tiene que estar en el mapa o excluida explícitamente.
const known = new Set([...pages.map((p) => fileFor(p.path)), ...EXCLUDED]);
for (const dir of ['', 'es', 'en']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = dir ? `${dir}/${f}` : f;
    if (f.endsWith('.html') && !known.has(rel)) errors.push(`${rel}: no está en PAIRS ni en EXCLUDED`);
  }
}

// --- sitemap.xml ---
const sitemapFile = path.join(ROOT, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapFile, 'utf8');
const original = sitemap;

sitemap = sitemap.replace(
  /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"(?: xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml")?>/,
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
);
sitemap = sitemap.replace(/^[ \t]*<xhtml:link [^>]*\/>\n/gm, '');

const byUrl = new Map(pages.map((p) => [BASE + p.path, p]));
const seen = new Map();
sitemap = sitemap.replace(/^([ \t]*)<loc>([^<]*)<\/loc>\n/gm, (line, indent, loc) => {
  seen.set(loc, (seen.get(loc) || 0) + 1);
  const page = byUrl.get(loc);
  if (!page) return line;
  return (
    line +
    alternates(page.pair)
      .map(([code, url]) => `${indent}<xhtml:link rel="alternate" hreflang="${code}" href="${url}"/>\n`)
      .join('')
  );
});

for (const [loc, n] of seen) {
  if (!byUrl.has(loc)) errors.push(`sitemap.xml: ${loc} no está en PAIRS`);
  if (n > 1) errors.push(`sitemap.xml: ${loc} aparece ${n} veces`);
}
for (const loc of byUrl.keys()) {
  if (!seen.has(loc)) errors.push(`sitemap.xml: falta ${loc}`);
}

if (sitemap !== original) {
  if (CHECK) errors.push('sitemap.xml: anotaciones xhtml:link desactualizadas');
  else fs.writeFileSync(sitemapFile, sitemap);
}

if (errors.length) {
  console.error(`hreflang: ${errors.length} problema(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  if (CHECK && errors.some((e) => e.endsWith('desactualizado') || e.endsWith('desactualizadas'))) {
    console.error('Corré `npm run hreflang` para regenerar los bloques y el sitemap.');
  }
  process.exit(1);
}
console.log(`hreflang: ${pages.length} páginas OK${CHECK ? '' : ' (archivos actualizados)'}`);
