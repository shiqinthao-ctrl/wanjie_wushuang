import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.P4B_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set a unique P4B_ATTEMPT');
const output = `../../tasks/mobile-modernization/evidence/P4b/${attempt}`;
if (process.env.TEST_WORKER_INDEX === undefined &&
    ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Existing evidence must be preserved; use another P4B_ATTEMPT');
}
export default defineConfig(base, {
  outputDir: `${output}/test-results`,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  workers: 3,
  use: { video: 'on', trace: 'off' },
  projects: [
    ...[{ name: 'short', width: 320, height: 568 }, { name: 'medium', width: 360, height: 640 },
      { name: 'browser-bars', width: 390, height: 664 }].map(({ name, width, height }) => ({
      name, use: { ...devices['iPhone 12'], viewport: { width, height }, defaultBrowserType: 'chromium' as const, channel: 'chrome' },
    })),
    ...base.projects!,
  ],
});
