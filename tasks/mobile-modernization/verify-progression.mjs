import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from '../../apps/mobile-next/node_modules/vite/dist/node/index.js';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fixture = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/progression-oracle.json'), 'utf8'));
const bundle = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: false, lib: { entry: resolve(import.meta.dirname, '../../apps/mobile-next/src/core/progression.ts'), name: 'MigrationProgression', formats: ['iife'] } } });
const code = bundle[0].output.find(item => item.type === 'chunk').code;
const results = await withLegacyOracle(async page => {
  // Test-only bundle in an isolated oracle profile; never shipped in the app.
  await page.addScriptTag({ content: code });
  return page.evaluate(pools => pools.map(item => {
    const seeded = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const random = Math.random;
    run.skills = { ...item.skills }; run.passives = { ...item.passives };
    try {
      Math.random = seeded(item.seed);
      const legacy = validOptions();
      const next = new MigrationProgression.Progression(save.build, item.skills, item.passives, seeded(item.seed)).validOptions();
      return { name: `${item.name}-${item.seed}`, legacy, next };
    } finally { Math.random = random; }
  }), fixture.pools);
});
for (const item of results) assert.deepEqual(item.next, item.legacy, item.name);
console.log(`${results.length} exact ordered choice pools match old/new in the same Chrome runtime.`);
