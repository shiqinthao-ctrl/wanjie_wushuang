import { expect, test } from '@playwright/test';
import { build } from 'vite';
import { resolve } from 'node:path';
import oracle from '../../../tasks/mobile-modernization/baseline/first-events-oracle.json' with { type: 'json' };
import chestsOracle from '../../../tasks/mobile-modernization/baseline/chests-oracle.json' with { type: 'json' };
import fresh from '../src/data/freshSave.json' with { type: 'json' };
import type * as EventModule from './fixtures/eventHarness';
declare global { interface Window { EventFixture: typeof EventModule } }
let bundle = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/eventHarness.ts'), name: 'EventFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Event fixture bundle missing');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
});
test.beforeEach(async ({ page }) => { await page.goto('./'); await page.addScriptTag({ content: bundle }); });

test('synthetic Chrome oracle: timed chest preserves exact owned upgrade and RNG count', async ({ page }) => {
  const result = await page.evaluate(({ fresh, clock }) => {
    const { calculateStartup, Progression, TimedChests } = window.EventFixture;
    let state = 12, calls = 0;
    const random = () => { calls++; state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const start = calculateStartup(fresh), progression = new Progression(fresh.build, start.skills, start.passives, random);
    const chests = new TimedChests(progression, { evolved: {}, fused: {} }, 'H001', [], random, () => clock);
    chests.claim(0, 90); chests.pick(1, 0);
    return { ...progression.snapshot(), calls, secondClaim: chests.claim(0, 90), duplicatePick: chests.pick(1, 2) };
  }, { fresh, clock: chestsOracle.clock });
  expect(result.skills).toEqual(chestsOracle.upgrade.skills); expect(result.passives).toEqual(chestsOracle.upgrade.passives);
  expect(result.calls).toBe(chestsOracle.upgrade.calls);
  expect(result.secondClaim).toBe(false); expect(result.duplicatePick).toBe(false);
});

test('synthetic Chrome oracle: gold gear followed by the exact owned upgrade', async ({ page }) => {
  const item = oracle.choices.find(item => item.code === 'goldOpen')!;
  const result = await page.evaluate(({ fresh, clock }) => {
    const { calculateStartup, Progression, FirstStageEvents, eventPayment } = window.EventFixture;
    let state = 12, calls = 0;
    const random = () => { calls++; state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const start = calculateStartup(fresh), progression = new Progression(fresh.build, start.skills, start.passives, random);
    const events = new FirstStageEvents({ hp: 100, maxHp: start.player.maxHp }, progression, 'H001', random, () => clock);
    events.apply('goldOpen', eventPayment('goldOpen', 6000));
    return { ...progression.snapshot(), drops: events.drops, calls };
  }, { fresh, clock: oracle.clock });
  expect(result.skills).toEqual(item.skills); expect(result.passives).toEqual(item.passives);
  expect(result.drops).toEqual(item.drops); expect(result.calls).toBe(item.calls);
});

test('synthetic native event: duplicate receipts, stale run and retry after failed commit', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, EventSession, eventCore } = window.EventFixture;
    const repo = await SaveRepository.open('test-event-' + crypto.randomUUID()), slot = await repo.initialize();
    const core = eventCore(slot.save), session = new EventSession(repo, slot, core, 'run-fixture');
    await Promise.all([session.choose(1, 'goldCash'), session.choose(1, 'goldCash')]);
    const rewarded = await repo.get(slot.id);
    await session.choose(1, 'goldCash');
    const again = await repo.get(slot.id);
    const staleCore = eventCore(slot.save), stale = new EventSession(repo, slot, staleCore, 'run-stale');
    let conflict = '';
    try { await stale.choose(1, 'goldCash'); } catch (error) { conflict = String(error); }
    const interrupted = eventCore(rewarded.save, () => .25), retry = new EventSession(repo, rewarded, interrupted, 'run-retry');
    const original = repo.transactOnce.bind(repo);
    repo.transactOnce = () => Promise.reject(new Error('synthetic storage failure'));
    let failed = '';
    try { await retry.choose(1, 'merchantHeal'); } catch (error) { failed = String(error); }
    const hpFailed = interrupted.snapshot().hp;
    repo.transactOnce = original;
    await retry.choose(1, 'merchantAtk'); // A failed selection remains pinned to the original choice.
    await retry.choose(1, 'merchantHeal');
    const after = await repo.get(slot.id);
    const hpRestored = interrupted.snapshot().hp;
    await retry.choose(1, 'merchantHeal');
    const hpAgain = interrupted.snapshot().hp;
    repo.close();
    return { rewarded, again, conflict, staleStatus: staleCore.snapshot().status, failed, hpFailed, hpRestored, hpAgain, after };
  });
  expect(result.rewarded.save.gold).toBe(6500); expect(result.again.revision).toBe(1);
  expect(result.conflict).toContain('已更新'); expect(result.staleStatus).toBe('encounter');
  expect(result.failed).toContain('synthetic'); expect(result.hpFailed).toBe(100);
  expect(result.hpRestored).toBeGreaterThan(100); expect(result.hpAgain).toBe(result.hpRestored);
  expect(result.after.save.gold).toBe(6320); expect(result.after.revision).toBe(2);
  expect(result.after.save.chapters).toEqual(fresh.chapters);
  expect(result.after.save.inventory).toEqual(fresh.inventory);
});

