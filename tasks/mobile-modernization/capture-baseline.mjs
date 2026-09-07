import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const output = resolve(here, 'baseline');
// An isolated browser is an extraction oracle only, never the new runtime.
const playwrightPath = process.env.MIGRATION_PLAYWRIGHT;
const { chromium } = playwrightPath
  ? await import(pathToFileURL(playwrightPath).href)
  : await import('../../apps/mobile-next/node_modules/playwright/index.mjs');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1]);
const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match => match[1]);
const tracked = execFileSync('git', ['ls-files', 'index.html', 'assets', 'scripts', 'package.json'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
const hashes = {};
const chains = {};
for (const file of tracked) hashes[file] = createHash('sha256').update(await readFile(resolve(root, file))).digest('hex');
for (const file of scripts) {
  const source = await readFile(resolve(root, file), 'utf8');
  for (const match of source.matchAll(/(?:function\s+(\w+)\s*\(|\b(\w+)\s*=\s*function\s*\()/g)) {
    const name = match[1] || match[2];
    (chains[name] ||= []).push({ file, line: source.slice(0, match.index).split('\n').length });
  }
}
const errors = [];
const server = createServer(async (req, res) => {
  const target = resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
  if (!target.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try {
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', (mime[extname(target)] || 'application/octet-stream') + '; charset=utf-8');
    res.end(await readFile(target));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole('button', { name: '新征途 创建冒险' }).click();
  const captured = await page.evaluate(() => ({
    config: JSON.parse(JSON.stringify(WW.config)),
    fresh: JSON.parse(JSON.stringify(save)),
    firstStage: v29Rule('story'),
    difficulties: V19_DIFFICULTIES,
    heroStats: Object.fromEntries(Object.keys(WW.config.hero).map(id => [id, heroStats(id)])),
    functions: Object.fromEntries(['updateRun', 'startBattle', 'finishRun', 'heroStats', 'hurtPlayer', 'damageEnemy', 'damageBoss', 'checkLevel', 'validOptions', 'chooseUpgrade', 'v29Update', 'storyStageSuccess', 'storyStageReward'].map(name => [name, window[name]?.toString() || null])),
    pages: [...document.querySelectorAll('.page[id]')].map(node => node.id)
  }));
  assert.equal(captured.fresh.schemaVersion, 30);
  assert.equal(captured.fresh.selectedStage, 'ST001-01');
  assert.ok(Object.values(captured.fresh.chapters).every(chapter => Object.values(chapter.stars).every(stars => stars === 0)));
  assert.ok(captured.fresh.inventory.gearInstances.length > 0);
  assert.equal(captured.firstStage.duration, 360);
  assert.deepEqual(captured.firstStage.storyContract.bosses, ['B001']);
  assert.deepEqual(errors, []);
  await mkdir(output, { recursive: true });
  for (const [name, data] of Object.entries({ 'effective-config': captured.config, 'schema30-fresh': captured.fresh, 'runtime-oracle': { ...captured, config: undefined, fresh: undefined }, 'source-manifest': { commit: execFileSync('git', ['rev-parse', '3a7b9f4'], { cwd: root, encoding: 'utf8' }).trim(), scripts, css, hashes, chains, evidence: 'Isolated Chrome; actual new-game button; no personal profile; no phone measurement.', browser: await browser.version() } })) {
    await writeFile(resolve(output, name + '.json'), JSON.stringify(data, null, 2) + '\n');
  }
  console.log(JSON.stringify({ scripts: scripts.length, css: css.length, heroes: Object.keys(captured.config.hero).length, stages: Object.values(captured.config.stage).flatMap(chapter => chapter.stages).length, configGroups: Object.keys(captured.config), errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
