import { expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { validateChapterFinal } from './settlement';
import { prepareChapterRun } from './prepare';
import type { GameSave } from '../core/saveTypes';
import type { CombatSimulation } from '../core/CombatSimulation';
const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
const simOf = (core: GameCore) => (core as unknown as { combat: CombatSimulation }).combat;
it('chapter startup and seeded battle ignore rich legacy hero/equipment/runes/pet', () => {
  const rich: GameSave = structuredClone(fresh);
  rich.hero = 'H010'; rich.heroes.H001!.level = 99; rich.heroes.H001!.star = 6; rich.heroes.H001!.awakened = true;
  rich.runes = ['R001', 'R022', 'R041']; rich.pet = 'PET005'; rich.difficulty = 'nightmare';
  rich.inventory.gearInstances.push({ uid: 'legacy-rich', templateId: 'test', slot: 'weapon', rarity: 'mythic', score: 999, affixes: [{ key: 'atkPct', value: 9 }] });
  rich.equipInst.weapon = 'legacy-rich'; rich.talents = { T001: 99, T002: 99 };
  const a = new GameCore(fresh, () => { throw new Error('external rng used'); }, 'classic', options), b = new GameCore(rich, () => .9, 'evolution', options);
  a.start(); b.start(); expect(a.renderState().player).toMatchObject({ hp: 620, atk: 108, speed: 240, crit: .05 });
  for (let i = 0; i < 600; i++) { a.advance(1 / 60); b.advance(1 / 60); }
  expect(a.renderState()).toEqual(b.renderState()); expect(a.snapshot()).toEqual(b.snapshot());
  expect(a.renderState().pet.enabled).toBe(false); expect(simOf(a).petDamage).toBe(0);
  expect(a.claimChest(0)).toBe(false); expect(a.interact()).toBe(false); expect(a.snapshot().map.target).toBeUndefined();
  a.destroy(); b.destroy();
});
it('chapter final is isolated from legacy settlement and validates real captured defeat', () => {
  const core = new GameCore(fresh, Math.random, 'classic', options); core.start();
  const sim = simOf(core); sim.hurt(1e6, 'test-source'); core.advance(.016);
  expect(core.snapshot().endReason).toBe('defeat'); expect(core.finalRun()).toBeUndefined();
  const final = core.chapterFinalRun()!;
  expect(final).toMatchObject({ ...options, hp: 0, level: 1, formId: null, awakened: false, bossLootClaimed: false });
  expect(final.damageTakenBy['test-source']).toBe(620);
  expect(() => validateChapterFinal(prepareChapterRun(fresh, options), final)).not.toThrow();
  expect(Object.isFrozen(final)).toBe(true);
  core.destroy(); expect(core.chapterFinalRun()).toBe(final);
});
it('chapter boss confirmation has priority at deadline, grants no legacy gear and settles once', () => {
  const core = new GameCore(fresh, Math.random, 'classic', options); core.start(); const sim = simOf(core);
  sim.time = 269; expect(sim.bossEncounter.spawn()).toBe(false);
  sim.time = 270; expect(sim.bossEncounter.spawn()).toBe(true);
  sim.time = 359.9; sim.bossEncounter.defeat(); sim.time = 360.2;
  expect(sim.bossEncounter.updateObjective()).toBeUndefined(); expect(sim.bossEncounter.snapshot().chapterLoot).toBe(true);
  core.advance(.016); expect(core.snapshot().status).toBe('boss-loot');
  expect(core.pickChapterLoot()).toBe(true); expect(core.pickChapterLoot()).toBe(false);
  for (let i = 0; i < 100; i++) core.advance(.016);
  expect(core.snapshot().endReason).toBe('victory'); expect(sim.drops).toEqual([]);
  expect(() => validateChapterFinal(prepareChapterRun(fresh, options), core.chapterFinalRun()!)).not.toThrow();
  core.destroy();
});
it('chapter rejects future unsupported heroes/stages before starting a loop', () => {
  expect(() => new GameCore(fresh, Math.random, 'classic', { ...options, heroId: 'H010' })).toThrow('H001');
});
