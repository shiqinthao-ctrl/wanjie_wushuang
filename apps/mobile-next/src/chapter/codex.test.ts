import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import evolution from '../data/evolution.json';
import fusions from '../data/fusions.json';
import skillForms from '../data/skillForms.json';
import { activeSkills, heroForms, passiveSkills } from '../core/evolutionCatalog';
import { parseSchema30 } from '../storage/schema30';
import { chapterCoreSkills, chapterHeroes } from './catalog';
import { codexRows } from './codex';
import { freshChapterProgress } from './progress';

/**
 * R3-P01 - the codex. Scope 0 (D28) measured the three layers before this page existed, and every
 * number asserted here is one of those measurements rather than a new claim:
 *
 *   catalog 11 forms / 10 fusions -> 4 assemble-able -> 3 held by a fresh save
 *
 * The two fusion columns are asserted **independently**, because D28's finding was that they are not
 * the same question: `F026` can be built in a run but a fresh save has not got its skills, so a single
 * column would have to lie about one of them.
 */
const save = () => parseSchema30(JSON.stringify(fresh));
const withDiscoveries = (discoveries: Record<string, { discovered: boolean; awakened: boolean; cleared: boolean }>) => {
  const source = save();
  source.mobileChapter = { ...freshChapterProgress(), discoveries };
  return source;
};
const ok = (codex: ReturnType<typeof codexRows>, pick: 'assembleAble' | 'held') => codex.fusions.filter(row => row[pick]).map(row => row.id);

describe('the catalog is one catalog, and the copies agree', () => {
  it('groups heroForms exactly the way chapterHeroes does, hero by hero', () => {
    // Two lists, one meaning. If one is edited alone the page would show a form nobody can pick.
    const grouped = new Map<string, string[]>();
    for (const form of heroForms) grouped.set(form.hero, [...(grouped.get(form.hero) ?? []), form.id]);
    for (const [hero, row] of Object.entries(chapterHeroes)) expect(grouped.get(hero), hero).toEqual([...row.forms]);
    expect(heroForms).toHaveLength(11);
    expect(grouped.size).toBe(Object.keys(chapterHeroes).length);
  });
  it('keeps the third copy of the fusion names honest', () => {
    // `skillForms.extraNames` repeats the ten fusion names. A third copy that drifts is a bug the
    // page would render, so it is pinned to the list the codex actually reads.
    const extra = skillForms.extraNames as Record<string, string>;
    const rows = fusions as Record<string, string[]>;
    for (const [id, row] of Object.entries(rows)) expect(extra[id], id).toBe(row[0]);
    expect(Object.keys(extra).sort()).toEqual(Object.keys(rows).sort());
  });
  it('resolves every form to a core skill, and that skill to a name rather than an id', () => {
    const codex = codexRows(save());
    const core = chapterCoreSkills as Record<string, string>;
    for (const row of codex.forms) {
      expect(core[row.id], row.id).toBeTruthy();
      expect(row.needs.coreSkillName, row.id).not.toMatch(/^[A-Z0-9_]+$/);
    }
    expect(codex.forms.find(row => row.id === 'dragon')!.needs.coreSkillName).toBe('烈焰刀');
    // `G2_FROST` has no row in skillForms.json; the name comes from `journeySkillNames`.
    expect(codex.forms.find(row => row.id === 'frostlord')!.needs.coreSkillName).toBe('寒霜环');
  });
});

describe('three truths per row: in the catalog, seen by this save, and what it needs', () => {
  it('reads every untouched form as not-found, not as locked', () => {
    const codex = codexRows(save());
    expect(codex.forms).toHaveLength(heroForms.length);
    expect(codex.forms.every(row => row.seen === 'not-found')).toBe(true);
    expect(codex.seenCount).toBe(0);
  });
  it('separates discovered, awakened and cleared, and counts only what it has seen', () => {
    const codex = codexRows(withDiscoveries({
      dragon: { discovered: true, awakened: false, cleared: false },
      bulwark: { discovered: true, awakened: true, cleared: false },
      phoenix: { discovered: true, awakened: true, cleared: true },
    }));
    const seen = Object.fromEntries(codex.forms.map(row => [row.id, row.seen]));
    expect(seen.dragon).toBe('discovered');
    expect(seen.bulwark).toBe('awakened');
    expect(seen.phoenix).toBe('cleared');
    expect(seen.legion).toBe('not-found');
    expect(codex.seenCount).toBe(3);
  });
  it('does not turn an explicit false into a lock either - absence is absence', () => {
    // `validateMobileChapter` accepts `discovered: false`; the page must not upgrade it to "seen".
    const codex = codexRows(withDiscoveries({ dragon: { discovered: false, awakened: false, cleared: false } }));
    expect(codex.forms.find(row => row.id === 'dragon')!.seen).toBe('not-found');
    expect(codex.seenCount).toBe(0);
  });
  it('reports a discovery key the catalog does not know instead of dropping it', () => {
    const codex = codexRows(withDiscoveries({ phoenix2: { discovered: true, awakened: false, cleared: false } }));
    expect(codex.unknown).toEqual(['phoenix2']);
    expect(codex.seenCount).toBe(0);
  });
  it('survives a save from a newer build instead of blanking the page', () => {
    // `readChapterProgress` throws on version > 1 by design (a newer build wrote it). A codex that
    // crashes on such a save is worse than one that says it cannot see the progress.
    const source = save();
    source.mobileChapter = { version: 2 };
    const codex = codexRows(source);
    expect(codex.progressError).toBeTruthy();
    expect(codex.forms).toHaveLength(11);
    expect(codex.fusions).toHaveLength(10);
    expect(codex.seenCount).toBe(0);
    expect(codex.unknown).toEqual([]);
  });
  it('names which line the gates come from, because there are two of them', () => {
    const chapter = codexRows(save(), 'chapter'), journey = codexRows(save(), 'journey');
    expect(chapter.gates).toEqual({ form: 3, awaken: 8 });
    expect(journey.gates).toEqual({ form: 10, awaken: 19 });
    // The difference has to reach the row, not just the header.
    expect(chapter.forms[0]!.needs.formLevel).toBe(3);
    expect(journey.forms[0]!.needs.formLevel).toBe(10);
    expect(journey.forms[0]!.needs.awakenLevel).toBe(19);
    // Hero and core skill do not depend on the track.
    expect(journey.forms[0]!.needs.hero).toBe('H001');
    expect(journey.forms[0]!.heroName).toBe('赤焰战神');
  });
});

