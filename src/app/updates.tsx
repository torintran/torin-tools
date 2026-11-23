import { Button, Paper } from '@mantine/core';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { useState } from 'react';
import { version as installedVersion } from '../../package.json';
import { useT } from '../i18n/context.tsx';

export function parseVersion(input: unknown): number[] | undefined {
  if (typeof input !== 'string' || !/^(?:0|[1-9]\d{0,5})(?:\.(?:0|[1-9]\d{0,5})){2}$/.test(input)) return;
  return input.split('.').map(Number);
}

function isNewer(version: number[]) {
  const installed = parseVersion(installedVersion)!;
  const difference = version.findIndex((part, index) => part !== installed[index]);
  return difference !== -1 && version[difference] > installed[difference];
}

export function Updates() {
  const t = useT();
  const [status, setStatus] = useState('');
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    setStatus('');
    try {
      let result: { version?: unknown } | null;
      if (isTauri()) {
        result = await invoke<typeof result>('check_version');
      } else {
        const response = await fetch('./version.json', {
          credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('Unavailable version manifest');
        result = await response.json();
      }
      if (result === null) {
        setStatus(t('updates.noServer'));
        return;
      }
      const latest = parseVersion(result.version);
      if (!latest) throw new Error('Invalid version manifest');
      setStatus(isNewer(latest)
        ? t('updates.available', { version: latest.join('.') })
        : t('updates.currentOk'));
    } catch {
      setStatus(t('updates.failed'));
    } finally {
      setChecking(false);
    }
  }

  return <Paper component="section" className="panel downloads">
    <h2>{t('updates.title')}</h2>
    <p>{t('updates.current', { version: installedVersion })}</p>
    <Button type="button" disabled={checking} onClick={() => void check()}>
      {checking ? t('updates.checking') : t('updates.check')}
    </Button>
    {status && <p role="status">{status}</p>}
  </Paper>;
}
