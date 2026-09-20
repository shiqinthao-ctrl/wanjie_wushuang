import { test, expect } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import type { Locator, Page } from '@playwright/test';
import type * as Fixture from './fixtures/chapterBattle';

declare global { interface Window { ChapterBattle: typeof Fixture } }
test.use({ video: 'on', trace: 'retain-on-failure' });
let bundle = '', css = '';
const errors = new WeakMap<Page, string[]>();
test.beforeAll(async () => {
  const built = await build({ configFile: false, base: '/mobile-next/', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [vue()], logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/chapterBattle.ts'), name: 'ChapterBattle', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Missing fixture');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
  css = output.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n');
});
test.beforeEach(async ({ page }) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', e => messages.push(e.message));
  page.on('console', e => { if (e.type() === 'error') messages.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) messages.push(`${r.status()} ${r.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
  await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: css });
  await page.evaluate(() => window.ChapterBattle.mount(15));
  await page.getByRole('button', { name: '开始成长样板' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
});
test.afterEach(async ({ page }, info) => {
  await writeFile(info.outputPath('browser-errors.json'), JSON.stringify(errors.get(page), null, 2));
  expect(errors.get(page)).toEqual([]);
});

async function inside(node: Locator, width: number, height: number, top = 0, bottom = 0) {
  const box = (await node.boundingBox())!;
  expect.soft(box, await node.getAttribute('class') ?? undefined).not.toBeNull();
  if (!box) return;
  expect.soft(box.x).toBeGreaterThanOrEqual(0);
  expect.soft(box.x + box.width).toBeLessThanOrEqual(width);
  expect.soft(box.y).toBeGreaterThanOrEqual(top);
  expect.soft(box.y + box.height).toBeLessThanOrEqual(height - bottom);
}

for (const width of [360, 390, 430]) test(`mobile layout ${width}: readable HUD and reachable pause actions`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 640 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 24, bottom: 34, left: 0, right: 0 } });
  await page.screenshot({ path: info.outputPath('battle.png') });
  const hints = await page.locator('.action-pad').innerText();
  expect.soft(hints).not.toMatch(/Space|E \/ Q/);
  for (const button of await page.locator('.battle-hud button, .action-pad button').all()) {
    const box = (await button.boundingBox())!;
    expect.soft(box.width).toBeGreaterThanOrEqual(48); expect.soft(box.height).toBeGreaterThanOrEqual(48);
  }
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await page.screenshot({ path: info.outputPath('pause.png') });
  await inside(pause.getByRole('button', { name: '继续战斗' }), width, 640, 24, 34);
  await expect.soft(pause.getByLabel('本局进化路线')).toBeHidden();
});

test('chapter pause 360: collapsed build guide expands scrolls and actions stay pinned', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 24, bottom: 34, left: 0, right: 0 } });
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await expect.soft(pause.getByLabel('本局进化路线')).toBeHidden();
  await page.screenshot({ path: info.outputPath('pause-collapsed.png') });
  await pause.locator('summary').click();
  const guide = pause.getByLabel('本局进化路线');
  await expect.soft(guide).toBeVisible();
  const content = page.locator('.pause-content');
  expect.soft(await content.evaluate(node => node.scrollHeight - node.clientHeight)).toBeGreaterThan(0);
  await content.evaluate(node => { node.scrollTop = node.scrollHeight; });
  await page.waitForTimeout(150);
  await page.screenshot({ path: info.outputPath('pause-expanded.png') });
  await inside(pause.getByRole('button', { name: '继续战斗' }), 360, 640, 24, 34);
  await inside(pause.getByRole('button', { name: '返回大厅' }), 360, 640, 24, 34);
  await pause.locator('summary').click();
  await expect.soft(guide).toBeHidden();
  await pause.getByRole('button', { name: '继续战斗' }).click();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await expect.soft(guide).toBeHidden();
  await expect.soft(pause.getByRole('button', { name: '继续战斗' })).toBeVisible();
});

test('short landscape 640x360: compact HUD rows and pause fit safe areas', async ({ page }, info) => {
  await page.setViewportSize({ width: 640, height: 360 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 24, bottom: 34, left: 0, right: 0 } });
  await page.screenshot({ path: info.outputPath('battle.png') });
  for (const button of await page.locator('.battle-hud button, .action-pad button').all()) {
    const box = (await button.boundingBox())!;
    expect.soft(box.width).toBeGreaterThanOrEqual(48); expect.soft(box.height).toBeGreaterThanOrEqual(48);
  }
  await inside(page.locator('.battle-hud'), 640, 360, 24, 34);
  await inside(page.locator('.combat-vitals'), 640, 360, 24, 34);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await page.screenshot({ path: info.outputPath('pause.png') });
  await inside(pause, 640, 360, 24, 34);
  await inside(pause.getByRole('button', { name: '继续战斗' }), 640, 360, 24, 34);
  await inside(pause.getByRole('button', { name: '返回大厅' }), 640, 360, 24, 34);
});

test('resizing mid-run keeps HUD targets usable and pause reachable', async ({ page }) => {
  for (const [width, height] of [[390, 640], [360, 640], [430, 640], [390, 360]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    for (const button of await page.locator('.battle-hud button, .action-pad button').all()) {
      const box = (await button.boundingBox())!;
      expect.soft(box.width, `${width}x${height}`).toBeGreaterThanOrEqual(48);
      expect.soft(box.height, `${width}x${height}`).toBeGreaterThanOrEqual(48);
    }
  }
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await expect(pause.getByRole('button', { name: '继续战斗' })).toBeVisible();
  await pause.getByRole('button', { name: '继续战斗' }).click();
  await expect(pause).toBeHidden();
});

test('normal-speed touch: simultaneous move and cast without altered stats', async ({ page }, info) => {
  const touch = await page.context().newCDPSession(page);
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const finger = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  const start = await page.evaluate(() => window.ChapterBattle.position());
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...finger, x: finger.x + 30 }] });
  await page.waitForTimeout(400);
  const moved = await page.evaluate(() => window.ChapterBattle.position());
  expect.soft(Math.hypot(moved.x - start.x, moved.y - start.y)).toBeGreaterThan(8);
  const skill = (await page.locator('.action-pad button').nth(1).boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: finger.x + 30, y: finger.y }, { id: 2, x: skill.x + skill.width / 2, y: skill.y + skill.height / 2 }] });
  await page.waitForTimeout(160);
  expect.soft((await page.evaluate(() => window.ChapterBattle.snapshot())).skillCd).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('move-cast.png') });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.waitForTimeout(120);
  const held = await page.evaluate(() => window.ChapterBattle.position());
  await page.waitForTimeout(320);
  expect(await page.evaluate(() => window.ChapterBattle.position())).toEqual(held);
});

test('held finger enters pause modal: run halts and resume returns control', async ({ page }) => {
  const touch = await page.context().newCDPSession(page);
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const finger = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...finger, x: finger.x + 30 }] });
  await page.waitForTimeout(250);
  const pauseButton = (await page.getByRole('button', { name: '暂停', exact: true }).boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: finger.x + 30, y: finger.y }, { id: 2, x: pauseButton.x + pauseButton.width / 2, y: pauseButton.y + pauseButton.height / 2 }] });
  await page.waitForTimeout(120);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ id: 2, x: pauseButton.x + pauseButton.width / 2, y: pauseButton.y + pauseButton.height / 2 }] });
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await expect(pause).toBeVisible();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  const time = await page.evaluate(() => window.ChapterBattle.snapshot().time);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.ChapterBattle.snapshot().time)).toBe(time);
  await pause.getByRole('button', { name: '继续战斗', exact: true }).click();
  const resumed = await page.evaluate(() => window.ChapterBattle.position());
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.ChapterBattle.position())).toEqual(resumed);
});

test('directed upgrade 360: choice cards fit width and stay tappable', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.evaluate(() => window.ChapterBattle.seedXp(26));
  const modal = page.getByRole('dialog', { name: '选择本局强化' });
  await expect(modal).toBeVisible();
  for (const card of await modal.locator('.level-option').all()) {
    const box = (await card.boundingBox())!;
    expect.soft(box.x).toBeGreaterThanOrEqual(0); expect.soft(box.x + box.width).toBeLessThanOrEqual(360);
    expect.soft(box.height).toBeGreaterThanOrEqual(48);
    await card.scrollIntoViewIfNeeded();
    const shown = (await card.boundingBox())!;
    expect.soft(shown.y).toBeGreaterThanOrEqual(0); expect.soft(shown.y + shown.height).toBeLessThanOrEqual(640);
  }
  await page.screenshot({ path: info.outputPath('choice.png') });
});

test('directed boss 390: boss HUD stays inside viewport and readable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.evaluate(() => window.ChapterBattle.dragonScenario('boss'));
  const hud = page.getByLabel('首领状态');
  await expect(hud).toBeVisible();
  await inside(hud, 390, 640, 24, 34);
  expect.soft((await hud.boundingBox())!.height).toBeLessThanOrEqual(120);
  await page.screenshot({ path: info.outputPath('boss.png') });
});