test('synthetic event: lost commit response, background pause and original slot isolation', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, EventSession, eventCore } = window.EventFixture;
    const repo = await SaveRepository.open('test-event-receipt-' + crypto.randomUUID()), slot = await repo.initialize();
    const core = eventCore(slot.save, () => .25), session = new EventSession(repo, slot, core, 'run-lost');
    const original = repo.transactOnce.bind(repo);
    repo.transactOnce = async (...args) => { await original(...args); throw new Error('synthetic lost response'); };
    let lost = '';
    try { await session.choose(1, 'merchantHeal'); } catch (error) { lost = String(error); }
    const beforeRetry = { hp: core.snapshot().hp, slot: await repo.get(slot.id) };
    const other = await repo.createFresh(); core.pause(); repo.transactOnce = original;
    await session.choose(1, 'merchantHeal');
    const afterRetry = { hp: core.snapshot().hp, status: core.snapshot().status, slot: await repo.get(slot.id), other: await repo.get(other.id) };
    core.resume(); const resumed = core.snapshot().status; repo.close();
    return { lost, beforeRetry, afterRetry, resumed };
  });
  expect(result.lost).toContain('lost response');
  expect(result.beforeRetry.hp).toBe(100); expect(result.beforeRetry.slot.save.gold).toBe(5820);
  expect(result.afterRetry.slot.revision).toBe(1); expect(result.afterRetry.slot.save.gold).toBe(5820);
  expect(result.afterRetry.hp).toBeGreaterThan(100); expect(result.afterRetry.status).toBe('paused');
  expect(result.afterRetry.other.save.gold).toBe(6000); expect(result.resumed).toBe('running');
});

test('synthetic event: committed receipt followed by another writer does not resume a stale run', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { SaveRepository, EventSession, eventCore } = window.EventFixture;
    const repo = await SaveRepository.open('test-event-stale-receipt-' + crypto.randomUUID()), slot = await repo.initialize();
    const core = eventCore(slot.save), session = new EventSession(repo, slot, core, 'run-stale-receipt');
    const original = repo.transactOnce.bind(repo);
    repo.transactOnce = async (...args) => { await original(...args); throw new Error('synthetic lost response'); };
    await session.choose(1, 'goldCash').catch(() => {}); repo.transactOnce = original;
    await repo.transactOnce(slot.id, 'other-writer', 1, save => { save.gold = Number(save.gold) + 7; });
    let error = '';
    try { await session.choose(1, 'goldCash'); } catch (cause) { error = String(cause); }
    const saved = await repo.get(slot.id); repo.close(); return { error, saved, snapshot: core.snapshot() };
  });
  expect(result.error).toContain('已更新'); expect(result.saved.save.gold).toBe(6507);
  expect(result.snapshot.status).toBe('encounter'); expect(result.snapshot.encounter.notice).toBe('');
});
