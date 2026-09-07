import { describe, expect, it } from 'vitest';
import { GameCore } from './GameCore';

describe('GameCore lifecycle', () => {
  it('has one lifetime and never advances before start or after destroy', () => {
    const core = new GameCore();
    core.advance(1);
    expect(core.snapshot().time).toBe(0);
    core.start();
    expect(() => core.start()).toThrow();
    core.advance(1);
    expect(core.snapshot().time).toBe(.034);
    core.destroy();
    core.destroy();
    core.advance(.016);
    expect(core.snapshot().time).toBe(.034);
    expect(() => core.start()).toThrow();
  });
  it('clears movement on pause and requires an explicit resume', () => {
    const core = new GameCore(); core.start();
    core.move(1, 0); core.advance(.02);
    const before = core.renderState().player.x;
    core.pause(); core.advance(.03);
    expect(core.renderState().player.x).toBe(before);
    core.resume(); core.advance(.02);
    expect(core.renderState().player.x).toBe(before);
  });
  it('normalizes diagonal input, clamps world position and ignores invalid time', () => {
    const straight = new GameCore(); const diagonal = new GameCore();
    straight.start(); diagonal.start(); straight.move(1, 0); diagonal.move(1, 1);
    for (let i = 0; i < 50; i++) { straight.advance(.02); diagonal.advance(.02); }
    const a = straight.renderState().player, b = diagonal.renderState().player;
    expect(Math.hypot(b.x - 1800, b.y - 1200)).toBeCloseTo(a.x - 1800);
    const time = straight.snapshot().time;
    straight.advance(NaN); straight.advance(-1);
    expect(straight.snapshot().time).toBe(time);
    for (let i = 0; i < 10000; i++) straight.advance(.034);
    expect(straight.renderState().player.x).toBe(3582);
  });
  it('returns snapshots that cannot change simulation state', () => {
    const core = new GameCore(); core.start();
    const copy = core.renderState();
    expect(Object.isFrozen(copy.player)).toBe(true);
    expect(core.snapshot().status).toBe('running');
  });
});
