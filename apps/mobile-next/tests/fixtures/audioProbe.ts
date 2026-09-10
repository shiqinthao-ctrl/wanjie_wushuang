// Test-only observation and capture. Never imported by the production app.
export function installAudioProbe() {
  const records: { context: AudioContext; analyser: AnalyserNode; destination: MediaStreamAudioDestinationNode; starts: number; live: number; peak: number }[] = [];
  const Native = window.AudioContext;
  class ObservedContext extends Native {
    private record;
    constructor(options?: AudioContextOptions) {
      super(options);
      this.record = { context: this, analyser: this.createAnalyser(), destination: this.createMediaStreamDestination(), starts: 0, live: 0, peak: 0 };
      records.push(this.record);
    }
    override createGain(): GainNode {
      const node = super.createGain(), original = node.connect.bind(node), record = this.record;
      function connect(target: AudioNode, output?: number, input?: number): AudioNode;
      function connect(target: AudioParam, output?: number): void;
      function connect(target: AudioNode | AudioParam, output = 0, input = 0): AudioNode | void {
        if (target instanceof AudioParam) return original(target, output);
        if (target === record.context.destination) { original(record.analyser); original(record.destination); }
        return original(target, output, input);
      }
      node.connect = connect;
      return node;
    }
    override createOscillator(): OscillatorNode {
      const node = super.createOscillator(), start = node.start.bind(node), record = this.record;
      node.start = (when?: number) => { record.starts++; record.live++; record.peak = Math.max(record.peak, record.live); start(when); };
      node.addEventListener('ended', () => { record.live--; });
      return node;
    }
  }
  window.AudioContext = ObservedContext;
  let recorder: MediaRecorder | undefined, stream: MediaStream | undefined;
  let recording: Promise<number[]> | undefined;
  let started = 0;
  const timeline: { seconds: number; label: string }[] = [];
  const probe = {
    mark: (label: string) => { if (started) timeline.push({ seconds: (performance.now() - started) / 1000, label }); },
    timeline: () => [...timeline],
    summary: () => records.map(r => {
      const samples = new Float32Array(r.analyser.fftSize); r.analyser.getFloatTimeDomainData(samples);
      return { state: r.context.state, starts: r.starts, live: r.live, peak: r.peak, rms: Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length) };
    }),
    record: () => {
      const record = records.at(-1)!;
      stream = document.querySelector('canvas')!.captureStream(30);
      stream.addTrack(record.destination.stream.getAudioTracks()[0]!);
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      recording = new Promise<number[]>(resolve => {
        recorder!.onstop = async () => { const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer()); resolve(Array.from(bytes)); stream!.getVideoTracks().forEach(t => t.stop()); };
      });
      recorder.start(100);
      started = performance.now();
    },
    stop: async () => {
      if (!recorder || !recording) return [];
      if (recorder.state !== 'inactive') recorder.stop();
      const bytes = await recording; recorder = undefined; recording = undefined; return bytes;
    },
  };
  Object.assign(window, { AudioProbe: probe });
}
export interface AudioProbe {
  mark(label: string): void;
  timeline(): { seconds: number; label: string }[];
  summary(): { state: string; starts: number; live: number; peak: number; rms: number }[];
  record(): void;
  stop(): Promise<number[]>;
}
