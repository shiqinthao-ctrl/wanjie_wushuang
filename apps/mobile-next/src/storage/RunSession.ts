import type { GameCore } from '../core/GameCore';
import { eventPayment } from '../core/firstEvents';
import type { EventCode, EventPayment } from '../core/firstEvents';
import type { SaveRepository, SaveSlot } from './SaveRepository';
import { settleRun } from '../core/settlement';
import type { RunResult } from '../core/settlement';

/** Binds this run to its original slot; effects apply only after a committed receipt. */
export class RunSession {
  private pending: { token: number; code: EventCode } | undefined;
  private busy = false;
  private revision: number;
  private settling: Promise<RunResult> | undefined;
  private result: RunResult | undefined;
  gold: number;
  constructor(private repository: SaveRepository, private slot: SaveSlot, private core: GameCore, private runId: string = crypto.randomUUID()) {
    this.revision = slot.revision; this.gold = Number(slot.save.gold);
  }
  async choose(token: number, code: EventCode): Promise<boolean> {
    if (this.busy || this.settling || this.result || !this.core.acceptsEvent(token, code)) return false;
    if (this.pending && (this.pending.token !== token || this.pending.code !== code)) return false;
    this.pending = { token, code }; this.busy = true;
    try {
      const revision = this.revision;
      const saved = await this.repository.transactOnce(this.slot.id, `${this.runId}:event:${token}`, revision, save => {
        const payment = eventPayment(code, Number(save.gold)); save.gold = payment.gold;
        return { ...payment, token, code, revision: revision + 1 };
      });
      const receipt = saved.result as EventPayment & { token: number; code: EventCode; revision: number };
      if (receipt.token !== token || receipt.code !== code || saved.slot.revision !== receipt.revision) throw new Error('存档已更新，请返回大厅重新载入后继续。');
      this.revision = receipt.revision; this.gold = receipt.gold;
      const applied = this.core.resolveEvent(token, code, receipt);
      this.pending = undefined;
      return applied;
    } finally { this.busy = false; }
  }
  settle(): Promise<RunResult> {
    if (this.result) return Promise.resolve(this.result);
    if (this.settling) return this.settling;
    const final = this.core.finalRun();
    if (!final || this.busy || this.pending) return Promise.reject(new Error('本局尚未结束或事件尚未确认保存。'));
    this.settling = this.repository.transactOnce(this.slot.id, `${this.runId}:settlement`, this.revision, save => {
      const settled = settleRun(save, final);
      Object.assign(save, settled.save);
      return settled.result;
    }).then(saved => {
      this.revision = saved.slot.revision; this.gold = saved.slot.save.gold;
      this.result = saved.result; return saved.result;
    }).finally(() => { this.settling = undefined; });
    return this.settling;
  }
}