describe('the two fusion columns, each with its own source', () => {
  it('marks exactly the four fusions whose parts a run can build', () => {
    const codex = codexRows(save());
    expect(codex.fusions).toHaveLength(10);
    expect(ok(codex, 'assembleAble')).toEqual(['F001', 'F002', 'F004', 'F026']);
  });
  it('names the dead part on each of the six rows that cannot be assembled', () => {
    const codex = codexRows(save());
    const dead = codex.fusions.filter(row => !row.assembleAble);
    expect(dead.map(row => row.id)).toEqual(['F003', 'F005', 'F006', 'F020', 'F021', 'F033']);
    for (const row of dead) {
      const missing = row.parts.filter(part => !part.live);
      expect(missing.length, row.id).toBeGreaterThanOrEqual(1);
      for (const part of missing) {
        const row2 = (evolution as Record<string, string[]>)[part.id]!;
        // The reason is a skill outside the two lists, and the row says which one.
        expect(activeSkills.includes(row2[1] as never) && passiveSkills.includes(row2[2] as never), part.id).toBe(false);
      }
    }
  });
  it('keeps the columns independent: F026 can be built in a run but is not held by a fresh save', () => {
    const codex = codexRows(save());
    expect(ok(codex, 'held')).toEqual(['F001', 'F002', 'F004']);
    expect(ok(codex, 'held')).not.toEqual(ok(codex, 'assembleAble'));
    const f026 = codex.fusions.find(row => row.id === 'F026')!;
    expect(f026.assembleAble).toBe(true);
    expect(f026.held).toBe(false);
    expect(f026.parts.map(part => part.passive)).toEqual(['P039', 'P024']);
  });
  it('reads the held column off save.build, so completing the build flips it', () => {
    const source = save();
    source.build = { active: [...source.build.active, 'S001', 'A015'], passive: [...source.build.passive, 'P039', 'P024'] };
    expect(ok(codexRows(source), 'held')).toContain('F026');
    expect(ok(codexRows(source), 'held')).toEqual(['F001', 'F002', 'F004', 'F026']);
  });
  it('shows a passive by its description, because the data has no name for one', () => {
    const codex = codexRows(save());
    const part = codex.fusions[0]!.parts[0]!;
    expect(part.passive).toBe('P026');
    expect(part.passiveText).toBe('提高炎系技能伤害。');
    expect(part.activeName).toBe('火球');
  });
});

describe('read-only, and reachable from the lobby', () => {
  it('does not touch the save it is handed', () => {
    const source = withDiscoveries({ dragon: { discovered: true, awakened: true, cleared: false } });
    const before = structuredClone(source);
    codexRows(source); codexRows(source, 'journey');
    expect(source).toEqual(before);
  });
  it('is routed from the lobby: the page union and the button both exist', () => {
    // No Playwright here, so "reachable" is asserted where it is decided: the union member, the
    // import, the button that sets it, and the branch that renders the panel.
    const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
    // Matched loosely on purpose: the union grows as pages are added (R3-P02 added `'reports'`), and
    // a test that pins the whole literal makes every new page edit an unrelated file.
    expect(app).toMatch(/page = ref<[^>]*'codex'[^>]*>/);
    expect(app).toMatch(/import CodexPanel from '\.\/ui\/CodexPanel\.vue';/);
    expect(app).toMatch(/@click="page = 'codex'"/);
    expect(app).toMatch(/<CodexPanel v-else-if="page === 'codex'/);
  });
});
