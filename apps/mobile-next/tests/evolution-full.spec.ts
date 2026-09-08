import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';
test.use({ trace: 'off' });
test('natural evolved run finishes, saves once and replays from the starter', async ({ page }, info) => {
  test.setTimeout(720_000);
  await playEvolution(page, info, '赤焰战神', true);
});
