import evolution from '../data/evolution.json';
import fusion from '../data/fusions.json';
import { generateGear } from './gearDrops';
import { pacingProfile } from './RunEvolution';
import type { GearInstance } from './saveTypes';
import type { Progression } from './progression';

export interface Forms { evolved: Record<string, boolean>; fused: Record<string, boolean> }
export interface ChestOption { readonly type: 'evo' | 'fusion' | 'upgrade' | 'gear'; readonly id: string | null }
export interface ChestOffer { readonly token: number; readonly options: readonly ChestOption[] }
export const formName = (id: string): string => (evolution as Record<string, string[]>)[id]?.[0] ?? (fusion as Record<string, string[]>)[id]?.[0] ?? id;
export const chestTitle = (option: ChestOption): string => option.id ? formName(option.id) : option.type === 'gear' ? '随机装备掉落' : '随机技能升级';

export class TimedChests {
  /**
   * R1g-5 / G7: the schedule is per pacing profile, because the chest *count* is the G7 blocker.
   * `legacy` keeps `[90, 210, 300]` byte-identical; `paced` opens a fourth at 165s. Built in the
   * constructor rather than as a field initializer because it reads `this.progression` (parameter
   * properties are assigned at the top of the constructor body, field initializers run before it).
   */
  private rewards: { at: number; claimed: boolean }[];
  private offer: ChestOffer | undefined;
  private notice = '';
  constructor(private progression: Progression, private forms: Forms, private hero: string, private drops: GearInstance[], private random = Math.random, private now = Date.now) {
    this.rewards = pacingProfile(this.progression.journey?.pacing).chestAt.map(at => ({ at, claimed: false }));
  }
  claim(index: number, time: number, bossLootShown = false): boolean {
    const reward = this.rewards[index];
    if (!reward || reward.claimed || this.offer || !Number.isFinite(time) || time < reward.at || bossLootShown) return false;
    const { skills, passives } = this.progression.snapshot();
    // R1g-4: the evolution journey takes the paced profile, where the passive only has to
    // be owned (`>= 1`) rather than maxed (`>= 5`). Measured over 44 rules-only runs, the
    // maxed gate was met in 7 of them, always on the same row and never before 218.6s -
    // while the chests open at 90/210/300s, so the first was always empty. Relaxing it to
    // `>= 1` lifts evolutions per run to a median of 2 and puts a fusion in 8 of 44 runs.
    // Runs with no journey (classic) and chapter runs keep `>= 5` byte-identical.
    const gate = pacingProfile(this.progression.journey?.pacing);
    const options: ChestOption[] = [];
    // R1g-8 verified that this ordering *is* the rule and not a draw, and that it is migrated
    // legacy behaviour rather than anything this project introduced: `chests-oracle.json`'s last
    // selection case already pins six evolved rows to `焚天龙卷 / 天火炼狱 / 炎龙乱舞` with no
    // evolution offered at all. A fusion therefore cannot be lost at the offer, so G7's gap is
    // upstream - it is how rarely two parents are *both* evolved by the time a chest opens, which
    // is the level budget, not the pool. `fusionReachability.test.ts` pins both halves.
    for (const [id, [, a, b]] of Object.entries(fusion)) if (!this.forms.fused[id] && this.forms.evolved[a!] && this.forms.evolved[b!]) options.push({ type: 'fusion', id });
    for (const [id, [, a, p]] of Object.entries(evolution)) if (!this.forms.evolved[id] && (skills[a!] || 0) >= 5 && (passives[p!] || 0) >= gate.passiveGate) options.push({ type: 'evo', id });
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
