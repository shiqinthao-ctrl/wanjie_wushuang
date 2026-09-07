import { describe, expect, it } from 'vitest';
import { GameCore } from './GameCore';
import { clampPoint } from './spawnRules';
import oracle from '../../../../tasks/mobile-modernization/baseline/growth-oracle.json';

describe('GameCore lifecycle', () => {
  it('starts from the migrated fresh equipped stats, without changing the fixture', () => {
    const core = new GameCore(); core.start();
    expect(core.renderState().player).toEqual({ x: 1800, y: 1200, ...oracle.cases[0]!.expected.player, r: 15, inv: 0, dodgeCd: 0, skillCd: 0, ult: 0, shield: 0, dodgeBuff: 0, incoming: .44 });
  });
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
    expect(clampPoint({ x: 4000, y: -20 }, { width: 3600, height: 2400 }, 18)).toEqual({ x: 3582, y: 18 });
    expect(clampPoint({ x: -20, y: 3000 }, { width: 3600, height: 2400 }, 18)).toEqual({ x: 18, y: 2382 });
  });
  it('returns snapshots that cannot change simulation state', () => {
    const core = new GameCore(); core.start();
    const copy = core.renderState();
    expect(Object.isFrozen(copy.player)).toBe(true);
    expect(core.snapshot().status).toBe('running');
  });
  it('gates actions by lifecycle and freezes cooldowns and bombs while paused', () => {
    const core = new GameCore();
    expect(core.action('skill')).toBe(false);
    core.start(); expect(core.action('skill')).toBe(true);
    expect(core.action('skill')).toBe(false);
    core.advance(.02); core.pause();
    const before = core.renderState(), time = core.snapshot().time;
    expect(core.action('dodge')).toBe(false);
    core.advance(.034);
    expect(core.renderState()).toEqual(before); expect(core.snapshot().time).toBe(time);
    core.resume(); core.advance(.02);
    expect(core.snapshot().skillCd).toBeLessThan(before.player.skillCd);
    expect(core.renderState().bombs[0]!.life).toBeLessThan(before.bombs[0]!.life);
    core.destroy(); expect(core.action('skill')).toBe(false);
    core.advance(.034); expect(core.renderState().bombs).toHaveLength(0);
  });
});
