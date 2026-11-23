import { Archive } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'postman',
  nameKey: 'postman.name',
  groupKey: 'groups.api',
  descriptionKey: 'postman.description',
  keywords: ['API', 'export', 'backup', 'collections', 'environments', 'ZIP', 'xuất', 'sao lưu'],
  icon: Archive,
  dataFlow: 'postman',
  actions: { backup: 'postman.action.backup' },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
