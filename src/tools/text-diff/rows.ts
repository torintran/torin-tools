import type { Change } from 'diff';

export type Line = { number: number; text: string; ending: boolean };
export type DiffRow = { before?: Line; after?: Line; changed: boolean };

export function diffRows(changes: readonly Change[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let beforeNumber = 1;
  let afterNumber = 1;
  let removed: Line[] = [];
  let added: Line[] = [];

  function flush() {
    for (let index = 0; index < Math.max(removed.length, added.length); index++) {
      rows.push({ before: removed[index], after: added[index], changed: true });
    }
    removed = [];
    added = [];
  }

  for (const change of changes) {
    const parts = change.value.split('\n');
    const last = parts.pop()!;
    const lines = parts.map((text) => ({ text, ending: true }));
    if (last) lines.push({ text: last, ending: false });
    if (change.removed) {
      removed.push(...lines.map((line) => ({ ...line, number: beforeNumber++ })));
    } else if (change.added) {
      added.push(...lines.map((line) => ({ ...line, number: afterNumber++ })));
    } else {
      flush();
      for (const line of lines) rows.push({
        before: { ...line, number: beforeNumber++ },
        after: { ...line, number: afterNumber++ },
        changed: false,
      });
    }
  }
  flush();
  return rows;
}
