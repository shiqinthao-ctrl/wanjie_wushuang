import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/render');
const expected = JSON.parse(await readFile(resolve(output, 'version.json'), 'utf8'));
const origin = process.argv[2] ? new URL(process.argv[2]) : undefined;
assert.match(expected.sourceCommit, /^[0-9a-f]{40}$/);
assert.deepEqual(expected.entries, { legacy: '/', mobile: '/mobile-next/' });
assert.equal(new Set(expected.files.map(file => file.path)).size, expected.files.length);
const allowed = path => path === 'index.html'
  || /^(assets|mobile-next)\/[a-zA-Z0-9_./-]+\.(html|js|css|svg|png|jpe?g|webp|ico|mp3|wav|ogg|woff2?)$/.test(path);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function get(path) {
  const response = await fetch(new URL(path, origin), { cache: 'no-store', signal: AbortSignal.timeout(45_000) });
  assert.equal(response.status, 200, `HTTP ${response.status}: ${path}`);
  return Buffer.from(await response.arrayBuffer());
}

if (origin) {
  assert.ok(['http:', 'https:'].includes(origin.protocol));
  const remote = JSON.parse(await get('/version.json'));
  assert.equal(remote.sourceCommit, expected.sourceCommit, 'Unexpected deployed commit');
  assert.deepEqual(remote.files, expected.files, 'Deployed package differs from verified local build');
} else {
  const actualFiles = await readdir(output, { recursive: true, withFileTypes: true });
  assert.equal(actualFiles.filter(file => file.isFile()).length, expected.files.length + 1, 'Unlisted public files');
}

const baseline = JSON.parse(await readFile(resolve(root, 'tasks/mobile-modernization/baseline/source-manifest.json'), 'utf8'));
// Limit requests while still checking every published asset, including lazy chunks.
for (let i = 0; i < expected.files.length; i += 4) {
  await Promise.all(expected.files.slice(i, i + 4).map(async file => {
    assert.ok(allowed(file.path) && !file.path.split('/').includes('..'), `Disallowed public path: ${file.path}`);
    const data = origin ? await get('/' + file.path) : await readFile(resolve(output, file.path));
    assert.equal(data.length, file.bytes, `Size mismatch: ${file.path}`);
    assert.equal(hash(data), file.sha256, `Hash mismatch: ${file.path}`);
    if (baseline.hashes[file.path]) assert.equal(file.sha256, baseline.hashes[file.path], `Legacy changed: ${file.path}`);
  }));
}
for (const entry of ['index.html', 'mobile-next/index.html']) {
  const html = await readFile(resolve(output, entry), 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|#)/.test(url)) continue;
    const path = new URL(url, new URL('/' + entry, 'https://package.invalid')).pathname.slice(1);
    assert.ok(expected.files.some(file => file.path === path), `Missing entry asset: ${url}`);
  }
}
if (origin) {
  for (const path of ['/TASK.md', '/package.json', '/apps/mobile-next/src/main.ts', '/tasks/mobile-modernization/baseline/schema30-fresh.json']) {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(30_000) });
    await response.body?.cancel();
    assert.ok([403, 404].includes(response.status), `Repository-only path exposed: ${path}`);
  }
}
console.log(`Render ${origin ? 'HTTP' : 'package'} verification passed: ${expected.files.length} file hashes, both entries, legacy baseline, public allowlist; source ${expected.sourceCommit}`);
