import { useState } from 'react';
import { useT } from '../i18n/context.tsx';

export function useClipboard() {
  const t = useT();
  const [status, setStatus] = useState('');
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t('clipboard.copied'));
    } catch {
      setStatus(t('clipboard.unavailable'));
    }
  }
  return { status, copy, reset: () => setStatus('') };
}
