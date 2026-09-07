import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import type { GameSave } from './saveTypes';

export type RunStatus = 'idle' | 'running' | 'paused' | 'destroyed';
export interface UiSnapshot { readonly status: RunStatus; readonly time: number; readonly hp: number; readonly maxHp: number }
export interface Point { x: number; y: number }

/** Rules only. Phaser is the sole caller of advance; this class owns no timers. */
export class GameCore {
  private status: RunStatus = 'idle';
  private time = 0;
  private world = { width: 3600, height: 2400 };
  private player;
  private input: Point = { x: 0, y: 0 };
  private response: Point = { x: 0, y: 0 };

  constructor(save: GameSave = fresh) {
    this.player = { x: 1800, y: 1200, ...calculateStartup(save).player };
  }

  start(width = 390, height = 844): void {
    if (this.status !== 'idle') throw new Error('A run can only start once');
    this.resize(width, height);
    this.player.x = this.world.width / 2;
    this.player.y = this.world.height / 2;
    this.status = 'running';
  }
  resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    this.world.width = Math.max(this.world.width, Math.ceil(width * 2.2));
    this.world.height = Math.max(this.world.height, Math.ceil(height * 2.2));
  }
  move(x: number, y: number): void {
    if (this.status !== 'running' || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const length = Math.max(1, Math.hypot(x, y));
    this.input = { x: x / length, y: y / length };
  }
  clearInput(): void { this.input = { x: 0, y: 0 }; this.response = { x: 0, y: 0 }; }
  pause(): void { if (this.status === 'running') { this.status = 'paused'; this.clearInput(); } }
  resume(): void { if (this.status === 'paused') this.status = 'running'; }
  advance(elapsed: number): void {
    if (this.status !== 'running' || !Number.isFinite(elapsed) || elapsed <= 0) return;
    // Match the original frame cap and exponential movement response.
    const dt = Math.min(.034, elapsed);
    this.time += dt;
    const active = !!(this.input.x || this.input.y);
    const alpha = 1 - Math.exp(-(active ? 56 : 72) * dt);
    this.response.x += (this.input.x - this.response.x) * alpha;
    this.response.y += (this.input.y - this.response.y) * alpha;
    if (!active && Math.hypot(this.response.x, this.response.y) < .015) this.response = { x: 0, y: 0 };
    this.player.x = Math.max(18, Math.min(this.world.width - 18, this.player.x + this.response.x * this.player.speed * dt));
    this.player.y = Math.max(18, Math.min(this.world.height - 18, this.player.y + this.response.y * this.player.speed * dt));
  }
  snapshot(): UiSnapshot { return Object.freeze({ status: this.status, time: this.time, hp: this.player.hp, maxHp: this.player.maxHp }); }
  renderState() {
    return { player: Object.freeze({ ...this.player }), world: Object.freeze({ ...this.world }) };
  }
  destroy(): void { this.clearInput(); this.status = 'destroyed'; }
}
