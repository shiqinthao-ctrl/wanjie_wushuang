import { expect, test } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import type * as Fixture from './fixtures/settlementHarness';
declare global { interface Window { SettlementFixture: typeof Fixture; resultFixture: Awaited<ReturnType<typeof Fixture.mountResult>> } }
let bundle = '', styles = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, plugins: [vue()], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' }, build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/settlementHarness.ts'), name: 'SettlementFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Settlement fixture missing');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
  styles = output.output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => item.type === 'asset' ? String(item.source) : '').join('\n');
});
test.beforeEach(async ({ page }) => { await page.goto('./'); await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: styles }); });

test('synthetic native settlement: same promise, duplicate receipt and concurrent connections', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, RunSession, fixtureCore, settleRun, receipts } = window.SettlementFixture;
    const name = 'test-settle-duplicates-' + crypto.randomUUID(), a = await SaveRepository.open(name), b = await SaveRepository.open(name);
    const slot = await a.initialize(), core = fixtureCore(slot.save, true), expected = settleRun(slot.save, core.finalRun()!);
    const one = new RunSession(a, slot, core, 'same'), two = new RunSession(b, slot, core, 'same');
    const first = one.settle(), identical = first === one.settle();
    const results = await Promise.all([first, two.settle()]); results.push(await one.settle());
    const saved = await a.get(slot.id), log = await receipts(name); a.close(); b.close();
    return { identical, results, expected, saved, log };
  });
  expect(result.identical).toBe(true); expect(result.results).toEqual(Array(3).fill(result.expected.result));
  expect(result.saved.save).toEqual(result.expected.save); expect(result.saved.revision).toBe(1); expect(result.log).toHaveLength(1);
});

for (const fault of ['before-receipt', 'after-receipt-request'] as const) test(`synthetic native settlement: transaction abort ${fault} rolls back and retries`, async ({ page }) => {
  const result = await page.evaluate(async fault => {
    const { SaveRepository, RunSession, fixtureCore, receipts } = window.SettlementFixture;
    const name = 'test-settle-abort-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const session = new RunSession(repo, slot, fixtureCore(slot.save), 'retry');
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name !== 'receipts') return original.apply(this, args);
      if (fault === 'before-receipt') { this.transaction.abort(); throw new DOMException('Synthetic full disk', 'QuotaExceededError'); }
      const r = original.apply(this, args); r.addEventListener('success', () => this.transaction.abort(), { once: true }); return r;
    };
    let failure = '';
    try { await session.settle(); } catch (cause) { failure = String(cause); } finally { IDBObjectStore.prototype.add = original; }
    const afterFailure = await repo.get(slot.id), failedReceipts = await receipts(name);
    const settled = await session.settle(), saved = await repo.get(slot.id), log = await receipts(name); repo.close();
    return { slot, failure, afterFailure, failedReceipts, settled, saved, log };
  }, fault);
  expect(result.failure).not.toBe(''); expect(result.afterFailure).toEqual(result.slot); expect(result.failedReceipts).toEqual([]);
  expect(result.saved.save.gold).toBe(result.slot.save.gold + result.settled.gold);
  expect(result.saved.revision).toBe(1); expect(result.log).toHaveLength(1);
});

test('synthetic native settlement: lost response retries original slot without overwriting a later writer', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, RunSession, fixtureCore, receipts } = window.SettlementFixture;
    const name = 'test-settle-lost-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const session = new RunSession(repo, slot, fixtureCore(slot.save, true), 'lost');
    const original = repo.transactOnce.bind(repo);
    repo.transactOnce = async (...args) => { await original(...args); throw new Error('Synthetic lost commit response'); };
    let failure = ''; try { await session.settle(); } catch (cause) { failure = String(cause); }
    repo.transactOnce = original; const committed = await repo.get(slot.id), other = await repo.createFresh();
    await repo.transactOnce(slot.id, 'other-writer', 1, save => { save.gold += 7; });
    const settled = await session.settle(), saved = await repo.get(slot.id), isolated = await repo.get(other.id), log = await receipts(name); repo.close();
    return { slot, failure, committed, other, settled, saved, isolated, log };
  });
  expect(result.failure).toContain('lost commit response'); expect(result.committed.revision).toBe(1);
  expect(result.committed.save.gold).toBe(result.slot.save.gold + result.settled.gold);
  expect(result.saved.save.gold).toBe(result.committed.save.gold + 7); expect(result.saved.revision).toBe(2);
  expect(result.isolated).toEqual(result.other); expect(result.log).toHaveLength(2);
});

test('synthetic native settlement: stale run is rejected without rewards or receipt', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, RunSession, fixtureCore, receipts } = window.SettlementFixture;
    const name = 'test-settle-stale-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const session = new RunSession(repo, slot, fixtureCore(slot.save), 'stale');
    await repo.transactOnce(slot.id, 'concurrent-event', 0, save => { save.gold -= 180; });
    const before = await repo.get(slot.id); let failure = '';
    try { await session.settle(); } catch (cause) { failure = String(cause); }
    const after = await repo.get(slot.id), log = await receipts(name); repo.close(); return { before, after, failure, log };
  });
  expect(result.failure).toContain('已更新'); expect(result.after).toEqual(result.before); expect(result.log).toHaveLength(1);
});

