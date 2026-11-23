import { TextInput, ThemeIcon } from '@mantine/core';
import { BookOpen, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/context.tsx';
import { cheatSheetRoute, cheatSheets } from '../cheat-sheets/index.ts';
import { matchTools } from './catalog.tsx';

function shortcutLabel() {
  if (typeof navigator === 'undefined') return 'Ctrl+K';
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl+K';
}

export function QuickSearch() {
  const t = useT();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const words = term.split(/\s+/);
    const matches = (text: string) => words.every((word) => text.toLowerCase().includes(word));
    const sheets = term ? cheatSheets.filter(({ name, keywords, groups }) =>
      matches([name, ...keywords].join(' ')) ||
      groups.some(({ commands }) => commands.some(([, , example]) => matches(example))),
    ).map(({ id, name }) => ({ id: cheatSheetRoute(id), name, group: t('app.nav.cheatSheets'), icon: BookOpen })) : [];
    const tools = matchTools(query, t).map(({ id, nameKey, groupKey, icon }) =>
      ({ id, name: t(nameKey), group: t(groupKey), icon }));
    return [...tools, ...sheets].slice(0, 8);
  }, [query, t]);
  const showList = open && (query.trim().length > 0 || results.length > 0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => { setActive(0); }, [query]);

  function go(id: string) {
    location.hash = id;
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active].id);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return <div className="quick-search" ref={rootRef}>
    <TextInput ref={inputRef} type="search" autoComplete="off" spellCheck={false} maxLength={150}
      aria-label={t('app.search.aria')} aria-expanded={showList} aria-controls={listId}
      aria-autocomplete="list" role="combobox"
      leftSection={<Search size={18} aria-hidden="true" />}
      rightSection={<kbd className="search-kbd">{shortcutLabel()}</kbd>}
      rightSectionWidth={72}
      placeholder={t('app.search.placeholder')}
      value={query}
      onFocus={() => setOpen(true)}
      onChange={(event) => { setQuery(event.currentTarget.value); setOpen(true); }}
      onKeyDown={onKeyDown} />
    {showList && <ul id={listId} className="quick-search-list" role="listbox" aria-label={t('app.search.aria')}>
      {results.length === 0
        ? <li className="quick-search-empty" role="option" aria-disabled="true">{t('app.search.empty')}</li>
        : results.map((tool, index) => {
          const Icon = tool.icon;
          return <li key={tool.id} role="option" aria-selected={index === active}>
            <a className={index === active ? 'active' : undefined} href={'#' + tool.id}
              onMouseEnter={() => setActive(index)}
              onClick={(event) => { event.preventDefault(); go(tool.id); }}>
              <ThemeIcon size={34} variant="light"><Icon size={18} aria-hidden="true" /></ThemeIcon>
              <span>
                <strong>{tool.name}</strong>
                <small>{tool.group}</small>
              </span>
            </a>
          </li>;
        })}
    </ul>}
  </div>;
}
