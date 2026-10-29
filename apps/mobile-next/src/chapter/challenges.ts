import { chapterCharms, chapterError } from './catalog';
import type { ChapterProgress } from './progress';
import type { CharmId } from './charms';

/**
 * R3-P04 / D31: three challenges, three charms, no number.
 *
 * Before this file the three earnable charms were a single line in `settlement.ts` -
 * `[victory ? chapterCharms[3] : null, run.awakened ? chapterCharms[4] : null,
 * run.bonds.length >= 2 ? chapterCharms[5] : null]`. That line *was* the chapter's whole challenge
 * system, written as three magic indexes. Two things were wrong with it beyond taste: nothing could
 * say what a challenge asks without reading the code, and nothing could ask whether a challenge
 * pays a stat - because there was no "what it pays" to ask about.
 *
 * So the row carries three fields and one function:
 *
 * - `asks` - the condition in the player's words. It names the field it reads, so a reader can
 *   check it against `ChapterFinalRun` instead of trusting a sentence.
 * - `reward` - the one charm it pays. A challenge pays a *charm*, never a number: a charm moves one
 *   lever by a factor and only one is worn at a time (D30), so the payout cannot compound. That is
 *   the queue's "no permanent numeric crushing", and `challenges.test.ts` pins it by refusing any
 *   row whose reward is not one of the six charm ids.
 * - `met` - a predicate over three settled-run facts and nothing else. It cannot read the save, the
 *   stage, the clock, or the player, so a challenge cannot secretly be a reroll.
 *
 * The three rewards are the three charms that are **not** in the starting kit
 * (`chapterCharms.slice(0, 3)` in `freshChapterProgress`). A challenge that paid a starting charm
 * would be a challenge that pays nothing.
 */
export type ChallengeId = 'clear' | 'awakened' | 'bonds';

/**
 * The only facts a challenge may read. Structural, so `ChapterFinalRun` satisfies it without this
 * module importing `settlement.ts` (which imports this one).
 */
export interface ChallengeFacts {
  readonly endReason: 'victory' | 'defeat' | 'timeout';
  readonly awakened: boolean;
  readonly bonds: readonly string[];
}
export interface ChallengeRow {
  readonly id: ChallengeId;
  readonly name: string;
  /** What the player is asked to do, named by the field it reads. */
  readonly asks: string;
  /** The one charm it pays. Never a starting charm, never a number. */
  readonly reward: CharmId;
  readonly met: (run: ChallengeFacts) => boolean;
}
export interface ChallengeView extends ChallengeRow {
  /** Whether this save has already been paid. Paid is permanent - `settlement` never revokes. */
  readonly paid: boolean;
}

export const chapterChallenges: readonly ChallengeRow[] = Object.freeze([
  Object.freeze({
    id: 'clear' as const, name: '破围',
    asks: '本局结算为胜利（`endReason === \'victory\'`）',
    reward: 'MC_SURVIVAL' as const,
    met: (run: ChallengeFacts) => run.endReason === 'victory',
  }),
  Object.freeze({
    id: 'awakened' as const, name: '觉醒',
    asks: '本局完成形态觉醒（`awakened`）',
    reward: 'MC_CYCLE' as const,
    met: (run: ChallengeFacts) => run.awakened,
  }),
  Object.freeze({
    id: 'bonds' as const, name: '双羁绊',
    asks: '本局凑齐两条羁绊（`bonds.length >= 2`）',
    reward: 'MC_MOVE' as const,
    met: (run: ChallengeFacts) => run.bonds.length >= 2,
  }),
]);

/**
 * The charms this run has just earned - met, and not already owned. Pure: it reads `unlocked` and
 * returns a new list, so the caller decides when to write.
 */
export function earnedCharms(progress: ChapterProgress, run: ChallengeFacts): CharmId[] {
  const owned = new Set<string>(progress.charms.unlocked);
  return chapterChallenges.filter(row => row.met(run) && !owned.has(row.reward)).map(row => row.reward);
}

/** The lobby list: all three rows, each saying what it asks and whether this save has been paid. */
export function challengeViews(progress: ChapterProgress): readonly ChallengeView[] {
  const owned = new Set<string>(progress.charms.unlocked);
  return chapterChallenges.map(row => Object.freeze({ ...row, paid: owned.has(row.reward) }));
}

/**
 * A row by id, throwing **here** rather than in the schema validator - the same split as `charmRow`
 * (D30): `progress.ts` must keep accepting a save from a newer build, but a page that cannot name a
 * challenge has nothing to render and should say so instead of drawing a blank row.
 */
export function challengeRow(id: string): ChallengeRow {
  const row = chapterChallenges.find(entry => entry.id === id);
  if (!row) throw new Error(`挑战「${id}」在本版本无法识别。原存档未被修改。`);
  return row;
}
/** Every id the data admits. Kept next to the table so a new row cannot be added and forgotten. */
export const challengeIds: readonly ChallengeId[] = Object.freeze(chapterChallenges.map(row => row.id));
/** The rewards as a list, so the page can diff them against `charmViews` without re-deriving. */
export const challengeRewards: readonly CharmId[] = Object.freeze(chapterChallenges.map(row => row.reward));
// The charm table is already frozen (`catalog.ts`); this catches the one mistake the type cannot:
// a row whose reward is not one of the six charms at all. A challenge that pays nothing is not a
// challenge, and it would fail silently - `unlocked.push('nope')` is a valid array push.
for (const reward of challengeRewards) {
  if (!(chapterCharms as readonly string[]).includes(reward)) chapterError(`挑战奖励 ${reward}`);
}
