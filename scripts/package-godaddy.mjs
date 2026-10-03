import { readFile, writeFile, mkdir, cp, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.resolve(process.argv[2] || path.join(root, 'outputs', `godaddy-${new Date().toISOString().replaceAll(':', '-')}`));
// A new export is additive. Never overwrite a previous delivery or the source checkout.
await mkdir(path.dirname(destination), { recursive: true });
await mkdir(destination, { recursive: false });
const nodeRoot = path.join(destination, 'node');
const cpanelRoot = path.join(destination, 'cpanel');
await cp(path.join(root, 'deployment/godaddy'), nodeRoot, { recursive: true });
await mkdir(path.join(nodeRoot, 'public'));
const original = await readFile(path.join(root, 'public/war.html'), 'utf8');
await writeFile(path.join(nodeRoot, 'public/index.html'), original);
for (const asset of ['favicon.png', 'favicon.svg', 'og.png']) await copyFile(path.join(root, 'public', asset), path.join(nodeRoot, 'public', asset));
await writeFile(path.join(nodeRoot, 'public/robots.txt'), 'User-agent: *\nAllow: /\n');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: nodeRoot, stdio: 'inherit', env: process.env });
run('npm', ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund']);
run('npm', ['run', 'build']);
run('npm', ['test']);
const generated = await readFile(path.join(nodeRoot, 'public/index.html'), 'utf8');
const body = html => html.slice(html.indexOf('<body'));
if (body(original) !== body(generated)) throw new Error('Export changed the original visible page or interactions');
await cp(path.join(nodeRoot, 'public'), cpanelRoot, { recursive: true });
await copyFile(path.join(nodeRoot, 'README.md'), path.join(destination, 'UPLOAD-INSTRUCTIONS.md'));
execFileSync('zip', ['-q', '-r', path.join(destination, 'WAR-Performance-GoDaddy-Node.zip'), 'package.json', 'package-lock.json', 'server.mjs', 'build.mjs', 'README.md', 'public', 'test'], { cwd: nodeRoot });
execFileSync('zip', ['-q', '-r', path.join(destination, 'WAR-Performance-GoDaddy-cPanel.zip'), 'index.html', 'favicon.png', 'favicon.svg', 'og.png', 'robots.txt'], { cwd: cpanelRoot });
const sha = value => createHash('sha256').update(value).digest('hex');
const archives = {};
for (const name of ['WAR-Performance-GoDaddy-Node.zip', 'WAR-Performance-GoDaddy-cPanel.zip']) {
  const data = await readFile(path.join(destination, name));
  if (data.length >= 100 * 1024 * 1024) throw new Error(`${name} exceeds the GoDaddy limit`);
  execFileSync('unzip', ['-tq', path.join(destination, name)], { stdio: 'inherit' });
  archives[name] = { bytes: data.length, sha256: sha(data) };
}
const verification = { generated_at: new Date().toISOString(), source_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), source_html_sha256: sha(original), exported_html_sha256: sha(generated), body_unchanged: true, tests: 'passed', clean_production_install: 'passed; zero runtime dependencies', build: 'passed', archives, deployment: 'Not uploaded or published to GoDaddy' };
await writeFile(path.join(destination, 'VERIFICATION.json'), JSON.stringify(verification, null, 2) + '\n');
console.log(JSON.stringify({ destination, ...verification }, null, 2));
