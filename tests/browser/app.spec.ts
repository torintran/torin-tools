import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';

const id = '12345678-1234-1234-1234-123456789abc';
const key = 'synthetic-browser-key';
const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzeW50aGV0aWMtdG9rZW4ifQ.YQ';

async function mockClipboard(page: Page) {
  await page.addInitScript(() => {
    let text = '';
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async (value: string) => { text = value; },
      readText: async () => text,
    } });
  });
}

async function openMobileMenu(page: Page) {
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) await menu.click();
}

async function openToolFromNavigation(page: Page, group: string, tool: string) {
  await openMobileMenu(page);
  const nav = page.getByRole('navigation');
  await expect(nav).toBeVisible();
  const link = nav.getByRole('link', { name: tool, exact: true });
  if (!await link.isVisible()) await nav.getByText(group, { exact: true }).click();
  await link.click();
}

test('local tools work offline, with balanced viewport and no stored token', async ({ page, context }) => {
  await page.goto('/');
  const catalog = page.getByRole('main');
  await expect(catalog.getByRole('heading', { name: 'All tools' })).toBeVisible();
  const search = catalog.getByRole('searchbox', { name: 'Find a tool' });
  await expect(page.getByRole('combobox', { name: 'Quick search' })).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await expect(search).toBeFocused();
  await search.fill('UTF-8');
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
  await openToolFromNavigation(page, 'Tokens', 'JWT Decoder');
  await page.getByLabel('Signed JWT').fill(jwt);
  await page.getByRole('button', { name: 'Decode JWT' }).click();
  await expect(page.getByText('"sub": "synthetic-token"', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Fields' }).click();
  await expect(page.getByText('Subject', { exact: true })).toBeVisible();
  await expect(page.getByText('HMAC with SHA-256')).toBeVisible();
  await openToolFromNavigation(page, 'Encoding', 'Base64');
  await openToolFromNavigation(page, 'Tokens', 'JWT Decoder');
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
  await mockClipboard(page);
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
  const preview = page.getByRole('textbox', { name: 'Text preview' });
  await expect(preview).toHaveValue(bytes.toString('base64'));
  const copy = page.getByRole('button', { name: 'Copy output' });
  await copy.click();
  await expect(page.getByText('Copied to clipboard.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(bytes.toString('base64'));
  const encodedDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download result' }).click();
  const encoded = [];
  for await (const chunk of await (await encodedDownload).createReadStream()) encoded.push(chunk as Buffer);
  const encodedBytes = Buffer.concat(encoded);
  expect(encodedBytes.toString()).toBe(bytes.toString('base64'));

  await page.getByRole('button', { name: 'Decode', exact: true }).click();
  const dropArea = page.locator('.file-drop');
  const dataTransfer = await page.evaluateHandle((contents) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([contents], 'example.base64', { type: 'text/plain' }));
    transfer.items.add(new File([contents], 'extra.base64', { type: 'text/plain' }));
    return transfer;
  }, encodedBytes.toString());
  await dropArea.dispatchEvent('dragover', { dataTransfer });
  await expect(dropArea).toHaveAttribute('data-dragging', 'true');
  await dropArea.dispatchEvent('drop', { dataTransfer });
  await expect(page.getByText('Drop one file at a time.')).toBeVisible();
  await expect(dropArea).not.toHaveAttribute('data-dragging', 'true');
  await dataTransfer.evaluate((transfer) => transfer.items.remove(1));
  await dropArea.dispatchEvent('drop', { dataTransfer });
  await dataTransfer.dispose();
  await expect(file).toHaveValue('');
  await expect(page.getByRole('button', { name: 'File to convert' })).toHaveText('example.base64');
  await expect(page.getByText('Drop one file at a time.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Decode file' }).click();
  await expect(page.getByRole('link', { name: 'Download result' })).toBeVisible();
  await expect(preview).toHaveCount(0);
  await expect(copy).toHaveCount(0);
  const decodedDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download result' }).click();
  const decoded = [];
  for await (const chunk of await (await decodedDownload).createReadStream()) decoded.push(chunk as Buffer);
  expect(Buffer.concat(decoded)).toEqual(bytes);

  await file.setInputFiles({ name: 'text.base64', mimeType: 'text/plain', buffer: Buffer.from(Buffer.from('Tiếng Việt').toString('base64')) });
  await page.getByRole('button', { name: 'Decode file' }).click();
  await expect(preview).toHaveValue('Tiếng Việt');
  await expect(page.getByRole('link', { name: 'Download result' })).toBeVisible();

  await page.getByRole('button', { name: 'Encode', exact: true }).click();
  await file.setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.alloc(64 * 1024, 'a') });
  await page.getByRole('button', { name: 'Encode file' }).click();
  await expect(page.getByRole('link', { name: 'Download result' })).toHaveAttribute('download', 'large.txt.base64');
  await expect(preview).toHaveCount(0);
});

