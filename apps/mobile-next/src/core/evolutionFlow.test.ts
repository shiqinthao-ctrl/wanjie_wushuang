import { expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { GameCore } from './GameCore';
import { settleRun } from './settlement';
import { FirstStageEvents } from './firstEvents';
import { previewBlocker } from '../storage/schema30';
import type { GameSave } from './saveTypes';
import type { CombatSimulation } from './CombatSimulation';
import type { Progression } from './progression';

// Synthetic fixtures exercise authority and persistence without changing natural tests.
function setup(hero = 'H001') {
  const save: GameSave = { ...structuredClone(fresh), hero, future: { keep: 'original' } };
  const core = new GameCore(save, () => .8, 'evolution'); core.start();
  const { combat: sim, progression: p } = core as unknown as { combat: CombatSimulation; progression: Progression };
  return { save, core, sim, p };
}
for (const hero of ['H001', 'H010', 'H012']) it(`${hero} preserves preparation and settles growth only to the starter`, () => {
  const { save, core, sim, p } = setup(hero), before = structuredClone(save);
  p.gain(400);
  for (let i = 0; i < 15; i++) { core.advance(.01); const choice = core.snapshot().choice; if (!choice) break; const option = choice.options[0]!; core.choose(choice.token, option.kind, option.id); }
  expect(core.snapshot().journey?.rank).toBe(1);
  sim.player.hp = 0; core.advance(.01);
  const run = core.finalRun()!; expect(run.journey?.rank).toBe(1);
  expect(run.build).toEqual(before.build); expect(Object.isFrozen(run.journey)).toBe(true);
  const { save: after, result } = settleRun(save, run);
  expect(result.journey).toEqual(run.journey); expect(result.stars).toBe(0);
  expect(after.heroes[hero]!.mastery).toBeGreaterThan(before.heroes[hero]!.mastery);
  for (const id of Object.keys(save.heroes).filter(id => id !== hero)) expect(after.heroes[id]).toEqual(before.heroes[id]);
  expect(after.build).toEqual(before.build); expect(after.future).toEqual(before.future); expect(save).toEqual(before);
  const replay = new GameCore(after, () => .8, 'evolution'); replay.start();
  expect(replay.snapshot().journey).toMatchObject({ heroId: hero, rank: 0, routes: {} });
  expect(replay.snapshot().level).toBe(1); core.destroy(); replay.destroy();
});
it('evolution choices freeze movement, reject paused/stale input and retain cooldowns', () => {
  const { core, sim, p } = setup(); core.action('skill'); const cd = sim.player.skillCd;
  p.gain(26); core.advance(.02); const choice = core.snapshot().choice!, point = { x: sim.player.x, y: sim.player.y };
  core.move(1, 1); core.advance(1); expect(sim.player.skillCd).toBe(cd); expect(sim.player).toMatchObject(point);
  core.pause(); expect(core.choose(choice.token, choice.options[0]!.kind, choice.options[0]!.id)).toBe(false);
  core.resume(); expect(core.choose(choice.token, choice.options[0]!.kind, choice.options[0]!.id)).toBe(true);
  expect(core.choose(choice.token, choice.options[0]!.kind, choice.options[0]!.id)).toBe(false);
  core.destroy(); expect(core.renderState().summons).toEqual([]);
});
it('evolution supports a retained unmigrated build but still blocks unrelated preparation', () => {
  const { save } = setup('H010'); save.build = { active: ['A099'], passive: ['P099'] };
  expect(previewBlocker(save)).not.toBe(''); expect(previewBlocker(save, 'evolution')).toBe('');
  const core = new GameCore(save, () => .8, 'evolution'); core.start();
  expect(core.snapshot().skills).toEqual({ A011: 1, A054: 1 }); expect(save.build.active).toEqual(['A099']);
  for (const override of [{ pet: 'PET002' }, { mode: 'endless' }, { difficulty: 'hard' }, { hero: 'H002' }]) expect(previewBlocker({ ...save, ...override }, 'evolution')).not.toBe('');
  save.heroes.H010!.unlocked = false; expect(() => new GameCore(save, Math.random, 'evolution')).toThrow(/解锁/); core.destroy();
});
it('journey merchant rejects unsupported firepower before payment and keeps valid choices', () => {
  const { core, sim, p } = setup();
  const events = new FirstStageEvents(sim.player, p, 'H001', () => .1);
  expect(events.open(45)).toBe(true);
  const offer = events.snapshot().offer!;
  expect(events.accepts(offer.token, 'merchantAtk')).toBe(false);
  expect(events.resolve(offer.token, 'merchantAtk', { gold: 5750, affordable: true })).toBe(false);
  expect(events.snapshot()).toMatchObject({ offer, shopBuff: 0 });
  expect(events.accepts(offer.token, 'merchantHeal')).toBe(true);
  expect(events.accepts(offer.token, 'skip')).toBe(true);
  core.destroy();
});
