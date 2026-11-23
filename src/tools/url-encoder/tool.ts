import { Link2 } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'url-encoder',
  nameKey: 'urlEncoder.name',
  groupKey: 'groups.encoding',
  descriptionKey: 'urlEncoder.description',
  keywords: [
    'url', 'uri', 'percent', 'encode', 'decode', 'encodeURI', 'encodeURIComponent',
    'query', 'form-urlencoded', 'mã hóa', 'giải mã',
  ],
  icon: Link2,
  dataFlow: 'local',
  actions: {
    encode: 'urlEncoder.action.encode',
    decode: 'urlEncoder.action.decode',
  },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
