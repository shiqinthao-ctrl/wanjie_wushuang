import { expect, test } from '@playwright/test';

test('follows visible map guidance to a one-use interaction', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [], route: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./'); await page.getByRole('button', { name: '进入战场预览' }).click();
  const target = page.getByLabel('交互目标'), button = page.getByRole('button', { name: '地图互动', exact: true });
  await expect(target).toContainText('火药桶'); await expect(button).toBeDisabled();
  const touch = testInfo.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const choices = page.getByRole('dialog', { name: '选择本局强化' });
  const vectors: Record<string, [number, number]> = { '东': [1, 0], '东南': [1, 1], '南': [0, 1], '西南': [-1, 1], '西': [-1, 0], '西北': [-1, -1], '北': [0, -1], '东北': [1, -1] };
  for (let step = 0; step < 100 && !await button.isEnabled(); step++) {
    if (await choices.isVisible()) await choices.locator('.level-option').first().click();
    const text = (await target.textContent())!; route.push(text);
    const direction = text.match(/·\s*(东南|东北|西南|西北|东|南|西|北)/)?.[1];
    if (!direction) break;
    const [dx, dy] = vectors[direction]!;
    if (touch) {
      const contact = { id: 1, x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...contact, x: contact.x + dx * 35, y: contact.y + dy * 35 }] });
      await page.waitForTimeout(220);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const keys = [dx < 0 ? 'a' : dx > 0 ? 'd' : '', dy < 0 ? 'w' : dy > 0 ? 's' : ''].filter(Boolean);
      for (const key of keys) await page.keyboard.down(key);
      await page.waitForTimeout(220);
      for (const key of keys) await page.keyboard.up(key);
    }
  }
  await expect(button).toBeEnabled(); await expect(target).toContainText('可互动');
  await page.screenshot({ path: testInfo.outputPath('map-near.png') });
  if (touch) await button.tap(); else await page.keyboard.press('f');
  await expect(page.getByLabel('地图互动进度')).toContainText('1 / 1');
  await expect(page.getByLabel('地图反馈')).toHaveText('火药桶 · 已引爆');
  await expect(button).toBeDisabled();
  if (!touch) await page.keyboard.press('f');
  await expect(page.getByLabel('地图互动进度')).toContainText('1 / 1');
  await page.screenshot({ path: testInfo.outputPath('map-used.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('visible-map-route', { body: JSON.stringify({ route, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
