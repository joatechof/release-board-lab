const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const expectedVersion = process.env.EXPECTED_VERSION;
let lastError;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    for (const path of ['/', '/health/live', '/health/ready', '/api/info', '/api/releases']) {
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      if (path === '/api/info' && expectedVersion) {
        const info = await response.json();
        if (info.version !== expectedVersion) throw new Error(`Versão ${info.version}; esperada ${expectedVersion}`);
      }
    }
    console.log(`Smoke test passou: ${base}${expectedVersion ? ` (${expectedVersion})` : ''}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}
console.error(`Smoke test falhou: ${lastError.message}`);
process.exit(1);
