import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.P4C_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set a unique P4C_ATTEMPT');
const output = `../../tasks/mobile-modernization/evidence/P4c/${attempt}`;
if (process.env.TEST_WORKER_INDEX === undefined &&
    ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Existing evidence must be preserved; use another P4C_ATTEMPT');
}
export default defineConfig({
  ...base,
  outputDir: `${output}/test-results`,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  workers: 3,
  use: { ...base.use, baseURL: 'http://127.0.0.1:4187/mobile-next/', video: 'on', trace: 'off' },
  webServer: { command: 'npm run preview -- --port 4187', url: 'http://127.0.0.1:4187/mobile-next/', reuseExistingServer: false },
  projects: [
    ...[{ name: 'landscape-short', width: 568, height: 320 }, { name: 'landscape-medium', width: 640, height: 360 },
      { name: 'landscape-wide', width: 844, height: 390 }, { name: 'short', width: 320, height: 568 },
      { name: 'medium', width: 360, height: 640 }, { name: 'browser-bars', width: 390, height: 664 }].map(({ name, width, height }) => ({
      name, use: { ...devices['iPhone 12'], viewport: { width, height }, defaultBrowserType: 'chromium' as const, channel: 'chrome' },
    })),
    ...base.projects!,
  ],
});
