import { afterEach, expect, it, vi } from 'vitest';
import { ChapterAudio } from './ChapterAudio';
import { BattleAudio } from './BattleAudio';
import type { UiSnapshot } from '../../core/GameCore';

afterEach(() => vi.unstubAllGlobals());
function setup() {
  const page = Object.assign(new EventTarget(), { hidden: false });
  const browser = new EventTarget();
  vi.stubGlobal('document', page); vi.stubGlobal('window', browser);
  const stop = vi.fn(), play = vi.fn(() => ({ stop, volume: vi.fn() })), destroy = vi.fn(async () => {});
  const audio = new ChapterAudio(new BattleAudio({ ready: () => true, unlock: async () => {}, play, destroy }));
  const snapshot = (status: UiSnapshot['status'], endReason?: UiSnapshot['endReason']) => ({ status, endReason }) as UiSnapshot;
  return { audio, play, stop, destroy, page, browser, snapshot };
}
it('manual resume immediately accepts a fresh evolution instead of dropping its first frame', async () => {
  const { audio, play, snapshot } = setup(); audio.pause();
  audio.present([{ type: 'battle-feedback', kind: 'evolution', source: 'dragon' }], snapshot('paused'));
  expect(play).not.toHaveBeenCalled(); audio.resume();
  audio.present([{ type: 'battle-feedback', kind: 'evolution', source: 'dragon' }], snapshot('choosing'));
  expect(play).toHaveBeenCalledWith('evolve'); await audio.destroy();
});
it('choice modal filters hit noise while playing the confirmed awakening', async () => {
  const { audio, play, snapshot } = setup();
  audio.present([{ type: 'hit', damage: 12, x: 0, y: 0, critical: false }, { type: 'battle-feedback', kind: 'awakening', source: 'awaken' }], snapshot('choosing'));
  expect(play.mock.calls).toEqual([['awaken']]); await audio.destroy();
});
it('hidden and blur stop immediately and visible state alone cannot resume playback', async () => {
  const { audio, play, stop, page, browser, snapshot } = setup();
  const event = { type: 'level-choice', level: 2 } as const;
  audio.present([event], snapshot('running')); page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
  expect(stop).toHaveBeenCalledOnce(); page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
  audio.present([event], snapshot('running')); expect(play).toHaveBeenCalledOnce();
  audio.resume(); audio.present([event], snapshot('running')); expect(play).toHaveBeenCalledTimes(2);
  browser.dispatchEvent(new Event('blur')); expect(stop).toHaveBeenCalledTimes(2); await audio.destroy();
});
it('settlement sound is one-shot and cannot restart after focus loss', async () => {
  const { audio, play, browser, snapshot } = setup();
  audio.present([], snapshot('ended', 'victory')); audio.present([], snapshot('ended', 'victory'));
  expect(play.mock.calls).toEqual([['victory']]);
  browser.dispatchEvent(new Event('blur')); audio.present([], snapshot('ended', 'victory'));
  expect(play).toHaveBeenCalledOnce(); await audio.destroy();
});
it('destroy removes window and document listeners', async () => {
  const { audio, browser, page, destroy } = setup(); const pause = vi.spyOn(audio, 'pause');
  await audio.destroy(); await audio.destroy();
  browser.dispatchEvent(new Event('blur')); page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
  expect(pause).not.toHaveBeenCalled(); expect(destroy).toHaveBeenCalledOnce();
});
