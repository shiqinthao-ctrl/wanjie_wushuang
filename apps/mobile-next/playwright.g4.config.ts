import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.G4_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set a unique G4_ATTEMPT');
const output = `../../tasks/mobile-modernization/evidence/G4/${attempt}`;
if (process.env.TEST_WORKER_INDEX === undefined &&
  ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Attempt already has evidence; choose a new G4_ATTEMPT');
}
export default defineConfig({
  ...base, outputDir: `${output}/test-results`, workers: 3,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  use: { ...base.use, baseURL: 'http://127.0.0.1:4189/mobile-next/', video: 'on' },
  webServer: { command: 'npm run preview -- --port 4189 --strictPort', url: 'http://127.0.0.1:4189/mobile-next/', reuseExistingServer: false },
});
