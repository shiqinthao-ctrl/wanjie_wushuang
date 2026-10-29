import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { parseSchema30, previewBlocker } from '../storage/schema30';
import { chapterHeroes, chapterStages } from '../chapter/catalog';
import { OPEN_STAGES, prepareChapterRun, stageObjective } from '../chapter/prepare';
import { starters } from '../core/evolutionCatalog';

/**
 * R3-U06 - the door. Scope 0 (D33) found that everything behind it already existed and was tested;
 * what was missing was one page, one `:chapter` binding, one route member and one reset.
 *
 * The interesting assertions here are not the four connection points (D28-D32 already use that
 * shape). They are the two that decide whether the door is *correct*:
 *
 * 1. **The gate is a real call.** `previewBlocker` refuses a save whose `mode` is `endless` or whose
 *    `pet` is unknown - fields a chapter run never reads (`contracts.test.ts` measured that by
 *    preparing both saves and comparing). So a chapter entry that reused `previewBlocker` would
 *    refuse a save that can in fact play. The test below proves both halves at once: the legacy
 *    gate says no, `prepareChapterRun` says yes.
 * 2. **The reset exists.** `BattleView` branches on `chapter` at mount, so a stale `chapterOptions`
 *    would turn the next journey battle into a chapter run with no visible sign. Asserted on the
 *    order of the two statements, because clearing first would hand a live component `undefined`.
 */
const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.vue');
const panel = read('src/ui/ChapterPanel.vue');
const save = () => parseSchema30(JSON.stringify(fresh));
const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;

describe('the route exists and is wired to the prop BattleView reads', () => {
  it('has a union member, an import, a lobby button and a branch', () => {
    expect(app).toMatch(/page = ref<[^>]*'chapter'/);
    expect(app).toMatch(/import ChapterPanel from '\.\/ui\/ChapterPanel\.vue';/);
    expect(app).toMatch(/@click="page = 'chapter'"/);
    expect(app).toMatch(/<ChapterPanel v-else-if="page === 'chapter'/);
  });
  it('passes `:chapter` to BattleView - the one line that was missing', () => {
    // D33 (a): `App.vue` never passed it, which is why every chapter slice since D27 was
    // constructible and winnable and unreachable.
    expect(app).toMatch(/<BattleView[^>]*:chapter="chapterOptions"/);
    expect(app).toMatch(/const chapterOptions = shallowRef<ChapterRunOptions>\(\);/);
  });
  it('clears the options when returning to the lobby, and flips the page first', () => {
    const body = app.slice(app.indexOf('async function home()'), app.indexOf('function startChapter'));
    expect(body).toContain("page.value = 'home'; chapterOptions.value = undefined;");
    // Order: the page flip has to come first, or a live `BattleView` receives `chapter: undefined`.
    expect(body.indexOf("page.value = 'home'")).toBeLessThan(body.indexOf('chapterOptions.value = undefined'));
  });
  it('a chapter retry is a new run: same stage, new seed, no legacy gate', () => {
    // `onMounted` also appears in the `vue` import on line 2, so the slice end has to name the call.
    const body = app.slice(app.indexOf('async function replay'), app.indexOf('onMounted(load)'));
    expect(body).toContain('seed: Math.floor(Math.random() * 0x100000000)');
    // The chapter branch must bypass `previewBlocker`, for the same reason the panel does.
    expect(body).toMatch(/chapterOptions\.value \|\| !previewBlocker/);
  });
});

describe('the panel lists what can actually be opened', () => {
  it('filters the data by the policy instead of copying the list', () => {
    // `OPEN_STAGES` is the policy and `chapterStages` is the data; a panel that hardcoded three
    // ids would keep offering a stage the day one is closed.
    expect(panel).toContain('OPEN_STAGES');
    expect(panel).toMatch(/chapterStages\.filter\(stage => \(OPEN_STAGES as readonly string\[\]\)\.includes\(stage\.id\)\)/);
  });
  it('every open stage can actually be prepared', () => {
    expect(OPEN_STAGES).toHaveLength(chapterStages.length);
    for (const stageId of OPEN_STAGES) {
      expect(() => prepareChapterRun(save(), { ...options, stageId }), stageId).not.toThrow();
    }
  });
  it('gives each stage its own objective, derived from its own data', () => {
    const objectives = chapterStages.map(stageObjective);
    expect(new Set(objectives).size).toBe(chapterStages.length);
    expect(objectives[1]).toContain('界碑');
    expect(objectives[2]).toContain('精英');
    expect(objectives[0]).toContain('首领');
  });
  it('the three chapter heroes are exactly the three starters', () => {
    // `hero.id` from the lobby is passed straight in, so the two tables must not drift: a starter
    // missing from `chapterHeroes` would make its own stage unstartable.
    expect(starters.map(hero => hero.id).sort()).toEqual(Object.keys(chapterHeroes).sort());
  });
});

describe('the chapter gate is a real call, not the legacy condition list', () => {
  it('a save the legacy gate refuses can still start a chapter run', () => {
    const source = save();
    source.mode = 'endless'; source.selectedStage = 'ST012'; source.pet = 'FUTURE';
    // Half one: the legacy gate says no, and says why.
    expect(previewBlocker(source, 'classic')).toContain('仅支持');
    // Half two: the chapter path never reads those fields, so it starts.
    expect(() => prepareChapterRun(source, options)).not.toThrow();
  });
  it('the panel does not import the legacy gate at all', () => {
    // Not a style rule: importing it would invite the next reader to call it. Matched as a *call*
    // because the file's own comment names the function while explaining why it is not used - and a
    // scanner reads comments too.
    expect(panel).not.toMatch(/previewBlocker\s*\(/);
    expect(panel).not.toMatch(/launchBlocker\s*\(/);
  });
  it('a charm the build cannot name is refused with a sentence that names it', () => {
    // The one real way a prepared chapter run fails today. Asserted here because this page is the
    // first place a player can reach that error.
    const source = save(), progress = { ...structuredClone(source.mobileChapter ?? {}), version: 1 as const, chapters: { CH001: { stars: { 'CH001-01': 0, 'CH001-02': 0, 'CH001-03': 0 }, clears: { 'CH001-01': 0, 'CH001-02': 0, 'CH001-03': 0 } } }, discoveries: {}, charms: { unlocked: ['MC_DODGE', 'MC_GHOST'], equipped: 'MC_GHOST' }, reports: [] };
    source.mobileChapter = progress;
    expect(() => prepareChapterRun(source, options)).toThrow(/MC_GHOST/);
  });
});

describe('the star row is a rating now, and says so from data', () => {
  it('reads `chapters.stars` - the field D31 left write-only', () => {
    // Before this page, nothing in the app rendered `progress.chapters.stars`. It is the first
    // reader, which is why the panel is also the proof that D31's 0..3 range is reachable.
    expect(panel).toMatch(/chapters\.CH001\?\.stars\[id\]/);
  });
  it('takes the number of slots from `chapterStars.mastery`, not from a literal 3', () => {
    expect(panel).toContain('chapterStars.mastery');
    expect(panel).toMatch(/'★'\.repeat\(stars\) \+ '☆'\.repeat\(chapterStars\.mastery - stars\)/);
  });
  it('renders the best score, not the current run', () => {
    // `Math.max` in the writer is what makes "best" meaningful; the page must not sum or average.
    expect(panel).not.toContain('.clears[');
  });
});
