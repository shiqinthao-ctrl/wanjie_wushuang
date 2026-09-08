import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import type { GameSave } from '../../src/core/saveTypes';
import { heroForms, skillRoutes } from '../../src/core/evolutionCatalog';

export async function exportProgress(page: Page): Promise<GameSave> {
  await page.getByRole('button', { name: '存档', exact: true }).click();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '导出当前进度' }).click();
  const stream = await (await pending).createReadStream(); let raw = ''; for await (const chunk of stream) raw += chunk.toString();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click(); return JSON.parse(raw);
}

// Natural play uses visible choices and physical input. No RNG, clock or core injection.
export interface EvolutionPlan { form: string; signature: string; route: string; bonds: string[] }
export async function playEvolution(page: Page, info: TestInfo, hero: string, complete = false, plan?: EvolutionPlan) {
  const errors: string[] = [], choices: { id: string; kind: string }[] = [];
  const started = Date.now(), timeline: { seconds: number; event: string }[] = [];
  const mark = async (event: string) => {
    timeline.push({ seconds: Math.round((Date.now() - started) / 100) / 10, event });
    await writeFile(info.outputPath('timeline.json'), JSON.stringify(timeline, null, 2));
  };
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进化征途', exact: true }).click();
  await page.getByRole('button', { name: hero }).click();
  await expect(page.getByRole('button', { name: '开启进化征途' })).toBeEnabled();
  const before = await exportProgress(page);
  await expect(page.getByRole('img', { name: hero })).toBeVisible();
  await expect.poll(() => page.getByRole('img', { name: hero }).evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath('evolution-lobby.png'), fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '开启进化征途' }).click();
  await mark('开始战斗');
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  const modal = page.getByRole('dialog', { name: '选择本局强化' }), result = page.getByRole('dialog', { name: /本局生命耗尽|首战时限已到|黄巾巨将已击败/ });
  const touch = info.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  let evolved = false, routed = false, bonded = false, awaken = false, guided = false;
  for (let step = 0; step < (complete ? 600 : 230); step++) {
    if (await result.isVisible()) break;
    if (await modal.isVisible()) {
      const buttons = modal.locator('.level-option');
      const options = await buttons.evaluateAll(items => items.map(item => ({ id: item.getAttribute('data-option')!, kind: item.getAttribute('data-kind')!, text: item.textContent || '' })));
      const score = (option: typeof options[number]) => option.kind === 'hero' ? 100 + Number(plan ? option.id === plan.form : complete && option.id === 'bulwark') : option.kind === 'route' ? 90 + Number(plan ? option.id === plan.route : complete && ['nova', 'orbit', 'guard'].includes(option.id)) : plan && option.id === plan.signature ? 85 : plan && ['G2_FROST', 'A013', 'S001'].includes(option.id) ? 82 : ['A011', 'S001'].includes(option.id) ? 80 : ['A015', 'A026', 'A013'].includes(option.id) ? 70 : option.kind === 'active' ? 40 : 10;
      const selected = [...options].sort((a, b) => score(b) - score(a))[0]!;
      if (plan && ['hero', 'route'].includes(selected.kind)) await page.waitForTimeout(1500);
      await buttons.nth(options.indexOf(selected)).click(); choices.push({ id: selected.id, kind: selected.kind });
      await mark(`选择 ${selected.text.trim()}`);
      evolved ||= selected.kind === 'hero'; routed ||= selected.kind === 'route'; awaken ||= selected.id === 'awaken';
      await writeFile(info.outputPath('natural-evolution-choices.json'), JSON.stringify({ hero, choices, evolved, routed, bonded, awaken, errors }, null, 2));
      continue;
    }
    const event = page.getByRole('dialog', { name: /万界游商|黄金宝箱/ });
    if (await event.isVisible()) {
      await expect(event.getByRole('button', { name: '购买火力' })).toHaveCount(0);
      await event.getByRole('button', { name: '离开' }).click({ timeout: 5000 }); await expect(event).toBeHidden(); continue;
    }
    const loot = page.getByRole('dialog', { name: '选择首领奖励' });
    if (await loot.isVisible()) { await loot.getByRole('button').first().click(); continue; }
    const chest = page.getByRole('dialog', { name: '领取宝箱奖励' });
    if (await chest.isVisible()) { await chest.locator('.level-option').first().click(); continue; }
    const guideButton = page.getByRole('button', { name: /本局路线/ });
    bonded ||= /[1-9]\d* 羁绊/.test(await guideButton.textContent() || '');
    if (!guided && evolved && routed && bonded && (!plan || choices.some(c => c.id === plan.route)) && (!complete || awaken) && step % 8 === 0) {
      await guideButton.click(); const guide = page.getByRole('dialog', { name: '战局已暂停' });
      await expect(guide.getByRole('heading', { name: '战局已暂停', exact: true })).toBeInViewport();
      await expect(guide.getByLabel('本局进化路线')).toBeVisible();
      const form = heroForms.find(form => choices.some(choice => choice.id === form.id))!;
      await expect(guide.getByRole('heading', { name: new RegExp(form.name) })).toBeVisible();
      for (const chosen of choices.filter(choice => choice.kind === 'route')) await expect(guide.getByLabel('本局进化路线')).toContainText(skillRoutes.find(route => route.id === chosen.id)!.name);
      await expect(guide.locator('.bond-list .active').first()).toBeVisible();
      if (plan) {
        const active = await guide.locator('.bond-list .active').allTextContents();
        if (!plan.bonds.some(name => active.some(text => text.includes(name)))) { await guide.getByRole('button', { name: '继续战斗' }).click(); continue; }
        expect(choices.some(choice => choice.id === plan.form)).toBe(true);
        await mark(`路线与羁绊确认：${active.join('；')}`);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const time = await page.getByLabel('本局时间').textContent(); await page.waitForTimeout(plan ? 3000 : 1100); expect(await page.getByLabel('本局时间').textContent()).toBe(time);
      await page.screenshot({ path: info.outputPath('evolution-guide.png') });
      if (plan) {
        const bond = guide.locator('.bond-list .active').filter({ hasText: new RegExp(plan.bonds.join('|')) }).first();
        await bond.scrollIntoViewIfNeeded();
        await expect(bond).toBeInViewport();
        await mark(`查看已激活羁绊：${await bond.textContent()}`);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: info.outputPath('evolution-bond.png') });
      }
      await guide.getByRole('button', { name: '继续战斗' }).click();
      await page.screenshot({ path: info.outputPath('evolution-battle.png') });
      guided = true;
      if (!complete) break;
    }
    const direction = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }][Math.floor(step / 2) % 4]!;
    if (touch) {
      const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 1000 }).catch(() => null); if (!box) continue;
      const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 }, moved = { ...origin, x: origin.x + direction.x * 32, y: origin.y + direction.y * 32 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
      for (const index of [0, 1, 2]) {
        const button = page.locator('.action-pad button').nth(index);
        if (!await button.isEnabled({ timeout: 100 }).catch(() => false)) continue;
        const rect = await button.boundingBox({ timeout: 300 }).catch(() => null); if (!rect) continue;
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
      }
      await page.waitForTimeout(850); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const key = direction.x === 1 ? 'd' : direction.x === -1 ? 'a' : direction.y === 1 ? 's' : 'w';
      await page.keyboard.down(key); for (const action of ['e', 'r', 'Space']) await page.keyboard.press(action);
      await page.waitForTimeout(850); await page.keyboard.up(key);
    }
  }
  await touch?.detach();
  await writeFile(info.outputPath('natural-evolution-choices.json'), JSON.stringify({ hero, choices, evolved, routed, bonded, awaken, errors }, null, 2));
  expect(evolved).toBe(true); expect(routed).toBe(true); expect(bonded).toBe(true);
  if (plan) { expect(guided).toBe(true); expect(choices.some(c => c.id === plan.form)).toBe(true); expect(choices.some(c => c.id === plan.route)).toBe(true); }
  if (complete) {
    expect(awaken).toBe(true); expect(guided).toBe(true);
    await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
    if (plan) await expect(result.getByRole('heading', { name: '黄巾巨将已击败' })).toBeVisible();
    await mark(`结算：${await result.textContent()}`);
    await expect(result.getByLabel('本局进化战果')).toContainText('下一局回到初始英雄');
    await page.screenshot({ path: info.outputPath('evolution-result.png') });
    if (plan) await page.waitForTimeout(3000);
    await result.getByRole('button', { name: '再次挑战本关' }).click();
  } else {
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('dialog', { name: '战局已暂停' }).getByRole('button', { name: '返回大厅' }).click();
    expect(await exportProgress(page)).toEqual(before);
    await page.getByRole('button', { name: '开启进化征途' }).click();
  }
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pause = page.getByRole('dialog', { name: '战局已暂停' });
  await expect(pause.getByLabel('本局进化路线')).toContainText('Lv.3 选择英雄进化');
  await mark('重新进入：回到初始英雄，局内进化重置');
  await pause.getByRole('button', { name: '返回大厅' }).click();
  if (complete) {
    const after = await exportProgress(page); expect(after.heroes[after.hero]!.mastery).toBeGreaterThan(before.heroes[before.hero]!.mastery);
    expect(after.build).toEqual(before.build); expect(after.stats.runs).toBe(before.stats.runs + 1);
    await page.reload(); expect(await exportProgress(page)).toEqual(after);
  }
  expect(errors).toEqual([]);
  await mark('验收完成：无浏览器错误');
}
