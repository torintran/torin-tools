import { Alert, Button, Paper, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useT } from '../../i18n/context.tsx';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { lookupMac, normalizeMac } from './lookup.ts';

const example = 'C8:5C:E2:7A:BC:DE';

export default function MacLookup() {
  const t = useT();
  const [input, setInput] = useState(example);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof lookupMac>>>();
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const clipboard = useClipboard();
  const hex = normalizeMac(input);

  useEffect(() => {
    if (!hex) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setBusy(true);
      void lookupMac(hex).then((value) => {
        if (active) setResult(value);
      }).catch(() => {
        if (active) setFailed(true);
      }).finally(() => {
        if (active) setBusy(false);
      });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [hex, retry]);

  function change(value: string) {
    setInput(value);
    if (normalizeMac(value) === hex) return;
    setResult(undefined);
    setFailed(false);
    setBusy(false);
    clipboard.reset();
  }

  return <Paper className="panel">
    <TextInput label={t('macLookup.input')} description={t('macLookup.hint')} placeholder={example}
      value={input} autoComplete="off" maxLength={32} spellCheck={false}
      error={input.trim() && !hex ? t('macLookup.invalid') : undefined}
      onChange={(event) => change(event.currentTarget.value)} />
    <div className="actions">
      <Button type="button" onClick={() => change(example)}>{t('macLookup.example')}</Button>
      <Button type="button" onClick={() => change('')}>{t('common.clear')}</Button>
      {failed && <Button type="button" onClick={() => { setFailed(false); setRetry(retry + 1); }}>
        {t('macLookup.search')}
      </Button>}
      {result?.kind === 'match' && <Button type="button" onClick={() => void clipboard.copy(result.organization)}>
        {t('macLookup.copy')}
      </Button>}
      <span role="status">{clipboard.status}</span>
    </div>
    {busy && <p className="hint" role="status">{t('macLookup.loading')}</p>}
    {failed && <Alert className="error" color="red">{t('macLookup.failed')}</Alert>}
    {result && <Alert className="error" role="status">{result.kind === 'match'
      ? t('macLookup.match', { organization: result.organization, prefix: result.prefix })
      : t(`macLookup.${result.kind}`)}</Alert>}
  </Paper>;
}
