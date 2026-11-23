import { Network } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'mac-address-lookup',
  nameKey: 'macLookup.name',
  groupKey: 'groups.network',
  descriptionKey: 'macLookup.description',
  keywords: ['mac', 'oui', 'vendor', 'ieee', 'eui-48'],
  icon: Network,
  dataFlow: 'local',
  actions: {},
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
