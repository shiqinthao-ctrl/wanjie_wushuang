import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.P2L_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set a unique P2L_ATTEMPT');
const output = `../../tasks/mobile-modernization/evidence/P2l/${attempt}`;
if (process.env.TEST_WORKER_INDEX === undefined &&
    ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Attempt already has evidence; choose a new P2L_ATTEMPT');
}
export default defineConfig(base, {
  outputDir: `${output}/test-results`,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  workers: 3,
  use: { baseURL: 'http://127.0.0.1:4188/mobile-next/', video: 'on' },
  webServer: { command: 'npm run preview -- --port 4188 --strictPort', url: 'http://127.0.0.1:4188/mobile-next/', reuseExistingServer: false },
});
