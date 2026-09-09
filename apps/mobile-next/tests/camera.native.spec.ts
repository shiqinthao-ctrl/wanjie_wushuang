import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { captureHero } from './fixtures/cameraVision';

async function dismissChoice(page: Page) {
  const level = page.getByRole('dialog', { name: '选择本局强化' });
  const event = page.getByRole('dialog', { name: /万界游商|黄金宝箱/ });
  if (await level.isVisible()) { await level.locator('.level-option').first().click(); return true; }
  if (await event.isVisible()) { await event.getByRole('button', { name: '离开' }).click(); return true; }
  return false;
}

for (const [corner, dx, dy] of [
  ['north-west', -1, -1], ['south-east', 1, 1],
  ['north-east', 1, -1], ['south-west', -1, 1],
] as const) {
  test(`portrait hero stays clear at ${corner} edge with natural touch`, async ({ page }, info) => {
    test.skip(info.project.name === 'desktop', 'Portrait camera contract; desktop has separate lifecycle coverage');
    test.setTimeout(120_000);
    const errors: string[] = [], timeline: unknown[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('./');
    await page.getByRole('button', { name: '进入战场预览' }).click();
    await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
    const touch = await page.context().newCDPSession(page);
    try {
      for (;;) {
        if (await dismissChoice(page)) continue;
        const time = (await page.getByLabel('本局时间').innerText()).split(':').map(Number);
        const seconds = time[0]! * 60 + time[1]!;
        if (seconds >= 32) break;
        const box = await page.getByLabel('拖动摇杆移动').boundingBox();
        expect(box).not.toBeNull();
        const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, id: 1 };
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...center, x: center.x + dx * 40, y: center.y + dy * 40 }] });
        await page.waitForTimeout(1000);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        timeline.push({ seconds, dx, dy });
      }
      while (await dismissChoice(page)) { /* Resume pending visible choices. */ }
      // An XP pickup may open a choice between releasing the stick and capture.
      // Resolve that visible modal, then inspect and save the very same frame.
      let capture: Awaited<ReturnType<typeof captureHero>>;
      await expect(async () => {
        while (await dismissChoice(page)) { /* Choose through the normal UI. */ }
        capture = await captureHero(page);
        expect(capture.hero).not.toBeNull();
      }).toPass({ timeout: 5000, intervals: [100, 250] });
      await writeFile(info.outputPath('edge.png'), capture!.png);
      const { hero, boundary } = capture!, viewport = page.viewportSize()!;
      await writeFile(info.outputPath('hero.json'), JSON.stringify({ hero, boundary, viewport }, null, 2));
      expect(hero, 'Hero must remain visible at the world edge').not.toBeNull();
      expect(Math.abs(hero!.x - viewport.width / 2)).toBeLessThan(6);
      expect(Math.abs(hero!.y - viewport.height / 2)).toBeLessThan(6);
      expect(boundary, 'Reach the actual world corner through movement').not.toBeNull();
      expect(Math.abs(boundary!.x - (viewport.width / 2 + dx * 18))).toBeLessThan(3);
      expect(Math.abs(boundary!.y - (viewport.height / 2 + dy * 18))).toBeLessThan(3);
      for (const selector of ['.battle-hud', '.combat-vitals', '.map-route', '.timed-rewards', '.control-zone']) {
        const box = await page.locator(selector).boundingBox();
        if (!box) continue;
        const overlaps = hero!.x + 33 > box.x && hero!.x - 33 < box.x + box.width &&
          hero!.y + 13 > box.y && hero!.y - 68 < box.y + box.height;
        expect(overlaps, `Hero sprite intersects ${selector}`).toBe(false);
      }
      await expect(async () => {
        if (await page.getByRole('dialog', { name: '战局已暂停' }).isVisible()) return;
        await dismissChoice(page);
        await page.getByRole('button', { name: '暂停', exact: true }).click({ timeout: 500 });
        await expect(page.getByRole('dialog', { name: '战局已暂停' })).toBeVisible();
      }).toPass({ timeout: 5000, intervals: [100, 250] });
      await page.getByRole('button', { name: '返回大厅', exact: true }).click();
      await expect(page.locator('canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally {
      await writeFile(info.outputPath('timeline.json'), JSON.stringify(timeline, null, 2));
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }).catch(() => {});
      await touch.detach().catch(() => {});
    }
  });
}
