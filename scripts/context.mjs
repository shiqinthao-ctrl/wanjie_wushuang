import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['AGENTS.md','TASK.md','handoff/STATE.md','docs/INDEX.md'];
let total = 0;
for (const rel of files) {
  const p = path.join(root, rel);
  const bytes = fs.statSync(p).size;
  total += bytes;
  console.log(`${String(bytes).padStart(5)} bytes  ${rel}`);
}
console.log(`-----\n${total} bytes  active context packet`);
const limit = 8192;
if (total > limit) {
  console.error(`CONTEXT FAIL: active packet exceeds ${limit} bytes.`);
  process.exit(1);
}
console.log(`CONTEXT OK: under ${limit} bytes. Long references are progressive-disclosure only.`);
