import { Suspense, useEffect, useState } from 'react';
import { Alert, NavLink } from '@mantine/core';
import { Download, History as HistoryIcon, Info, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useT } from '../i18n/context.tsx';
import type { MessageKey } from '../i18n/messages/en.ts';
import { About } from './about.tsx';
import { AppChrome } from './app-chrome.tsx';
import { Catalog, toolGroups, toolsById } from './catalog.tsx';
import { Downloads } from './downloads.tsx';
import { History, useHistory } from './history.tsx';

type InstallEvent = Event & { prompt: () => Promise<void> };

const appPageMeta = {
  tools: { nameKey: 'app.nav.tools', icon: LayoutGrid, descriptionKey: 'app.nav.toolsDesc' },
  history: { nameKey: 'app.nav.history', icon: HistoryIcon, descriptionKey: 'app.nav.historyDesc' },
  downloads: { nameKey: 'app.nav.downloads', icon: Download, descriptionKey: 'app.nav.downloadsDesc' },
  about: { nameKey: 'app.nav.about', icon: Info, descriptionKey: 'app.nav.aboutDesc' },
} as const satisfies Record<string, { nameKey: MessageKey; icon: LucideIcon; descriptionKey: MessageKey }>;

function currentPage(): string {
  const id = location.hash.slice(1);
  return toolsById.has(id) || Object.hasOwn(appPageMeta, id) ? id : 'tools';
}

export function App() {
  const t = useT();
  const [selected, setSelected] = useState(currentPage);
  const [install, setInstall] = useState<InstallEvent>();
  const history = useHistory();

  useEffect(() => {
    const change = () => setSelected(currentPage());
    const available = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener('hashchange', change);
    window.addEventListener('beforeinstallprompt', available);
    return () => {
      window.removeEventListener('hashchange', change);
      window.removeEventListener('beforeinstallprompt', available);
    };
  }, []);

  const tool = toolsById.get(selected);
  const pageMeta = tool ? undefined : appPageMeta[selected as keyof typeof appPageMeta];
  const pageName = tool ? t(tool.nameKey) : pageMeta ? t(pageMeta.nameKey) : t('app.nav.tools');
  const pageDescription = tool ? t(tool.descriptionKey) : pageMeta ? t(pageMeta.descriptionKey) : '';

  function navLink(id: string, name: string, Icon: LucideIcon) {
    return <NavLink key={id} href={'#' + id} active={selected === id}
      aria-current={selected === id ? 'page' : undefined} label={name}
      leftSection={<Icon className="nav-icon" size={18} aria-hidden="true" />} />;
  }

  return <>
    <a className="skip" href="#main" onClick={(event) => {
      event.preventDefault();
      document.getElementById('main')?.focus();
    }}>{t('app.skip')}</a>
    <div className="layout">
      <aside>
        <a className="brand" href="#tools" aria-label={t('app.brandHome')}>
          <img src="./Torin_Logo_Ngang_Nen_Toi.svg" alt="" width="154" height="40" />
          <span>Tools</span>
        </a>
        <nav aria-label={t('app.nav.aria')}>
          <div className="nav-group">{navLink('tools', t('app.nav.tools'), appPageMeta.tools.icon)}</div>
          {toolGroups.map((group) => <div className="nav-group" key={group.key}>
            <h2>{t(group.key)}</h2>
            {group.tools.map((item) => navLink(item.id, t(item.nameKey), item.icon))}
          </div>)}
          <div className="nav-group support-links">
            {navLink('history', t('app.nav.history'), appPageMeta.history.icon)}
            {navLink('downloads', t('app.nav.downloads'), appPageMeta.downloads.icon)}
          </div>
        </nav>
      </aside>
      <main id="main" tabIndex={-1}>
        <AppChrome />
        <header>
          {tool && <p className="breadcrumb"><a href="#tools">{t('app.breadcrumb.tools')}</a><span aria-hidden="true"> / </span>{t(tool.groupKey)}</p>}
          <h1>{pageName}</h1>
          <p>{pageDescription}</p>
        </header>
        {selected === 'tools' && <Catalog />}
        {selected === 'history' && <History history={history} />}
        {selected === 'downloads' && <Downloads install={Boolean(install)} installApp={() => {
          void install?.prompt();
          setInstall(undefined);
        }} />}
        {selected === 'about' && <About />}
        {tool && <>
          <Alert className="privacy-note" variant="light" role="note" icon={<Info size={18} aria-hidden="true" />}>
            {tool.dataFlow === 'local' ? t('app.privacy.local') : t('app.privacy.postman')}
          </Alert>
          <Suspense fallback={<p role="status">{t('app.loadingTool')}</p>}>
            <tool.View key={tool.id} recordActivity={(action) => history.record(tool.id, action)} />
          </Suspense>
        </>}
      </main>
    </div>
  </>;
}
