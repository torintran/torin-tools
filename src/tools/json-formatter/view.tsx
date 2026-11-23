import { Alert, Button, Checkbox, Paper, Select, Textarea } from '@mantine/core';
import { useDeferredValue, useMemo, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { MessageKey } from '../../i18n/messages/en.ts';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { formatJson, jsonIndents, type JsonIndent, type JsonMode } from './format.ts';

function convert(input: string, mode: JsonMode, indent: JsonIndent, jsonc: boolean, failed: string) {
  try {
    return { text: formatJson(input, mode, indent, { jsonc }), error: '' };
  } catch (failure) {
    return { text: '', error: failure instanceof Error ? failure.message : failed };
  }
}

export default function JsonFormatter({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [mode, setMode] = useState<JsonMode>('format');
  const [indent, setIndent] = useState<JsonIndent>('2');
  const [jsonc, setJsonc] = useState(false);
  const [input, setInput] = useState('');
  const [live, setLive] = useState(false);
  const [manual, setManual] = useState<ReturnType<typeof convert>>();
  const clipboard = useClipboard();
  const deferredInput = useDeferredValue(input);
  const liveResult = useMemo(
    () => live && deferredInput
      ? convert(deferredInput, mode, indent, jsonc, t('jsonFormatter.failed'))
      : undefined,
    [live, deferredInput, mode, indent, jsonc, t],
  );
  const result = live ? input === deferredInput ? liveResult : undefined : manual;
  const output = result?.text ?? '';

  function clearResult() { setManual(undefined); clipboard.reset(); }

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (live) return;
    const converted = convert(input, mode, indent, jsonc, t('jsonFormatter.failed'));
    clipboard.reset();
    setManual(converted);
    if (!converted.error) recordActivity(mode);
  }

  return <Paper component="form" className="panel" onSubmit={run} autoComplete="off">
    <p className="hint encoding-note">{t('jsonFormatter.note')}</p>
    <div className="segmented tool-mode" role="group" aria-label={t('jsonFormatter.conversion')}>
      {(['format', 'minify'] as const).map((next) => <Button key={next} type="button"
        variant={next === mode ? 'filled' : 'subtle'} aria-pressed={next === mode}
        onClick={() => { setMode(next); clearResult(); }}>
        {next === 'format' ? t('jsonFormatter.format') : t('jsonFormatter.minify')}
      </Button>)}
    </div>
    {mode === 'format' && <div className="tool-options">
      <Select label={t('jsonFormatter.indent')} value={indent}
        data={jsonIndents.map((value) => ({
          value,
          label: t(('jsonFormatter.indent.' + value) as MessageKey),
        }))}
        onChange={(value) => {
          if (value && jsonIndents.includes(value as JsonIndent)) {
            setIndent(value as JsonIndent);
            clearResult();
          }
        }} />
    </div>}
    <div className="tool-toolbar">
      <Checkbox label={t('jsonFormatter.jsonc')} checked={jsonc}
        onChange={(event) => { setJsonc(event.currentTarget.checked); clearResult(); }} />
      <Checkbox label={t('jsonFormatter.live')} checked={live}
        onChange={(event) => { setLive(event.currentTarget.checked); clearResult(); }} />
      <Button type="button" variant="subtle" onClick={() => { setInput(''); clearResult(); }}>
        {t('common.clear')}
      </Button>
    </div>
    <div className="editors">
      <Textarea label={t('common.input')} value={input} maxLength={2_000_000} spellCheck={false}
        autoCapitalize="off" autoCorrect="off"
        placeholder={t('jsonFormatter.placeholder.input')}
        onChange={(event) => { setInput(event.target.value); clearResult(); }} />
      <Textarea label={t('common.output')} readOnly value={output} spellCheck={false}
        placeholder={t('jsonFormatter.placeholder.output')} />
    </div>
    {result?.error && <Alert className="error" color="red" role={live ? 'status' : 'alert'}>{result.error}</Alert>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={live}>
        {mode === 'format' ? t('jsonFormatter.formatAction') : t('jsonFormatter.minifyAction')}
      </Button>
      <Button type="button" disabled={!output} onClick={() => void clipboard.copy(output)}>
        {t('jsonFormatter.copy')}
      </Button>
      <span role="status">{clipboard.status}</span>
    </div>
  </Paper>;
}
