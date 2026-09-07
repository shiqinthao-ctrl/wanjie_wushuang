import { describe, expect, it } from 'vitest';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import type { Progression } from './progression';
import { eventPayment } from './firstEvents';

// Explicit synthetic boundary fixtures, never used for natural browser acceptance.
function boundary() {
  const core = new GameCore(undefined, () => .75); core.start();
  const state = core as unknown as { combat: CombatSimulation; progression: Progression };
  state.combat.time = 44.99;
  return { core, ...state };
}
describe('scheduled encounter lifecycle', () => {
  it('pauses at 45 seconds, blocks input and applies a reward once', () => {
    const { core } = boundary(); core.advance(.02);
    expect(core.snapshot().status).toBe('encounter');
    expect(core.snapshot().encounter.offer).toEqual({ token: 1, kind: 'goldChest' });
    const before = core.snapshot(); core.advance(100); core.move(1, 0);
    expect(core.snapshot()).toEqual(before);
    expect(core.action('skill')).toBe(false);
    expect(core.resolveEvent(1, 'goldCash', eventPayment('goldCash', 6000))).toBe(true);
    expect(core.resolveEvent(1, 'goldCash', eventPayment('goldCash', 6500))).toBe(false);
    expect(core.snapshot().status).toBe('running');
  });
  it('defers the event behind a pending level choice', () => {
    const { core, combat } = boundary();
    combat.crystals.spawn({ ...combat.player, elite: false }, 26); core.advance(.02);
    expect(core.snapshot().status).toBe('choosing');
    expect(core.snapshot().encounter.offer).toBeUndefined();
    const choice = core.snapshot().choice!, option = choice.options[0]!;
    core.choose(choice.token, option.kind, option.id);
    core.advance(.01);
    expect(core.snapshot().status).toBe('encounter');
  });
  it('keeps background pause through a pending transaction completion', () => {
    const { core } = boundary(); core.advance(.02); core.pause();
    expect(core.snapshot().status).toBe('paused');
    expect(core.resolveEvent(1, 'goldCash', eventPayment('goldCash', 6000))).toBe(true);
    expect(core.snapshot().status).toBe('paused');
    core.resume(); expect(core.snapshot().status).toBe('running');
  });
  it('resumes into the same offer and ignores completions after destruction', () => {
    const { core } = boundary(); core.advance(.02); core.pause(); core.resume();
    expect(core.snapshot().status).toBe('encounter'); core.destroy();
    expect(core.resolveEvent(1, 'goldCash', eventPayment('goldCash', 6000))).toBe(false);
  });
});
