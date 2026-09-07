import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from '../../apps/mobile-next/node_modules/vite/dist/node/index.js';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fixture = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/first-combat-oracle.json'), 'utf8'));
const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const bundle = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: false, lib: { entry: resolve(import.meta.dirname, '../../apps/mobile-next/src/core/spawnRules.ts'), name: 'SpawnRules', formats: ['iife'] } } });
const code = bundle[0].output.find(item => item.type === 'chunk').code;
const results = await withLegacyOracle(async page => {
  await page.addScriptTag({ content: code });
  return page.evaluate(({ fixture, fresh }) => {
    save = structuredClone(fresh); v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    player.x = 1800; player.y = 1200; run.active = false;
    return fixture.spawns.map(item => {
      let seed = item.seed;
      return SpawnRules.createEnemy({ time: item.time, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 }, player, { width: 390, height: 844 }, { width: 3600, height: 2400 }, 'normal', () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296), { elite: item.elite });
    });
  }, { fixture, fresh });
});
for (const [index, enemy] of results.entries()) {
  const { _v29Scaled, ...expected } = fixture.spawns[index].enemy;
  assert.deepEqual(enemy, expected, `spawn ${index}`);
}
console.log(`${results.length} exact normal/elite spawns match legacy Chrome, including affixes and scaled stats.`);
