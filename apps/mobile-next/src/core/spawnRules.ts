import stage from '../data/firstStage.json';
import difficulties from '../data/difficulties.json';
import type { ThreatRules } from './threatModel';

export interface Point { x: number; y: number }
export interface Enemy extends Point {
  id: string; name: string; ai: string; r: number; hp: number; maxHp: number;
  speed: number; damage: number; color: string; attack: number; skill: number;
  elite: boolean; affixes: string[]; flash: number;
  /**
   * Present only on a stage's scripted elite checks (`chapter.stage.eliteAt`). It is an explicit
   * label rather than something inferred from `affixes.length`: a run must be able to say "this
   * one counted" without re-deriving the definition of "counted" from a number that the balance
   * pass may change. Absent on every other enemy, so legacy runs are byte-identical.
   */
  checked?: boolean;
  volatile?: boolean; vamp?: boolean; aura?: boolean; split?: boolean;
  chilledUntil?: number;
  /**
   * `charge` state machine, `threat-v2` only. `windup` counts down while the body is
   * planted, `dash` counts down while it is committed to `aim`, `chargeCd` is the gap
   * before it may start again. All three are absent on every other enemy, so a legacy
   * run never allocates them and `enemyAI` reads `?? 0`.
   */
  windup?: number; dash?: number; aim?: number; chargeCd?: number;
}
export interface DirectorState { time: number; kills: number; dps: number; level: number; evolved: number; fused: number }
export const firstStage = stage.rule;
export const caps = stage.caps;
export const difficultyFor = (id: string) => difficulties[id as keyof typeof difficulties] || difficulties.normal;
/** The five numbers a wave contributes. Structural, so a chapter table and `firstStage` both fit. */
export interface WaveRow {
  readonly at: number; readonly name: string; readonly type: string;
  readonly budget: number; readonly elite: number; readonly note?: string;
}
/**
 * The wave in force at `time`, from `waves` - or from the first stage's table when none is given.
 *
 * D34: this used to take no stage at all, which is why all three chapter stages spawned from
 * `firstStage.storyEncounter.waves` and why `CH001-02` (420 s) and `CH001-03` (480 s) had 60 s and
 * 120 s of **empty field** at the end - the table's last row is `budget: 0` at 360 s, and a zero
 * budget makes `director`'s interval `Infinity`. The default keeps every legacy and `CH001-01` run
 * byte-identical.
 */
