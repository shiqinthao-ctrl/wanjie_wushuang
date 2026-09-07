import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

async function reachEvent(page: Page, info: TestInfo) {
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

test('natural first event: visible choice commits gold and resumes the same run', async ({ page }, info) => {
  test.setTimeout(170_000);
  const { event, errors, timeline } = await reachEvent(page, info);
  await page.screenshot({ path: info.outputPath('natural-event.png') });
  await page.waitForTimeout(1200); await expect(page.getByLabel('本局时间')).toHaveText('00:45');
  const merchant = await event.getByRole('button', { name: '购买回复' }).isVisible();
  await event.getByRole('button', { name: merchant ? '购买回复' : '换成金币' }).click();
  await expect(event).not.toBeVisible();
  await expect(page.getByLabel('事件反馈')).toContainText(merchant ? '生命恢复' : '500 金币');
  await expect(page.getByLabel('本局时间')).not.toHaveText('00:45');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('dialog', { name: '战局已暂停' }).getByRole('button', { name: '返回大厅' }).click();
  await expect(page.getByLabel('当前存档')).toContainText(`金币 ${merchant ? 5820 : 6500}`);
  await page.reload(); await expect(page.getByLabel('当前存档')).toContainText(`金币 ${merchant ? 5820 : 6500}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('natural-event-input', { body: JSON.stringify({ selected: merchant ? 'merchantHeal' : 'goldCash', timeline, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('synthetic storage abort: visible error pins the choice and retry saves once', async ({ page }, info) => {
  test.setTimeout(170_000);
  // Fault injection only at the storage boundary; gameplay still reaches 45s using actual inputs.
  await page.addInitScript(() => {
    const original = IDBDatabase.prototype.transaction;
    let failed = false;
    IDBDatabase.prototype.transaction = function(stores, mode, options) {
      const tx = original.call(this, stores, mode, options);
      if (!failed && mode === 'readwrite' && Array.from(tx.objectStoreNames).includes('receipts')) {
        failed = true; queueMicrotask(() => tx.abort());
      }
      return tx;
    };
  });
  const { event, errors } = await reachEvent(page, info);
  const merchant = await event.getByRole('button', { name: '购买回复' }).isVisible();
  const button = event.getByRole('button', { name: merchant ? '购买回复' : '换成金币' });
  await button.click();
  await expect(event.getByRole('alert')).toContainText('尚未确认保存');
  await expect(button).toBeDisabled();
  await expect(event.getByRole('button', { name: '离开', exact: false })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('event-save-error.png') });
  await page.waitForTimeout(1100); await expect(page.getByLabel('本局时间')).toHaveText('00:45');
  await event.getByRole('button', { name: '重试原选择' }).click();
  await expect(event).not.toBeVisible();
  await expect(page.getByLabel('本局时间')).not.toHaveText('00:45');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('dialog', { name: '战局已暂停' }).getByRole('button', { name: '返回大厅' }).click();
  await expect(page.getByLabel('当前存档')).toContainText(`金币 ${merchant ? 5820 : 6500}`);
  expect(errors).toEqual([]);
});
