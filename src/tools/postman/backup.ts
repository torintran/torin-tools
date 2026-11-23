import { strToU8, zipSync } from 'fflate';
import { MAX_OFFSET, PAGE_SIZE, parseWorkspace, validResourceId } from './routes.ts';
import { BackupError, statusError, type Transport } from './transport.ts';

type Group = 'Collections' | 'Environments' | 'Globals' | 'Workspace';
type JsonObject = Record<string, unknown>;
export type Progress = { group: Group | 'ZIP'; done: number; total: number; failed: number };
export const MAX_BACKUP_BYTES = 64 * 1024 * 1024;

export class PartialBackupError extends BackupError {
  constructor(readonly failed: number, firstError: string) {
    super(failed + ' item(s) failed. ' + firstError + ' Try the backup again.');
  }
}

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BackupError('Postman returned an unexpected data format.');
  }
  return value as JsonObject;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new BackupError('Postman returned an unexpected list format.');
  return value;
}

function delay(ms: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

export async function createBackup(
  input: string,
  transport: Transport,
  signal: AbortSignal,
  report: (progress: Progress) => void = () => {},
) {
  const workspace = parseWorkspace(input);
  let retryAt = 0;
  async function request(route: string): Promise<JsonObject> {
    for (let attempt = 0; ; attempt++) {
      signal.throwIfAborted();
      if (retryAt === Infinity) throw statusError(429);
      while (retryAt > Date.now()) {
        if (retryAt === Infinity) throw statusError(429);
        await delay(retryAt - Date.now(), signal);
      }
      const response = await transport(route, signal);
      signal.throwIfAborted();
      if (response.status >= 200 && response.status < 300) return object(response.data);
      if (response.status !== 429 || attempt === 2) throw statusError(response.status);
      const header = response.retryAfter?.trim();
      const interval = header && /^\d+$/.test(header) ? Number(header) * 1000
        : header ? Date.parse(header) - Date.now() : NaN;
      const pause = Number.isFinite(interval) ? Math.max(0, interval) : 1000 * (2 ** attempt);
      if (pause > 60_000) {
        retryAt = Infinity;
        throw statusError(429);
      }
      retryAt = Math.max(retryAt, Date.now() + pause);
    }
  }

  // Read workspace first: the collection list can return an empty result for invalid IDs.
  const entries: Record<string, Uint8Array> = {
    'collections/': new Uint8Array(),
    'environments/': new Uint8Array(),
  };
  let uncompressed = 0;
  function add(path: string, value: unknown) {
    if (Object.hasOwn(entries, path)) throw new BackupError('Postman returned duplicate resource IDs.');
    const bytes = strToU8(JSON.stringify(value, null, 2));
    uncompressed += bytes.byteLength;
    if (uncompressed > MAX_BACKUP_BYTES) throw new BackupError('Backup exceeds the 64 MiB uncompressed limit.');
    entries[path] = bytes;
  }
  report({ group: 'Workspace', done: 0, total: 1, failed: 0 });
  const metadata = object((await request('/workspaces/' + workspace)).workspace);
  if (metadata.id !== workspace) throw new BackupError('Postman returned a different workspace ID.');
  add('workspace.json', metadata);
  report({ group: 'Workspace', done: 1, total: 1, failed: 0 });

  const collections: unknown[] = [];
  report({ group: 'Collections', done: 0, total: 0, failed: 0 });
  let expectedTotal: number | undefined;
  for (let offset = 0; ;) {
    if (offset > MAX_OFFSET) throw new BackupError('Workspace exceeds the supported collection count.');
    const response = await request('/collections?workspace=' + workspace + '&limit=' + PAGE_SIZE + '&offset=' + offset);
    const page = list(response.collections);
    const meta = response.meta === undefined ? {} : object(response.meta);
    const limit = meta.limit ?? PAGE_SIZE;
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > PAGE_SIZE ||
        page.length > limit || (meta.offset !== undefined && meta.offset !== offset)) {
      throw new BackupError('Postman returned unexpected collection pagination.');
    }
    collections.push(...page);
    if (meta.total !== undefined) {
      const total = meta.total;
      if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < collections.length ||
          (expectedTotal !== undefined && total !== expectedTotal)) {
        throw new BackupError('The collection list changed during backup. Try again.');
      }
      expectedTotal = total;
    }
    if (expectedTotal !== undefined) {
      if (collections.length === expectedTotal) break;
      if (!page.length) throw new BackupError('Postman returned an incomplete collection list.');
    } else if (page.length < limit) {
      break;
    }
    offset += page.length;
  }
  report({ group: 'Environments', done: 0, total: 0, failed: 0 });
  const environments = list((await request('/environments?workspace=' + workspace)).environments);

  let failed = 0;
  let firstError = '';
  function record(error: unknown) {
    signal.throwIfAborted();
    failed++;
    if (!firstError) firstError = error instanceof BackupError ? error.message : 'Could not read a backup item.';
  }

  async function details(group: 'Collections' | 'Environments', items: unknown[]) {
    const directory = group.toLowerCase();
    const singular = directory.slice(0, -1);
    let index = 0;
    let done = 0;
    report({ group, done, total: items.length, failed });
    async function consume() {
      while (index < items.length) {
        signal.throwIfAborted();
        const item = items[index++];
        try {
          const { uid, id } = object(item);
          const resource = uid ?? id;
          if (!validResourceId(resource) || !validResourceId(id)) throw new BackupError('Postman returned an invalid resource ID.');
          const result = object((await request('/' + directory + '/' + resource))[singular]);
          if (group === 'Collections') {
            const info = object(result.info);
            if (typeof info.name !== 'string' || typeof info.schema !== 'string') {
              throw new BackupError('Collection details lack import metadata.');
            }
            list(result.item);
          } else {
            if (typeof result.name !== 'string') throw new BackupError('Environment details lack a name.');
            list(result.values);
          }
          add(directory + '/' + id.toLowerCase() + '.json', result);
        } catch (error) {
          record(error);
        }
        report({ group, done: ++done, total: items.length, failed });
      }
    }
    await Promise.all(Array.from({ length: Math.min(items.length, 4) }, consume));
  }

  await details('Collections', collections);
  await details('Environments', environments);
  report({ group: 'Globals', done: 0, total: 1, failed });
  let globalCount = 0;
  try {
    const globals = await request('/workspaces/' + workspace + '/global-variables');
    globalCount = list(globals.values).length;
    add('globals.json', globals);
  } catch (error) {
    record(error);
  }
  report({ group: 'Globals', done: 1, total: 1, failed });
  signal.throwIfAborted();
  if (failed) throw new PartialBackupError(failed, firstError);
  add('manifest.json', {
    formatVersion: 1, exportedAt: new Date().toISOString(), workspaceId: workspace,
    counts: { collections: collections.length, environments: environments.length, globals: globalCount, workspaces: 1 },
    status: 'complete',
  });
  report({ group: 'ZIP', done: 0, total: 1, failed });
  const zip = zipSync(entries, { level: 3 });
  report({ group: 'ZIP', done: 1, total: 1, failed });
  return zip;
}
