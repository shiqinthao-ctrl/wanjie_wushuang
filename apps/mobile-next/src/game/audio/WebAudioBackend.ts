import { cues } from './cues';
import type { CueId } from './cues';
import type { AudioBackend, AudioVoice } from './BattleAudio';

/** One lazy context per battle. The Phaser audio manager stays disabled. */
export class WebAudioBackend implements AudioBackend {
  private context?: AudioContext;
  private closed = false;
  private voices = new Set<AudioVoice>();
  ready(): boolean { return !this.closed && this.context?.state === 'running'; }
  async unlock(): Promise<void> {
    if (this.closed) return;
    // Creating/resuming here must stay synchronous with the trusted gesture.
    this.context ||= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
  }
  play(cue: CueId): AudioVoice {
    const context = this.context;
    if (!context || !this.ready()) throw new Error('Audio is locked');
    const spec = cues[cue], oscillator = context.createOscillator();
    const envelope = context.createGain(), volume = context.createGain(), now = context.currentTime;
    oscillator.type = spec.wave;
    spec.notes.forEach((frequency, index) => oscillator.frequency.setValueAtTime(frequency, now + index * spec.duration / spec.notes.length));
    // Six full-level voices remain below full scale; short ramps avoid clicks.
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.10, now + .008);
    envelope.gain.exponentialRampToValueAtTime(.001, now + spec.duration);
    oscillator.connect(envelope); envelope.connect(volume); volume.connect(context.destination);
    let stopped = false;
    const disconnect = () => { oscillator.disconnect(); envelope.disconnect(); volume.disconnect(); this.voices.delete(voice); };
    const voice: AudioVoice = {
      stop: () => { if (stopped) return; stopped = true; oscillator.stop(); disconnect(); },
      volume: value => { if (!stopped) volume.gain.setTargetAtTime(value, context.currentTime, .008); },
    };
    oscillator.onended = () => { stopped = true; disconnect(); };
    this.voices.add(voice); oscillator.start(now); oscillator.stop(now + spec.duration);
    return voice;
  }
  async destroy(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const voice of [...this.voices]) voice.stop();
    if (this.context && this.context.state !== 'closed') await this.context.close();
  }
}
