import { Eraser } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'whitespace-remover',
  nameKey: 'whitespaceRemover.name',
  groupKey: 'groups.text',
  descriptionKey: 'whitespaceRemover.description',
  keywords: [
    'whitespace', 'space', 'tab', 'newline', 'strip', 'remove', 'trim', 'blank',
    'khoảng trắng', 'xóa khoảng trắng',
  ],
  icon: Eraser,
  dataFlow: 'local',
  actions: {
    strip: 'whitespaceRemover.action.strip',
  },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
