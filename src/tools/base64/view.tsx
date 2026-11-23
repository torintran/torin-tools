import { Tabs } from '@mantine/core';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { Base64File } from './file.tsx';
import { Base64Text } from './text.tsx';

export default function Base64(props: ToolViewProps) {
  const t = useT();
  return <Tabs defaultValue="text" variant="pills" keepMounted={false}>
    <Tabs.List className="segmented tool-switcher" aria-label={t('base64.source')}>
      <Tabs.Tab value="text">{t('base64.tab.text')}</Tabs.Tab>
      <Tabs.Tab value="file">{t('base64.tab.file')}</Tabs.Tab>
    </Tabs.List>
    <p className="hint encoding-note">{t('base64.note')}</p>
    <Tabs.Panel value="text"><Base64Text {...props} /></Tabs.Panel>
    <Tabs.Panel value="file"><Base64File {...props} /></Tabs.Panel>
  </Tabs>;
}
