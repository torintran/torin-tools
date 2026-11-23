import { createBackup } from './backup.ts';
import { BackupError, webTransport, type Transport } from './transport.ts';

type Result = Awaited<ReturnType<Transport>>;
type Start = { kind: 'start'; workspace: string } & (
  { mode: 'direct' | 'gateway'; apiKey: string } | { mode: 'desktop' }
);
type Reply = { kind: 'reply'; id: number; result?: Result; error?: string };

let nextId = 0;
const pending = new Map<number, (message: Reply) => void>();
const desktopTransport: Transport = (route) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, ({ result, error }) => {
    if (result) resolve(result);
    else reject(new BackupError(error ?? 'Postman desktop request failed.'));
  });
  self.postMessage({ kind: 'request', id, route });
});

self.onmessage = async ({ data }: MessageEvent<Start | Reply>) => {
  if (data.kind === 'reply') {
    pending.get(data.id)?.(data);
    pending.delete(data.id);
    return;
  }
  const transport = data.mode === 'desktop' ? desktopTransport : webTransport(data.apiKey, data.mode);
  try {
    const zip = await createBackup(data.workspace, transport, new AbortController().signal, (progress) => {
      self.postMessage({ kind: 'progress', progress });
    });
    self.postMessage({ kind: 'complete', buffer: zip.buffer }, { transfer: [zip.buffer as ArrayBuffer] });
  } catch (error) {
    self.postMessage({ kind: 'failed', error: error instanceof BackupError ? error.message : 'The backup could not be created.' });
  }
};
