import { Button, Code, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useT } from '../i18n/context.tsx';
import { latestReleasePage, Updates } from './updates.tsx';

type Artifact = { name: string; file: string; sha256: string };

export function Downloads({ install, installApp }: { install: boolean; installApp: () => void }) {
  const t = useT();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch('./downloads.json', {
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: controller.signal,
    }).then(async (response) => {
      const data = response.ok ? await response.json() : [];
      if (Array.isArray(data)) setArtifacts(data.filter((item): item is Artifact => item &&
        typeof item.name === 'string' && /^downloads\/[a-z0-9._-]+\.(?:zip|exe|AppImage|dmg)$/i.test(item.file) &&
        /^[a-f0-9]{64}$/.test(item.sha256)));
    }).catch(() => {}).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <>
    <Paper component="section" className="panel downloads">
      <h2>{t('downloads.webTitle')}</h2>
      <p>{t('downloads.webAndroid')}</p>
      <p>{t('downloads.webIos')}</p>
      {install && <Button type="button" variant="filled" onClick={installApp}>{t('downloads.install')}</Button>}
    </Paper>
    <Paper component="section" className="panel downloads">
      <h2>{t('downloads.desktopTitle')}</h2>
      <Button component="a" href={latestReleasePage} target="_blank" rel="noopener noreferrer" variant="filled">
        {t('downloads.github')}
      </Button>
      {loading ? <p role="status">{t('downloads.checking')}</p> : artifacts.length ? <ul>
        {artifacts.map((artifact) => <li key={artifact.file}><a href={artifact.file} download>{artifact.name}</a>
          <Code>{t('downloads.sha', { hash: artifact.sha256 })}</Code></li>)}
      </ul> : <p>{t('downloads.empty')}</p>}
    </Paper>
    <Updates />
  </>;
}
