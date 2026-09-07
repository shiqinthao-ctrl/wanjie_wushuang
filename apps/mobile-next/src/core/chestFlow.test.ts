import { describe, expect, it } from 'vitest';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import type { Progression } from './progression';
import { eventPayment } from './firstEvents';

// Synthetic time/state boundary fixtures; natural browser acceptance uses input only.
function boundary() {
  const core = new GameCore(undefined, () => .75); core.start();
  const state = core as unknown as { combat: CombatSimulation; progression: Progression };
  state.combat.time = 44.99; core.advance(.02);
  expect(core.resolveEvent(1, 'goldOpen', eventPayment('goldOpen', 6000))).toBe(true);
  state.combat.time = 89.99;
  return { core, ...state };
}
describe('timed chest lifecycle', () => {
  it('becomes ready without pausing and requires explicit claim', () => {
    const { core } = boundary();
    expect(core.claimChest(0)).toBe(false); core.advance(.02);
    expect(core.snapshot().status).toBe('running');
    expect(core.snapshot().chests.rewards[0]!.state).toBe('ready');
    expect(core.claimChest(0)).toBe(true);
    const before = core.snapshot(); core.advance(10); core.move(1, 0);
    expect(core.snapshot()).toEqual(before);
    expect(core.action('skill')).toBe(false);
    expect(core.claimChest(0)).toBe(false);
    expect(core.pickChest(2, 0)).toBe(false);
    expect(core.pickChest(1, 9)).toBe(false);
    expect(core.pickChest(1, 2)).toBe(true);
    expect(core.snapshot().status).toBe('running');
    expect(core.snapshot().chests.rewards[0]!.state).toBe('claimed');
    expect(core.pickChest(1, 2)).toBe(false);
    expect(core.claimChest(0)).toBe(false);
    expect(core.snapshot().encounter.gearCount).toBe(2);
  });
  it('blocks background picks and restores the same selection on resume', () => {
    const { core } = boundary(); core.advance(.02); core.claimChest(0);
    const offer = core.snapshot().chests.offer;
    core.pause(); expect(core.snapshot().status).toBe('paused');
    expect(core.pickChest(1, 0)).toBe(false);
    core.resume(); expect(core.snapshot().status).toBe('chest');
    expect(core.snapshot().chests.offer).toEqual(offer);
    expect(core.pickChest(1, 0)).toBe(true);
  });
  it('defers claim behind level choice and scheduled encounter', () => {
    const { core, combat } = boundary();
    combat.crystals.spawn({ ...combat.player, elite: false }, 26); core.advance(.02);
    expect(core.snapshot().status).toBe('choosing'); expect(core.claimChest(0)).toBe(false);
    const choice = core.snapshot().choice!, option = choice.options[0]!;
    core.choose(choice.token, option.kind, option.id); expect(core.claimChest(0)).toBe(true);
    core.pickChest(1, 0); combat.time = 149.99; core.advance(.02);
    expect(core.snapshot().status).toBe('encounter'); expect(core.claimChest(1)).toBe(false);
  });
  it('clears held movement and refuses destroyed-run choices', () => {
    const { core } = boundary(); core.advance(.02); core.move(1, 0); core.claimChest(0);
    core.pickChest(1, 0); const before = core.renderState().player.x;
    core.advance(.02); expect(core.renderState().player.x).toBe(before);
    core.destroy(); expect(core.claimChest(0)).toBe(false); expect(core.pickChest(1, 0)).toBe(false);
  });
});
