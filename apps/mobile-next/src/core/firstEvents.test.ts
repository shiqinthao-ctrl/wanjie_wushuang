import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/first-events-oracle.json';
import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import { Progression } from './progression';
import { FirstStageEvents, eventPayment, type EventCode } from './firstEvents';
import { generateGear } from './gearDrops';

function seeded(seed: number) {
  let calls = 0;
  return { random: () => { calls++; seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }, calls: () => calls };
}
function setup(seed = 12) {
  const rng = seeded(seed), startup = calculateStartup(fresh);
  const progression = new Progression(fresh.build, startup.skills, startup.passives, rng.random);
  const player = { hp: 100, maxHp: startup.player.maxHp };
  return { rng, progression, player, events: new FirstStageEvents(player, progression, 'H001', rng.random, () => oracle.clock) };
}
describe('first-stage events: isolated effective legacy oracle', () => {
  it.each(oracle.gear)('matches gear and RNG consumption for seed $seed', item => {
    const rng = seeded(item.seed);
    expect(generateGear('H001', 'gold', rng.random, () => oracle.clock)).toEqual(item.drop);
    expect(rng.calls()).toBe(item.calls);
  });
  it.each(oracle.choices)('matches $code with gold $before.gold', item => {
    const { events, player, progression, rng } = setup();
    const payment = eventPayment(item.code as EventCode, item.before.gold);
    events.apply(item.code as EventCode, payment);
    expect(payment.gold).toBe(item.gold);
    expect(player.hp).toBeCloseTo(item.hp);
    expect(events.snapshot().shopBuff).toBe(item.buff);
    expect(events.drops).toEqual(item.drops);
    if (item.code === 'goldOpen') {
      // Random sort can differ between Node and Chrome. Exact choice/order has a Chrome oracle check.
      const { skills, passives } = progression.snapshot();
      expect(Object.values({ ...skills, ...passives }).reduce((a, b) => a! + b!, 0)).toBe(4);
      expect(Object.keys(skills)).toEqual(['A011', 'A021']);
      expect(Object.keys(passives)).toEqual(['P026']);
    } else {
      expect(progression.snapshot().skills).toEqual(item.skills);
      expect(progression.snapshot().passives).toEqual(item.passives);
      expect(rng.calls()).toBe(item.calls);
    }
  });
  it('opens milestones once in source order and only draws one event', () => {
    const { events, rng } = setup();
    expect(events.open(44.99)).toBe(false);
    expect(rng.calls()).toBe(0);
    expect(events.open(45)).toBe(true);
    expect(events.snapshot().offer?.token).toBe(1);
    expect(events.open(150)).toBe(false);
    expect(events.resolve(99, 'skip', eventPayment('skip', 0))).toBe(false);
    expect(events.resolve(1, 'skip', eventPayment('skip', 0))).toBe(true);
    expect(events.resolve(1, 'goldCash', eventPayment('goldCash', 0))).toBe(false);
    expect(events.open(150)).toBe(true);
    expect(events.snapshot().offer?.token).toBe(2);
    expect(events.resolve(2, 'skip', eventPayment('skip', 0))).toBe(true);
    expect(events.open(360)).toBe(false);
    expect(rng.calls()).toBe(2);
  });
  it('rejects an option outside the offered event', () => {
    const { events } = setup(); events.open(45);
    const wrong = events.snapshot().offer?.kind === 'merchant' ? 'goldCash' : 'merchantHeal';
    expect(events.resolve(1, wrong, eventPayment(wrong, 6000))).toBe(false);
    expect(events.snapshot().offer?.token).toBe(1);
  });
  it('gold chest never unlocks absent skills or overlevels maxed skills', () => {
    const progression = new Progression(fresh.build, { A011: 5 }, {});
    expect(progression.upgradeOwned()).toBeUndefined();
    expect(progression.snapshot().skills).toEqual({ A011: 5 });
    expect(progression.snapshot().level).toBe(1);
  });
});
