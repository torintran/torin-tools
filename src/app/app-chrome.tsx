import { Button } from '@mantine/core';
import { Coffee, Info, Send } from 'lucide-react';
import { useLocale, useT, type Locale } from '../i18n/context.tsx';
import { BrandIcon } from './brand-icons.tsx';
import { QuickSearch } from './quick-search.tsx';
import { donate, hasDonate, socialLinks } from './support-config.ts';

function coffeeHref() {
  const buyMeACoffee = donate.buyMeACoffee.trim();
  if (buyMeACoffee) return { href: buyMeACoffee, external: true };
  const paypal = donate.paypal.trim();
  if (paypal) return { href: paypal, external: true };
  return { href: '#about', external: false };
}

export function AppChrome() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const social = socialLinks();
  const coffee = hasDonate() ? coffeeHref() : undefined;

  return <div className="app-chrome">
    <QuickSearch />
    <div className="app-chrome-actions">
      <div className="lang-switch" role="group" aria-label={t('app.lang')}>
        {(['en', 'vi'] as const).map((code: Locale) => <Button key={code} type="button" size="compact-sm"
          variant={locale === code ? 'filled' : 'subtle'} aria-pressed={locale === code}
          onClick={() => setLocale(code)}>
          {code === 'en' ? 'EN' : 'VI'}
        </Button>)}
      </div>
      {social.map(({ id, url }) => {
        const label = t(id === 'github' ? 'about.github' : id === 'x' ? 'about.x' : 'about.telegram');
        const icon = id === 'telegram'
          ? <Send size={18} aria-hidden="true" />
          : <BrandIcon kind={id} size={18} />;
        return <Button key={id} component="a" href={url} target="_blank" rel="noopener noreferrer"
          variant="subtle" size="compact-sm" className="chrome-icon" aria-label={label} title={label}>
          {icon}
        </Button>;
      })}
      <Button component="a" href="#about" variant="subtle" size="compact-sm" className="chrome-icon"
        aria-label={t('app.nav.about')} title={t('app.nav.about')}>
        <Info size={18} aria-hidden="true" />
      </Button>
      {coffee && <Button component="a" href={coffee.href}
        target={coffee.external ? '_blank' : undefined}
        rel={coffee.external ? 'noopener noreferrer' : undefined}
        variant="filled" size="compact-sm" className="coffee-button"
        leftSection={<Coffee size={16} aria-hidden="true" />}>
        {t('about.buyMeACoffee')}
      </Button>}
    </div>
  </div>;
}
