import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import difficulties from '../data/difficulties.json';
import stage from '../data/firstStage.json';
import { parseSchema30 } from '../storage/schema30';
import { createEnemy, difficultyFor, difficultyIds, director } from '../core/spawnRules';
import { prepareChapterRun } from './prepare';
import { readChapterProgress } from './progress';
import { settleChapterRun } from './settlement';
import type { ChapterFinalRun } from './settlement';
import { reportRows } from './reports';

/**
 * R3-U07 - the four rows the data already had, and the one comparison that refused three of them.
 *
 * Scope 0 (D38) measured before anything changed:
 *
 * - `difficulty` appeared at fourteen sites; the door was **two lines** - the type literal
 *   `difficulty: 'normal'` and the comparison `options.difficulty !== 'normal'`.
 * - Of the **eight** numeric coefficients (TASK said nine; it is eight numbers plus `name`/`desc`),
 *   six are live on this path and two are not: `gold` is read only by the *legacy* settlement and
 *   `drop` by nothing at all.
 * - Widening the type does **not** reach the save schema, and that was the finding: `ChapterReport`
 *   had no difficulty field and `chapters.stars` is keyed by stage alone, so two tiers wrote one
 *   record. The report field is this slice's answer; the shared star cell is disclosed on the page
 *   instead of being silently fixed.
 * - Fifteen tests hardcode `difficulty: 'normal'`; exactly one changed meaning - the
 *   `{ difficulty: 'hard' }` row in `contracts.test.ts`'s reject list, which now has to be accepted.
 */

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;
const save = () => parseSchema30(JSON.stringify(fresh));
const final = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
  ...options, endReason: 'victory', time: 310, hp: 200, maxHp: 620, level: 8, kills: 150,
  formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire', 'shadowfire'],
  damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true,
  sealsHeld: 0, elitesChecked: 0, ...change,
});
const optionsOf = (run: ChapterFinalRun) => ({
  ruleset: run.ruleset, chapterId: run.chapterId, stageId: run.stageId, heroId: run.heroId,
  mode: run.mode, difficulty: run.difficulty, seed: run.seed,
});
function settled(runs: readonly ChapterFinalRun[], source = save()) {
  return runs.reduce((acc, run, index) => {
    const prepared = prepareChapterRun(acc, optionsOf(run));
    return settleChapterRun(acc, prepared, run, `run-${index + 1}`).save;
  }, source);
}

const IDLE = { time: 0, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 };
const PLAYER = { x: 400, y: 400, hp: 620, maxHp: 620, atk: 30 };
const VIEWPORT = { width: 390, height: 844 }, WORLD = { width: 1600, height: 1600 };

describe('the door is the data, not a literal', () => {
  it('takes the four ids from the table, in its own order', () => {
    // Not `['easy', 'normal', 'hard', 'nightmare']` written out here: a fifth row added to the JSON
    // must appear in the selector and in this assertion without either file being edited.
    expect(difficultyIds).toEqual(Object.keys(difficulties));
    expect(difficultyIds).toHaveLength(4);
  });
  it('prepares all four, and the preparation echoes the one that was asked for', () => {
    for (const id of difficultyIds) {
      const prepared = prepareChapterRun(save(), { ...options, difficulty: id });
      expect(prepared.difficulty, id).toBe(id);
      // The stage and the player do not move with the tier: difficulty is read by the simulation,
      // not baked into the preparation. If it were baked in, `prepare` would be a second source.
      expect(prepared.stage, id).toEqual(prepareChapterRun(save(), options).stage);
      expect(prepared.player, id).toEqual(prepareChapterRun(save(), options).player);
    }
  });
  it('refuses a string that is not in the table instead of silently playing it as normal', () => {
    // `difficultyFor` falls back to `normal` for anything unknown. That fallback is right for a
    // *lookup* and wrong for a *door*: it would let `difficulty: 'nightmare '` (trailing space) run
    // a normal game that the player chose as the hardest one.
    expect(() => prepareChapterRun(save(), { ...options, difficulty: 'future' })).toThrow('难度');
    expect(() => prepareChapterRun(save(), { ...options, difficulty: 'Nightmare' })).toThrow('难度');
    expect(() => prepareChapterRun(save(), { ...options, difficulty: 'nightmare ' })).toThrow('难度');
    expect(difficultyFor('future')).toBe(difficulties.normal);
  });
  it('keeps `normal` a pure identity, which is why every shipped run is byte-identical', () => {
    // Eight numbers, all exactly 1. This is the whole argument for "opening the door changed no
    // existing run": every one of them multiplies, so 1 is a no-op. If someone tunes `normal`, this
    // goes red and they have to say out loud that they moved every shipped run.
    const row = difficulties.normal as Record<string, unknown>;
    for (const key of ['hp', 'dmg', 'speed', 'budget', 'elite', 'gold', 'drop', 'xp']) expect(row[key], key).toBe(1);
    // And the other three rows are not identity, or the door would open onto four identical rooms.
    for (const id of difficultyIds.filter(id => id !== 'normal')) {
      const other = difficulties[id] as Record<string, unknown>;
      expect(['hp', 'dmg', 'speed', 'budget', 'elite'].some(key => other[key] !== 1), id).toBe(true);
    }
  });
});

