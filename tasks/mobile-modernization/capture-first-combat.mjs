import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  function setup() {
    save = structuredClone(fresh); save.settings.particles = false; save.settings.numbers = false;
    v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    run.v29 = { id: 'story', rule: v29Rule('story') }; run.active = true; run.paused = false;
    AW = 390; AH = 844; WORLD_W = 3600; WORLD_H = 2400; player.x = 1800; player.y = 1200;
    enemies = []; enemyShots = []; traps = []; effects = [];
  }
  const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  setup();
  const config = { rule: v29Rule('story'), enemies: ENEMIES, affixes: ELITE_AFFIXES.map(a => a.id), performance: save.settings.performance, caps: V30_PERF_CAPS[save.settings.performance] || V30_PERF_CAPS.balanced };
  const original = Math.random, spawns = [], actions = [], skills = [], ai = [];
  try {
    for (const time of [0, 90, 240, 300]) for (const elite of [false, true]) {
      setup(); run.time = time; Math.random = seeded(19);
      const pressure = v19Pressure(), interval = v19SpawnInterval(), eliteChance = v19EliteChance();
      spawnEnemy({ elite });
      spawns.push({ time, elite, seed: 19, pressure, interval, eliteChance, enemy: structuredClone(enemies[0]) });
    }
    for (const action of ['basic', 'skill', 'dodge']) {
      setup(); Math.random = () => .9;
      enemies = [{ id: 'EN001', x: 1860, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false }];
      if (action === 'basic') shootAuto();
      if (action === 'skill') castHeroSkill();
      if (action === 'dodge') tryDodge();
      actions.push({ action, player: structuredClone(player), heat: run.heroState.heat, bombs: structuredClone(run.heroState.bombs), damage: 100000 - enemies[0].hp });
    }
    for (const id of fresh.build.active) for (const level of [1, 5]) {
      setup(); Math.random = seeded(29); run.skills[id] = level;
      enemies = [{ id: 'EN001', x: 1860, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false }];
      v24Cast(id);
      skills.push({ id, level, seed: 29, runtime: structuredClone(run.v24), damage: 100000 - enemies[0].hp });
    }
    for (const type of ['melee', 'ranged', 'shield']) for (const distance of [20, 150, 250, 350]) {
      setup(); Math.random = () => .9;
      const initial = { id: 'EN001', name: 'fixture', x: 1800 + distance, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 1.79, skill: .2, speed: 20, damage: 10, color: '#fff', flash: 0, ai: type };
      enemies = [structuredClone(initial)]; enemyAI(enemies[0], .02);
      ai.push({ initial, enemy: structuredClone(enemies[0]), shots: structuredClone(enemyShots), player: structuredClone(player), dt: .02 });
    }
    setup(); run.active = false;
    return { evidence: 'Isolated legacy synthetic action/spawn oracle, not natural gameplay.', config, spawns, actions, skills, ai };
  } finally { Math.random = original; run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/first-combat-oracle.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(resolve(import.meta.dirname, '../../apps/mobile-next/src/data/firstStage.json'), JSON.stringify(result.config, null, 2) + '\n');
console.log(`Captured ${result.spawns.length} spawns, ${result.actions.length} actions, ${result.skills.length} skill forms and ${result.ai.length} AI steps.`);
