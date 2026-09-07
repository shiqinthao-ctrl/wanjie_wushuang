import { expect, test } from '@playwright/test';
import { reachEvent } from './fixtures/naturalPlay';

test('natural first Boss: reach 270s, see health and an attack cue, pause and resume', async ({ page }, info) => {
  test.setTimeout(650_000);
  const { event, errors, timeline } = await reachEvent(page, info);
  const level = page.getByRole('dialog', { name: '选择本局强化' });
  const chest = page.getByRole('dialog', { name: '领取宝箱奖励' });
  const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
  const ultimate = page.getByRole('button', { name: '赤龙降世', exact: true });
  const touch = info.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  let castSeen = false;
  try {
    for (let step = 0; step < 520; step++) {
      if (await event.isVisible()) {
        const merchant = await event.getByRole('button', { name: '购买回复' }).isVisible();
        await event.getByRole('button', { name: merchant ? '购买回复' : '打开黄金宝箱' }).click({ timeout: 5000 });
        await expect(event).toBeHidden(); continue;
      }
      if (await level.isVisible()) { await level.locator('.level-option').first().click(); continue; }
      if (await chest.isVisible()) { await chest.locator('.level-option').first().click(); continue; }
      expect(await page.getByRole('dialog', { name: '本局生命耗尽' }).isVisible()).toBe(false);
      const reward = page.getByRole('button', { name: /宝箱 领取$/ }).filter({ hasNotText: '已领取' }).first();
      if (await reward.isVisible() && await reward.isEnabled()) { await reward.click(); continue; }
      if (await page.getByLabel('首领招式').isVisible() && /闪避|红圈|侧后/.test(await page.getByLabel('首领招式').textContent() || '')) { castSeen = true; break; }
      if (touch) {
        const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
        const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const moved = { ...origin, x: origin.x + [35, 0, -35, 0][step % 4]!, y: origin.y + [0, 35, 0, -35][step % 4]! };
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
        for (const button of [skill, ultimate]) if (await button.isEnabled({ timeout: 200 }).catch(() => false)) {
          const action = await button.boundingBox({ timeout: 500 }).catch(() => null);
          if (action) {
            await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
            await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
          }
        }
        await page.waitForTimeout(1000); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        const key = ['d', 's', 'a', 'w'][step % 4]!;
        await page.keyboard.down(key); await page.keyboard.press('e'); await page.keyboard.press('r');
        await page.waitForTimeout(1000); await page.keyboard.up(key);
      }
      if (step % 5 === 0) timeline.push({ time: await page.getByLabel('本局时间').textContent(), hp: await page.getByLabel('战斗状态').textContent() });
    }
    expect(castSeen).toBe(true); await expect(page.getByLabel('首领状态')).toContainText('黄巾巨将');
    const hp = await page.getByLabel('首领生命').getAttribute('value'); expect(Number(hp)).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath('natural-boss-attack.png') });
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    const frozen = await page.getByLabel('本局时间').textContent();
    await page.waitForTimeout(1100); await expect(page.getByLabel('本局时间')).toHaveText(frozen!);
    await page.getByRole('button', { name: '继续战斗' }).click();
    await expect(page.getByLabel('本局时间')).not.toHaveText(frozen!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally { await info.attach('natural-boss-input', { body: JSON.stringify({ timeline, errors, castSeen }, null, 2), contentType: 'application/json' }); }
});
