import { expect, test } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';
import type * as Fixture from './fixtures/chapterHarness';

declare global { interface Window { ChapterFixture: typeof Fixture } }
test.use({ video: 'on' });
let bundle = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/chapterHarness.ts'), name: 'ChapterFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Chapter fixture missing');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
});
test.beforeEach(async ({ page }) => { await page.goto('./'); await page.addScriptTag({ content: bundle }); });

test('synthetic chapter settlement: concurrent calls and connections share one receipt', async ({ page }) => {
  const data = await page.evaluate(async () => {
    const { SaveRepository, ChapterRunSession, options, final, receipts } = window.ChapterFixture;
    const name = 'chapter-duplicates-' + crypto.randomUUID(), a = await SaveRepository.open(name), b = await SaveRepository.open(name);
    const slot = await a.initialize(), one = new ChapterRunSession(a, slot, options, 'same'), two = new ChapterRunSession(b, slot, options, 'same');
    const p = one.settle(final), same = p === one.settle(final);
    const results = await Promise.all([p, two.settle(final)]), after = await a.get(slot.id), log = await receipts(name);
    a.close(); b.close(); return { slot, same, results, after, log };
  });
  expect(data.same).toBe(true); expect(data.results[0]).toEqual(data.results[1]);
  expect(data.after.revision).toBe(1); expect(data.log).toHaveLength(1);
  expect(data.after.save.gold).toBe(data.slot.save.gold); expect(data.after.save.chapters).toEqual(data.slot.save.chapters);
  expect(data.after.save.mobileChapter).toMatchObject({ reports: [data.results[0]!.report], charms: { unlocked: ['MC_DODGE', 'MC_ELITE', 'MC_PICKUP', 'MC_SURVIVAL', 'MC_CYCLE', 'MC_MOVE'] } });
});

for (const fault of ['before-receipt', 'after-receipt'] as const) test(`synthetic chapter settlement: ${fault} abort leaves zero partial writes and retries`, async ({ page }) => {
  const data = await page.evaluate(async fault => {
    const { SaveRepository, ChapterRunSession, options, final, receipts } = window.ChapterFixture;
    const name = 'chapter-abort-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const input = structuredClone(final), session = new ChapterRunSession(repo, slot, options, 'retry');
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name !== 'receipts') return original.apply(this, args);
      if (fault === 'before-receipt') { this.transaction.abort(); throw new DOMException('Synthetic disk full', 'QuotaExceededError'); }
      const request = original.apply(this, args); request.addEventListener('success', () => this.transaction.abort(), { once: true }); return request;
    };
    let error = '';
    try { const pending = session.settle(input); input.kills = 999; await pending; }
    catch (cause) { error = String(cause); } finally { IDBObjectStore.prototype.add = original; }
    const failed = await repo.get(slot.id), failedLog = await receipts(name), result = await session.settle(input);
    const saved = await repo.get(slot.id), log = await receipts(name); repo.close(); return { slot, error, failed, failedLog, result, saved, log };
  }, fault);
  expect(data.error).not.toBe(''); expect(data.failed).toEqual(data.slot); expect(data.failedLog).toEqual([]);
  expect(data.saved.revision).toBe(1); expect(data.log).toHaveLength(1); expect(data.result.report.kills).toBe(150);
});

test('synthetic chapter settlement: lost response, later writer and changed active slot', async ({ page }) => {
  const data = await page.evaluate(async () => {
    const { SaveRepository, ChapterRunSession, options, final, receipts } = window.ChapterFixture;
    const name = 'chapter-lost-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const session = new ChapterRunSession(repo, slot, options, 'lost'), original = repo.transactOnce.bind(repo);
    repo.transactOnce = async (...args) => { await original(...args); throw new Error('Synthetic lost response'); };
    let error = ''; try { await session.settle(final); } catch (cause) { error = String(cause); } finally { repo.transactOnce = original; }
    const other = await repo.createFresh(); slot.id = other.id; slot.revision = 99;
    const firstId = (await repo.list()).find(item => item.id !== other.id)!.id;
    await repo.transactOnce(firstId, 'later-writer', 1, save => { save.gold += 7; });
    const result = await session.settle(final), saved = await repo.get(firstId), untouched = await repo.get(other.id), log = await receipts(name);
    repo.close(); return { error, other, result, saved, untouched, log };
  });
  expect(data.error).toContain('lost response'); expect(data.saved.revision).toBe(2); expect(data.saved.save.gold).toBe(data.other.save.gold + 7);
  expect(data.untouched).toEqual(data.other); expect(data.log).toHaveLength(2);
  expect(data.saved.save.mobileChapter).toMatchObject({ reports: [data.result.report], chapters: { CH001: { clears: { 'CH001-01': 1 } } } });
});

