import { freeze, text } from '../chapter/catalog';
import { prepareChapterRun } from '../chapter/prepare';
import type { ChapterPreparation } from '../chapter/prepare';
import { settleChapterRun, validateChapterFinal } from '../chapter/settlement';
import type { ChapterFinalRun, ChapterResult } from '../chapter/settlement';
import type { SaveRepository, SaveSlot } from './SaveRepository';

/** Storage boundary for the upcoming core. It never starts a loop or selects the active slot. */
export class ChapterRunSession {
  readonly preparation: ChapterPreparation;
  private readonly slotId: string;
  private readonly revision: number;
  private final: ChapterFinalRun | undefined;
  private pending: Promise<ChapterResult> | undefined;
  private result: ChapterResult | undefined;
  constructor(private repository: SaveRepository, slot: SaveSlot, options: unknown, private readonly runId: string = crypto.randomUUID()) {
    text(runId, '本局编号');
    this.slotId = slot.id; this.revision = slot.revision;
    this.preparation = prepareChapterRun(slot.save, options);
  }
  settle(final: ChapterFinalRun): Promise<ChapterResult> {
    if (this.result) return Promise.resolve(this.result);
    if (this.pending) return this.pending;
    if (!this.final) {
      try { validateChapterFinal(this.preparation, final); this.final = freeze(structuredClone(final)); }
      catch (error) { return Promise.reject(error); }
    }
    const captured = this.final;
    this.pending = this.repository.transactOnce(this.slotId, `chapter1-v1:${this.runId}:settlement`, this.revision, save => {
      const settled = settleChapterRun(save, this.preparation, captured, this.runId);
      save.mobileChapter = settled.save.mobileChapter;
      return settled.result;
    }).then(saved => {
      this.result = freeze(saved.result); return this.result;
    }).finally(() => { this.pending = undefined; });
    return this.pending;
  }
}
