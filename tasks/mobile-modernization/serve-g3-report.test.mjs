import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serveReport } from './serve-g3-report.mjs';

test('replay server delivers correct byte ranges and confines files to its root', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'wanjie-g3-viewer-'));
  const root = join(temp, 'report');
  await mkdir(root);
  await mkdir(join(temp, 'outside'));
  await writeFile(join(root, 'index.html'), '<h1>Replay</h1>');
  await writeFile(join(root, 'sample.webm'), Buffer.from('0123456789'));
  await writeFile(join(root, 'empty.txt'), '');
  await writeFile(join(temp, 'outside', 'private.txt'), 'outside');
  await symlink(join(temp, 'outside'), join(root, 'linked'), 'junction');
  const server = await serveReport(root, 0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal(await (await fetch(base)).text(), '<h1>Replay</h1>');
    const head = await fetch(base + '/sample.webm', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), '10');
    assert.equal(head.headers.get('content-type'), 'video/webm');
    assert.equal(await head.text(), '');
    for (const [range, text, contentRange] of [
      ['bytes=2-5', '2345', 'bytes 2-5/10'],
      ['bytes=7-', '789', 'bytes 7-9/10'],
      ['bytes=-3', '789', 'bytes 7-9/10'],
      ['bytes=8-99', '89', 'bytes 8-9/10'],
    ]) {
      const response = await fetch(base + '/sample.webm', { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('accept-ranges'), 'bytes');
      assert.equal(response.headers.get('content-range'), contentRange);
      assert.equal(response.headers.get('content-length'), String(text.length));
      assert.equal(await response.text(), text);
    }
    for (const range of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'bytes=9007199254740993-']) {
      const response = await fetch(base + '/sample.webm', { headers: { Range: range } });
      assert.equal(response.status, 416);
      assert.equal(response.headers.get('content-range'), 'bytes */10');
    }
    for (const [path, status] of [['/missing', 404], ['/empty.txt', 200], ['/linked/private.txt', 403],
      ['/%2e%2e%5coutside/private.txt', 403], ['/%', 400], ['/%00', 400]]) {
      const response = await fetch(base + path);
      assert.equal(response.status, status, path);
      await response.arrayBuffer();
    }
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  } finally {
    await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
    await rm(temp, { recursive: true });
  }
});
