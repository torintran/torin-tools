import { Alert, Button, Paper, Textarea } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { JwtKeyFields, selectedKey, type KeyFieldsState } from './key-fields.tsx';
import { signJwt } from './signature.ts';

const initialHeader = '{\n  "typ": "JWT"\n}';
const initialPayload = '{\n  "sub": "example-user"\n}';
const initialKey: KeyFieldsState = { algorithm: 'HS256', key: '', secretFormat: 'text' };

export function JwtEncoder({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [header, setHeader] = useState(initialHeader);
  const [payload, setPayload] = useState(initialPayload);
  const [fields, setFields] = useState(initialKey);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const clipboard = useClipboard();
  const generation = useRef(0);

  useEffect(() => () => { generation.current++; }, []);

  function clearResult() {
    setToken('');
    setError('');
    clipboard.reset();
  }

  async function sign(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const current = ++generation.current;
    clearResult();
    setBusy(true);
    try {
      const signed = await signJwt(header, payload, fields.algorithm, selectedKey(fields));
      if (current === generation.current) {
        setToken(signed);
        recordActivity('sign');
      }
    } catch (failure) {
      if (current === generation.current) setError(failure instanceof Error ? failure.message : t('jwt.signFailed'));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  return <Paper component="form" className="panel" autoComplete="off" onSubmit={sign}>
    <div className="editors">
      <Textarea label={t('jwt.headerJson')} value={header} maxLength={128_000} disabled={busy} spellCheck={false}
        aria-describedby="jwt-alg-hint" onChange={(event) => { setHeader(event.target.value); clearResult(); }} />
      <Textarea label={t('jwt.payloadJson')} value={payload} maxLength={1_000_000} disabled={busy} spellCheck={false}
        onChange={(event) => { setPayload(event.target.value); clearResult(); }} />
    </div>
    <p className="hint" id="jwt-alg-hint">{t('jwt.algHint')}</p>
    <div className="jwt-key-panel">
      <JwtKeyFields fields={fields} onChange={(next) => { setFields(next); clearResult(); }} usage="sign" disabled={busy} />
    </div>
    {error && <Alert className="error" color="red">{error}</Alert>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={busy}>{busy ? t('jwt.signing') : t('jwt.sign')}</Button>
      <Button type="button" disabled={busy} onClick={() => {
        setHeader(initialHeader);
        setPayload(initialPayload);
        setFields(initialKey);
        clearResult();
      }}>{t('common.clear')}</Button>
    </div>
    {token && <div className="jwt-key-panel">
      <Textarea label={t('jwt.encoded')} className="compact-editor" readOnly value={token} spellCheck={false} />
      <div className="actions">
        <Button type="button" onClick={() => void clipboard.copy(token)}>{t('jwt.copyToken')}</Button>
        <span role="status">{clipboard.status}</span>
      </div>
    </div>}
  </Paper>;
}
