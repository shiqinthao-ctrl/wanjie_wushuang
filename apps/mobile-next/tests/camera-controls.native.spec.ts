import { expect, test } from '@playwright/test';
import { captureHero } from './fixtures/cameraVision';

test('camera survives simultaneous touch, cancellation and viewport changes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('./');
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  if (info.project.name !== 'desktop') {
    const touch = await page.context().newCDPSession(page);
    const pad = await page.getByLabel('拖动摇杆移动').boundingBox();
    const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
    const button = await skill.boundingBox();
    const finger = { x: pad!.x + pad!.width / 2, y: pad!.y + pad!.height / 2, id: 1 };
    try {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] });
      finger.x += 70; // Leave the pad while retaining pointer capture.
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger, { x: button!.x + button!.width / 2, y: button!.y + button!.height / 2, id: 2 }] });
      await expect(skill).toBeDisabled();
      await expect(page.locator('.pad-thumb')).toHaveAttribute('style', /translate\(42px, 0px\)/);
      await page.screenshot({ path: info.outputPath('move-and-skill.png') });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await expect(page.locator('.pad-thumb')).toHaveAttribute('style', /translate\(0px, 0px\)/);
    } finally {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
      await touch.detach();
    }
  }
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const time = await page.getByLabel('本局时间').innerText();
  for (const viewport of [{ width: 390, height: 780 }, { width: 844, height: 390 }, { width: 320, height: 844 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(async () => {
      const box = await page.locator('canvas').boundingBox();
      expect(box?.width).toBe(viewport.width);
      expect(box?.height).toBe(viewport.height);
    }).toPass();
    await expect(page.getByLabel('本局时间')).toHaveText(time);
  }
  const viewport = info.project.use.viewport!;
  await page.setViewportSize(viewport);
  await page.getByRole('button', { name: '继续战斗' }).click();
  await expect(async () => {
    const { hero } = await captureHero(page);
    expect(hero).not.toBeNull();
    expect(Math.abs(hero!.x - viewport.width / 2)).toBeLessThan(6);
    expect(Math.abs(hero!.y - viewport.height / 2)).toBeLessThan(6);
  }).toPass();
  await page.screenshot({ path: info.outputPath('resumed.png') });
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '返回大厅', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});
