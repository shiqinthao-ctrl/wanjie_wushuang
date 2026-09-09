import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';

test.use({ trace: 'off', video: 'on' });
test('G4 natural wind-shadow form, ambush, bond, awakening and replay', async ({ page }, info) => {
  test.setTimeout(720_000);
  await playEvolution(page, info, '影忍', info.project.name !== 'narrow', {
    form: 'windwarden', signature: 'A026', route: 'ambush', bonds: ['风影合袭'], readability: true,
  });
});
