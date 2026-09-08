import { firstStage } from './spawnRules';
import { generateGear } from './gearDrops';
import type { GearInstance } from './saveTypes';
import type { Progression } from './progression';

export type EventKind = 'merchant' | 'goldChest';
export type EventCode = 'merchantAtk' | 'merchantHeal' | 'goldOpen' | 'goldCash' | 'skip';
export interface EventOffer { readonly token: number; readonly kind: EventKind }
export interface EventPayment { readonly gold: number; readonly affordable: boolean }
export const eventOptions: Record<EventKind, readonly EventCode[]> = { merchant: ['merchantAtk', 'merchantHeal', 'skip'], goldChest: ['goldOpen', 'goldCash', 'skip'] };
export function availableEventOptions(kind: EventKind, evolution = false): readonly EventCode[] {
  // Legacy firepower has no damage authority in the journey, so it is not sold.
  return evolution && kind === 'merchant' ? ['merchantHeal', 'skip'] : eventOptions[kind];
}
export function eventPayment(code: EventCode, gold: number): EventPayment {
  const cost = code === 'merchantAtk' ? 250 : code === 'merchantHeal' ? 180 : 0;
  const affordable = gold >= cost;
  return { affordable, gold: gold + (affordable ? -cost : 0) + (code === 'goldCash' ? 500 : 0) };
}

export class FirstStageEvents {
  private fired = new Set<number>();
  private offer: EventOffer | undefined;
  private shopBuff = 0;
  private notice = '';
  constructor(private player: { hp: number; maxHp: number }, private progression: Progression, private hero: string, private random = Math.random, private now = Date.now, readonly drops: GearInstance[] = []) {}
  open(time: number): boolean {
    if (this.offer) return false;
    const index = firstStage.eventAt.findIndex((at, index) => time >= at && !this.fired.has(index));
    if (index < 0) return false;
    this.fired.add(index);
    this.offer = Object.freeze({ token: index + 1, kind: this.random() < .5 ? 'merchant' : 'goldChest' });
    return true;
  }
  accepts(token: number, code: EventCode): boolean { return this.offer?.token === token && availableEventOptions(this.offer.kind, !!this.progression.journey).includes(code); }
  resolve(token: number, code: EventCode, payment: EventPayment): boolean {
    if (!this.accepts(token, code)) return false;
    this.apply(code, payment); this.offer = undefined; return true;
  }
  apply(code: EventCode, payment: EventPayment): void {
    if (!payment.affordable) { this.notice = '金币不足，已离开游商。'; return; }
    if (code === 'merchantAtk') { this.shopBuff += .18; this.notice = '已购入游商火力；赤焰战神专属普攻不受此加成。'; }
    if (code === 'merchantHeal') { this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .4); this.notice = '游商：生命恢复。'; }
    if (code === 'goldCash') this.notice = '已获得 500 金币。';
    if (code === 'goldOpen') {
      const drop = generateGear(this.hero, 'gold', this.random, this.now); this.drops.push(drop);
      const upgrade = this.progression.upgradeOwned();
      this.notice = `获得 ${String(drop.name)}${upgrade ? ' · ' + upgrade.label : ''}。装备保留在本局战利品中。`;
    }
    if (code === 'skip') this.notice = '已离开，继续征途。';
  }
  snapshot() { return Object.freeze({ offer: this.offer, shopBuff: this.shopBuff, gearCount: this.drops.length, notice: this.notice }); }
}
