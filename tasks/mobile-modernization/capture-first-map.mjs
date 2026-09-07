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
    player.hp = 100; enemies = []; enemyShots = []; traps = []; effects = []; run.mapHazards = [];
    run.v25 = null; v25Ensure();
  }
  const original = Math.random;
  try {
    Math.random = () => .5; setup();
    const layout = run.v25.interactables.map(({ pulse, ...item }) => item), interactions = [], hazards = [], recoveries = [];
    for (const type of ['barrel', 'heal', 'altar', 'mechanism', 'supply']) for (const xp of type === 'supply' ? [0, 10] : [0]) {
      setup(); const item = run.v25.interactables.find(item => item.type === type);
      player.x = item.x; player.y = item.y; run.xp = xp;
      const targets = Array.from({ length: 12 }, (_, i) => ({ id: 'EN001', name: 'fixture', x: item.x + 164 + i, y: item.y, hp: 100000, maxHp: 100000, r: 10, elite: i >= 8, affixes: [], attack: 0, skill: 0, speed: 0, damage: 10, color: '#fff', flash: 0, ai: 'melee' }));
      enemies = structuredClone(targets); run.mapHazards = [{ type: 'fireline', life: 1 }]; traps = [{ life: 1 }];
      v25UseInteractable();
      interactions.push({ type, xp, targets, player: structuredClone(player), damages: enemies.map(enemy => 100000 - enemy.hp), used: run.v25.used, bonusGold: run.v25.bonusGold, hazardSuppress: run.v25.hazardSuppress, hazards: run.mapHazards.length, traps: traps.length, progression: { level: run.level, xp: run.xp, xpNeed: run.xpNeed, choosing: run.paused } });
    }
    for (const spec of [{ time: 25.99, dt: .02, suppress: 0 }, { time: 26.01, dt: .02, suppress: 0 }, { time: 26.01, dt: .02, suppress: .01 }, { time: 26.01, dt: .02, suppress: 25 }]) {
      setup(); run.time = spec.time; run.v25.hazardSuppress = spec.suppress;
      updateMapMechanic(spec.dt);
      hazards.push({ ...spec, hp: player.hp, inv: player.inv, suppressAfter: run.v25.hazardSuppress, hazards: structuredClone(run.mapHazards) });
    }
    setup();
    for (const time of [74.99, 75, 75, 165, 255, 300, 330, 330]) {
      run.time = time; const fired = v337FirstCampaignRecovery(run.v29.rule);
      recoveries.push({ time, fired, hp: player.hp, used: [...run.v29.recoveries] });
    }
    return { evidence: 'Synthetic isolated Chrome legacy map oracle, not natural gameplay.', layout, interactions, hazards, recoveries };
  } finally { Math.random = original; run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/first-map-oracle.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`Captured ${result.layout.length} map objects, ${result.interactions.length} actions, ${result.hazards.length} hazard cases and ${result.recoveries.length} recovery steps.`);
