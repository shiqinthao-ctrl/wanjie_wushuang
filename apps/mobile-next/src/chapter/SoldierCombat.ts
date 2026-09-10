import type { CombatSimulation } from '../core/CombatSimulation';
import type { Enemy, Point } from '../core/spawnRules';

export const SOLDIER = Object.freeze({ range: 62, arc: Math.PI * 100 / 180, windup: .60, strike: .14, recovery: .70 });
export interface SoldierPose extends Point { facing: number; phase: 'windup' | 'strike' | 'recovery'; elapsed: number; range: number; arc: number }
export function isSoldier(enemy: Pick<Enemy, 'id' | 'elite'>): boolean { return enemy.id === 'EN001' && !enemy.elite; }

/** Weak keys allow despawn/caps to discard an actor without leaving an attack behind. */
export class SoldierCombat {
  private poses = new WeakMap<Enemy, SoldierPose>();
  constructor(private sim: CombatSimulation) {}
  snapshot(enemy: Enemy) { const pose = this.poses.get(enemy); return pose ? Object.freeze({ ...pose }) : undefined; }
  forget(enemy: Enemy) { this.poses.delete(enemy); }
  update(enemy: Enemy, dt: number): boolean {
    if (!isSoldier(enemy)) return false;
    const player = this.sim.player, dx = player.x - enemy.x, dy = player.y - enemy.y, distance = Math.hypot(dx, dy);
    const pose = this.poses.get(enemy);
    if (!pose) {
      if (distance > SOLDIER.range) {
        const speed = enemy.speed * ((enemy.chilledUntil || 0) > this.sim.time ? .55 : 1);
        const step = Math.min(distance - SOLDIER.range, speed * dt);
        enemy.x += dx / distance * step; enemy.y += dy / distance * step;
      } else this.poses.set(enemy, { x: enemy.x, y: enemy.y, facing: Math.atan2(dy, dx), phase: 'windup', elapsed: 0, range: SOLDIER.range, arc: SOLDIER.arc });
      return true;
    }
    // External pulls cannot leave a damaging weapon at an abandoned position.
    if (pose.phase === 'windup' && Math.hypot(enemy.x - pose.x, enemy.y - pose.y) > enemy.r) {
      Object.assign(pose, { phase: 'recovery', elapsed: 0 }); return true;
    }
    pose.elapsed += dt;
    if (pose.phase === 'windup' && pose.elapsed + 1e-9 >= SOLDIER.windup) {
      pose.phase = 'strike'; pose.elapsed = 0;
      this.sim.enemyStrike({ ...pose, source: enemy.id }, enemy.damage);
    } else if (pose.phase === 'strike' && pose.elapsed + 1e-9 >= SOLDIER.strike) {
      pose.phase = 'recovery'; pose.elapsed = 0;
    } else if (pose.phase === 'recovery' && pose.elapsed + 1e-9 >= SOLDIER.recovery) this.poses.delete(enemy);
    return true;
  }
  destroy() { this.poses = new WeakMap(); }
}
