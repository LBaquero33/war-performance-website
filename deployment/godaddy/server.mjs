import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535');
const publicRoot = new URL('./public/', import.meta.url);
const files = new Map();
for (const [filename, type] of [
  ['index.html', 'text/html; charset=utf-8'],
  ['favicon.png', 'image/png'],
  ['favicon.svg', 'image/svg+xml'],
  ['og.png', 'image/png'],
  ['robots.txt', 'text/plain; charset=utf-8'],
]) {
  const body = await readFile(new URL(filename, publicRoot));
  files.set(`/${filename}`, { body, compressed: gzipSync(body), type, etag: `W/"${createHash('sha256').update(body).digest('hex')}"` });
}
files.set('/', files.get('/index.html'));
files.set('/war.html', files.get('/index.html'));
const server = createServer((req, res) => {
  const fail = (code, message, headers = {}) => {
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
    res.end(req.method === 'HEAD' ? undefined : message);
  };
  if (!['GET', 'HEAD'].includes(req.method)) return fail(405, 'Method not allowed', { Allow: 'GET, HEAD' });
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return fail(400, 'Bad request'); }
  const file = files.get(pathname);
  if (!file) return fail(404, 'Not found');
  const gzip = String(req.headers['accept-encoding'] ?? '').split(',').some((part) => {
    const [encoding, ...params] = part.trim().split(';');
    return encoding === 'gzip' && !params.some((p) => /^\s*q\s*=\s*0(?:\.0*)?\s*$/.test(p));
  });
  const body = gzip ? file.compressed : file.body;
  const headers = {
    'Content-Type': file.type,
    'Cache-Control': file.type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ETag: file.etag,
    Vary: 'Accept-Encoding',
    ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
  };
  if (String(req.headers['if-none-match'] ?? '').split(',').map(x => x.trim()).some(x => x === '*' || x === file.etag)) {
    res.writeHead(304, headers);
    return res.end();
  }
  res.writeHead(200, { ...headers, 'Content-Length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
});
server.listen(port, '0.0.0.0', () => console.log(`WAR Performance listening on port ${server.address().port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close(() => process.exit(0)));
