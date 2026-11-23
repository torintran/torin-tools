import { Braces } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'json-formatter',
  nameKey: 'jsonFormatter.name',
  groupKey: 'groups.converters',
  descriptionKey: 'jsonFormatter.description',
  keywords: [
    'json', 'format', 'pretty', 'prettify', 'minify', 'beautify', 'indent',
    'định dạng', 'rút gọn',
  ],
  icon: Braces,
  dataFlow: 'local',
  actions: {
    format: 'jsonFormatter.action.format',
    minify: 'jsonFormatter.action.minify',
  },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
