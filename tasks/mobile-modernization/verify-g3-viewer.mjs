import { chromium, expect } from '../../apps/mobile-next/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

// Serve evidence/G3 on this loopback URL before running the viewer check.
const url = process.env.G3_VIEWER_URL || 'http://127.0.0.1:4190/';
const root = resolve(import.meta.dirname, 'evidence/G3');
const output = join(root, `viewer-${Date.now()}`);
await mkdir(output, { recursive: true });
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const [index, run] of runs.entries()) {
      await page.locator('.choice').nth(index).click();
      await expect.poll(() => page.locator('video').evaluate(node => Number.isFinite(node.duration))).toBe(true);
      expect(await page.locator('video').evaluate(node => node.duration)).toBeCloseTo(run.duration, 1);
      const seek = run.marks.find(mark => mark.label === '选择技能路线');
      await page.locator('.timestamp').filter({ hasText: '选择技能路线' }).click();
      await expect.poll(() => page.locator('video').evaluate(node => node.currentTime)).toBeGreaterThan(seek.seconds);
      const at = await page.locator('video').evaluate(node => node.currentTime);
      await expect.poll(() => page.locator('video').evaluate(node => node.currentTime)).toBeGreaterThan(at + .2);
      await page.getByLabel('播放速度').selectOption('2');
      expect(await page.locator('video').evaluate(node => node.playbackRate)).toBe(2);
      await expect(page.locator('#download')).toHaveAttribute('href', run.video);
      playback.push({ id: run.id, duration: run.duration, seek: true, playing: true, speed: true });
    }
    await page.locator('.choice').first().click();
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#download').click();
    const download = await downloadEvent, stream = await download.createReadStream(), hash = createHash('sha256');
    for await (const chunk of stream) hash.update(chunk);
    expect(hash.digest('hex')).toBe(runs[0].sha256);
    await page.locator('h1').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    checks.push({ name, width, height, playback, download: true, noOverflow: true, errors });
    await context.close();
  }
  const result = { passed: true, checks };
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2));
  await writeFile(join(root, 'viewer-check.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ layouts: checks.length, playback: checks.reduce((total, check) => total + check.playback.length, 0), output }));
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ passed: false, checks, error: String(error) }, null, 2));
  throw error;
} finally { await browser.close(); }
