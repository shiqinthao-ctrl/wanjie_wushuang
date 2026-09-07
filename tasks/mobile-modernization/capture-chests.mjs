import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const original = Math.random, originalNow = Date.now;
  let calls = 0;
  const rng = seed => { calls = 0; Math.random = () => { calls++; return ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }; };
  function setup() {
    Math.random = () => .5; save = structuredClone(fresh); save.settings.particles = false; save.settings.numbers = false;
    v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    run.v29 = { id: 'story', rule: v29Rule('story') }; run.active = true; run.paused = false;
    AW = 390; AH = 844; WORLD_W = 3600; WORLD_H = 2400; player.x = 1800; player.y = 1200;
    enemies = []; enemyShots = []; traps = []; effects = []; run.mapHazards = [];
    document.querySelectorAll('.overlay.show').forEach(el => el.classList.remove('show'));
    v34InitRunFeatures();
  }
  const runtime = () => structuredClone(run.v24);
  const target = () => ({ id: 'EN001', x: 1860, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false });
  try {
    Date.now = () => 1770000000000; setup();
    const schedule = v34TimedRewardTimes(run.v29.rule), selections = [], gear = [], skills = [], fusions = [];
    const config = { evolution: structuredClone(WW.config.evolution), fusions: structuredClone(FUSIONS) };
    const supportedEvos = Object.entries(config.evolution).filter(([, [, a, p]]) => fresh.build.active.includes(a) && fresh.build.passive.includes(p)).map(([id]) => id);
    for (const ready of [[], supportedEvos.slice(0, 1), supportedEvos.slice(0, 2), supportedEvos]) {
      for (const evolved of [[], ready]) {
        setup();
        for (const id of ready) { const [, a, p] = config.evolution[id]; run.skills[a] = 5; run.passives[p] = 5; }
        for (const id of evolved) run.evolved[id] = true;
        run.time = 90; claimTimedReward(0);
        selections.push({ ready, evolved, titles: Array.from(document.querySelectorAll('#chestChoices h3')).map(el => el.textContent), evos: runReadyEvos(), fusions: runReadyFusions() });
      }
    }
    setup(); const guards = [];
    for (const [time, paused, bossShown] of [[89.99, false, false], [90, true, false], [90, false, true], [90, false, false]]) {
      run.time = time; run.paused = paused; run.v26BossLootShown = bossShown;
      guards.push({ time, paused, bossShown, result: claimTimedReward(0) });
    }
    rng(12); pickChest({ type: 'upgrade', id: null });
    const upgrade = { skills: structuredClone(run.skills), passives: structuredClone(run.passives), calls, rewards: v34TimedRewardProjection(), secondClaim: claimTimedReward(0), duplicatePick: pickChest({ type: 'gear', id: null }) };
    for (const seed of [1, 12, 42, 999]) { setup(); rng(seed); gear.push({ seed, drop: makeGearDrop('chest'), calls }); }
    for (const evo of supportedEvos) {
      setup(); const [, id, passive] = config.evolution[evo]; run.skills[id] = 5; run.passives[passive] = 5; run.evolved[evo] = true;
      enemies = [target()]; rng(29); v24Cast(id);
      skills.push({ evo, id, passive, seed: 29, modifier: v24Mod(id), runtime: runtime(), damage: 100000 - enemies[0].hp, calls });
    }
    for (const id of ['F001', 'F002', 'F004']) {
      setup(); run.fused[id] = true; enemies = [target()]; rng(29); v24FusionPulse();
      const initial = runtime();
      v24UpdateProjectiles(.02); v24UpdateFields(.02); v24UpdateVortices(.02); v24UpdateMeteors(.02);
      fusions.push({ id, seed: 29, initial, after: runtime(), damage: 100000 - enemies[0].hp, calls });
    }
    return { evidence: 'Synthetic isolated legacy Chrome chest and form oracle; not natural gameplay.', clock: Date.now(), config, schedule, selections, guards, upgrade, gear, skills, fusions };
  } finally { Math.random = original; Date.now = originalNow; run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/chests-oracle.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(resolve(import.meta.dirname, '../../apps/mobile-next/src/data/fusions.json'), JSON.stringify(result.config.fusions, null, 2) + '\n');
console.log(`Captured ${result.selections.length} choice orders, ${result.skills.length} evolved attacks and ${result.fusions.length} fusions.`);
