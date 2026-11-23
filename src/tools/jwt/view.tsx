import { Tabs } from '@mantine/core';
import type { ToolViewProps } from '../../app/tool.ts';
import { useT } from '../../i18n/context.tsx';
import { JwtDecoder } from './decoder.tsx';
import { JwtEncoder } from './encoder.tsx';

export default function Jwt(props: ToolViewProps) {
  const t = useT();
  return <Tabs defaultValue="decode" variant="pills" keepMounted={false}>
    <Tabs.List className="segmented tool-switcher" aria-label={t('jwt.operation')}>
      <Tabs.Tab value="decode">{t('jwt.tab.decode')}</Tabs.Tab>
      <Tabs.Tab value="sign">{t('jwt.tab.sign')}</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="decode"><JwtDecoder {...props} /></Tabs.Panel>
    <Tabs.Panel value="sign"><JwtEncoder {...props} /></Tabs.Panel>
  </Tabs>;
}
