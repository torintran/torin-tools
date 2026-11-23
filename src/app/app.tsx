import { Suspense, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Drawer, NavLink } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BookOpen, Coffee, Download, Info, LayoutGrid, Menu, Send, type LucideIcon } from 'lucide-react';
import { cheatSheetForRoute, cheatSheets, cheatSheetsRoute } from '../cheat-sheets/index.ts';
import { CheatSheets } from '../cheat-sheets/view.tsx';
import { useLocale, useT, type Locale } from '../i18n/context.tsx';
import type { MessageKey } from '../i18n/messages/en.ts';
import { About } from './about.tsx';
import { AppChrome } from './app-chrome.tsx';
import { BrandIcon } from './brand-icons.tsx';
import { Catalog, toolGroups, toolsById } from './catalog.tsx';
import { Downloads } from './downloads.tsx';
import { QuickSearch } from './quick-search.tsx';
import { donate, hasDonate, socialLinks } from './support-config.ts';

type InstallEvent = Event & { prompt: () => Promise<void> };

const appPageMeta = {
  tools: { nameKey: 'app.nav.tools', icon: LayoutGrid, descriptionKey: 'app.nav.toolsDesc' },
  'cheat-sheets': { nameKey: 'app.nav.cheatSheets', icon: BookOpen, descriptionKey: 'app.nav.cheatSheetsDesc' },
  downloads: { nameKey: 'app.nav.downloads', icon: Download, descriptionKey: 'app.nav.downloadsDesc' },
  about: { nameKey: 'app.nav.about', icon: Info, descriptionKey: 'app.nav.aboutDesc' },
} as const satisfies Record<string, { nameKey: MessageKey; icon: LucideIcon; descriptionKey: MessageKey }>;

function currentPage(): string {
  const id = location.hash.slice(1);
  if (id === 'history') return 'tools';
  return toolsById.has(id) || Object.hasOwn(appPageMeta, id) || cheatSheetForRoute(id) ? id : 'tools';
}

function coffeeHref() {
  const buyMeACoffee = donate.buyMeACoffee.trim();
  if (buyMeACoffee) return { href: buyMeACoffee, external: true };
  const paypal = donate.paypal.trim();
  if (paypal) return { href: paypal, external: true };
  return { href: '#about', external: false };
}

