import { expect, test } from '@playwright/test';
import { reachEvent } from './fixtures/naturalPlay';

test('natural timed chest: claim at 90s, select gear once and resume', async ({ page }, info) => {
  test.setTimeout(260_000);
  const { event, errors, timeline } = await reachEvent(page, info);
  const merchant = await event.getByRole('button', { name: '购买回复' }).isVisible();
  await event.getByRole('button', { name: merchant ? '购买回复' : '打开黄金宝箱' }).click();
  await expect(event).not.toBeVisible();
  const reward = page.getByRole('button', { name: '01:30 宝箱 领取', exact: true });
  const level = page.getByRole('dialog', { name: '选择本局强化' });
  const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
  const touch = info.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  for (let step = 0; step < 120; step++) {
    if (await level.isVisible()) { await level.locator('.level-option').first().click(); continue; }
    if (await reward.isVisible() && await reward.isEnabled()) break;
    expect(await page.getByRole('dialog', { name: '本局生命耗尽' }).isVisible()).toBe(false);
    if (touch) {
      const box = await page.getByLabel('拖动摇杆移动').boundingBox();
      if (!box) continue;
      const point = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
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
  await expect(reward).toBeEnabled();
  await page.screenshot({ path: info.outputPath('natural-chest-ready.png') });
  await reward.click();
  const chest = page.getByRole('dialog', { name: '领取宝箱奖励' });
  await expect(chest).toBeVisible();
  const frozen = await page.getByLabel('本局时间').textContent();
  await page.waitForTimeout(1200); await expect(page.getByLabel('本局时间')).toHaveText(frozen!);
  await page.screenshot({ path: info.outputPath('natural-chest-choice.png') });
  await expect(chest.locator('.level-option')).toHaveCount(3);
  await chest.getByRole('button', { name: '随机装备掉落', exact: false }).click();
  await expect(chest).not.toBeVisible();
  await expect(page.getByRole('button', { name: '01:30 宝箱 已领取', exact: true })).toBeDisabled();
  await expect(page.getByLabel('宝箱反馈')).toContainText('暂存本局战利品');
  await expect(page.getByLabel('本局时间')).not.toHaveText(frozen!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('natural-chest-input', { body: JSON.stringify({ timeline, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
