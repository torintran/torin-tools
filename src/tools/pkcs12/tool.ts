import { FileLock } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'pkcs12',
  nameKey: 'pkcs12.name',
  groupKey: 'groups.converters',
  descriptionKey: 'pkcs12.description',
  keywords: ['p12', 'pfx', 'pkcs12', 'pkcs#12', 'pem', 'base64', 'certificate', 'tls', 'chứng chỉ', 'keystore'],
  icon: FileLock,
  dataFlow: 'local',
  actions: { extract: 'pkcs12.extract' },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
