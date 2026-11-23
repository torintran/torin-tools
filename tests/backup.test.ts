import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unzipSync } from 'fflate';
import { createBackup, PartialBackupError } from '../src/tools/postman/backup.ts';
import { parseWorkspace, upstreamRoute } from '../src/tools/postman/routes.ts';
import type { Transport } from '../src/tools/postman/transport.ts';

const workspace = '12345678-1234-1234-1234-123456789abc';
const id = (i: number) => '10000000-1000-1000-1000-' + String(i).padStart(12, '0');
const ok = (data: unknown) => ({ status: 200, retryAfter: null, data });

test('workspace parser accepts trusted overview URLs and routes preserve a fixed upstream', () => {
  assert.equal(parseWorkspace('https://www.postman.com/team/workspace/name~' + workspace + '/overview'), workspace);
  assert.throws(() => parseWorkspace('https://evil.test/workspace/' + workspace));
  assert.throws(() => parseWorkspace('https://www.postman.com/request?workspace=' + workspace));
  for (const route of ['//evil.test', '/workspaces/' + workspace + '?url=x', '/environments/' + id(1) + '/..', '/collections?workspace=' + workspace + '&limit=0&offset=0']) {
    assert.equal(upstreamRoute(route), undefined);
  }
});

test('paginates collections, retries 429 and exports importable objects', async () => {
  let retries = 0;
  const offsets: string[] = [];
  const transport: Transport = async (route) => {
    const url = new URL(route, 'https://api.postman.com');
    if (url.pathname === '/collections') {
      const offset = url.searchParams.get('offset')!;
      offsets.push(offset);
      return ok({
        meta: { offset: Number(offset), limit: 60, total: 101 },
        collections: Array.from({ length: offset === '0' ? 60 : 41 }, (_, index) => {
          const resource = id(Number(offset) + index);
          return { id: resource, uid: '123-' + resource };
        }),
      });
    }
    if (route.startsWith('/collections/')) {
      if (route.endsWith(id(0)) && retries++ === 0) return { status: 429, retryAfter: '0' };
      return ok({ collection: { info: { name: 'Mock', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, item: [{ name: 'full' }] } });
    }
    if (route.startsWith('/environments?')) return ok({ environments: [{ id: id(200) }] });
    if (route.startsWith('/environments/')) return ok({ environment: { name: 'Mock', values: [{ key: 'mock', value: '🔐' }] } });
    if (route.endsWith('/global-variables')) return ok({ values: [] });
    return ok({ workspace: { id: workspace, name: 'Mock' } });
  };
  const zip = unzipSync(await createBackup(workspace, transport, new AbortController().signal));
  const read = (file: string) => JSON.parse(new TextDecoder().decode(zip[file]));
  assert.deepEqual(offsets, ['0', '60']);
  assert.equal(retries, 2);
  assert.equal(Object.keys(zip).length, 107);
  assert.equal(read('manifest.json').status, 'complete');
  assert.equal(read('manifest.json').counts.collections, 101);
  assert.equal(read('collections/' + id(0) + '.json').item[0].name, 'full');
  assert.equal(read('environments/' + id(200) + '.json').values[0].value, '🔐');
  assert.deepEqual(read('globals.json'), { values: [] });
  assert.equal(read('workspace.json').id, workspace);
});

test('partial failure returns a failed item count and never returns a ZIP', async () => {
  const transport: Transport = async (route) => {
    if (route.startsWith('/collections?')) return ok({ collections: [{ id: id(1) }] });
    if (route.startsWith('/collections/')) return { status: 403, retryAfter: null };
    if (route.startsWith('/environments?')) return ok({ environments: [] });
    if (route.endsWith('/global-variables')) return ok({ values: [] });
    return ok({ workspace: { id: workspace } });
  };
  await assert.rejects(createBackup(workspace, transport, new AbortController().signal), (error) =>
    error instanceof PartialBackupError && error.failed === 1 && /denied/i.test(error.message));
});

test('cancel while waiting for Retry-After interrupts the job', async () => {
  const controller = new AbortController();
  const transport: Transport = async () => {
    setTimeout(() => controller.abort(), 5);
    return { status: 429, retryAfter: '10' };
  };
  await assert.rejects(createBackup(workspace, transport, controller.signal), { name: 'AbortError' });
});

test('detail requests have a concurrency limit and rate-limit retries are bounded', async () => {
  let active = 0;
  let peak = 0;
  let rateLimitedCalls = 0;
  const transport: Transport = async (route) => {
    if (route.startsWith('/collections?')) {
      return ok({ collections: Array.from({ length: 10 }, (_, index) => ({ id: id(index) })) });
    }
    if (route.startsWith('/collections/')) {
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => setTimeout(resolve, 4));
      active--;
      if (route.endsWith(id(0))) {
        rateLimitedCalls++;
        return { status: 429, retryAfter: '0' };
      }
      return ok({ collection: { info: { name: 'Mock', schema: 'test' }, item: [] } });
    }
    if (route.startsWith('/environments?')) return ok({ environments: [] });
    if (route.endsWith('/global-variables')) return ok({ values: [] });
    return ok({ workspace: { id: workspace } });
  };
  await assert.rejects(createBackup(workspace, transport, new AbortController().signal), { failed: 1 });
  assert.equal(peak, 4);
  assert.equal(rateLimitedCalls, 3);
});
