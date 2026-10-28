import evolution from '../data/evolution.json';
import fusions from '../data/fusions.json';
import skillForms from '../data/skillForms.json';
import { activeSkills, heroForms, journeySkillNames, passiveSkills, skillDetails, starter } from '../core/evolutionCatalog';
import { pacingProfile } from '../core/RunEvolution';
import { chapterCoreSkills } from './catalog';
import { freshChapterProgress, readChapterProgress } from './progress';
import type { ChapterProgress } from './progress';
import type { GameSave } from '../core/saveTypes';

/**
 * The codex: what exists, what this save has touched, and what a row needs.
 *
 * D28 measured the three layers before any of this was written, and two of its findings decide the
 * shape below:
 *
 * 1. `progress.discoveries` is keyed by **form** and only written when a run picked one. A form the
 *    save never touched is *absent*, not `false` - so absence is its own state (`not-found`) and the
 *    page must not render it as "locked by a rule".
 * 2. "Does this save hold both parts of a fusion" has no single answer. In the evolution journey
 *    `evolutionBuild` hands every hero all 10 actives and all 11 passives, so the claim is
 *    **constant-true** there; only `save.build` - the classic account build - varies. So the fusion
 *    row carries two columns, each naming its own source, instead of one column that would be a
 *    constant.
 *
 * Read-only by construction: the only progress reader here is `readChapterProgress`, and nothing in
 * this module writes to the save. `codexRows` never mutates its argument (asserted).
 */

export type CodexTrack = 'chapter' | 'journey';
/** `not-found` is an absence, not a lock: the save has never held this form in a settled run. */
export type Seen = 'not-found' | 'discovered' | 'awakened' | 'cleared';

export interface FormNeeds {
  hero: string; heroName: string;
  coreSkill: string; coreSkillName: string;
  formLevel: number; awakenLevel: number;
}
export interface FormRow {
  id: string; name: string; hero: string; heroName: string;
  detail: string; awakening: string; color: string;
  seen: Seen;
  needs: FormNeeds;
}
export interface FusionPart {
  id: string; name: string;
  active: string; activeName: string;
  passive: string; passiveText: string;
  /** Both of this part's skills are in the run's skill lists, so a run can actually build it. */
  live: boolean;
  /** Both of this part's skills are in this save's account build (`save.build`). */
  owned: boolean;
}
export interface FusionRow {
  id: string; name: string;
  parts: readonly [FusionPart, FusionPart];
  /** Column one, source: the skill lists. Same value for all three heroes (D28). */
  assembleAble: boolean;
  /** Column two, source: `save.build`. Independent of column one - a live row can still be unowned. */
  held: boolean;
}
export interface Codex {
  track: CodexTrack;
  gates: { form: number; awaken: number };
  forms: readonly FormRow[];
  fusions: readonly FusionRow[];
  /** Discovery keys the catalog does not know. Reported, never silently dropped. */
  unknown: readonly string[];
  seenCount: number;
  /**
   * Set when the save's chapter progress cannot be read (a save from a newer build says so and
   * throws). The page then shows the catalog with an empty progress rather than a blank screen -
   * a codex that crashes on a future save is worse than one that admits it cannot see it.
   */
  progressError: string | null;
}

const descriptions = skillForms.descriptions as Record<string, readonly string[]>;
const skillName = (id: string): string => journeySkillNames[id] ?? descriptions[id]?.[1] ?? id;
/** Passives have no display name anywhere in the data, so they are shown by their description. */
const passiveText = (id: string): string => skillDetails[id] ?? id;

const evolutionRows = evolution as Record<string, readonly string[]>;
const fusionRows = fusions as Record<string, readonly string[]>;

const liveSkills = new Set<string>([...activeSkills, ...passiveSkills]);

function part(id: string, active: ReadonlySet<string>, passive: ReadonlySet<string>): FusionPart {
  const row = evolutionRows[id];
  // A fusion part that does not resolve is a data error, and saying so beats rendering `undefined`.
  if (!row) throw new Error(`融合部件不存在：${id}`);
  const [, skill, perk] = row as [string, string, string];
  return {
    id, name: row[0]!,
    active: skill, activeName: skillName(skill),
    passive: perk, passiveText: passiveText(perk),
    live: liveSkills.has(skill) && liveSkills.has(perk),
    owned: active.has(skill) && passive.has(perk),
  };
}

function seenOf(discovery: { discovered?: boolean; awakened?: boolean; cleared?: boolean } | undefined): Seen {
  if (!discovery || !discovery.discovered) return 'not-found';
  if (discovery.cleared) return 'cleared';
  if (discovery.awakened) return 'awakened';
  return 'discovered';
}

export function codexRows(save: GameSave, track: CodexTrack = 'chapter'): Codex {
  const gates = pacingProfile(track === 'journey' ? 'paced' : 'legacy');
  let progress: ChapterProgress = freshChapterProgress();
  let progressError: string | null = null;
  try { progress = readChapterProgress(save); }
  catch (cause) { progressError = cause instanceof Error ? cause.message : '存档进度无法读取'; }
  const active = new Set(save.build?.active ?? []);
  const passive = new Set(save.build?.passive ?? []);
  const forms = heroForms.map((form): FormRow => ({
    id: form.id, name: form.name, hero: form.hero, heroName: starter(form.hero).name,
    detail: form.detail, awakening: form.awakening, color: form.color,
    seen: seenOf(progress.discoveries[form.id]),
    needs: {
      hero: form.hero, heroName: starter(form.hero).name,
      coreSkill: chapterCoreSkills[form.id], coreSkillName: skillName(chapterCoreSkills[form.id]),
      formLevel: gates.form, awakenLevel: gates.awaken,
    },
  }));
  const known = new Set(heroForms.map(form => form.id as string));
  return {
    track, gates: { form: gates.form, awaken: gates.awaken },
    forms,
    fusions: Object.entries(fusionRows).map(([id, row]): FusionRow => {
      const parts = [part(row[1]!, active, passive), part(row[2]!, active, passive)] as const;
      return {
        id, name: row[0]!,
        parts,
        assembleAble: parts.every(entry => entry.live),
        held: parts.every(entry => entry.owned),
      };
    }),
    unknown: Object.keys(progress.discoveries).filter(id => !known.has(id)),
    seenCount: forms.filter(form => form.seen !== 'not-found').length,
    progressError,
  };
}
