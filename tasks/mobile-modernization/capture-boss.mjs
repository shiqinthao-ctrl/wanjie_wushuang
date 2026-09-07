import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const original = Math.random, clock = Date.now, timer = window.setTimeout, finish = finishRun;
  let calls = 0, outcome = null;
  const rng = seed => { calls = 0; Math.random = () => { calls++; return ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }; };
  function setup(difficulty = 'normal', width = 390, height = 844) {
    Math.random = () => .5; save = structuredClone(fresh); save.difficulty = difficulty; save.settings.particles = false; save.settings.numbers = false;
    v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply(); v29RuntimeInit();
    run.active = true; run.paused = false; run.time = 270; run.events = [true, true]; run.drops = []; run.boss = null; run.bossDefeated = false;
    AW = width; AH = height; WORLD_W = 3600; WORLD_H = 2400; player.x = 1800; player.y = 1200;
    enemies = []; enemyShots = []; traps = []; effects = []; run.mapHazards = []; run.v25.telegraphs = [];
    document.querySelectorAll('.overlay.show').forEach(el => el.classList.remove('show')); outcome = null;
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  try {
    Date.now = () => 1770000000000; window.setTimeout = () => 0;
    finishRun = (victory, reason) => { outcome = { victory, reason }; };
    setup(); const config = { boss: copy(WW.config.boss.B001), mechanics: copy(WW.config.bossInteractions.bosses.B001), pool: copy(WW.config.gearSystem.bossDrops.B001) };
    const spawns = [], casts = [], hits = [], loot = [], completion = [];
    for (const difficulty of ['easy', 'normal', 'hard', 'nightmare']) for (const [width, height] of [[390, 844], [1280, 720]]) {
      setup(difficulty, width, height); v29SpawnBossId('B001'); spawns.push({ difficulty, width, height, curve: v19StatCurve(270), boss: copy(run.boss) });
    }
    for (const phase of [1, 2, 3]) {
      setup(); v29SpawnBossId('B001'); run.boss.hp = run.boss.maxHp * [0, 1, .7, .35][phase];
      bossAI(.02); const transition = { boss: copy(run.boss), enemies: enemies.map(e => ({ elite: e.elite })) };
      for (let cast = 0; cast < 3; cast++) {
        run.v25.telegraphs = []; run.boss.v25CastCd = 0; run.boss.castLock = 0; bossAI(.02);
        const warning = copy(run.v25.telegraphs[0]), before = player.hp;
        v25Resolve(run.v25.telegraphs[0]);
        casts.push({ phase, cast, transition, warning, hpLoss: before - player.hp, after: copy(run.boss) }); player.inv = 0;
      }
    }
    for (const source of ['H001_SLASH', 'A011', 'MAP_BARREL', 'MAP_MECHANISM']) for (const shield of [0, 20]) {
      setup(); v29SpawnBossId('B001'); run.boss.shield = shield; const before = run.boss.hp;
      if (source === 'A011') v24DamageBoss(source, 100); else damageBoss(100, source);
      hits.push({ source, shield, hpLoss: before - run.boss.hp, shieldAfter: run.boss.shield });
    }
    for (const difficulty of ['normal', 'hard', 'nightmare']) for (const seed of [1, 12, 42, 999]) {
      setup(difficulty); v29SpawnBossId('B001'); rng(seed); damageBoss(1e9, 'MAP_BARREL');
      const automatic = copy(run.drops), beforeChoice = { shown: run.v26BossLootShown, resolved: !!v29FirstCampaignLootResolved(), calls };
      v26ShowBossLoot('B001'); const choices = copy(run.v26PendingLoot), choiceCalls = calls;
      v26PickBossLoot(choices[1].uid); v26PickBossLoot(choices[1].uid);
      loot.push({ difficulty, seed, automatic, beforeChoice, choices, choiceCalls, drops: copy(run.drops), resolved: !!v29FirstCampaignLootResolved(), calls });
    }
    for (const state of ['alive', 'opening', 'choosing', 'selected', 'missing-drop', 'missing-shown']) {
      setup(); v29SpawnBossId('B001');
      if (state !== 'alive') { damageBoss(1e9); if (state !== 'opening') v26ShowBossLoot('B001'); if (!['opening', 'choosing'].includes(state)) v26PickBossLoot(run.v26PendingLoot[0].uid); }
      if (state === 'missing-drop') run.drops = [];
      if (state === 'missing-shown') run.v26BossLootShown = false;
      const steps = [];
      for (const time of [360, 360.74, 360.75, 360.99, 361]) {
        run.time = time; v29Update(.02); steps.push({ time, outcome: copy(outcome), resolvedAt: run.v29.lootResolvedAt, settlingAt: run.v29.settlingAt });
      }
      completion.push({ state, steps });
    }
    return { evidence: 'Synthetic isolated legacy Chrome Boss oracle. Timers suppressed and outcomes intercepted; not natural gameplay.', clock: Date.now(), config, spawns, casts, hits, loot, completion };
  } finally { Math.random = original; Date.now = clock; window.setTimeout = timer; finishRun = finish; run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/boss-oracle.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(resolve(import.meta.dirname, '../../apps/mobile-next/src/data/firstBoss.json'), JSON.stringify(result.config, null, 2) + '\n');
console.log(`Captured ${result.spawns.length} spawns, ${result.casts.length} attacks, ${result.loot.length} loot sequences and ${result.completion.length} guards.`);
