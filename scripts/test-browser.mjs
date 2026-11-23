import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const server = spawn(process.execPath, ['--import', 'tsx', 'server/server.ts'], {
  env: { ...process.env, PORT: '0', TORIN_LISTEN: '127.0.0.1', TORIN_GATEWAY: '0' },
  stdio: ['ignore', 'pipe', 'inherit'],
});

try {
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Test server did not start.')), 10_000);
    server.once('error', reject);
    server.once('exit', (code) => reject(new Error('Test server exited with code ' + code)));
    server.stdout.on('data', (chunk) => {
      const port = /listening on port (\d+)/.exec(String(chunk))?.[1];
      if (port) {
        clearTimeout(timer);
        resolve('http://127.0.0.1:' + port);
      }
    });
  });
  const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
  const playwright = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
    env: { ...process.env, TORIN_TEST_URL: url },
    stdio: 'inherit',
  });
  const [code] = await once(playwright, 'exit');
  process.exitCode = code ?? 1;
} finally {
  server.kill();
}
