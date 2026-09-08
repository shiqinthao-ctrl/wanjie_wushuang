// Synthetic storage/settlement fixture, excluded from the application entry.
export { SaveRepository } from '../../src/storage/SaveRepository';
export { prepareHero } from '../../src/storage/prepareHero';
export { RunSession } from '../../src/storage/RunSession';
import { GameCore } from '../../src/core/GameCore';
import type { GameSave } from '../../src/core/saveTypes';
import type { CombatSimulation } from '../../src/core/CombatSimulation';
import type { Progression } from '../../src/core/progression';
export function finishedJourney(save: GameSave) {
  const core = new GameCore(save, () => .8, 'evolution'); core.start();
  const { combat, progression } = core as unknown as { combat: CombatSimulation; progression: Progression };
  progression.gain(400);
  for (let i = 0; i < 20; i++) { core.advance(.01); const offer = core.snapshot().choice; if (!offer) break; const option = offer.options[0]!; core.choose(offer.token, option.kind, option.id); }
  combat.player.hp = 0; core.advance(.01); return core;
}
