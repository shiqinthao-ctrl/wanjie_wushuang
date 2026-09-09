import config from '../data/firstBoss.json';
import { clampPoint, difficultyFor, firstStage } from './spawnRules';
import type { Point } from './spawnRules';
import type { CombatSimulation } from './CombatSimulation';
import type { GearInstance } from './saveTypes';
import { bossGearChoices, generateGear } from './gearDrops';
import { instanceScore } from './growth';

export interface Boss extends Point { id: string; name: string; hp: number; maxHp: number; r: number; phase: number; castCd: number; castLock: number; shield: number; skillIndex: number; next: string }
type WarningBase = Point & { name: string; life: number; max: number; color: string; damage: number; resolved: boolean };
export type Telegraph = WarningBase & ({ type: 'circle'; r: number } | { type: 'line'; x2: number; y2: number; width: number; moveBoss: boolean } | { type: 'cone'; range: number; arc: number; angle: number });
export function insideTelegraph(point: Point, warning: Telegraph): boolean {
  const dx = point.x - warning.x, dy = point.y - warning.y;
  if (warning.type === 'circle') return Math.hypot(dx, dy) <= warning.r;
  if (warning.type === 'cone') return Math.hypot(dx, dy) <= warning.range && Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - warning.angle), Math.cos(Math.atan2(dy, dx) - warning.angle))) <= warning.arc / 2;
  const vx = warning.x2 - warning.x, vy = warning.y2 - warning.y;
  const t = Math.max(0, Math.min(1, (dx * vx + dy * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(dx - t * vx, dy - t * vy) <= warning.width / 2;
}

export class FirstBoss {
  active: Boss | undefined;
  readonly telegraphs: Telegraph[] = [];
  maxPhase = 1;
  private defeatedAt: number | undefined;
  private offer: GearInstance[] | undefined;
  private picked = false;
  private resolvedAt: number | undefined;
  private settlingAt: number | undefined;
  private destroyed = false;
  constructor(private sim: CombatSimulation, private hero: string, private difficulty: string, private random: () => number, private now: () => number) {}
  spawn(): boolean {
    if (this.destroyed || this.active || this.defeatedAt !== undefined || this.sim.time < (this.sim.chapter?.stage.boss.spawnAt ?? firstStage.bossAt)) return false;
    const { player, viewport, time } = this.sim, minutes = time / 60;
    const hp = config.boss.hp * difficultyFor(this.difficulty).hp * (.85 + (1 + .07 * minutes + .012 * minutes * minutes) * .22) * firstStage.bossHp;
    this.active = { id: 'B001', name: config.boss.name, hp, maxHp: hp, r: 42, x: player.x + viewport.width * .28, y: player.y - viewport.height * .16, phase: 1, castCd: 1.7, castLock: .7, shield: 0, skillIndex: 0, next: '准备攻击' };
    clampPoint(this.active, this.sim.world, 45); return true;
  }
  defeat(): void {
    if (!this.active || this.defeatedAt !== undefined || this.destroyed) return;
    this.active = undefined;
    if (!this.sim.chapter) this.sim.drops.push(generateGear(this.hero, 'boss', this.random, this.now, this.dropOptions()));
    this.defeatedAt = this.sim.time;
  }
  private dropOptions() { return { difficulty: this.difficulty, dropBonus: this.sim.context.runePet.dropPct || 0 }; }
  updateAI(dt: number): void {
    const boss = this.active; if (!boss || this.destroyed) return;
    const ratio = boss.hp / Math.max(1, boss.maxHp), phase = ratio <= .35 ? 3 : ratio <= .70 ? 2 : 1;
    if (phase > boss.phase) {
      boss.phase = phase; boss.castCd = 1.2; boss.castLock = 1.05;
      this.maxPhase = Math.max(this.maxPhase, phase);
      if (phase === 3) for (let i = 0; i < 3; i++) this.sim.spawn({ elite: i === 0 });
    }
    boss.castLock = Math.max(0, boss.castLock - dt); boss.castCd -= dt;
    const player = this.sim.player, dx = player.x - boss.x, dy = player.y - boss.y, distance = Math.hypot(dx, dy) || 1, diff = difficultyFor(this.difficulty);
    if (boss.castLock <= 0 && distance > 155) {
      const speed = (38 + boss.phase * 7) * diff.speed;
      boss.x += dx / distance * speed * dt; boss.y += dy / distance * speed * dt;
    }
    if (distance < boss.r + player.r + 4 && player.inv <= 0) this.sim.hurt((11 + boss.phase * 3) * diff.dmg, 'B001-contact');
    if (boss.castCd > 0 || boss.castLock > 0) return;
    boss.skillIndex = (boss.skillIndex + 1) % 3;
    const [type, name] = config.mechanics.skills[(boss.skillIndex + boss.phase - 1) % 3]!;
    const damage = 13 + boss.phase * 4, delay = Math.max(.55, .95 - boss.phase * .08) * firstStage.telegraphScale;
    const base: WarningBase = { name: name!, x: boss.x, y: boss.y, damage, life: delay, max: delay, color: '#ef5d58', resolved: false };
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    if (type === 'circle') {
      this.telegraphs.push({ ...base, type, x: player.x, y: player.y, r: boss.phase === 3 ? 86 : 70, damage: damage * 1.25 }); boss.next = `${name} · 离开红圈`;
    } else if (type === 'line') {
      const length = Math.max(this.sim.viewport.width, this.sim.viewport.height) * .92;
      this.telegraphs.push({ ...base, type, x2: boss.x + Math.cos(angle) * length, y2: boss.y + Math.sin(angle) * length, width: boss.phase === 3 ? 54 : 44, damage: damage * 1.15, moveBoss: true }); boss.next = `${name} · 横向闪避`;
    } else {
      this.telegraphs.push({ ...base, type: 'cone', range: 230 + boss.phase * 25, arc: Math.PI * (boss.phase === 3 ? .72 : .55), angle, damage: damage * 1.22 }); boss.next = `${name} · 绕至侧后`;
    }
    boss.castLock = delay + .12; boss.castCd = Math.max(.9, (3 - boss.phase * .38) / diff.speed);
  }
  updateTelegraphs(dt: number): void {
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const warning = this.telegraphs[i]!; warning.life -= dt;
      if (warning.life > 0) continue;
      if (!warning.resolved) {
        warning.resolved = true;
        if (insideTelegraph(this.sim.player, warning)) this.sim.hurt(warning.damage * difficultyFor(this.difficulty).dmg, `B001-${warning.name}`);
        if (warning.type === 'line' && warning.moveBoss && this.active) { this.active.x = warning.x2; this.active.y = warning.y2; clampPoint(this.active, this.sim.world, 45); }
      }
      this.telegraphs.splice(i, 1);
    }
  }
  updateObjective(): 'victory' | 'timeout' | undefined {
    if (this.destroyed) return;
    this.spawn();
    if (this.defeatedAt !== undefined) {
      // The former 180ms timer now uses the paused battle clock and cannot outlive a run.
      if (!this.sim.chapter && !this.offer && !this.picked && this.sim.time - this.defeatedAt >= .18) this.offer = bossGearChoices(this.hero, this.random, this.now, this.dropOptions());
      if (!this.picked || (!this.sim.chapter && !this.sim.drops.some(drop => drop.source === 'boss'))) return;
      if (this.resolvedAt === undefined) { this.resolvedAt = this.sim.time; return; }
      if (this.sim.time - this.resolvedAt < .75) return;
      if (this.settlingAt === undefined) { this.settlingAt = this.sim.time; return; }
      if (this.sim.time - this.settlingAt >= .25) return 'victory';
      return;
    }
    if (this.sim.time >= (this.sim.chapter?.stage.duration ?? firstStage.duration)) return 'timeout';
  }
  pick(uid: string): boolean {
    const item = this.offer?.find(item => item.uid === uid);
    if (this.destroyed || !item || this.picked) return false;
    this.sim.drops.push({ ...item, score: instanceScore(item, this.hero) }); this.picked = true; this.offer = undefined; return true;
  }
  pickChapterLoot(): boolean {
    if (!this.snapshot().chapterLoot) return false;
    this.picked = true; return true;
  }
  snapshot() {
    return Object.freeze({ boss: this.active ? Object.freeze({ ...this.active, phaseName: config.mechanics.phase[this.active.phase - 1]! }) : undefined,
      chapterLoot: !!this.sim.chapter && !this.destroyed && this.defeatedAt !== undefined && !this.picked && this.sim.time - this.defeatedAt >= .18,
      lootClaimed: this.picked,
      lootShown: this.defeatedAt !== undefined, offer: this.offer ? Object.freeze(this.offer.map(item => Object.freeze({ ...item, name: String(item.name), affixes: Object.freeze(item.affixes?.map(affix => Object.freeze({ ...affix })) || []) }))) : undefined,
      phase: this.settlingAt !== undefined ? 'settling' : this.resolvedAt !== undefined || this.picked ? 'confirmed' : this.offer ? 'choice' : this.defeatedAt !== undefined ? 'opening' : this.active ? 'fight' : this.sim.time >= 250 ? 'warning' : 'advance' });
  }
  destroy(): void { this.destroyed = true; this.active = undefined; this.telegraphs.length = 0; this.offer = undefined; }
}
