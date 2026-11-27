import { FileInput } from '@mantine/core';
import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { useT } from '../i18n/context.tsx';

export function FileDropInput({ label, file, disabled, accept, onChange, onInvalidDrop }: {
  label: string;
  file: File | undefined;
  disabled: boolean;
  accept?: string;
  onChange: (file: File | null) => void;
  onInvalidDrop: () => void;
}) {
  const t = useT();
  const [dragging, setDragging] = useState(false);
  const resetPicker = useRef<(() => void) | null>(null);

  return <div className="file-drop" data-dragging={dragging && !disabled || undefined}
    onDragOver={(event) => {
      if (!event.dataTransfer.types.includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
      setDragging(!disabled);
    }}
    onDragLeave={(event) => {
      if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
    }}
    onDrop={(event) => {
      setDragging(false);
      const { files, items, types } = event.dataTransfer;
      if (!types.includes('Files')) return;
      event.preventDefault();
      if (disabled) return;
      if (files.length !== 1 || items[0]?.webkitGetAsEntry?.()?.isDirectory) {
        onInvalidDrop();
        return;
      }
      resetPicker.current?.();
      onChange(files[0]);
    }}>
    <FileInput resetRef={resetPicker} label={label} description={t('common.dropFile')}
      placeholder={t('common.chooseFile')} value={file ?? null} accept={accept}
      leftSection={<FileUp size={18} aria-hidden="true" />} disabled={disabled} onChange={onChange} />
  </div>;
}
