import { cues, isCue } from './cues';
import type { CueId } from './cues';

export interface AudioVoice { stop(): void; volume(value: number): void }
export interface AudioBackend {
  ready(): boolean;
  unlock(): Promise<void>;
  play(cue: CueId): AudioVoice;
  destroy(): Promise<void>;
}
export class BattleAudio {
  private voices: { cue: CueId; until: number; voice: AudioVoice }[] = [];
  private last = new Map<CueId, number>();
  private enabled = true;
  private volume = .65;
  private paused = false;
  private destroyed = false;
  private pending?: Promise<void>;
  private teardown?: Promise<void>;
  constructor(private backend: AudioBackend) {}
  unlock(): Promise<void> {
    if (this.destroyed || this.backend.ready()) return Promise.resolve();
    if (!this.pending) this.pending = this.backend.unlock().catch(() => {}).finally(() => { this.pending = undefined; });
    return this.pending;
  }
  play(requested: readonly string[], now: number): void {
    if (this.destroyed || this.paused || !this.enabled || !this.volume || !this.backend.ready() || !Number.isFinite(now)) return;
    this.voices = this.voices.filter(item => { if (item.until > now) return true; item.voice.stop(); return false; });
    const batch = [...new Set(requested.filter(isCue))].sort((a, b) => cues[b].priority - cues[a].priority);
    for (const cue of batch) {
      const spec = cues[cue];
      if (now - (this.last.get(cue) ?? -Infinity) < spec.cooldown) continue;
      if (this.voices.length >= 6) {
        const lowest = this.voices.reduce((a, b) => cues[a.cue].priority <= cues[b.cue].priority ? a : b);
        if (cues[lowest.cue].priority >= spec.priority) continue;
        lowest.voice.stop(); this.voices.splice(this.voices.indexOf(lowest), 1);
      }
      try {
        const voice = this.backend.play(cue);
        this.voices.push({ cue, until: now + spec.duration, voice }); this.last.set(cue, now);
      } catch { /* Audio failure must not stop the battle or replay a backlog. */ }
    }
    this.mix();
  }
  private mix(): void {
    const danger = this.voices.some(item => cues[item.cue].priority >= 8);
    for (const item of this.voices) item.voice.volume(this.volume * (danger && cues[item.cue].priority < 8 ? .25 : 1));
  }
  private clear(): void {
    for (const item of this.voices) item.voice.stop();
    this.voices = []; this.last.clear();
  }
  pause(): void { this.paused = true; this.clear(); }
  resume(): void { if (!this.destroyed) this.paused = false; }
  configure(enabled: boolean, volume: number): void {
    this.enabled = enabled; this.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : .65;
    if (!enabled || !this.volume) this.clear(); else this.mix();
  }
  destroy(): Promise<void> {
    if (!this.teardown) { this.destroyed = true; this.clear(); this.teardown = this.backend.destroy().catch(() => {}); }
    return this.teardown;
  }
}
