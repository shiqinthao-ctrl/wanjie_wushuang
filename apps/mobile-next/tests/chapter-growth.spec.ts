import { test, expect } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import type * as Fixture from './fixtures/chapterBattle';
import type { Page } from '@playwright/test';
declare global { interface Window { ChapterBattle: typeof Fixture } }
test.use({ video: 'on', trace: 'retain-on-failure' });
let bundle = '', css = '';
const browserErrors = new WeakMap<Page, string[]>();
test.beforeAll(async () => {
  const built = await build({ configFile: false, base: '/mobile-next/', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [vue()], logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/chapterBattle.ts'), name: 'ChapterBattle', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Missing fixture');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
  css = output.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n');
});
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
  await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: css });
  await page.evaluate(() => window.ChapterBattle.mount(15));
  await page.getByRole('button', { name: '开始成长样板' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
});
test.afterEach(async ({ page }, info) => {
  await writeFile(info.outputPath('browser-errors.json'), JSON.stringify(browserErrors.get(page) || [], null, 2));
  expect(browserErrors.get(page)).toEqual([]);
});

test('synthetic UI: reroll ban and three-choice evolution preserve tokens and budgets', async ({ page }) => {
  await page.evaluate(() => window.ChapterBattle.seedXp(26));
  const modal = page.getByRole('dialog', { name: '选择本局强化' }); await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: '重抽 · 剩余 2 次' }).click();
  await expect(modal.getByRole('button', { name: '重抽 · 剩余 1 次' })).toBeVisible();
  const ban = modal.getByRole('button', { name: '放逐此项' }).first();
  const banned = await ban.locator('..').locator('.level-option').getAttribute('data-option');
  await ban.click(); expect((await page.evaluate(() => window.ChapterBattle.snapshot())).growth!.banned).toContain(banned);
  await expect(modal.getByRole('button', { name: '放逐此项' })).toHaveCount(0);
  await modal.locator('.level-option').first().click();
  await page.evaluate(() => window.ChapterBattle.seedXp(48)); await expect(modal).toBeVisible();
  await expect(modal.locator('[data-kind="hero"]')).toHaveCount(3);
  await expect(modal.getByRole('button', { name: /重抽/ })).toHaveCount(0);
  await modal.locator('.level-option').first().click();
  const state = await page.evaluate(() => window.ChapterBattle.snapshot()); expect(state.skills[state.growth!.coreSkill!]).toBeGreaterThanOrEqual(1);
});

test('synthetic touch: held finger at level-up cannot select; cancel and blur clear movement', async ({ page }, info) => {
  const touch = await page.context().newCDPSession(page);
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const finger = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...finger, x: finger.x + 35 }] });
  await page.evaluate(() => window.ChapterBattle.seedXp(26));
  const modal = page.getByRole('dialog', { name: '选择本局强化' }); await expect(modal).toBeVisible();
  const token = await page.evaluate(() => window.ChapterBattle.snapshot().choice!.token);
  const option = (await modal.locator('.level-option').first().boundingBox())!;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: option.x + 25, y: option.y + 25 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await page.evaluate(() => window.ChapterBattle.snapshot())).choice?.token).toBe(token);
  await page.screenshot({ path: info.outputPath('ordinary-choice.png') });
  await modal.locator('.level-option').first().click();
  const stopped = await page.evaluate(() => window.ChapterBattle.position());
  await page.waitForTimeout(300); expect(await page.evaluate(() => window.ChapterBattle.position())).toEqual(stopped);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...finger, x: finger.x + 35 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.keyboard.down('w'); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await page.keyboard.up('w');
  const pause = page.getByRole('dialog', { name: '战局已暂停' }); await expect(pause).toBeVisible();
  const time = await page.evaluate(() => window.ChapterBattle.snapshot().time);
  await page.waitForTimeout(300); expect(await page.evaluate(() => window.ChapterBattle.snapshot().time)).toBe(time);
  await pause.getByRole('button', { name: '继续战斗', exact: true }).click();
  const resumed = await page.evaluate(() => window.ChapterBattle.position());
  await page.waitForTimeout(300); expect(await page.evaluate(() => window.ChapterBattle.position())).toEqual(resumed);
});

