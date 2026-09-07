import { test, expect } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';
import fresh from '../src/data/freshSave.json' with { type: 'json' };
import type * as StorageModule from '../src/storage/SaveRepository';

declare global { interface Window { StorageFixture: typeof StorageModule } }
let bundle = '';
test.beforeAll(async () => {
  // Synthetic integration harness is bundled only in test memory, never shipped.
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('src/storage/SaveRepository.ts'), name: 'StorageFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Storage test bundle missing');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
});
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.addScriptTag({ content: bundle });
});

test('synthetic native IndexedDB: atomic receipts, concurrent connections and rollback', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository } = window.StorageFixture;
    const dbName = 'test-atomic-' + crypto.randomUUID();
    const a = await SaveRepository.open(dbName), b = await SaveRepository.open(dbName);
    const original = await a.initialize();
    const outcomes = await Promise.all([a, b].map(repo => repo.transactOnce(original.id, 'run-1:settle', 0, save => {
      save.gold = Number(save.gold) + 500;
      (save.chapters as { ST001: { stars: Record<string, number> } }).ST001.stars['ST001-01'] = 2;
      return { gold: 500, stars: 2 };
    })));
    let conflict = '', aborted = '';
    try { await b.transactOnce(original.id, 'stale', 0, save => { save.gold = 0; }); } catch (e) { conflict = String(e); }
    try { await a.transactOnce(original.id, 'aborted', 1, save => { save.gold = 0; throw new Error('synthetic interruption'); }); } catch (e) { aborted = String(e); }
    const afterAbort = await a.get(original.id);
    const retry = await b.transactOnce(original.id, 'aborted', 1, save => { save.gold = Number(save.gold) + 10; return 'retried'; });
    // Structured-clone failure after put must roll back both the save and receipt.
    let cloneFailure = '';
    try { await a.transactOnce(original.id, 'bad-result', 2, save => { save.gold = 0; return () => 'uncloneable'; }); } catch (e) { cloneFailure = String(e); }
    const final = await b.get(original.id);
    a.close(); b.close();
    return { original, outcomes, conflict, aborted, afterAbort, retry, cloneFailure, final };
  });
  expect(result.outcomes.filter(item => item.applied)).toHaveLength(1);
  expect(result.outcomes.map(item => item.result)).toEqual([{ gold: 500, stars: 2 }, { gold: 500, stars: 2 }]);
  expect(result.conflict).toContain('已更新');
  expect(result.aborted).toContain('synthetic interruption');
  expect(result.afterAbort.save.gold).toBe(6500);
  expect(result.afterAbort.revision).toBe(1);
  expect(result.retry.applied).toBe(true);
  expect(result.cloneFailure).not.toBe('');
  expect(result.final.save.gold).toBe(6510);
  expect(result.final.revision).toBe(2);
});

test('synthetic native IndexedDB: two tabs apply one receipt', async ({ page, context }) => {
  const name = 'test-tabs-' + crypto.randomUUID();
  const first = await page.evaluate(async name => {
    const repo = await window.StorageFixture.SaveRepository.open(name);
    const slot = await repo.initialize(); repo.close(); return slot;
  }, name);
  const other = await context.newPage();
  await other.goto('./'); await other.addScriptTag({ content: bundle });
  const outcomes = await Promise.all([page, other].map(tab => tab.evaluate(async ({ name, id }) => {
    const repo = await window.StorageFixture.SaveRepository.open(name);
    const result = await repo.transactOnce(id, 'same-operation', 0, save => { save.gold = Number(save.gold) + 23; return 23; });
    repo.close(); return result;
  }, { name, id: first.id })));
  expect(outcomes.filter(item => item.applied)).toHaveLength(1);
  expect(outcomes.map(item => item.slot.save.gold)).toEqual([6023, 6023]);
  await other.close();
});

test('synthetic native IndexedDB: copied imports, exact backup and independent slots', async ({ page }) => {
  const raw = '\uFEFF' + JSON.stringify({ ...fresh, extra: { unknown: [1, '<b>keep</b>'] } }, null, 3);
  const result = await page.evaluate(async ({ raw }) => {
    const { SaveRepository } = window.StorageFixture;
    const name = 'test-import-' + crypto.randomUUID();
    const repo = await SaveRepository.open(name), first = await repo.initialize();
    const imported = await repo.importJson(raw, '旧版副本');
    const backup = await repo.exportOriginal(imported.id);
    await repo.transactOnce(first.id, 'slot-operation', 0, save => { save.gold = 17; });
    let rejected = '';
    try { await repo.importJson('{bad json', '错误文件'); } catch (e) { rejected = String(e); }
    const slots = await repo.list(), active = await repo.initialize();
    await repo.select(first.id); repo.close();
    const reopened = await SaveRepository.open(name);
    const restored = await reopened.initialize(), exported = await reopened.exportJson(imported.id);
    reopened.close();
    return { first, imported, backup, rejected, slots, active, restored, exported };
  }, { raw });
  expect(result.backup).toBe(raw);
  expect(JSON.parse(result.exported)).toEqual(JSON.parse(raw.slice(1)));
  expect(result.slots).toHaveLength(2);
  expect(result.active.id).toBe(result.imported.id);
  expect(result.restored.id).toBe(result.first.id);
  expect(result.restored.save.gold).toBe(17);
  expect(result.imported.save.gold).toBe(6000);
  expect(result.rejected).toContain('JSON');
});
