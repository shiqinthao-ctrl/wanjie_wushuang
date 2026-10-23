import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import fresh from '../data/freshSave.json';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { CombatSimulation } from './CombatSimulation';
import { skillModifier } from './combatMath';
import { skillRoutes } from './evolutionCatalog';
import type { Enemy } from './spawnRules';

const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const dir = resolve(EVIDENCE_ROOT, 'R2-S01');

const target = (x = 1960): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 1e9, maxHp: 1e9, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0 });

function setup(hero = 'H001', skills: Record<string, number> = {}) {
  const journey = new RunEvolution(hero);
  const progression = new Progression(evolutionBuild(hero), skills, {}, () => .8, journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero }, progression, () => .8);
  for (const id of Object.keys(sim.cool)) sim.cool[id] = 100;
  return { journey, progression, sim };
}

/** Every route skill has an evolution row except `G2_FROST`, which has none. */
const EVO: Record<string, string> = { A011: 'E011', A013: 'E013', A026: 'E026', S001: 'SE001' };

interface Cast { n: number; total: number; hits: number; dealt: number; r: number; speed: number; explode: number; follow?: boolean; guard?: boolean }
/** One cast, structural totals normalised by `atk`, with `count` targets in chain range. */
function drive(skill: string, hero: string, route: string | undefined, evolved = false, enemies = 1): Cast {
  const { journey, sim } = setup(hero, { [skill]: 3 });
  if (evolved) sim.evolved = { [EVO[skill]!]: true };
  if (route) journey.pick(2, { [skill]: 3 }, 'route', route);
  for (let i = 0; i < enemies; i++) sim.enemies.push(target(1860 + i * 70));
  const atk = sim.player.atk;
  sim.cast(skill);
  const shots = sim.projectiles.filter(p => p.id === skill);
  const vort = sim.vortices.filter(v => v.id === skill);
  const sums = (sim.renderState().summons as { id: string; dmg: number; guard: boolean }[]).filter(s => s.id === skill);
  const flds = sim.fields.filter(f => f.id === skill);
  const total = shots.reduce((a, p) => a + p.dmg / atk, 0)
    + vort.reduce((a, v) => a + v.dmg / atk, 0)
    + sums.reduce((a, s) => a + s.dmg / atk, 0)
    + flds.reduce((a, f) => a + f.dmg / atk, 0);
  const hits = sim.enemies.filter(e => e.hp < e.maxHp).length;
  return {
    // Instant routes (shatter, thunderstrike) leave no container; their cast is the hits it dealt.
    n: shots.length || vort.length || sums.length || flds.length || hits,
    total, hits, dealt: sim.damageBy[skill] ?? 0,
    r: vort[0]?.r ?? flds[0]?.r ?? 0,
    speed: shots[0] ? Math.hypot(shots[0].vx, shots[0].vy) : vort[0] ? Math.hypot(vort[0].vx, vort[0].vy) : 0,
    explode: shots[0]?.explode ?? 0,
    follow: vort[0]?.follow ?? flds[0]?.follow,
    guard: sums[0]?.guard,
  };
}

/** The report is built from the same reads the assertions use, so the two cannot drift. */
const report: Record<string, unknown> = { slice: 'R2-S01', routes: {} as Record<string, unknown>, coverage: {} as Record<string, unknown> };
const routes = report.routes as Record<string, unknown>;
const coverage = report.coverage as Record<string, unknown>;

