import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { gunzipSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
test('production server serves the preserved page on PORT and exposes only public files', async () => {
  const child = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Startup timeout: ${output}`)), 10000);
      child.stderr.on('data', chunk => { output += chunk; });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Exited ${code}: ${output}`)); });
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/listening on port (\d+)/);
        if (match) { clearTimeout(timer); resolve(Number(match[1])); }
      });
    });
    const request = (path, options = {}) => new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path, ...options }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      });
      req.on('error', reject); req.end();
    });
    const expected = await readFile(new URL('public/index.html', root));
    const home = await request('/');
    assert.equal(home.status, 200); assert.deepEqual(home.body, expected);
    assert.match(home.headers['content-type'], /text\/html/);
    assert.deepEqual((await request('/war.html')).body, expected);
    assert.deepEqual((await request('/index.html?preview=1')).body, expected);
    const compressed = await request('/', { headers: { 'accept-encoding': 'gzip' } });
    assert.equal(compressed.headers['content-encoding'], 'gzip');
    assert.deepEqual(gunzipSync(compressed.body), expected);
    assert.equal((await request('/', { headers: { 'accept-encoding': 'gzip;q=0' } })).headers['content-encoding'], undefined);
    assert.equal((await request('/', { method: 'HEAD' })).body.length, 0);
    assert.equal((await request('/', { headers: { 'if-none-match': home.headers.etag } })).status, 304);
    for (const path of ['/package.json', '/server.mjs', '/.env', '/../package.json', '/%2e%2e/package.json', '/does-not-exist']) assert.equal((await request(path)).status, 404, path);
    assert.equal((await request('/%ZZ')).status, 400);
    assert.equal((await request('/', { method: 'POST' })).status, 405);
    for (const asset of ['favicon.png', 'favicon.svg', 'og.png', 'robots.txt']) assert.equal((await request(`/${asset}`)).status, 200, asset);
  } finally {
    if (child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
  }
});
