import { decodeBytes, encodeBytes, type Base64Alphabet } from './codec.ts';
import { decodeTextBytes, encodeCharset, type Charset } from './charset.ts';

export type LineMode = 'whole' | 'each' | 'mime';
export type Newline = 'keep' | 'lf' | 'crlf';
export const MAX_BASE64_FILE_BYTES = 100 * 1024 * 1024;
type Settings = { lines: LineMode; newline: Newline };
type Operation =
  | { mode: 'encode'; alphabet: Base64Alphabet }
  | { mode: 'decode'; alphabet: Base64Alphabet | 'auto' };
export type FileOptions = Settings & Operation;
export type TextOptions = Settings & (
  | { mode: 'encode'; alphabet: Base64Alphabet; charset: Charset }
  | { mode: 'decode'; alphabet: Base64Alphabet | 'auto'; charset: Charset | 'auto' }
);
export type TextResult = { text: string; charset?: string };

function separator(option: Newline, original = '\n') {
  return option === 'keep' ? original : option === 'crlf' ? '\r\n' : '\n';
}

function wrap(encoded: string, newline: Newline) {
  return encoded.replace(/.{76}(?=.)/g, '$&' + separator(newline, '\r\n'));
}

function convertTextValue(text: string, options: TextOptions): TextResult {
  if (options.mode === 'encode') {
    const value = encodeBytes(encodeCharset(text, options.charset), options.alphabet);
    return { text: options.lines === 'mime' ? wrap(value, options.newline) : value };
  }
  return decodeTextBytes(decodeBytes(text, options.alphabet), options.charset);
}

export function convertText(input: string, options: TextOptions): TextResult {
  if (options.lines !== 'each') {
    const text = options.mode === 'encode' && options.newline !== 'keep'
      ? input.replace(/\r\n|[\r\n]/g, separator(options.newline)) : input;
    return convertTextValue(text, options);
  }
  let line = 0;
  const detected = new Set<string>();
  const text = input.split(/(\r\n|[\r\n])/).map((chunk, index) => {
    if (index % 2) return separator(options.newline, chunk);
    line++;
    try {
      const result = convertTextValue(chunk, options);
      if (result.charset && chunk.trim()) detected.add(result.charset);
      return result.text;
    } catch (error) {
      throw new Error('Line ' + line + ': ' + (error instanceof Error ? error.message : 'Conversion failed.'));
    }
  }).join('');
  return { text, charset: detected.size > 1 ? 'mixed' : detected.values().next().value };
}

const base64FileDecoder = new TextDecoder('utf-8', { fatal: true });

export function convertFile(bytes: Uint8Array<ArrayBuffer>, options: FileOptions): Blob {
  if (bytes.byteLength > MAX_BASE64_FILE_BYTES) throw new Error('Choose a file of 100 MiB or smaller.');
  if (options.mode === 'encode') {
    if (options.lines !== 'each') {
      const result = encodeBytes(bytes, options.alphabet);
      return new Blob([options.lines === 'mime' ? wrap(result, options.newline) : result], { type: 'text/plain' });
    }
    const chunks: string[] = [];
    let start = 0;
    for (let offset = 0; offset < bytes.length; offset++) {
      if (bytes[offset] !== 10 && bytes[offset] !== 13) continue;
      const end = offset;
      if (bytes[offset] === 13 && bytes[offset + 1] === 10) offset++;
      const original = String.fromCharCode(...bytes.subarray(end, offset + 1));
      chunks.push(encodeBytes(bytes.subarray(start, end), options.alphabet) + separator(options.newline, original));
      start = offset + 1;
    }
    chunks.push(encodeBytes(bytes.subarray(start), options.alphabet));
    return new Blob(chunks, { type: 'text/plain' });
  }

  let input: string;
  try { input = base64FileDecoder.decode(bytes); }
  catch { throw new Error('Choose a text file containing Base64.'); }
  if (options.lines !== 'each') {
    return new Blob([decodeBytes(input, options.alphabet)], { type: 'application/octet-stream' });
  }
  const chunks = input.split(/(\r\n|[\r\n])/).map((text, index) => {
    if (index % 2) return separator(options.newline, text);
    try { return decodeBytes(text, options.alphabet); }
    catch { throw new Error('Invalid Base64 on line ' + (index / 2 + 1) + '.'); }
  });
  return new Blob(chunks, { type: 'application/octet-stream' });
}
