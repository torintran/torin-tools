import { createServer } from 'node:http';
import { chromium } from 'playwright';

const id = '00000000-0000-4000-8000-000000000000';
const endpoints = [
  '/workspaces/' + id,
  '/collections?workspace=' + id + '&limit=1&offset=0',
  '/collections/' + id,
  '/environments?workspace=' + id,
  '/environments/' + id,
  '/workspaces/' + id + '/global-variables',
];
const site = createServer((_request, response) => response.writeHead(200, { 'Content-Type': 'text/html' }).end('<title>Torin CORS probe</title>'));
await new Promise((resolve) => site.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = new Map();
  const reasons = new Map();
  cdp.on('Network.requestWillBeSent', ({ request, requestId }) => requests.set(requestId, request.url));
  cdp.on('Network.loadingFailed', ({ requestId, errorText, corsErrorStatus }) => {
    const url = requests.get(requestId);
    if (url && corsErrorStatus) reasons.set(url, corsErrorStatus.corsError);
    if (url && !reasons.has(url)) reasons.set(url, errorText);
  });
  await page.goto('http://127.0.0.1:' + site.address().port);
  const results = await page.evaluate(async (paths) => Promise.all(paths.map(async (path) => {
    const url = 'https://api.postman.com' + path;
    try {
      const response = await fetch(url, {
        headers: { 'X-Api-Key': 'not-a-real-key-torin-cors-probe' },
        credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000),
      });
      return { url, status: response.status, retryAfterReadable: response.headers.has('Retry-After') };
    } catch (error) {
      return { url, error: error.name };
    }
  })), endpoints);
  console.log(JSON.stringify(results.map((result) => ({ ...result, browserReason: reasons.get(result.url) })), null, 2));
} finally {
  await browser?.close();
  site.close();
}
