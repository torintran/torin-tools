import { Hash } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'uuid',
  nameKey: 'uuid.name',
  groupKey: 'groups.generators',
  descriptionKey: 'uuid.description',
  keywords: [
    'uuid', 'guid', 'nil', 'v1', 'v3', 'v4', 'v5', 'namespace', 'DNS', 'generator',
    'sinh', 'định danh',
  ],
  icon: Hash,
  dataFlow: 'local',
  actions: { generate: 'uuid.action.generate' },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
