import { convertFile, type FileOptions } from './convert.ts';

export type FileWorkerResult = { result: Blob; preview?: string } | { error: string | undefined };

const maxPreviewBytes = 64 * 1024;
const previewDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

async function textPreview(result: Blob) {
  if (result.size === 0 || result.size > maxPreviewBytes) return;
  try {
    const text = previewDecoder.decode(await result.arrayBuffer());
    if (!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(text)) return text;
  } catch {
    return undefined;
  }
}

self.onmessage = async (event: MessageEvent<{ file: File; options: FileOptions }>) => {
  const { file, options } = event.data;
  try {
    const result = convertFile(new Uint8Array(await file.arrayBuffer()), options);
    self.postMessage({ result, preview: await textPreview(result) } satisfies FileWorkerResult);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : undefined } satisfies FileWorkerResult);
  }
};
