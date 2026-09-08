import { test } from '@playwright/test';
import { playEvolution } from './fixtures/evolutionPlay';
test.use({ trace: 'off' });
test('natural starter, evolution, skill route, bond and run reset', async ({ page }, info) => {
  test.setTimeout(300_000);
  const hero = { desktop: '赤焰战神', phone: '炎忍', narrow: '影忍' }[info.project.name]!;
  await playEvolution(page, info, hero);
});
