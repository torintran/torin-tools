import { Braces } from 'lucide-react';
import type { ToolDefinition } from '../../app/tool.ts';

export default {
  id: 'jwt',
  nameKey: 'jwt.name',
  groupKey: 'groups.tokens',
  descriptionKey: 'jwt.description',
  keywords: ['JSON Web Token', 'decode', 'payload', 'header', 'debug', 'sign', 'verify', 'JWK', 'PEM', 'giải mã', 'ký'],
  icon: Braces,
  dataFlow: 'local',
  actions: {
    decode: 'jwt.action.decode',
    sign: 'jwt.action.sign',
    verify: 'jwt.action.verify',
  },
  load: () => import('./view.tsx'),
} satisfies ToolDefinition;
