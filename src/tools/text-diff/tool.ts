import { FileDiff } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'text-diff',
  nameKey: 'textDiff.name',
  groupKey: 'groups.text',
  descriptionKey: 'textDiff.description',
  keywords: ['diff', 'compare', 'text', 'lines', 'so sánh'],
  icon: FileDiff,
  dataFlow: 'local',
  actions: {},
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
