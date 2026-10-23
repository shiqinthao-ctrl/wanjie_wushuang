import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { CombatSimulation } from './CombatSimulation';
import { activeSkills, bonds, hasSkillTag } from './evolutionCatalog';
import { chapterBonds } from '../chapter/catalog';
import { bondRequirements, choiceAdvice } from '../ui/buildAdvice';
import { sourceElement } from './combatMath';
import type { Enemy } from './spawnRules';

/**
 * R2-B01..08 - the eight element bonds, asserted on the container each one writes to.
 *
 * Scope 0 first, because the queue's premise ("the bonds have no acceptance") is **mostly false**:
 * every one of the eight already had a test, and four of them were thorough. What follows is what a
 * per-bond sweep found *missing*, not a rewrite:
 *
 *   bond            already asserted                                    added here
 *   wildfire        presence / absence (`evolutionCombat:57-60`)        .55 magnitude, 4 pulses/s, fire element
 *   stormhunt       one extra jump (`evolutionCombat:54`)               the boss clause is *not* gated
 *   shadowfire      field exists, cd blocks a second (`:55-56`)         origin point, r85, .35x, 3s
 *   superconduct    1.35 on a chilled body (`elementalEvolution:71`)    nothing - the boss half is vacuous
 *   winterlegion    frost damage, absent without (`:80-93`)             70px radius, 1s chill, boss excluded
 *   thunderlegion   first tick .6 vs .8 (`:94-95`)                      sixteen attacks in 4.44s, not stacked
 *   galephantom     per pulse, .75x, 300 range (`windShadow:74-99`)      nothing - fully covered
 *   thermalshock    1.3 and boss exclusion (`formPressure:1005`)         the chill is not consumed
 *
 * Two structural facts the sweep turned up and this file now guards:
 *
 *   1. `chapterBonds` (`chapter/catalog.ts:16`) is a **second hand-written copy** of the eight ids.
 *      `progress.ts:48` and `settlement.ts:29` reject any run report whose bond id is not in it, so a
 *      ninth bond added to the catalog but not to the whitelist would throw at settlement time, not
 *      at test time. Nothing asserted the two lists agree.
 *   2. `stormhunt`'s detail reads "雷电弹多跳一个目标，首领也可跳链". Only the first clause is the
 *      bond: `lightning()` builds its target list as `[...enemies, ...(boss ? [boss] : [])]`
 *      (`EvolutionCombat:164`), so the boss is chainable **with or without** the bond. The second
 *      clause describes the base skill. Pinned, not fixed - the detail is the thing that is wrong.
 *
 * "The player can see it" is a coverage claim, not a gap: `RunGuide.vue:17` renders all eight with
 * `needs`, a per-tag condition from `bondRequirements`, and the `detail`; `BattleView.vue:179,214`
 * counts the active ones; `RunResult.vue:37` names them; `ChoiceDetails.vue:17` previews "可激活".
 * The Vue templates themselves are not asserted (no Playwright here), so the test below asserts the
 * data those templates read.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');

const dummy = (x: number, y = 1200): Enemy => ({
  id: 'EN001', name: 'dummy', ai: 'melee', x, y, hp: 1e6, maxHp: 1e6, r: 10, elite: false,
  affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0,
});

function setup(hero = 'H001', skills: Record<string, number> = {}) {
  const journey = new RunEvolution(hero);
  const progression = new Progression(evolutionBuild(hero), skills, {}, () => .8, journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero }, progression, () => .8);
  return { journey, sim };
}
/**
 * Keep the automatic track out of a measurement that is about one manual cast.
 *
 * `cool` starts **empty** (`CombatSimulation:79`), so `Object.keys(sim.cool)` finds nothing on a
 * fresh sim and "zero every cooldown" is a no-op. The auto-cast loop then reads `undefined`, which
 * is not `> 0`, and casts every owned skill on the first frame - that is what put a second vortex
 * on the field and a 135px `G2_FROST` ring over both dummies in the first draft of this file.
 */
