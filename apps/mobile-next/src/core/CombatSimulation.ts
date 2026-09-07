import { calculateStartup } from './growth';
import { bossHit, combatContext, enemyHit, incomingHit, passiveLevel, skillModifier } from './combatMath';
import type { CombatState } from './combatMath';
import type { GameSave, GearInstance } from './saveTypes';
import { Progression, XpField, effectiveXp } from './progression';
import { cap, caps, clampPoint, createEnemy, difficultyFor, director, earlyEnemyCap, firstStage, waveAt } from './spawnRules';
import type { Enemy, Point } from './spawnRules';
import forms from '../data/skillForms.json';
import pets from '../data/runePets.json';
import { FirstStageMap } from './FirstStageMap';
import { FirstBoss } from './FirstBoss';
import { generateGear } from './gearDrops';

export type Action = 'skill' | 'dodge' | 'ultimate';
export type CombatEvent = { type: 'ring'; x: number; y: number; radius: number; source: string }
  | { type: 'hit'; x: number; y: number; damage: number; critical: boolean }
  | { type: 'kill'; x: number; y: number; elite: boolean };
interface Projectile extends Point { id: string; vx: number; vy: number; dmg: number; r: number; life: number; pierce: number; split: number; explode: number; color: string }
interface Field extends Point { id: string; r: number; dmg: number; life: number; max: number; tick: number; follow: boolean; color: string }
interface Vortex extends Field { vx: number; vy: number }
interface Meteor extends Point { id: string; r: number; dmg: number; life: number; max: number; color: string }
interface Bomb extends Point { r: number; life: number; max: number; dmg: number; color: string }
interface HostileShot extends Point { vx: number; vy: number; dmg: number; r: number; life: number; color: string }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const cloneList = <T extends Point>(items: T[]) => items.map(item => Object.freeze({ ...item }));

/** One run's rule state; no DOM, clocks, audio, or presentation-dependent RNG. */
export class CombatSimulation {
  readonly context;
  readonly player;
  readonly crystals = new XpField();
  readonly world = { width: 3600, height: 2400 };
  readonly viewport = { width: 390, height: 844 };
  time = 0;
  kills = 0;
  eliteKills = 0;
  combo = 0;
  maxCombo = 0;
  heat = 0;
  petGold = 0;
  petDamage = 0;
  killBuff = 0;
  evolved: Record<string, boolean> = {};
  fused: Record<string, boolean> = {};
  readonly enemies: Enemy[] = [];
  readonly projectiles: Projectile[] = [];
  readonly fields: Field[] = [];
  readonly vortices: Vortex[] = [];
  readonly meteors: Meteor[] = [];
  readonly bombs: Bomb[] = [];
  readonly enemyShots: HostileShot[] = [];
  readonly cool: Record<string, number> = {};
  readonly pet;
  readonly map: FirstStageMap;
  readonly bossEncounter: FirstBoss;
  get boss() { return this.bossEncounter.active; }
  private input: Point = { x: 0, y: 0 };
  private response: Point = { x: 0, y: 0 };
  private dodgeDirection: Point = { x: 0, y: -1 };
  private events: CombatEvent[] = [];
  private scheduled: { delay: number; wave: number }[] = [];
  private spawnClock = 0;
  private attackClock = 0;
  private comboTimer = 0;
  private damage = 0;
  private lastDamage = 0;
  private dps = 0;
  private dpsClock = 0;
  private lastWave = 0;
  private auraNear = false;
  private shieldClock = 1;
  private difficulty: string;
  private runes: readonly string[];
  private baseAspd: number;
  private fusionClock = 0;

