import assert from 'node:assert/strict';
import { test } from 'node:test';
import { donateMethods, hasDonate, hasSocial, social, socialLinks, donate } from '../src/app/support-config.ts';
import { isLocale, LOCALE_KEY, persistLocale, resolveLocale } from '../src/i18n/locales.ts';
import { en } from '../src/i18n/messages/en.ts';
import { vi } from '../src/i18n/messages/vi.ts';
import { formatMessage } from '../src/i18n/translate.ts';

test('resolveLocale reads storage first and otherwise follows browser language without writing', () => {
  const items = new Map<string, string>();
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
  };
  assert.equal(resolveLocale(undefined, 'en-US'), 'en');
  assert.equal(resolveLocale(undefined, 'vi-VN'), 'vi');
  assert.equal(resolveLocale(storage, 'vi-VN'), 'vi');
  assert.equal(items.size, 0);
  persistLocale(storage, 'en');
  assert.equal(storage.getItem(LOCALE_KEY), 'en');
  assert.equal(resolveLocale(storage, 'vi-VN'), 'en');
  assert.equal(isLocale('fr'), false);
});

test('message catalogs cover the same keys and format placeholders', () => {
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
  assert.equal(formatMessage(en['history.hint'], { limit: 50 }).includes('50'), true);
  assert.equal(formatMessage(vi['updates.available'], { version: '1.2.3' }).includes('1.2.3'), true);
});

test('support helpers hide empty social and donate fields', () => {
  assert.equal(hasSocial(), false);
  assert.deepEqual(socialLinks(), []);
  assert.equal(hasDonate(), false);
  assert.deepEqual(donateMethods(), []);
  assert.equal(social.github, '');
  assert.equal(donate.buyMeACoffee, '');
  assert.equal(donate.momo.phone, '');
  assert.equal(donate.bankVn.accountNumber, '');
});
