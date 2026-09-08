import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import fresh from '../src/data/freshSave.json' with { type: 'json' };
import type { GameSave } from '../src/core/saveTypes';

// Full-stage runs retain explicit screenshots and the input timeline. Pixel targeting
// would otherwise embed every screenshot as an evaluate argument in an enormous trace.
test.use({ trace: 'off' });

// Natural acceptance: only visible controls and real keyboard/touch input.
// Export reads persistent results through the player-facing save panel.
async function exportSave(page: Page): Promise<GameSave> {
  await page.getByRole('button', { name: '存档', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出当前进度' }).click();
  const stream = await (await pending).createReadStream();
  let raw = ''; for await (const chunk of stream) raw += chunk.toString();
  await page.getByRole('button', { name: '返回大厅' }).click();
  return JSON.parse(raw);
}

// Read rendered screenshot pixels only, never Phaser objects or core state.
async function visibleActors(page: Page) {
  const screenshot = await page.screenshot({ scale: 'css' });
  return page.evaluate(async png => {
    const image = new Image(); image.src = `data:image/png;base64,${png}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const find = (color: number[], offsetY: number) => {
      let x = 0, y = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (color.every((value, channel) => Math.abs(pixels[i + channel]! - value) < 4)) {
          x += (i / 4) % canvas.width; y += Math.floor(i / 4 / canvas.width); count++;
        }
      }
      return count >= 6 ? { x: x / count, y: y / count + offsetY } : undefined;
    };
    return { hero: find([213, 155, 114], 36), boss: find([181, 121, 85], 35) };
  }, screenshot.toString('base64'));
}

async function finishNaturally(page: Page, info: TestInfo, outcome: 'victory' | 'defeat' | 'timeout', imported?: GameSave) {
  const win = outcome === 'victory';
  const baseline: GameSave = imported || fresh;
  const profile = imported ? 'imported-low-growth' : 'fresh-baseline';
  const contactBoss = !imported && outcome === 'defeat' && process.env.FRESH_DEFEAT_STRATEGY === 'boss-contact';
  const errors: string[] = [], timeline: unknown[] = [];
  const started = Date.now();
  let observed: unknown;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  expect(await exportSave(page)).toEqual(fresh);
  if (imported) {
    // Supplemental fixture imported through the real file UI; never runtime injection.
    const raw = JSON.stringify(imported, null, 2);
    await writeFile(info.outputPath('synthetic-low-growth-input.json'), raw);
    await page.getByRole('button', { name: '存档', exact: true }).click();
    const importFile = page.getByLabel('导入存档文件');
    await expect(importFile).toBeEnabled();
    await importFile.setInputFiles({ name: '低成长分支测试.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
    await expect(page.getByRole('status')).toContainText('已导入');
    const original = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出导入原件' }).click();
    expect(await readFile((await (await original).path())!, 'utf8')).toBe(raw);
    await page.getByRole('button', { name: '返回大厅', exact: true }).click();
    expect(await exportSave(page)).toEqual(imported);
  }
  await page.getByRole('button', { name: '进入战场预览' }).click();
  await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
  const event = page.getByRole('dialog', { name: /万界游商|黄金宝箱/ });
  const level = page.getByRole('dialog', { name: '选择本局强化' });
  const chest = page.getByRole('dialog', { name: '领取宝箱奖励' });
  const loot = page.getByRole('dialog', { name: '选择首领奖励' });
  const result = page.getByRole('dialog', { name: /本局生命耗尽|黄巾巨将已击败|首战时限已到/ });
  const touch = info.project.name === 'desktop' ? undefined : await page.context().newCDPSession(page);
  let lootSeen = false, eventCost = 0;
  let lastDirection = { x: 1, y: -1 }, missingBoss = 0, trackedFrames = 0;
  try {
    // Pixel-guided movement uses shorter input intervals. A step count truncated
    // these runs before the six-minute objective; bound real wall time instead.
    const deadline = Date.now() + 620_000;
    for (let step = 0; Date.now() < deadline && !await result.isVisible(); step++) {
      if (await event.isVisible()) {
        const merchant = await event.getByRole('button', { name: '购买回复' }).isVisible();
        const name = !win ? '离开' : merchant ? '购买回复' : '打开黄金宝箱';
        await event.getByRole('button', { name }).click({ timeout: 5000 });
        if (win && merchant) eventCost += 180;
        await expect(event).toBeHidden(); continue;
      }
      if (await level.isVisible()) { await level.locator('.level-option').first().click(); continue; }
      if (await chest.isVisible()) { await chest.locator('.level-option').first().click(); continue; }
      if (await loot.isVisible()) { lootSeen = true; await loot.getByRole('button').first().click(); continue; }
      const reward = page.getByRole('button', { name: /宝箱 领取$/ }).first();
      if (win && await reward.isVisible() && await reward.isEnabled()) { await reward.click({ timeout: 1500 }); continue; }
      const bossPresent = await page.getByLabel('首领状态').isVisible();
      let direction = win ? { x: [1, 0, -1, 0][step % 4]!, y: [0, 1, 0, -1][step % 4]! } : outcome === 'timeout' ? { x: 0, y: 0 } : { x: -1, y: -1 };
      let duration = 1000;
      if ((win || contactBoss) && bossPresent) {
        const actors = await visibleActors(page);
        duration = 180;
        if (actors.hero && actors.boss) {
          const dx = actors.boss.x - actors.hero.x, dy = actors.boss.y - actors.hero.y, distance = Math.hypot(dx, dy);
          const stopDistance = contactBoss ? 15 : 65;
          direction = distance < stopDistance ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
          if (distance >= stopDistance) lastDirection = direction;
          trackedFrames++; missingBoss = 0;
        } else {
          // A charge can leave the viewport on the opposite side of the hero.
          missingBoss++;
          direction = { x: -lastDirection.x, y: -lastDirection.y };
          if (missingBoss > 8) direction = lastDirection;
          duration = 300;
        }
        if (trackedFrames === 1) await page.screenshot({ path: info.outputPath('natural-boss-tracked.png') });
      }
      if (touch) {
        const box = await page.getByLabel('拖动摇杆移动').boundingBox({ timeout: 500 }).catch(() => null); if (!box) continue;
        const origin = { id: 1, x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const moved = { ...origin, x: origin.x + direction.x * 35, y: origin.y + direction.y * 35 };
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [moved] });
        for (const name of win ? ['炎龙斩', '赤龙降世', '地图互动'] : []) {
          const button = page.getByRole('button', { name, exact: true });
          if (!await button.isEnabled({ timeout: 200 }).catch(() => false)) continue;
          const action = await button.boundingBox({ timeout: 500 }).catch(() => null); if (!action) continue;
          await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [moved, { id: 2, x: action.x + action.width / 2, y: action.y + action.height / 2 }] });
          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [moved] });
        }
        await page.waitForTimeout(duration); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        const keys = [direction.x > .25 ? 'd' : direction.x < -.25 ? 'a' : '', direction.y > .25 ? 's' : direction.y < -.25 ? 'w' : ''].filter(Boolean);
        for (const key of keys) await page.keyboard.down(key);
        if (win) { await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('f'); }
        await page.waitForTimeout(duration); for (const key of keys) await page.keyboard.up(key);
      }
      if (step % 10 === 0) timeline.push({ seconds: (Date.now() - started) / 1000, time: await page.getByLabel('本局时间').textContent(), hp: await page.getByLabel('战斗状态').textContent(), boss: await page.getByLabel('首领生命').getAttribute('value', { timeout: 100 }).catch(() => null), direction });
    }
    const title = win ? '黄巾巨将已击败' : outcome === 'timeout' ? '首战时限已到' : '本局生命耗尽';
    await expect(result).toBeVisible();
    const actualTitle = await result.getByRole('heading', { level: 2 }).textContent();
    await expect(result.getByText('战果已保存', { exact: true })).toBeVisible();
    const stars = await result.getByLabel('本局星级').textContent();
    const actualWin = actualTitle === '黄巾巨将已击败';
    if (actualWin) expect(lootSeen).toBe(true);
    expect(stars).toMatch(actualWin ? /★{2,3}/ : /^☆☆☆$/);
    const gold = Number((await result.locator('.reward-grid dd').first().textContent())!.replace('+', ''));
    observed = { title: actualTitle, stars, gold, seconds: (Date.now() - started) / 1000, text: await result.textContent(), persistenceVerified: false };
    const box = await result.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
    expect(await result.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${imported ? 'imported-low-growth' : 'natural'}-${outcome}-result.png`) });
    await result.getByRole('button', { name: '再次挑战本关' }).click();
    await expect(result).toBeHidden(); await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByLabel('本局时间')).toHaveText(/00:0\d/);
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '返回大厅', exact: true }).click();
    await page.reload(); await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled();
    const save = await exportSave(page);
    expect(save.gold).toBe(baseline.gold - eventCost + gold);
    expect(save.stats.runs).toBe(baseline.stats.runs + 1);
    expect(save.modeStats.story!.runs).toBe(baseline.modeStats.story!.runs + 1);
    expect(save.chapters.ST001!.stars['ST001-01']).toBe((stars!.match(/★/g) || []).length);
    expect(save.accountXp + save.accountLv * 10000).toBeGreaterThan(baseline.accountXp + baseline.accountLv * 10000);
    if (actualWin) expect(save.inventory.gearInstances.filter(drop => drop.source === 'boss').length).toBeGreaterThanOrEqual(2);
    await page.reload(); expect(await exportSave(page)).toEqual(save);
    await writeFile(info.outputPath('saved-result.json'), JSON.stringify(save, null, 2));
    observed = { ...observed as object, persistenceVerified: true, replayVerified: true, completedSeconds: (Date.now() - started) / 1000 };
    if (imported) {
      await page.getByRole('button', { name: '存档', exact: true }).click();
      const original = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出导入原件' }).click();
      expect(JSON.parse(await readFile((await (await original).path())!, 'utf8'))).toEqual(imported);
      await page.getByRole('button', { name: '使用 新征途 1', exact: true }).click();
      await page.getByRole('button', { name: '返回大厅', exact: true }).click();
      expect(await exportSave(page)).toEqual(fresh);
    }
    expect(errors).toEqual([]);
    // Preserve the requested outcome gate, after collecting the actual saved result.
    expect(actualTitle).toBe(title);
    expect(stars).toMatch(win ? /★{2,3}/ : /^☆☆☆$/);
  } finally {
    const path = info.outputPath('natural-settlement-input.json');
    await writeFile(path, JSON.stringify({ profile, outcome, strategy: contactBoss ? 'boss-contact' : win ? 'victory-chase' : outcome === 'timeout' ? 'stationary' : 'corner', observed, timeline, errors, lootSeen, eventCost, trackedFrames }, null, 2));
    await info.attach('natural-settlement-input', { path, contentType: 'application/json' });
  }
}
test('natural complete first-stage victory, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'victory'); });
test('natural corner-contact defeat, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'defeat'); });
test('natural first-stage timeout, zero stars, save reload and replay', async ({ page }, info) => { test.setTimeout(680_000); await finishNaturally(page, info, 'timeout'); });

test('supplemental imported low-growth save: natural-input HP defeat, reload and replay', async ({ page }, info) => {
  test.setTimeout(680_000);
  const imported: GameSave = structuredClone(fresh);
  imported.heroes.H001!.level = 1; imported.heroes.H001!.mastery = 0;
  imported.equipInst = {}; imported.runes = []; imported.build = { active: [], passive: [] };
  await finishNaturally(page, info, 'defeat', imported);
});
