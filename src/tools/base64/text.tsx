import { Alert, Button, Checkbox, Paper, Select, Textarea } from '@mantine/core';
import { useDeferredValue, useMemo, useState } from 'react';
import { useClipboard } from '../../shared/use-clipboard.ts';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { Base64Options, defaultBase64Options } from './options.tsx';
import { charsets, type Charset } from './charset.ts';
import { convertText, type FileOptions, type TextOptions } from './convert.ts';

function convert(input: string, settings: FileOptions, charset: Charset | 'auto', failed: string) {
  const options: TextOptions = settings.mode === 'encode'
    ? { ...settings, charset: charset === 'auto' ? 'utf-8' : charset }
    : { ...settings, charset };
  try {
    return { ...convertText(input, options), error: '' };
  } catch (failure) {
    return { text: '', error: failure instanceof Error ? failure.message : failed, charset: undefined };
  }
}

export function Base64Text({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState<FileOptions>(defaultBase64Options);
  const [charset, setCharset] = useState<Charset | 'auto'>('utf-8');
  const [live, setLive] = useState(false);
  const [manual, setManual] = useState<ReturnType<typeof convert>>();
  const clipboard = useClipboard();
  const deferredInput = useDeferredValue(input);
  const liveResult = useMemo(
    () => live && deferredInput ? convert(deferredInput, settings, charset, t('base64.failed')) : undefined,
    [live, deferredInput, settings, charset, t],
  );
  const result = live ? input === deferredInput ? liveResult : undefined : manual;
  const output = result?.text ?? '';

  function clearResult() { setManual(undefined); clipboard.reset(); }

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (live) return;
    const converted = convert(input, settings, charset, t('base64.failed'));
    clipboard.reset();
    setManual(converted);
    if (!converted.error) recordActivity(settings.mode);
  }

  const charsetOptions = charsets.map(([value, label]) => ({
    value,
    label: value === 'windows-1258' ? t('base64.charset.windows1258') : label,
  }));

  return <Paper component="form" className="panel" onSubmit={run} autoComplete="off">
    <Base64Options value={settings} change={(next) => {
      if (next.mode === 'encode' && charset === 'auto') setCharset('utf-8');
      setSettings(next);
      clearResult();
    }}>
      <Select label={t('base64.charset')} value={charset}
        data={[...(settings.mode === 'decode' ? [{ value: 'auto', label: t('common.autoDetect') }] : []),
          ...charsetOptions]}
        onChange={(value) => { if (value) { setCharset(value as Charset | 'auto'); clearResult(); } }} />
    </Base64Options>
    <div className="tool-toolbar">
      <Checkbox label={t('base64.live')} checked={live}
        onChange={(event) => { setLive(event.currentTarget.checked); clearResult(); }} />
      <Button type="button" variant="subtle" onClick={() => { setInput(''); clearResult(); }}>{t('common.clear')}</Button>
    </div>
    <div className="editors">
      <Textarea label={t('common.input')} value={input} maxLength={2_000_000} spellCheck={false} autoCapitalize="off" autoCorrect="off"
        placeholder={settings.mode === 'encode' ? t('base64.placeholder.encode') : t('base64.placeholder.decode')}
        onChange={(event) => { setInput(event.target.value); clearResult(); }} />
      <Textarea label={t('common.output')} readOnly value={output} spellCheck={false} placeholder={t('base64.placeholder.output')} />
    </div>
    {result?.error && <Alert className="error" color="red" role={live ? 'status' : 'alert'}>{result.error}</Alert>}
    {charset === 'auto' && result?.charset && <p className="hint">{t('base64.detected', {
      charset: result.charset === 'windows-1258'
        ? t('base64.charset.windows1258')
        : charsets.find(([id]) => id === result.charset)?.[1] ?? t('base64.charset.mixed'),
    })}</p>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={live}>
        {settings.mode === 'encode' ? t('base64.encodeText') : t('base64.decodeText')}
      </Button>
      <Button type="button" disabled={!output} onClick={() => void clipboard.copy(output)}>{t('base64.copyOutput')}</Button>
      <span role="status">{clipboard.status}</span>
    </div>
  </Paper>;
}
