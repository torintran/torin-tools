import { Alert, Button, FileInput, Paper } from '@mantine/core';
import { FileUp } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { TextResultPreview } from '../../shared/text-result-preview.tsx';
import { Base64Options, defaultBase64Options } from './options.tsx';
import { MAX_BASE64_FILE_BYTES, type FileOptions } from './convert.ts';
import type { FileWorkerResult } from './file-worker.ts';
import FileWorker from './file-worker.ts?worker';

export function Base64File({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [options, setOptions] = useState<FileOptions>(defaultBase64Options);
  const [file, setFile] = useState<File>();
  const [download, setDownload] = useState<{ url: string; name: string; preview?: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const worker = useRef<Worker | undefined>(undefined);
  const resetFilePicker = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    worker.current?.terminate();
    worker.current = undefined;
  }, []);
  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
  }, [download]);

  function resetResult() { setDownload(undefined); setError(''); }
  function selectFile(next: File | null) {
    if (worker.current) return;
    setFile(next ?? undefined);
    resetResult();
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
    setDragging(!busy);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    setDragging(false);
    const { files, items, types } = event.dataTransfer;
    if (!types.includes('Files')) return;
    event.preventDefault();
    if (worker.current) return;
    if (files.length !== 1 || items[0]?.webkitGetAsEntry?.()?.isDirectory) {
      setError(t('common.dropSingleFile'));
      return;
    }
    resetFilePicker.current?.();
    selectFile(files[0]);
  }

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
    current.onmessage = ({ data }: MessageEvent<FileWorkerResult>) => {
      if (worker.current !== current) return;
      cancel();
      if ('error' in data) {
        setError(data.error ?? t('base64.workerFail'));
        return;
      }
      const name = options.mode === 'encode' ? file.name + '.base64'
        : file.name.replace(/\.(?:base64|b64|txt)$/i, '') + '.bin';
      setDownload({ url: URL.createObjectURL(data.result), name, preview: data.preview });
      recordActivity(options.mode === 'encode' ? 'encode-file' : 'decode-file');
    };
    current.onerror = () => {
      if (worker.current !== current) return;
      cancel();
      setError(t('base64.workerStop'));
    };
    current.postMessage({ file, options });
  }

  const downloadButton = download && <Button component="a" href={download.url} download={download.name}>{t('base64.download')}</Button>;

  return <Paper component="form" className="panel" autoComplete="off" onSubmit={start}>
    <Base64Options disabled={busy} value={options} change={(next) => { setOptions(next); resetResult(); }} />
    <div className="file-drop" data-dragging={dragging || undefined} onDragOver={onDragOver} onDrop={onDrop}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
      }}>
      <FileInput resetRef={resetFilePicker} label={t('base64.fileLabel')} description={t('common.dropFile')}
        placeholder={t('base64.filePlaceholder')} value={file ?? null}
        leftSection={<FileUp size={18} aria-hidden="true" />} disabled={busy} onChange={selectFile} />
    </div>
    <p className="hint">{t('base64.fileHint')}</p>
    {error && <Alert className="error" color="red">{error}</Alert>}
    {busy && <p className="hint" role="status">{t('base64.fileBusy')}</p>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={!file || busy}>
        {options.mode === 'encode' ? t('base64.encodeFile') : t('base64.decodeFile')}
      </Button>
      {busy
        ? <Button type="button" onClick={cancel}>{t('common.cancel')}</Button>
        : <Button type="button" onClick={() => selectFile(null)}>{t('common.clear')}</Button>}
      {download?.preview === undefined && downloadButton}
    </div>
    {download?.preview !== undefined && <div className="file-result">
      <TextResultPreview key={download.url} label={t('base64.filePreview')} value={download.preview} copyLabel={t('base64.copyOutput')}>
        {downloadButton}
      </TextResultPreview>
    </div>}
  </Paper>;
}
