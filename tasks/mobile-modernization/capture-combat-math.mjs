import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { withLegacyOracle } from './legacy-oracle.mjs';

const fresh = JSON.parse(await readFile(resolve(import.meta.dirname, 'baseline/schema30-fresh.json'), 'utf8'));
const result = await withLegacyOracle(page => page.evaluate(fresh => {
  const profiles = [{ name: 'fresh', patch: {} }];
  const affixes = ['allDamage','allElement','fireDmg','lightningDmg','shadowDmg','kiDmg','physicalDmg','summonDmg','bossDmg','eliteDmg','evoFusionDmg','shieldDmg','lifesteal','area','cdr'];
  for (const hero of Object.keys(WW.config.hero)) profiles.push({ name: hero + '-stacked', patch: {
    hero, heroes: { ...fresh.heroes, [hero]: { unlocked: true, level: 20, star: 3, mastery: 500, awakened: true } },
    runes: ['R001','R031','R032'], talents: Object.fromEntries(Object.keys(V28_TALENTS).map(id => [id, 5])),
    inventory: { ...fresh.inventory, gearInstances: fresh.inventory.gearInstances.map(item => ({ ...item, affixes: affixes.map((key, i) => ({ key, value: key === 'cdr' ? .5 : .01 * (i + 1) })) })) },
  } });
  profiles.push({ name: 'virtual-shape', patch: { runes: ['R013','R015','R017'], pet: 'PET015' } });
  const sourceIds = [...Object.keys(WW.config.skillForms.descriptions), ...Object.keys(WW.config.evolution), 'F005','F006','F020','F021','F026','F033','F001','H001_SLASH','H001_E','H001_R','H002_R','H007_CLONE','H010_BOMB','H012_R','H019_R','PET001','MAP_BARREL','AUTO'];
  for (const profile of profiles) {
    // Isolated synthetic rule inputs, with no elapsed battle frames.
    save = structuredClone({ ...fresh, ...profile.patch });
    v28Ensure(); _v21_startBattle(); v23Init(); v24RuntimeInit(); v26ApplyLoadout(); v27Apply(); v28Apply();
    run.active = false;
    profile.cases = [];
    for (const level of [0, 1, 5, 10]) {
      const levels = Object.fromEntries(Object.keys(WW.config.skillForms.descriptions).map(id => [id, level]));
      const passives = Object.fromEntries(['P003','P007','P016','P017','P018','P019','P021','P022','P023','P024','P026','P027','P030','P032','P033','P036','P039','P043'].map(id => [id, level]));
      const evolved = level >= 5 ? Object.fromEntries(Object.keys(WW.config.evolution).map(id => [id, true])) : {};
      run.skills = levels; run.passives = passives; run.evolved = evolved;
      player.hp = player.maxHp * (level >= 5 ? .3999 : .4); player.crit = level === 0 ? 0 : .31;
      run.v27.killBuff = level >= 5 ? 3 : 0;
      run.v29 = { id: level === 10 ? 'daily' : 'story', rule: {}, daily: { player: { lightning: .25, boss: .4 } } };
      const state = { skills: levels, passives, evolved, hp: player.hp, maxHp: player.maxHp, crit: player.crit, killBuff: run.v27.killBuff, mode: run.v29.id, daily: run.v29.daily.player };
      const modifiers = Object.fromEntries(sourceIds.map(id => [id, v24Mod(id)]));
      const multipliers = Object.fromEntries(sourceIds.map(id => [id, Object.fromEntries(['normal','elite','boss'].map(target => [target, v26DamageMult(id, target)]))]));
      const passiveLevels = Object.fromEntries(Object.keys(passives).map(id => [id, v24PLv(id)]));
      const hits = [];
      for (const skill of [false, true]) for (const elite of [false, true]) for (const critical of [false, true]) {
        player.hp = state.hp;
        const enemy = { x: player.x + 30, y: player.y, hp: 100000, maxHp: 100000, elite };
        enemies = [enemy];
        if (skill) v24DamageEnemy(enemy, 'A011', 137, critical); else damageEnemy(enemy, 137, critical, 'H001_SLASH');
        hits.push({ skill, elite, critical, damage: 100000 - enemy.hp, hp: player.hp });
      }
      const bossHits = [];
      for (const shield of [0, 20, 10000]) for (const skill of [false, true]) {
        player.hp = state.hp;
        run.boss = { id: 'B001', name: 'oracle', x: player.x, y: player.y, hp: 100000, maxHp: 100000, shield };
        if (skill) v24DamageBoss('A011', 137); else damageBoss(137, 'H001_R');
        bossHits.push({ skill, initialShield: shield, hp: run.boss.hp, shield: run.boss.shield });
      }
      run.boss = null;
      profile.cases.push({ level, state, modifiers, multipliers, passiveLevels, hits, bossHits });
    }
    profile.incoming = [];
    for (const ratio of [.3499, .35]) for (const shield of [0, 20, 500]) for (const inv of [0, .1]) for (const dodgeBuff of [0, 2]) for (const incoming of [1, 1.5]) {
      player.hp = player.maxHp * ratio; player.inv = inv; run.v27.shield = shield; run.v27.dodgeBuff = dodgeBuff; run.v29 = { rule: { incoming } };
      const initial = { hp: player.hp, maxHp: player.maxHp, shield, inv, dodgeBuff, incoming };
      hurtPlayer(40);
      profile.incoming.push({ initial, expected: { hp: player.hp, shield: run.v27.shield, inv: player.inv } });
    }
  }
  return { evidence: 'Final ordered legacy functions in isolated Chrome; synthetic rules, not gameplay acceptance.', forms: WW.config.skillForms, sources: Object.fromEntries(sourceIds.map(id => [id, v26SourceElement(id)])), profiles };
}, fresh));
await writeFile(resolve(import.meta.dirname, 'baseline/combat-math-oracle.json'), JSON.stringify(result, null, 2) + '\n');
await writeFile(resolve(import.meta.dirname, '../../apps/mobile-next/src/data/skillForms.json'), JSON.stringify(result.forms, null, 2) + '\n');
console.log(`Captured ${result.profiles.length} profiles with ${result.profiles.reduce((n, p) => n + p.cases.length, 0)} modifier matrices and ${result.profiles.reduce((n, p) => n + p.incoming.length, 0)} incoming cases.`);
