import { describe, expect, it } from 'vitest';
import fixture from '../../../../tasks/mobile-modernization/baseline/progression-oracle.json';
import fresh from '../data/freshSave.json';
import difficulties from '../data/difficulties.json';
import { calculateStartup } from './growth';
import { Progression, XpField, effectiveXp } from './progression';

const seeded = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const startup = calculateStartup(fresh);
const progression = () => new Progression(fresh.build, startup.skills, startup.passives, () => .75);

describe('legacy crystal authority', () => {
  for (const item of fixture.crystals) it(item.name, () => {
    const field = new XpField();
    const difficulty = difficulties[item.difficulty as keyof typeof difficulties] ?? difficulties.normal;
    for (const enemy of item.enemies) field.spawn(enemy, effectiveXp(enemy.elite, difficulty.xp));
    expect(item.steps.map(dt => field.advance({ x: 0, y: 0 }, dt).value)).toEqual(item.collected);
    expect(field.snapshot()).toEqual(item.expected);
  });
  it('rejects invalid XP and does not allow a renderer to mutate crystals', () => {
    const field = new XpField();
    for (const value of [NaN, Infinity, 0, -1]) field.spawn({ x: 0, y: 0, elite: false }, value);
    expect(field.snapshot()).toEqual([]);
    field.spawn({ x: 400, y: 0, elite: false }, 4);
    const view = field.snapshot();
    expect(Object.isFrozen(view[0])).toBe(true);
    expect(effectiveXp(false, NaN)).toBe(4);
  });
});

describe('legacy level choices', () => {
  for (const item of fixture.pools) it(`${item.name}-${item.seed}`, () => {
    const levels = new Progression(fresh.build, item.skills, item.passives, seeded(item.seed));
    // The random comparator is engine-dependent. Exact ordering is checked in Chrome.
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
    expect(levels.validOptions().sort(byId)).toEqual([...item.expected].sort(byId));
  });
  for (const item of fixture.chains) it(`XP ${item.xp} choice chain`, () => {
    const levels = progression(); levels.gain(item.xp); levels.checkLevel();
    for (const expected of item.states) {
      const state = levels.snapshot();
      expect({ level: state.level, xp: state.xp, xpNeed: state.xpNeed, paused: !!state.choice, skills: state.skills, passives: state.passives, choices: state.choice?.options ?? [] }).toEqual(expected);
      if (state.choice) {
        const option = state.choice.options[0]!;
        expect(levels.pick(state.choice.token, option.kind, option.id)).toBe(true);
      }
    }
  });
  it('rejects stale and unoffered choices, including a double click across chained choices', () => {
    const levels = progression(); levels.gain(500); levels.checkLevel();
    const choice = levels.snapshot().choice!;
    expect(levels.pick(choice.token, 'active', 'not-offered')).toBe(false);
    const option = choice.options[0]!;
    expect(levels.pick(choice.token, option.kind, option.id)).toBe(true);
    const before = levels.snapshot();
    expect(levels.pick(choice.token, option.kind, option.id)).toBe(false);
    expect(levels.snapshot()).toEqual(before);
  });
  it('defers level checks when blocked and cannot overwrite an open choice', () => {
    const levels = progression(); levels.gain(500); levels.checkLevel(true);
    expect(levels.snapshot().level).toBe(1);
    levels.checkLevel(); const before = levels.snapshot(); levels.checkLevel();
    expect(levels.snapshot()).toEqual(before);
  });
  it('keeps the original one-check behavior when no upgrades remain', () => {
    const levels = new Progression(fresh.build, Object.fromEntries(fresh.build.active.map(id => [id, 5])), Object.fromEntries(fresh.build.passive.map(id => [id, 5])));
    levels.gain(500); levels.checkLevel();
    expect(levels.snapshot()).toMatchObject({ level: 2, xp: 474, xpNeed: 48, choice: undefined });
  });
});
