import { afterAll, describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import fresh from '../data/freshSave.json';
import { prepareChapterRun } from './prepare';
import { createChapterProgression, seededRandom } from './growth';
import { chapterCoreSkills } from './catalog';
import { Progression } from '../core/progression';
import { RunEvolution, evolutionBuild } from '../core/RunEvolution';

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 0 } as const;
const seedSamples: { seed: number; offered: string[]; selected: string; core: string; awakenedAtLevel: number }[] = [];
afterAll(() => {
  if (!process.env.CHAPTER_SEED_REPORT) return;
  const ordered = seedSamples.sort((a, b) => a.seed - b.seed);
  const distribution = Object.fromEntries(['dragon', 'bulwark', 'frostlord', 'frostflame'].map(id => [id, {
    offered: ordered.filter(sample => sample.offered.includes(id)).length,
    positions: [0, 1, 2].map(index => ordered.filter(sample => sample.offered[index] === id).length),
    selected: ordered.filter(sample => sample.selected === id).length,
  }]));
  writeFileSync(process.env.CHAPTER_SEED_REPORT, JSON.stringify({ hero: 'H001', policy: 'Pick first evolution, then prioritize its core; isolated progression simulation, not balance evidence.', count: ordered.length, distribution, samples: ordered }, null, 2));
});
function make(seed = 0) { return createChapterProgression(prepareChapterRun(fresh, { ...options, seed }), seededRandom(seed)); }
function pick(p: Progression, id?: string) {
  const choice = p.snapshot().choice!;
  const option = choice.options.find(item => item.id === id) || choice.options[0]!;
  expect(p.pick(choice.token, option.kind, option.id)).toBe(true);
  return option;
}
function reachEvolution(p: Progression) {
  p.gain(74); p.checkLevel(); pick(p, 'A003');
  expect(p.snapshot().level).toBe(3);
  expect(p.snapshot().choice?.options.every(o => o.kind === 'hero')).toBe(true);
}
describe('chapter growth contract', () => {
  it('starts with one automatic, no passive and immutable snapshots', () => {
    const p = make(); expect(p.snapshot().skills).toEqual({ A003: 1 }); expect(p.snapshot().passives).toEqual({});
    expect(p.snapshot().growth).toMatchObject({ autoSlots: 4, passiveSlots: 4, rerolls: 2, banishes: 1 });
    expect(Object.isFrozen(p.snapshot().skills)).toBe(true);
  });
  it('evolution grants core, retains normal level reward, and rejects stale/double selections', () => {
    const p = make(); reachEvolution(p); const choice = p.snapshot().choice!;
    const form = choice.options[0]!; const core = chapterCoreSkills[form.id as keyof typeof chapterCoreSkills];
    const before = p.snapshot().skills[core] || 0;
    pick(p, form.id); expect(p.snapshot().skills[core]).toBe(Math.min(5, before + 1));
    expect(p.pick(choice.token, 'hero', form.id)).toBe(false);
    while (['hero', 'route'].includes(p.snapshot().choice?.options[0]?.kind || '')) pick(p);
    expect(p.snapshot().choice?.options.some(o => o.kind === 'active')).toBe(true);
  });
  it('awakening requires its own core and route selection is exclusive', () => {
    const journey = new RunEvolution('H001', 'chapter1-v1', seededRandom(0));
    const form = journey.special(3, { A003: 1 })[0]!;
    expect(journey.pick(3, { A003: 1 }, 'hero', form.id)).toBe(true);
    const core = journey.coreSkill()!;
    expect(journey.special(8, { [core]: 2, A011: 5 }).some(o => o.id === 'awaken')).toBe(false);
    expect(journey.special(8, { [core]: 3 })[0]?.id).toBe('awaken');
    expect(journey.pick(8, { [core]: 3 }, 'hero', 'awaken')).toBe(true);
    const routes = journey.special(8, { [core]: 3, A011: 3 });
    if (routes.length) { expect(journey.pick(8, { [core]: 3, A011: 3 }, 'route', routes[0]!.id)).toBe(true); expect(journey.pick(8, { [core]: 3, A011: 3 }, 'route', routes[0]!.id)).toBe(false); }
  });
  it('reroll/ban budgets only affect ordinary choices; owned/core cannot be banned', () => {
    const p = make(); p.gain(26); p.checkLevel();
    let choice = p.snapshot().choice!;
    expect(p.banish(choice.token, 'active', 'A003')).toBe(false);
    expect(p.reroll(choice.token)).toBe(true); expect(p.reroll(choice.token)).toBe(false);
    choice = p.snapshot().choice!;
    const unowned = choice.options.find(o => o.id !== 'A003')!;
    expect(p.banish(choice.token, unowned.kind, unowned.id)).toBe(true);
    expect(p.validOptions().some(o => o.id === unowned.id)).toBe(false);
    expect(p.snapshot().growth?.banishes).toBe(0);
    expect(p.reroll(p.snapshot().choice!.token)).toBe(true);
    expect(p.reroll(p.snapshot().choice!.token)).toBe(false);
    pick(p, 'A003'); p.gain(48); p.checkLevel();
    expect(p.banish(p.snapshot().choice!.token, 'hero', p.snapshot().choice!.options[0]!.id)).toBe(false);
  });
  it('full slots never offer unowned abilities and exhausted pools offer recovery', () => {
    const journey = new RunEvolution('H001', 'chapter1-v1', seededRandom(1));
    const p = new Progression(evolutionBuild('H001'), { A003: 5, A011: 5, A021: 5, A026: 5 }, { P026: 5, P016: 5, P017: 5, P018: 5 }, seededRandom(1), journey);
    expect(p.validOptions()).toEqual([{ kind: 'recovery', id: 'heal', label: '恢复 20% 最大生命' }]);
    p.gain(26); p.checkLevel(); pick(p, 'heal'); expect(p.snapshot().skills.A003).toBe(5);
  });
  for (let seed = 0; seed < 200; seed++) it(`seed ${seed}: deterministic distinct legal choices and reachable core awakening`, () => {
    const p = make(seed), replay = make(seed); reachEvolution(p); reachEvolution(replay);
    expect(p.snapshot()).toEqual(replay.snapshot());
    const forms = p.snapshot().choice!.options; expect(forms).toHaveLength(3); expect(new Set(forms.map(o => o.id)).size).toBe(3);
    pick(p); const core = p.journey!.coreSkill()!; p.gain(8000);
    for (let i = 0; i < 150 && p.journey!.snapshot(p.snapshot().skills).rank < 2; i++) {
      p.checkLevel(); const choice = p.snapshot().choice; if (!choice) continue;
      expect(new Set(choice.options.map(o => `${o.kind}:${o.id}`)).size).toBe(choice.options.length);
      if (choice.options[0]!.kind === 'active' && (p.snapshot().skills[core] || 0) < 3) expect(choice.options.some(o => o.id === core)).toBe(true);
      pick(p, core); expect(Object.keys(p.snapshot().skills).length).toBeLessThanOrEqual(4); expect(Object.keys(p.snapshot().passives).length).toBeLessThanOrEqual(4);
      expect(Object.values(p.snapshot().skills).every(v => v! <= 5)).toBe(true);
    }
    expect(p.journey!.snapshot(p.snapshot().skills).rank).toBe(2);
    seedSamples.push({ seed, offered: forms.map(form => form.id), selected: forms[0]!.id, core, awakenedAtLevel: p.snapshot().level });
  });
});
