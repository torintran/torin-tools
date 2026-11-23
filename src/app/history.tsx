import { Alert, Button, Checkbox, Paper } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useLocale, useT } from '../i18n/context.tsx';
import { toolsById } from './catalog.tsx';
import { HISTORY_KEY, HISTORY_LIMIT, readHistory, recordActivity, type Activity } from './history-store.ts';

function knownAction(toolId: string, action: string) {
  const tool = toolsById.get(toolId);
  return Boolean(tool && Object.hasOwn(tool.actions, action));
}

function readLocalHistory() {
  try {
    return readHistory(window.localStorage, knownAction);
  } catch {
    return null;
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<Activity[] | null>(readLocalHistory);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === HISTORY_KEY || event.key === null) setEntries(readLocalHistory());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function record(toolId: string, action: string) {
    try {
      setEntries(recordActivity(window.localStorage, knownAction, toolId, action));
    } catch {
      setUnavailable(true);
    }
  }

  function configure(enabled: boolean) {
    try {
      if (enabled) window.localStorage.setItem(HISTORY_KEY, '[]');
      else window.localStorage.removeItem(HISTORY_KEY);
      setEntries(enabled ? [] : null);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }

  function clear() {
    if (readLocalHistory() !== null) configure(true);
    else setEntries(null);
  }

  return { entries, unavailable, record, configure, clear };
}

export function History({ history }: { history: ReturnType<typeof useHistory> }) {
  const t = useT();
  const { locale } = useLocale();
  const { entries, unavailable, configure, clear } = history;

  return <Paper component="section" className="panel">
    <div className="history-settings">
      <Checkbox label={t('history.save')} checked={entries !== null}
        onChange={(event) => configure(event.currentTarget.checked)} />
      <Button type="button" disabled={!entries?.length} onClick={clear}>{t('history.clear')}</Button>
    </div>
    <p className="hint">{t('history.hint', { limit: HISTORY_LIMIT })}</p>
    {unavailable && <Alert role="status" className="error" color="red">{t('history.unavailable')}</Alert>}
    {entries?.length ? <ol className="activity-list">
      {entries.map(({ toolId, action, at }, index) => {
        const tool = toolsById.get(toolId)!;
        const date = new Date(at);
        return <li key={toolId + ':' + action + ':' + at + ':' + index}>
          <a href={'#' + toolId}>{t(tool.actions[action])}</a>
          <time dateTime={date.toISOString()}>{date.toLocaleString(locale)}</time>
        </li>;
      })}
    </ol> : <p className="empty-state">{entries === null ? t('history.off') : t('history.empty')}</p>}
  </Paper>;
}
