import { Binary } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'base64',
  nameKey: 'base64.name',
  groupKey: 'groups.encoding',
  descriptionKey: 'base64.description',
  keywords: ['convert', 'encode', 'decode', 'text', 'file', 'utf-8', 'base64url', 'data URL', 'MIME', 'mã hóa', 'giải mã'],
  icon: Binary,
  dataFlow: 'local',
  actions: {
    encode: 'base64.action.encode',
    decode: 'base64.action.decode',
    'encode-file': 'base64.action.encode-file',
    'decode-file': 'base64.action.decode-file',
  },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