test('synthetic chapter settlement: stale writer cannot replace newer progress', async ({ page }) => {
  const data = await page.evaluate(async () => {
    const { SaveRepository, ChapterRunSession, options, final, receipts } = window.ChapterFixture;
    const name = 'chapter-stale-' + crypto.randomUUID(), a = await SaveRepository.open(name), b = await SaveRepository.open(name), slot = await a.initialize();
    const stale = new ChapterRunSession(a, slot, options, 'stale');
    await new ChapterRunSession(b, slot, options, 'fresh').settle(final); const before = await b.get(slot.id);
    let error = ''; try { await stale.settle(final); } catch (cause) { error = String(cause); }
    const after = await b.get(slot.id), log = await receipts(name); a.close(); b.close(); return { error, before, after, log };
  });
  expect(data.error).toContain('已更新'); expect(data.after).toEqual(data.before); expect(data.log).toHaveLength(1);
});

test('synthetic chapter settlement: reload reads the receipt without granting again', async ({ page }) => {
  const before = await page.evaluate(async () => {
    const { SaveRepository, ChapterRunSession, options, final } = window.ChapterFixture;
    const name = 'chapter-reload-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const result = await new ChapterRunSession(repo, slot, options, 'reload').settle(final); repo.close(); return { name, result };
  });
  await page.reload(); await page.addScriptTag({ content: bundle });
  const after = await page.evaluate(async name => {
    const { SaveRepository, ChapterRunSession, options, final, receipts } = window.ChapterFixture;
    const repo = await SaveRepository.open(name), slot = await repo.initialize(), result = await new ChapterRunSession(repo, slot, options, 'reload').settle(final);
    const saved = await repo.get(slot.id), log = await receipts(name); repo.close(); return { result, saved, log };
  }, before.name);
  expect(after.result).toEqual(before.result); expect(after.saved.revision).toBe(1); expect(after.log).toHaveLength(1);
});

test('native chapter import: copies raw backup and unknown fields; malformed/future data cannot overwrite', async ({ page }) => {
  const data = await page.evaluate(async () => {
    const { SaveRepository, ChapterRunSession, freshChapterProgress, options, final } = window.ChapterFixture;
    const name = 'chapter-import-' + crypto.randomUUID(), repo = await SaveRepository.open(name), original = await repo.initialize();
    const progress = freshChapterProgress(); progress.future = { x: [1, 2] }; progress.charms.future = 'keep';
    const raw = JSON.stringify({ ...original.save, mobileChapter: progress }), imported = await repo.importJson(raw, 'copy');
    await new ChapterRunSession(repo, imported, options, 'import').settle(final);
    const saved = await repo.get(imported.id), backup = await repo.exportOriginal(imported.id);
    let malformed = ''; try { await repo.importJson(JSON.stringify({ ...original.save, mobileChapter: { version: 1 } }), 'bad'); } catch (cause) { malformed = String(cause); }
    const inconsistent = structuredClone(saved.save);
    (inconsistent.mobileChapter as { reports: { heroId: string }[] }).reports[0]!.heroId = 'H010';
    let inconsistentError = ''; try { await repo.importJson(JSON.stringify(inconsistent), 'bad-report'); } catch (cause) { inconsistentError = String(cause); }
    const count = (await repo.list()).length;
    const futureRaw = JSON.stringify({ ...original.save, mobileChapter: { version: 2, payload: [1, { keep: true }] } });
    const future = await repo.importJson(futureRaw, 'future'); let futureError = '';
    try { new ChapterRunSession(repo, future, options, 'future'); } catch (cause) { futureError = String(cause); }
    const exported = JSON.parse(await repo.exportJson(future.id)), futureBackup = await repo.exportOriginal(future.id), unchanged = await repo.get(original.id);
    repo.close(); return { original, unchanged, raw, backup, imported, saved, malformed, inconsistentError, count, future, exported, futureRaw, futureBackup, futureError };
  });
  expect(data.backup).toBe(data.raw); expect(data.imported.id).not.toBe(data.original.id); expect(data.unchanged).toEqual(data.original);
  expect(data.saved.save.mobileChapter).toMatchObject({ future: { x: [1, 2] }, charms: { future: 'keep' } });
  expect(data.malformed).not.toBe(''); expect(data.inconsistentError).toContain('形态归属'); expect(data.count).toBe(2); expect(data.futureError).toContain('版本');
  expect(data.exported).toEqual(data.future.save); expect(data.futureBackup).toBe(data.futureRaw);
});
