import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);

export function createApp(options = {}) {
  const config = {
    version: process.env.APP_VERSION ?? '1.0.0',
    environment: process.env.APP_ENV ?? 'local',
    channel: process.env.RELEASE_CHANNEL ?? 'stable',
    readinessFail: process.env.READINESS_FAIL === 'true',
    ...options,
  };
  const startedAt = Date.now();
  const server = createServer(async (req, res) => {
    const started = performance.now();
    const requestId = crypto.randomUUID();
    const path = new URL(req.url, 'http://localhost').pathname;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    res.once('finish', () => {
      console.log(JSON.stringify({ level: 'info', requestId, method: req.method,
        path, status: res.statusCode, durationMs: Math.round(performance.now() - started),
        version: config.version }));
    });
    const json = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    try {
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return json(405, { error: 'Method not allowed' });
      }
      if (path === '/health/live') return json(200, { status: 'alive' });
      if (path === '/health/ready') {
        return json(config.readinessFail ? 503 : 200, {
          status: config.readinessFail ? 'not-ready' : 'ready',
        });
      }
      if (path === '/api/info') return json(200, {
        name: 'Release Board', version: config.version, environment: config.environment,
        instance: hostname(), uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        channel: config.channel,
      });
      if (path === '/api/releases') return json(200, [
        { version: '1.0.0', title: 'Primeiro pipeline', status: 'available' },
        { version: '0.2.0', title: 'Container e health checks', status: 'archived' },
        { version: '0.1.0', title: 'Primeira aplicação local', status: 'archived' },
      ]);
      if (assets.has(path)) {
        const [file, type] = assets.get(path);
        const content = await readFile(new URL(`../public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': type });
        return res.end(content);
      }
      return json(404, { error: 'Not found' });
    } catch (error) {
      console.error(JSON.stringify({ level: 'error', requestId, message: error.message }));
      return json(500, { error: 'Internal server error', requestId });
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createApp();
  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, '0.0.0.0', () => console.log(JSON.stringify({
    event: 'listening', port, version: process.env.APP_VERSION ?? '1.0.0',
  })));
  const shutdown = () => {
    console.log(JSON.stringify({ event: 'shutdown' }));
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
