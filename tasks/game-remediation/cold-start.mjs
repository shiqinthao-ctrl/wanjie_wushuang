import { chromium, expect } from '../../apps/mobile-next/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = process.env.R0_URL || 'http://127.0.0.1:4178/mobile-next/';
const destination = resolve(process.argv[2] || `tasks/game-remediation/evidence/R0/cold-${Date.now()}`);
const sizes = [{ width: 1280, height: 720 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 430, height: 932 }];
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { target, startedAt: new Date().toISOString(), browser: browser.version(), methodology: '3 repeats, fresh Chrome contexts/storage/cache; shared browser process, local production server; desktop emulation only', readinessLimitMs: 5000, naturalInput: true, attempts: [] };
try {
  for (const viewport of sizes) for (let repeat = 1; repeat <= 3; repeat++) {
    const id = `${viewport.width}-${repeat}`, dir = resolve(destination, id);
    await mkdir(dir, { recursive: true });
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 1000, hasTouch: viewport.width < 1000, recordVideo: { dir, size: viewport } });
    const page = await context.newPage();
    const attempt = { id, viewport, startedAt: new Date().toISOString(), status: 'running', timeline: [], errors: [], warnings: [], requests: [], resources: [], longTasks: [], video: null };
    const start = performance.now(), mark = event => attempt.timeline.push({ event, ms: Math.round(performance.now() - start) });
    page.on('pageerror', error => attempt.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') attempt.errors.push(message.text()); if (message.type() === 'warning') attempt.warnings.push(message.text()); });
    page.on('requestfailed', request => attempt.errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', response => { attempt.requests.push({ url: response.url(), status: response.status() }); if (response.status() >= 400) attempt.errors.push(`${response.status()} ${response.url()}`); });
    await page.addInitScript(() => {
      window.__r0LongTasks = [];
      new PerformanceObserver(list => window.__r0LongTasks.push(...list.getEntries().map(item => ({ start: item.startTime, duration: item.duration })))).observe({ type: 'longtask', buffered: true });
    });
    try {
      await page.goto(target); mark('navigation');
      await expect(page.getByRole('button', { name: '进入战场预览' })).toBeEnabled({ timeout: 5000 }); mark('lobby-ready');
      await page.getByRole('button', { name: '进化征途', exact: true }).click();
      await page.getByRole('button', { name: '开启进化征途' }).click(); mark('battle-click');
      await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled({ timeout: 5000 }); mark('battle-ready');
      await expect(page.locator('canvas')).toHaveCount(1);
      await expect(page.getByLabel('本局时间')).not.toHaveText('00:00', { timeout: 5000 }); mark('clock-moving');
      await page.screenshot({ path: resolve(dir, 'battle.png') });
      await page.getByRole('button', { name: '暂停', exact: true }).click();
      const time = await page.getByLabel('本局时间').textContent();
      await page.waitForTimeout(600);
      await expect(page.getByLabel('本局时间')).toHaveText(time);
      await page.getByRole('button', { name: '返回大厅', exact: true }).click();
      await expect(page.locator('canvas')).toHaveCount(0); mark('exit-clean');
      expect(attempt.errors).toEqual([]);
      attempt.status = 'passed';
    } catch (error) {
      attempt.status = 'failed'; attempt.failure = String(error);
      await page.screenshot({ path: resolve(dir, 'failure.png') }).catch(() => {});
    } finally {
      const metrics = await page.evaluate(() => ({ resources: performance.getEntriesByType('resource').map(item => ({ name: item.name, duration: item.duration, transferSize: item.transferSize, encodedBodySize: item.encodedBodySize })), longTasks: window.__r0LongTasks })).catch(() => ({}));
      Object.assign(attempt, metrics);
      const video = page.video(); await context.close(); attempt.video = await video?.path();
      report.attempts.push(attempt);
      await writeFile(resolve(destination, 'report.json'), JSON.stringify(report, null, 2));
      console.log(`${id}: ${attempt.status} ${JSON.stringify(attempt.timeline)}`);
    }
  }
} finally { await browser.close(); }
process.exitCode = report.attempts.some(attempt => attempt.status !== 'passed') ? 1 : 0;