  constructor(save: GameSave, readonly progression: Progression, private random: () => number = Math.random, readonly drops: GearInstance[] = [], private now = Date.now) {
    if (save.hero !== 'H001' || save.pet !== 'PET001') throw new Error('This combat slice supports H001 with PET001 only');
    const startup = calculateStartup(save);
    this.context = combatContext(save, startup);
    this.player = { x: 1800, y: 1200, r: 15, ...startup.player, inv: 0, dodgeCd: 0, skillCd: 0, ult: 0, shield: 0, dodgeBuff: 0, incoming: firstStage.incoming };
    this.difficulty = String(save.difficulty || 'normal'); this.runes = [...save.runes];
    this.baseAspd = startup.player.aspd;
    const cd = pets.pets.PET001.cd;
    this.pet = { x: 1836, y: 1176, angle: 0, cd: cd * .35, maxCd: cd };
    this.map = new FirstStageMap(this, random);
    this.bossEncounter = new FirstBoss(this, save.hero, this.difficulty, random, now);
  }
  state(): CombatState { return { ...this.progression.snapshot(), ...this.player, evolved: this.evolved, killBuff: this.killBuff, mode: 'story' }; }
  directorState() { return { time: this.time, kills: this.kills, dps: this.dps, level: this.progression.snapshot().level, evolved: Object.keys(this.evolved).length, fused: Object.keys(this.fused).length }; }
  resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    this.viewport.width = width; this.viewport.height = height;
    this.world.width = Math.max(this.world.width, Math.ceil(width * 2.2));
    this.world.height = Math.max(this.world.height, Math.ceil(height * 2.2));
  }
  move(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const length = Math.max(1, Math.hypot(x, y)); this.input = { x: x / length, y: y / length };
  }
  clearInput(): void { this.input = { x: 0, y: 0 }; this.response = { x: 0, y: 0 }; }
  nearest(): Enemy | undefined {
    let best: Enemy | undefined, range = Infinity;
    for (const enemy of this.enemies) { const next = distance(this.player, enemy); if (next < range) { best = enemy; range = next; } }
    return best;
  }
  private aim(): number { const target = this.nearest(); return target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : 0; }
  private heroAim(): number { const target = this.boss || this.nearest(); return target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : 0; }
  private ring(point: Point, radius: number, source: string): void { this.events.push({ type: 'ring', x: point.x, y: point.y, radius, source }); }
  hurt(damage: number): void { Object.assign(this.player, incomingHit(this.context, this.player, damage)); }
  hitBoss(base: number, source: string, skill = false): void {
    const boss = this.boss; if (!boss) return;
    const hit = bossHit(this.context, this.state(), source, base, boss, skill);
    boss.hp = hit.hp; boss.shield = hit.shield; this.damage += hit.damage;
    this.events.push({ type: 'hit', x: boss.x, y: boss.y, damage: hit.damage, critical: false });
    if (boss.hp <= 0) this.bossEncounter.defeat();
  }
  hit(enemy: Enemy, base: number, source: string, critical = false, skill = false): void {
    if (!this.enemies.includes(enemy)) return;
    const hit = enemyHit(this.context, this.state(), source, base, enemy.elite, critical, skill);
    enemy.hp -= hit.damage; this.player.hp = hit.hp; this.damage += hit.damage; enemy.flash = 1;
    this.events.push({ type: 'hit', x: enemy.x, y: enemy.y, damage: hit.damage, critical });
    if (enemy.hp > 0) return;
    this.enemies.splice(this.enemies.indexOf(enemy), 1);
    this.kills++; this.combo++; this.comboTimer = 2; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.crystals.spawn(enemy, effectiveXp(enemy.elite, difficultyFor(this.difficulty).xp));
    this.player.ult = Math.min(100, this.player.ult + (enemy.elite ? 8 : 1.4));
    if (enemy.elite) this.eliteKills++;
    if (enemy.volatile) { this.ring(enemy, 58, 'volatile'); if (distance(this.player, enemy) < 58 && this.player.inv <= 0) this.hurt(enemy.damage * 1.2); }
    if (enemy.split) { this.spawn({ id: enemy.id }); this.spawn({ id: enemy.id }); }
    if (enemy.elite && this.random() < .45) this.drops.push(generateGear('H001', 'elite', this.random, this.now));
    if (this.runes.includes('R006')) this.killBuff = 3;
    if (this.runes.includes('R043')) this.progression.gain(Math.round((enemy.elite ? 18 : 4) * .18));
    if (this.runes.includes('R041')) this.petGold += enemy.elite ? 2 : .25;
    this.events.push({ type: 'kill', x: enemy.x, y: enemy.y, elite: enemy.elite });
  }
  arc(radius: number, damage: number, source: string, angle = Math.PI * 1.35): void {
    const base = this.heroAim();
    for (const enemy of [...this.enemies]) {
      const a = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
      const delta = Math.atan2(Math.sin(a - base), Math.cos(a - base));
      if (distance(enemy, this.player) <= radius && Math.abs(delta) <= angle / 2) this.hit(enemy, damage, source, this.random() < this.player.crit);
    }
    if (this.boss && distance(this.boss, this.player) <= radius) this.hitBoss(damage, source);
    this.ring(this.player, radius, source);
  }
  basic(): void {
    if (!this.boss && !this.nearest()) return;
    this.arc(105 + this.heat * .35, this.player.atk * (1.05 + this.heat * .006), 'H001_SLASH', Math.PI * 1.15);
    this.heat = Math.min(100, this.heat + 8);
  }
  action(action: Action): boolean {
    const p = this.player;
    if (action === 'dodge') {
      if (p.dodgeCd > 0) return false;
      const length = Math.hypot(this.input.x, this.input.y), direction = length ? { x: this.input.x / length, y: this.input.y / length } : this.dodgeDirection;
      const step = Math.min(90, p.speed * .34, Math.min(this.viewport.width, this.viewport.height) * .16);
      this.ring(p, 70, 'dodge'); this.dodgeDirection = direction;
      p.x += direction.x * step; p.y += direction.y * step; clampPoint(p, this.world, 18);
      p.dodgeCd = 4.5; p.inv = .35;
      if (this.runes.includes('R025')) { p.dodgeCd *= .88; p.dodgeBuff = 2; }
    } else if (action === 'skill') {
      if (p.skillCd > 0) return false;
      p.skillCd = 6; const angle = this.heroAim();
      for (let i = 0; i < 5; i++) this.bombs.push({ x: p.x + Math.cos(angle) * i * 36, y: p.y + Math.sin(angle) * i * 36, r: 48, life: .18 + i * .05, max: .18 + i * .05, dmg: p.atk * 1.35, color: '#ef7958' });
      p.x += Math.cos(angle) * 150; p.y += Math.sin(angle) * 150;
      this.arc(135, p.atk * 2.2, 'H001_E'); this.heat = Math.min(100, this.heat + 30);
      clampPoint(p, this.world, 18); p.skillCd *= Math.max(.55, 1 - (this.context.gear.cdr || 0));
    } else {
      if (p.ult < 100) return false;
      p.ult = 0; this.heat = 100;
      for (let wave = 0; wave < 4; wave++) this.scheduled.push({ delay: wave * .12, wave });
    }
    return true;
  }
  spawn(options: { id?: string; elite?: boolean } = {}): void {
    this.enemies.push(createEnemy(this.directorState(), this.player, this.viewport, this.world, this.difficulty, this.random, options));
  }
  private enemyAI(enemy: Enemy, dt: number): void {
    enemy.attack += dt; enemy.skill += dt; enemy.flash = Math.max(0, enemy.flash - dt * 5);
    const dx = this.player.x - enemy.x, dy = this.player.y - enemy.y, d = Math.hypot(dx, dy) || 1;
    if (enemy.aura && d < 140) this.auraNear = true;
    let move = 1;
    if (enemy.ai === 'ranged') {
      move = d > 300 ? .6 : d < 190 ? -.5 : 0;
    } else if (enemy.ai === 'shield') move = .65;
    enemy.x += dx / d * enemy.speed * move * dt; enemy.y += dy / d * enemy.speed * move * dt;
    if (enemy.ai === 'ranged' && enemy.attack > 1.8) {
      enemy.attack = 0; const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      this.enemyShots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 235, vy: Math.sin(angle) * 235, dmg: enemy.damage, color: enemy.color, r: 5, life: 5 });
    }
    // The original contact test uses distance sampled before movement.
    if (d < enemy.r + this.player.r + 2) { this.hurt(enemy.damage); if (enemy.vamp) enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * .05); }
  }
  beginFrame(dt: number): void {
    const p = this.player, slow = this.auraNear ? .82 : 1; this.auraNear = false;
    this.time += dt; p.inv = Math.max(0, p.inv - dt); p.dodgeCd = Math.max(0, p.dodgeCd - dt); p.skillCd = Math.max(0, p.skillCd - dt);
    this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0;
    const active = !!(this.input.x || this.input.y), alpha = 1 - Math.exp(-(active ? 56 : 72) * dt);
    this.response.x += (this.input.x - this.response.x) * alpha; this.response.y += (this.input.y - this.response.y) * alpha;
    const length = Math.hypot(this.response.x, this.response.y);
    if (!active && length < .015) this.response = { x: 0, y: 0 };
    else if (length) this.dodgeDirection = { x: this.response.x / length, y: this.response.y / length };
    p.x += this.response.x * p.speed * slow * dt; p.y += this.response.y * p.speed * slow * dt; clampPoint(p, this.world, 18);
    for (const action of this.scheduled) { action.delay -= dt; if (action.delay <= 0) this.arc(210 + action.wave * 18, p.atk * 4, 'H001_R', Math.PI * 2); }
    this.scheduled = this.scheduled.filter(action => action.delay > 0);
    this.spawnClock += dt; const interval = director(this.directorState(), p, this.difficulty).interval;
    while (this.spawnClock > interval) { this.spawnClock -= interval; this.spawn(); }
    cap(this.enemies, { easy: 190, normal: 250, hard: 320, nightmare: 380 }[this.difficulty] || 250);
    this.attackClock += dt; if (this.attackClock > 1 / Math.max(.6, p.aspd)) { this.attackClock = 0; this.basic(); }
    for (const enemy of [...this.enemies]) this.enemyAI(enemy, dt);
    this.bossEncounter.updateAI(dt);
  }
  finishBaseFrame(dt: number): void {
    for (let i = this.enemyShots.length - 1; i >= 0; i--) {
      const shot = this.enemyShots[i]!; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
      if (distance(this.player, shot) < this.player.r + shot.r) { this.hurt(shot.dmg); this.enemyShots.splice(i, 1); }
      else if (shot.life <= 0) this.enemyShots.splice(i, 1);
    }
    this.map.advanceHazards(dt);
    const wave = waveAt(this.time);
    if (this.lastWave !== wave.at) {
      this.lastWave = wave.at;
      if (wave.type === 'elite') for (let i = 0; i < (this.difficulty === 'nightmare' ? 2 : 1); i++) this.spawn({ elite: true });
    }
    this.dpsClock += dt;
    if (this.dpsClock >= 1) { this.dps = Math.round(this.damage - this.lastDamage); this.lastDamage = this.damage; this.dpsClock = 0; }
    cap(this.enemies, earlyEnemyCap(this.difficulty));
  }
  private projectile(id: string, point: Point, angle: number, speed: number, dmg: number, r: number, opts: Partial<Projectile> = {}): void {
    this.projectiles.push({ id, x: point.x, y: point.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dmg, r, life: 2, pierce: 0, split: 0, explode: 0, color: '#ef694e', ...opts }); cap(this.projectiles, 260);
  }
  private field(id: string, point: Point, r: number, dmg: number, life: number, follow = false): void {
    this.fields.push({ id, x: point.x, y: point.y, r, dmg, life, max: life, tick: 0, follow, color: '#ef694e' }); cap(this.fields, 22);
  }
  cast(id: string): void {
    const m = skillModifier(this.context, this.state(), id), p = this.player, target = this.nearest(), angle = this.aim(), R = m.range, D = p.atk;
    if (id === 'A003') { this.arc(118 * R, D * 1.05 * m.dmg, id, Math.PI * 1.15); this.field(id, p, 85 * R, D * .16, 2.2 * m.duration, true); }
    else if (id === 'A011') {
      const n = m.evo ? 3 : 1;
      for (let i = 0; i < n; i++) this.projectile(id, p, angle + (i - (n - 1) / 2) * .13, 390, D * .95, 7 + (m.evo ? 3 : 0), { explode: (m.evo ? 82 : 58) * R, split: passiveLevel(this.context, this.state(), 'P024') ? 1 : 0 });
    } else if (id === 'A021') { if (!this.fields.some(field => field.id === id)) this.field(id, p, (m.evo ? 155 : 112) * R, D * .18, 999, true); }
    else if (id === 'A026') {
      const life = (m.evo ? 6.5 : 4.5) * m.duration;
      this.vortices.push({ id, x: p.x, y: p.y, vx: Math.cos(angle) * 85, vy: Math.sin(angle) * 85, dmg: D * .20, r: (m.evo ? 108 : 82) * R, life, max: life, tick: 0, follow: false, color: '#82d6b7' }); cap(this.vortices, 10);
    } else if (id === 'A027') {
      const point = target || { x: p.x + 100, y: p.y }, n = (m.evo ? 5 : 3) + Math.floor(m.lv / 2);
      for (let i = 0; i < n; i++) {
        const x = point.x + (this.random() - .5) * 160, y = point.y + (this.random() - .5) * 140, life = .65 + this.random() * .55;
        this.meteors.push({ id, x, y, dmg: D * 1.35, r: (m.evo ? 70 : 52) * R, life, max: life, color: '#ef694e' }); cap(this.meteors, 28);
      }
    } else if (id === 'A054') for (let i = 1; i <= 5; i++) this.field(id, { x: p.x + Math.cos(angle) * i * 42, y: p.y + Math.sin(angle) * i * 42 }, 42 * R, D * .22, 2 * m.duration);
  }
  private explosion(id: string, point: Point, radius: number, dmg: number): void {
    this.ring(point, radius, id);
    for (const enemy of [...this.enemies]) if (distance(enemy, point) <= radius) this.hit(enemy, dmg, id, false, true);
    if (this.boss && distance(this.boss, point) <= radius + this.boss.r) this.hitBoss(dmg, id, true);
  }
  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const shot = this.projectiles[i]!; shot.life -= dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      const hit = this.enemies.find(enemy => distance(enemy, shot) < enemy.r + shot.r);
      if (hit) {
        this.hit(hit, shot.dmg, shot.id, false, true);
        if (shot.explode) this.explosion(shot.id, shot, shot.explode, shot.dmg * .72);
        if (shot.split > 0) for (const off of [-.36, .36]) this.projectile(shot.id, shot, Math.atan2(shot.vy, shot.vx) + off, Math.hypot(shot.vx, shot.vy) * .9, shot.dmg * .55, shot.r * .8, { color: shot.color, pierce: 1, split: shot.split - 1 });
        if (shot.pierce > 0) shot.pierce--; else { this.projectiles.splice(i, 1); continue; }
      }
      if (this.boss && distance(this.boss, shot) < this.boss.r + shot.r) {
        this.hitBoss(shot.dmg, shot.id, true);
        if (shot.explode) this.explosion(shot.id, shot, shot.explode, shot.dmg * .65);
        if (shot.pierce > 0) shot.pierce--; else { this.projectiles.splice(i, 1); continue; }
      }
      if (shot.life <= 0 || shot.x < -100 || shot.x > this.world.width + 100 || shot.y < -100 || shot.y > this.world.height + 100) this.projectiles.splice(i, 1);
    }
  }
  private updateFields(dt: number): void {
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const field = this.fields[i]!; field.life -= dt; field.tick -= dt;
      if (field.follow) { field.x = this.player.x; field.y = this.player.y; }
      if (field.tick <= 0) {
        field.tick = .30; for (const enemy of this.enemies.filter(enemy => distance(enemy, field) <= field.r)) this.hit(enemy, field.dmg, field.id, false, true);
        if (this.boss && distance(this.boss, field) <= field.r + this.boss.r) this.hitBoss(field.dmg * .8, field.id, true);
      }
      if (field.life <= 0) this.fields.splice(i, 1);
    }
  }
  private updateVortices(dt: number): void {
    for (let i = this.vortices.length - 1; i >= 0; i--) {
      const vortex = this.vortices[i]!; vortex.life -= dt; vortex.tick -= dt; vortex.x += vortex.vx * dt; vortex.y += vortex.vy * dt;
      for (const enemy of this.enemies) {
        const dx = vortex.x - enemy.x, dy = vortex.y - enemy.y, d = Math.hypot(dx, dy) || 1;
        if (d < vortex.r * 1.5) { enemy.x += dx / d * 85 * dt; enemy.y += dy / d * 85 * dt; }
      }
      if (vortex.tick <= 0) {
        vortex.tick = .28; for (const enemy of [...this.enemies]) if (distance(enemy, vortex) <= vortex.r) this.hit(enemy, vortex.dmg, vortex.id, false, true);
        if (this.boss && distance(this.boss, vortex) <= vortex.r + this.boss.r) this.hitBoss(vortex.dmg, vortex.id, true);
      }
      if (this.fused.F001 && vortex.tick < .05 && this.random() < .35) this.field('F001', vortex, 55, vortex.dmg * .55, 1.2);
      if (vortex.life <= 0) this.vortices.splice(i, 1);
    }
  }
  private updateMeteors(dt: number): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i]!; meteor.life -= dt;
      if (meteor.life <= 0) {
        this.explosion(meteor.id, meteor, meteor.r, meteor.dmg);
        if (meteor.id === 'A027' && skillModifier(this.context, this.state(), meteor.id).evo) this.field(meteor.id, meteor, meteor.r * .8, meteor.dmg * .12, 1.8);
        this.meteors.splice(i, 1);
      }
    }
  }
  private fusionPulse(): void {
    const p = this.player, D = p.atk, point = this.nearest() || { x: p.x + 100, y: p.y };
    if (this.fused.F001) {
      const angle = this.aim(), life = 5.5;
      this.vortices.push({ id: 'F001', x: p.x, y: p.y, vx: Math.cos(angle) * 85, vy: Math.sin(angle) * 85, dmg: D * .42, r: 125, life, max: life, tick: 0, follow: false, color: '#82d6b7' }); cap(this.vortices, 10);
    }
    if (this.fused.F002) {
      this.field('F002', p, 165, D * .30, 3.2, true);
      for (let i = 0; i < 3; i++) {
        const x = point.x + (this.random() - .5) * 120, y = point.y + (this.random() - .5) * 100, life = .55 + i * .15;
        this.meteors.push({ id: 'F002', x, y, dmg: D * 1.4, r: 68, life, max: life, color: '#ef7958' }); cap(this.meteors, 28);
      }
    }
    if (this.fused.F004) for (let i = 0; i < 8; i++) this.projectile('F004', p, i / 8 * 6.28, 470, D * .82, 6, { pierce: 2, explode: 35 });
  }
  updateOuter(dt: number): void {
    this.heat = Math.max(0, this.heat - dt * 4.5);
    for (let i = 0; i < this.bombs.length; i++) {
      const bomb = this.bombs[i]!; bomb.life -= dt;
      if (bomb.life <= 0) {
        for (const enemy of [...this.enemies]) if (distance(enemy, bomb) <= bomb.r) this.hit(enemy, bomb.dmg, 'H010_BOMB');
        if (this.boss && distance(this.boss, bomb) <= bomb.r + this.boss.r) this.hitBoss(bomb.dmg, 'H010_BOMB');
        this.ring(bomb, bomb.r, 'H010_BOMB'); this.bombs.splice(i--, 1);
      }
    }
    this.heat = Math.min(this.context.awaken.resourceMax || 100, this.heat + dt * this.context.growth.resourceEff * 2);
    for (const id of Object.keys(this.cool)) this.cool[id]! -= dt;
    for (const [id, level] of Object.entries(this.progression.snapshot().skills)) {
      const base = forms.baseCooldowns[id as keyof typeof forms.baseCooldowns];
      if (level && base != null && !(this.cool[id]! > 0)) { this.cool[id] = base * skillModifier(this.context, this.state(), id).cd; this.cast(id); }
    }
    this.updateProjectiles(dt); this.updateFields(dt); this.updateVortices(dt); this.updateMeteors(dt);
    this.fusionClock -= dt;
    if (this.fusionClock <= 0) { this.fusionClock = 3.4; this.fusionPulse(); }
    this.bossEncounter.updateTelegraphs(dt);
    const pet = this.pet; pet.angle += dt * .9; pet.x = this.player.x + Math.cos(pet.angle) * 52; pet.y = this.player.y + Math.sin(pet.angle) * 34; pet.cd -= dt;
    this.player.dodgeBuff = Math.max(0, this.player.dodgeBuff - dt); this.killBuff = Math.max(0, this.killBuff - dt);
    if (this.runes.includes('R022')) { this.shieldClock -= dt; if (this.shieldClock <= 0) { this.player.shield = Math.max(this.player.shield, this.player.maxHp * .12); this.shieldClock = 20; } }
    if (this.runes.includes('R004')) this.player.aspd = Math.min(4, this.baseAspd * (1 + (this.combo >= 100 ? .24 : this.combo >= 60 ? .16 : this.combo >= 30 ? .08 : 0)));
    if (pet.cd <= 0) {
      const target = this.nearest();
      if (target) {
        this.projectile('PET001', pet, Math.atan2(target.y - pet.y, target.x - pet.x), 430, this.player.atk * .75, 5, { explode: 45, color: '#ef704c' });
        this.field('PET001', target, 58, this.player.atk * .12, 2.5); this.petDamage += this.player.atk * .75;
      }
      pet.cd = pet.maxCd;
    }
  }
  applyCaps(): void { cap(this.enemies, caps.enemies); cap(this.enemyShots, caps.enemyShots); cap(this.projectiles, caps.v24Projectiles); cap(this.fields, caps.v24Fields); cap(this.meteors, caps.v24Meteors); }
  takeEvents(): CombatEvent[] { const events = this.events; this.events = []; return events; }
  renderState() { return { player: Object.freeze({ ...this.player }), world: Object.freeze({ ...this.world }), crystals: this.crystals.snapshot(), enemies: this.enemies.map(enemy => Object.freeze({ ...enemy, affixes: Object.freeze([...enemy.affixes]) })), projectiles: cloneList(this.projectiles), fields: cloneList(this.fields), vortices: cloneList(this.vortices), meteors: cloneList(this.meteors), bombs: cloneList(this.bombs), enemyShots: cloneList(this.enemyShots), pet: Object.freeze({ ...this.pet }) }; }
  destroy(): void {
    this.clearInput(); this.scheduled = []; this.events = []; this.crystals.clear(); this.map.destroy(); this.bossEncounter.destroy();
    for (const items of [this.enemies, this.projectiles, this.fields, this.vortices, this.meteors, this.bombs, this.enemyShots]) items.length = 0;
  }
}
