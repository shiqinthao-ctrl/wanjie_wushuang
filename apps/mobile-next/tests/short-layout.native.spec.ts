import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { captureHero } from './fixtures/cameraVision';

async function checkLayout(page: Page, info: TestInfo, label: string) {
  const selectors = ['.battle-hud', '.stage-note', '.boss-hud', '.combat-vitals', '.combat-record',
    '.map-route', '.timed-rewards', '.move-pad', '.action-pad'];
  const boxes = await page.evaluate(selectors => selectors.flatMap(selector => {
    const node = document.querySelector(selector);
    if (!node) return [];
    const rect = node.getBoundingClientRect();
    return rect.width && rect.height ? [{ selector, x: rect.x, y: rect.y, width: rect.width, height: rect.height }] : [];
  }), selectors);
  const frame = await captureHero(page);
  await writeFile(info.outputPath(`${label}.png`), frame.png);
  await writeFile(info.outputPath(`${label}.json`), JSON.stringify({ boxes, hero: frame.hero }, null, 2));
  const viewport = page.viewportSize()!;
  for (const box of boxes) {
    expect.soft(box.x, box.selector).toBeGreaterThanOrEqual(0);
    expect.soft(box.y, box.selector).toBeGreaterThanOrEqual(0);
    expect.soft(box.x + box.width, box.selector).toBeLessThanOrEqual(viewport.width);
    expect.soft(box.y + box.height, box.selector).toBeLessThanOrEqual(viewport.height);
  }
  for (let i = 0; i < boxes.length; i++) for (const other of boxes.slice(i + 1)) {
    const box = boxes[i]!;
    const area = Math.max(0, Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x)) *
      Math.max(0, Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y));
    expect.soft(area, `${label}: ${box.selector} overlaps ${other.selector}`).toBe(0);
  }
  expect(frame.hero).not.toBeNull();
  for (const box of boxes) {
    const hero = frame.hero!;
    const overlap = hero.x + 33 > box.x && hero.x - 33 < box.x + box.width &&
      hero.y + 13 > box.y && hero.y - 68 < box.y + box.height;
    expect.soft(overlap, `${label}: hero under ${box.selector}`).toBe(false);
  }
  for (const button of await page.locator('.battle-hud button, .combat-record button, .action-pad button, .timed-rewards button').all()) {
    const box = await button.boundingBox();
    expect.soft(box!.height, await button.innerText()).toBeGreaterThanOrEqual(44);
    expect.soft(box!.width).toBeGreaterThanOrEqual(44);
  }
}

test('short portrait HUD keeps hero and controls clear', async ({ page }, info) => {
  test.skip(['desktop', 'phone', 'narrow'].includes(info.project.name), 'Short portrait slice');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  await expect(page.getByLabel('本局时间')).not.toHaveText('00:00');
  await checkLayout(page, info, 'classic');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  expect(errors).toEqual([]);
});

test('short portrait evolution supports touch, upgrades, safe areas and height changes', async ({ page }, info) => {
  test.skip(['desktop', 'phone', 'narrow'].includes(info.project.name), 'Short portrait slice');
  test.setTimeout(130_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('./');
  await page.getByRole('button', { name: '进化征途', exact: true }).click();
  await page.getByRole('button', { name: '开启进化征途' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 24, bottom: 34, left: 0, right: 0 } });
    await expect(page.locator('.battle-overview')).toHaveCSS('padding-top', '28px');
    await checkLayout(page, info, 'evolution-safe-area');
    const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
    const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
    const box = (await skill.boundingBox())!;
    const finger = { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2, id: 1 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
    finger.x += 70;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger, { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 2 }] });
    await expect(skill).toBeDisabled();
    await expect(page.locator('.pad-thumb')).toHaveAttribute('style', /translate\(42px, 0px\)/);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: info.outputPath('two-finger.png') });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(page.locator('.pad-thumb')).toHaveAttribute('style', /translate\(0px, 0px\)/);
    const choice = page.getByRole('dialog', { name: '选择本局强化' });
    for (let step = 0; step < 100 && !await choice.isVisible(); step++) {
      // Small out-and-back movements collect naturally dropped experience.
      const point = { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2, id: 1 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      point.x += step % 2 ? -24 : 24;
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      await page.waitForTimeout(700);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const event = page.getByRole('dialog', { name: /万界游商|黄金宝箱/ });
      if (await event.isVisible()) await event.getByRole('button', { name: '离开', exact: true }).click();
    }
    await expect(choice).toBeVisible();
    const option = choice.locator('.level-option').last();
    await option.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath('natural-upgrade.png') });
    await option.click();
    await expect(choice).toBeHidden();
    await page.getByRole('button', { name: /本局路线/ }).click();
    const time = await page.getByLabel('本局时间').innerText();
    for (const height of [568, 640, 740, 780, info.project.use.viewport!.height]) {
      await page.setViewportSize({ width: info.project.use.viewport!.width, height });
      await expect(page.locator('canvas')).toHaveCount(1);
      await expect(page.getByLabel('本局时间')).toHaveText(time);
    }
    const pause = page.getByRole('dialog', { name: '战局已暂停' });
    await expect(pause.getByLabel('本局进化路线')).toBeVisible();
    await pause.getByRole('button', { name: '继续战斗' }).click();
    await checkLayout(page, info, 'resumed');
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await pause.getByRole('button', { name: '返回大厅' }).click();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
    await touch.detach().catch(() => {});
  }
});

test('synthetic crowded HUD keeps boss, notices and rewards inside short safe areas', async ({ page }, info) => {
  test.skip(['desktop', 'phone', 'narrow'].includes(info.project.name), 'Short portrait slice');
  await page.goto('./');
  await page.getByRole('button', { name: '进化征途', exact: true }).click();
  await page.getByRole('button', { name: '开启进化征途' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 24, bottom: 34, left: 0, right: 0 } });
    // Layout stress only: DOM text/markup, never game state, saves or time.
    await page.evaluate(() => {
      const stage = document.querySelector('.stage-note')!;
      const boss = document.createElement('aside'); boss.className = 'boss-hud';
      boss.innerHTML = '<strong>黄巾巨将 <small>狂暴</small></strong><progress aria-label="首领生命" value="60" max="100"></progress><span>蓄力横扫 · 即将出招</span>';
      stage.replaceWith(boss);
      document.querySelector('.battle-hud strong')!.textContent = '赤焰战神 · 觉醒';
      document.querySelector('.map-route')!.insertAdjacentHTML('beforeend', '<p class="map-notice">已压制地脉，附近敌人暂时受到削弱。</p><p class="map-notice">已获得装备，战斗结束后自动保存。</p>');
      document.querySelector('.timed-rewards')!.insertAdjacentHTML('afterbegin', '<p>获得术式进化奖励，本局装备将在战斗结束后入库。</p><p>冰霜新星 · 雷电环绕 · 方盾近卫</p>');
    });
    await checkLayout(page, info, 'synthetic-crowded');
    await page.locator('.map-route').focus();
    await page.keyboard.press('End');
    await expect.poll(() => page.locator('.map-route').evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Home');
    await expect.poll(() => page.locator('.map-route').evaluate(node => node.scrollTop)).toBe(0);
    const map = (await page.locator('.map-route').boundingBox())!;
    const finger = { x: map.x + map.width / 2, y: map.y + map.height - 5, id: 1 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
    for (let step = 0; step < 5; step++) {
      finger.y -= 10;
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.locator('.map-route').evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  } finally { await session.detach().catch(() => {}); }
});
