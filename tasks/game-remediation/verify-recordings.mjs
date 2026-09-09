import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = resolve(process.argv[2]);
const files = await readdir(root, { recursive: true });
const records = [];
for (const file of files.filter(file => ['.webm', '.mp4'].includes(extname(file)))) {
  const path = resolve(root, file);
  execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'], { stdio: 'pipe' });
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], { encoding: 'utf8' }));
  const bytes = await readFile(path);
  records.push({ file: relative(root, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), durationSeconds: Number(probe.format.duration), streams: probe.streams.map(({ codec_type, codec_name, width, height }) => ({ codec_type, codec_name, width, height })), fullDecode: 'passed' });
}
if (!records.length) throw new Error('No recordings found');
await writeFile(resolve(root, 'recordings.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), records }, null, 2) + '\n');
console.log(`Full decode and SHA-256 complete: ${records.length} recordings.`);
