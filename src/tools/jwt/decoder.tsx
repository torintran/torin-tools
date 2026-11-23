import { Alert, Button, Code, Paper, Textarea } from '@mantine/core';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { MessageKey } from '../../i18n/messages/en.ts';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { decodeJwt, inspectFields } from './codec.ts';
import { JwtKeyFields, selectedKey, type KeyFieldsState } from './key-fields.tsx';
import { exampleJwt, isJwtAlgorithm, verifyJwtSignature, type JwtAlgorithm } from './signature.ts';

const claimKeys = new Set([
  'alg', 'typ', 'cty', 'kid', 'iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti',
]);

const algKeys = new Set([
  'HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512', 'ES256K', 'EdDSA', 'Ed25519', 'Ed448',
]);

export function JwtDecoder({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [token, setToken] = useState('');
  const [display, setDisplay] = useState<'json' | 'fields'>('json');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<JwtAlgorithm>();
  const [key, setKey] = useState('');
  const [secretFormat, setSecretFormat] = useState<KeyFieldsState['secretFormat']>('text');
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<{ weakKey: boolean }>();
  const [busy, setBusy] = useState(false);
  const clipboard = useClipboard();
  const generation = useRef(0);

  useEffect(() => () => { generation.current++; }, []);

  const deferredToken = useDeferredValue(token);
  const inspected = useMemo(() => {
    if (!deferredToken.trim()) return;
    try { return { decoded: decodeJwt(deferredToken), error: '' }; }
    catch (failure) { return { error: failure instanceof Error ? failure.message : t('jwt.invalid') }; }
  }, [deferredToken, t]);
  const result = token === deferredToken ? inspected : undefined;
  const decoded = result?.decoded;
  const tokenAlgorithm = decoded?.header.alg;
  const algorithm = selectedAlgorithm ?? (isJwtAlgorithm(tokenAlgorithm) ? tokenAlgorithm : 'HS256');

  function clearResult() {
    setError('');
    setVerification(undefined);
    clipboard.reset();
  }

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    try {
      decodeJwt(token);
      setError('');
      recordActivity('decode');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('jwt.invalid'));
    }
  }

  async function verify() {
    if (busy) return;
    const current = ++generation.current;
    clearResult();
    setBusy(true);
    try {
      const verified = await verifyJwtSignature(token, algorithm, selectedKey({ algorithm, key, secretFormat }));
      if (current === generation.current) {
        setVerification(verified);
        recordActivity('verify');
      }
    } catch (failure) {
      if (current === generation.current) setError(failure instanceof Error ? failure.message : t('jwt.verifyFailed'));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  async function generateExample() {
    if (busy) return;
    const current = ++generation.current;
    clearResult();
    setBusy(true);
    try {
      const demo = await exampleJwt();
      if (current === generation.current) {
        setToken(demo.token);
        setKey(demo.key);
        setSecretFormat('base64url');
        setSelectedAlgorithm('HS256');
      }
    } catch {
      if (current === generation.current) setError(t('jwt.exampleFailed'));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  function claimLabel(name: string, fallback?: string) {
    if (claimKeys.has(name)) return t(('jwt.claim.' + name) as MessageKey);
    return fallback;
  }

  function algorithmLabel(value: string | undefined, fallback?: string) {
    if (value && algKeys.has(value)) return t(('jwt.alg.' + value) as MessageKey);
    return fallback;
  }

  return <Paper component="form" className="panel" onSubmit={run} autoComplete="off">
    {verification
      ? <Alert className="notice" role="status" icon={<ShieldCheck size={18} aria-hidden="true" />}>
        {verification.weakKey ? t('jwt.verifiedWeak') : t('jwt.verified')}
      </Alert>
      : <Alert className="notice" color="yellow" role="note" icon={<TriangleAlert size={18} aria-hidden="true" />}>
        {t('jwt.unverified')}
      </Alert>}
    <Textarea label={t('jwt.token')} value={token} maxLength={1_000_000} spellCheck={false} autoCapitalize="off" autoCorrect="off"
      className="compact-editor" disabled={busy} placeholder={t('jwt.tokenPlaceholder')} onChange={(event) => { setToken(event.target.value); clearResult(); }} />
    {(error || result?.error) && <Alert className="error" color="red" role={error ? 'alert' : 'status'}>{error || result?.error}</Alert>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={busy}>{t('jwt.decode')}</Button>
      <Button type="button" disabled={busy} onClick={() => void generateExample()}>{t('jwt.example')}</Button>
      <Button type="button" disabled={!token || busy} onClick={() => void clipboard.copy(token)}>{t('jwt.copyToken')}</Button>
      <Button type="button" disabled={busy} onClick={() => {
        setToken(''); setKey(''); setSelectedAlgorithm(undefined); setSecretFormat('text'); clearResult();
      }}>{t('common.clear')}</Button>
      <span role="status">{clipboard.status}</span>
    </div>
    {decoded && <>
      <div className="segmented jwt-display" role="group" aria-label={t('jwt.display')}>
        <Button type="button" variant={display === 'json' ? 'filled' : 'subtle'} aria-pressed={display === 'json'} onClick={() => setDisplay('json')}>{t('jwt.json')}</Button>
        <Button type="button" variant={display === 'fields' ? 'filled' : 'subtle'} aria-pressed={display === 'fields'} onClick={() => setDisplay('fields')}>{t('jwt.fields')}</Button>
      </div>
      <div className="editors">{(['header', 'payload'] as const).map((section) =>
        <section key={section}>
          <div className="jwt-result-heading">
            <h2>{t(section === 'header' ? 'jwt.header' : 'jwt.payload')}</h2>
            <Button type="button" variant="subtle" onClick={() => void clipboard.copy(JSON.stringify(decoded[section], null, 2))}>
              {section === 'header' ? t('jwt.copyHeader') : t('jwt.copyPayload')}
            </Button>
          </div>
          {display === 'json' ? <Code block className="result-code">{JSON.stringify(decoded[section], null, 2)}</Code> :
            <dl className="jwt-fields">{inspectFields(section, decoded).map(({ name, label, value, detail }) =>
              <div key={name}>
                <dt><code>{name}</code> {claimLabel(name, label) && <span>{claimLabel(name, label)}</span>}</dt>
                <dd><Code block className="result-code">{JSON.stringify(value, null, 2)}</Code>
                  {detail && <span>{typeof value === 'string' && name === 'alg' ? algorithmLabel(value, detail) : detail}</span>}
                </dd>
              </div>)}</dl>}
        </section>)}</div>
      {display === 'json' && Object.keys(decoded.dates).length > 0 && <dl className="claims">{Object.entries(decoded.dates).map(([name, value]) =>
        <div key={name}><dt>{name} · UTC</dt><dd>{value}</dd></div>)}</dl>}
      <section className="jwt-key-panel" aria-labelledby="jwt-signature-heading">
        <h2 id="jwt-signature-heading">{t('jwt.signatureTitle')}</h2>
        {isJwtAlgorithm(tokenAlgorithm) ? <>
          <JwtKeyFields fields={{ algorithm, key, secretFormat }} onChange={(next) => {
            setSelectedAlgorithm(next.algorithm);
            setKey(next.key);
            setSecretFormat(next.secretFormat);
            clearResult();
          }} usage="verify" disabled={busy} />
          <div className="actions">
            <Button type="button" disabled={busy || !key.trim()} onClick={() => void verify()}>
              {busy ? t('common.working') : t('jwt.verify')}
            </Button>
          </div>
        </> : <p className="hint">{t('jwt.algInspectOnly')}</p>}
      </section>
    </>}
  </Paper>;
}
