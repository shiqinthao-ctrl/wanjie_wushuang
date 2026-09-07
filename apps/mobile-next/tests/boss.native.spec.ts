import { expect, test } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import oracle from '../../../tasks/mobile-modernization/baseline/boss-oracle.json' with { type: 'json' };
import fresh from '../src/data/freshSave.json' with { type: 'json' };
import type * as BossModule from './fixtures/bossHarness';
declare global { interface Window { BossFixture: typeof BossModule; bossFixture: Awaited<ReturnType<typeof BossModule.mountLoot>> } }
let bundle = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, plugins: [vue()], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' }, build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/bossHarness.ts'), name: 'BossFixture', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Boss fixture bundle missing');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
});
test.beforeEach(async ({ page }) => { await page.goto('./'); await page.addScriptTag({ content: bundle }); });

test('synthetic Chrome Boss loot matches exact legacy items, RNG order and duplicate choice guard', async ({ page }) => {
  const actual = await page.evaluate(({ fresh, clock, cases }) => cases.map(({ difficulty, seed }) => {
    const { CombatSimulation, calculateStartup, Progression } = window.BossFixture;
    const save = { ...fresh, difficulty }, start = calculateStartup(save); let state = seed, calls = 0;
    const random = () => { calls++; return ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296); };
    const sim = new CombatSimulation(save, new Progression(save.build, start.skills, start.passives), random, [], () => clock);
    sim.time = 270; sim.bossEncounter.spawn(); sim.hitBoss(1e9, 'MAP_BARREL');
    const automatic = structuredClone(sim.drops), beforeCalls = calls;
    sim.time += .2; sim.bossEncounter.updateObjective();
    const choices = sim.bossEncounter.snapshot().offer!, choiceCalls = calls;
    const picked = sim.bossEncounter.pick(choices[1]!.uid!), duplicate = sim.bossEncounter.pick(choices[1]!.uid!);
    return { automatic, beforeCalls, choices, choiceCalls, drops: sim.drops, picked, duplicate, calls };
  }), { fresh, clock: oracle.clock, cases: oracle.loot });
  for (const [i, item] of actual.entries()) {
    const old = oracle.loot[i]!;
    expect(item.automatic).toEqual(old.automatic); expect(item.beforeCalls).toBe(old.beforeChoice.calls);
    expect(item.choices).toEqual(old.choices); expect(item.choiceCalls).toBe(old.choiceCalls);
    expect(item.drops).toEqual(old.drops); expect(item.calls).toBe(old.calls);
    expect(item.picked).toBe(true); expect(item.duplicate).toBe(false);
  }
});

test('synthetic real loot component: three rewards, paused restore, one choice and narrow layout', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => { window.bossFixture = await window.BossFixture.mountLoot(); });
  const dialog = page.getByRole('dialog', { name: '选择首领奖励' });
  await expect(dialog).toBeVisible(); await expect(dialog.getByRole('button')).toHaveCount(3);
  const labels = await dialog.getByRole('button').allTextContents();
  await page.evaluate(() => window.bossFixture.pause()); await expect(dialog).not.toBeVisible();
  await page.evaluate(() => window.bossFixture.resume()); await expect(dialog).toBeVisible();
  expect(await dialog.getByRole('button').allTextContents()).toEqual(labels);
  const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('synthetic-boss-loot.png') });
  await dialog.getByRole('button').nth(1).click(); await expect(dialog).not.toBeVisible();
  const snapshot = await page.evaluate(() => window.bossFixture.snapshot());
  expect(snapshot.status).toBe('running'); expect(snapshot.encounter.gearCount).toBe(2);
  await page.evaluate(() => window.bossFixture.destroy()); expect(errors).toEqual([]);
});
