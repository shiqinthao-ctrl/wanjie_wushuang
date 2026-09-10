import { describe, expect, it, vi, afterEach } from 'vitest';
import { chapterActions, chapterAssets, chapterCues } from './chapterPresentation';
import { cues } from './audio/cues';
import { loadAudioSettings, saveAudioSettings } from './audio/settings';
import { BattleAudio } from './audio/BattleAudio';
import { GameCore } from '../core/GameCore';
import fresh from '../data/freshSave.json';
import { existsSync } from 'node:fs';

afterEach(() => vi.unstubAllGlobals());
describe('chapter presentation mapping', () => {
  it('every mapped action has a cue and every file exists in the chapter bundle', () => {
    for (const value of Object.values(chapterActions)) expect(cues[value]).toBeDefined();
    for (const asset of chapterAssets) expect(existsSync(`public/${asset.file}`)).toBe(true);
    expect(new Set(chapterAssets.map(a => a.id)).size).toBe(chapterAssets.length);
  });
  it('maps feedback from committed events and ignores zero damage, unknown and nonrelease events', () => {
    expect(chapterCues([
      { type: 'hit', damage: 0, x: 0, y: 0, critical: false },
      { type: 'ring', source: 'unknown', x: 0, y: 0, radius: 1 },
      { type: 'dragon-slash', source: 'H001_DRAGON_E', phase: 'windup', progress: .2, x: 0, y: 0, radius: 1, facing: 0, angle: 1 },
    ])).toEqual([]);
    expect(chapterCues([
      { type: 'battle-feedback', kind: 'boss-warning', source: '旋风断军' },
      { type: 'battle-feedback', kind: 'evolution', source: 'dragon' },
      { type: 'battle-feedback', kind: 'awakening', source: 'awaken' },
      { type: 'ring', source: 'dodge', x: 0, y: 0, radius: 1 },
      { type: 'dragon-slash', source: 'H001_DRAGON_E', phase: 'release', progress: 0, x: 0, y: 0, radius: 1, facing: 0, angle: 1 },
    ])).toEqual(['warning', 'evolve', 'awaken', 'dodge', 'skill']);
  });
  it('audio on/off consumes the same seeded battle with equal snapshots, entities and choices', async () => {
    const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
    const results = [];
    for (const enabled of [true, false]) {
      const core = new GameCore(fresh, () => .8, 'classic', options);
      const audio = new BattleAudio({ ready: () => true, unlock: async () => {}, play: () => ({ stop() {}, volume() {} }), destroy: async () => {} });
      audio.configure(enabled, .65); core.start(390, 844);
      for (let i = 0; i < 4000; i++) {
        const offer = core.snapshot().choice;
        if (offer) { const option = offer.options.find(o => o.id === 'dragon') || offer.options[0]!; core.choose(offer.token, option.kind, option.id); }
        if (i % 90 === 0) core.action('skill'); if (i % 150 === 0) core.action('dodge');
        core.move(Math.sin(i / 80), Math.cos(i / 80)); core.advance(.04); audio.play(chapterCues(core.takeEvents()), i * .04);
      }
      results.push({ ui: core.snapshot(), render: core.renderState() }); await audio.destroy(); core.destroy();
    }
    expect(results[0]).toEqual(results[1]);
  });
});
describe('separate audio preferences', () => {
  it('uses safe defaults when storage is unavailable or malformed', () => {
    expect(loadAudioSettings()).toEqual({ enabled: true, volume: .65 });
    vi.stubGlobal('localStorage', { getItem: () => 'oops', setItem: () => { throw new Error('quota'); } });
    expect(loadAudioSettings()).toEqual({ enabled: true, volume: .65 }); expect(saveAudioSettings({ enabled: false, volume: 0 })).toBe(false);
  });
  it('roundtrips mute/volume without touching game saves and clamps unsafe values', () => {
    const data = new Map(); vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key), setItem: (key: string, value: string) => data.set(key, value) });
    expect(saveAudioSettings({ enabled: false, volume: .4 })).toBe(true); expect(loadAudioSettings()).toEqual({ enabled: false, volume: .4 });
    saveAudioSettings({ enabled: true, volume: 3 }); expect(loadAudioSettings().volume).toBe(1);
    expect([...data.keys()]).toEqual(['wanjie-mobile-next:chapter-audio:v1']);
  });
});
