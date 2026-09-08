import type { CombatSimulation, Action } from './CombatSimulation';
import type { RunEvolution } from './RunEvolution';
import type { Enemy, Point } from './spawnRules';
import { cap, clampPoint } from './spawnRules';
import { passiveLevel, skillModifier } from './combatMath';

interface Summon extends Point { id: string; life: number; tick: number; angle: number; guard: boolean; dmg: number; color: string }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Run-only abilities share the simulation's clock, collisions and damage authority. */
export class EvolutionCombat {
  readonly summons: Summon[] = [];
  constructor(private sim: CombatSimulation, private journey: RunEvolution) {}
  private get view() { return this.journey.snapshot(this.sim.state().skills); }
  private fan(id: string, count: number, damage: number, pierce = 0, explode = 0) {
    const s = this.sim;
    for (let i = 0; i < count; i++) s.projectile(id, s.player, s.heroAim() + (i - (count - 1) / 2) * .23, 440, damage, 7, { pierce, explode, color: this.view.color });
  }
  basic(): void {
    const s = this.sim, p = s.player, v = this.view, id = `${v.heroId}_BASIC`;
    if (!s.boss && !s.nearest()) return;
    switch (v.formId) {
      case 'frostlord': this.frost('G2_FROST_BASIC', p, v.rank === 2 ? 145 : 120, p.atk, 1.2); break;
      case 'thunderlord': this.lightning('G2_LIGHTNING_BASIC', v.rank === 2 ? 3 : 2, p.atk * .8, 1); break;
      case 'beastlord': this.fan('H012_BASIC', 2, p.atk * .8, 2); break;
      case 'dragon': s.arc(120, p.atk * 1.1, id, v.rank === 2 ? Math.PI * 2 : Math.PI * 1.2); this.fan(id, v.rank === 2 ? 3 : 1, p.atk * .65, 1); break;
      case 'bulwark': s.arc(v.rank === 2 ? 155 : 130, p.atk * 1.3, id, Math.PI * 2); break;
      case 'phoenix': this.fan(id, v.rank === 2 ? 5 : 3, p.atk * .65, 0, 28); break;
      case 'legion': this.fan(id, 2, p.atk * .8, 1); break;
      case 'void': this.fan(id, 2, p.atk, v.rank === 2 ? 5 : 3); break;
      case 'reaper':
        s.arc(130, p.atk * 1.5, id, Math.PI * (v.rank === 2 ? 2 : 1.4));
        if (v.rank === 2) s.arc(130, p.atk * .6, id, Math.PI * 2);
        break;
      default:
        if (v.heroId === 'H001') s.arc(105 + s.heat * .35, p.atk * (1.05 + s.heat * .006), 'H001_SLASH', Math.PI * 1.15);
        else this.fan(id, 1, p.atk * 1.15, v.heroId === 'H012' ? 2 : 0, v.heroId === 'H010' ? 40 : 0);
    }
    s.heat = Math.min(100, s.heat + 8);
  }
  private dash(length: number, source: string, trail = false) {
    const s = this.sim, p = s.player, angle = s.heroAim();
    if (trail) for (let i = 0; i < 5; i++) s.field(source, { x: p.x + Math.cos(angle) * length * i / 4, y: p.y + Math.sin(angle) * length * i / 4 }, 48, p.atk * .22, this.view.rank === 2 ? 4 : 2.5);
    p.x += Math.cos(angle) * length; p.y += Math.sin(angle) * length; clampPoint(p, s.world, 18);
    p.inv = Math.max(p.inv, .25);
  }
  action(action: Exclude<Action, 'dodge'>): boolean {
    const s = this.sim, p = s.player, v = this.view, id = `${v.heroId}_${action === 'skill' ? 'E' : 'R'}`;
    if (action === 'skill') {
      if (p.skillCd > 0) return false;
      p.skillCd = 6 * Math.max(.55, 1 - (s.context.gear.cdr || 0));
      if (v.formId === 'frostlord') this.frostField('G2_FROST_E', v.rank === 2 ? 200 : 160, p.atk * .28, v.rank === 2 ? 5 : 3, true);
      else if (v.formId === 'thunderlord') this.lightning('G2_LIGHTNING_E', v.rank === 2 ? 7 : 5, p.atk * 1.7, 1);
      else if (v.formId === 'beastlord') this.summon('H012_CLONE', v.rank === 2 ? 4 : 3, v.rank === 2 ? 8 : 6, true, p.atk * .8);
      else if (v.formId === 'bulwark') {
        s.field(id, p, v.rank === 2 ? 210 : 170, p.atk * .5, 4, true);
        p.shield = Math.max(p.shield, p.maxHp * (v.rank === 2 ? .24 : .16));
      } else if (v.formId === 'legion') this.summon('H010_CLONE', v.rank === 2 ? 3 : 2, v.rank === 2 ? 7 : 5, false, p.atk * .65);
      else if (v.formId === 'void') this.vortex(id, v.rank === 2 ? 145 : 110, p.atk * .45, 5, false);
      else {
        this.dash(150, id, v.heroId === 'H010' || v.heroId === 'H001');
        s.arc(150, p.atk * 2.2, id, Math.PI * 2);
        if (v.formId === 'reaper') s.arc(160, p.atk * 1.5, id, Math.PI * 2);
      }
    } else {
      if (p.ult < 100) return false;
      p.ult = 0;
      if (v.heroId === 'H012' || v.formId === 'legion') this.summon(`${v.heroId}_R_CLONE`, v.formId === 'beastlord' ? 6 : v.rank === 2 ? 5 : 4, 7, false, p.atk);
      if (v.formId === 'frostlord') this.frost('G2_FROST_R', p, 300, p.atk * 6, 3);
      else if (v.formId === 'thunderlord') this.lightningArea('G2_LIGHTNING_R', p, 330, p.atk * 6);
      else if (v.formId === 'beastlord') s.ring(p, 180, 'H012_R_CLONE');
      else if (v.formId === 'void') this.vortex(id, 190, p.atk * .8, 6, true);
      else if (v.heroId === 'H010') for (let i = 0; i < 16; i++) s.projectile(id, p, i * Math.PI / 8, 340, p.atk * 2.4, 10, { pierce: 2, explode: 65, color: v.color });
      else { s.arc(260, p.atk * 8, id, Math.PI * 2); s.field(id, p, 180, p.atk * .6, 4, true); }
    }
    s.heat = Math.min(100, s.heat + 30); return true;
  }
  afterDodge(origin: Point): void {
    const s = this.sim;
    if (this.journey.bond('shadowfire', s.state().skills)) s.field('H010_BOND', origin, 85, s.player.atk * .35, 3);
    if (this.view.formId === 'reaper' && this.view.rank === 2) this.fan('H012_DODGE', 3, s.player.atk, 2);
  }
  private vortex(id: string, r: number, dmg: number, life: number, orbit: boolean) {
    const s = this.sim, angle = s.heroAim();
    s.vortices.push({ id, x: s.player.x, y: s.player.y, vx: Math.cos(angle) * 85, vy: Math.sin(angle) * 85, r, dmg, life, max: life, tick: 0, follow: orbit, color: '#82d6b7' }); cap(s.vortices, 10);
  }
  private summon(id: string, count: number, life: number, guard: boolean, dmg: number) {
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI * 2 / count;
      this.summons.push({ id, x: this.sim.player.x + Math.cos(angle) * 68, y: this.sim.player.y + Math.sin(angle) * 68, life, angle, tick: .12 * i, guard, dmg, color: id.startsWith('H010') ? '#f5ad86' : '#86d6d9' });
    }
    cap(this.summons, 8);
  }
  private frost(id: string, point: Point, radius: number, damage: number, duration: number) {
    const s = this.sim;
    s.explosion(id, point, radius, damage);
    for (const enemy of s.enemies) if (distance(enemy, point) <= radius) enemy.chilledUntil = Math.max(enemy.chilledUntil || 0, s.time + duration);
  }
  private frostField(id: string, radius: number, damage: number, life: number, follow: boolean) {
    this.sim.field(id, this.sim.player, radius, damage, life, follow, { color: '#8de8ff', chill: 1.2 });
  }
  private lightningHit(id: string, target: Enemy | NonNullable<CombatSimulation['boss']>, damage: number) {
    const s = this.sim;
    if (target === s.boss) s.hitBoss(damage, id, true);
    else {
      const enemy = target as Enemy;
      const bonus = this.journey.bond('superconduct', s.state().skills) && (enemy.chilledUntil || 0) > s.time ? 1.35 : 1;
      s.hit(enemy, damage * bonus, id, false, true);
    }
    s.ring(target, 28, id);
  }
  private lightningArea(id: string, point: Point, radius: number, damage: number) {
    const s = this.sim;
    for (const enemy of [...s.enemies]) if (distance(enemy, point) <= radius) this.lightningHit(id, enemy, damage);
    if (s.boss && distance(s.boss, point) <= radius + s.boss.r) this.lightningHit(id, s.boss, damage);
    s.ring(point, radius, id);
  }
  private lightning(id: string, count: number, damage: number, range: number) {
    const s = this.sim, remaining = [...s.enemies, ...(s.boss ? [s.boss] : [])]; let from: Point = s.player;
    for (let i = 0; i < Math.min(10, count); i++) {
      remaining.sort((a, b) => distance(a, from) - distance(b, from)); const target = remaining.shift();
      if (!target || distance(target, from) > (i === 0 ? 480 : 220) * range) break;
      this.lightningHit(id, target, damage); from = target;
    }
  }
  cast(id: string): boolean {
    const s = this.sim, p = s.player, m = skillModifier(s.context, s.state(), id), route = this.journey.route(id);
    if (id === 'G2_FROST') {
      if (route === 'glacier') this.frostField(id, 155 * m.range, p.atk * .18, 3 * m.duration, false);
      else this.frost(id, p, (route === 'shatter' ? 200 : 135) * m.range, p.atk * (route === 'shatter' ? 1.7 : .9), (route === 'shatter' ? 2 : 1.5) * m.duration);
    } else if (id === 'A011' && route) {
      const count = route === 'volley' ? 3 : 1;
      for (let i = 0; i < count; i++) s.projectile(id, p, s.heroAim() + (i - (count - 1) / 2) * .23, route === 'volley' ? 390 : 260, p.atk * .95 * (route === 'volley' ? .65 : 1.45), 9, { explode: (route === 'volley' ? 58 : 110) * m.range, split: passiveLevel(s.context, s.state(), 'P024') ? 1 : 0 });
    } else if (id === 'A026') this.vortex(id, (m.evo ? 108 : 82) * m.range, p.atk * .20, (m.evo ? 6.5 : 4.5) * m.duration, route === 'orbit');
    else if (id === 'A015') this.fan(id, Math.min(7, 3 + Math.floor(passiveLevel(s.context, s.state(), 'P024') / 2)), p.atk * .7, 2 + Math.floor(m.lv / 2));
    else if (id === 'S001') this.summon(id, Math.min(6, 1 + m.count), 4.5 * m.duration, route === 'guard', p.atk * .65);
    else if (id === 'A013') {
      const count = 2 + passiveLevel(s.context, s.state(), 'P023') + (this.journey.bond('stormhunt', s.state().skills) ? 1 : 0);
      if (route === 'thunderstrike') {
        const target = [...s.enemies, ...(s.boss ? [s.boss] : [])].sort((a, b) => distance(a, p) - distance(b, p))[0];
        if (target && distance(target, p) <= 480 * m.range) this.lightningArea(id, target, 105 * m.range, p.atk * .9 * 2.1);
      } else this.lightning(id, count + (route === 'relay' ? 2 : 0), p.atk * .9 * (route === 'relay' ? .72 : 1), m.range);
    } else return false;
    return true;
  }
  update(dt: number): void {
    const s = this.sim;
    for (let i = this.summons.length - 1; i >= 0; i--) {
      const unit = this.summons[i]!; unit.life -= dt; unit.tick -= dt;
      if (unit.life <= 0) { this.summons.splice(i, 1); continue; }
      if (!unit.guard) { unit.x = s.player.x + Math.cos(unit.angle + s.time * .5) * 68; unit.y = s.player.y + Math.sin(unit.angle + s.time * .5) * 68; }
      if (unit.tick <= 0) {
        unit.tick = this.journey.bond('thunderlegion', s.state().skills) ? .6 : .8;
        if (this.journey.bond('winterlegion', s.state().skills)) this.frost('G2_FROST_CLONE', unit, 70, unit.dmg * .25, 1);
        if (unit.guard) s.explosion(unit.id, unit, 125 * skillModifier(s.context, s.state(), unit.id).range, unit.dmg);
        else {
          const target = s.boss || s.nearest();
          if (target) s.projectile(unit.id, unit, Math.atan2(target.y - unit.y, target.x - unit.x), 420, unit.dmg, 6, { pierce: 1, color: unit.color });
        }
      }
    }
  }
  destroy(): void { this.summons.length = 0; }
}
