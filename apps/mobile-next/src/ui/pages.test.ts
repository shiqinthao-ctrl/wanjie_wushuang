import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * R3-U01..05 - the pages and their six states. Scope 0 (D32) counted the matrix first:
 *
 * - Eight routes exist, not the four the queue still claims. One of the five pages the queue
 *   names - "章节" - does not exist at all; the chapter entry is `R3-U06`.
 * - Two holes were not missing states but **false sentences**: `ReportsPanel` still told the
 *   player "a win is 1 star" after D31 changed it to 0..3, and `ChapterResult` still said charm
 *   effects were "coming in a later build" after D30 shipped them. Both were written before the
 *   slice that made them wrong and shipped in the same commit as that slice.
 * - Five pages had no narrow-screen breakpoint at all.
 * - `transactOnce` fails in two ways; only `BattleView` told them apart.
 *
 * There is no Playwright here, so nothing below claims a page *looks* right. What it claims is
 * structural: the route exists, the breakpoint exists, the sentence is gone, the retry button is
 * wired to the operation that failed, and the "empty" state of the save list is unreachable
 * because `initialize` creates a slot rather than returning an empty array.
 */
const read = (path: string): string => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.vue');
const style = read('src/style.css');

describe('eight routes, and the one page the queue names that does not exist', () => {
  it.each(['home', 'battle', 'settings', 'saves', 'codex', 'reports', 'charms', 'challenges'])('routes %s', page => {
    // `settings` is the fallback branch rather than a `page === 'settings'` test - see below.
    const branch = page === 'settings' ? /<section v-else class="settings">/ : new RegExp(`page === '${page}'`);
    expect(app).toMatch(branch);
  });
  it('falls back to settings, so an unmatched page never renders nothing', () => {
    // The flip side of the fallback: a page value nobody handles lands on the help screen instead
    // of a blank shell. That is why `settings` has no `page ===` test of its own.
    expect(app).toMatch(/<section v-else class="settings">/);
    expect(app).not.toMatch(/page === 'settings'/);
  });
  it('has no chapter page, which is why the chapter track has no lobby entry yet', () => {
    // The queue's `R3-U02` says "章节". There is no such route: the lobby shows one hardcoded
    // stage line (`下一站 · ST001-01`) and the entry is `R3-U06`. Asserted so that adding a chapter
    // page is a visible decision, not an accident.
    expect(app).toMatch(/下一站 · ST001-01/);
    expect(app).not.toMatch(/page === 'chapter'/);
  });
});

describe('narrow screen: five pages gained a breakpoint', () => {
  it.each(['CodexPanel', 'ReportsPanel', 'CharmsPanel', 'ChallengesPanel'])('%s has one in its own style block', panel => {
    const source = read(`src/ui/${panel}.vue`);
    // The rule has to be inside the component, not borrowed from a neighbour: a scoped style only
    // applies to its own template, so a breakpoint in `style.css` would not reach these pages.
    expect(source).toMatch(/@media \(max-width: 640px\)/);
  });
  it('the save panel gets it from saves.css, which it imports through the shell', () => {
    // `SavePanel.vue` has no `<style>` at all; its layout lives in `saves.css` (imported by
    // `App.vue`). Checking the component would therefore assert the wrong file.
    expect(read('src/ui/saves.css')).toMatch(/@media\(max-width:640px\)/);
  });
  it('the settings page, which is inline in App.vue, gets it from style.css', () => {
    // `style.css` is minified into a handful of very long lines, so this slices the 640px block out
    // by its two neighbours instead of trying to match a nested `}` with a regex.
    const start = style.indexOf('@media(max-width:640px){');
    const end = style.indexOf('@media(prefers-reduced-motion');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(style.slice(start, end)).toContain('.settings{');
  });
});

describe('no page repeats a rule another module owns', () => {
  it('the report page no longer says a win is one star', () => {
    // True when written, false after D31, shipped in the same commit as D31. The fix is not the
    // wording: the numbers now come from `chapterStars`, so retuning the tiers moves the sentence.
    const reports = read('src/ui/ReportsPanel.vue');
    expect(reports).not.toContain('胜利记 1 星');
    expect(reports).toMatch(/chapterStars\.clear/);
    expect(reports).toMatch(/chapterStars\.mastery/);
  });
  it('the result screen no longer says charm effects are coming later', () => {
    // D30 implemented all six levers; this sentence survived the slice that shipped them.
    const result = read('src/ui/ChapterResult.vue');
    expect(result).not.toContain('效果将在战备版本开放');
    expect(result).toContain('可在战备页装备');
  });
});

describe('the retry paths, and the one that cannot work', () => {
  it('the save panel retries the operation that failed, not a lookalike', () => {
    const saves = read('src/ui/SavePanel.vue');
    expect(saves).toContain('重试上一步');
    // The closure is held, so an import retry re-uses the file the player already picked.
    expect(saves).toMatch(/failed\.value = action;/);
    expect(saves).toMatch(/@click="failed && perform\(failed\)"/);
  });
  it('the charm page tells apart a retryable failure from a revision mismatch', () => {
    const charms = read('src/ui/CharmsPanel.vue');
    expect(charms).toContain('重试装备');
    expect(charms).toMatch(/存档已更新/);
    expect(charms).toContain('返回大厅重新载入');
    // The retry re-issues the same equip, not "the first row".
    expect(charms).toMatch(/equip\(lastId\)/);
  });
  it('the battle page already split them, which is the pattern the two pages now copy', () => {
    const battle = read('src/ui/BattleView.vue');
    expect(battle).toMatch(/includes\('存档已更新'\)/);
    expect(battle).toContain('重试原选择');
  });
});

describe('the empty save list is unreachable, and that is a fact about the repository', () => {
  it('initialize creates a slot when there is none', () => {
    // The owner line, quoted so the claim has one. If this ever becomes "return an empty list",
    // `SavePanel`'s bare `v-for` turns into a blank page and needs a sentence - and this test
    // goes red first.
    const repo = read('src/storage/SaveRepository.ts');
    expect(repo).toMatch(/const slot = existing\[0\] \|\| this\.makeSlot\('新征途 1'/);
    expect(repo).toMatch(/if \(!existing\.length\) slots\.add\(slot\);/);
  });
  it('the pages whose empty state is real all say so', () => {
    // These four *can* be empty on a fresh save, so they owe a sentence rather than a blank list.
    expect(read('src/ui/ReportsPanel.vue')).toContain('还没有结算过的战局');
    expect(read('src/ui/CodexPanel.vue')).toMatch(/未见/);
    expect(read('src/ui/CharmsPanel.vue')).toMatch(/未获得/);
    expect(read('src/ui/ChallengesPanel.vue')).toMatch(/未达成/);
  });
});
