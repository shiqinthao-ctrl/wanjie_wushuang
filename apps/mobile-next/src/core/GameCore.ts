import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import type { GameSave } from './saveTypes';
import { Progression } from './progression';
import type { ChoiceKind } from './progression';
import { CombatSimulation } from './CombatSimulation';
import type { Action, CombatEvent } from './CombatSimulation';
import type { FirstStageMap } from './FirstStageMap';

export type RunStatus = 'idle' | 'running' | 'choosing' | 'paused' | 'ended' | 'destroyed';
export interface UiSnapshot extends ReturnType<Progression['snapshot']> { readonly status: RunStatus; readonly time: number; readonly hp: number; readonly maxHp: number; readonly kills: number; readonly heat: number; readonly dodgeCd: number; readonly skillCd: number; readonly ult: number; readonly map: ReturnType<FirstStageMap['snapshot']>; readonly endReason?: 'defeat' | 'preview-limit' }
export interface Point { x: number; y: number }
export type CoreEvent = CombatEvent | { type: 'xp-pickup'; value: number; x: number; y: number } | { type: 'level-choice'; level: number };

/** Rules only. Phaser is the sole caller of advance; this class owns no timers. */
export class GameCore {
  private status: RunStatus = 'idle';
  private progression: Progression;
  private combat: CombatSimulation;
  private events: CoreEvent[] = [];
  private endReason: UiSnapshot['endReason'];

  constructor(save: GameSave = fresh) {
    const startup = calculateStartup(save);
    this.progression = new Progression(save.build, startup.skills, startup.passives);
    this.combat = new CombatSimulation(save, this.progression);
  }

  start(width = 390, height = 844): void {
    if (this.status !== 'idle') throw new Error('A run can only start once');
    this.resize(width, height);
    this.combat.map.placeObjects();
    this.combat.player.x = this.combat.world.width / 2;
    this.combat.player.y = this.combat.world.height / 2;
    this.status = 'running';
  }
  resize(width: number, height: number): void {
    this.combat.resize(width, height);
  }
  move(x: number, y: number): void {
    if (this.status === 'running') this.combat.move(x, y);
  }
  action(action: Action): boolean { return this.status === 'running' && this.combat.action(action); }
  interact(): boolean {
    if (this.status !== 'running' || !this.combat.map.useNearest()) return false;
    if (this.progression.snapshot().choice) {
      this.status = 'choosing'; this.clearInput();
      this.events.push({ type: 'level-choice', level: this.progression.snapshot().level });
    }
    return true;
  }
  clearInput(): void { this.combat.clearInput(); }
  pause(): void { if (this.status === 'running' || this.status === 'choosing') { this.status = 'paused'; this.clearInput(); } }
  resume(): void { if (this.status === 'paused') this.status = this.progression.snapshot().choice ? 'choosing' : 'running'; }
  choose(token: number, kind: ChoiceKind, id: string): boolean {
    if (this.status !== 'choosing' || !this.progression.pick(token, kind, id)) return false;
    this.clearInput(); this.status = this.progression.snapshot().choice ? 'choosing' : 'running';
    return true;
  }
  advance(elapsed: number): void {
    if (this.status !== 'running' || !Number.isFinite(elapsed) || elapsed <= 0) return;
    // Base order: movement/spawn/attacks/AI, XP, hostile shots/director,
    // death, hero identity, skill forms, pet, safety caps.
    const dt = Math.min(.034, elapsed);
    this.combat.beginFrame(dt);
    const pickup = this.combat.crystals.advance(this.combat.player, dt);
    if (pickup.value > 0) {
      this.progression.gain(pickup.value); this.progression.checkLevel();
      this.events.push({ type: 'xp-pickup', ...pickup });
      if (this.progression.snapshot().choice) {
        this.status = 'choosing'; this.clearInput();
        this.events.push({ type: 'level-choice', level: this.progression.snapshot().level });
      }
    }
    this.combat.finishBaseFrame(dt);
    if (this.combat.player.hp <= 0 || this.combat.time >= 360) {
      this.endReason = this.combat.player.hp <= 0 ? 'defeat' : 'preview-limit';
      this.status = 'ended'; this.clearInput();
    }
    if (this.status === 'running') { this.combat.updateOuter(dt); this.combat.map.recover(); }
    this.combat.applyCaps();
  }
  snapshot(): UiSnapshot {
    const { player, time, kills, heat } = this.combat;
    return Object.freeze({ status: this.status, time, hp: Math.max(0, player.hp), maxHp: player.maxHp, kills, heat, dodgeCd: player.dodgeCd, skillCd: player.skillCd, ult: player.ult, map: this.combat.map.snapshot(), endReason: this.endReason, ...this.progression.snapshot() });
  }
  renderState() { return { ...this.combat.renderState(), map: this.combat.map.renderState() }; }
  takeEvents(): readonly CoreEvent[] { const events = [...this.events, ...this.combat.takeEvents()]; this.events = []; return events; }
  destroy(): void { this.combat.destroy(); this.events = []; this.status = 'destroyed'; }
}
