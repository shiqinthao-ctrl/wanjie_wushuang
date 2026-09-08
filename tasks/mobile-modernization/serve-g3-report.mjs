import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const mime = { '.html': 'text/html; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8' };
const outside = path => path === '..' || path.startsWith('..\\') || path.startsWith('../') || isAbsolute(path);

export async function serveReport(directory, port = 4190) {
  const root = await realpath(resolve(directory));
  const server = createServer(async (request, response) => {
    const fail = (code, headers = {}) => { response.writeHead(code, headers); response.end(); };
    if (!['GET', 'HEAD'].includes(request.method)) return fail(405, { Allow: 'GET, HEAD' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { return fail(400); }
    if (pathname.includes('\0')) return fail(400);
    const target = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (outside(relative(root, target))) return fail(403);
    try {
      const file = await realpath(target);
      if (outside(relative(root, file))) return fail(403);
      const info = await stat(file);
      if (!info.isFile()) return fail(404);
      const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
      let start = 0, end = info.size - 1, status = 200;
      // Single byte ranges let the video element seek without downloading every preceding frame.
      if (request.headers.range && request.method === 'GET') {
        const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        const reject = () => fail(416, { ...headers, 'Content-Range': `bytes */${info.size}` });
        if (!match || (!match[1] && !match[2])) return reject();
        if (match[1]) {
          start = Number(match[1]);
          end = match[2] ? Number(match[2]) : end;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start) return reject();
        } else {
          const suffix = Number(match[2]);
          if (!Number.isSafeInteger(suffix) || suffix <= 0) return reject();
          start = Math.max(0, info.size - suffix);
        }
        if (start >= info.size) return reject();
        end = Math.min(end, info.size - 1);
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        status = 206;
      }
      headers['Content-Length'] = Math.max(0, end - start + 1);
      response.writeHead(status, headers);
      if (request.method === 'HEAD' || info.size === 0) return response.end();
      const stream = createReadStream(file, { start, end });
      stream.on('error', error => response.destroy(error));
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (response.headersSent) response.destroy(error);
      else fail(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500);
    }
  });
  await new Promise((ready, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', ready);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.argv[3] || 4190);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
  await serveReport(process.argv[2] || process.cwd(), port);
  console.log(`G3 replay viewer: http://127.0.0.1:${port}/ (Ctrl+C to stop)`);
}