for (const reason of ['defeat', 'victory', 'timeout'] as const) test(`synthetic UI: ${reason} saves only chapter, replays and reloads`, async ({ page }) => {
  const before = await page.evaluate(() => window.ChapterBattle.saved());
  await page.evaluate(reason => window.ChapterBattle.finish(reason), reason);
  if (reason === 'victory') await page.getByRole('button', { name: '领取首章战利品' }).click();
  await expect(page.getByText('首章战报已保存', { exact: true })).toBeVisible();
  const after = await page.evaluate(() => window.ChapterBattle.saved());
  expect(after.revision).toBe(before.revision + 1);
  const extension = after.save.mobileChapter;
  expect(extension).toMatchObject({ reports: [{ endReason: reason, stars: reason === 'victory' ? 1 : 0 }] });
  const { mobileChapter: _chapter, ...rest } = after.save; expect(rest).toEqual(before.save);
  await page.getByRole('button', { name: '再次挑战本关' }).click();
  await expect.poll(() => page.evaluate(() => window.ChapterBattle.snapshot().status)).toBe('running');
  expect((await page.evaluate(() => window.ChapterBattle.snapshot())).skills).toEqual({ A003: 1 });
  expect((await page.evaluate(() => window.ChapterBattle.saved())).revision).toBe(after.revision);
  const reloaded = await page.evaluate(() => window.ChapterBattle.reloadSaved()); expect(reloaded).toEqual(after);
});

test('natural normal-speed H001 growth: move cast evolve route awaken and pause', async ({ page }, info) => {
  test.setTimeout(540_000);
  const errors = browserErrors.get(page)!, timeline: { wallSeconds: number; event: string; battle: unknown }[] = [];
  const started = Date.now(); let coreSkill = 'A003', evolved = false, routed = false, awakened = false;
  const mark = async (event: string) => {
    timeline.push({ wallSeconds: (Date.now() - started) / 1000, event, battle: await page.evaluate(() => window.ChapterBattle.snapshot()) });
    await writeFile(info.outputPath('natural-timeline.json'), JSON.stringify({ seed: 15, errors, timeline }, null, 2));
  };
  await mark('开始：正常速度，无 HP/经验/掉落/时钟修改');
  const modal = page.getByRole('dialog', { name: '选择本局强化' });
  const touch = info.project.name === 'phone' ? await page.context().newCDPSession(page) : undefined;
  for (let step = 0; step < 410 && !(evolved && routed && awakened); step++) {
    if (await page.getByRole('dialog', { name: /本局生命耗尽|破围超时|破围成功/ }).isVisible()) { await mark('自然战斗结束'); break; }
    if (await modal.isVisible()) {
      const options = await modal.locator('.level-option').evaluateAll(items => items.map(item => ({ id: item.getAttribute('data-option')!, kind: item.getAttribute('data-kind')! })));
      const selected = options.find(o => o.id === 'awaken') || options.find(o => o.id === 'dragon') || options.find(o => o.id === coreSkill) || options.find(o => ['nova', 'glacier', 'orbit'].includes(o.id)) || options.find(o => ['A011', 'A026', 'S001'].includes(o.id)) || options[0]!;
      if (selected.kind === 'hero' && selected.id !== 'awaken') {
        expect(options).toHaveLength(3); expect(new Set(options.map(o => o.id)).size).toBe(3);
        coreSkill = { dragon: 'A003', bulwark: 'A021', frostlord: 'G2_FROST', frostflame: 'G2_FROST' }[selected.id]!; evolved = true;
      }
      await mark(`准备选择 ${selected.kind}:${selected.id}`);
      if (selected.kind === 'hero' || selected.kind === 'route') { await page.screenshot({ path: info.outputPath(`choice-${selected.id}.png`) }); await page.waitForTimeout(1000); }
      await modal.locator(`[data-option="${selected.id}"]`).click();
      routed ||= selected.kind === 'route'; awakened ||= selected.id === 'awaken';
      continue;
    }
    if (touch) {
      const pad = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 400 }).catch(() => null); if (!pad) continue;
      const origin = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
      const point = { ...origin, x: origin.x + [30, 0, -30, 0][step % 4]!, y: origin.y + [0, 30, 0, -30][step % 4]! };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      const skill = page.locator('.action-pad button').nth(1);
      if (await skill.isEnabled().catch(() => false)) {
        const box = await skill.boundingBox(); if (box) await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point, { id: 2, x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
      }
      await page.waitForTimeout(1000); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const key = ['d', 's', 'a', 'w'][step % 4]!;
      await page.keyboard.down(key); await page.keyboard.press('e'); await page.keyboard.press('r');
      await page.waitForTimeout(1000); await page.keyboard.up(key);
    }
    if (step % 15 === 0) await mark('战斗采样');
  }
  await mark('成长验收终点');
  expect({ evolved, routed, awakened }).toEqual({ evolved: true, routed: true, awakened: true });
  while (await modal.isVisible()) await modal.locator('.level-option').first().click();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await expect(pause.getByLabel('本局进化路线')).toContainText('觉醒');
  const time = await page.getByLabel('本局时间').textContent(); await page.waitForTimeout(1000); expect(await page.getByLabel('本局时间').textContent()).toBe(time);
  await page.screenshot({ path: info.outputPath('awakened-guide.png') });
  await pause.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始成长样板' })).toBeVisible(); expect(errors).toEqual([]);
});
