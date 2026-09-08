import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { reachEvent } from './fixtures/naturalPlay';

async function expectCombatResumes(page: Page) {
  const clock = page.getByLabel('本局时间');
  const upgrade = page.getByRole('dialog', { name: '选择本局强化' });
  // XP collected before the encounter can leave a legitimate upgrade pending.
  for (let attempt = 0; attempt < 20 && await clock.textContent() === '00:45'; attempt++) {
    if (await upgrade.isVisible()) await upgrade.locator('.level-option').first().click({ timeout: 1000 });
    await page.waitForTimeout(250);
  }
  await expect(clock).not.toHaveText('00:45');
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
  await expectCombatResumes(page);
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
  await expectCombatResumes(page);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('dialog', { name: '战局已暂停' }).getByRole('button', { name: '返回大厅' }).click();
  await expect(page.getByLabel('当前存档')).toContainText(`金币 ${merchant ? 5820 : 6500}`);
  expect(errors).toEqual([]);
});
