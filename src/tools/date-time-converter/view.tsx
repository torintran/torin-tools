import { Alert, Button, Paper, Select, TextInput } from '@mantine/core';
import { Copy } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import type { MessageKey } from '../../i18n/messages/en.ts';
import { useClipboard } from '../../shared/use-clipboard.ts';
import {
  convertDateTime,
  inputFormats,
  type DateInputFormat,
  type DateOutputId,
  type DateTimeParts,
} from './convert.ts';

const outputLabel: Record<DateOutputId, MessageKey> = {
  'js-locale': 'dateTime.out.jsLocale',
  iso8601: 'dateTime.out.iso8601',
  iso9075: 'dateTime.out.iso9075',
  rfc3339: 'dateTime.out.rfc3339',
  rfc7231: 'dateTime.out.rfc7231',
  'unix-s': 'dateTime.out.unixS',
  'unix-ms': 'dateTime.out.unixMs',
  utc: 'dateTime.out.utc',
  mongo: 'dateTime.out.mongo',
  excel: 'dateTime.out.excel',
};

export default function DateTimeConverter({ recordActivity }: ToolViewProps) {
  const t = useT();
  const clipboard = useClipboard();
  const [input, setInput] = useState(() => String(Date.now()));
  const [format, setFormat] = useState<DateInputFormat>('unix-ms');
  const deferredInput = useDeferredValue(input);
  const lastRecorded = useRef('');

  const conversion = useMemo(() => {
    if (!deferredInput.trim()) return { parts: undefined as DateTimeParts | undefined, error: '' };
    try {
      return { parts: convertDateTime(deferredInput, format), error: '' };
    } catch (failure) {
      return {
        parts: undefined,
        error: failure instanceof Error ? failure.message : t('dateTime.failed'),
      };
    }
  }, [deferredInput, format, t]);

  useEffect(() => {
    const stamp = conversion.parts?.outputs.find((row) => row.id === 'unix-ms')?.value;
    if (!stamp || stamp === lastRecorded.current) return;
    lastRecorded.current = stamp;
    recordActivity('convert');
  }, [conversion.parts, recordActivity]);

  function useNow() {
    setInput(String(Date.now()));
    setFormat('unix-ms');
    clipboard.reset();
  }

  return <Paper component="section" className="panel" aria-label={t('dateTime.name')}>
    <p className="hint encoding-note">{t('dateTime.note')}</p>
    <div className="date-time-input-row">
      <TextInput className="date-time-input" label={t('dateTime.input')} value={input} maxLength={200}
        spellCheck={false} autoCapitalize="off" autoCorrect="off"
        placeholder={t('dateTime.placeholder')}
        onChange={(event) => { setInput(event.currentTarget.value); clipboard.reset(); }} />
      <Select className="date-time-format" label={t('dateTime.inputFormat')} value={format}
        data={inputFormats.map((value) => ({
          value,
          label: t(('dateTime.format.' + value) as MessageKey),
        }))}
        onChange={(value) => {
          if (value && inputFormats.includes(value as DateInputFormat)) {
            setFormat(value as DateInputFormat);
            clipboard.reset();
          }
        }} />
    </div>
    <div className="actions">
      <Button type="button" variant="filled" onClick={useNow}>{t('dateTime.now')}</Button>
      <Button type="button" variant="subtle" onClick={() => { setInput(''); clipboard.reset(); }}>
        {t('common.clear')}
      </Button>
      <span role="status">{clipboard.status}</span>
    </div>
    {conversion.error && <Alert className="error" color="red" role="status">{conversion.error}</Alert>}
    {conversion.parts && <ul className="date-time-results" aria-label={t('dateTime.results')}>
      {conversion.parts.outputs.map(({ id, value }) => <li key={id}>
        <span className="date-time-label">{t(outputLabel[id])}</span>
        <div className="date-time-value">
          <TextInput readOnly value={value} aria-label={t(outputLabel[id])} spellCheck={false} />
          <Button type="button" variant="subtle" size="compact-sm" className="chrome-icon"
            aria-label={t('dateTime.copy') + ' ' + t(outputLabel[id])}
            onClick={() => void clipboard.copy(value)}>
            <Copy size={16} aria-hidden="true" />
          </Button>
        </div>
      </li>)}
    </ul>}
  </Paper>;
}
