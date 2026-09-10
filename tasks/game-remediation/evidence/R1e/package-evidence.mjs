import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const normalize = path => path.replaceAll('\\', '/');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command, args, binary = false) => {
  const result = spawnSync(command, args, { cwd: root, encoding: binary ? undefined : 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0 || result.stderr.toString().trim()) throw new Error(`${command}: ${result.error || result.stderr}`);
  return result.stdout;
};
const probe = path => JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path]));
// Web Audio may omit silent packets. Preserve their timestamp gaps on export.
const encode = (source, target, audio) => run('ffmpeg', ['-v', 'error', '-y', '-i', source, '-vf', 'fps=30', ...(audio ? ['-af', 'aresample=async=1:first_pts=0'] : []), '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', target]);
await mkdir(resolve(root, 'watch'), { recursive: true });
await mkdir(resolve(root, 'highlights'), { recursive: true });
const sourceRoot = resolve(root, 'browser-final/test-results');
const dirs = await readdir(sourceRoot), exports = [], audioChecks = [];
for (const project of ['desktop', 'phone']) for (const scene of ['trusted-unlo', 'chapter-grow']) {
  const dir = dirs.find(name => name.startsWith(`chapter-audio-${scene}`) && name.endsWith(`-${project}`));
  if (!dir) throw new Error(`Missing ${project}/${scene}`);
  const source = resolve(sourceRoot, dir), kind = scene === 'trusted-unlo' ? 'controls' : 'growth';
  for (const [file, suffix, audio] of [['battle-with-audio.webm', 'audio', true], ['video.webm', 'ui', false]]) {
    const target = `watch/${project}-${kind}-${suffix}.mp4`;
    encode(resolve(source, file), resolve(root, target), audio);
    exports.push({ source: normalize(relative(root, resolve(source, file))), file: target, project, kind, audio, synthetic: true, speed: 1 });
  }
  for (const file of ['audio.json', 'backend.json', 'timeline.json', kind === 'controls' ? 'audio-settings.png' : 'boss-audio.png']) {
    await copyFile(resolve(source, file), resolve(root, `highlights/${project}-${kind}-${file}`));
  }
  const timeline = JSON.parse(await readFile(resolve(source, 'timeline.json'), 'utf8'));
  const mp4 = resolve(root, `watch/${project}-${kind}-audio.mp4`);
  const pcm = run('ffmpeg', ['-v', 'error', '-i', mp4, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'], true);
  const rms = (start, duration) => {
    const first = Math.max(0, Math.floor(start * 48000)), last = Math.min(pcm.length / 4, Math.floor((start + duration) * 48000));
    if (last <= first) throw new Error('Empty audio sample');
    let sum = 0; for (let i = first; i < last; i++) sum += pcm.readFloatLE(i * 4) ** 2;
    return Math.sqrt(sum / (last - first));
  };
  const fullRms = rms(0, pcm.length / 4 / 48000);
  if (fullRms < .001) throw new Error(`Silent export: ${mp4}`);
  const checks = [];
  if (kind === 'controls') for (const label of ['paused-silence', 'muted-combat', 'blur-silence']) {
    const start = timeline.find(mark => mark.label === label).seconds + .12;
    const value = rms(start, .25);
    if (value > .0001) throw new Error(`Unexpected sound: ${project}/${label} RMS ${value}`);
    checks.push({ label, fromSeconds: start, durationSeconds: .25, rms: value, maximum: .0001 });
  }
  audioChecks.push({ file: normalize(relative(root, mp4)), fullRms, checks, timeline });
}
const settingsDir = dirs.find(name => name.startsWith('chapter-audio-preferences-') && name.endsWith('-phone'));
for (const width of [360, 390, 430]) await copyFile(resolve(sourceRoot, settingsDir, `settings-${width}.png`), resolve(root, `highlights/settings-${width}.png`));
for (const project of ['desktop', 'phone']) {
  const dir = dirs.find(name => name.startsWith('chapter-audio-twenty-') && name.endsWith(`-${project}`));
  await copyFile(resolve(sourceRoot, dir, 'lifecycle.json'), resolve(root, `highlights/${project}-lifecycle.json`));
}

const clips = ['phone-controls-audio.mp4', 'phone-growth-audio.mp4'];
await writeFile(resolve(root, 'watch/concat.txt'), clips.map(file => `file '${file}'`).join('\n') + '\n');
const firstDuration = Number(probe(resolve(root, `watch/${clips[0]}`)).format.duration);
const total = firstDuration + Number(probe(resolve(root, `watch/${clips[1]}`)).format.duration);
const stamp = seconds => {
  const value = Math.floor(seconds * 100);
  return `${Math.floor(value / 360000)}:${String(Math.floor(value / 6000) % 60).padStart(2, '0')}:${String(Math.floor(value / 100) % 60).padStart(2, '0')}.${String(value % 100).padStart(2, '0')}`;
};
const labels = {
  skill: 'Active skill: sound on', 'paused-silence': 'Paused: silence', 'muted-combat': 'Combat continues: muted',
  'ultimate-unmuted': 'Ultimate: sound restored', 'blur-silence': 'Window blur: silence', evolution: 'Evolution: dragon',
  awakening: 'Awakening: new cue', 'boss-arrival-warning': 'Directed Boss arrival and warning',
};
const marks = audioChecks.filter(item => item.file.includes('phone')).flatMap((item, i) => item.timeline.map(mark => ({ ...mark, seconds: mark.seconds + (i ? firstDuration : 0) })));
const events = marks.map((mark, i) => `Dialogue: 0,${stamp(mark.seconds)},${stamp(marks[i + 1]?.seconds ?? total)},Default,,0,0,60,,${labels[mark.label]}`);
await writeFile(resolve(root, 'watch/review.ass'), `[Script Info]\nScriptType: v4.00+\nPlayResX: 390\nPlayResY: 844\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Microsoft YaHei,16,&H00FFFFFF,&H00FFFFFF,&H80000000,&H80000000,0,0,0,0,100,100,0,0,3,2,0,2,12,12,28,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:00.00,${stamp(total)},Default,,0,0,18,,R1e | Directed tests | Engineering tones\n${events.join('\n')}\n`);
// Separate decoder inputs avoid the concat demuxer reusing one VFR timebase
// for both files, which can stretch video relative to the audio timeline.
run('ffmpeg', ['-v', 'error', '-y', '-i', `watch/${clips[0]}`, '-i', `watch/${clips[1]}`, '-filter_complex', '[0:v]settb=AVTB,setpts=PTS-STARTPTS[v0];[1:v]settb=AVTB,setpts=PTS-STARTPTS[v1];[0:a]asetpts=PTS-STARTPTS[a0];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a];[v]subtitles=watch/review.ass[out]', '-map', '[out]', '-map', '[a]', '-r', '30', '-fps_mode', 'cfr', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'watch/r1e-review.mp4']);
const reviewDuration = Number(probe(resolve(root, 'watch/r1e-review.mp4')).format.duration);
if (Math.abs(reviewDuration - total) > .08) throw new Error(`Review timeline shifted: ${reviewDuration} vs ${total}`);

const records = [], decoded = new Map();
for (const file of (await readdir(root, { recursive: true })).filter(file => ['.webm', '.mp4'].includes(extname(file))).sort()) {
  const path = resolve(root, file), data = await readFile(path), sha256 = hash(data);
  let result = decoded.get(sha256);
  if (!result) {
    const metadata = probe(path);
    // Keep VFR timestamps precise; the null muxer's inferred 30fps timebase can
    // otherwise round adjacent recorded frames onto the same output timestamp.
    const progress = run('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-enc_time_base:v', '1:1000000', '-fps_mode', 'passthrough', '-progress', 'pipe:1', '-nostats', '-f', 'null', '-']);
    // Live MediaRecorder WebM has no duration header; a full clean decode supplies it.
    const times = [...progress.matchAll(/out_time_us=(\d+)/g)].map(match => Number(match[1]) / 1e6);
    const duration = Number(metadata.format.duration) || times.at(-1);
    if (!Number.isFinite(duration) || duration <= 0 || !progress.includes('progress=end')) throw new Error(`Incomplete recording: ${file}`);
    result = { durationSeconds: duration, streams: metadata.streams.map(({ codec_type, codec_name, width, height }) => ({ codec_type, codec_name, width, height })), fullDecode: 'passed' };
    decoded.set(sha256, result);
  }
  records.push({ file: normalize(file), bytes: data.length, sha256, ...result, ...(normalize(file).includes('export-attempt-') ? { exportAcceptance: 'rejected-timeline', retained: true } : {}) });
}
await writeFile(resolve(root, 'recordings.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), exports, audioChecks,
  review: { file: 'watch/r1e-review.mp4', speed: 1, synthetic: true, canvasOnly: true, durationSeconds: reviewDuration, expectedSeconds: total, marks }, records }, null, 2) + '\n');
const dist = resolve(root, '../../../../apps/mobile-next/dist'), assets = [];
for (const entry of (await readdir(dist, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile())) {
  const path = resolve(entry.parentPath, entry.name), data = await readFile(path);
  if (['.js', '.html'].includes(extname(path)) && /enemyScenario|ChapterBattle|chapterAudioEvidence|AudioProbe/.test(data.toString())) throw new Error(`Fixture leak: ${path}`);
  assets.push({ file: normalize(relative(dist, path)), bytes: data.length, sha256: hash(data) });
}
await writeFile(resolve(root, 'build-hashes.json'), JSON.stringify({ generatedAt: new Date().toISOString(), deployed: false, fixtureLeak: false, files: assets.sort((a, b) => a.file.localeCompare(b.file)) }, null, 2) + '\n');
console.log(JSON.stringify({ recordings: records.length, uniqueHashes: decoded.size, fullDecode: 'passed', audioChecks: audioChecks.length, buildFiles: assets.length, reviewSeconds: total }));
