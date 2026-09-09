import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';

test.use({ trace: 'off', video: 'on' });
test('G5 natural frost-flame form, radial route, bond, awakening and replay', async ({ page }, info) => {
  test.setTimeout(720_000);
  await playEvolution(page, info, '赤焰战神', info.project.name !== 'narrow', {
    form: 'frostflame', signature: 'G2_FROST', route: 'ringfire', bonds: ['霜火淬炼'], readability: true,
  });
});