const silence = (sim: CombatSimulation) => { for (const id of Object.keys(sim.progression.snapshot().skills)) sim.cool[id] = 1e6; };
const step = (sim: CombatSimulation, seconds: number, dt = .02) => { for (let t = 0; t < seconds; t += dt) sim.updateOuter(dt); };

const report: Record<string, unknown> = { slice: 'R2-B01..08', tree: 'apps/mobile-next' };

describe('R2-B01..08 - eight bonds', () => {
  it('counts eight, matches the chapter whitelist, and gates every one on both tags above zero', () => {
    // The number in TASK.md is a claim; count it. `chapterBonds` is a second copy of the same ids
    // and nothing compared them - `progress.ts:48` would throw "战报羁绊" for a bond it lacks.
    expect(bonds).toHaveLength(8);
    expect([...chapterBonds]).toEqual(bonds.map(bond => bond.id));

    const journey = new RunEvolution('H001');
    const rows: Record<string, unknown> = {};
    for (const bond of bonds) {
      const first = bond.tags[0]!, second = bond.tags[1]!;
      // A skill that carries this tag and none of the bond's other tags, so each arm is one-sided.
      const pick = (tag: string) => activeSkills.find(id => hasSkillTag(id, tag) && !bond.tags.some(other => other !== tag && hasSkillTag(id, other)));
      const a = pick(first)!, b = pick(second)!;
      expect(a, `${bond.id}: no skill carries ${first} alone`).toBeTruthy();
      expect(b, `${bond.id}: no skill carries ${second} alone`).toBeTruthy();
      expect(journey.bond(bond.id, { [a]: 1 }), `${bond.id} must need ${second}`).toBe(false);
      expect(journey.bond(bond.id, { [b]: 1 }), `${bond.id} must need ${first}`).toBe(false);
      expect(journey.bond(bond.id, { [a]: 0, [b]: 1 }), `${bond.id}: level 0 is not ownership`).toBe(false);
      expect(journey.bond(bond.id, { [a]: 1, [b]: 1 }), bond.id).toBe(true);
      const one = journey.snapshot({ [a]: 1 }).bonds.find(entry => entry.id === bond.id)!;
      expect([one.count, one.active], `${bond.id}: one tag is 1/2`).toEqual([1, false]);
      const two = journey.snapshot({ [a]: 1, [b]: 1 }).bonds.find(entry => entry.id === bond.id)!;
      expect([two.count, two.active], `${bond.id}: both tags is 2/2`).toEqual([2, true]);
      rows[bond.id] = { tags: [...bond.tags], only: [a], onlyOther: [b] };
    }
    report.gating = rows;
  });

  it('wildfire adds a 0.55 fire blast on every vortex pulse, and nothing without a fire skill', () => {
    const bonded = setup('H001', { A026: 1, A011: 1 }), plain = setup('H001', { A026: 1 });
    for (const { sim } of [bonded, plain]) {
      sim.enemies.push(dummy(sim.player.x + 40)); sim.cast('A026'); silence(sim);
      step(sim, 1);
    }
    const pulses = (sim: CombatSimulation) => sim.takeEvents().filter(event => event.type === 'ring' && event.source === 'H010_WILDFIRE').length;
    // The vortex ticks at .28s (`CombatSimulation:497`), so a 1s window holds four pulses.
    expect(pulses(bonded.sim), 'four pulses in one second').toBe(4);
    expect(pulses(plain.sim), 'no fire skill, no blast').toBe(0);
    expect(bonded.sim.damageBy.H010_WILDFIRE, 'and the blast lands').toBeGreaterThan(0);
    expect(plain.sim.damageBy.H010_WILDFIRE).toBeUndefined();
    // `H010` is a fire prefix (`combatMath:44`), which is why thermalshock can multiply this blast.
    expect(sourceElement('H010_WILDFIRE')).toBe('fire');

    // Magnitude: the same blast, called by hand through the same pipeline on the same dummy.
    // The control source has to be **fire** as well - the element is part of the damage maths
    // (`damageMultiplier` adds `gear.fireDmg` and skips it for wind/frost), so a made-up id like
    // `CTRL` lands as physical and reads 1.04x where the bond's blast reads 1.73x. Same element,
    // same context, same dummy: the only difference left is the coefficient.
    const pulsed = setup('H001', { A026: 1, A011: 1 }), control = setup('H001', { A026: 1, A011: 1 });
    for (const { sim } of [pulsed, control]) { sim.enemies.push(dummy(sim.player.x + 40)); sim.cast('A026'); silence(sim); }
    pulsed.sim.updateOuter(.02);
    const vortex = pulsed.sim.vortices[0]!;
    control.sim.explosion('A011', { x: vortex.x, y: vortex.y }, vortex.r, vortex.dmg * .55);
    expect(pulsed.sim.damageBy.H010_WILDFIRE!).toBeCloseTo(control.sim.damageBy.A011!, 9);
    report.wildfire = { pulsesPerSecond: 4, coefficient: .55, fireElement: true, onePulse: pulsed.sim.damageBy.H010_WILDFIRE };
  });

  it('stormhunt buys exactly one more jump, and the boss clause is not the bond', () => {
    const chain = (bonded: boolean) => {
      const { sim } = setup('H010', bonded ? { A013: 1, A015: 1 } : { A013: 1 });
      for (let i = 0; i < 4; i++) sim.enemies.push(dummy(sim.player.x + 60 + i * 60));
      sim.cast('A013'); silence(sim);
      return sim.enemies.filter(enemy => enemy.hp < enemy.maxHp).length;
    };
    expect(chain(false), 'the base chain is two targets').toBe(2);
    expect(chain(true), 'the bond is +1').toBe(3);

    // The detail's second clause - "首领也可跳链" - is the base skill, not the bond: the boss is
    // already in `lightning()`'s target list (`EvolutionCombat:164`). Own no shadow skill at all.
    const { sim } = setup('H010', { A013: 1 });
    sim.time = 270; sim.bossEncounter.updateObjective();
    const boss = sim.boss!; boss.x = sim.player.x + 200; boss.y = sim.player.y; boss.shield = 0;
    sim.enemies.push(dummy(sim.player.x + 100));
    const before = boss.hp;
    sim.cast('A013'); silence(sim);
    expect(sim.enemies[0]!.hp, 'the near body is the first target').toBeLessThan(1e6);
    expect(boss.hp, 'the boss is the second jump, with no 影 skill owned').toBeLessThan(before);
    report.stormhunt = { base: 2, bonded: 3, bossJumpWithoutBond: before - boss.hp };
  });

  it('shadowfire leaves one burning print per dodge, at the point the dodge started from', () => {
    const { sim } = setup('H001', { A011: 1, A015: 1 });
    const origin = { x: sim.player.x, y: sim.player.y };
    sim.player.dodgeCd = 0;
    expect(sim.action('dodge')).toBe(true);
    const print = sim.fields.filter(field => field.id === 'H010_BOND');
    expect(print).toHaveLength(1);
    expect(print[0]).toMatchObject({ x: origin.x, y: origin.y, r: 85, life: 3 });
    expect(print[0]!.dmg).toBeCloseTo(sim.player.atk * .35, 9);
    expect(sim.player.x === origin.x && sim.player.y === origin.y, 'the player did move').toBe(false);
    sim.action('dodge');
    expect(sim.fields.filter(field => field.id === 'H010_BOND'), 'the 4.5s dodge cd gates a second print').toHaveLength(1);

    const plain = setup('H001', { A011: 1 });
    plain.sim.player.dodgeCd = 0; plain.sim.action('dodge');
    expect(plain.sim.fields.some(field => field.id === 'H010_BOND'), 'no shadow skill, no print').toBe(false);
    report.shadowfire = { radius: 85, life: 3, coefficient: .35, printsPerDodge: 1 };
  });

  it('winterlegion rings 70px around each summon attack and cannot chill a Boss', () => {
    const { sim, journey } = setup('H012', { S001: 3, G2_FROST: 1 });
    journey.pick(2, { S001: 3 }, 'route', 'guard');
    sim.cast('S001'); silence(sim);
    const unit = sim.renderState().summons[0]!;
    const near = dummy(unit.x + 60, unit.y), far = dummy(unit.x + 80, unit.y);
    sim.enemies.push(near, far);
    sim.time = 270; sim.bossEncounter.updateObjective();
    const boss = sim.boss!; boss.x = unit.x + 40; boss.y = unit.y; boss.shield = 0;
    let firedAt = -1;
    for (let i = 0; i < 40 && firedAt < 0; i++) { sim.updateOuter(.02); if ((sim.damageBy.G2_FROST_CLONE || 0) > 0) firedAt = sim.time; }
    expect(firedAt, 'the summon attacked').toBeGreaterThan(0);
    expect(sim.damageBy.G2_FROST_CLONE!).toBeGreaterThan(0);
    expect(near.chilledUntil! - firedAt, 'a one second chill on the body inside 70px').toBeCloseTo(1, 9);
    expect(far.chilledUntil, 'and nothing on the body outside it').toBeUndefined();
    expect((boss as unknown as Record<string, unknown>).chilledUntil, 'the Boss carries no chill at all').toBeUndefined();
    report.winterlegion = { radius: 70, chillSeconds: 1, chillCoefficient: .25, bossChilled: false };
  });

  it('thunderlegion sets the summon interval to 0.6s and never stacks it', () => {
    // `updateOuter` does not advance `sim.time`, so the interval is read in **frames** off the
    // summon's own tick: it is reset upward on every attack, and the gap between resets is the
    // interval. A self-stacking effect would show a shrinking gap (30, 24, 19 ...), not a constant.
    const resets = (bonded: boolean) => {
      const { sim } = setup('H012', bonded ? { S001: 1, A013: 1 } : { S001: 1 });
      sim.enemies.push(dummy(sim.player.x + 200, sim.player.y));
      sim.cast('S001'); silence(sim);
      const frames: number[] = [];
      let previous = sim.renderState().summons[0]!.tick;
      for (let frame = 0; frame < 222; frame++) {
        sim.updateOuter(.02);
        const tick = sim.renderState().summons[0]?.tick;
        if (tick !== undefined && tick > previous + 1e-9) frames.push(frame);
        if (tick !== undefined) previous = tick;
      }
      return frames;
    };
    const plain = resets(false), bonded = resets(true);
    const gaps = (frames: number[]) => frames.slice(1).map((frame, i) => frame - frames[i]!);
    expect(plain.length, '6 attacks per summon at .8s in 4.44s').toBe(6);
    expect(new Set(gaps(plain)), 'the interval is a constant 40 frames').toEqual(new Set([40]));
    expect(bonded.length, '8 attacks per summon at .6s in 4.44s').toBe(8);
    expect(new Set(gaps(bonded)), 'and a constant 30 frames with the bond - not a shrinking gap').toEqual(new Set([30]));
    report.thunderlegion = { baseInterval: .8, bondedInterval: .6, attacksPlain: plain.length, attacksBonded: bonded.length, gapFrames: { plain: 40, bonded: 30 } };
  });

  it('thermalshock multiplies fire by 1.3 and leaves the chill in place', () => {
    const hit = (chilled: boolean) => {
      const { sim } = setup('H001', { A011: 1, G2_FROST: 1 });
      const body = dummy(sim.player.x + 60);
      if (chilled) body.chilledUntil = sim.time + 60;
      sim.enemies.push(body);
      sim.explosion('A011', body, 10, 100);
      return { dealt: sim.damageBy.A011!, left: body.chilledUntil, at: sim.time };
    };
    const on = hit(true), off = hit(false);
    expect(on.dealt / off.dealt, 'fire on a chilled body').toBeCloseTo(1.3, 9);
    expect(on.left! - on.at, 'the status is not consumed').toBeCloseTo(60, 9);
    expect(off.left).toBeUndefined();
    report.thermalshock = { multiplier: 1.3, consumesChill: false, bossExcludedBy: 'hitBoss never calls incomingEnemyDamage' };
  });

  it('surfaces all eight to the player with both conditions and an activation preview', () => {
    const journey = new RunEvolution('H001');
    const skills = { A011: 1, A026: 1, A013: 1, A015: 1, S001: 1, G2_FROST: 1 };
    const view = journey.snapshot(skills);
    expect(view.bonds.filter(bond => bond.active).map(bond => bond.id), 'one skill set activates all eight').toEqual(bonds.map(bond => bond.id));
    for (const bond of view.bonds) {
      expect(bond.needs.length, bond.id).toBeGreaterThan(0);
      expect(bond.detail.length, bond.id).toBeGreaterThan(0);
      expect(bond.tags, bond.id).toHaveLength(2);
      expect(Object.isFrozen(bond.tags), bond.id).toBe(true);
      expect(bondRequirements(bond.tags, skills).map(condition => condition.met), bond.id).toEqual([true, true]);
    }
    const preview = choiceAdvice({ kind: 'active', id: 'A026', label: '龙卷风' }, view, { A011: 1 });
    expect(preview.bonds).toContainEqual({ name: '风火燎原', completes: true });
    expect(choiceAdvice({ kind: 'passive', id: 'P019', label: 'P019' }, view, skills).bonds, 'passives advance nothing').toEqual([]);
    report.visibility = {
      renderers: ['ui/RunGuide.vue:17', 'ui/BattleView.vue:179,214', 'ui/RunResult.vue:37', 'ui/ChoiceDetails.vue:17'],
      asserted: ['snapshot().bonds', 'bondRequirements', 'choiceAdvice'],
      gap: 'the Vue templates themselves are not asserted (no Playwright in this environment)',
    };
  });

  it('writes the evidence report', () => {
    const dir = resolve(EVIDENCE_ROOT, 'R2-B01');
    mkdirSync(dir, { recursive: true });
    report.premise = 'TASK.md says the eight bonds have no acceptance; six of the eight already did (see coverage). The slice adds the missing halves, not a rewrite.';
    report.coverage = {
      wildfire: 'presence/absence in evolutionCombat.test.ts:57-60; magnitude, cadence and element added here',
      stormhunt: 'jump count in evolutionCombat.test.ts:54; the ungated boss clause added here',
      shadowfire: 'field and cd in evolutionCombat.test.ts:55-56; geometry added here',
      superconduct: '1.35 and expiry in elementalEvolution.test.ts:71-79; nothing added (the boss half is vacuous - Boss has no chilledUntil field)',
      winterlegion: 'damage in elementalEvolution.test.ts:80-93; radius, chill length and boss exclusion added here',
      thunderlegion: 'first tick in elementalEvolution.test.ts:94-95; the constant frame gap added here',
      galephantom: 'per pulse, .75x, 300 range, expiry, boss in windShadow.test.ts:74-99; nothing added',
      thermalshock: '1.3 in formPressure.test.ts:1005-1029, boss exclusion at :1115-1116; the unconsumed chill added here',
    };
    writeFileSync(resolve(dir, 'bond-report.json'), JSON.stringify(report, null, 2) + '\n');
    expect(report.gating, 'the report is assembled from the measurements above').toBeTruthy();
  });
});
