import { Button, Select } from '@mantine/core';
import { useT } from '../../i18n/context.tsx';
import type { FileOptions, LineMode, Newline } from './convert.ts';

export const defaultBase64Options: FileOptions = {
  mode: 'encode', alphabet: 'standard', lines: 'whole', newline: 'keep',
};

export function Base64Options({ value, change, disabled, children }: {
  value: FileOptions;
  change: (options: FileOptions) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const t = useT();

  function selectMode(mode: 'encode' | 'decode') {
    if (mode === value.mode) return;
    if (mode === 'encode') {
      change({ ...value, mode, alphabet: value.alphabet === 'url-safe' ? 'url-safe' : 'standard' });
    } else {
      change({
        ...value, mode,
        alphabet: value.alphabet === 'url-safe' ? 'url-safe' : 'auto',
        lines: value.lines === 'mime' ? 'whole' : value.lines,
      });
    }
  }

  return <>
    <div className="segmented tool-mode" role="group" aria-label={t('base64.conversion')}>
      {(['encode', 'decode'] as const).map((mode) => <Button key={mode} type="button" disabled={disabled}
        variant={mode === value.mode ? 'filled' : 'subtle'} aria-pressed={mode === value.mode} onClick={() => selectMode(mode)}>
        {mode === 'encode' ? t('base64.encode') : t('base64.decode')}
      </Button>)}
    </div>
    <div className="tool-options">
      <Select label={t('base64.alphabet')} disabled={disabled} value={value.alphabet}
        data={[
          ...(value.mode === 'decode' ? [{ value: 'auto', label: t('common.autoDetect') }] : []),
          { value: 'standard', label: t('base64.alphabet.standard') },
          { value: 'url-safe', label: t('base64.alphabet.urlSafe') },
        ]}
        onChange={(alphabet) => {
          if (alphabet === 'standard' || alphabet === 'url-safe') change({ ...value, alphabet });
          else if (alphabet === 'auto' && value.mode === 'decode') change({ ...value, alphabet });
        }} />
      <Select label={t('base64.lines')} disabled={disabled} value={value.lines}
        data={[
          { value: 'whole', label: t('base64.lines.whole') },
          { value: 'each', label: t('base64.lines.each') },
          ...(value.mode === 'encode' ? [{ value: 'mime', label: t('base64.lines.mime') }] : []),
        ]}
        onChange={(lines) => { if (lines) change({ ...value, lines: lines as LineMode }); }} />
      {(value.mode === 'encode' || value.lines === 'each') && <Select label={t('base64.newline')} disabled={disabled}
        value={value.newline}
        data={[
          { value: 'keep', label: t('base64.newline.keep') },
          { value: 'lf', label: t('base64.newline.lf') },
          { value: 'crlf', label: t('base64.newline.crlf') },
        ]}
        onChange={(newline) => { if (newline) change({ ...value, newline: newline as Newline }); }} />}
      {children}
    </div>
  </>;
}
