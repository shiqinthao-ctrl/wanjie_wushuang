import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist/render');
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.match(sourceCommit, /^[0-9a-f]{40}$/);
if (process.env.RENDER_GIT_COMMIT) assert.equal(sourceCommit, process.env.RENDER_GIT_COMMIT);

async function filesIn(directory, prefix = '') {
  const files = [];
  for (const name of (await readdir(directory)).sort()) {
    assert.ok(!name.startsWith('.'), `Hidden build input: ${name}`);
    const source = resolve(directory, name);
    const info = await lstat(source);
    assert.ok(!info.isSymbolicLink(), `Symlink build input: ${source}`);
    const relative = prefix + name;
    if (info.isDirectory()) files.push(...await filesIn(source, relative + '/'));
    else {
      assert.ok(info.isFile(), `Non-file build input: ${source}`);
      files.push(relative);
    }
  }
  return files;
}

// Publish only the two game runtimes; repository evidence and saves stay outside.
const inputs = [{ from: resolve(root, 'index.html'), to: 'index.html' }];
for (const [directory, prefix] of [['assets', 'assets/'], ['apps/mobile-next/dist', 'mobile-next/']]) {
  for (const file of await filesIn(resolve(root, directory))) {
    assert.match(file, /\.(?:html|css|js|svg|png|jpe?g|webp|ico|mp3|wav|ogg|woff2?)$/i, `Unexpected public file: ${file}`);
    inputs.push({ from: resolve(root, directory, file), to: prefix + file });
  }
}
assert.ok(inputs.some(input => input.to === 'mobile-next/index.html'), 'Build the mobile app first');
const mobileHtml = await readFile(resolve(root, 'apps/mobile-next/dist/index.html'), 'utf8');
assert.match(mobileHtml, /src="\/mobile-next\/assets\//, 'Mobile assets must retain their isolated base path');

// The only replaceable directory is this generated output, inside the repo dist.
assert.equal(dirname(output), resolve(root, 'dist'));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = [];
for (const input of inputs) {
  const target = resolve(output, input.to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(input.from, target);
  const data = await readFile(target);
  files.push({ path: input.to, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await writeFile(resolve(output, 'version.json'), JSON.stringify({
  schemaVersion: 1,
  milestone: 'mobile-next-p2k-20260908',
  sourceCommit,
  builtAt: new Date().toISOString(),
  entries: { legacy: '/', mobile: '/mobile-next/' },
  files,
}, null, 2) + '\n');
console.log(`Render package: ${inputs.length} game files + version.json; source ${sourceCommit}; dist/render`);
