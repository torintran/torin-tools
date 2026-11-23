import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MessageKey } from '../i18n/messages/en.ts';

export type ToolViewProps = {
  recordActivity: (action: string) => void;
};

export type ToolDefinition = {
  id: string;
  nameKey: MessageKey;
  groupKey: MessageKey;
  descriptionKey: MessageKey;
  keywords: readonly string[];
  icon: LucideIcon;
  dataFlow: 'local' | 'postman';
  actions: Readonly<Record<string, MessageKey>>;
  load: () => Promise<{ default: ComponentType<ToolViewProps> }>;
};
