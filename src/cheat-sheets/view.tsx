import { Button, Code, Paper } from '@mantine/core';
import { ArrowUpRight, Copy } from 'lucide-react';
import { useLocale, useT } from '../i18n/context.tsx';
import { useClipboard } from '../shared/use-clipboard.ts';
import { cheatSheetRoute, cheatSheets } from './index.ts';
import type { CheatSheet } from './type.ts';

function Command({ description, example, reference }: { description: string; example: string; reference: string }) {
  const t = useT();
  const clipboard = useClipboard();

  return <li className="cheat-command">
    <p>{description}</p>
    <div className="cheat-code">
      <Code block>{example}</Code>
      <Button type="button" variant="light" className="cheat-copy" size="compact-sm"
        aria-label={t('common.copy')} title={t('common.copy')} onClick={() => void clipboard.copy(example)}>
        <Copy size={17} aria-hidden="true" />
      </Button>
    </div>
    <div className="cheat-actions">
      <Button component="a" href={reference} target="_blank" rel="noopener noreferrer" size="compact-sm"
        variant="subtle" rightSection={<ArrowUpRight size={15} aria-hidden="true" />}>{t('cheatSheets.reference')}</Button>
      <span className="hint" role="status">{clipboard.status}</span>
    </div>
  </li>;
}

export function CheatSheets({ sheet }: { sheet: CheatSheet }) {
  const t = useT();
  const { locale } = useLocale();
  const language = locale === 'vi' ? 1 : 0;

  return <div className="cheat-sheets">
    <nav aria-label={t('app.nav.cheatSheets')} className="cheat-tabs">
      {cheatSheets.map(({ id, name }) => <Button key={id} component="a" href={'#' + cheatSheetRoute(id)}
        variant={id === sheet.id ? 'filled' : 'default'} aria-current={id === sheet.id ? 'page' : undefined}>{name}</Button>)}
    </nav>
    <p className="hint cheat-hint">{t('cheatSheets.placeholderHint')}</p>
    {sheet.groups.map(({ title, commands }) => <Paper key={title[0]} component="section" className="panel" withBorder>
      <h2>{title[language]}</h2>
      <ul className="cheat-commands">
        {commands.map((command) => <Command key={command[2]} description={command[language]}
          example={command[2]} reference={command[3]} />)}
      </ul>
    </Paper>)}
  </div>;
}
