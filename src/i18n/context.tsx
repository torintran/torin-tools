import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultLocale, isLocale, locales, LOCALE_KEY, persistLocale, resolveLocale, type Locale } from './locales.ts';
import { en, type MessageKey } from './messages/en.ts';
import { vi } from './messages/vi.ts';
import { formatMessage, type Translate, type TranslateVars } from './translate.ts';

const catalogs = { en, vi } as const;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveLocale(
    typeof window === 'undefined' ? undefined : window.localStorage,
  ));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = catalogs[locale]['app.title'];
  }, [locale]);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== LOCALE_KEY && event.key !== null) return;
      setLocaleState(resolveLocale(window.localStorage));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale(next) {
      if (!isLocale(next) || next === locale) return;
      try { persistLocale(window.localStorage, next); } catch { /* Keep in-memory locale if storage is blocked. */ }
      setLocaleState(next);
    },
    t(key: MessageKey, vars?: TranslateVars) {
      return formatMessage(catalogs[locale][key] ?? catalogs[defaultLocale][key] ?? key, vars);
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale requires LocaleProvider');
  return context;
}

export function useT(): Translate {
  return useLocale().t;
}

export { locales };
export type { Locale, MessageKey };
