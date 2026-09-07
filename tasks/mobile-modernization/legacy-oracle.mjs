import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '../../apps/mobile-next/node_modules/playwright/index.mjs';

// Temporary profile; never connects to the player's browser or save storage.
export async function withLegacyOracle(callback) {
  const root = resolve(import.meta.dirname, '../..');
  const errors = [];
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const target = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!target.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    try {
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Type', (mime[extname(target)] || 'application/octet-stream') + '; charset=utf-8');
      res.end(await readFile(target));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByRole('button', { name: '新征途 创建冒险' }).click();
    const result = await callback(page);
    if (errors.length) throw new Error(errors.join('\n'));
    return result;
  } finally {
    await browser?.close();
    await new Promise(done => server.close(done));
  }
}
