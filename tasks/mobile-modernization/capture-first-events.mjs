import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const originalRandom = Math.random, originalNow = Date.now;
  let calls = 0;
  function setup() {
    Math.random = () => .5;
    save = structuredClone(fresh); save.settings.particles = false; save.settings.numbers = false;
    v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    run.v29 = { id: 'story', rule: v29Rule('story') }; run.active = true; run.paused = false;
    enemies = []; enemyShots = []; traps = []; effects = []; run.mapHazards = [];
    document.querySelectorAll('.overlay.show').forEach(el => el.classList.remove('show'));
  }
  function rng(seed) {
    calls = 0; let state = seed >>> 0;
    Math.random = () => { calls++; state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  }
  try {
    Date.now = () => 1770000000000;
    setup(); const rule = run.v29.rule, schedule = [];
    for (const time of [44.99, 45, 45, 149.99, 150, 150, 360]) {
      run.time = time; let shown = 0;
      const fired = v29FirstCampaignMilestone(rule.eventAt, run.events, () => shown++);
      schedule.push({ time, fired, shown, flags: [...run.events] });
    }
    const choices = [];
    for (const code of ['merchantAtk', 'merchantHeal', 'goldCash', 'goldOpen', 'skip']) {
      for (const gold of code.startsWith('merchant') ? [0, 179, 180, 249, 250, 6000] : [6000]) {
        setup(); save.gold = gold; player.hp = 100; rng(12);
        const before = { gold, hp: player.hp, maxHp: player.maxHp };
        pickEvent(code, { name: 'synthetic event' });
        choices.push({ code, before, gold: save.gold, hp: player.hp, buff: run.shopBuff, skills: { ...run.skills }, passives: { ...run.passives }, drops: structuredClone(run.drops), calls });
      }
    }
    const gear = [];
    for (const seed of [1, 2, 12, 42, 321, 500, 999, 9999]) {
      setup(); rng(seed); const drop = makeGearDrop('gold'); gear.push({ seed, drop, calls });
    }
    const buffs = [];
    for (const buff of [0, .18, .36]) {
      setup(); rng(5); run.shopBuff = buff;
      enemies = [{ id: 'EN001', x: player.x + 30, y: player.y, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], color: '#fff', damage: 1 }];
      shootAuto(); buffs.push({ buff, damage: 100000 - enemies[0].hp });
    }
    return { evidence: 'Synthetic isolated Chrome legacy event oracle; injected seed/clock/fixtures, not natural gameplay.', clock: Date.now(), eventAt: rule.eventAt, eventPool: rule.storyEncounter.eventPool, schedule, choices, gear, buffs };
  } finally { Math.random = originalRandom; Date.now = originalNow; run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/first-events-oracle.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`Captured ${result.choices.length} choices, ${result.gear.length} gear cases, H001 buff damage ${result.buffs.map(x => x.damage).join('/')}.`);
