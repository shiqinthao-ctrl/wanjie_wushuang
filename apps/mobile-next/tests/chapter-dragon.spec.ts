import { test, expect } from '@playwright/test';
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import type * as Fixture from './fixtures/chapterBattle';
declare global { interface Window { ChapterBattle: typeof Fixture } }

test.use({ video: 'on', trace: 'retain-on-failure' });
let bundle = '', css = '';
test.beforeAll(async () => {
  const built = await build({ configFile: false, base: '/mobile-next/', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [vue()], logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('tests/fixtures/chapterBattle.ts'), name: 'ChapterBattle', formats: ['iife'] } } });
  const output = Array.isArray(built) ? built[0]! : built;
  if (!('output' in output)) throw new Error('Missing fixture');
  bundle = output.output.find(item => item.type === 'chunk')!.code;
  css = output.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [String(item.source)] : []).join('\n');
});
for (const kind of ['crowd', 'ranged', 'elite', 'boss'] as const) test(`directed dragon ${kind}: telegraph damage turn pause and teardown`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
  await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: css });
  await page.evaluate(() => window.ChapterBattle.mount(15));
  await page.getByRole('button', { name: '开始成长样板' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  await page.evaluate(kind => window.ChapterBattle.dragonScenario(kind), kind);
  const touch = info.project.name === 'phone' ? await page.context().newCDPSession(page) : undefined;
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const center = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  if (touch) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...center, x: center.x + 25 }] });
    const action = (await page.locator('.action-pad button').nth(1).boundingBox())!;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...center, x: center.x + 25 }, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
    await page.waitForTimeout(90); await page.screenshot({ path: info.outputPath('windup.png') });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.down('d'); await page.keyboard.press('e'); await page.waitForTimeout(90);
    await page.screenshot({ path: info.outputPath('windup.png') }); await page.keyboard.up('d');
  }
  await page.waitForTimeout(1000);
  await expect.poll(() => page.evaluate(() => window.ChapterBattle.combatEvidence().damage.H001_DRAGON_E || 0)).toBeGreaterThan(0);
  await page.locator('.action-pad button').nth(2).click();
  await page.waitForTimeout(420);
  if (touch) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...center, y: center.y + 25 }] });
    await page.waitForTimeout(110); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else { await page.keyboard.down('s'); await page.waitForTimeout(110); await page.keyboard.up('s'); }
  await page.waitForTimeout(2200); await page.screenshot({ path: info.outputPath('combat.png') });
  const evidence = await page.evaluate(() => window.ChapterBattle.combatEvidence());
  const slashes = evidence.recorded.filter(e => e.type === 'dragon-slash' && e.source === 'H001_DRAGON_R');
  expect(slashes).toHaveLength(kind === 'elite' || kind === 'boss' ? 5 : 3);
  expect(new Set(slashes.map(e => e.type === 'dragon-slash' && Math.round(e.facing * 100))).size).toBeGreaterThan(1);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await expect(page.getByLabel('本局进化路线')).toContainText('移动决定朝向');
  const time = await page.evaluate(() => window.ChapterBattle.snapshot().time);
  await page.waitForTimeout(500); expect(await page.evaluate(() => window.ChapterBattle.snapshot().time)).toBe(time);
  await page.screenshot({ path: info.outputPath('guide.png') });
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await writeFile(info.outputPath('scenario.json'), JSON.stringify({ synthetic: true, kind, errors, ...evidence }, null, 2));
  expect(errors).toEqual([]);
});
