import { describe, expect, it, vi } from 'vitest';
import { BattleAudio } from './BattleAudio';
import type { AudioBackend } from './BattleAudio';

function setup() {
  let ready = false;
  const voices: { cue: string; stop: ReturnType<typeof vi.fn>; volume: ReturnType<typeof vi.fn> }[] = [];
  const backend: AudioBackend = {
    ready: () => ready,
    unlock: vi.fn(async () => { ready = true; }),
    play: cue => { const voice = { cue, stop: vi.fn(), volume: vi.fn() }; voices.push(voice); return voice; },
    destroy: vi.fn(async () => { ready = false; }),
  };
  return { backend, voices, audio: new BattleAudio(backend), interrupt: () => { ready = false; } };
}
describe('chapter bounded audio', () => {
  it('discards sounds before a user unlock and does not replay them', async () => {
    const { audio, voices, backend } = setup(); audio.play(['hit'], 0);
    expect(voices).toHaveLength(0); await audio.unlock(); expect(backend.unlock).toHaveBeenCalledOnce();
    expect(voices).toHaveLength(0); audio.play(['hit'], 1); expect(voices).toHaveLength(1);
  });
  it('coalesces bursts and imposes per-cue cooldown', async () => {
    const { audio, voices } = setup(); await audio.unlock();
    audio.play(Array(100).fill('hit'), 1); audio.play(['hit'], 1.01);
    expect(voices).toHaveLength(1); audio.play(['hit'], 1.3); expect(voices).toHaveLength(2);
  });
  it('caps voices at six and allows a danger cue to preempt a lower voice', async () => {
    const { audio, voices } = setup(); await audio.unlock();
    audio.play(['basic', 'skill', 'ultimate', 'kill', 'pickup', 'dodge'], 1);
    expect(voices).toHaveLength(6); audio.play(['warning'], 1.01);
    expect(voices.at(-1)?.cue).toBe('warning'); expect(voices.filter(v => v.stop.mock.calls.length)).toHaveLength(1);
    audio.play(['hit'], 1.02); expect(voices).toHaveLength(7);
  });
  it('ducks ordinary voices while danger sounds and restores after expiry', async () => {
    const { audio, voices } = setup(); await audio.unlock(); audio.play(['skill'], 1); audio.play(['warning'], 1.01);
    expect(voices[0]!.volume).toHaveBeenLastCalledWith(.1625);
    audio.play([], 1.6); expect(voices[0]!.volume).toHaveBeenLastCalledWith(.65);
  });
  it('pause stops voices immediately, drops queued events and resumes only explicitly', async () => {
    const { audio, voices } = setup(); await audio.unlock(); audio.play(['skill'], 0); audio.pause();
    expect(voices[0]!.stop).toHaveBeenCalledOnce(); audio.play(['hit'], 2); expect(voices).toHaveLength(1);
    await audio.unlock(); audio.play(['hit'], 3); expect(voices).toHaveLength(1);
    audio.resume(); audio.play(['hit'], 4); expect(voices).toHaveLength(2);
  });
  it('mute/zero volume stops voices without accumulating sounds', async () => {
    const { audio, voices } = setup(); await audio.unlock(); audio.play(['skill'], 0); audio.configure(false, .8);
    expect(voices[0]!.stop).toHaveBeenCalledOnce(); audio.play(['hit'], 1); audio.configure(true, 0); audio.play(['hit'], 2);
    expect(voices).toHaveLength(1); audio.configure(true, .8); audio.play(['hit'], 3);
    expect(voices[1]!.volume).toHaveBeenLastCalledWith(.8);
  });
  it('deduplicates pending unlock, tolerates rejection and retries on a later gesture', async () => {
    const { audio, backend, voices } = setup(); let reject!: (error: Error) => void;
    vi.mocked(backend.unlock).mockImplementationOnce(() => new Promise((_, no) => { reject = no; }));
    const a = audio.unlock(), b = audio.unlock(); expect(backend.unlock).toHaveBeenCalledOnce();
    reject(new Error('blocked')); await Promise.all([a, b]); audio.play(['hit'], 0); expect(voices).toHaveLength(0);
    await audio.unlock(); audio.play(['hit'], 1); expect(voices).toHaveLength(1);
  });
  it('interrupted audio waits for another gesture, never auto unlocks', async () => {
    const { audio, voices, backend, interrupt } = setup(); await audio.unlock(); interrupt(); audio.play(['hit'], 0);
    expect(voices).toHaveLength(0); expect(backend.unlock).toHaveBeenCalledOnce(); await audio.unlock(); audio.play(['hit'], 1);
    expect(voices).toHaveLength(1);
  });
  it('destroy is idempotent and late unlock cannot revive the mixer', async () => {
    const { audio, backend, voices } = setup(); await audio.unlock(); audio.play(['skill'], 0);
    await Promise.all([audio.destroy(), audio.destroy()]); await audio.unlock(); audio.play(['hit'], 1);
    expect(backend.destroy).toHaveBeenCalledOnce(); expect(backend.unlock).toHaveBeenCalledOnce();
    expect(voices).toHaveLength(1); expect(voices[0]!.stop).toHaveBeenCalledOnce();
  });
});
