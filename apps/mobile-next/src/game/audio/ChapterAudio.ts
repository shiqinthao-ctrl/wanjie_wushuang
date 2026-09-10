import type { CoreEvent, UiSnapshot } from '../../core/GameCore';
import { chapterCues } from '../chapterPresentation';
import { BattleAudio } from './BattleAudio';
import { WebAudioBackend } from './WebAudioBackend';
import { loadAudioSettings } from './settings';
import type { AudioSettings } from './settings';

export class ChapterAudio {
  private listeners = new AbortController();
  private status?: UiSnapshot['status'];
  private interrupted = false;
  constructor(private mixer = new BattleAudio(new WebAudioBackend())) {
    this.configure(loadAudioSettings());
    const options = { capture: true, signal: this.listeners.signal };
    const unlock = (event: Event) => { if (event.isTrusted && !document.hidden) void this.mixer.unlock(); };
    window.addEventListener('pointerdown', unlock, options);
    window.addEventListener('keydown', unlock, options);
    // Capture-phase blur also sees focus moving between buttons and dialogs.
    window.addEventListener('blur', () => this.pause(), { signal: this.listeners.signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, options);
  }
  configure(settings: AudioSettings): void { this.mixer.configure(settings.enabled, settings.volume); }
  pause(): void { this.mixer.pause(); this.interrupted = true; }
  resume(): void { this.interrupted = false; this.status = undefined; }
  present(events: readonly CoreEvent[], snapshot: UiSnapshot): void {
    if (document.hidden || ['paused', 'destroyed', 'idle'].includes(snapshot.status)) { this.pause(); return; }
    if (this.interrupted) return;
    const changed = this.status !== snapshot.status;
    if (changed) { this.mixer.pause(); this.mixer.resume(); }
    // Modal transitions discard combat noise but retain the confirmed milestone.
    const visible = snapshot.status === 'running' ? events : events.filter(e => e.type === 'level-choice' || e.type === 'battle-feedback');
    const sounds = chapterCues(visible);
    if (changed && snapshot.status === 'ended') sounds.push(snapshot.endReason === 'victory' ? 'victory' : 'defeat');
    this.status = snapshot.status;
    this.mixer.play(sounds, performance.now() / 1000);
  }
  async destroy(): Promise<void> { this.listeners.abort(); await this.mixer.destroy(); }
}
