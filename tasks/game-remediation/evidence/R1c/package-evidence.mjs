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
  if (result.error || result.status !== 0) throw new Error(`${command}: ${result.error || result.stderr}`);
  return result;
};
await mkdir(resolve(root, 'watch'), { recursive: true });
await mkdir(resolve(root, 'highlights'), { recursive: true });
const dirs = await readdir(resolve(root, 'browser-final/test-results'));
const scenes = { crowd: 'c55e0', ranged: '4b9b3', elite: '0661f', boss: 'dc729' };
const exports = [];
for (const [scene, id] of Object.entries(scenes)) {
  for (const project of ['desktop', 'phone']) {
    const name = dirs.find(dir => dir.includes(`-${id}-`) && dir.endsWith(`-${project}`));
    if (!name) throw new Error(`Missing scene: ${scene}/${project}`);
    const path = resolve(root, 'browser-final/test-results', name);
    for (const file of ['scenario.json', 'windup.png', 'combat.png', 'guide.png']) {
      await copyFile(resolve(path, file), resolve(root, `highlights/${project}-${scene}-${file}`));
    }
    if (project === 'phone') exports.push({ source: resolve(path, 'video.webm'), target: `directed-${scene}.mp4`, synthetic: true });
  }
}
for (const [project, attempt] of [['desktop', 'natural-01'], ['phone', 'natural-03']]) {
  const folder = (await readdir(resolve(root, attempt, 'test-results'))).find(dir => dir.endsWith(`-${project}`));
  exports.push({ source: resolve(root, attempt, 'test-results', folder, 'video.webm'), target: `natural-${project}.mp4`, synthetic: false });
}
for (const item of exports) {
  run('ffmpeg', ['-v', 'error', '-y', '-i', item.source, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(root, 'watch', item.target)]);
  console.log(`Exported ${item.target}`);
}

const records = [], decoded = new Map();
const files = (await readdir(root, { recursive: true })).filter(file => ['.webm', '.mp4'].includes(extname(file))).sort();
for (const file of files) {
  const path = resolve(root, file), data = await readFile(path), sha256 = hash(data);
  let result = decoded.get(sha256);
  if (!result) {
    const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path]).stdout);
    const decode = spawnSync('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'], { encoding: 'utf8' });
    const duration = Number(probe.format.duration);
    // Some interrupted WebM files return exit zero despite an incomplete stream.
    const complete = decode.status === 0 && !decode.stderr.trim() && Number.isFinite(duration) && duration > 0;
    if (!complete && !normalize(file).startsWith('natural-02/')) throw new Error(`Unexpected incomplete recording: ${file}: ${decode.stderr}`);
    result = { durationSeconds: Number.isFinite(duration) ? duration : null,
      streams: probe.streams.map(({ codec_type, codec_name, width, height }) => ({ codec_type, codec_name, width, height })),
      fullDecode: complete ? 'passed' : 'interrupted-partial',
      ...(complete ? {} : { diagnostic: decode.stderr.trim() || 'Missing finite duration' }) };
    decoded.set(sha256, result);
  }
  records.push({ file: normalize(file), bytes: data.length, sha256, ...result });
}
await writeFile(resolve(root, 'recordings.json'), JSON.stringify({ verifiedAt: new Date().toISOString(),
  exports: exports.map(({ source, target, synthetic }) => ({ source: normalize(relative(root, source)), file: `watch/${target}`, synthetic, speed: 1 })),
  records }, null, 2) + '\n');

const dist = resolve(root, '../../../../apps/mobile-next/dist');
const buildFiles = await readdir(dist, { recursive: true, withFileTypes: true });
const assets = [];
for (const entry of buildFiles.filter(entry => entry.isFile())) {
  const path = resolve(entry.parentPath, entry.name), data = await readFile(path);
  assets.push({ file: normalize(relative(dist, path)), bytes: data.length, sha256: hash(data) });
}
await writeFile(resolve(root, 'build-hashes.json'), JSON.stringify({ generatedAt: new Date().toISOString(), deployed: false, files: assets.sort((a, b) => a.file.localeCompare(b.file)) }, null, 2) + '\n');
console.log(JSON.stringify({ recordings: records.length, uniqueHashes: decoded.size, complete: records.filter(record => record.fullDecode === 'passed').length,
  partial: records.filter(record => record.fullDecode !== 'passed').length, buildFiles: assets.length }));
