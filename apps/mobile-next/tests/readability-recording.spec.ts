import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';

test.use({ trace: 'off', video: 'on' });
test('G3 recorded alternate routes and readable decisions', async ({ page }, info) => {
  test.setTimeout(720_000);
  const run = {
    desktop: { hero: '赤焰战神', form: 'frostlord', signature: 'G2_FROST', route: 'shatter', bonds: ['冰雷超导', '霜卫契约'], complete: true },
    phone: { hero: '炎忍', form: 'thunderlord', signature: 'A013', route: 'thunderstrike', bonds: ['冰雷超导', '雷兽共鸣'], complete: false },
    narrow: { hero: '影忍', form: 'beastlord', signature: 'S001', route: 'hunter', bonds: ['霜卫契约', '雷兽共鸣'], complete: false },
  }[info.project.name]!;
  await playEvolution(page, info, run.hero, run.complete, { ...run, readability: true });
});

test('G3 recorded guard role and bond requirements', async ({ page }, info) => {
  test.setTimeout(420_000);
  await playEvolution(page, info, '影忍', false, { form: 'beastlord', signature: 'S001', route: 'guard', bonds: ['霜卫契约', '雷兽共鸣'], readability: true });
});
