import { chapterCharms } from './catalog';
import type { ChapterProgress } from './progress';

/**
 * R3-P03 / D30: six charms, six levers, one equipped at a time.
 *
 * The row states *which* number it moves and *by how much*; the number itself stays where it is
 * read. That is deliberate: a charm that carried its own copy of "4.5 s" would keep working after
 * somebody retuned the dodge cooldown, and it would keep working *wrongly* - the base would drift
 * while the charm still claimed the old one. Here the base is `CombatSimulation`'s literal and the
 * charm is a multiplier on it, so a retune flows through every charm that touches it.
 *
 * `factor` is never 1 (a charm that changes nothing is worse than no charm) and no two rows share a
 * lever (a charm that does two things cannot say what it does). `charms.test.ts` pins both.
 */
export type CharmId = (typeof chapterCharms)[number];
export type CharmLever = 'dodgeCd' | 'eliteDamage' | 'pickup' | 'incoming' | 'skillCd' | 'speed';
export interface CharmRow {
  readonly name: string;
  /** The one number this charm moves. Unique across the six - see `charms.test.ts`. */
  readonly lever: CharmLever;
  /** Multiplier applied at that lever's single read site. Never 1. */
  readonly factor: number;
  /** What the player is told. States the lever and the multiplier, not a stale absolute. */
  readonly detail: string;
}
export interface EquippedCharm extends CharmRow { readonly id: CharmId }
export interface CharmView extends EquippedCharm { readonly unlocked: boolean; readonly equipped: boolean }

export const chapterCharmRows: Readonly<Record<CharmId, CharmRow>> = Object.freeze({
  MC_DODGE: Object.freeze({ name: '疾影护符', lever: 'dodgeCd', factor: .8, detail: '闪避冷却 ×0.8' }),
  MC_ELITE: Object.freeze({ name: '破甲护符', lever: 'eliteDamage', factor: 1.15, detail: '对精英伤害 ×1.15' }),
  MC_PICKUP: Object.freeze({ name: '收束护符', lever: 'pickup', factor: 2, detail: '经验晶体拾取半径 ×2' }),
  MC_SURVIVAL: Object.freeze({ name: '不屈护符', lever: 'incoming', factor: .85, detail: '受到伤害 ×0.85' }),
  MC_CYCLE: Object.freeze({ name: '回环护符', lever: 'skillCd', factor: .85, detail: '术式冷却 ×0.85' }),
  MC_MOVE: Object.freeze({ name: '疾行护符', lever: 'speed', factor: 1.12, detail: '移动速度 ×1.12（闪避位移不变）' }),
});

/**
 * A row by id. Unknown ids throw **here**, not in the schema validator: `progress.ts` has to keep
 * accepting a save from a newer build (D28), but a run cannot start with a charm whose effect this
 * build does not know - starting one would be a silent no-op, which is the one thing a charm may
 * not be. The message names the charm so the player is not told it is their graphics driver.
 */
export function charmRow(id: string): CharmRow {
  const row = (chapterCharmRows as Record<string, CharmRow | undefined>)[id];
  if (!row) throw new Error(`战备护符「${id}」在本版本无法识别，请卸下后重新出战。原存档未被修改。`);
  return row;
}
export function equippedCharm(progress: ChapterProgress): EquippedCharm | null {
  const id = progress.charms.equipped;
  if (id === null) return null;
  return Object.freeze({ id: id as CharmId, ...charmRow(id) });
}
/** The lobby list: all six rows, each saying whether this save has it and whether it is worn. */
export function charmViews(progress: ChapterProgress): readonly CharmView[] {
  const unlocked = new Set(progress.charms.unlocked), equipped = progress.charms.equipped;
  return chapterCharms.map(id => Object.freeze({ id, ...chapterCharmRows[id], unlocked: unlocked.has(id), equipped: equipped === id }));
}
