import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';

const id = '12345678-1234-1234-1234-123456789abc';
const key = 'synthetic-browser-key';
const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzeW50aGV0aWMtdG9rZW4ifQ.YQ';

test('local tools work offline, with balanced viewport and no stored token', async ({ page, context }) => {
  await page.goto('/');
  const catalog = page.getByRole('main');
  await expect(catalog.getByRole('heading', { name: 'All tools' })).toBeVisible();
  await catalog.getByRole('searchbox').fill('UTF-8');
  await expect(catalog.getByRole('link', { name: /Base64/ })).toBeVisible();
  await expect(catalog.getByRole('link', { name: /JWT Decoder/ })).toHaveCount(0);
  await catalog.getByRole('link', { name: /Base64/ }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill('Tiếng Việt 🐉');
  await page.getByRole('button', { name: 'Encode text' }).click();
  const encoded = await page.getByLabel('Output').inputValue();
  expect(encoded).toBe(Buffer.from('Tiếng Việt 🐉').toString('base64'));
  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill(encoded);
  await page.getByRole('button', { name: 'Decode Base64' }).click();
  await expect(page.getByLabel('Output')).toHaveValue('Tiếng Việt 🐉');
  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await page.getByRole('combobox', { name: 'Alphabet' }).click();
  await page.getByRole('option', { name: 'URL-safe Base64' }).click();
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill('🦄');
  await page.getByRole('button', { name: 'Encode text' }).click();
  await expect(page.getByLabel('Output')).toHaveValue('8J-mhA');
  await page.getByRole('link', { name: 'JWT Decoder' }).click();
  await page.getByLabel('Signed JWT').fill(jwt);
  await page.getByRole('button', { name: 'Decode JWT' }).click();
  await expect(page.getByText('"sub": "synthetic-token"', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Fields' }).click();
  await expect(page.getByText('Subject', { exact: true })).toBeVisible();
  await expect(page.getByText('HMAC with SHA-256')).toBeVisible();
  await page.getByRole('link', { name: 'Base64', exact: true }).click();
  await page.getByRole('link', { name: 'JWT Decoder' }).click();
  await expect(page.getByLabel('Signed JWT')).toHaveValue('');
  const state = await page.evaluate(() => ({
    storage: [localStorage.length, sessionStorage.length],
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(state.storage).toEqual([0, 0]);
  expect(state.content).toBe(state.viewport);
});

test('Base64 live text and binary file conversion work offline', async ({ page, context }) => {
  await page.goto('/#base64');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.getByRole('combobox', { name: 'Line handling' }).click();
  await page.getByRole('option', { name: 'Each line separately' }).click();
  await page.getByRole('checkbox', { name: 'Live mode' }).check();
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill('Tiếng Việt\nhello');
  await expect(page.getByLabel('Output')).toHaveValue(Buffer.from('Tiếng Việt').toString('base64') + '\naGVsbG8=');

  await page.getByRole('tab', { name: 'File', exact: true }).click();
  const file = page.locator('input[type=file]');
  const bytes = Buffer.from([0, 255, 10, 13, 99, 254]);
  const mimeType = 'application/octet-stream';
  await file.setInputFiles({ name: 'example.bin', mimeType, buffer: bytes });
  await page.getByRole('button', { name: 'Encode file' }).click();
  const encodedDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download result' }).click();
  const encoded = [];
  for await (const chunk of await (await encodedDownload).createReadStream()) encoded.push(chunk as Buffer);
  const encodedBytes = Buffer.concat(encoded);
  expect(encodedBytes.toString()).toBe(bytes.toString('base64'));

  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  await file.setInputFiles({ name: 'example.base64', mimeType: 'text/plain', buffer: encodedBytes });
  await page.getByRole('button', { name: 'Decode file' }).click();
  const decodedDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download result' }).click();
  const decoded = [];
  for await (const chunk of await (await decodedDownload).createReadStream()) decoded.push(chunk as Buffer);
  expect(Buffer.concat(decoded)).toEqual(bytes);
});

test('JWT signs and verifies locally while distinguishing signature state from claims', async ({ page, context }) => {
  await page.goto('/#jwt');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.getByRole('tab', { name: 'Sign', exact: true }).click();
  const secret = 'synthetic-local-jwt-secret-for-test-only';
  await page.getByLabel('Payload JSON').fill('{"sub":"offline-example","exp":1}');
  await page.getByLabel('Shared secret').fill(secret);
  await page.getByRole('button', { name: 'Sign JWT' }).click();
  const encoded = page.getByLabel('Encoded token');
  await expect(encoded).toHaveValue(/^[-\w]+\.[-\w]+\.[-\w]+$/);
  const token = await encoded.inputValue();

  await page.getByRole('tab', { name: 'Decode / Verify', exact: true }).click();
  await page.getByLabel('Signed JWT').fill(token);
  await expect(page.getByText('"sub": "offline-example"', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Shared secret')).toHaveValue('');
  await page.getByLabel('Shared secret').fill(secret);
  await page.getByRole('button', { name: 'Verify signature' }).click();
  await expect(page.getByText('Signature verified. Claims are unvalidated.')).toBeVisible();
  await page.getByLabel('Shared secret').fill('different-key');
  await expect(page.getByText('Decoded only — signature not verified')).toBeVisible();
  await page.getByRole('button', { name: 'Verify signature' }).click();
  await expect(page.getByRole('alert')).toHaveText('The signature does not match this token and key.');
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test('backup download contains workspace and leaves secrets outside the cache', async ({ page, context }) => {
  const hostRequests: string[] = [];
  context.on('request', (request) => {
    if (new URL(request.url()).hostname === '127.0.0.1') {
      hostRequests.push(JSON.stringify({ url: request.url(), headers: request.headers(), data: request.postData() }));
    }
  });
  await context.route('https://api.postman.com/**', async (route) => {
    const target = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(route.request().headers()['x-api-key']).toBe(key);
    if (target.pathname.endsWith('/workspaces/' + id)) return route.fulfill({ headers, json: { workspace: { id } } });
    if (target.pathname.endsWith('/collections')) return route.fulfill({ headers, json: { collections: [] } });
    if (target.pathname.endsWith('/environments')) return route.fulfill({ headers, json: { environments: [] } });
    if (target.pathname.endsWith('/global-variables')) return route.fulfill({ headers, json: { values: [{ key: 'internal', value: 'mock-secret' }] } });
    await route.abort();
  });

  await page.goto('/#postman');
  await page.getByLabel('Workspace ID or Overview URL').fill(id);
  await page.getByLabel('Postman API key').fill(key);
  await page.getByRole('button', { name: 'Create backup' }).click();
  await expect(page.getByText('This ZIP can contain credentials', { exact: false })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download ZIP' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^torin-postman-.*\.zip$/);
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer);
  const files = unzipSync(Buffer.concat(chunks));
  expect(Object.keys(files).sort()).toEqual(['collections/', 'environments/', 'globals.json', 'manifest.json', 'workspace.json']);
  expect(JSON.parse(new TextDecoder().decode(files['globals.json'])).values[0].value).toBe('mock-secret');
  await expect(page.getByLabel('Postman API key')).toHaveValue('');
  const cache = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return Promise.all((await caches.keys()).map(async (name) => {
      const cache = await caches.open(name);
      return Promise.all((await cache.keys()).map(async (request) => ({
        url: request.url, key: request.headers.get('x-api-key'), body: await (await cache.match(request))?.text(),
      })));
    }));
  });
  expect(cache.flat().length).toBeGreaterThan(0);
  expect(JSON.stringify(cache.flat().map(({ url, key }) => ({ url, key })))).not.toContain('/api/postman');
  expect(JSON.stringify(cache)).not.toContain(key);
  expect(JSON.stringify(cache)).not.toContain('mock-secret');
  expect(hostRequests.join('\n')).not.toContain(key);
  expect(hostRequests.join('\n')).not.toContain(id);
  expect(hostRequests.join('\n')).not.toContain('mock-secret');
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test('backup announces API failure and exposes a retry with no ZIP', async ({ page, context }) => {
  await context.route('https://api.postman.com/**', async (route) => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    return route.fulfill({ status: 401, body: 'synthetic-error', headers });
  });
  await page.goto('/#postman');
  await page.getByLabel('Workspace ID or Overview URL').fill(id);
  await page.getByLabel('Postman API key').fill(key);
  await page.getByRole('button', { name: 'Create backup' }).click();
  await expect(page.getByRole('alert')).toHaveText('Postman rejected the API key.');
  await expect(page.getByRole('link', { name: 'Download ZIP' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try backup again' })).toBeEnabled();
});

test('opt-in history persists operation metadata only and can be cleared or disabled', async ({ page, context }) => {
  const sensitive = 'synthetic-private-text';
  const requests: string[] = [];
  context.on('request', (request) => requests.push(request.url() + (request.postData() ?? '')));
  const nav = page.getByRole('navigation');
  await page.goto('/#history');
  const toggle = page.getByRole('checkbox', { name: 'Save activity on this device' });
  await expect(toggle).not.toBeChecked();
  await toggle.check();

  await nav.getByRole('link', { name: 'Base64', exact: true }).click();
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill(sensitive);
  await page.getByRole('button', { name: 'Encode text' }).click();
  const output = await page.getByLabel('Output').inputValue();
  await nav.getByRole('link', { name: 'JWT Decoder' }).click();
  await page.getByLabel('Signed JWT').fill(jwt);
  await page.getByRole('button', { name: 'Decode JWT' }).click();
  await nav.getByRole('link', { name: 'History' }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Encoded text' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Decoded a JWT' })).toBeVisible();
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(Object.keys(storage.local)).toEqual(['torin.activity.v1']);
  expect(storage.session).toEqual({});
  expect(JSON.parse(storage.local['torin.activity.v1']).map((entry: object) => Object.keys(entry).sort()))
    .toEqual([['action', 'at', 'toolId'], ['action', 'at', 'toolId']]);
  for (const value of [sensitive, output, jwt]) {
    expect(JSON.stringify(storage)).not.toContain(value);
    expect(requests.join('\n')).not.toContain(value);
  }
  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByText('No activity yet.')).toBeVisible();
  await toggle.uncheck();
  await expect(page.getByText('Local history is off.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('staged Downloads point to packages matching the displayed checksums', async ({ page }) => {
  test.skip(process.env.TORIN_CHECK_DOWNLOADS !== '1', 'Run after staging actual desktop packages.');
  await page.goto('/#downloads');
  const links = page.locator('.downloads li a');
  await expect(links).not.toHaveCount(0);
  for (const link of await links.all()) {
    const href = await link.getAttribute('href');
    const checksum = (await link.locator('..').locator('code').innerText()).split(' ')[1];
    const response = await page.request.get(new URL(href!, page.url()).href);
    expect(response.ok()).toBe(true);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(checksum);
  }
});

test('update check only reads a public version manifest and compares versions locally', async ({ page, context }) => {
  const requests: { url: string; credentials: string | null; body: string | null }[] = [];
  await context.route('**/version.json', async (route) => {
    const request = route.request();
    requests.push({ url: request.url(), credentials: await request.headerValue('x-api-key'), body: request.postData() });
    await route.fulfill({ json: { version: '1.0.0' } });
  });
  await page.goto('/#downloads');
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByText('Version 1.0.0 is available.', { exact: false })).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0].url).search).toBe('');
  expect(requests[0].credentials).toBeNull();
  expect(requests[0].body).toBeNull();
});

test('the optional gateway requires an explicit connection choice', async ({ page, context }) => {
  let relayCalls = 0;
  await context.route('**/api/postman/**', async (route) => {
    if (route.request().url().endsWith('/status')) return route.fulfill({ json: { enabled: true } });
    relayCalls++;
    expect(route.request().headers()['x-api-key']).toBe(key);
    return route.fulfill({ status: 401, json: {} });
  });
  await page.goto('/#postman');
  const connection = page.getByRole('combobox', { name: 'Connection' });
  await expect(connection).toHaveValue('Direct to Postman');
  await connection.click();
  await page.getByRole('option', { name: 'Self-hosted gateway' }).click();
  await expect(page.getByText('Your API key passes through', { exact: false })).toBeVisible();
  expect(relayCalls).toBe(0);
  await page.getByLabel('Workspace ID or Overview URL').fill(id);
  await page.getByLabel('Postman API key').fill(key);
  await page.getByRole('button', { name: 'Create backup' }).click();
  await expect(page.getByRole('alert')).toHaveText('Postman rejected the API key.');
  expect(relayCalls).toBe(1);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('language switch persists only after an explicit choice and About hides empty support links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'All tools' })).toBeVisible();
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  await page.getByRole('button', { name: 'VI', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tất cả công cụ' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['torin.locale.v1']);
  expect(await page.evaluate(() => localStorage.getItem('torin.locale.v1'))).toBe('vi');
  await page.getByRole('link', { name: 'Giới thiệu' }).click();
  await expect(page.getByRole('heading', { name: 'Giới thiệu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mạng xã hội' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ủng hộ dự án' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Giấy phép' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Social' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Support the project' })).toHaveCount(0);
});

test('quick search jumps to a tool from the header', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Quick search tools' });
  await search.fill('jwt');
  await expect(page.getByRole('option', { name: /JWT Decoder/ })).toBeVisible();
  await page.getByRole('option', { name: /JWT Decoder/ }).click();
  await expect(page).toHaveURL(/#jwt$/);
  await expect(page.getByRole('heading', { name: 'JWT Decoder' })).toBeVisible();
});
