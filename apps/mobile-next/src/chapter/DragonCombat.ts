import type { Action, CombatSimulation } from '../core/CombatSimulation';
import type { Point } from '../core/spawnRules';
import { skillModifier } from '../core/combatMath';

type Body = Point & { r: number };
type AttackKind = 'basic' | 'skill' | 'ultimate' | 'core';
interface AttackRule { source: string; windup: number; gap: number; recovery: number; radius: number; damage: number; blade: number; reach: number }
const ARC = Math.PI * 112 / 180;
const rules: Record<AttackKind, AttackRule> = {
  basic: { source: 'H001_DRAGON_BASIC', windup: .12, gap: .12, recovery: .10, radius: 128, damage: 1.1, blade: 0, reach: 0 },
  skill: { source: 'H001_DRAGON_E', windup: .22, gap: .12, recovery: .20, radius: 160, damage: 1.65, blade: 1.2, reach: 480 },
  ultimate: { source: 'H001_DRAGON_R', windup: .28, gap: .12, recovery: .24, radius: 180, damage: 1.7, blade: 1.1, reach: 520 },
  core: { source: 'A003', windup: .10, gap: 0, recovery: 0, radius: 0, damage: 0, blade: 1.15, reach: 420 },
};
interface Strike extends Point { facing: number; started: number; due: number }
interface Sequence { kind: AttackKind; count: number; index: number; next: number; strike?: Strike }
interface Blade extends Point { facing: number; radius: number; remaining: number; source: string; damage: number; hit: Set<object> }
export interface DragonPose extends Point { facing: number; radius: number; angle: number; source: string; phase: 'windup' | 'release'; progress: number }

/** First contact along a swept segment, including the two end caps. */
export function segmentContact(a: Point, b: Point, target: Body, width = 0): number | undefined {
  const dx = b.x - a.x, dy = b.y - a.y, ox = a.x - target.x, oy = a.y - target.y;
  const r = target.r + width, c = ox * ox + oy * oy - r * r;
  if (c <= 0) return 0;
  const length = dx * dx + dy * dy;
  if (!length) return;
  const dot = ox * dx + oy * dy, discriminant = dot * dot - length * c;
  if (discriminant < 0) return;
  const t = (-dot - Math.sqrt(discriminant)) / length;
  return t >= 0 && t <= 1 ? t : undefined;
}
export function inDragonSector(origin: Point, facing: number, radius: number, target: Body): boolean {
  const dx = target.x - origin.x, dy = target.y - origin.y, distance = Math.hypot(dx, dy);
  const delta = Math.atan2(Math.sin(Math.atan2(dy, dx) - facing), Math.cos(Math.atan2(dy, dx) - facing));
  if (Math.abs(delta) <= ARC / 2) return distance <= radius + target.r;
  const edge = facing + Math.sign(delta) * ARC / 2;
  return segmentContact(origin, { x: origin.x + Math.cos(edge) * radius, y: origin.y + Math.sin(edge) * radius }, target) !== undefined;
}

