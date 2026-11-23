import { Alert, Button, Checkbox, Paper, Select, Textarea } from '@mantine/core';
import { useDeferredValue, useMemo, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { convertUrl, type UrlMode, type UrlScope } from './codec.ts';

function convert(input: string, mode: UrlMode, scope: UrlScope, failed: string) {
  try {
    return { text: convertUrl(input, mode, scope), error: '' };
  } catch (failure) {
    return { text: '', error: failure instanceof Error ? failure.message : failed };
  }
}

export default function UrlEncoder({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [mode, setMode] = useState<UrlMode>('encode');
  const [scope, setScope] = useState<UrlScope>('component');
  const [input, setInput] = useState('');
  const [live, setLive] = useState(false);
  const [manual, setManual] = useState<ReturnType<typeof convert>>();
  const clipboard = useClipboard();
  const deferredInput = useDeferredValue(input);
  const liveResult = useMemo(
    () => live && deferredInput ? convert(deferredInput, mode, scope, t('urlEncoder.failed')) : undefined,
    [live, deferredInput, mode, scope, t],
  );
  const result = live ? input === deferredInput ? liveResult : undefined : manual;
  const output = result?.text ?? '';

  function clearResult() { setManual(undefined); clipboard.reset(); }

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (live) return;
    const converted = convert(input, mode, scope, t('urlEncoder.failed'));
    clipboard.reset();
    setManual(converted);
    if (!converted.error) recordActivity(mode);
  }

  return <Paper component="form" className="panel" onSubmit={run} autoComplete="off">
    <p className="hint encoding-note">{t('urlEncoder.note')}</p>
    <div className="segmented tool-mode" role="group" aria-label={t('urlEncoder.conversion')}>
      {(['encode', 'decode'] as const).map((next) => <Button key={next} type="button"
        variant={next === mode ? 'filled' : 'subtle'} aria-pressed={next === mode}
        onClick={() => { setMode(next); clearResult(); }}>
        {next === 'encode' ? t('urlEncoder.encode') : t('urlEncoder.decode')}
      </Button>)}
    </div>
    <div className="tool-options">
      <Select label={t('urlEncoder.scope')} value={scope}
        data={[
          { value: 'component', label: t('urlEncoder.scope.component') },
          { value: 'full', label: t('urlEncoder.scope.full') },
          { value: 'form', label: t('urlEncoder.scope.form') },
        ]}
        onChange={(value) => {
          if (value === 'component' || value === 'full' || value === 'form') {
            setScope(value);
            clearResult();
          }
        }} />
    </div>
    <div className="tool-toolbar">
      <Checkbox label={t('urlEncoder.live')} checked={live}
        onChange={(event) => { setLive(event.currentTarget.checked); clearResult(); }} />
      <Button type="button" variant="subtle" onClick={() => { setInput(''); clearResult(); }}>
        {t('common.clear')}
      </Button>
    </div>
    <div className="editors">
      <Textarea label={t('common.input')} value={input} maxLength={2_000_000} spellCheck={false}
        autoCapitalize="off" autoCorrect="off"
        placeholder={mode === 'encode' ? t('urlEncoder.placeholder.encode') : t('urlEncoder.placeholder.decode')}
        onChange={(event) => { setInput(event.target.value); clearResult(); }} />
      <Textarea label={t('common.output')} readOnly value={output} spellCheck={false}
        placeholder={t('urlEncoder.placeholder.output')} />
    </div>
    {result?.error && <Alert className="error" color="red" role={live ? 'status' : 'alert'}>{result.error}</Alert>}
    <div className="actions">
      <Button type="submit" variant="filled" disabled={live}>
        {mode === 'encode' ? t('urlEncoder.encodeAction') : t('urlEncoder.decodeAction')}
      </Button>
      <Button type="button" disabled={!output} onClick={() => void clipboard.copy(output)}>
        {t('urlEncoder.copy')}
      </Button>
      <span role="status">{clipboard.status}</span>
    </div>
  </Paper>;
}
