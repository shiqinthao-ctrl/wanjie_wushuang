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

for (const kind of ['soldier', 'boss'] as const) for (const action of ['hit', 'dodge', 'interrupt'] as const) for (const effects of [true, false]) {
  test(`enemy ${kind} ${action} effects-${effects ? 'on' : 'off'}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).waitFor();
    await page.addScriptTag({ content: bundle }); await page.addStyleTag({ content: css });
    await page.evaluate(() => window.ChapterBattle.mount(15));
    await page.getByRole('button', { name: '开始成长样板' }).click();
    await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    if (!effects) await page.getByRole('button', { name: '战斗特效 · 开启' }).click();
    await page.evaluate(({ kind, action }) => window.ChapterBattle.enemyScenario(kind, action === 'interrupt'), { kind, action });
    const before = await page.evaluate(() => window.ChapterBattle.enemyEvidence());
    await page.getByRole('button', { name: '继续战斗', exact: true }).click();
    await expect.poll(() => page.evaluate(kind => kind === 'soldier' ? window.ChapterBattle.render().enemies[0]?.soldier?.phase : window.ChapterBattle.render().boss?.sweepPhase, kind), { intervals: [16] }).toBe('windup');
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    const frozen = await page.evaluate(() => window.ChapterBattle.enemyEvidence());
    await page.waitForTimeout(300); expect(await page.evaluate(() => window.ChapterBattle.enemyEvidence())).toEqual(frozen);
    await page.getByRole('button', { name: '继续战斗', exact: true }).click();
    if (action === 'interrupt') {
      await page.locator('.action-pad button').nth(1).click();
      await expect.poll(() => page.evaluate(() => window.ChapterBattle.enemyEvidence().recorded.filter(e => e.type === 'enemy-strike').length)).toBe(0);
      if (kind === 'soldier') await expect.poll(() => page.evaluate(() => window.ChapterBattle.enemyEvidence().recorded.filter(e => e.type === 'soldier-death').length)).toBe(1);
      else await expect(page.getByRole('dialog', { name: '选择首领奖励' })).toBeVisible();
      await page.screenshot({ path: info.outputPath('response.png') });
      await page.waitForTimeout(800);
    } else {
      // Capture a warning before its final response window, using only read access.
      await page.screenshot({ path: info.outputPath('windup.png') });
      if (action === 'dodge') {
        await page.waitForFunction(kind => {
          const state = window.ChapterBattle.render();
          return kind === 'soldier' ? (state.enemies[0]?.soldier?.elapsed ?? 0) >= .36 : (state.telegraphs[0]?.life ?? 9) <= .26;
        }, kind, { polling: 'raf' });
        await page.locator('.action-pad button').nth(0).click();
      }
      await expect.poll(() => page.evaluate(() => window.ChapterBattle.enemyEvidence().recorded.filter(e => e.type === 'enemy-strike').length), { intervals: [16] }).toBe(1);
      await page.screenshot({ path: info.outputPath('response.png') });
      await page.waitForTimeout(240);
      const after = await page.evaluate(() => window.ChapterBattle.enemyEvidence());
      expect(action === 'hit' ? after.hp < before.hp : after.hp === before.hp).toBe(true);
      if (kind === 'boss') expect(after.boss?.sweepPhase).toBe('recovery');
    }
    const after = await page.evaluate(() => window.ChapterBattle.enemyEvidence());
    if (action === 'interrupt') { expect(after.hp).toBe(before.hp); expect(after.recorded.filter(e => e.type === 'enemy-strike')).toHaveLength(0); }
    await writeFile(info.outputPath('scenario.json'), JSON.stringify({ synthetic: true, kind, action, effects, before, frozen, after, errors }, null, 2));
    if (kind === 'boss' && action === 'interrupt') {
      await page.getByRole('button', { name: '领取首章战利品' }).click();
      await expect(page.getByText('首章战报已保存', { exact: true })).toBeVisible();
    } else await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '返回大厅', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.getByRole('button', { name: '开始成长样板' }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => window.ChapterBattle.render().telegraphs)).toHaveLength(0);
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '返回大厅', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(0); expect(errors).toEqual([]);
  });
}
