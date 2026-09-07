import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import fresh from '../src/data/freshSave.json' with { type: 'json' };

test('natural save UI preserves files, switches slots and restores after reload', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await expect(page.getByLabel('当前存档')).toContainText('新征途 1');
  await page.getByRole('button', { name: '存档', exact: true }).click();
  await page.getByRole('button', { name: '创建新存档', exact: true }).click();
  await expect(page.getByLabel('存档列表')).toContainText('新征途 2');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出当前进度' }).click();
  const exported = await downloadEvent;
  const original = await readFile((await exported.path())!, 'utf8');
  expect(JSON.parse(original).schemaVersion).toBe(30);
  await page.getByLabel('导入存档文件').setInputFiles({ name: '备份副本.json', mimeType: 'application/json', buffer: Buffer.from(original) });
  await expect(page.getByRole('status')).toContainText('已导入');
  await expect(page.getByLabel('存档列表').getByRole('listitem')).toHaveCount(3);
  const backupEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出导入原件' }).click();
  expect(await readFile((await (await backupEvent).path())!, 'utf8')).toBe(original);
  await page.getByLabel('导入存档文件').setInputFiles({ name: '坏文件.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('alert')).toContainText('JSON');
  await expect(page.getByLabel('存档列表').getByRole('listitem')).toHaveCount(3);
  await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.getByLabel('当前存档')).toContainText('新征途 1');
  await page.reload();
  await expect(page.getByLabel('当前存档')).toContainText('新征途 1');
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('当前存档')).toContainText('新征途 1');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: '存档', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('saves.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('file UI retains unsupported content and explains why launch is unavailable', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: '存档', exact: true }).click();
  // Deliberately unsupported import fixture; no game runtime state is injected.
  const raw = '\uFEFF' + JSON.stringify({ ...fresh, difficulty: 'hard', retained: { content: '<b>original</b>' } }, null, 2);
  await page.getByLabel('导入存档文件').setInputFiles({ name: '困难存档.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await expect(page.getByRole('status')).toContainText('已导入');
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.getByText('当前预览仅支持普通难度，其他难度正在迁移。')).toBeVisible();
  await expect(page.getByRole('button', { name: '进入战场预览' })).toBeDisabled();
  await page.getByRole('button', { name: '存档', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出导入原件' }).click();
  expect(await readFile((await (await downloadEvent).path())!, 'utf8')).toBe(raw);
  await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
});

test('synthetic storage-denied environment shows retry and never starts an unsaved run', async ({ page }) => {
  // Fault injection is limited to browser storage permission, not gameplay acceptance.
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open;
    let failed = false;
    IDBFactory.prototype.open = function (...args) {
      if (!failed) { failed = true; throw new DOMException('Storage denied fixture', 'SecurityError'); }
      return open.apply(this, args);
    };
  });
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('无法读取本地存档');
  await expect(page.getByRole('button', { name: '进入战场预览' })).toBeDisabled();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: '重试读取存档' }).click();
  await expect(page.getByLabel('当前存档')).toContainText('新征途 1');
  await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
});
