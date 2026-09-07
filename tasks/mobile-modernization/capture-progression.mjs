import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const originalRandom = Math.random;
  const seeded = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const init = () => {
    save = structuredClone(fresh);
    _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    run.active = false; run.paused = false;
    player.x = 0; player.y = 0; xpCrystals = [];
  };
  const crystals = [];
  for (const difficulty of Object.keys(V19_DIFFICULTIES)) for (const elite of [false, true]) {
    init(); save.difficulty = difficulty;
    const enemy = { x: 400, y: 0, elite };
    v342SpawnXpCrystal(enemy);
    crystals.push({ name: `${difficulty}-${elite ? 'elite' : 'normal'}`, difficulty, enemies: [enemy], steps: [], expected: structuredClone(xpCrystals), collected: [] });
  }
  for (const distance of [0, 26, 26.001, 239.999, 240, 240.001]) for (const dt of [0, .016, .034, -.1]) {
    init();
    const enemy = { x: distance, y: 0, elite: false };
    v342SpawnXpCrystal(enemy);
    const collected = [v342UpdateXpCrystals(dt), v342UpdateXpCrystals(dt)];
    crystals.push({ name: `distance-${distance}-dt-${dt}`, difficulty: fresh.difficulty, enemies: [enemy], steps: [dt, dt], expected: structuredClone(xpCrystals), collected });
  }
  init();
  const enemies = Array.from({ length: 183 }, (_, i) => ({ x: 400 + i, y: i, elite: i >= 180 }));
  enemies.forEach(e => v342SpawnXpCrystal(e));
  crystals.push({ name: 'overflow-conserves-value-and-elite', difficulty: fresh.difficulty, enemies, steps: [], expected: structuredClone(xpCrystals), collected: [] });
  init();
  const pickups = [{ x: 0, y: 0, elite: false }, { x: 26, y: 0, elite: true }, { x: -26, y: 0, elite: false }];
  pickups.forEach(e => v342SpawnXpCrystal(e));
  const collected = [v342UpdateXpCrystals(.016)];
  crystals.push({ name: 'aggregate-pickups', difficulty: fresh.difficulty, enemies: pickups, steps: [.016], expected: structuredClone(xpCrystals), collected });
  const pools = [];
  const variants = [
    { name: 'fresh', skills: { A011: 1, A021: 1 }, passives: { P026: 1 } },
    { name: 'all-slots-full', skills: Object.fromEntries(fresh.build.active.map(id => [id, 1])), passives: Object.fromEntries(fresh.build.passive.map(id => [id, 1])) },
    { name: 'all-maxed', skills: Object.fromEntries(fresh.build.active.map(id => [id, 5])), passives: Object.fromEntries(fresh.build.passive.map(id => [id, 5])) },
    { name: 'at-cap', skills: { A011: 5, A021: 4 }, passives: { P026: 5 } },
    { name: 'foreign-full-slots', skills: Object.fromEntries(['A001','A002','A003','A004','A005','A006'].map(id => [id, 2])), passives: Object.fromEntries(['P001','P002','P003','P004','P005','P006'].map(id => [id, 2])) },
  ];
  for (const variant of variants) for (const seed of [1, 42, 999]) {
    init(); run.skills = { ...variant.skills }; run.passives = { ...variant.passives };
    Math.random = seeded(seed);
    pools.push({ ...variant, seed, expected: validOptions() });
  }
  const chains = [];
  for (const xp of [25, 26, 73, 74, 180, 500]) {
    init(); run.xp = xp; Math.random = () => .75;
    const states = [];
    const capture = () => ({ level: run.level, xp: run.xp, xpNeed: run.xpNeed, paused: run.paused, skills: { ...run.skills }, passives: { ...run.passives }, choices: run.paused ? validOptions().slice(0, 3) : [] });
    checkLevel(); states.push(capture());
    for (let i = 0; i < 20 && run.paused; i++) { pickLevel(validOptions()[0]); states.push(capture()); }
    chains.push({ xp, states });
  }
  Math.random = originalRandom;
  return { crystals, pools, chains, difficulties: V19_DIFFICULTIES, skills: WW.config.skill, evolution: WW.config.evolution };
}, fresh));
for (const name of ['difficulties', 'skills', 'evolution']) {
  await writeFile(resolve(import.meta.dirname, `../../apps/mobile-next/src/data/${name}.json`), JSON.stringify(result[name], null, 2) + '\n');
  delete result[name];
}
await writeFile(resolve(import.meta.dirname, 'baseline/progression-oracle.json'), JSON.stringify({ evidence: 'Isolated Chrome synthetic rule inputs; not natural play.', ...result }, null, 2) + '\n');
console.log(`Captured ${result.crystals.length} crystal, ${result.pools.length} pool and ${result.chains.length} choice-chain cases.`);
