import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';

test.use({ trace: 'off', video: 'on' });
test('G2 recorded natural evolution, signature route, new bond and replay', async ({ page }, info) => {
  test.setTimeout(720_000);
  const run = {
    desktop: { hero: '赤焰战神', form: 'frostlord', signature: 'G2_FROST', route: 'glacier', bonds: ['冰雷超导', '霜卫契约'], complete: true },
    phone: { hero: '炎忍', form: 'thunderlord', signature: 'A013', route: 'relay', bonds: ['冰雷超导', '雷兽共鸣'], complete: false },
    narrow: { hero: '影忍', form: 'beastlord', signature: 'S001', route: 'guard', bonds: ['霜卫契约', '雷兽共鸣'], complete: false },
  }[info.project.name]!;
  await playEvolution(page, info, run.hero, run.complete, run);
});
