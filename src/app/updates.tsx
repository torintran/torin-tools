import { Button, Paper } from '@mantine/core';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { useState } from 'react';
import { version as installedVersion } from '../../package.json';
import { useT } from '../i18n/context.tsx';

export const latestReleasePage = 'https://github.com/torintran/torin-tools/releases/latest';
const latestReleaseApi = 'https://api.github.com/repos/torintran/torin-tools/releases/latest';

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
      let result = isTauri() ? await invoke<{ version?: unknown } | null>('check_version') : null;
      if (result === null) {
        const response = await fetch(latestReleaseApi, {
          credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer',
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error('Unavailable version manifest');
        const release = await response.json();
        result = { version: typeof release?.tag_name === 'string' && release.tag_name.startsWith('v')
          ? release.tag_name.slice(1) : undefined };
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
