import { lazy, useRef, useState } from 'react';
import { Badge, Card, TextInput, ThemeIcon } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { ArrowUpRight, Search } from 'lucide-react';
import { useT } from '../i18n/context.tsx';
import type { MessageKey } from '../i18n/messages/en.ts';
import type { Translate } from '../i18n/translate.ts';
import type { ToolDefinition } from './tool.ts';

const groupOrder: MessageKey[] = [
  'groups.encoding', 'groups.converters', 'groups.text', 'groups.tokens', 'groups.generators', 'groups.api',
];
const definitions = import.meta.glob<ToolDefinition>('../tools/*/tool.ts', { eager: true, import: 'default' });
const reservedIds = new Set(['tools', 'history', 'downloads', 'about', 'cheat-sheets']);
export const tools = Object.values(definitions).map((definition) => {
  if (!/^[a-z][a-z0-9-]*$/.test(definition.id) || reservedIds.has(definition.id)) {
    throw new Error('Invalid or duplicate tool ID: ' + definition.id);
  }
  reservedIds.add(definition.id);
  return { ...definition, View: lazy(definition.load) };
}).sort((a, b) => a.id.localeCompare(b.id));

export const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
export const toolGroups = [...new Set([...groupOrder, ...tools.map((tool) => tool.groupKey)])]
  .map((key) => ({ key, tools: tools.filter((tool) => tool.groupKey === key) }))
  .filter((group) => group.tools.length);

export function matchTools(query: string, t: Translate) {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((tool) =>
    [t(tool.nameKey), t(tool.groupKey), t(tool.descriptionKey), ...tool.keywords]
      .join(' ').toLowerCase().includes(q));
}

export function Catalog({ shortcutEnabled }: { shortcutEnabled: boolean }) {
  const t = useT();
  const searchInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const results = matchTools(search, t);

  useHotkeys(shortcutEnabled ? [['mod+k', () => searchInput.current?.focus()]] : [], []);

  return <>
    <TextInput ref={searchInput} className="catalog-search" label={t('catalog.search')} type="search"
      leftSection={<Search size={18} aria-hidden="true" />}
      autoComplete="off" spellCheck={false} placeholder={t('catalog.placeholder')} maxLength={150}
      value={search} onChange={(event) => setSearch(event.target.value)} />
    {results.length === 0 ? <p className="empty-state" role="status">{t('catalog.empty')}</p> :
      <ul className="catalog" aria-label={t('catalog.aria')}>
        {results.map(({ icon: Icon, ...tool }) => <li key={tool.id}>
          <Card component="a" withBorder className="tool-card" href={'#' + tool.id}
            aria-labelledby={tool.id + '-title'} aria-describedby={tool.id + '-description'}>
            <span className="tool-card-top" aria-hidden="true">
              <ThemeIcon size={46} variant="light"><Icon size={22} /></ThemeIcon>
              <ArrowUpRight className="card-arrow" size={19} />
            </span>
            <Badge variant="light">{t(tool.groupKey)}</Badge>
            <h2 className="tool-card-title" id={tool.id + '-title'}>{t(tool.nameKey)}</h2>
            <p className="tool-card-description" id={tool.id + '-description'}>{t(tool.descriptionKey)}</p>
          </Card>
        </li>)}
      </ul>}
  </>;
}
