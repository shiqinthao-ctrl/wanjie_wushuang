import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const base = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const cases = [{ name: 'fresh', patch: {} }];
  for (const hero of Object.keys(WW.config.hero)) {
    for (const mastery of [0, 49, 50, 119, 120, 219, 220, 349, 350, 499, 500]) {
      cases.push({ name: `${hero}-mastery-${mastery}`, patch: { hero, heroes: { ...fresh.heroes, [hero]: { unlocked: true, level: 20, star: 3, mastery, awakened: true } } } });
    }
  }
  for (const set of Object.keys(WW.config.gearSystem.sets)) {
    const gearInstances = Object.entries(WW.config.gearSystem.catalog).filter(([, item]) => item.set === set).map(([id, item], index) => ({ uid: `test-${id}`, templateId: id, ...item, affixes: [{ key: 'atkPct', value: .035 + index * .01 }, { key: 'crit', value: .018 }] }));
    for (const count of [1, 2, 3]) {
      const equipInst = Object.fromEntries(gearInstances.slice(0, count).map(item => [item.slot, item.uid]));
      cases.push({ name: `${set}-${count}`, patch: { inventory: { ...fresh.inventory, gearInstances }, equipInst } });
    }
  }
  for (const pet of Object.keys(WW.config.runePetSystem.pets)) {
    for (const type of ['offense', 'shape', 'survival', 'element', 'economy']) {
      const ids = Object.keys(WW.config.runePetSystem.runes).filter(id => WW.config.runePetSystem.runes[id].type === type);
      for (const count of [2, 3]) cases.push({ name: `${pet}-${type}-${count}`, patch: { pet, runes: ids.slice(0, count) } });
    }
  }
  cases.push({ name: 'max-talents-level-30', patch: { talents: Object.fromEntries(Object.keys(V28_TALENTS).map(id => [id, 5])), heroes: { ...fresh.heroes, H001: { unlocked: true, level: 30, star: 6, mastery: 500, awakened: true } } } });
  cases.push({ name: 'empty-equipment', patch: { equipInst: {}, runes: [], pet: 'PET007' } });
  for (const id of Object.keys(WW.config.runePetSystem.runes)) cases.push({ name: `single-${id}`, patch: { runes: [id] } });
  for (const level of [1, 29, 30]) for (const star of [1, 5, 6]) cases.push({ name: `level-${level}-star-${star}`, patch: { heroes: { ...fresh.heroes, H001: { unlocked: true, level, star, mastery: 0, awakened: false } } } });
  const copy = { ...fresh.inventory.gearInstances[0], uid: 'same-template-second', rarity: 'mythic', affixes: [{ key: 'crit', value: .9 }, { key: 'atkPct', value: .081 }] };
  cases.push({ name: 'instance-identity-and-crit-caps', patch: { inventory: { ...fresh.inventory, gearInstances: [...fresh.inventory.gearInstances, copy] }, equipInst: { ...fresh.equipInst, weapon: copy.uid }, runes: ['R001', 'R002', 'R003'], talents: { T002: 5 } } });
  for (const item of cases) {
    // Explicit synthetic inputs for rule comparison, not natural-play evidence.
    save = structuredClone({ ...fresh, ...item.patch });
    v28Ensure();
    const stats = heroStats(save.hero), gear = v26Bonuses(), runePet = v27CombinedBonus();
    _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    item.expected = { stats, gearScore: gearScore(), gear, runePet, talent: v28TalentBonus(), growth: v28Growth(), awaken: v28AwBonus(), player: { maxHp: player.maxHp, hp: player.hp, atk: player.atk, speed: player.speed, aspd: player.aspd, crit: player.crit }, skills: run.skills, passives: run.passives };
    run.active = false;
  }
  return { cases, talents: V28_TALENTS };
}, base));
const dataDir = resolve(import.meta.dirname, '../../apps/mobile-next/src/data');
await mkdir(dataDir, { recursive: true });
const config = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/effective-config.json'), 'utf8'));
for (const [name, value] of Object.entries({ heroes: config.hero, gear: config.gearSystem, runePets: config.runePetSystem, talents: result.talents, freshSave: base })) {
  await writeFile(resolve(dataDir, name + '.json'), JSON.stringify(value, null, 2) + '\n');
}
await writeFile(resolve(import.meta.dirname, 'baseline/growth-oracle.json'), JSON.stringify({ evidence: 'Isolated Chrome, synthetic rule inputs, zero elapsed frames; not natural gameplay.', cases: result.cases }, null, 2) + '\n');
console.log(`Captured ${result.cases.length} independent legacy growth/startup cases.`);
