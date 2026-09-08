import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import base from './playwright.config';

// Preserve each invocation in a distinct evidence directory, including failures.
const attempt = process.env.P2K_ATTEMPT;
if (!attempt || !/^[a-z0-9-]+$/.test(attempt)) throw new Error('Set P2K_ATTEMPT to a unique evidence folder name');
const output = `../../tasks/mobile-modernization/evidence/P2k/${attempt}`;
// Workers reload this config after the runner creates its output directory.
if (process.env.TEST_WORKER_INDEX === undefined &&
    ['results.json', 'test-results'].some(path => existsSync(resolve(import.meta.dirname, output, path)))) {
  throw new Error('Attempt already has evidence; choose a new P2K_ATTEMPT to preserve it');
}
export default defineConfig(base, {
  outputDir: `${output}/test-results`,
  reporter: [['list'], ['json', { outputFile: `${output}/results.json` }]],
  workers: 3,
  use: { video: 'on' },
});
