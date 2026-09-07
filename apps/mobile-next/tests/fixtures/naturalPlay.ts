import { expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

export async function reachEvent(page: Page, info: TestInfo) {
  const errors: string[] = [], timeline: { time: string | null; hp: string | null }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).click();
  const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
  await expect(skill).toBeVisible();
  const event = page.getByRole('dialog', { name: /万界游商|黄金宝箱/ });
  const level = page.getByRole('dialog', { name: '选择本局强化' });
  const touch = info.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  for (let step = 0; step < 100 && !await event.isVisible(); step++) {
    if (await level.isVisible()) { await level.locator('.level-option').first().click(); continue; }
    expect(await page.getByRole('dialog', { name: '本局生命耗尽' }).isVisible()).toBe(false);
    if (touch) {
      const box = await page.getByLabel('拖动摇杆移动').boundingBox();
      if (!box) continue;
      const point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2, radiusX: 5, radiusY: 5 };
      const moved = { ...point, x: point.x + [35, 0, -35, 0][step % 4]!, y: point.y + [0, 35, 0, -35][step % 4]! };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
      if (await skill.isEnabled({ timeout: 200 }).catch(() => false)) {
        const action = await skill.boundingBox();
        if (action) await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
      }
      await page.waitForTimeout(1000);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const key = ['d', 's', 'a', 'w'][step % 4]!;
      await page.keyboard.down(key); await page.keyboard.press('e'); await page.keyboard.press('r');
      await page.waitForTimeout(1000); await page.keyboard.up(key);
    }
    timeline.push({ time: await page.getByLabel('本局时间').textContent(), hp: await page.getByLabel('战斗状态').textContent() });
  }
  await expect(event).toBeVisible(); await expect(page.getByLabel('本局时间')).toHaveText('00:45');
  return { event, errors, timeline };
}