export function App() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [selected, setSelected] = useState(currentPage);
  const [install, setInstall] = useState<InstallEvent>();
  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 760px)') === true;
  const isCatalog = selected === 'tools';

  useEffect(() => {
    const change = () => {
      setSelected(currentPage());
      setMenuOpen(false);
    };
    const available = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    const blockFileNavigation = (event: DragEvent) => {
      if (event.defaultPrevented || !event.dataTransfer?.types.includes('Files')) return;
      event.preventDefault();
      if (event.type === 'dragover') event.dataTransfer.dropEffect = 'none';
    };
    window.addEventListener('hashchange', change);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('dragover', blockFileNavigation);
    window.addEventListener('drop', blockFileNavigation);
    return () => {
      window.removeEventListener('hashchange', change);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('dragover', blockFileNavigation);
      window.removeEventListener('drop', blockFileNavigation);
    };
  }, []);

  const tool = toolsById.get(selected);
  const cheatSheet = selected === cheatSheetsRoute ? cheatSheets[0] : cheatSheetForRoute(selected);
  const activeGroupKey = tool?.groupKey;
  const pageMeta = tool ? undefined : appPageMeta[(cheatSheet ? cheatSheetsRoute : selected) as keyof typeof appPageMeta];
  const pageName = tool ? t(tool.nameKey) : pageMeta ? t(pageMeta.nameKey) : t('app.nav.tools');
  const pageDescription = tool ? t(tool.descriptionKey) : pageMeta ? t(pageMeta.descriptionKey) : '';
  const social = socialLinks();
  const coffee = hasDonate() ? coffeeHref() : undefined;

  const groupOpen = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const group of toolGroups) {
      next[group.key] = openedGroups[group.key] ?? (activeGroupKey === group.key);
    }
    return next;
  }, [activeGroupKey, openedGroups]);

  useEffect(() => {
    if (!activeGroupKey) return;
    setOpenedGroups((prev) => (prev[activeGroupKey] ? prev : { ...prev, [activeGroupKey]: true }));
  }, [activeGroupKey]);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  function navLink(id: string, name: string, Icon: LucideIcon) {
    const active = selected === id || (id === cheatSheetsRoute && Boolean(cheatSheet));
    return <NavLink key={id} href={'#' + id} active={active}
      aria-current={active ? 'page' : undefined} label={name}
      leftSection={<Icon className="nav-icon" size={18} aria-hidden="true" />}
      onClick={() => setMenuOpen(false)} />;
  }

  function toolNav() {
    return <>
      <div className="nav-group">{navLink('tools', t('app.nav.tools'), appPageMeta.tools.icon)}</div>
      {toolGroups.map((group) => <div className="nav-group" key={group.key}>
        <NavLink
          className="nav-group-toggle"
          label={t(group.key)}
          childrenOffset={12}
          opened={groupOpen[group.key]}
          onChange={(opened) => setOpenedGroups((prev) => ({ ...prev, [group.key]: opened }))}
        >
          {group.tools.map((item) => navLink(item.id, t(item.nameKey), item.icon))}
        </NavLink>
      </div>)}
      <div className="nav-group support-links">
        {navLink(cheatSheetsRoute, t('app.nav.cheatSheets'), appPageMeta[cheatSheetsRoute].icon)}
        {navLink('downloads', t('app.nav.downloads'), appPageMeta.downloads.icon)}
      </div>
    </>;
  }

  return <>
    <a className="skip" href="#main" onClick={(event) => {
      event.preventDefault();
      document.getElementById('main')?.focus();
    }}>{t('app.skip')}</a>
    <div className="layout">
      <aside className="desktop-nav">
        <a className="brand" href="#tools" aria-label={t('app.brandHome')}>
          <img src="./Torin_Logo_Ngang_Nen_Toi.svg" alt="" width="154" height="40" />
          <span>Tools</span>
        </a>
        <nav aria-label={t('app.nav.aria')}>{toolNav()}</nav>
      </aside>
      <main id="main" tabIndex={-1}>
        <div className="mobile-bar">
          <Button type="button" variant="subtle" size="compact-sm" className="chrome-icon menu-button"
            aria-label={t('app.nav.menu')} aria-expanded={menuOpen} aria-controls="mobile-nav"
            onClick={() => setMenuOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </Button>
          <a className="mobile-brand" href="#tools" aria-label={t('app.brandHome')}>
            <img src="./Torin_Logo_Ngang.svg" alt="" width="120" height="32" />
          </a>
          <div className="lang-switch" role="group" aria-label={t('app.lang')}>
            {(['en', 'vi'] as const).map((code: Locale) => <Button key={code} type="button" size="compact-sm"
              variant={locale === code ? 'filled' : 'subtle'} aria-pressed={locale === code}
              onClick={() => setLocale(code)}>
              {code === 'en' ? 'EN' : 'VI'}
            </Button>)}
          </div>
        </div>
        <div className="desktop-chrome"><AppChrome showQuickSearch={!isCatalog && !isMobile} /></div>
        <header>
          {tool && <p className="breadcrumb"><a href="#tools">{t('app.breadcrumb.tools')}</a><span aria-hidden="true"> / </span>{t(tool.groupKey)}</p>}
          <h1>{pageName}</h1>
          <p>{pageDescription}</p>
        </header>
        {isCatalog && <Catalog shortcutEnabled={!menuOpen} />}
        {cheatSheet && <CheatSheets key={cheatSheet.id} sheet={cheatSheet} />}
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
            <tool.View key={tool.id} recordActivity={() => {}} />
          </Suspense>
        </>}
      </main>
    </div>
    <Drawer id="mobile-nav" className="mobile-drawer" opened={menuOpen} onClose={() => setMenuOpen(false)}
      position="left" size={320} title={t('app.nav.menu')} padding="md"
      zIndex={400}>
      {!isCatalog && <div className="drawer-search"><QuickSearch /></div>}
      <nav className="drawer-nav" aria-label={t('app.nav.aria')}>{toolNav()}</nav>
      <div className="drawer-actions">
        {social.map(({ id, url }) => {
          const label = t(id === 'github' ? 'about.github' : id === 'x' ? 'about.x' : 'about.telegram');
          const icon = id === 'telegram'
            ? <Send size={18} aria-hidden="true" />
            : <BrandIcon kind={id} size={18} />;
          return <Button key={id} component="a" href={url} target="_blank" rel="noopener noreferrer"
            variant="subtle" size="compact-sm" className="chrome-icon" aria-label={label} title={label}
            onClick={() => setMenuOpen(false)}>
            {icon}
          </Button>;
        })}
        <Button component="a" href="#about" variant="subtle" size="compact-sm" className="chrome-icon"
          aria-label={t('app.nav.about')} title={t('app.nav.about')}
          onClick={() => setMenuOpen(false)}>
          <Info size={18} aria-hidden="true" />
        </Button>
        {coffee && <Button component="a" href={coffee.href}
          target={coffee.external ? '_blank' : undefined}
          rel={coffee.external ? 'noopener noreferrer' : undefined}
          variant="filled" size="compact-sm" className="coffee-button"
          leftSection={<Coffee size={16} aria-hidden="true" />}
          onClick={() => setMenuOpen(false)}>
          {t('about.buyMeACoffee')}
        </Button>}
      </div>
    </Drawer>
  </>;
}
