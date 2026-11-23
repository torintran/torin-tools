import { Alert, Button, Paper, Select, Textarea, TextInput } from '@mantine/core';
import { useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { MessageKey } from '../../i18n/messages/en.ts';
import { useClipboard } from '../../shared/use-clipboard.ts';
import {
  generateUuids,
  MAX_UUID_COUNT,
  type NamespaceId,
  type UuidVersion,
} from './generate.ts';

const versions: UuidVersion[] = ['nil', 'max', 'v1', 'v3', 'v4', 'v5', 'v6', 'v7'];

export default function UuidGenerator({ recordActivity }: ToolViewProps) {
  const t = useT();
  const clipboard = useClipboard();
  const [version, setVersion] = useState<UuidVersion>('v7');
  const [count, setCount] = useState('1');
  const [namespaceId, setNamespaceId] = useState<NamespaceId>('dns');
  const [customNamespace, setCustomNamespace] = useState('');
  const [name, setName] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const needsName = version === 'v3' || version === 'v5';

  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    clipboard.reset();
    try {
      const values = await generateUuids({
        version,
        count: Number(count),
        namespaceId,
        customNamespace,
        name,
      });
      setOutput(values.join('\n'));
      recordActivity('generate');
    } catch (failure) {
      setOutput('');
      setError(failure instanceof Error ? failure.message : t('uuid.failed'));
    } finally {
      setBusy(false);
    }
  }

  return <Paper component="form" className="panel" onSubmit={(event) => void run(event)} autoComplete="off">
    <p className="hint encoding-note">{t('uuid.scope')}</p>
    <div className="segmented tool-mode" role="group" aria-label={t('uuid.version')}>
      {versions.map((item) => <Button key={item} type="button" disabled={busy}
        variant={item === version ? 'filled' : 'subtle'} aria-pressed={item === version}
        onClick={() => { setVersion(item); setError(''); clipboard.reset(); }}>
        {t(('uuid.version.' + item) as MessageKey)}
      </Button>)}
    </div>
    <div className="tool-options">
      <TextInput label={t('uuid.quantity')} type="number" inputMode="numeric" min={1} max={MAX_UUID_COUNT}
        value={count} disabled={busy}
        onChange={(event) => setCount(event.currentTarget.value)} />
      {needsName && <>
        <Select label={t('uuid.namespace')} value={namespaceId} disabled={busy}
          data={[
            { value: 'dns', label: t('uuid.namespace.dns') },
            { value: 'url', label: t('uuid.namespace.url') },
            { value: 'oid', label: t('uuid.namespace.oid') },
            { value: 'x500', label: t('uuid.namespace.x500') },
            { value: 'custom', label: t('uuid.namespace.custom') },
          ]}
          onChange={(value) => { if (value) setNamespaceId(value as NamespaceId); }} />
        {namespaceId === 'custom' && <TextInput label={t('uuid.customNamespace')}
          value={customNamespace} disabled={busy} spellCheck={false}
          placeholder={t('uuid.customNamespacePlaceholder')}
          onChange={(event) => setCustomNamespace(event.currentTarget.value)} />}
        <TextInput label={t('uuid.nameLabel')} value={name} disabled={busy} spellCheck={false}
          placeholder={t('uuid.namePlaceholder')}
          onChange={(event) => setName(event.currentTarget.value)} />
      </>}
    </div>
    {error && <Alert className="error" color="red">{error}</Alert>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={busy}>
        {busy ? t('common.working') : t('uuid.generate')}
      </Button>
      <Button type="button" disabled={!output || busy} onClick={() => void clipboard.copy(output)}>
        {t('uuid.copy')}
      </Button>
      <Button type="button" disabled={busy} variant="subtle" onClick={() => {
        setOutput('');
        setError('');
        clipboard.reset();
      }}>{t('common.clear')}</Button>
      <span role="status">{clipboard.status}</span>
    </div>
    <Textarea className="compact-editor" label={t('common.output')} readOnly value={output}
      spellCheck={false} placeholder={t('uuid.outputPlaceholder')} minRows={4} />
  </Paper>;
}