test('synthetic native settlement: event payment and final rewards share one revision owner', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, RunSession, eventCore, endEventCore, settleRun, receipts } = window.SettlementFixture;
    const name = 'test-settle-event-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
    const core = eventCore(slot.save, () => .25), session = new RunSession(repo, slot, core, 'event-then-settle');
    const payment = session.choose(1, 'merchantHeal');
    let pending = ''; try { await session.settle(); } catch (cause) { pending = String(cause); }
    await payment; const paid = await repo.get(slot.id); endEventCore(core);
    const expected = settleRun(paid.save, core.finalRun()!), settled = await session.settle();
    const chooseAfter = await session.choose(1, 'merchantHeal'), saved = await repo.get(slot.id), log = await receipts(name); repo.close();
    return { pending, paid, expected, settled, chooseAfter, saved, log };
  });
  expect(result.pending).toContain('尚未结束'); expect(result.paid.save.gold).toBe(5820);
  expect(result.saved.save).toEqual(result.expected.save); expect(result.settled).toEqual(result.expected.result);
  expect(result.saved.revision).toBe(2); expect(result.log).toHaveLength(2); expect(result.chooseAfter).toBe(false);
});

test('synthetic native settlement: unsupported content and invalid drops abort before persistence', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const { SaveRepository, RunSession, fixtureCore, receipts } = window.SettlementFixture;
    const outcomes = [];
    for (const kind of ['mode', 'drop']) {
      const name = 'test-settle-invalid-' + crypto.randomUUID(), repo = await SaveRepository.open(name), slot = await repo.initialize();
      const core = fixtureCore(slot.save), final = core.finalRun()!;
      core.finalRun = () => kind === 'mode' ? { ...final, modeId: 'endless' } : { ...final, drops: [{ ...slot.save.inventory.gearInstances[0]!, uid: '' }] };
      let failure = ''; try { await new RunSession(repo, slot, core, kind).settle(); } catch (cause) { failure = String(cause); }
      outcomes.push({ slot, after: await repo.get(slot.id), failure, log: await receipts(name) }); repo.close();
    }
    return outcomes;
  });
  for (const result of results) { expect(result.failure).not.toBe(''); expect(result.after).toEqual(result.slot); expect(result.log).toEqual([]); }
});

test('synthetic result component: busy lock, storage error, same-run retry and saved rewards', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => { window.resultFixture = await window.SettlementFixture.mountResult(); });
  const dialog = page.getByRole('dialog', { name: '黄巾巨将已击败' }); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: '返回大厅' })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: '再次挑战本关' })).toHaveCount(0);
  await page.evaluate(() => window.resultFixture.releaseFailure());
  await expect(dialog.getByRole('alert')).toContainText('尚未确认保存');
  expect((await page.evaluate(() => window.resultFixture.saved())).revision).toBe(0);
  await page.screenshot({ path: info.outputPath('synthetic-result-save-error.png') });
  await dialog.getByRole('button', { name: '重试保存战果' }).click();
  await expect(dialog.getByRole('button', { name: '返回大厅' })).toBeDisabled();
  await page.evaluate(() => window.resultFixture.releaseSuccess());
  await expect(dialog.getByText('战果已保存', { exact: true })).toBeVisible();
  expect((await page.evaluate(() => window.resultFixture.saved())).revision).toBe(1);
  await expect(dialog.getByLabel('本局星级')).toHaveText('★★★');
  await expect(dialog.locator('.reward-grid dd').first()).toHaveText('+756');
  const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('synthetic-saved-result.png') });
  await dialog.getByRole('button', { name: '再次挑战本关' }).click();
  expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 1, exited: 0 });
  await page.evaluate(() => window.resultFixture.destroy()); expect(errors).toEqual([]);
});

test('synthetic touch transition: releasing a held joystick cannot activate the new result', async ({ page }) => {
  // Measure the actual result button, then put a held game control at that point.
  // Only the component transition is synthetic; CDP sends real browser touch input.
  await page.evaluate(async () => { window.resultFixture = await window.SettlementFixture.mountResult(); window.resultFixture.releaseSuccess(); });
  const dialog = page.getByRole('dialog', { name: '黄巾巨将已击败' });
  await expect(dialog.getByText('战果已保存', { exact: true })).toBeVisible();
  const exit = dialog.getByRole('button', { name: '返回大厅', exact: true });
  await exit.scrollIntoViewIfNeeded(); const box = (await exit.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.evaluate(async point => { window.resultFixture.destroy(); window.resultFixture = await window.SettlementFixture.mountResult(point); window.resultFixture.releaseSuccess(); }, point);
  await expect(page.getByLabel('拖动摇杆移动')).toBeVisible();
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, ...point }] });
  await page.evaluate(() => window.resultFixture.finish());
  await expect(dialog).toBeVisible(); await exit.scrollIntoViewIfNeeded();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 0, exited: 0 });
  await exit.click(); expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 0, exited: 1 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 2, ...point }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 0, exited: 1 });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 3, ...point }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 0, exited: 2 });
  await exit.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.resultFixture.counts())).toEqual({ replayed: 0, exited: 4 });
  await page.evaluate(() => window.resultFixture.destroy());
});
