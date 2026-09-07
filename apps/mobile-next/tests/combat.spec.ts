import { expect, test } from '@playwright/test';

test('natural combat reaches a choice and resumes the same run', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  const timeline: { time: string | null; vitals: string | null; kills: string | null }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await page.getByRole('button', { name: '进入战场预览' }).click();
  const skill = page.getByRole('button', { name: '炎龙斩', exact: true });
  const dodge = page.getByRole('button', { name: '闪避', exact: true });
  const choice = page.getByRole('dialog', { name: '选择本局强化' });
  await expect(skill).toBeEnabled();
  await skill.click(); await expect(skill).toBeDisabled();
  await dodge.click(); await expect(dodge).toBeDisabled();
  const record = async () => {
    timeline.push({ time: await page.getByLabel('本局时间').textContent(), vitals: await page.getByLabel('战斗状态').textContent(), kills: await page.getByLabel('本局击杀').textContent() });
  };
  const pad = (await page.getByLabel('拖动摇杆移动').boundingBox())!;
  const action = (await skill.boundingBox())!;
  // Input protocol sends actual touch contacts; no game-state writes or clock changes.
  const touch = testInfo.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  for (let step = 0; step < 60 && !await choice.isVisible(); step++) {
    if (touch) {
      const direction = step % 4;
      const x = pad.x + pad.width / 2, y = pad.y + pad.height / 2;
      const contact = { id: 1, x, y, radiusX: 5, radiusY: 5 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [contact] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...contact, x: x + [35, 0, -35, 0][direction]!, y: y + [0, 35, 0, -35][direction]! }] });
      if (await skill.isEnabled()) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...contact, x: x + [35, 0, -35, 0][direction]!, y: y + [0, 35, 0, -35][direction]! }, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
      }
      await page.waitForTimeout(1300);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      const key = ['d', 's', 'a', 'w'][step % 4]!;
      await page.keyboard.down(key);
      if (await skill.isEnabled()) await page.keyboard.press('e');
      await page.waitForTimeout(1300); await page.keyboard.up(key);
    }
    await record();
    if ([4, 9, 14].includes(step)) await page.screenshot({ path: testInfo.outputPath(`combat-${step}.png`) });
    expect(await page.getByRole('dialog', { name: '本局生命耗尽' }).isVisible()).toBe(false);
  }
  await expect(choice).toBeVisible();
  await expect(page.getByLabel('本局击杀')).not.toHaveText('击破 0');
  await expect(choice.locator('.level-option')).toHaveCount(3);
  const time = await page.getByLabel('本局时间').textContent();
  await page.screenshot({ path: testInfo.outputPath('natural-choice.png') });
  await page.waitForTimeout(1100); await expect(page.getByLabel('本局时间')).toHaveText(time!);
  const selected = await choice.locator('.level-option').first().textContent();
  await choice.locator('.level-option').first().click();
  await expect(choice).not.toBeVisible();
  await expect(page.getByLabel('战斗状态')).toContainText('Lv.2');
  await expect(page.getByLabel('本局时间')).not.toHaveText(time!);
  await expect(skill).toBeVisible();
  await record();
  await page.screenshot({ path: testInfo.outputPath('natural-resumed.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach('natural-input-evidence', { body: JSON.stringify({ selected, timeline, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
