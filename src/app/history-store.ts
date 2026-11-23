export const HISTORY_KEY = 'torin.activity.v1';
export const HISTORY_LIMIT = 50;

export type Activity = Readonly<{ toolId: string; action: string; at: number }>;
type KnownAction = (toolId: string, action: string) => boolean;

export function readHistory(storage: Pick<Storage, 'getItem'>, knownAction: KnownAction): Activity[] | null {
  const raw = storage.getItem(HISTORY_KEY);
  if (raw === null) return null;
  if (raw.length > 16_384) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    const entries: Activity[] = [];
    for (const entry of value) {
      if (entries.length >= HISTORY_LIMIT) break;
      if (entry && typeof entry.toolId === 'string' && typeof entry.action === 'string' &&
          knownAction(entry.toolId, entry.action) && Number.isSafeInteger(entry.at) &&
          entry.at > 0 && entry.at <= Date.now()) {
        entries.push({ toolId: entry.toolId, action: entry.action, at: entry.at });
      }
    }
    return entries;
  } catch {
    return null;
  }
}

export function recordActivity(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  knownAction: KnownAction,
  toolId: string,
  action: string,
): Activity[] | null {
  const current = readHistory(storage, knownAction);
  if (current === null || !knownAction(toolId, action)) return current;
  const entries = [{ toolId, action, at: Date.now() }, ...current].slice(0, HISTORY_LIMIT);
  storage.setItem(HISTORY_KEY, JSON.stringify(entries));
  return entries;
}
