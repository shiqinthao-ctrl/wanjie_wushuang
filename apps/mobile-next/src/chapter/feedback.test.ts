import { expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { Progression } from '../core/progression';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
function make(chapter = true) {
  const prep = prepareChapterRun(fresh, options);
  return new CombatSimulation(fresh, chapter ? createChapterProgression(prep, () => .8) : new Progression(fresh.build, {}, {}, () => .8), () => .8, [], Date.now, chapter ? prep : undefined);
}
it('chapter reports actual HP damage, never invulnerable hits', () => {
  const sim = make(); sim.player.inv = 0; sim.hurt(20, 'EN001');
  expect(sim.takeEvents()).toContainEqual(expect.objectContaining({ type: 'battle-feedback', kind: 'player-hurt', source: 'EN001' }));
  sim.player.inv = 2; sim.hurt(20, 'EN001'); expect(sim.takeEvents()).toEqual([]);
});
it('chapter reports Boss arrival, phase, committed warning and death once', () => {
  const sim = make(); sim.time = 270; sim.bossEncounter.spawn(); sim.bossEncounter.spawn();
  expect(sim.takeEvents()).toEqual([expect.objectContaining({ kind: 'boss-arrive' })]);
  sim.boss!.hp = sim.boss!.maxHp * .6; sim.bossEncounter.updateAI(.01);
  expect(sim.takeEvents()).toEqual([expect.objectContaining({ kind: 'boss-phase' })]);
  sim.boss!.castLock = 0; sim.boss!.castCd = 0; sim.bossEncounter.updateAI(.01);
  expect(sim.takeEvents()).toEqual([expect.objectContaining({ kind: 'boss-warning' })]);
  sim.bossEncounter.defeat(); sim.bossEncounter.defeat();
  expect(sim.takeEvents()).toEqual([expect.objectContaining({ kind: 'boss-defeat' })]);
});
it('legacy receives no new feedback events', () => {
  const sim = make(false); sim.hurt(20); sim.time = 270; sim.bossEncounter.spawn();
  sim.bossEncounter.defeat(); expect(sim.takeEvents()).toEqual([]);
});
it('evolution emits once after an accepted choice, invalid repeated clicks emit nothing', () => {
  const core = new GameCore(fresh, () => .8, 'classic', options); core.start(390, 844);
  const p = (core as unknown as { progression: Progression }).progression;
  p.gain(74); core.advance(.016);
  expect(core.takeEvents()).toContainEqual({ type: 'level-choice', level: 2 });
  let offer = core.snapshot().choice!; const ordinary = offer.options[0]!; core.choose(offer.token, ordinary.kind, ordinary.id);
  expect(core.takeEvents()).toContainEqual({ type: 'level-choice', level: 3 });
  offer = core.snapshot().choice!; const form = offer.options[0]!; core.takeEvents();
  expect(core.choose(offer.token, form.kind, form.id)).toBe(true);
  expect(core.takeEvents()).toContainEqual(expect.objectContaining({ type: 'battle-feedback', kind: 'evolution', source: form.id }));
  expect(core.choose(offer.token, form.kind, form.id)).toBe(false); expect(core.takeEvents()).toEqual([]);
  core.destroy();
});
