import { chromium, expect } from '../../apps/mobile-next/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const url = process.env.P2K_VIEWER_URL || 'http://127.0.0.1:4191/';
const root = resolve(import.meta.dirname, 'evidence/P2k');
const output = join(root, `viewer-${Date.now()}`);
await mkdir(output, { recursive: false });
const runs = JSON.parse(await readFile(join(root, 'recordings.json'), 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const checks = [];
try {
  for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844], ['narrow', 320, 844]]) {
    const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
    const page = await context.newPage(), errors = [], playback = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url);
    await expect(page.locator('.choice')).toHaveCount(runs.length);
    for (const [index, run] of runs.entries()) {
      await page.locator('.choice').nth(index).click();
      await expect(page.locator('#actual-outcome')).toContainText(run.actualOutcome);
      await expect(page.locator('#status')).toContainText(run.passed ? '目标通过' : '目标失败');
      await expect.poll(() => page.locator('video').evaluate(node => Number.isFinite(node.duration))).toBe(true);
      expect(await page.locator('video').evaluate(node => node.duration)).toBeCloseTo(run.duration, 1);
      const marker = run.marks.find(mark => mark.label === '实际结算');
      await page.locator('.timestamp').filter({ hasText: '实际结算' }).click();
      await expect.poll(() => page.locator('video').evaluate(node => node.currentTime)).toBeGreaterThan(marker.seconds);
      const at = await page.locator('video').evaluate(node => node.currentTime);
      await expect.poll(() => page.locator('video').evaluate(node => node.currentTime)).toBeGreaterThan(at + .1);
      await page.getByLabel('播放速度').selectOption('2');
      expect(await page.locator('video').evaluate(node => node.playbackRate)).toBe(2);
      await expect(page.locator('#download')).toHaveAttribute('href', run.video);
      const downloadEvent = page.waitForEvent('download');
      await page.locator('#download').click();
      const stream = await (await downloadEvent).createReadStream(), hash = createHash('sha256');
      for await (const chunk of stream) hash.update(chunk);
      expect(hash.digest('hex')).toBe(run.sha256);
      playback.push({ id: run.id, duration: run.duration, statusLabel: true, seek: true, playing: true, speed: true, downloadSha256: true });
    }
    await page.locator('.choice').first().click();
    await page.locator('h1').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    checks.push({ name, width, height, playback, noOverflow: true, errors });
    await context.close();
  }
  const result = { passed: true, checks };
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2));
  await writeFile(join(root, 'viewer-check.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ layouts: checks.length, playback: checks.reduce((n, check) => n + check.playback.length, 0), output }));
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ passed: false, checks, error: String(error) }, null, 2));
  throw error;
} finally { await browser.close(); }
