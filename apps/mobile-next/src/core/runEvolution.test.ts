import { describe, expect, it } from 'vitest';
import { RunEvolution, evolutionBuild, pacingProfile } from './RunEvolution';
import { Progression } from './progression';

describe('run evolution contract', () => {
  it('locks branches to starter and level, then awakens without switching identity', () => {
    const run = new RunEvolution('H001');
    expect(run.special(2, {})).toEqual([]);
    expect(run.pick(3, {}, 'hero', 'void')).toBe(false);
    expect(run.pick(3, {}, 'hero', 'dragon')).toBe(true);
    expect(run.pick(3, {}, 'hero', 'bulwark')).toBe(false);
    expect(run.special(8, { A011: 2 })).toEqual([]);
    expect(run.pick(8, { A011: 3 }, 'hero', 'awaken')).toBe(true);
    expect(run.snapshot({}).rank).toBe(2);
    expect(run.snapshot({}).formId).toBe('dragon');
    expect(run.pick(9, { A011: 3 }, 'hero', 'awaken')).toBe(false);
  });
  it('draws the hero form and its awakening far later on the paced profile', () => {
    // R1g-4. G5 asks for the form at 90-120s and the awakening at 240-300s. Measured level
    // medians over 44 rules-only runs put Lv.10 at 99.6s and Lv.19 at 253.2s, so those are
    // the gates that put the median inside the band. Lv.9 / Lv.18 measure 87.6s / 234.2s -
    // just under both floors - and the GDD's own §9 suggestion (Lv.6 / Lv.14) measures
    // 48.6s / 168.8s, about twice as early. Neither is used.
    //
    // R1g-5 added `chestAt` to the profile. This assertion is the byte-identity contract for
    // the whole table, so it is spelled out rather than partially matched: `legacy` must keep
    // the original three chests at 90/210/300s, and only `paced` opens the fourth (G7).
    expect(pacingProfile()).toEqual({ form: 3, awaken: 8, passiveGate: 5, chestAt: [90, 210, 300] });
    expect(pacingProfile('paced')).toEqual({ form: 10, awaken: 19, passiveGate: 1, chestAt: [90, 165, 240, 300] });
    const paced = new RunEvolution('H001', undefined, () => 0, 'paced');
    // Nothing fires before its gate, and the hint the Run Guide renders says so.
    expect(paced.special(9, {}).some(option => option.kind === 'hero')).toBe(false);
    expect(paced.pick(9, {}, 'hero', 'dragon')).toBe(false);
    expect(paced.snapshot({}).next).toBe('Lv.10 选择英雄进化');
    expect(paced.pick(10, {}, 'hero', 'dragon')).toBe(true);
    expect(paced.snapshot({}).formId).toBe('dragon');
    // The awakening keeps the legacy shape - a level gate plus an owned active at Lv.3 -
    // and only the level moves.
    expect(paced.snapshot({}).next).toBe('Lv.19 + 任一主动 Lv.3 解锁觉醒');
    expect(paced.special(18, { A011: 3 }).some(option => option.id === 'awaken')).toBe(false);
    expect(paced.pick(18, { A011: 3 }, 'hero', 'awaken')).toBe(false);
    expect(paced.pick(19, { A011: 2 }, 'hero', 'awaken')).toBe(false);
    expect(paced.pick(19, { A011: 3 }, 'hero', 'awaken')).toBe(true);
    expect(paced.snapshot({}).rank).toBe(2);
    // The default profile is untouched by the new one existing: a bare instance still
    // takes its form at Lv.3, which is what every chapter run and legacy journey sees.
    expect(new RunEvolution('H001').pick(3, {}, 'hero', 'dragon')).toBe(true);
  });
  it('makes skill routes exclusive and rejects routes before skill level three', () => {
    const run = new RunEvolution('H010');
    expect(run.pick(2, { A011: 2 }, 'route', 'volley')).toBe(false);
    expect(run.pick(2, { A011: 3 }, 'route', 'volley')).toBe(true);
    expect(run.pick(2, { A011: 5 }, 'route', 'nova')).toBe(false);
    expect(run.snapshot({}).routes).toEqual({ A011: 'volley' });
  });
  it('counts distinct owned skills and reports every matching mechanical bond', () => {
    const run = new RunEvolution('H012');
    expect(run.snapshot({ A011: 5 }).bonds.filter(b => b.active)).toHaveLength(0);
    const view = run.snapshot({ A011: 1, A026: 1, A015: 1, A013: 1 });
    expect(view.bonds.filter(b => b.active).map(b => b.id)).toEqual(['wildfire', 'stormhunt', 'shadowfire', 'galephantom']);
    expect(Object.isFrozen(view.routes)).toBe(true);
    expect(Object.isFrozen(view.bonds[0]!.tags)).toBe(true);
    expect(Reflect.set(view.bonds[0]!.tags, '0', '影')).toBe(false);
    expect(run.bond('wildfire', { A011: 1, A026: 1 })).toBe(true);
    expect(new RunEvolution('H012').snapshot({}).rank).toBe(0);
  });
  it('does not permit unsupported starters', () => { expect(() => new RunEvolution('H002')).toThrow(); });
  it('queues extra evolution choices without spending XP or accepting stale taps', () => {
    const journey = new RunEvolution('H001'), build = evolutionBuild('H001');
    const p = new Progression(build, { A003: 1, A011: 1 }, { P026: 1 }, () => .75, journey);
    p.gain(74); p.checkLevel();
    for (let i = 0; i < 2; i++) {
      const offer = p.snapshot().choice!;
      const option = offer.options.find(o => o.id === 'A011') || offer.options[0]!;
      expect(p.pick(offer.token, option.kind, option.id)).toBe(true);
      expect(p.pick(offer.token, option.kind, option.id)).toBe(false);
    }
    expect(p.snapshot()).toMatchObject({ level: 3, xp: 0 });
    const form = p.snapshot().choice!;
    expect(form.options.map(o => o.id)).toEqual(['dragon', 'bulwark', 'frostlord', 'frostflame']);
    p.pick(form.token, 'hero', 'dragon');
    expect(journey.snapshot({}).formId).toBe('dragon');
    expect(p.snapshot().level).toBe(3);
  });
  it('keeps six slots and five levels, with seeded variety and an owned active option', () => {
    const journey = new RunEvolution('H001'), build = evolutionBuild('H001');
    const all = Object.fromEntries(build.active.slice(0, 6).map(id => [id, 5]));
    const p = new Progression(build, all, {}, () => .25, journey);
    expect(p.validOptions().some(o => o.kind === 'active')).toBe(false);
    const menus = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      let n = seed;
      const random = () => ((n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296);
      const p = new Progression(build, { A003: 1, A011: 1 }, { P026: 1 }, random, new RunEvolution('H001'));
      p.gain(26); p.checkLevel(); const options = p.snapshot().choice!.options;
      expect(options.some(o => o.kind === 'active' && ['A003', 'A011'].includes(o.id))).toBe(true);
      expect(new Set(options.map(o => o.id)).size).toBe(options.length);
      menus.add(options.map(o => o.id).join(','));
    }
    expect(menus.size).toBeGreaterThan(10);
  });
});
