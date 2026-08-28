import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(d){
  return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{
    const p=path.join(d,e.name);
    return e.isDirectory()?walk(p):[p];
  });
}
const files=walk(root).filter(p=>p.endsWith('.md')).map(p=>({
  rel:path.relative(root,p), bytes:fs.statSync(p).size
})).sort((a,b)=>b.bytes-a.bytes);
for(const f of files) console.log(`${String(f.bytes).padStart(6)}  ${f.rel}`);
