import { Alert, Button, Loader, Paper, Progress as ProgressBar, Select, TextInput } from '@mantine/core';
import { TriangleAlert } from 'lucide-react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { useEffect, useRef, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { Progress } from './backup.ts';
import { GATEWAY_PREFIX, parseWorkspace, validApiKey } from './routes.ts';
import BackupWorker from './worker.ts?worker';

type WorkerUpdate = { kind: 'progress'; progress: Progress } |
  { kind: 'complete'; buffer: ArrayBuffer } | { kind: 'failed'; error: string } |
  { kind: 'request'; id: number; route: string };

export default function Postman({ recordActivity }: ToolViewProps) {
  const t = useT();
  const desktop = isTauri();
  const [workspace, setWorkspace] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<'direct' | 'gateway'>('direct');
  const [gateway, setGateway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [archive, setArchive] = useState<{ buffer: ArrayBuffer; url: string; name: string }>();
  const active = useRef<{ worker: Worker; job: string } | null>(null);

  useEffect(() => {
    if (desktop) return;
    const controller = new AbortController();
    fetch(GATEWAY_PREFIX + '/status', {
      credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
    }).then(async (response) => {
      if (response.ok && !controller.signal.aborted) {
        const { enabled } = await response.json();
        if (!controller.signal.aborted) setGateway(enabled === true);
      }
    }).catch(() => {});
    return () => controller.abort();
  }, [desktop]);

  useEffect(() => () => {
    if (archive?.url) URL.revokeObjectURL(archive.url);
  }, [archive]);

  useEffect(() => () => {
    const job = active.current;
    active.current = null;
    job?.worker.terminate();
    if (desktop && job) void invoke('cancel_backup', { job: job.job }).catch(() => {});
  }, [desktop]);

  function finish() {
    const job = active.current;
    active.current = null;
    job?.worker.terminate();
    if (desktop && job) void invoke('cancel_backup', { job: job.job }).catch(() => {});
    setBusy(false);
  }

  function cancel() {
    finish();
    setStatus(t('postman.cancelled'));
  }

  async function start(event: React.FormEvent) {
    event.preventDefault();
    if (active.current) return;
    setError('');
    setStatus('');
    setProgress([]);
    setArchive(undefined);
    const key = apiKey.trim();
    let id: string;
    try {
      id = parseWorkspace(workspace);
      if (!validApiKey(key)) throw new Error(t('postman.invalidKey'));
    } catch (failure) {
      setError((failure as Error).message);
      return;
    }
    let worker: Worker;
    try { worker = new BackupWorker(); }
    catch { setError(t('postman.workerStart')); return; }
    const job = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    active.current = { worker, job };
    setBusy(true);
    setApiKey('');
    worker.onmessage = async ({ data }: MessageEvent<WorkerUpdate>) => {
      if (active.current?.worker !== worker) return;
      if (data.kind === 'request' && desktop) {
        try {
          const result = await invoke('postman_get', { job, route: data.route, apiKey: key });
          if (active.current?.worker === worker) worker.postMessage({ kind: 'reply', id: data.id, result });
        } catch (failure) {
          if (active.current?.worker === worker) worker.postMessage({
            kind: 'reply', id: data.id, error: typeof failure === 'string' ? failure : t('postman.desktopFail'),
          });
        }
      } else if (data.kind === 'progress') {
        const update = data.progress;
        setProgress((current) => [...current.filter(({ group }) => group !== update.group), update]);
      } else if (data.kind === 'complete') {
        finish();
        const name = 'torin-postman-' + id + '-' + new Date().toISOString().slice(0, 10) + '.zip';
        const url = desktop ? '' : URL.createObjectURL(new Blob([data.buffer], { type: 'application/zip' }));
        setArchive({ buffer: data.buffer, name, url });
        recordActivity('backup');
        setStatus('');
      } else if (data.kind === 'failed') {
        finish();
        setError(data.error);
      }
    };
    worker.onerror = () => {
      cancel();
      setStatus('');
      setError(t('postman.workerStop'));
    };
    if (desktop) {
      try {
        await invoke('begin_backup', { job });
        if (active.current?.worker !== worker) {
          void invoke('cancel_backup', { job }).catch(() => {});
          return;
        }
      } catch {
        if (active.current?.worker === worker) {
          finish();
          setError(t('postman.desktopStart'));
        }
        return;
      }
    }
    worker.postMessage(desktop
      ? { kind: 'start', mode: 'desktop', workspace: id }
      : { kind: 'start', mode, workspace: id, apiKey: key });
  }

  async function saveDesktop() {
    if (!archive || saving) return;
    setSaving(true);
    setStatus('');
    setError('');
    try {
      const saved = await invoke<boolean>('save_zip', archive.buffer, {
        headers: { 'X-Torin-Filename': archive.name },
      });
      setStatus(saved ? t('postman.saved') : t('postman.saveCancelled'));
    } catch {
      setError(t('postman.saveFail'));
    } finally { setSaving(false); }
  }

  return <Paper component="section" className="panel">
    <form onSubmit={start} autoComplete="off">
      <div className="fields">
        <TextInput label={t('postman.workspace')} required value={workspace} disabled={busy || saving}
          spellCheck={false} autoCapitalize="off" autoCorrect="off" maxLength={2048}
          onChange={(event) => setWorkspace(event.target.value)} placeholder={t('postman.workspacePlaceholder')} />
        <TextInput label={t('postman.apiKey')} autoComplete="off" type="password" required value={apiKey} disabled={busy || saving}
          maxLength={256} onChange={(event) => setApiKey(event.target.value)} placeholder={t('postman.apiKeyPlaceholder')} />
        {!desktop && <Select label={t('postman.connection')} value={mode} disabled={busy || saving}
          data={[
            { value: 'direct', label: t('postman.direct') },
            { value: 'gateway', label: t('postman.gateway'), disabled: !gateway },
          ]}
          onChange={(value) => setMode(value === 'gateway' && gateway ? 'gateway' : 'direct')} />}
      </div>
      {mode === 'gateway' && <p className="hint">{t('postman.gatewayHint')}</p>}
      <div className="actions">
        <Button type="submit" variant="filled" disabled={busy || saving}>
          {error && !archive ? t('postman.retry') : t('postman.create')}
        </Button>
        {busy && <Button type="button" onClick={cancel}>{t('common.cancel')}</Button>}
      </div>
    </form>
    {progress.length > 0 && <ul className="progress" aria-label={t('postman.progress')}>{progress.map((item) => <li key={item.group}>
      <span>{item.group}</span>
      {item.total || !busy
        ? <ProgressBar aria-label={item.group} value={item.total ? Math.round(100 * item.done / item.total) : 0} />
        : <Loader size="xs" type="dots" role="progressbar" aria-label={item.group} />}
      <span>{item.total ? item.done + ' / ' + item.total : busy ? t('postman.listing') : t('postman.itemsZero')}
        {item.failed > 0 ? ' · ' + t('postman.failedOverall', { count: item.failed }) : ''}</span>
    </li>)}</ul>}
    {archive && <div className="backup-result">
      <Alert className="notice" color="yellow" role="note" icon={<TriangleAlert size={18} aria-hidden="true" />}>
        {t('postman.zipWarning')}
      </Alert>
      <div className="actions">{desktop ? <Button type="button" variant="filled" onClick={() => void saveDesktop()} disabled={saving}>
        {saving ? t('postman.saving') : t('postman.saveZip')}
      </Button> : <Button component="a" variant="filled" href={archive.url} download={archive.name}>{t('postman.downloadZip')}</Button>}
      <Button type="button" disabled={saving} onClick={() => { setArchive(undefined); setStatus(''); }}>{t('postman.clear')}</Button></div>
    </div>}
    {error && <Alert className="error" color="red">{error}</Alert>}
    <p className="hint" role="status">{status}</p>
    <p className="hint">{t('postman.scope')}</p>
  </Paper>;
}
