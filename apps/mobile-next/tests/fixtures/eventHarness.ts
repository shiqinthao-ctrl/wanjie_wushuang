// Synthetic browser-only harness. Never imported by production source.
export { SaveRepository } from '../../src/storage/SaveRepository';
export { EventSession } from '../../src/storage/EventSession';
export { FirstStageEvents, eventPayment } from '../../src/core/firstEvents';
export { Progression } from '../../src/core/progression';
export { calculateStartup } from '../../src/core/growth';
import { GameCore } from '../../src/core/GameCore';
import type { CombatSimulation } from '../../src/core/CombatSimulation';
import type { GameSave } from '../../src/core/saveTypes';
export function eventCore(save: GameSave, random = () => .75) {
  const core = new GameCore(save, random); core.start();
  const combat = (core as unknown as { combat: CombatSimulation }).combat;
  combat.time = 44.99; combat.player.hp = 100;
  core.advance(.02); return core;
}