export function waveAt(time: number, waves: readonly WaveRow[] = firstStage.storyEncounter.waves): WaveRow {
  return waves.filter(wave => time >= wave.at).at(-1) || waves[0]!;
}
export function director(state: DirectorState, player: { hp: number; maxHp: number; atk: number }, difficulty = 'normal', waves?: readonly WaveRow[]) {
  const diff = difficultyFor(difficulty), wave = waveAt(state.time, waves);
  const hpStress = 1 - Math.max(0, player.hp / Math.max(1, player.maxHp));
  const killPerf = Math.min(1.5, state.kills / Math.max(1, state.time * .78));
  const dpsPerf = Math.min(1.5, state.dps / Math.max(90, player.atk * 1.35));
  const maturity = Math.min(1, state.evolved * .16 + state.fused * .3 + state.level / 80);
  const pressure = Math.max(.22, Math.min(1.45, (.38 + wave.budget * .23 + (killPerf - .55) * .18 + (dpsPerf - .55) * .12 + maturity * .14 - hpStress * .24) * diff.budget));
  const interval = Math.max(.07, Math.max(.11, .36 - state.time / 5600) / (wave.budget * diff.budget * Math.max(.65, pressure))) / Math.max(.12, firstStage.spawn);
  const eliteChance = Math.min(.28, (.026 + state.time / 150000) * wave.elite * diff.elite * firstStage.storyEncounter.elite * (.82 + pressure * .35));
  return { pressure, interval, eliteChance };
}
export function clampPoint<T extends Point>(point: T, world: { width: number; height: number }, margin: number): T {
  point.x = Math.max(margin, Math.min(world.width - margin, point.x));
  point.y = Math.max(margin, Math.min(world.height - margin, point.y));
  return point;
}
export function createEnemy(state: DirectorState, player: Point & { hp: number; maxHp: number; atk: number }, viewport: { width: number; height: number }, world: { width: number; height: number }, difficulty: string, random: () => number, options: { id?: string; elite?: boolean; affixes?: number; checked?: boolean } = {}, threat?: ThreatRules): Enemy {
  let id = options.id;
  if (!id) {
    const pool = firstStage.storyEncounter.enemies as [string, number][];
    let roll = random() * pool.reduce((sum, entry) => sum + entry[1], 0);
    id = pool.at(-1)![0];
    for (const [candidate, weight] of pool) { roll -= weight; if (roll <= 0) { id = candidate; break; } }
  }
  const cfg = stage.enemies[id as keyof typeof stage.enemies];
  if (!cfg) throw new Error(`Unsupported enemy ${id}`);
  // threat-v2 carries its own contact damage table; the legacy reference keeps
  // reading `firstStage.enemies` and is never edited in place.
  const baseDamage = threat?.enemyDamage[id] ?? cfg.damage;
  // The legacy ring is derived from the viewport, which makes it a rendering
  // constant doing balance work: a 1280x720 screen spawns the horde 764px out
  // instead of 524px, so the standing horde grows ~40% and the incoming rises
  // with it. threat-v2 pins the ring to one design distance instead.
  const angle = random() * Math.PI * 2, distance = threat?.spawnRadius ?? (Math.max(viewport.width, viewport.height) * .55 + 60);
  const m = state.time / 60, diff = difficultyFor(difficulty);
  const elite = options.elite || random() < director(state, player, difficulty).eliteChance;
  const hp = cfg.hp * (1 + .07 * m + .012 * m * m) * diff.hp;
  const enemy: Enemy = clampPoint({ id, name: cfg.name, ai: cfg.ai, x: player.x + Math.cos(angle) * distance, y: player.y + Math.sin(angle) * distance,
    r: 10 + (['brute', 'shield'].includes(cfg.ai) ? 4 : 0), hp, maxHp: hp,
    speed: cfg.speed * (1 + Math.min(.22, .007 * m)) * diff.speed,
    damage: baseDamage * (1 + .045 * m + .006 * m * m) * diff.dmg, color: cfg.color,
    attack: random() * 2, skill: random() * 2, elite: false, affixes: [], flash: 0 }, world, 30);
  if (elite) {
    enemy.elite = true; enemy.r *= 1.25; enemy.hp *= 3.25; enemy.maxHp = enemy.hp; enemy.damage *= 1.38;
    // `options.affixes` is the stage's scripted check and overrides the clock: the 960 s second
    // affix is unreachable in every chapter stage (360/420/480 s), so a stage that wants a
    // two-affix elite has to say so rather than wait. Absent -> the original rule, unchanged.
    enemy.affixes = [...stage.affixes].sort(() => random() - .5).slice(0, options.affixes ?? (state.time > 960 || difficulty === 'nightmare' ? 2 : 1));
    if (options.checked) enemy.checked = true;
    for (const affix of enemy.affixes) {
      if (affix === 'swift') enemy.speed *= 1.35;
      else if (affix === 'tank') { enemy.hp *= 1.8; enemy.maxHp *= 1.8; }
      else if (affix === 'volatile' || affix === 'vamp' || affix === 'aura' || affix === 'split') enemy[affix] = true;
    }
    enemy.color = '#d5a254';
  }
  // `firstStage.dmg` is the legacy stage-wide -18% scaler. threat-v2 replaces it
  // with the explicit per-enemy table above, so the scaler must not double-dip.
  enemy.hp *= firstStage.hp; enemy.maxHp *= firstStage.hp; enemy.damage *= threat ? 1 : firstStage.dmg; enemy.speed *= firstStage.speed;
  return enemy;
}

// Freeze the original balanced rule budget. Visual settings must never change it.
export const earlyEnemyCap = (difficulty: string): number => Math.round(({ easy: 190, normal: 250, hard: 320, nightmare: 380 }[difficulty] || 250) * .82);
export function cap<T>(items: T[], limit: number): void { if (items.length > limit) items.splice(0, items.length - limit); }
