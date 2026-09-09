import { describe, expect, it } from 'vitest';
import { RunEvolution, evolutionBuild } from './RunEvolution';
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
    expect(form.options.map(o => o.id)).toEqual(['dragon', 'bulwark', 'frostlord']);
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
