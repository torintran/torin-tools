import { FileKey } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'csr',
  nameKey: 'csr.name',
  groupKey: 'groups.generators',
  descriptionKey: 'csr.description',
  keywords: ['csr', 'certificate', 'pkcs10', 'pem', 'rsa', 'tls', 'san', 'chứng chỉ'],
  icon: FileKey,
  dataFlow: 'local',
  actions: { generate: 'csr.generate' },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
