import { Alert, Button, Paper, TextInput } from '@mantine/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { MessageKey } from '../../i18n/messages/en.ts';
import { FileDropInput } from '../../shared/file-drop-input.tsx';
import { TextResultPreview } from '../../shared/text-result-preview.tsx';
import type { ExtractError, ExtractResult, Pkcs12Contents } from './extract.ts';
import type { ExtractRequest } from './extract-worker.ts';
import { maxPasswordLength, maxPkcs12Bytes } from './limits.ts';
import ExtractWorker from './extract-worker.ts?worker';

function PemOutput({ label, pem, filename }: { label: string; pem: string; filename: string }) {
  const t = useT();
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const next = URL.createObjectURL(new Blob([pem], { type: 'application/x-pem-file' }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [pem]);

  const download = url && <Button component="a" href={url} download={filename}>{t('pkcs12.download')}</Button>;
  if (pem.length > 64 * 1024) {
    return <div>
      <strong>{label}</strong>
      <p className="hint">{t('pkcs12.largePem')}</p>
      {download}
    </div>;
  }

  return <TextResultPreview label={label} value={pem} copyLabel={t('pkcs12.copy')}>
    {download}
  </TextResultPreview>;
}

function PrivateKey({ label, pem, filename }: { label: string; pem: string; filename: string }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return <div>
    {visible && <PemOutput label={label} pem={pem} filename={filename} />}
    <Button className="file-result" type="button" variant="light" onClick={() => setVisible(!visible)}>
      {t(visible ? 'pkcs12.hideKey' : 'pkcs12.showKey', { label })}
    </Button>
  </div>;
}

type Job = { worker: Worker; timer?: number };

function stopJob(job: Job | undefined) {
  if (!job) return;
  window.clearTimeout(job.timer);
  job.worker.terminate();
}

export default function Pkcs12({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [file, setFile] = useState<File>();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  const [result, setResult] = useState<Pkcs12Contents>();
  const active = useRef<Job | undefined>(undefined);

  useEffect(() => () => stopJob(active.current), []);

  function cancel() {
    stopJob(active.current);
    active.current = undefined;
    setBusy(false);
  }

  function selectFile(next: File | null) {
    if (active.current) return;
    setFile(next ?? undefined);
    setResult(undefined);
    setError(next && next.size > maxPkcs12Bytes ? 'pkcs12.size' : undefined);
    setPassword('');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || active.current) return;
    setResult(undefined);
    setError(undefined);
    if (file.size > maxPkcs12Bytes) {
      setError('pkcs12.size');
      return;
    }

    let worker: Worker;
    try { worker = new ExtractWorker(); }
    catch { setError('pkcs12.worker'); return; }
    const job: Job = { worker };
    active.current = job;
    setBusy(true);
    setPassword('');

    function fail(key: MessageKey) {
      if (active.current !== job) return;
      cancel();
      setError(key);
    }

    job.timer = window.setTimeout(() => fail('pkcs12.timeout'), 15_000);
    worker.onerror = (event) => {
      event.preventDefault();
      fail('pkcs12.worker');
    };
    worker.onmessageerror = () => fail('pkcs12.worker');
    worker.onmessage = ({ data }: MessageEvent<ExtractResult>) => {
      if (active.current !== job) return;
      cancel();
      if ('error' in data) {
        const key: `pkcs12.${ExtractError}` = `pkcs12.${data.error}`;
        setError(key);
        return;
      }
      setResult(data.contents);
      recordActivity('extract');
    };
    worker.postMessage({ file, password } satisfies ExtractRequest);
  }

  return <>
    <Paper component="form" className="panel fields" onSubmit={submit} autoComplete="off">
      <FileDropInput label={t('pkcs12.file')} accept=".p12,.pfx" disabled={busy} file={file}
        onChange={selectFile} onInvalidDrop={() => setError('common.dropSingleFile')} />
      <TextInput label={t('pkcs12.passphrase')} description={t('pkcs12.passphraseHint')} type="password"
        autoComplete="off" spellCheck={false} disabled={busy} maxLength={maxPasswordLength}
        value={password} onChange={(event) => {
          setPassword(event.currentTarget.value);
          setResult(undefined);
          setError(undefined);
        }} />
      {error && <Alert role="alert" color="red">{t(error)}</Alert>}
      <div className="actions">
        <Button type="submit" variant="filled" loading={busy} disabled={!file || file.size > maxPkcs12Bytes}>
          {t('pkcs12.extract')}
        </Button>
        {busy ? <Button type="button" onClick={cancel}>{t('common.cancel')}</Button>
          : <Button type="button" onClick={() => selectFile(null)}>{t('common.clear')}</Button>}
      </div>
    </Paper>
    {result && <Paper className="panel fields" aria-label={t('pkcs12.results')}>
      {result.certificates.map(({ pem, alias }, index) => <PemOutput key={index}
        label={t('pkcs12.certificate', { number: index + 1 }) + (alias ? ` — ${alias}` : '')}
        pem={pem} filename={`certificate-${index + 1}.pem`} />)}
      {result.certificates.length > 1 && <PemOutput label={t('pkcs12.bundle')}
        pem={result.certificates.map(({ pem }) => pem).join('')} filename="certificates.pem" />}
      {result.privateKeys.length > 0 && <Alert role="note" color="yellow">{t('pkcs12.keyWarning')}</Alert>}
      {result.privateKeys.map(({ pem, alias }, index) => <PrivateKey key={index}
        label={t('pkcs12.key', { number: index + 1 }) + (alias ? ` — ${alias}` : '')}
        pem={pem} filename={`private-key-${index + 1}.pem`} />)}
    </Paper>}
  </>;
}
