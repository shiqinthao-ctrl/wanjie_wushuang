import evolution from '../data/evolution.json';
import fusion from '../data/fusions.json';
import { generateGear } from './gearDrops';
import type { GearInstance } from './saveTypes';
import type { Progression } from './progression';

export interface Forms { evolved: Record<string, boolean>; fused: Record<string, boolean> }
export interface ChestOption { readonly type: 'evo' | 'fusion' | 'upgrade' | 'gear'; readonly id: string | null }
export interface ChestOffer { readonly token: number; readonly options: readonly ChestOption[] }
export const formName = (id: string): string => (evolution as Record<string, string[]>)[id]?.[0] ?? (fusion as Record<string, string[]>)[id]?.[0] ?? id;
export const chestTitle = (option: ChestOption): string => option.id ? formName(option.id) : option.type === 'gear' ? '随机装备掉落' : '随机技能升级';

export class TimedChests {
  private rewards = [90, 210, 300].map(at => ({ at, claimed: false }));
  private offer: ChestOffer | undefined;
  private notice = '';
  constructor(private progression: Progression, private forms: Forms, private hero: string, private drops: GearInstance[], private random = Math.random, private now = Date.now) {}
  claim(index: number, time: number, bossLootShown = false): boolean {
    const reward = this.rewards[index];
    if (!reward || reward.claimed || this.offer || !Number.isFinite(time) || time < reward.at || bossLootShown) return false;
    const { skills, passives } = this.progression.snapshot();
    const options: ChestOption[] = [];
    for (const [id, [, a, b]] of Object.entries(fusion)) if (!this.forms.fused[id] && this.forms.evolved[a!] && this.forms.evolved[b!]) options.push({ type: 'fusion', id });
    for (const [id, [, a, p]] of Object.entries(evolution)) if (!this.forms.evolved[id] && (skills[a!] || 0) >= 5 && (passives[p!] || 0) >= 5) options.push({ type: 'evo', id });
    while (options.length < 3) options.push({ type: options.length === 2 ? 'gear' : 'upgrade', id: null });
    this.offer = Object.freeze({ token: index + 1, options: Object.freeze(options.slice(0, 3).map(option => Object.freeze(option))) });
    return true;
  }
  pick(token: number, index: number): boolean {
    const option = this.offer?.token === token ? this.offer.options[index] : undefined;
    if (!option) return false;
    if (option.type === 'evo' || option.type === 'fusion') {
      this.forms[option.type === 'evo' ? 'evolved' : 'fused'][option.id!] = true;
      this.notice = `${option.type === 'evo' ? '进化' : '融合'} · ${formName(option.id!)}`;
    } else if (option.type === 'gear') {
      const drop = generateGear(this.hero, 'chest', this.random, this.now); this.drops.push(drop);
      this.notice = `获得 ${String(drop.name)}，暂存本局战利品。`;
    } else {
      const upgrade = this.progression.upgradeOwned();
      this.notice = upgrade ? `获得 ${upgrade.label}` : '已拥有的术式均已满级，继续征途。';
    }
    this.rewards[token - 1]!.claimed = true; this.offer = undefined;
    return true;
  }
  snapshot(time: number) {
    return Object.freeze({ offer: this.offer, notice: this.notice,
      rewards: Object.freeze(this.rewards.map((reward, index) => Object.freeze({ index, at: reward.at, state: reward.claimed ? 'claimed' : this.offer?.token === index + 1 ? 'choosing' : time >= reward.at ? 'ready' : 'locked' }))),
      evolved: Object.freeze(Object.keys(this.forms.evolved).filter(id => this.forms.evolved[id])), fused: Object.freeze(Object.keys(this.forms.fused).filter(id => this.forms.fused[id])) });
  }
}
