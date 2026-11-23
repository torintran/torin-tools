import { convertFile, type FileOptions } from './convert.ts';

self.onmessage = async (event: MessageEvent<{ file: File; options: FileOptions }>) => {
  const { file, options } = event.data;
  try {
    const result = convertFile(new Uint8Array(await file.arrayBuffer()), options);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'The file could not be converted.' });
  }
};