describe('R2-S01..12 - the twelve skill routes', () => {
  it('every route in the table is taken by a branch and produces its own output', () => {
    // The table is the source of truth for "twelve": count it here rather than trusting a number.
    expect(skillRoutes).toHaveLength(12);
    expect(new Set(skillRoutes.map(r => r.skill)).size).toBe(5);
    const skillOf: Record<string, string> = { volley: 'A011', nova: 'A011', ringfire: 'A011', roaming: 'A026', orbit: 'A026', ambush: 'A026', hunter: 'S001', guard: 'S001', glacier: 'G2_FROST', shatter: 'G2_FROST', relay: 'A013', thunderstrike: 'A013' };
    const heroOf: Record<string, string> = { A011: 'H001', A026: 'H001', S001: 'H012', G2_FROST: 'H001', A013: 'H010' };
    for (const route of skillRoutes) {
      const m = drive(route.skill, heroOf[route.skill]!, route.id, false, 5);
      // A routed skill always casts; the un-routed A011 does not reach this branch at all.
      expect(m.n, `${route.id} produced nothing`).toBeGreaterThan(0);
      routes[route.id] = { skill: route.skill, hero: heroOf[route.skill], detail: route.detail, n: m.n, totalPerAtk: m.total, hits: m.hits, radius: m.r, speed: m.speed, explode: m.explode, follow: m.follow, guard: m.guard };
      expect(skillOf[route.id]).toBe(route.skill);
    }
  });

  it('fireball routes: 3 x 65%, 1 x 145% and slower/wider, 8 x 45% with a smaller blast', () => {
    const atkOf = (hero: string) => setup(hero, { A011: 3 }).sim.player.atk;
    const atk = atkOf('H001');
    const range = skillModifier(setup('H001', { A011: 3 }).sim.context, setup('H001', { A011: 3 }).sim.state(), 'A011').range;
    const base = drive('A011', 'H001', undefined), volley = drive('A011', 'H001', 'volley');
    const nova = drive('A011', 'H001', 'nova'), ring = drive('A011', 'H001', 'ringfire');

    // The un-routed baseline is one shot at 95% (the legacy branch, `n = m.evo ? 3 : 1`).
    expect(base.n).toBe(1);
    expect(volley.n).toBe(3);
    // The detail is per shot ("单发伤害为原来的 65%"); three shots still out-total one.
    expect(volley.total / volley.n / (base.total / base.n)).toBeCloseTo(.65, 6);
    expect(volley.total / base.total).toBeCloseTo(1.95, 6);
    expect(volley.speed).toBeCloseTo(390, 6);
    expect(volley.explode).toBeCloseTo(58 * range, 6);

    expect(nova.n).toBe(1);
    expect(nova.total / base.total).toBeCloseTo(1.45, 6);
    expect(nova.speed).toBeCloseTo(260, 6);
    expect(nova.speed).toBeLessThan(volley.speed);
    expect(nova.explode).toBeCloseTo(110 * range, 6);
    expect(nova.explode).toBeGreaterThan(volley.explode);

    expect(ring.n).toBe(8);
    expect(ring.total / base.total).toBeCloseTo(3.6, 6);
    expect(ring.total / 8).toBeCloseTo(.95 * .45, 6);
    expect(ring.explode).toBeCloseTo(28 * range, 6);
    expect(ring.explode).toBeLessThan(volley.explode);
    expect(atk).toBeGreaterThan(0);

    // Eight evenly spaced directions, not a fan.
    const { journey, sim } = setup('H001', { A011: 3 });
    journey.pick(2, { A011: 3 }, 'route', 'ringfire');
    sim.cast('A011');
    const angles = sim.projectiles.map(p => Math.atan2(p.vy, p.vx)).sort((a, b) => a - b);
    expect(angles).toHaveLength(8);
    for (let i = 1; i < 8; i++) expect(angles[i]! - angles[i - 1]!).toBeCloseTo(Math.PI / 4, 6);
    coverage.volley = 'R2-S01..12 #2';
    coverage.nova = 'R2-S01..12 #2';
    coverage.ringfire = 'R2-S01..12 #2 + frostFlame.test.ts';
  });

  it('tornado routes: roaming travels at the aim, orbit circles at 100, ambush is fixed at 80% damage', () => {
    const roaming = setup('H001', { A026: 3 }); roaming.journey.pick(2, { A026: 3 }, 'route', 'roaming');
    roaming.sim.enemies.push(target(1960)); roaming.sim.cast('A026');
    const rv = roaming.sim.vortices[0]!;
    expect(rv.follow).toBe(false);
    expect(Math.hypot(rv.vx, rv.vy)).toBeCloseTo(85, 6);
    // Aimed at the nearest target: the target is due east of the player, so the vortex goes east.
    expect(rv.vx).toBeCloseTo(85, 6); expect(rv.vy).toBeCloseTo(0, 6);

    const orbit = setup('H001', { A026: 3 }); orbit.journey.pick(2, { A026: 3 }, 'route', 'orbit');
    orbit.sim.enemies.push(target(1960)); orbit.sim.cast('A026');
    const ov = orbit.sim.vortices[0]!;
    expect(ov.follow).toBe(true);
    orbit.sim.player.x += 120; orbit.sim.player.y -= 60; orbit.sim.updateOuter(.05);
    // `CombatSimulation` re-places a following vortex on a 100-unit circle around the player.
    expect(Math.hypot(ov.x - orbit.sim.player.x, ov.y - orbit.sim.player.y)).toBeCloseTo(100, 6);

    const ambush = setup('H001', { A026: 3 }); ambush.journey.pick(2, { A026: 3 }, 'route', 'ambush');
    ambush.sim.enemies.push(target(1960)); ambush.sim.cast('A026');
    const av = ambush.sim.vortices[0]!;
    expect(av.follow).toBe(false);
    expect(Math.hypot(av.vx, av.vy)).toBe(0);
    expect(av.x).toBeCloseTo(1960, 6); expect(av.y).toBeCloseTo(1200, 6);
    expect(av.r / rv.r).toBeCloseTo(110 / 82, 6);
    expect(av.dmg / rv.dmg).toBeCloseTo(.8, 6);

    // The 220 reach is a cap, not the placement: a target at 2900 lands the field 220 away.
    const far = setup('H001', { A026: 3 }); far.journey.pick(2, { A026: 3 }, 'route', 'ambush');
    far.sim.enemies.push(target(2900)); far.sim.cast('A026');
    expect(far.sim.vortices[0]!.x - far.sim.player.x).toBeCloseTo(220, 6);

    routes.roaming = { ...(routes.roaming as object), follow: false, speed: 85 };
    routes.orbit = { ...(routes.orbit as object), follow: true, orbitRadius: 100 };
    routes.ambush = { ...(routes.ambush as object), follow: false, damageVsRoaming: .8, reach: 220 };
    coverage.roaming = 'R2-S01..12 #3'; coverage.orbit = 'R2-S01..12 #3'; coverage.ambush = 'R2-S01..12 #3 + windShadow.test.ts';
  });

  it('shadow-clone routes: hunter fires from a moving body, guard explodes from a fixed one', () => {
    for (const route of ['hunter', 'guard'] as const) {
      const { journey, sim } = setup('H012', { S001: 3 });
      journey.pick(2, { S001: 3 }, 'route', route);
      sim.cast('S001');
      const bodies = sim.renderState().summons as { x: number; guard: boolean; dmg: number; id: string }[];
      expect(bodies).toHaveLength(2);                       // min(6, 1 + m.count) at Lv.3, no P039
      expect(bodies.every(b => b.guard === (route === 'guard'))).toBe(true);
      expect(bodies[0]!.dmg).toBeCloseTo(sim.player.atk * .65, 6);
      // Delivery: guard explodes on the spot, hunter launches a blade at the target.
      const x0 = bodies[0]!.x;
      sim.player.x += 200; sim.enemies.push(target(x0));
      sim.updateOuter(.15);
      const after = (sim.renderState().summons as { x: number }[])[0]!;
      expect(after.x === x0).toBe(route === 'guard');
      if (route === 'guard') expect(sim.damageBy.S001).toBeGreaterThan(0);
      else expect(sim.projectiles.some(p => p.id === 'S001')).toBe(true);
      routes[route] = { ...(routes[route] as object), guard: route === 'guard', bodies: 2 };
    }
    coverage.hunter = 'R2-S01..12 #4 + evolutionCombat.test.ts'; coverage.guard = 'R2-S01..12 #4 + evolutionCombat.test.ts';
  });

  it('frost routes: glacier is a resident field, shatter is an instant ring of 200 vs 135', () => {
    const glacier = setup('H001', { G2_FROST: 3 }); glacier.journey.pick(2, { G2_FROST: 3 }, 'route', 'glacier');
    glacier.sim.enemies.push(target(1900)); glacier.sim.cast('G2_FROST');
    const field = glacier.sim.fields.find(f => f.id === 'G2_FROST')!;
    expect(field).toBeDefined();
    expect(field.follow).toBe(false);
    expect(field.chill).toBe(1.2);
    expect(field.dmg).toBeCloseTo(glacier.sim.player.atk * .18, 6);
    // A resident field ticks; the instant route has already dealt its damage by now.
    expect(glacier.sim.damageBy.G2_FROST ?? 0).toBe(0);

    const shatter = setup('H001', { G2_FROST: 3 }); shatter.journey.pick(2, { G2_FROST: 3 }, 'route', 'shatter');
    const m = skillModifier(shatter.sim.context, shatter.sim.state(), 'G2_FROST');
    const p = shatter.sim.player;
    shatter.sim.enemies.push(target(p.x + 200 * m.range - 5), target(p.x + 200 * m.range + 5));
    shatter.sim.cast('G2_FROST');
    expect(shatter.sim.fields).toHaveLength(0);
    expect(shatter.sim.enemies[0]!.hp).toBeLessThan(1e9);
    expect(shatter.sim.enemies[1]!.hp).toBe(1e9);           // the radius is 200 * m.range, not 135
    expect(shatter.sim.enemies[0]!.chilledUntil! - shatter.sim.time).toBeCloseTo(2 * m.duration, 6);

    routes.glacier = { ...(routes.glacier as object), field: true, chill: 1.2 };
    routes.shatter = { ...(routes.shatter as object), radiusFactor: 200 / 135, instant: true };
    coverage.glacier = 'R2-S01..12 #5 + elementalEvolution.test.ts';
    coverage.shatter = 'R2-S01..12 #5 + elementalEvolution.test.ts';
  });

  it('lightning routes: relay adds two jumps at 72%, thunderstrike drops the chain for 210%', () => {
    const perHit = (c: Cast) => c.dealt / c.hits;
    const base = drive('A013', 'H010', undefined, false, 5);
    const relay = drive('A013', 'H010', 'relay', false, 5);
    const strike = drive('A013', 'H010', 'thunderstrike', false, 5);
    expect(base.hits).toBe(2);                               // 2 + P023(0) + no bond
    expect(relay.hits).toBe(4);                              // exactly two more targets
    expect(perHit(relay) / perHit(base)).toBeCloseTo(.72, 6);
    // The strike stops the chain: it hits whatever shares the first target's 105 radius.
    expect(strike.hits).toBe(2);
    expect(strike.hits).toBeLessThan(relay.hits);
    expect(perHit(strike) / perHit(base)).toBeCloseTo(2.1, 6);

    routes.relay = { ...(routes.relay as object), extraJumps: 2, damagePerJump: .72 };
    routes.thunderstrike = { ...(routes.thunderstrike as object), chained: false, damagePerJump: 2.1 };
    coverage.relay = 'R2-S01..12 #6 + elementalEvolution.test.ts';
    coverage.thunderstrike = 'R2-S01..12 #6 + elementalEvolution.test.ts';
  });

  it('a picked route is never offered again, and no other route of that skill survives', () => {
    const skills = { A011: 3 };
    const run = new RunEvolution('H001');
    expect(run.special(2, skills).map(o => o.id)).toEqual(['volley', 'nova', 'ringfire']);
    expect(run.pick(2, skills, 'route', 'volley')).toBe(true);
    // The offer itself is gone, not merely the second pick.
    expect(run.special(2, skills)).toEqual([]);
    expect(run.snapshot(skills).routes).toEqual({ A011: 'volley' });

    // With a second skill qualified the offer moves on rather than repeating the first skill.
    const both = new RunEvolution('H001');
    expect(both.special(2, { A011: 3, A026: 3 }).map(o => o.id)).toEqual(['volley', 'nova', 'ringfire']);
    both.pick(2, { A011: 3, A026: 3 }, 'route', 'ringfire');
    expect(both.special(2, { A011: 3, A026: 3 }).map(o => o.id)).toEqual(['roaming', 'orbit', 'ambush']);
    both.pick(2, { A011: 3, A026: 3 }, 'route', 'orbit');
    expect(both.snapshot({}).routes).toEqual({ A011: 'ringfire', A026: 'orbit' });
  });

  it('a route needs its own skill at Lv.3 and survives the awakening, including at level 19', () => {
    const run = new RunEvolution('H001');
    // Level gate: a route for a skill at 0 or 2 is never offered.
    expect(run.special(2, { A011: 2 })).toEqual([]);
    expect(run.special(2, { A026: 0 })).toEqual([]);
    expect(run.special(2, { A011: 3 }).map(o => o.id)).toEqual(['volley', 'nova', 'ringfire']);
    // Unowned skill: a different skill's routes never stand in for it.
    expect(run.special(2, { A013: 3 }).map(o => o.id)).toEqual(['relay', 'thunderstrike']);
    expect(run.pick(2, { A013: 3 }, 'route', 'volley')).toBe(false);

    // Legacy pacing: form at 3, awakening at 8. The route must outlive both.
    run.pick(2, { A011: 3 }, 'route', 'nova');
    expect(run.pick(3, {}, 'hero', 'dragon')).toBe(true);
    expect(run.snapshot({}).routes).toEqual({ A011: 'nova' });
    expect(run.pick(8, { A011: 3 }, 'hero', 'awaken')).toBe(true);
    expect(run.snapshot({}).rank).toBe(2);
    expect(run.snapshot({}).routes).toEqual({ A011: 'nova' });

    // Paced pacing puts the awakening at 19; the same route is still there and still takes effect.
    const paced = new RunEvolution('H001', undefined, () => 0, 'paced');
    expect(paced.pick(10, {}, 'hero', 'dragon')).toBe(true);
    // At Lv.19 the awakening is the only offer: a route cannot be picked until it is taken.
    expect(paced.special(19, { A011: 3 }).map(o => o.id)).toEqual(['awaken']);
    expect(paced.pick(19, { A011: 3 }, 'route', 'nova')).toBe(false);
    expect(paced.pick(19, { A011: 3 }, 'hero', 'awaken')).toBe(true);
    expect(paced.pick(20, { A011: 3 }, 'route', 'nova')).toBe(true);
    expect(paced.snapshot({}).routes).toEqual({ A011: 'nova' });
  });

  it('A011 has an evolution row, and after it the route branch stops tracking the baseline', () => {
    // `E011` is reachable in production: `TimedChests` writes `sim.evolved[id]` directly, and its
    // `forms` argument is the simulation (`GameCore`). A011 at Lv.5 + P026 >= 1 opens it.
    const base = drive('A011', 'H001', undefined, false), baseEvo = drive('A011', 'H001', undefined, true);
    expect(base.n).toBe(1); expect(baseEvo.n).toBe(3);       // the legacy branch reads `m.evo`
    expect(baseEvo.total / base.total).toBeCloseTo(3, 6);

    const volley = drive('A011', 'H001', 'volley', true), nova = drive('A011', 'H001', 'nova', true), ring = drive('A011', 'H001', 'ringfire', true);
    // The route branch hard-codes its count and never reads `m.evo`, so the *total* is fixed
    // while the baseline triples: two of the three routes end up below an un-routed A011.
    expect(volley.total / baseEvo.total).toBeCloseTo(.65, 6);
    expect(nova.total / baseEvo.total).toBeCloseTo(1.45 / 3, 6);
    expect(ring.total / baseEvo.total).toBeCloseTo(1.2, 6);
    expect(volley.total).toBeLessThan(baseEvo.total);
    expect(nova.total).toBeLessThan(baseEvo.total);
    // Per-shot ratios still hold - the `detail` is written per shot, not per cast.
    expect(volley.total / volley.n / (baseEvo.total / baseEvo.n)).toBeCloseTo(.65, 6);
    expect(nova.total / nova.n / (baseEvo.total / baseEvo.n)).toBeCloseTo(1.45, 6);

    report.evolution = {
      A011: { baseline: { plain: base.total, evolved: baseEvo.total }, volleyVsEvolvedBase: .65, novaVsEvolvedBase: 1.45 / 3, ringfireVsEvolvedBase: 1.2 },
    };
    coverage.evolution = 'R2-S01..12 #9';
  });

  it('the evolution count bonus has exactly one reader, so E013 buys no extra jump', () => {
    // `skillModifier` grants `count++` on evolution. Only S001 reads `m.count`.
    const s001 = drive('S001', 'H012', 'hunter', false), s001Evo = drive('S001', 'H012', 'hunter', true);
    expect(s001.n).toBe(2); expect(s001Evo.n).toBe(3);       // read: 2 -> 3 bodies

    const a013 = drive('A013', 'H010', undefined, false, 5), a013Evo = drive('A013', 'H010', undefined, true, 5);
    expect(a013.hits).toBe(2);
    expect(a013Evo.hits).toBe(2);                            // dropped: the branch computes its own count
    expect(a013Evo.dealt / a013.dealt).toBeCloseTo(1.55, 6); // `m.dmg` still lands

    const relay = drive('A013', 'H010', 'relay', false, 5), relayEvo = drive('A013', 'H010', 'relay', true, 5);
    expect(relay.hits).toBe(4); expect(relayEvo.hits).toBe(4);

    const a026 = drive('A026', 'H001', 'roaming', false), a026Evo = drive('A026', 'H001', 'roaming', true);
    expect(a026Evo.r / a026.r).toBeCloseTo((108 * 1.25) / 82, 6); // read: radius, not count

    (report.evolution as Record<string, unknown>).countBonusReaders = { S001: 'bodies 2 -> 3', A013: 'hits 2 -> 2', A026: 'radius only', A011: 'legacy hand-rolls n = m.evo ? 3 : 1' };
    coverage.countBonus = 'R2-S01..12 #10';
  });

  it('writes the route report', () => {
    mkdirSync(dir, { recursive: true });
    const rows = Object.keys(routes);
    expect(rows).toHaveLength(12);
    expect(Object.keys(coverage).length).toBeGreaterThanOrEqual(12);
    writeFileSync(resolve(dir, 'route-report.json'), `${JSON.stringify({
      slice: 'R2-S01',
      routes,
      coverage,
      evolution: report.evolution,
      table: skillRoutes.map(r => ({ id: r.id, skill: r.skill, name: r.name, detail: r.detail })),
    }, null, 2)}\n`);
  });
});
