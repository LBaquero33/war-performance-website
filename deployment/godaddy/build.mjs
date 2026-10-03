import { readFile, writeFile, stat } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const page = new URL('public/index.html', root);
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let origin = '';
if (process.env.SITE_URL) {
  const supplied = new URL(process.env.SITE_URL);
  if (!['https:', 'http:'].includes(supplied.protocol) || supplied.username || supplied.password || supplied.pathname !== '/' || supplied.search || supplied.hash) {
    throw new Error('SITE_URL must be a plain http(s) origin, for example https://your-domain.com');
  }
  origin = supplied.origin;
}
let html = await readFile(page, 'utf8');
if (!html.includes('<!doctype html>') || !html.includes('WAR Performance') || !html.includes('</head>')) throw new Error('WAR Performance page is missing or incomplete');
for (const asset of ['favicon.png', 'favicon.svg', 'og.png']) {
  if ((await stat(new URL(`public/${asset}`, root))).size === 0) throw new Error(`Empty asset: ${asset}`);
}
html = html.replace(/\n?<!-- WAR export metadata -->[\s\S]*?<!-- End WAR export metadata -->\n?/g, '');
const title = 'WAR Performance | Elite Athletic Training in Boca Raton';
const description = 'Elite strength, speed, recovery and baseball development for athletes in Boca Raton, Florida.';
const metadata = [
  '<!-- WAR export metadata -->',
  `<meta property="og:title" content="${title}">`,
  `<meta property="og:description" content="${description}">`,
  '<meta property="og:type" content="website">',
  `<meta property="og:image" content="${escape(origin)}/og.png">`,
  '<meta property="og:image:width" content="1536">',
  '<meta property="og:image:height" content="864">',
  '<meta name="twitter:card" content="summary_large_image">',
  `<meta name="twitter:title" content="${title}">`,
  `<meta name="twitter:description" content="${description}">`,
  `<meta name="twitter:image" content="${escape(origin)}/og.png">`,
  ...(origin ? [`<link rel="canonical" href="${escape(origin)}/">`, `<meta property="og:url" content="${escape(origin)}/">`] : []),
  '<!-- End WAR export metadata -->',
].join('\n');
html = html.replace('</head>', `${metadata}\n</head>`);
await writeFile(page, html);
console.log(`WAR Performance static build ready${origin ? ` for ${origin}` : '; optional SITE_URL can be set when the domain is chosen'}.`);