describe('the six live coefficients reach the simulation, in the right direction', () => {
  it('spawns slower on easy than on nightmare, strictly, across all four', () => {
    // `director`'s interval divides by `wave.budget * diff.budget * pressure`, so a higher tier
    // means a shorter interval. Asserted as a chain rather than one pair: a table with two tiers
    // swapped would pass `easy > nightmare` and fail here.
    const intervals = difficultyIds.map(id => director(IDLE, PLAYER, id).interval);
    expect(intervals).toEqual([...intervals].sort((a, b) => b - a));
    expect(new Set(intervals).size).toBe(difficultyIds.length);
  });
  it('rolls elites more often on nightmare than on easy', () => {
    const chances = difficultyIds.map(id => director(IDLE, PLAYER, id).eliteChance);
    expect(chances).toEqual([...chances].sort((a, b) => a - b));
    expect(chances.at(-1)!).toBeGreaterThan(chances[0]!);
  });
  it('gives the same enemy hp, damage and speed in the ratio the table declares', () => {
    // One enemy id pinned, one constant random, so the only thing that differs between the calls is
    // the tier. The ratios are read off the data, not written as literals here.
    const spawn = (id: string) => createEnemy(IDLE, PLAYER, VIEWPORT, WORLD, id, () => .5, { id: 'EN001', elite: false });
    const easy = spawn('easy'), nightmare = spawn('nightmare');
    const ratio = (key: 'hp' | 'damage' | 'speed') => nightmare[key] / easy[key];
    expect(ratio('hp')).toBeCloseTo(difficulties.nightmare.hp / difficulties.easy.hp, 6);
    expect(ratio('damage')).toBeCloseTo(difficulties.nightmare.dmg / difficulties.easy.dmg, 6);
    expect(ratio('speed')).toBeCloseTo(difficulties.nightmare.speed / difficulties.easy.speed, 6);
    // And `normal` is the same enemy the legacy path would have produced: identity again. The
    // stage-wide `rule.hp` scaler sits *after* the difficulty multiply, so it belongs in the
    // expected value - leaving it out is how a "byte-identical" claim quietly stops being true.
    const normal = spawn('normal');
    expect(normal.hp).toBeCloseTo(stage.enemies.EN001.hp * stage.rule.hp, 6);
    expect(normal.damage).toBeCloseTo(stage.enemies.EN001.damage * stage.rule.dmg, 6);
  });
  it('leaves the two dead coefficients dead, so the selector does not advertise them', () => {
    // `gold` is read only by `core/settlement.ts` (the legacy track) and chapter settlement pays
    // nothing - D31 asserted that. `drop` is read by nothing: `gearDrops` keys off the difficulty
    // *name* for mythic odds. Both are non-identity in the table, so a page that showed them would
    // be promising a yield this mode cannot pay.
    expect(difficulties.hard.gold).not.toBe(1);
    expect(difficulties.hard.drop).not.toBe(1);
    const panel = readFileSync(resolve(process.cwd(), 'src/ui/ChapterPanel.vue'), 'utf8');
    const levers = panel.slice(panel.indexOf('const LEVERS'), panel.indexOf('] as const;'));
    expect(levers).not.toMatch(/'gold'/);
    expect(levers).not.toMatch(/'drop'/);
    // The omission is documented where it happens, naming both keys - so the next reader does not
    // have to re-derive which two of the eight are missing.
    expect(panel).toMatch(/`gold` is read only by the \*\*legacy\*\* settlement/);
    expect(panel).toMatch(/`drop` is read by nothing/);
  });
});

