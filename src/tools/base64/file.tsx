import { Alert, Button, FileInput, Paper } from '@mantine/core';
import { FileUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { Base64Options, defaultBase64Options } from './options.tsx';
import { MAX_BASE64_FILE_BYTES, type FileOptions } from './convert.ts';
import FileWorker from './file-worker.ts?worker';

export function Base64File({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [options, setOptions] = useState<FileOptions>(defaultBase64Options);
  const [file, setFile] = useState<File>();
  const [download, setDownload] = useState<{ url: string; name: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | undefined>(undefined);

  useEffect(() => () => {
    worker.current?.terminate();
    worker.current = undefined;
  }, []);
  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
  }, [download]);

  function resetResult() { setDownload(undefined); setError(''); }
  function cancel() {
    worker.current?.terminate();
    worker.current = undefined;
    setBusy(false);
  }

  function start(event: React.FormEvent) {
    event.preventDefault();
    if (!file || worker.current) return;
    resetResult();
    if (file.size > MAX_BASE64_FILE_BYTES) {
      setError(t('base64.fileTooLarge'));
      return;
    }

    let current: Worker;
    try { current = new FileWorker(); }
    catch { setError(t('base64.workerStart')); return; }
    worker.current = current;
    setBusy(true);
    current.onmessage = ({ data }: MessageEvent<{ result?: Blob; error?: string }>) => {
      if (worker.current !== current) return;
      cancel();
      if (!data.result) {
        setError(data.error ?? t('base64.workerFail'));
        return;
      }
      const name = options.mode === 'encode' ? file.name + '.base64'
        : file.name.replace(/\.(?:base64|b64|txt)$/i, '') + '.bin';
      setDownload({ url: URL.createObjectURL(data.result), name });
      recordActivity(options.mode === 'encode' ? 'encode-file' : 'decode-file');
    };
    current.onerror = () => {
      if (worker.current !== current) return;
      cancel();
      setError(t('base64.workerStop'));
    };
    current.postMessage({ file, options });
  }

  return <Paper component="form" className="panel" autoComplete="off" onSubmit={start}>
    <Base64Options disabled={busy} value={options} change={(next) => { setOptions(next); resetResult(); }} />
    <FileInput className="tool-file" label={t('base64.fileLabel')} placeholder={t('base64.filePlaceholder')} value={file ?? null}
      leftSection={<FileUp size={18} aria-hidden="true" />}
      disabled={busy} onChange={(next) => { setFile(next ?? undefined); resetResult(); }} />
    <p className="hint">{t('base64.fileHint')}</p>
    {error && <Alert className="error" color="red">{error}</Alert>}
    {busy && <p className="hint" role="status">{t('base64.fileBusy')}</p>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={!file || busy}>
        {options.mode === 'encode' ? t('base64.encodeFile') : t('base64.decodeFile')}
      </Button>
      {busy
        ? <Button type="button" onClick={cancel}>{t('common.cancel')}</Button>
        : <Button type="button" onClick={() => {
          setFile(undefined);
          resetResult();
        }}>{t('common.clear')}</Button>}
      {download && <Button component="a" href={download.url} download={download.name}>{t('base64.download')}</Button>}
    </div>
  </Paper>;
}
