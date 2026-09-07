import { expect, test } from '@playwright/test';
import oracle from '../../../tasks/mobile-modernization/baseline/growth-oracle.json' with { type: 'json' };

test('loads real WebGL, pauses, exits and remounts without duplicate canvases', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '赤焰战神' })).toBeVisible();
  await expect(page.getByLabel('出征属性')).toContainText(String(Math.round(oracle.cases[0]!.expected.player.atk)));
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await expect(page.getByRole('heading', { name: '设置与帮助' })).toBeVisible();
  await page.getByRole('button', { name: '返回大厅' }).click();
  for (let cycle = 0; cycle < 4; cycle++) {
    await page.getByRole('button', { name: '进入战场预览' }).click();
    await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
    await expect(page.locator('canvas')).toHaveCount(1);
    const canvas = page.locator('canvas');
    expect(await canvas.evaluate(node => !!((node as HTMLCanvasElement).getContext('webgl2') || (node as HTMLCanvasElement).getContext('webgl')))).toBe(true);
    await expect(page.getByLabel('本局时间')).not.toHaveText('00:00');
    await expect(page.getByLabel('战斗状态')).toContainText('生命 763 / 763');
    if (cycle === 0) {
      await page.screenshot({ path: testInfo.outputPath('battle.png') });
      const pad = await page.getByLabel('拖动摇杆移动').boundingBox();
      expect(pad).not.toBeNull();
      await page.mouse.move(pad!.x + 60, pad!.y + 60);
      await page.mouse.down();
      await page.mouse.move(pad!.x + 190, pad!.y - 100);
      await page.mouse.up();
    }
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const pausedTime = await page.getByLabel('本局时间').textContent();
    await page.waitForTimeout(1100);
    await expect(page.getByLabel('本局时间')).toHaveText(pausedTime!);
    await page.getByRole('button', { name: '继续战斗' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByLabel('本局时间')).not.toHaveText(pausedTime!);
    if (cycle === 0) {
      await page.keyboard.down('w');
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.up('w');
      await page.getByRole('button', { name: '继续战斗' }).click();
    }
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '返回大厅' }).click();
    await expect(page.getByRole('button', { name: '进入战场预览' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('lobby.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('surfaces missing assets and permits a clean return', async ({ page }) => {
  await page.route('**/art/hero-h001.svg', route => route.abort());
  await page.goto('./');
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByText('战场资源未能载入，请返回后重试。')).toBeVisible();
  await page.getByRole('button', { name: '返回大厅' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
});
