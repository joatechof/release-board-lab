import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/server.js';

async function start(t, options) {
  const server = createApp(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('info identifica a versão e o ambiente efetivamente configurados', async (t) => {
  const base = await start(t, { version: 'commit-abc123', environment: 'test', channel: 'canary' });
  const response = await fetch(`${base}/api/info`);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('x-request-id'));
  const info = await response.json();
  assert.equal(info.version, 'commit-abc123');
  assert.equal(info.environment, 'test');
  assert.equal(info.channel, 'canary');
  assert.ok(info.instance);
});

test('liveness mantém-se disponível quando readiness falha', async (t) => {
  const base = await start(t, { readinessFail: true });
  assert.equal((await fetch(`${base}/health/live`)).status, 200);
  assert.equal((await fetch(`${base}/health/ready`)).status, 503);
});

test('readiness saudável e dados do quadro', async (t) => {
  const base = await start(t, { readinessFail: false });
  assert.equal((await fetch(`${base}/health/ready`)).status, 200);
  const releases = await (await fetch(`${base}/api/releases`)).json();
  assert.equal(releases.length, 3);
  assert.equal(releases[0].version, '1.0.0');
});

test('ficheiros públicos, 404 e métodos não suportados', async (t) => {
  const base = await start(t);
  const page = await fetch(base);
  assert.match(await page.text(), /Release Board/);
  assert.match(page.headers.get('content-security-policy'), /default-src 'self'/);
  for (const asset of ['/app.js', '/style.css']) assert.equal((await fetch(base + asset)).status, 200);
  for (const path of ['/.env', '/package.json', '/unknown']) assert.equal((await fetch(base + path)).status, 404);
  const post = await fetch(`${base}/api/releases`, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET');
});
