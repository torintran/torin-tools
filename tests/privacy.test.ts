import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createStaticServer } from '../server/static.ts';
import { HISTORY_KEY, HISTORY_LIMIT, readHistory, recordActivity } from '../src/app/history-store.ts';

test('history is opt-in, stores only registered actions and caps the number of records', () => {
  const items = new Map<string, string>();
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
  };
  const known = (tool: string, action: string) => tool === 'base64' && action === 'encode';

  assert.equal(recordActivity(storage, known, 'base64', 'encode'), null);
  assert.equal(items.size, 0);
  storage.setItem(HISTORY_KEY, JSON.stringify([{ toolId: 'base64', action: 'encode', at: 1, value: 'mock-data' }]));
  assert.deepEqual(readHistory(storage, known), [{ toolId: 'base64', action: 'encode', at: 1 }]);
  recordActivity(storage, known, 'base64', 'synthetic-user-credential');
  for (let i = 0; i <= HISTORY_LIMIT; i++) recordActivity(storage, known, 'base64', 'encode');
  assert.equal(readHistory(storage, known)?.length, HISTORY_LIMIT);
  assert.doesNotMatch(items.get(HISTORY_KEY)!, /mock-data|synthetic-user-credential/);
  assert.deepEqual(Object.keys(JSON.parse(items.get(HISTORY_KEY)!)[0]).sort(), ['action', 'at', 'toolId']);
  items.delete(HISTORY_KEY);
  assert.equal(readHistory(storage, known), null);
});

test('Torin serves static files and rejects old backup endpoints, uploads and credential headers', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'torin-static-'));
  await writeFile(join(directory, 'index.html'), '<title>Torin Tools</title>');
  await writeFile(join(directory, 'internal.json'), '{"mock":true}');
  await writeFile(join(directory, 'version.json'), '{"version":"0.2.0"}');
  const server = createStaticServer(directory);
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((done) => server.close(() => done()));
    await rm(directory, { recursive: true, force: true });
  });

  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy')!, /form-action 'none'/);
  assert.equal(home.headers.get('set-cookie'), null);
  assert.equal((await fetch(base + '/api/postman/status')).status, 404);
  assert.equal((await fetch(base + '/internal.json')).status, 404);
  const latest = await fetch(base + '/version.json');
  assert.deepEqual(await latest.json(), { version: '0.2.0' });
  assert.equal(latest.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(base + '/?mock=secret')).status, 404);
  const posted = await fetch(base, { method: 'POST', body: 'synthetic-body' });
  assert.equal(posted.status, 405);
  assert.equal(await posted.text(), '');
  assert.equal((await fetch(base, { headers: { 'X-Api-Key': 'synthetic-credential' } })).status, 400);
});

test('explicit Postman relay only forwards approved routes and required headers', async (t) => {
  const origin = 'https://torin.test';
  const requests: { url: string; headers: Headers; redirect?: RequestRedirect }[] = [];
  const server = createStaticServer(undefined, {
    origin,
    upstreamFetch: async (input, options) => {
      requests.push({ url: String(input), headers: new Headers(options?.headers), redirect: options?.redirect });
      return Response.json({ workspace: { name: 'Mock' } }, { headers: { 'Set-Cookie': 'synthetic-cookie=test' } });
    },
  });
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/postman';
  const id = '12345678-1234-1234-1234-123456789abc';
  const headers = { 'X-Api-Key': 'synthetic-key', Cookie: 'mock=secret', Origin: origin };
  assert.deepEqual(await (await fetch(base + '/status')).json(), { enabled: true });
  assert.equal((await fetch(base + '/workspaces/' + id, { headers: { ...headers, Origin: 'https://unrelated.test' } })).status, 403);
  assert.equal((await fetch(base + '/workspaces/' + id + '?target=invalid', { headers })).status, 404);
  const result = await fetch(base + '/workspaces/' + id, { headers });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('set-cookie'), null);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.postman.com/workspaces/' + id);
  assert.equal(requests[0].headers.get('x-api-key'), 'synthetic-key');
  assert.equal(requests[0].headers.get('cookie'), null);
  assert.equal(requests[0].redirect, 'error');
});
