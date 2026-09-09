import { Progression } from '../core/progression';
import { RunEvolution, evolutionBuild } from '../core/RunEvolution';
import type { ChapterPreparation } from './prepare';

/** Mulberry32: one rules stream per run; presentation must never consume it. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function createChapterProgression(preparation: ChapterPreparation, random: () => number) {
  return new Progression(evolutionBuild(preparation.heroId), preparation.skills, preparation.passives, random,
    new RunEvolution(preparation.heroId, preparation.ruleset, random));
}
