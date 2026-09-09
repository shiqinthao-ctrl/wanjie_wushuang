import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

const attempt = process.env.P4A_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set P4A_ATTEMPT to a unique evidence folder name');
const output = `../../tasks/mobile-modernization/evidence/P4a/${attempt}`;
// Workers reload the config after the runner creates the output directory.
if (process.env.TEST_WORKER_INDEX === undefined &&
    ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Attempt already has evidence; choose a new P4A_ATTEMPT');
}
export default defineConfig(base, {
  outputDir: `${output}/test-results`,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  workers: 3,
  use: { video: 'on', trace: 'off' },
});