/** Chapter-only attacks. No timers or render callbacks; all work uses the run clock. */
export class DragonCombat {
  private hero?: Sequence;
  private core?: Sequence;
  private releases: (DragonPose & { until: number })[] = [];
  private blades: Blade[] = [];
  private destroyed = false;
  constructor(private sim: CombatSimulation, private awakened: () => boolean) {}
  private begin(kind: AttackKind, count: number): Sequence {
    const sequence = { kind, count, index: 0, next: this.sim.time };
    this.prepare(sequence); return sequence;
  }
  private prepare(sequence: Sequence): void {
    const now = this.sim.time;
    sequence.strike = { x: this.sim.player.x, y: this.sim.player.y, facing: this.sim.movementFacing(), started: now, due: now + rules[sequence.kind].windup };
    this.sim.feedback('hero-windup', rules[sequence.kind].source);
  }
  basic(): void {
    if (!this.destroyed && !this.hero) this.hero = this.begin('basic', this.awakened() ? 2 : 1);
  }
  castCore(): void { if (!this.destroyed && !this.core) this.core = this.begin('core', 1); }
  action(kind: Exclude<Action, 'dodge'>): boolean {
    const p = this.sim.player;
    if (this.destroyed || (this.hero && this.hero.kind !== 'basic')) return false;
    if (kind === 'skill') {
      if (p.skillCd > 0) return false;
      p.skillCd = 6 * Math.max(.55, 1 - (this.sim.context.gear.cdr || 0));
    } else { if (p.ult < 100) return false; p.ult = 0; }
    // Manual actions may replace a basic attack, but cannot queue over each other.
    this.hero = this.begin(kind, kind === 'skill' ? this.awakened() ? 2 : 1 : this.awakened() ? 5 : 3);
    return true;
  }
  cancel(): void { this.hero = undefined; this.core = undefined; }
  private release(sequence: Sequence, strike: Strike): void {
    const s = this.sim, rule = rules[sequence.kind];
    if (rule.radius) {
      for (const enemy of [...s.enemies]) if (inDragonSector(strike, strike.facing, rule.radius, enemy)) s.hit(enemy, s.player.atk * rule.damage, rule.source);
      if (s.boss && inDragonSector(strike, strike.facing, rule.radius, s.boss)) s.hitBoss(s.player.atk * rule.damage, rule.source);
      const pose: DragonPose = { x: strike.x, y: strike.y, facing: strike.facing, radius: rule.radius, angle: ARC, source: rule.source, phase: 'release', progress: 0 };
      this.releases.push({ ...pose, until: s.time + .16 });
      s.dragonSlash(pose);
    }
    if (rule.blade) {
      const range = sequence.kind === 'core' ? skillModifier(s.context, s.state(), 'A003').range : 1;
      this.blades.push({ x: strike.x, y: strike.y, facing: strike.facing, radius: 9 * range, remaining: rule.reach * range, source: rule.source, damage: s.player.atk * rule.blade, hit: new Set() });
    }
  }
  private advanceSequence(sequence: Sequence | undefined): Sequence | undefined {
    if (!sequence) return;
    const now = this.sim.time, rule = rules[sequence.kind];
    if (!sequence.strike && now >= sequence.next) {
      if (sequence.index >= sequence.count) return;
      this.prepare(sequence);
    }
    if (sequence.strike && now + 1e-8 >= sequence.strike.due) {
      this.release(sequence, sequence.strike); sequence.strike = undefined; sequence.index++;
      sequence.next = now + (sequence.index < sequence.count ? rule.gap : rule.recovery);
    }
    return sequence;
  }
  update(dt: number): void {
    if (this.destroyed) return;
    const s = this.sim;
    this.releases = this.releases.filter(pose => pose.until > s.time);
    // Move existing blades first: a newly released blade starts moving next frame.
    for (const blade of this.blades) {
      const length = Math.min(blade.remaining, dt * 540);
      const next = { x: blade.x + Math.cos(blade.facing) * length, y: blade.y + Math.sin(blade.facing) * length };
      const candidates = [...s.enemies, ...(s.boss ? [s.boss] : [])]
        .filter(target => !blade.hit.has(target)).map(target => ({ target, t: segmentContact(blade, next, target, blade.radius) }))
        .filter((entry): entry is typeof entry & { t: number } => entry.t !== undefined).sort((a, b) => a.t - b.t);
      for (const { target } of candidates) {
        if (blade.hit.size >= 5) break;
        blade.hit.add(target);
        if (target === s.boss) s.hitBoss(blade.damage, blade.source, blade.source === 'A003');
        else s.hit(target as CombatSimulation['enemies'][number], blade.damage, blade.source, false, blade.source === 'A003');
      }
      Object.assign(blade, next); blade.remaining -= length;
    }
    this.blades = this.blades.filter(blade => blade.remaining > 0 && blade.hit.size < 5);
    this.hero = this.advanceSequence(this.hero); this.core = this.advanceSequence(this.core);
  }
  snapshot() {
    const poses: DragonPose[] = this.releases.map(({ until, ...pose }) => ({ ...pose, progress: 1 - (until - this.sim.time) / .16 }));
    for (const sequence of [this.hero, this.core]) if (sequence?.strike) {
      const { strike, kind } = sequence;
      poses.push({ x: strike.x, y: strike.y, facing: strike.facing, radius: rules[kind].radius, angle: ARC, source: rules[kind].source, phase: 'windup', progress: Math.min(1, (this.sim.time - strike.started) / rules[kind].windup) });
    }
    return Object.freeze({ facing: this.sim.movementFacing(), awakened: this.awakened(), poses: Object.freeze(poses.map(pose => Object.freeze(pose))),
      blades: Object.freeze(this.blades.map(({ x, y, facing, radius, source }) => Object.freeze({ x, y, facing, radius, source }))) });
  }
  destroy(): void { this.destroyed = true; this.cancel(); this.releases = []; this.blades = []; }
}
export type DragonSnapshot = ReturnType<DragonCombat['snapshot']>;
