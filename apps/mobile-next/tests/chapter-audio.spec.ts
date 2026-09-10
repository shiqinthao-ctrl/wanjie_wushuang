import { test, expect } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { installAudioProbe } from './fixtures/audioProbe';
import type { AudioProbe } from './fixtures/audioProbe';
import type * as Fixture from './fixtures/chapterBattle';
import type { Page } from '@playwright/test';
declare global { interface Window { ChapterBattle: typeof Fixture; AudioProbe: AudioProbe; chapterAudioEvidence?: () => { played: string[]; failures: string[] } } }

test.use({ video: 'on', trace: 'retain-on-failure' });
let bundle = '', css = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, base: '/mobile-next/', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [vue()], logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/audioBattle.ts'), name: 'ChapterBattle', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Missing fixture');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
  css = output.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n');
});
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const found: string[] = []; errors.set(page, found);
  page.on('pageerror', e => found.push(e.message));
  page.on('console', e => { if (e.type() === 'error') found.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) found.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(installAudioProbe);
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
});
test.afterEach(async ({ page }, info) => {
  const bytes = await page.evaluate(() => window.AudioProbe.stop());
  if (bytes.length) await writeFile(info.outputPath('battle-with-audio.webm'), Buffer.from(bytes));
  await writeFile(info.outputPath('timeline.json'), JSON.stringify(await page.evaluate(() => window.AudioProbe.timeline()), null, 2));
  const evidence = await page.evaluate(() => window.chapterAudioEvidence?.());
  await writeFile(info.outputPath('backend.json'), JSON.stringify(evidence, null, 2) || '{}');
  if (evidence) expect(evidence.failures).toEqual([]);
  expect(errors.get(page)).toEqual([]);
});
async function enter(page: Page) {
  await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: css });
  await page.evaluate(() => window.ChapterBattle.mount());
  await page.getByRole('button', { name: '开始成长样板' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
}
const summary = (page: Page) => page.evaluate(() => window.AudioProbe.summary());
async function pause(page: Page) { await page.getByRole('button', { name: '暂停', exact: true }).click(); }
async function resume(page: Page) { await page.getByRole('button', { name: '继续战斗', exact: true }).click(); }
async function mark(page: Page, label: string) { await page.evaluate(label => window.AudioProbe.mark(label), label); }

test('trusted unlock, audible sample, mute persistence and lifecycle', async ({ page }, info) => {
  await enter(page); expect(await summary(page)).toEqual([]);
  await page.getByRole('button', { name: '闪避', exact: true }).dispatchEvent('pointerdown');
  expect(await summary(page)).toEqual([]);
  await pause(page); expect((await summary(page))[0]!.state).toBe('running');
  await resume(page); await page.waitForTimeout(100);
  await page.evaluate(() => window.ChapterBattle.dragonScenario('elite'));
  // Captures the actual rendered battle canvas plus the live mixer output.
  await page.evaluate(() => window.AudioProbe.record());
  await page.getByRole('button', { name: '赤龙破阵', exact: true }).click();
  await mark(page, 'skill');
  await expect.poll(async () => (await summary(page))[0]!.rms).toBeGreaterThan(.001);
  await page.waitForTimeout(1200);
  await pause(page); await expect.poll(async () => (await summary(page))[0]!.rms).toBe(0);
  await mark(page, 'paused-silence');
  const frozen = await page.evaluate(() => window.ChapterBattle.snapshot().time);
  await page.waitForTimeout(500); expect(await page.evaluate(() => window.ChapterBattle.snapshot().time)).toBe(frozen);
  await page.getByRole('button', { name: '战斗声音 · 开启', exact: true }).click();
  await page.getByLabel('音效音量').fill('0.4');
  await page.screenshot({ path: info.outputPath('audio-settings.png') });
  await resume(page); await page.waitForTimeout(100);
  await mark(page, 'muted-combat');
  const muted = (await summary(page))[0]!.starts;
  await page.getByRole('button', { name: '闪避', exact: true }).click();
  await page.waitForTimeout(500); expect((await summary(page))[0]!.starts).toBe(muted);
  await pause(page); await page.getByRole('button', { name: '战斗声音 · 关闭', exact: true }).click(); await resume(page);
  await page.waitForTimeout(100); await page.getByRole('button', { name: '龙焰连斩', exact: true }).click();
  await mark(page, 'ultimate-unmuted');
  await expect.poll(async () => (await summary(page))[0]!.starts).toBeGreaterThan(muted);
  await page.waitForTimeout(1300);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('dialog', { name: '战局已暂停' })).toBeVisible();
  await expect.poll(async () => (await summary(page))[0]!.rms).toBe(0);
  await mark(page, 'blur-silence');
  await page.waitForTimeout(500); await resume(page); await page.waitForTimeout(700);
  await writeFile(info.outputPath('battle-with-audio.webm'), Buffer.from(await page.evaluate(() => window.AudioProbe.stop())));
  await pause(page); await page.getByRole('button', { name: '战斗声音 · 开启', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect.poll(async () => (await summary(page))[0]!.state).toBe('closed');
  await page.getByRole('button', { name: '开始成长样板' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled(); await pause(page);
  await expect(page.getByRole('button', { name: '战斗声音 · 关闭', exact: true })).toBeVisible();
  await expect(page.getByLabel('音效音量')).toHaveValue('0.4');
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect.poll(async () => (await summary(page)).every(r => r.state === 'closed')).toBe(true);
  const evidence = await summary(page);
  await writeFile(info.outputPath('audio.json'), JSON.stringify({ synthetic: true, view: info.project.name, evidence, consoleErrors: errors.get(page) }, null, 2));
});

test('chapter growth and Boss warning produce distinct sound events', async ({ page }, info) => {
  await enter(page); await pause(page); await resume(page); await page.waitForTimeout(100);
  await page.evaluate(() => window.AudioProbe.record());
  await page.evaluate(() => window.ChapterBattle.seedXp(74));
  const dialog = page.getByRole('dialog', { name: '选择本局强化' }); await expect(dialog).toBeVisible();
  await dialog.locator('.level-option').first().click();
  await dialog.locator('[data-option="dragon"]').click();
  await mark(page, 'evolution');
  await page.waitForTimeout(1000); const growth = await summary(page);
  expect(growth[0]!.starts).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('evolve');
  while (await dialog.isVisible()) await dialog.locator('.level-option').first().click();
  await page.evaluate(() => window.ChapterBattle.seedXp(505));
  await expect(dialog).toBeVisible();
  for (let step = 0; step < 16 && await dialog.isVisible(); step++) {
    const offer = await page.evaluate(() => window.ChapterBattle.snapshot().choice!);
    const option = offer.options.find(o => o.id === 'awaken') || offer.options.find(o => o.id === 'A003') || offer.options[0]!;
    await dialog.locator(`[data-option="${option.id}"]`).click();
    if (option.id === 'awaken') {
      await mark(page, 'awakening');
      await expect.poll(() => page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('awaken');
      await page.waitForTimeout(1300);
    }
  }
  expect((await page.evaluate(() => window.ChapterBattle.snapshot())).journey!.rank).toBe(2);
  expect(await page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('level');
  await page.waitForTimeout(200);
  await page.evaluate(() => window.ChapterBattle.enemyScenario('boss'));
  await mark(page, 'boss-arrival-warning');
  await expect.poll(async () => (await summary(page))[0]!.rms, { intervals: [30] }).toBeGreaterThan(.001);
  await page.waitForTimeout(1500); await page.screenshot({ path: info.outputPath('boss-audio.png') });
  expect(await page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('warning');
  await writeFile(info.outputPath('battle-with-audio.webm'), Buffer.from(await page.evaluate(() => window.AudioProbe.stop())));
  await pause(page); await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await writeFile(info.outputPath('audio.json'), JSON.stringify({ synthetic: true, growth, final: await summary(page) }, null, 2));
});

test('unsupported audio does not block combat or exit', async ({ page }) => {
  await page.evaluate(() => { window.AudioContext = class { constructor() { throw new Error('Synthetic unavailable audio'); } } as unknown as typeof AudioContext; });
  await enter(page); await pause(page); await resume(page);
  await page.getByRole('button', { name: '闪避', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.ChapterBattle.snapshot().time)).toBeGreaterThan(.2);
  await pause(page); await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('G5 preview does not create audio or expose chapter sound settings', async ({ page }) => {
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled(); await pause(page);
  expect(await summary(page)).toEqual([]); await expect(page.getByLabel('战斗声音设置')).toHaveCount(0);
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
});

test('hidden lifecycle stays silent until manual continue', async ({ page }) => {
  await enter(page); await pause(page); await resume(page);
  await page.getByRole('button', { name: '炎龙斩', exact: true }).click();
  await expect.poll(async () => (await summary(page))[0]!.starts).toBeGreaterThan(0);
  // Directed visibility event; physical OS backgrounding is a separate gate.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('dialog', { name: '战局已暂停' })).toBeVisible();
  await expect.poll(async () => (await summary(page))[0]!.rms).toBe(0);
  const stopped = await summary(page), time = await page.evaluate(() => window.ChapterBattle.snapshot().time);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.ChapterBattle.snapshot().time)).toBe(time);
  expect((await summary(page))[0]!.starts).toBe(stopped[0]!.starts);
  await resume(page); await page.getByRole('button', { name: '闪避', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('dodge');
  await pause(page); await page.getByRole('button', { name: '返回大厅', exact: true }).click();
});

test('twenty chapter exits close every audio context', async ({ page }, info) => {
  test.setTimeout(120_000);
  await enter(page);
  for (let cycle = 0; cycle < 20; cycle++) {
    if (cycle) {
      await page.getByRole('button', { name: '开始成长样板' }).click();
      await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
    }
    await pause(page); await resume(page);
    await page.getByRole('button', { name: '闪避', exact: true }).click();
    await expect.poll(async () => (await summary(page)).at(-1)!.starts).toBeGreaterThan(0);
    await pause(page); await page.getByRole('button', { name: '返回大厅', exact: true }).click();
    await expect.poll(async () => (await summary(page)).every(item => item.state === 'closed' && item.live === 0)).toBe(true);
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  expect(await summary(page)).toHaveLength(20);
  await writeFile(info.outputPath('lifecycle.json'), JSON.stringify(await summary(page), null, 2));
});

test('preferences survive reload and storage failure keeps current audio choice usable', async ({ page }, info) => {
  await enter(page); await pause(page);
  await page.getByLabel('音效音量').fill('0.3');
  await page.getByRole('button', { name: '战斗声音 · 开启', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
  await enter(page); await pause(page);
  await expect(page.getByRole('button', { name: '战斗声音 · 关闭', exact: true })).toBeVisible();
  await expect(page.getByLabel('音效音量')).toHaveValue('0.3');
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'wanjie-mobile-next:chapter-audio:v1') throw new DOMException('Directed quota failure', 'QuotaExceededError');
      return set.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: '战斗声音 · 关闭', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('设置暂未保存，本次战斗已生效。');
  if (info.project.name === 'phone') for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const settings = page.getByLabel('战斗声音设置'); await settings.scrollIntoViewIfNeeded();
    for (const control of [settings.getByRole('button'), page.getByLabel('音效音量')]) {
      const box = (await control.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(48); expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: info.outputPath(`settings-${width}.png`) });
  }
  await resume(page); await page.getByRole('button', { name: '闪避', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.chapterAudioEvidence!().played)).toContain('dodge');
  await pause(page); await page.getByRole('button', { name: '返回大厅', exact: true }).click();
});
