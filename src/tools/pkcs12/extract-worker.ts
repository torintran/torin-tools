import { extractPkcs12, type ExtractResult } from './extract.ts';
import { maxPkcs12Bytes } from './limits.ts';

export type ExtractRequest = { file: File; password: string };

self.onmessage = async ({ data: { file, password } }: MessageEvent<ExtractRequest>) => {
  try {
    if (file.size > maxPkcs12Bytes) {
      self.postMessage({ error: 'size' } satisfies ExtractResult);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      self.postMessage(extractPkcs12(bytes, password));
    } finally {
      bytes.fill(0);
    }
  } catch {
    self.postMessage({ error: 'invalid' } satisfies ExtractResult);
  }
};
