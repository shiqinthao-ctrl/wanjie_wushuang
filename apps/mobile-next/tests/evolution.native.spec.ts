import { expect, test } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';
import type * as Fixture from './fixtures/evolutionHarness';
declare global { interface Window { EvolutionFixture: typeof Fixture } }
let bundle = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/evolutionHarness.ts'), name: 'EvolutionFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Fixture missing'); bundle = output.output.find(item => item.type === 'chunk')!.code;
});
test.beforeEach(async ({ page }) => { await page.goto('./'); await page.addScriptTag({ content: bundle }); });
test('synthetic native: selection preserves progress, concurrent evolution settles once and fresh run resets', async ({ page }) => {
  const value = await page.evaluate(async () => {
    const { SaveRepository, prepareHero, RunSession, finishedJourney } = window.EvolutionFixture;
    const name = 'evolution-native-' + crypto.randomUUID(), a = await SaveRepository.open(name), b = await SaveRepository.open(name);
    const original = await a.initialize(), selected = await prepareHero(a, original, 'H012');
    const core = finishedJourney(selected.save), session = new RunSession(a, selected, core, 'evolution-once'), other = new RunSession(b, selected, core, 'evolution-once');
    const results = await Promise.all([session.settle(), other.settle()]), saved = await a.get(selected.id);
    core.destroy(); a.close(); b.close(); return { original, selected, results, saved };
  });
  expect(value.selected.save).toEqual({ ...value.original.save, hero: 'H012' });
  expect(value.results[0]).toEqual(value.results[1]); expect(value.results[0]!.journey?.rank).toBe(1);
  expect(value.saved.save.heroes.H012!.mastery).toBeGreaterThan(value.selected.save.heroes.H012!.mastery);
  expect(value.saved.save.heroes.H001).toEqual(value.selected.save.heroes.H001);
  expect(value.saved.save.stats.runs).toBe(value.selected.save.stats.runs + 1); expect(value.saved.revision).toBe(2);
});
test('synthetic native: failed, stale and locked selections never overwrite a slot', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, prepareHero } = window.EvolutionFixture;
    const repo = await SaveRepository.open('evolution-abort-' + crypto.randomUUID()), slot = await repo.initialize();
    const add = IDBObjectStore.prototype.add; let failed = false, locked = false, stale = false;
    IDBObjectStore.prototype.add = function (...args) { if (this.name === 'receipts') { this.transaction.abort(); throw new DOMException('Synthetic storage failure', 'QuotaExceededError'); } return add.apply(this, args); };
    try { await prepareHero(repo, slot, 'H010'); } catch { failed = true; } finally { IDBObjectStore.prototype.add = add; }
    const afterFailure = await repo.get(slot.id);
    try { await prepareHero(repo, slot, 'H002'); } catch { locked = true; }
    const selected = await prepareHero(repo, slot, 'H010');
    try { await prepareHero(repo, slot, 'H012'); } catch { stale = true; }
    const afterStale = await repo.get(slot.id); repo.close(); return { slot, failed, locked, stale, afterFailure, selected, afterStale };
  });
  expect(result.failed && result.locked && result.stale).toBe(true);
  expect(result.afterFailure).toEqual(result.slot); expect(result.afterStale).toEqual(result.selected);
});
