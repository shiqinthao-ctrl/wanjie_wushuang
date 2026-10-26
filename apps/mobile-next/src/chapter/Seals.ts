import type { CombatSimulation } from '../core/CombatSimulation';
import { direction } from '../core/FirstStageMap';
import type { SealRule } from './catalog';

/**
 * The three seals of `CH001-02` 荒原镇界.
 *
 * `catalog.ts` declares *when* a seal opens and *how long* it must be held; this module owns
 * *where* it stands, exactly like `FirstStageMap.layout` owns the six interaction points of the
 * first stage. Positions are fractions of the world so they survive a wider viewport.
 *
 * The dwell rule is **continuous**: standing inside accumulates, leaving resets to zero. The
 * alternative ("累计驻守，离开不清零") is measured from the same trajectory in `seals.test.ts`
 * and priced in `evidence/R3-M/IMPLEMENTATION-2.md` - it is not a second code path here, because
 * a switch that is only ever on one side is a switch nobody can test.
 *
 * The radius is the mechanic's load-bearing number, not decoration: at 84 px a reference player
 * dies with two of three seals held (measured, `seal-report.json`), and 120/140/160/200 were each
 * run over the same six seeds before this one was picked. 160 is the first value where the worst
 * sample still ends with 30% of the health bar (190/620) - i.e. where a human has the margin a
 * perfect-reaction bot does not need. At 120 and 140 the worst sample ends at 2.6% and 5.6%.
 */
export const SEAL_RADIUS = 160;
/** Fractions of the world, not pixels: the arena grows with the viewport (`resize`). */
const LAYOUT: readonly (readonly [number, number])[] = [[.5, .23], [.27, .77], [.73, .77]];
/** Float accumulation over 1200 frames lands a hair under 20; this is the tolerance, not a fudge. */
const REACHED = 1e-6;

export type SealState = 'locked' | 'open' | 'holding' | 'held';

interface Seal { readonly index: number; readonly opensAt: number; readonly dwell: number; x: number; y: number; progress: number; held: boolean }

export class ChapterSeals {
  private readonly seals: Seal[];
  private notice = '';
  constructor(private readonly sim: CombatSimulation, rules: readonly SealRule[]) {
    if (rules.length > LAYOUT.length) throw new Error(`界阵数量超出布局：${rules.length} > ${LAYOUT.length}`);
    this.seals = rules.map((rule, index) => ({ index, opensAt: rule.opensAt, dwell: rule.dwell, x: 0, y: 0, progress: 0, held: false }));
    this.place();
  }
  /** Positions follow the world, so `resize` before `start` is honoured; re-placing keeps them right. */
  place(): void {
    const { width, height } = this.sim.world;
    for (const seal of this.seals) {
      const [x, y] = LAYOUT[seal.index]!;
      seal.x = width * x; seal.y = height * y;
    }
  }
  /** Runs in `finishBaseFrame`, next to the map's hazard tick, so it shares the same clock. */
  advance(dt: number): void {
    const { time, player } = this.sim;
    for (const seal of this.seals) {
      if (seal.held || time < seal.opensAt) continue;
      const inside = Math.hypot(player.x - seal.x, player.y - seal.y) <= SEAL_RADIUS;
      if (!inside) {
        // The whole cost of the continuous rule: a body pushed out at 19.9 s starts again at 0.
        if (seal.progress > 0) { seal.progress = 0; this.notice = `${this.name(seal)} · 镇守中断`; }
        continue;
      }
      seal.progress = Math.min(seal.dwell, seal.progress + dt);
      if (seal.progress + REACHED >= seal.dwell) {
        seal.progress = seal.dwell; seal.held = true;
        this.notice = `${this.name(seal)} · 已镇守（${this.seals.filter(item => item.held).length}/${this.seals.length}）`;
      }
    }
  }
  private name(seal: Seal): string { return ['一', '二', '三'][seal.index] ?? String(seal.index + 1); }
  private state(seal: Seal): SealState {
    if (seal.held) return 'held';
    if (this.sim.time < seal.opensAt) return 'locked';
    return seal.progress > 0 ? 'holding' : 'open';
  }
  /** `victory` the moment all three are held - the stage has no Boss to kill instead. */
  updateObjective(): 'victory' | undefined {
    return this.seals.every(seal => seal.held) ? 'victory' : undefined;
  }
  private row(seal: Seal) {
    const player = this.sim.player, dx = seal.x - player.x, dy = seal.y - player.y;
    const gap = Math.hypot(dx, dy);
    return Object.freeze({
      index: seal.index, state: this.state(seal), progress: seal.progress, dwell: seal.dwell,
      opensIn: Math.max(0, seal.opensAt - this.sim.time), x: seal.x, y: seal.y,
      inside: gap <= SEAL_RADIUS, distance: Math.round(gap / 25) * 25, direction: direction(dx, dy),
    });
  }
  snapshot() {
    const rows = this.seals.map(seal => this.row(seal));
    return Object.freeze({
      rule: 'continuous' as const, held: rows.filter(row => row.state === 'held').length, total: rows.length,
      // The one to walk to: the first not held, which is also the earliest to open.
      next: rows.find(row => row.state !== 'held'), rows: Object.freeze(rows), notice: this.notice,
    });
  }
  renderState() {
    return Object.freeze(this.seals.map(seal => Object.freeze({
      index: seal.index, x: seal.x, y: seal.y, r: SEAL_RADIUS, state: this.state(seal),
      ratio: seal.dwell > 0 ? Math.min(1, seal.progress / seal.dwell) : 1,
    })));
  }
}
export type SealSnapshot = ReturnType<ChapterSeals['snapshot']>;
export type SealRenderState = ReturnType<ChapterSeals['renderState']>;
