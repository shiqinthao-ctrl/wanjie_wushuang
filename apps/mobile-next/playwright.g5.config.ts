import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.G5_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set a unique G5_ATTEMPT');
const output = `../../tasks/mobile-modernization/evidence/G5/${attempt}`;
if (process.env.TEST_WORKER_INDEX === undefined &&
  ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Attempt already has evidence; choose a new G5_ATTEMPT');
}
const live = process.env.G5_LIVE === '1';
export default defineConfig({
  ...base, outputDir: `${output}/test-results`, workers: 3,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  use: { ...base.use, baseURL: live ? 'https://wjws.onrender.com/mobile-next/' : 'http://127.0.0.1:4189/mobile-next/', video: 'on' },
  webServer: live ? undefined : { command: 'npm run preview -- --port 4189 --strictPort', url: 'http://127.0.0.1:4189/mobile-next/', reuseExistingServer: false },
});
