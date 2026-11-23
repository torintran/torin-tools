import { Button, Checkbox, Paper, Textarea } from '@mantine/core';
import { useDeferredValue, useMemo, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { useClipboard } from '../../shared/use-clipboard.ts';
import { removeWhitespace } from './strip.ts';

export default function WhitespaceRemover({ recordActivity }: ToolViewProps) {
  const t = useT();
  const [input, setInput] = useState('');
  const [live, setLive] = useState(true);
  const [manual, setManual] = useState<string>();
  const clipboard = useClipboard();
  const deferredInput = useDeferredValue(input);
  const liveOutput = useMemo(
    () => live ? removeWhitespace(deferredInput) : undefined,
    [live, deferredInput],
  );
  const output = live ? input === deferredInput ? liveOutput ?? '' : '' : manual ?? '';

  function clearResult() { setManual(undefined); clipboard.reset(); }

  function run(event: React.FormEvent) {
    event.preventDefault();
    if (live) return;
    const text = removeWhitespace(input);
    clipboard.reset();
    setManual(text);
    recordActivity('strip');
  }

  return <Paper component="form" className="panel" onSubmit={run} autoComplete="off">
    <p className="hint encoding-note">{t('whitespaceRemover.note')}</p>
    <div className="tool-toolbar">
      <Checkbox label={t('whitespaceRemover.live')} checked={live}
        onChange={(event) => { setLive(event.currentTarget.checked); clearResult(); }} />
      <Button type="button" variant="subtle" onClick={() => { setInput(''); clearResult(); }}>
        {t('common.clear')}
      </Button>
    </div>
    <div className="editors">
      <Textarea label={t('common.input')} value={input} maxLength={2_000_000} spellCheck={false}
        autoCapitalize="off" autoCorrect="off"
        placeholder={t('whitespaceRemover.placeholder.input')}
        onChange={(event) => { setInput(event.target.value); clearResult(); }} />
      <Textarea label={t('common.output')} readOnly value={output} spellCheck={false}
        placeholder={t('whitespaceRemover.placeholder.output')} />
    </div>
    <div className="actions">
      <Button type="submit" variant="filled" disabled={live}>
        {t('whitespaceRemover.stripAction')}
      </Button>
      <Button type="button" disabled={!output} onClick={() => void clipboard.copy(output)}>
        {t('whitespaceRemover.copy')}
      </Button>
      <span role="status">{clipboard.status}</span>
    </div>
  </Paper>;
}
