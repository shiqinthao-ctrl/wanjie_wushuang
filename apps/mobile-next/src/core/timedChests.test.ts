import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/chests-oracle.json';
import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import { Progression } from './progression';
import { TimedChests, chestTitle } from './timedChests';
import { generateGear } from './gearDrops';
import type { GearInstance } from './saveTypes';

function seeded(seed: number) {
  let calls = 0;
  return { random: () => { calls++; return ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }, calls: () => calls };
}
function setup(ready: string[] = [], evolved: string[] = []) {
  const start = calculateStartup(fresh), skills: Record<string, number> = { ...start.skills }, passives: Record<string, number> = { ...start.passives };
  for (const id of ready) {
    const [, skill, passive] = (oracle.config.evolution as Record<string, string[]>)[id]!;
    skills[skill!] = 5; passives[passive!] = 5;
  }
  const forms = { evolved: Object.fromEntries(evolved.map(id => [id, true])), fused: {} as Record<string, boolean> };
  const rng = seeded(12), progression = new Progression(fresh.build, skills, passives, rng.random), drops: GearInstance[] = [];
  const chests = new TimedChests(progression, forms, 'H001', drops, rng.random, () => oracle.clock);
  return { chests, forms, progression, drops, rng };
}
describe('effective legacy timed rewards', () => {
  it('uses three effective timestamps and waits for explicit claim', () => {
    const { chests } = setup();
    expect(chests.snapshot(0).rewards.map(item => item.at)).toEqual(oracle.schedule);
    expect(chests.snapshot(90).rewards.map(item => item.state)).toEqual(['ready', 'locked', 'locked']);
    expect(chests.snapshot(301).rewards.every(item => item.state === 'ready')).toBe(true);
    expect(chests.snapshot(301).offer).toBeUndefined();
  });
  for (const [index, item] of oracle.selections.entries()) it(`matches config priority case ${index}`, () => {
    const { chests } = setup(item.ready, item.evolved);
    expect(chests.claim(0, 90)).toBe(true);
    expect(chests.snapshot(90).offer!.options.map(chestTitle)).toEqual(item.titles);
  });
  it('blocks early, invalid and Boss Loot claims, then pays a choice only once', () => {
    const { chests, drops } = setup();
    expect(chests.claim(0, 89.99)).toBe(false);
    expect(chests.claim(-1, 90)).toBe(false);
    expect(chests.claim(0, 90, true)).toBe(false);
    expect(chests.claim(0, 90)).toBe(true);
    expect(chests.claim(1, 210)).toBe(false);
    expect(chests.pick(2, 2)).toBe(false);
    expect(chests.pick(1, 3)).toBe(false);
    expect(chests.pick(1, 2)).toBe(true);
    expect(chests.pick(1, 2)).toBe(false);
    expect(chests.claim(0, 300)).toBe(false);
    expect(drops).toHaveLength(1); expect(drops[0]!.source).toBe('chest'); expect(drops[0]!.rarity).toBe('purple');
    expect(chests.snapshot(300).rewards.map(item => item.state)).toEqual(['claimed', 'ready', 'ready']);
  });
  it('retains underlying evolution flags after fusion and excludes acquired forms', () => {
    const { chests, forms } = setup(['E011', 'E026'], ['E011', 'E026']);
    chests.claim(0, 90); expect(chests.pick(1, 0)).toBe(true);
    expect(forms).toEqual({ evolved: { E011: true, E026: true }, fused: { F001: true } });
    chests.claim(1, 210); expect(chests.snapshot(210).offer!.options.map(item => item.type)).toEqual(['upgrade', 'upgrade', 'gear']);
  });
  it('evolves only the offered form and upgrades only an owned non-maxed skill', () => {
    const { chests, forms, progression } = setup(['E011']);
    chests.claim(0, 90); chests.pick(1, 0);
    expect(forms.evolved).toEqual({ E011: true });
    const before = progression.snapshot(); chests.claim(1, 210); chests.pick(2, 0);
    const after = progression.snapshot();
    expect(after.skills.A011).toBe(5); expect(after.level).toBe(before.level);
    expect(Object.keys(after.skills)).toEqual(Object.keys(before.skills));
    const sum = (levels: typeof after) => Object.values({ ...levels.skills, ...levels.passives }).reduce((a, b) => a! + b!, 0);
    expect(sum(after)! - sum(before)!).toBe(1);
  });
  it.each(oracle.gear)('preserves purple gear and RNG for seed $seed', item => {
    const rng = seeded(item.seed);
    expect(generateGear('H001', 'chest', rng.random, () => oracle.clock)).toEqual(item.drop);
    expect(rng.calls()).toBe(item.calls);
  });
});
