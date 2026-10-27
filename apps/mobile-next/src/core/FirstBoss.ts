import config from '../data/firstBoss.json';
import { clampPoint, difficultyFor, firstStage } from './spawnRules';
import type { Point } from './spawnRules';
import type { CombatSimulation } from './CombatSimulation';
import type { GearInstance } from './saveTypes';
import { bossGearChoices, generateGear } from './gearDrops';
import { instanceScore } from './growth';

/**
 * One Boss row. `firstBoss.json` used to be a *single* unnamed Boss - the id was a literal in
 * `spawn()` and `firstStage.rule.bossId` said `B001` with nobody reading it. A stage that names a
 * different Boss therefore spawned the same one. Rows are keyed by the id the stage writes, so
 * the key and the identity cannot drift.
 */
interface Curve { readonly base: number; readonly perPhase: number; readonly floor?: number }
export interface BossRow {
  readonly boss: { readonly name: string; readonly map: string; readonly style: string; readonly hp: number; readonly r: number; readonly color: string; readonly skills: readonly string[] };
  readonly mechanics: {
    readonly name: string; readonly phase: readonly string[]; readonly thresholds: readonly number[];
    readonly shield: number; readonly shrink: boolean; readonly skills: readonly (readonly [string, string])[];
    readonly curve: { readonly contact: Curve; readonly skill: Curve; readonly delay: Curve; readonly castCd: Curve; readonly speed: Curve; readonly cone: Curve };
    readonly radius: readonly number[]; readonly width: readonly number[]; readonly arc: readonly number[]; readonly adds: readonly number[];
  };
}
const rows = config.bosses as unknown as Readonly<Record<string, BossRow>>;
/** Throws rather than falling back: a stage that names a Boss nobody wrote must not field another. */
export function bossRow(id: string): BossRow {
  const row = rows[id];
  if (!row) throw new Error(`未知首领：${id}。firstBoss.json 的 bosses 里没有这一行。`);
  return row;
}
export interface Boss extends Point { id: string; name: string; hp: number; maxHp: number; r: number; phase: number; castCd: number; castLock: number; shield: number; skillIndex: number; next: string; sweepPhase?: 'windup' | 'strike' | 'recovery'; sweepFacing?: number }
type WarningBase = Point & { name: string; life: number; max: number; color: string; damage: number; resolved: boolean; chapterSweep?: boolean; source?: string };
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
  private sweepRecovery = 0;
  /**
   * The id the run actually uses. A chapter stage names its own Boss; every other run reads
   * `firstStage.rule.bossId`, which is data that already said `B001` while the code hardcoded it.
   * Resolved once, in the constructor, so a missing row fails when the run is built instead of on
   * every frame `spawn()` is polled.
   */
  readonly id: string;
  private readonly row: BossRow;
  constructor(private sim: CombatSimulation, private hero: string, private difficulty: string, private random: () => number, private now: () => number, private journey: 'classic' | 'evolution' = 'classic') {
    this.id = sim.chapter?.stage.boss?.id ?? firstStage.bossId;
    this.row = bossRow(this.id);
  }
  /**
   * When the Boss is due, or `undefined` when this stage has none. `CH001-02` declares
   * `boss: null`, and the old line read `.spawnAt` off it - `TypeError: Cannot read properties of
   * null` on the run's first frame, before anything could be drawn. The type only admitted it
   * because `stage` was typed as `typeof chapterStages[0]`; `ChapterStageId` is what made the
   * compiler point at this line.
   */
  private bossAt(): number | undefined {
    const stage = this.sim.chapter?.stage;
    if (!stage) return firstStage.bossAt;
    if (!stage.boss) return undefined;
    // The stage's elite checks gate the Boss rather than merely annotating it. Returning
    // `undefined` means "not due yet", which `spawn()` and `phase` both already handle, so a run
    // that has not cleared the checks cannot reach the Boss and "victory without the checks" is
    // not a state the settlement has to reject - it cannot occur. The checks are scheduled before
    // `spawnAt` and never despawn, so the wait is bounded by the player's own damage.
    if (stage.eliteChecks > 0 && this.sim.checkedElites < stage.eliteChecks) return undefined;
    return stage.boss.spawnAt;
  }
  spawn(): boolean {
    const at = this.bossAt();
    if (at === undefined || this.destroyed || this.active || this.defeatedAt !== undefined || this.sim.time < at) return false;
    const { player, viewport, time } = this.sim, minutes = time / 60;
    // threat-v2 sets its own Boss HP budget, per journey. `firstStage.bossHp` (3)
    // is the frozen reference the legacy path and every chapter run keep using,
    // byte-identical.
    const hpScale = this.sim.threat?.bossHp[this.journey] ?? firstStage.bossHp;
    const hp = this.row.boss.hp * difficultyFor(this.difficulty).hp * (.85 + (1 + .07 * minutes + .012 * minutes * minutes) * .22) * hpScale;
    this.active = { id: this.id, name: this.row.boss.name, hp, maxHp: hp, r: this.row.boss.r, x: player.x + viewport.width * .28, y: player.y - viewport.height * .16, phase: 1, castCd: 1.7 * this.castCdScale, castLock: .7, shield: 0, skillIndex: 0, next: '准备攻击' };
    clampPoint(this.active, this.sim.world, this.row.boss.r + 3); this.sim.feedback('boss-arrive', this.id); return true;
  }
  defeat(): void {
    if (!this.active || this.defeatedAt !== undefined || this.destroyed) return;
    this.active = undefined;
    this.sim.feedback('boss-defeat', this.id);
    if (this.sim.chapter) { this.telegraphs.length = 0; this.sweepRecovery = 0; }
    if (!this.sim.chapter) this.sim.drops.push(generateGear(this.hero, 'boss', this.random, this.now, this.dropOptions()));
    this.defeatedAt = this.sim.time;
  }
  private dropOptions() { return { difficulty: this.difficulty, dropBonus: this.sim.context.runePet.dropPct || 0 }; }
  /**
   * threat-v2 scales every point of damage the Boss itself deals. The legacy reference and chapter
   * runs keep `1`, so their numbers are untouched.
   */
  private get damageScale(): number { return this.sim.threat?.bossDamage ?? 1; }
  /**
   * R1g-10 splits `damageScale` in two. Both default to `1`, so a `threat` table without the new
   * keys - and the whole legacy path, where `threat` is undefined - is byte-identical. The split
   * exists because a move cannot be made legible through `bossDamage`: that knob also multiplies
   * body contact, which at the multiple G4 needs kills the player before the first cast lands.
   */
  private get skillScale(): number { return this.damageScale * (this.sim.threat?.bossSkillDamage ?? 1); }
  private get contactScale(): number { return this.damageScale * (this.sim.threat?.bossContactDamage ?? 1); }
  /** R1g-10's cadence knob: multiplies every *fresh* cast cooldown, never the per-frame decrement. */
  private get castCdScale(): number { return this.sim.threat?.bossCastCooldown ?? 1; }
  updateAI(dt: number): void {
    const boss = this.active; if (!boss || this.destroyed) return;
    // Thresholds are the row's, not the code's: the altar lord holds each phase longer. The
    // comparison order (3 first, then 2) is what makes `[.70, .35]` mean "2 below .70, 3 below .35".
    const m = this.row.mechanics, ratio = boss.hp / Math.max(1, boss.maxHp);
    const phase = ratio <= m.thresholds[1]! ? 3 : ratio <= m.thresholds[0]! ? 2 : 1;
    // R1g-7 briefly added a 6s minimum dwell here plus a "cannot die inside the dwell" hold
    // (`holdHp`), to make G3's "three phases, each at least once" a property of the rule. Both were
    // reverted with the dash clamp, and for the same reason: the **1.7s** phase they were sized
    // against came from the clamp-on balance, and the hold made the Boss unkillable for up to 6s
    // after every phase change - an invisible rule that breaks any legitimate one-shot (measured: 9
    // tests across `bossLifecycle`, `firstBoss` and `settlementFlow`). The phase budget is carried
    // by `bossHp` alone, which is where R1g-3 put it and where it still works (six cells, 62-80s).
    if (phase > boss.phase) {
      if (this.sim.chapter) { this.telegraphs.length = 0; this.sweepRecovery = 0; boss.sweepPhase = undefined; boss.sweepFacing = undefined; }
      boss.phase = phase; boss.castCd = 1.2 * this.castCdScale; boss.castLock = 1.05;
      this.sim.feedback('boss-phase', this.id);
      this.maxPhase = Math.max(this.maxPhase, phase);
      // What a phase *costs* in bodies is a row, not a branch: `[0, 0, 3]` is the brute's three
      // adds, and a caster that summons two is the same rule with a different number.
      for (let i = 0; i < m.adds[phase - 1]!; i++) this.sim.spawn({ elite: i === 0 });
    }
    if (boss.sweepPhase) {
      if (boss.sweepPhase === 'windup') return;
      this.sweepRecovery = Math.max(0, this.sweepRecovery - dt);
      boss.sweepPhase = this.sweepRecovery > .67 ? 'strike' : 'recovery';
      boss.next = '旋风断军 · 收招，可反击';
      if (this.sweepRecovery > 0) return;
      boss.sweepPhase = undefined; boss.sweepFacing = undefined;
      boss.castCd = .65; boss.castLock = 0; boss.next = '准备攻击';
    }
    boss.castLock = Math.max(0, boss.castLock - dt); boss.castCd -= dt;
    const player = this.sim.player, dx = player.x - boss.x, dy = player.y - boss.y, distance = Math.hypot(dx, dy) || 1, diff = difficultyFor(this.difficulty);
    if (boss.castLock <= 0 && distance > 155) {
      const speed = (m.curve.speed.base + boss.phase * m.curve.speed.perPhase) * diff.speed;
      boss.x += dx / distance * speed * dt; boss.y += dy / distance * speed * dt;
    }
    // Boss body contact: legacy is covered by the global i-frame, so the guard
    // stays byte-identical. threat-v2 grants no global i-frame, so the Boss uses
    // its own contact timer or a stationary player would take 60 hits per second.
    if (distance < boss.r + player.r + 4 && player.inv <= 0 && (!this.sim.threat || this.sim.contactReady(boss, this.sim.threat.bossContactInterval))) this.sim.hurt((m.curve.contact.base + boss.phase * m.curve.contact.perPhase) * diff.dmg * this.contactScale, `${this.id}-contact`);
    if (boss.castCd > 0 || boss.castLock > 0) return;
    boss.skillIndex = (boss.skillIndex + 1) % 3;
    const [type, name] = m.skills[(boss.skillIndex + boss.phase - 1) % 3]!;
    // Affine, not baked: `base + phase * perPhase` reproduces `.95 - .08` to the last bit, while
    // storing `0.87` as a literal would not (`.95 - .08` is not the double `0.87`).
    const damage = m.curve.skill.base + boss.phase * m.curve.skill.perPhase;
    const delay = Math.max(m.curve.delay.floor!, m.curve.delay.base - boss.phase * m.curve.delay.perPhase) * firstStage.telegraphScale;
    const base: WarningBase = { name: name!, x: boss.x, y: boss.y, damage, life: delay, max: delay, color: '#ef5d58', resolved: false };
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    if (type === 'circle') {
      this.telegraphs.push({ ...base, type, x: player.x, y: player.y, r: m.radius[boss.phase - 1]!, damage: damage * 1.25 }); boss.next = `${name} · 离开红圈`;
    } else if (type === 'line') {
      // The cone sibling already uses a fixed design range (`230 + phase * 25`);
      // only the charge still measured itself against the screen, so a 1280px
      // monitor got a 1177px dash instead of 776px and the Boss spent the extra
      // distance walking back. threat-v2 pins it to one design distance.
      const length = this.sim.threat?.chargeRange ?? Math.max(this.sim.viewport.width, this.sim.viewport.height) * .92;
      this.telegraphs.push({ ...base, type, x2: boss.x + Math.cos(angle) * length, y2: boss.y + Math.sin(angle) * length, width: m.width[boss.phase - 1]!, damage: damage * 1.15, moveBoss: true }); boss.next = `${name} · 横向闪避`;
    } else {
      const chapterSweep = !!this.sim.chapter;
      this.telegraphs.push({ ...base, ...(chapterSweep ? { life: 1.1, max: 1.1, chapterSweep } : {}), type: 'cone', range: m.curve.cone.base + boss.phase * m.curve.cone.perPhase, arc: Math.PI * m.arc[boss.phase - 1]!, angle, damage: damage * 1.22 }); boss.next = `${name} · 绕至侧后`;
      if (chapterSweep) { boss.sweepPhase = 'windup'; boss.sweepFacing = angle; }
    }
    boss.castLock = delay + .12; boss.castCd = Math.max(m.curve.castCd.floor!, (m.curve.castCd.base - boss.phase * m.curve.castCd.perPhase) / diff.speed) * this.castCdScale;
    this.sim.feedback('boss-warning', name!);
  }
  updateTelegraphs(dt: number): void {
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const warning = this.telegraphs[i]!; warning.life -= dt;
      if (warning.life > 0) continue;
      if (!warning.resolved) {
        warning.resolved = true;
        if (warning.chapterSweep && warning.type === 'cone') {
          this.sim.enemyStrike({ x: warning.x, y: warning.y, facing: warning.angle, range: warning.range, arc: warning.arc, source: `${this.id}-${warning.name}` }, warning.damage * difficultyFor(this.difficulty).dmg * this.skillScale);
          if (this.active) { this.active.sweepPhase = 'strike'; this.active.next = '旋风断军 · 收招，可反击'; this.sweepRecovery = .85; }
        } else if (insideTelegraph(this.sim.player, warning)) this.sim.hurt(warning.damage * difficultyFor(this.difficulty).dmg * this.skillScale, `${this.id}-${warning.name}`);
        if (warning.type === 'line' && warning.moveBoss && this.active) { this.active.x = warning.x2; this.active.y = warning.y2; clampPoint(this.active, this.sim.world, this.row.boss.r + 3); }
      }
      if (warning.chapterSweep && warning.life > -.18) continue;
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
    const at = this.bossAt();
    return Object.freeze({ boss: this.active ? Object.freeze({ ...this.active, phaseName: this.row.mechanics.phase[this.active.phase - 1]! }) : undefined,
      chapterLoot: !!this.sim.chapter && !this.destroyed && this.defeatedAt !== undefined && !this.picked && this.sim.time - this.defeatedAt >= .18,
      lootClaimed: this.picked,
      lootShown: this.defeatedAt !== undefined, offer: this.offer ? Object.freeze(this.offer.map(item => Object.freeze({ ...item, name: String(item.name), affixes: Object.freeze(item.affixes?.map(affix => Object.freeze({ ...affix })) || []) }))) : undefined,
      phase: this.settlingAt !== undefined ? 'settling' : this.resolvedAt !== undefined || this.picked ? 'confirmed' : this.offer ? 'choice' : this.defeatedAt !== undefined ? 'opening' : this.active ? 'fight' : at === undefined || this.sim.time < at - 20 ? 'advance' : 'warning' });
  }
  destroy(): void { this.destroyed = true; this.active = undefined; this.telegraphs.length = 0; this.offer = undefined; this.sweepRecovery = 0; }
}
