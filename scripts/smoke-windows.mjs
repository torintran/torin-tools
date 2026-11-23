import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const listener = createServer();
await new Promise((ready) => listener.listen(0, '127.0.0.1', ready));
const { port } = listener.address();
await new Promise((ready) => listener.close(ready));
const profile = await mkdtemp(join(tmpdir(), 'torin-webview-'));
const program = resolve(process.argv[2] ?? 'src-tauri/target/x86_64-pc-windows-msvc/release/torin-tools.exe');
const app = spawn(program, [], {
  windowsHide: true,
  env: {
    ...process.env,
    WEBVIEW2_USER_DATA_FOLDER: profile,
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=' + port,
  },
});
let browser;
try {
  const url = 'http://127.0.0.1:' + port;
  for (let attempt = 0; attempt < 45; attempt++) {
    if (app.exitCode !== null) throw new Error('Torin Tools exited before its window was ready.');
    try {
      if ((await fetch(url + '/json/version', { signal: AbortSignal.timeout(1000) })).ok) break;
    } catch {
      if (attempt === 44) throw new Error('WebView2 debugger did not start.');
    }
    await wait(400);
  }
  browser = await chromium.connectOverCDP(url);
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? await context.waitForEvent('page', { timeout: 10_000 });
  const nav = page.getByRole('navigation');
  await nav.getByText('Encoding', { exact: true }).click({ timeout: 10_000 });
  await nav.getByRole('link', { name: 'Base64', exact: true }).click({ timeout: 10_000 });
  await page.getByRole('heading', { name: 'Base64', exact: true }).waitFor({ timeout: 10_000 });
  await page.getByLabel('Input').fill('Tiếng Việt 🐉');
  await page.getByRole('button', { name: 'Encode text' }).click();
  assert.equal(await page.getByLabel('Output').inputValue(), Buffer.from('Tiếng Việt 🐉').toString('base64'));
  await nav.getByText('API tools', { exact: true }).click();
  await nav.getByRole('link', { name: 'Postman Backup' }).click();
  assert.equal(await page.getByLabel('Connection').count(), 0);
  await page.getByText('Backup requests go to Postman over HTTPS.', { exact: false }).waitFor();
  const result = await page.evaluate(async () => {
    const { invoke } = window.__TAURI_INTERNALS__;
    await invoke('begin_backup', { job: 'smoke-job' });
    try {
      await invoke('postman_get', { job: 'smoke-job', route: '/invalid', apiKey: 'synthetic' });
      return 'Unexpectedly accepted an unknown route.';
    } catch (error) {
      return error;
    } finally {
      await invoke('cancel_backup', { job: 'smoke-job' });
    }
  });
  assert.equal(result, 'Invalid Postman request.');
  await page.getByRole('link', { name: 'Downloads' }).click();
  await page.route('https://api.github.com/repos/torintran/torin-tools/releases/latest', route =>
    route.fulfill({ json: { tag_name: 'v99.0.0' }, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await page.getByText('Version 99.0.0 is available.', { exact: false }).waitFor();
  console.log('Windows portable launched with WebView2. Base64, native IPC route guard, and update configuration passed.');
} finally {
  await browser?.close();
  app.kill();
}
