import { Badge, SegmentedControl, Table } from '@mantine/core';
import type { Change } from 'diff';
import { Fragment, useMemo, useState } from 'react';
import { useT } from '../../i18n/context.tsx';
import { diffRows, type Line } from './rows.ts';

export function DiffResult({ result }: { result: Change[] }) {
  const t = useT();
  const [layout, setLayout] = useState('split');
  const rows = useMemo(() => diffRows(result), [result]);
  const added = rows.filter((row) => row.changed && row.after).length;
  const removed = rows.filter((row) => row.changed && row.before).length;

  function cell(line?: Line, kind?: 'added' | 'removed') {
    return <Table.Td className={line && kind ? 'diff-' + kind : undefined}>
      {line && <div className="diff-line">
        <span className="diff-number">{line.number}</span>
        <span className="diff-marker">{kind === 'added' ? '+' : kind === 'removed' ? '−' : ''}</span>
        <code>{line.text}{kind && !line.ending &&
          <span className="diff-ending"> · {t('textDiff.noNewline')}</span>}</code>
      </div>}
    </Table.Td>;
  }

  if (!added && !removed) return <p className="hint" role="status">{t('textDiff.same')}</p>;
  return <section className="diff-result" aria-label={t('textDiff.result')}>
    <div className="tool-toolbar">
      <div className="diff-counts" role="status">
        <Badge color="green">{t('textDiff.added', { count: added })}</Badge>
        <Badge color="red">{t('textDiff.removed', { count: removed })}</Badge>
      </div>
      <SegmentedControl aria-label={t('textDiff.layout')} value={layout} onChange={setLayout}
        data={[{ value: 'split', label: t('textDiff.split') }, { value: 'unified', label: t('textDiff.unified') }]} />
    </div>
    <Table className="diff-table" layout="fixed" withTableBorder withColumnBorders>
      <Table.Thead><Table.Tr>{layout === 'split'
        ? <><Table.Th scope="col">{t('textDiff.before')}</Table.Th><Table.Th scope="col">{t('textDiff.after')}</Table.Th></>
        : <Table.Th scope="col">{t('textDiff.result')}</Table.Th>}
      </Table.Tr></Table.Thead>
      <Table.Tbody>{rows.map((row, index) => {
        if (layout === 'split') return <Table.Tr key={index}>
          {cell(row.before, row.changed ? 'removed' : undefined)}
          {cell(row.after, row.changed ? 'added' : undefined)}
        </Table.Tr>;
        return row.changed ? <Fragment key={index}>
          {row.before && <Table.Tr>{cell(row.before, 'removed')}</Table.Tr>}
          {row.after && <Table.Tr>{cell(row.after, 'added')}</Table.Tr>}
        </Fragment> : <Table.Tr key={index}>{cell(row.after)}</Table.Tr>;
      })}</Table.Tbody>
    </Table>
  </section>;
}
