import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const oracle = await withLegacyOracle(page => page.evaluate(fresh => {
  const copy = value => JSON.parse(JSON.stringify(value));
  const originals = { renderAll, renderResult, persist, go, snapshotActiveSlot, hint };
  try {
    renderAll = renderResult = persist = go = snapshotActiveSlot = hint = () => {};
    const cases = [];
    const scenarios = [
      { name: 'fresh-defeat', win: false, hp: 0, time: 28.34, kills: 9, elite: 0, combo: 5 },
      { name: 'victory-three', win: true, hp: .55001, time: 300.42, kills: 420, elite: 12, combo: 110 },
      { name: 'victory-two-threshold', win: true, hp: .55, time: 315.67, kills: 280, elite: 7, combo: 65 },
      { name: 'timeout-old-stars', win: false, hp: .8, time: 360.001, kills: 320, elite: 8, combo: 80, old: 3 },
      { name: 'lower-victory-old-stars', win: true, hp: .4, time: 350, kills: 260, elite: 5, combo: 33, old: 3 },
      { name: 'talents-account-level', win: true, hp: .9, time: 290, kills: 800, elite: 30, combo: 380, talents: true, xp: 1920 },
      { name: 'account-cap', win: true, hp: .9, time: 290, kills: 800, elite: 30, combo: 380, level: 200, xp: 24490 },
      { name: 'gear-and-rune-pet', win: false, hp: 0, time: 180.1, kills: 199, elite: 3, combo: 40, drops: true, petGold: 13.75, bonus: 125, runes: ['R041','R042','R043'] },
    ];
    for (const spec of scenarios) {
      save = structuredClone(fresh); save.accountLv = spec.level || save.accountLv; save.accountXp = spec.xp || 0;
      save.chapters.ST001.stars['ST001-01'] = spec.old || 0;
      if (spec.talents) for (const key of ['T011','T012','T013','T014','T015']) save.talents[key] = 3;
      if (spec.runes) save.runes = spec.runes;
      v29Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply(); v29RuntimeInit(); v34InitRunFeatures();
      run.active = true; run.paused = false; run.time = spec.time; run.kills = spec.kills; run.eliteKills = spec.elite; run.maxCombo = spec.combo;
      run.v29.score = 777; run.v29.bossesKilled = spec.win ? 1 : 0;
      run.v25.used = 2; run.v25.bonusGold = spec.bonus || 0; run.v25.bossPhaseMax = 3;
      run.v27.petGold = spec.petGold || 0; run.v27.petDamage = 1234.5; run.v27.petHeals = 0;
      run.damageBy = { H001_SLASH: 7200, A011: 3400 }; run.evolved = { E001: true }; run.fused = {};
      player.maxHp = 1000; player.hp = spec.hp * 1000;
      run.drops = spec.drops ? [{ ...copy(save.inventory.gearInstances[0]), uid: 'oracle-drop', source: 'elite', mystery: { keep: 7 } }] : [];
      if (spec.win) run.drops.push({ ...copy(save.inventory.gearInstances[0]), uid: 'oracle-boss', source: 'boss' });
      run.timedRewards[0].claimed = spec.time >= 90;
      const before = copy(save), drops = copy(run.drops);
      finishRun(spec.win, spec.name);
      const after = copy(save), result = copy(lastResult);
      finishRun(spec.win, spec.name);
      cases.push({ spec, before, drops, result, after, duplicateUnchanged: JSON.stringify(after) === JSON.stringify(save) });
    }
    return { evidence: 'Synthetic isolated effective legacy settlement oracle; controlled inputs and disabled presentation, not natural gameplay.', cases };
  } finally { Object.assign(window, originals); run.active = false; }
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/settlement-oracle.json'), JSON.stringify(oracle, null, 2) + '\n');
console.log(`Captured ${oracle.cases.length} effective settlement outcomes and duplicate guards.`);
