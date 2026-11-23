import { Button, Textarea } from '@mantine/core';
import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useClipboard } from './use-clipboard.ts';

export function TextResultPreview({ label, value, copyLabel, children }: {
  label: string;
  value: string;
  copyLabel: string;
  children: ReactNode;
}) {
  const clipboard = useClipboard();

  return <div>
    <Textarea label={label} value={value} readOnly spellCheck={false} rows={6}
      classNames={{ input: 'text-result-preview' }} />
    <div className="actions">
      <Button type="button" leftSection={<Copy size={16} aria-hidden="true" />}
        onClick={() => void clipboard.copy(value)}>{copyLabel}</Button>
      {children}
      <span role="status">{clipboard.status}</span>
    </div>
  </div>;
}