test('CSR PEM can be copied and downloaded alongside the private key', async ({ page }) => {
  await mockClipboard(page);
  await page.goto('/#csr');
  await page.getByRole('textbox', { name: 'Common name (DNS)' }).fill('tools.example.com');
  await page.getByRole('button', { name: 'Generate CSR' }).click();
  const preview = page.getByRole('textbox', { name: 'Certificate signing request (PEM)' });
  await expect(preview).toHaveValue(/-----BEGIN CERTIFICATE REQUEST-----/);
  await page.getByRole('button', { name: 'Copy CSR' }).click();
  await expect(page.getByText('Copied to clipboard.')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied.replace(/\r\n/g, '\n')).toBe(await preview.inputValue());
  await expect(page.getByRole('link', { name: 'Download CSR' })).toHaveAttribute('download', 'request.csr');
  await expect(page.getByRole('link', { name: 'Download private key' })).toHaveAttribute('download', 'private-key.pem');
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

test('tool input stays out of storage and network after encode and decode', async ({ page, context }) => {
  const sensitive = 'synthetic-private-text';
  const requests: string[] = [];
  context.on('request', (request) => requests.push(request.url() + (request.postData() ?? '')));
  await page.goto('/#base64');
  await page.getByRole('textbox', { name: 'Input', exact: true }).fill(sensitive);
  await page.getByRole('button', { name: 'Encode text' }).click();
  const output = await page.getByLabel('Output').inputValue();
  await page.goto('/#jwt');
  await page.getByLabel('Signed JWT').fill(jwt);
  await page.getByRole('button', { name: 'Decode JWT' }).click();
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storage.session).toEqual({});
  expect(storage.local['torin.activity.v1']).toBeUndefined();
  for (const value of [sensitive, output, jwt]) {
    expect(JSON.stringify(storage)).not.toContain(value);
    expect(requests.join('\n')).not.toContain(value);
  }
});

test('staged Downloads point to packages matching the displayed checksums', async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_CHECK_DOWNLOADS !== '1', 'Run after staging actual desktop packages.');
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

test('update check only reads the public GitHub release and compares versions locally', async ({ page, context }) => {
  let releaseTag = 'v1.0.0';
  const requests: { url: string; credentials: string | null; body: string | null }[] = [];
  await context.route('https://api.github.com/repos/torintran/torin-tools/releases/latest', async (route) => {
    const request = route.request();
    requests.push({ url: request.url(), credentials: await request.headerValue('x-api-key'), body: request.postData() });
    await route.fulfill({ json: { tag_name: releaseTag } });
  });
  await page.goto('/#downloads');
  await expect(page.getByRole('link', { name: 'Download installer on GitHub' }))
    .toHaveAttribute('href', 'https://github.com/torintran/torin-tools/releases/latest');
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByText('Version 1.0.0 is available.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download v1.0.0' }))
    .toHaveAttribute('href', 'https://github.com/torintran/torin-tools/releases/tag/v1.0.0');
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0].url).search).toBe('');
  expect(requests[0].credentials).toBeNull();
  expect(requests[0].body).toBeNull();
  releaseTag = 'v0.0.0';
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByRole('link', { name: /^Download v/ })).toHaveCount(0);
  await expect(page.getByText('This version is up to date.')).toBeVisible();
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
  await openMobileMenu(page);
  await page.getByRole('link', { name: 'Giới thiệu' }).click();
  await expect(page.getByRole('heading', { name: 'Giới thiệu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mạng xã hội' })).toBeVisible();
  await expect(page.locator('[aria-labelledby="about-social"]').getByRole('link', { name: 'GitHub' }))
    .toHaveAttribute('href', 'https://github.com/torintran/torin-tools');
  await expect(page.getByRole('heading', { name: 'Ủng hộ dự án' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Giấy phép' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Social' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Support the project' })).toHaveCount(0);
});

test('quick search jumps to a tool from the header or mobile menu', async ({ page }) => {
  await page.goto('/#downloads');
  await openMobileMenu(page);
  const search = page.getByRole('combobox', { name: 'Quick search' });
  await search.fill('jwt');
  await expect(page.getByRole('option', { name: /JWT Decoder/ })).toBeVisible();
  await page.getByRole('option', { name: /JWT Decoder/ }).click();
  await expect(page).toHaveURL(/#jwt$/);
  await expect(page.getByRole('heading', { name: 'JWT Decoder' })).toBeVisible();
});

test('cheat sheets support offline navigation, quick search, references and copying', async ({ page, context }) => {
  await mockClipboard(page);
  await page.goto('/');
  await openMobileMenu(page);
  await page.getByRole('link', { name: 'Cheat Sheets', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cheat Sheets' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  const sheetNav = page.getByRole('navigation', { name: 'Cheat Sheets' });
  const build = page.getByRole('listitem').filter({ hasText: 'docker build -t my-app:1.0.0 .' });
  await build.locator('.cheat-code').getByRole('button', { name: 'Copy' }).click();
  await expect(build.getByText('Copied to clipboard.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('docker build -t my-app:1.0.0 .');
  await expect(build.getByRole('link', { name: 'Reference' })).toHaveAttribute('href', /docs\.docker\.com.*image\/build/);

  await sheetNav.getByRole('link', { name: 'Git & GitHub' }).click();
  await expect(page).toHaveURL(/#cheat-sheets\/git-github$/);
  await expect(page.getByText('gh pr checks 123', { exact: true })).toBeVisible();

  await openMobileMenu(page);
  await page.getByRole('combobox', { name: 'Quick search' }).fill('kubectl rollout');
  await page.getByRole('option', { name: /Kubernetes/ }).click();
  await expect(page).toHaveURL(/#cheat-sheets\/kubernetes$/);
  await expect(page.getByText('sudo k3s kubectl -n apps get pods', { exact: true })).toBeVisible();
  const longCommand = page.locator('.cheat-code').filter({ hasText: 'kubectl -n apps set image' });
  const [code, copy] = await Promise.all([
    longCommand.locator('pre').boundingBox(),
    longCommand.getByRole('button', { name: 'Copy' }).boundingBox(),
  ]);
  const viewport = page.viewportSize();
  if (!code || !copy || !viewport) throw new Error('Missing command, copy button, or viewport bounds');
  expect(code.x + code.width).toBeLessThan(copy.x);
  expect(copy.x + copy.width).toBeLessThanOrEqual(viewport.width);
  await page.getByRole('button', { name: 'VI', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Triển khai và xác minh' })).toBeVisible();
});
