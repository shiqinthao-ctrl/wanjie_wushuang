import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const normalize = path => path.replaceAll('\\', '/');
const hash = data => createHash('sha256').update(data).digest('hex');
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0 || result.stderr.trim()) throw new Error(`${command}: ${result.error || result.stderr}`);
  return result;
};
const probe = path => JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path]).stdout);
await mkdir(resolve(root, 'watch'), { recursive: true });
await mkdir(resolve(root, 'highlights'), { recursive: true });
const dirs = await readdir(resolve(root, 'browser-verified/test-results'));
const exports = [];
for (const kind of ['soldier', 'boss']) for (const action of ['hit', 'dodge', 'interrupt']) {
  for (const project of ['desktop', 'phone']) {
    const name = dirs.find(dir => dir.endsWith(`enemy-${kind}-${action}-effects-on-${project}`));
    if (!name) throw new Error(`Missing scene: ${kind}/${action}/${project}`);
    const path = resolve(root, 'browser-verified/test-results', name);
    for (const file of ['scenario.json', ...(action === 'interrupt' ? [] : ['windup.png']), 'response.png']) {
      await copyFile(resolve(path, file), resolve(root, `highlights/${project}-${kind}-${action}-${file}`));
    }
    if (project === 'phone') exports.push({ source: resolve(path, 'video.webm'), target: `${kind}-${action}.mp4`, kind, action, effects: true });
  }
}
const off = dirs.find(dir => dir.endsWith('enemy-boss-hit-effects-off-phone'));
if (!off) throw new Error('Missing effects-off scene');
const offPath = resolve(root, 'browser-verified/test-results', off);
exports.push({ source: resolve(offPath, 'video.webm'), target: 'boss-effects-off.mp4', kind: 'boss', action: 'hit', effects: false });
await copyFile(resolve(offPath, 'windup.png'), resolve(root, 'highlights/phone-boss-effects-off-windup.png'));
await copyFile(resolve(offPath, 'scenario.json'), resolve(root, 'highlights/phone-boss-effects-off-scenario.json'));

const timeline = [];
let elapsed = 0;
for (const item of exports) {
  const target = resolve(root, 'watch', item.target);
  run('ffmpeg', ['-v', 'error', '-y', '-i', item.source, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target]);
  const duration = Number(probe(target).format.duration);
  timeline.push({ file: `watch/${item.target}`, startSeconds: elapsed, durationSeconds: duration, kind: item.kind, action: item.action, effects: item.effects });
  elapsed += duration;
}
const concat = resolve(root, 'watch/concat.txt');
await writeFile(concat, exports.map(item => `file '${item.target}'`).join('\n') + '\n');
run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', concat, '-c', 'copy', '-movflags', '+faststart', resolve(root, 'watch/r1d-review.mp4')]);

const records = [], decoded = new Map();
const files = (await readdir(root, { recursive: true })).filter(file => ['.webm', '.mp4'].includes(extname(file))).sort();
for (const file of files) {
  const path = resolve(root, file), data = await readFile(path), sha256 = hash(data);
  let result = decoded.get(sha256);
  if (!result) {
    const metadata = probe(path), duration = Number(metadata.format.duration);
    // Interrupted WebM can return exit zero, so reject decoder stderr and missing duration too.
    run('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-']);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Incomplete recording: ${file}`);
    result = { durationSeconds: duration, streams: metadata.streams.map(({ codec_type, codec_name, width, height }) => ({ codec_type, codec_name, width, height })), fullDecode: 'passed' };
    decoded.set(sha256, result);
  }
  records.push({ file: normalize(file), bytes: data.length, sha256, ...result });
}
await writeFile(resolve(root, 'recordings.json'), JSON.stringify({ verifiedAt: new Date().toISOString(),
  exports: exports.map(({ source, target, ...scene }) => ({ source: normalize(relative(root, source)), file: `watch/${target}`, ...scene, synthetic: true, speed: 1 })),
  review: { file: 'watch/r1d-review.mp4', synthetic: true, speed: 1, timeline }, records }, null, 2) + '\n');

const dist = resolve(root, '../../../../apps/mobile-next/dist');
const assets = [];
for (const entry of (await readdir(dist, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile())) {
  const path = resolve(entry.parentPath, entry.name), data = await readFile(path);
  if (['.js', '.html'].includes(extname(path)) && /enemyScenario|ChapterBattle|directed-enemy/.test(data.toString())) throw new Error(`Public fixture leak: ${path}`);
  assets.push({ file: normalize(relative(dist, path)), bytes: data.length, sha256: hash(data) });
}
await writeFile(resolve(root, 'build-hashes.json'), JSON.stringify({ generatedAt: new Date().toISOString(), deployed: false, fixtureLeak: false, files: assets.sort((a, b) => a.file.localeCompare(b.file)) }, null, 2) + '\n');
console.log(JSON.stringify({ recordings: records.length, uniqueHashes: decoded.size, fullDecode: 'passed', buildFiles: assets.length, reviewSeconds: elapsed }));