describe('the record carries the tier', () => {
  it('writes the difficulty into the report and reads it back', () => {
    const run = final({ difficulty: 'nightmare' });
    const result = settleChapterRun(save(), prepareChapterRun(save(), optionsOf(run)), run, 'run-1');
    const report = readChapterProgress(result.save).reports[0]!;
    expect(report.difficulty).toBe('nightmare');
    expect(result.result.report.difficulty).toBe('nightmare');
    // The rest of the row is unchanged: the tier is a new column, not a new outcome.
    expect(report.stars).toBe(2);
  });
  it('treats a report written before this field as normal - a proof, not a guess', () => {
    // From D27 until D38 `prepareChapterRun` accepted exactly one difficulty, so every report that
    // can exist without this field was written by a normal run. The default is sound *because* the
    // door was shut; if the door had ever been open, the same default would be a lie.
    const source = settled([final()]);
    const progress = readChapterProgress(source);
    const stripped = JSON.parse(JSON.stringify(source));
    delete stripped.mobileChapter.reports[0].difficulty;
    const reread = readChapterProgress(parseSchema30(JSON.stringify(stripped)));
    expect(reread.reports[0]!.difficulty).toBeUndefined();
    expect(reportRows(parseSchema30(JSON.stringify(stripped))).rows[0]!.difficulty).toBe('normal');
    expect(reportRows(parseSchema30(JSON.stringify(stripped))).rows[0]!.difficultyName).toBe(difficulties.normal.name);
    expect(progress.reports[0]!.difficulty).toBe('normal');
  });
  it('refuses a report whose difficulty is not one the table declares', () => {
    const source = settled([final()]);
    const tampered = JSON.parse(JSON.stringify(source));
    tampered.mobileChapter.reports[0].difficulty = 'future';
    expect(() => readChapterProgress(parseSchema30(JSON.stringify(tampered)))).toThrow('战报难度');
  });
  it('refuses to settle a run whose tier is not the one that was prepared', () => {
    // The check already existed (`validateChapterFinal` compares all seven keys); before the door
    // opened it was unreachable, because every preparation was `normal` and every run that passed
    // validation was too. Now it is the thing standing between a `hard` preparation and a `normal`
    // report.
    const prepared = prepareChapterRun(save(), { ...options, difficulty: 'hard' });
    expect(() => settleChapterRun(save(), prepared, final({ difficulty: 'normal' }), 'run-1')).toThrow('本局配置.difficulty');
  });
});

describe('a rate over two different games is not a rate', () => {
  it('withholds the win rate when the window mixes tiers, and names them', () => {
    // D29 refused a rate below five runs and a median across outcomes. The door opened a third way
    // for the denominator to stop meaning one thing, so it is refused the same way.
    const runs = [final({ difficulty: 'normal' }), final({ difficulty: 'normal' }), final({ difficulty: 'normal' }),
      final({ difficulty: 'normal' }), final({ difficulty: 'nightmare' })];
    const reports = reportRows(settled(runs));
    expect(reports.summary.runs).toBe(5);
    expect(reports.summary.tiers).toEqual(['normal', 'nightmare']);
    expect(reports.summary.winRate).toBeNull();
  });
  it('reports the rate again as soon as the window holds one tier', () => {
    const runs = Array.from({ length: 5 }, () => final({ difficulty: 'hard' }));
    const reports = reportRows(settled(runs));
    expect(reports.summary.tiers).toEqual(['hard']);
    expect(reports.summary.winRate).toBe(1);
    expect(reports.rows.every(row => row.difficultyName === difficulties.hard.name)).toBe(true);
  });
  it('lists the tiers in table order, not in the order the runs happened', () => {
    const runs = [final({ difficulty: 'nightmare' }), final({ difficulty: 'easy' })];
    expect(reportRows(settled(runs)).summary.tiers).toEqual(['easy', 'nightmare']);
  });
});

describe('the chosen tier outlives the page', () => {
  const page = readFileSync(resolve(process.cwd(), 'src/ui/ChapterPanel.vue'), 'utf8');
  const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
  it('is owned by `App.vue`, not by a `ref` inside the panel', () => {
    // The page is a `v-else-if` branch, so a `ref` here is destroyed on every route change: pick
    // 万界劫, look at the codex, come back, and the next run is `normal` without anyone choosing it.
    // D33 fixed exactly this shape for `chapterOptions`; a difficulty that resets is the same bug
    // with a smaller blast radius.
    expect(page).not.toMatch(/ref<DifficultyId>/);
    expect(page).toMatch(/difficulty: DifficultyId }>/);
    expect(page).toMatch(/\$emit\('difficulty', tier\.id\)/);
    expect(app).toMatch(/const chapterDifficulty = shallowRef<DifficultyId>\('normal'\)/);
    expect(app).toMatch(/:difficulty="chapterDifficulty"/);
  });
  it('is not cleared on the way back to the lobby - it is a preference, not part of one run', () => {
    // The mirror of D33's assertion: `home()` clears `chapterOptions` (one run) and must leave the
    // tier alone (a session preference). Asserted as an absence, because "we forgot to clear it"
    // and "we deliberately keep it" look identical in a diff.
    const body = app.slice(app.indexOf('async function home()'), app.indexOf('function startChapter'));
    expect(body).toContain('chapterOptions.value = undefined');
    expect(body).not.toContain('chapterDifficulty');
  });
});
