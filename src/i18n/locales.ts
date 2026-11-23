export const locales = ['en', 'vi'] as const;
export type Locale = (typeof locales)[number];
export const LOCALE_KEY = 'torin.locale.v1';
export const defaultLocale: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.some((locale) => locale === value);
}

/** Resolve locale from storage first; otherwise browser language. Does not write storage. */
export function resolveLocale(
  storage: Pick<Storage, 'getItem'> | undefined,
  language = typeof navigator === 'undefined' ? defaultLocale : navigator.language,
): Locale {
  try {
    const saved = storage?.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch { /* Private mode or blocked storage keeps the browser default. */ }
  return language.toLowerCase().startsWith('vi') ? 'vi' : defaultLocale;
}

export function persistLocale(storage: Pick<Storage, 'setItem'>, locale: Locale) {
  storage.setItem(LOCALE_KEY, locale);
}
