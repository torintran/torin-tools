import { Alert, Button, Paper, Select, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { TextResultPreview } from '../../shared/text-result-preview.tsx';
import { dnsName, generateCsr, rsaKeySizes, subjectFields, type RsaKeySize, type Subject } from './generate.ts';

export default function CsrGenerator({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [subject, setSubject] = useState<Subject>({});
  const [san, setSan] = useState('');
  const [bits, setBits] = useState<RsaKeySize>(rsaKeySizes[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof generateCsr>>>();
  const [files, setFiles] = useState<{ csr: string; key: string }>();

  useEffect(() => {
    if (!result) {
      setFiles(undefined);
      return;
    }
    const csr = URL.createObjectURL(new Blob([result.csr], { type: 'application/pkcs10' }));
    const key = URL.createObjectURL(new Blob([result.privateKey], { type: 'application/pkcs8' }));
    setFiles({ csr, key });
    return () => { URL.revokeObjectURL(csr); URL.revokeObjectURL(key); };
  }, [result]);

  function clearResult() {
    setResult(undefined);
    setFiles(undefined);
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    clearResult();
    const cn = dnsName(subject.CN ?? '');
    const names = san.split(/[,\s]+/).filter(Boolean).map(dnsName);
    if (!cn || cn.length > 64 || names.some((name) => !name) || names.length > 100) {
      setError(t('csr.invalidDns'));
      return;
    }
    const country = subject.C?.trim().toUpperCase();
    if (country && !/^[A-Z]{2}$/.test(country)) {
      setError(t('csr.invalidCountry'));
      return;
    }
    if (!globalThis.crypto?.subtle) {
      setError(t('csr.secureContext'));
      return;
    }
    setBusy(true);
    try {
      const dnsNames = [...new Set([cn, ...names.filter((name): name is string => Boolean(name))])];
      setResult(await generateCsr({ ...subject, CN: cn, C: country }, dnsNames, bits));
      recordActivity('generate');
    } catch {
      setError(t('csr.failed'));
    } finally {
      setBusy(false);
    }
  }

  return <Paper component="form" className="panel" onSubmit={submit} autoComplete="off">
    <div className="fields">
      <div className="editors">
        {subjectFields.map((field) => <TextInput key={field} label={t(`csr.${field}`)}
          value={subject[field] ?? ''} disabled={busy} required={field === 'CN'}
          maxLength={field === 'C' ? 2 : 64} autoComplete="off" spellCheck={false}
          onChange={(event) => { setSubject({ ...subject, [field]: event.currentTarget.value }); clearResult(); }} />)}
      </div>
      <TextInput label={t('csr.san')} description={t('csr.sanHint')} disabled={busy}
        maxLength={4096} value={san} spellCheck={false}
        onChange={(event) => { setSan(event.currentTarget.value); clearResult(); }} />
      <Select label={t('csr.keySize')} data={rsaKeySizes.map(String)} value={String(bits)} disabled={busy}
        onChange={(value) => {
          const size = rsaKeySizes.find((size) => String(size) === value);
          if (size === undefined) return;
          setBits(size);
          clearResult();
        }} />
      {error && <Alert color="red">{error}</Alert>}
      <div className="actions">
        <Button type="submit" variant="filled" loading={busy}>{t('csr.generate')}</Button>
        <Button type="button" disabled={busy} onClick={() => { setSubject({}); setSan(''); setBits(rsaKeySizes[0]); clearResult(); }}>{t('common.clear')}</Button>
      </div>
      {result && files && <>
        <TextResultPreview label={t('csr.result')} value={result.csr} copyLabel={t('csr.copy')}>
          <Button component="a" href={files.csr} download="request.csr">{t('csr.download')}</Button>
        </TextResultPreview>
        <Alert role="note" color="yellow">{t('csr.keyNote')}</Alert>
        <div>
          <Button component="a" href={files.key} download="private-key.pem">{t('csr.downloadKey')}</Button>
        </div>
      </>}
    </div>
  </Paper>;
}
