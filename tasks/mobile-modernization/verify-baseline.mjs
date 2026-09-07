import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const json = async name => JSON.parse(await readFile(resolve(here, 'baseline', name + '.json'), 'utf8'));
const manifest = await json('source-manifest');
for (const [file, expected] of Object.entries(manifest.hashes)) {
  assert.equal(createHash('sha256').update(await readFile(resolve(root, file))).digest('hex'), expected, `Legacy baseline changed: ${file}`);
}
const config = await json('effective-config');
const fresh = await json('schema30-fresh');
const oracle = await json('runtime-oracle');
assert.equal(manifest.scripts.length, 26);
assert.equal(manifest.css.length, 1);
assert.equal(fresh.schemaVersion, 30);
assert.equal(fresh.selectedStage, 'ST001-01');
assert.ok(Object.values(fresh.chapters).every(chapter => Object.values(chapter.stars).every(value => value === 0)));
assert.equal(Object.values(config.stage).flatMap(chapter => chapter.stages).length, 12);
assert.deepEqual(oracle.firstStage.storyContract.bosses, ['B001']);
assert.equal(oracle.firstStage.bossAt, 270);
assert.ok(fresh.inventory.gearInstances.length > 0);
assert.ok(fresh.equipInst.weapon);
console.log(`Baseline preserved: ${Object.keys(manifest.hashes).length} hashes; Schema30; 12 stages; original first-stage Boss contract.`);
