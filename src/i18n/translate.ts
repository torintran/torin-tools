import type { MessageKey } from './messages/en.ts';

export type TranslateVars = Record<string, string | number>;

export function formatMessage(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match);
}

export type Translate = (key: MessageKey, vars?: TranslateVars) => string;
