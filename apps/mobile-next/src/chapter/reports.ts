import { chapterStages } from './catalog';
import { freshChapterProgress, readChapterProgress } from './progress';
import type { ChapterProgress, ChapterReport } from './progress';
import { heroForms, starter } from '../core/evolutionCatalog';
import type { GameSave } from '../core/saveTypes';

/**
 * The run record: the last twenty settled runs, as rows a page can render.
 *
 * D29 measured the storage before any of this was written. Three findings decide the shape:
 *
 * 1. `progress.reports` has exactly **one** reader in the app - `settlement.ts`'s de-dupe by
 *    `runId`. Nothing has ever rendered it, so this module is the first reader that shows anything.
 * 2. The cap is enforced twice, with different semantics: the writer silently truncates with
 *    `unshift(...).slice(0, 20)` and the validator *rejects* a save holding 21. So `length <= 20`
 *    is safe to assume; `length === 20` is not.
 * 3. `stars` used to be a boolean in a three-star costume - the writer emitted `victory ? 1 : 0`
 *    while the validator admitted `0..3`, so drawing three slots would have shown "1/3" on every
 *    win. D31 closed the gap (`settlement.ts`'s `starsFor`, 2 for a win and 3 above 55% hp), but the
 *    row still carries the **count** rather than three slots: the range is a fact about the field,
 *    and a slot layout that assumes a value is reachable is a layout that lies when it is not.
 *
 * Two things this module refuses to do:
 *
 * - It does not report a rate over a handful of runs. `winRate` is `null` below
 *   {@link RATE_MIN_RUNS}; the page says "not enough runs" instead of printing 33%.
 * - It does not average a median across outcomes. Timeouts sit at the stage's duration by
 *   construction, so a median over all runs would drift toward the clock. The median is over
 *   victories only, and it carries its own denominator.
 *
 * Read-only: the only progress reader is `readChapterProgress`, and `reportRows` never mutates its
 * argument (asserted in `reports.test.ts`).
 */

/** Below this many runs a percentage is not a rate. Stated on the page, not hidden in the code. */
export const RATE_MIN_RUNS = 5;
/** The store's cap. Named here so the page and the tests cannot disagree about it. */
export const REPORT_CAP = 20;

export type Outcome = 'victory' | 'defeat' | 'timeout';

export interface ReportRow {
  /** `progress.reports` keys are unique by `runId` (the validator refuses duplicates). */
  runId: string;
  stageId: string; stageName: string;
  heroId: string; heroName: string;
  formId: string | null; formName: string | null;
  outcome: Outcome;
  /** The stage's own word - `破围成功` / `破围超时` - so the list and the result screen agree. */
  outcomeLabel: string;
  /** 0..3. A count, never three slots - see the module note on why the layout does not assume 3. */
  stars: number;
  /** Seconds. Raw, because the page formats and the tests assert numbers. */
  time: number;
  /** `mm:ss`, floored - the same clock the battle HUD uses. */
  clock: string;
  level: number;
  kills: number;
  seed: number;
  routes: number;
  bonds: number;
  awakened: boolean;
}

export interface ReportSummary {
  /** How many runs the window holds. The denominator for everything else on this line. */
  runs: number;
  victory: number; defeat: number; timeout: number;
  /** `null` below {@link RATE_MIN_RUNS}. A percentage over three runs is not a win rate. */
  winRate: number | null;
  /** The threshold the rate needs, so the page can say how many more runs it wants. */
  rateNeeds: number;
  /** Median seconds over **victories only**, one decimal. `null` when there are none. */
  victoryMedian: number | null;
  /** Denominator of the median - not the same number as `runs`. */
  victoryCount: number;
}

export interface Reports {
  /** Newest first: the writer `unshift`s, so `[0]` is the most recent run. */
  rows: readonly ReportRow[];
  summary: ReportSummary;
  /**
   * Set when the save's chapter progress cannot be read (a save from a newer build says so and
   * throws). The page then says it cannot see the record instead of rendering an empty list that
   * looks like "you have never played".
   */
  progressError: string | null;
}

// Keyed by plain `string`: a report's `stageId` is validated against the catalog on read, but its
// declared type is `string`, so a `Map<ChapterStageId, …>` would reject the lookup it exists for.
const stageById = new Map<string, (typeof chapterStages)[number]>(chapterStages.map(stage => [stage.id, stage]));
const formById = new Map<string, (typeof heroForms)[number]>(heroForms.map(form => [form.id, form]));

/** `mm:ss`, floored. `Math.round` would turn 359.6 s into `06:00` - a clock that overstates. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = sorted.length >> 1;
  const value = sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
  return Math.round(value * 10) / 10;
}

function outcomeLabel(report: ChapterReport): string {
  const stage = stageById.get(report.stageId);
  if (report.endReason === 'defeat') return '本局生命耗尽';
  if (report.endReason === 'timeout') return stage?.timeout ?? '超时';
  return stage?.clear ?? '通关';
}

function row(report: ChapterReport): ReportRow {
  const stage = stageById.get(report.stageId);
  return {
    runId: report.runId,
    stageId: report.stageId, stageName: stage?.name ?? report.stageId,
    heroId: report.heroId, heroName: starter(report.heroId).name,
    formId: report.formId,
    formName: report.formId ? formById.get(report.formId)?.name ?? report.formId : null,
    outcome: report.endReason,
    outcomeLabel: outcomeLabel(report),
    stars: report.stars,
    time: report.time, clock: clock(report.time),
    level: report.level, kills: report.kills, seed: report.seed,
    routes: report.routes.length, bonds: report.bonds.length,
    awakened: report.awakened,
  };
}

function summarize(reports: readonly ChapterReport[]): ReportSummary {
  const runs = reports.length;
  const count = (reason: Outcome) => reports.filter(report => report.endReason === reason).length;
  const victory = count('victory');
  const victoryTimes = reports.filter(report => report.endReason === 'victory').map(report => report.time);
  return {
    runs,
    victory, defeat: count('defeat'), timeout: count('timeout'),
    winRate: runs >= RATE_MIN_RUNS ? Math.round((victory / runs) * 10000) / 10000 : null,
    rateNeeds: RATE_MIN_RUNS,
    victoryMedian: median(victoryTimes),
    victoryCount: victoryTimes.length,
  };
}

export function reportRows(save: GameSave): Reports {
  let progress: ChapterProgress = freshChapterProgress();
  let progressError: string | null = null;
  try { progress = readChapterProgress(save); }
  catch (cause) { progressError = cause instanceof Error ? cause.message : '存档进度无法读取'; }
  const reports = progress.reports.slice(0, REPORT_CAP);
  return { rows: reports.map(row), summary: summarize(reports), progressError };
}
