import { Alert, Button, Paper, Textarea } from '@mantine/core';
import { diffLines, type Change } from 'diff';
import { useState } from 'react';
import { useT } from '../../i18n/context.tsx';
import { DiffResult } from './result.tsx';

const maxLength = 32_000;
const maxLines = 2_000;

export default function TextDiff() {
  const t = useT();
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [result, setResult] = useState<Change[]>();
  const [failed, setFailed] = useState(false);

  function reset() { setResult(undefined); setFailed(false); }

  function compare(event: React.FormEvent) {
    event.preventDefault();
    reset();
    if (before.split('\n').length > maxLines || after.split('\n').length > maxLines) {
      setFailed(true);
      return;
    }
    const changes = diffLines(before, after, { stripTrailingCr: true, timeout: 250, maxEditLength: 2_000 });
    if (changes) setResult(changes);
    else setFailed(true);
  }

  return <Paper component="form" className="panel" onSubmit={compare} autoComplete="off">
    <div className="editors">
      <Textarea label={t('textDiff.before')} maxLength={maxLength} value={before} spellCheck={false}
        onChange={(event) => { setBefore(event.currentTarget.value); reset(); }} />
      <Textarea label={t('textDiff.after')} maxLength={maxLength} value={after} spellCheck={false}
        onChange={(event) => { setAfter(event.currentTarget.value); reset(); }} />
    </div>
    <div className="actions">
      <Button type="submit" variant="filled">{t('textDiff.compare')}</Button>
      <Button type="button" onClick={() => { setBefore(''); setAfter(''); reset(); }}>{t('common.clear')}</Button>
    </div>
    {failed && <Alert className="error" color="red">{t('textDiff.limit')}</Alert>}
    {result && <DiffResult result={result} />}
  </Paper>;
}
