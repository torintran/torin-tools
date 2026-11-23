export const charsets = [
  ['utf-8', 'UTF-8'],
  ['utf-16le', 'UTF-16 LE'],
  ['utf-16be', 'UTF-16 BE'],
  ['ascii', 'US-ASCII'],
  ['iso-8859-1', 'ISO-8859-1'],
  ['iso-8859-2', 'ISO-8859-2'],
  ['windows-1252', 'Windows-1252'],
  ['windows-1251', 'Windows-1251'],
  ['windows-1258', 'Windows-1258 (Vietnamese)'],
] as const;
export type Charset = typeof charsets[number][0];
const tables = new Map<Charset, Map<string, number>>();

function singleByteTable(charset: Charset) {
  const cached = tables.get(charset);
  if (cached) return cached;
  const table = new Map<string, number>();
  const decoder = new TextDecoder(charset, { fatal: true });
  for (let value = 0; value < 256; value++) {
    try { table.set(decoder.decode(new Uint8Array([value])), value); }
    catch { /* Undefined bytes cannot be encoded. */ }
  }
  tables.set(charset, table);
  return table;
}

export function encodeCharset(text: string, charset: Charset): Uint8Array<ArrayBuffer> {
  if (charset === 'utf-8') return new TextEncoder().encode(text);
  if (charset === 'utf-16le' || charset === 'utf-16be') {
    const bytes = new Uint8Array(text.length * 2);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), charset === 'utf-16le');
    return bytes;
  }
  const byteTable = charset === 'ascii' || charset === 'iso-8859-1' ? undefined : singleByteTable(charset);
  const max = charset === 'ascii' ? 127 : 255;
  const result = new Uint8Array(text.length * (charset === 'windows-1258' ? 2 : 1));
  let count = 0;
  for (const character of text) {
    const code = character.codePointAt(0)!;
    const byte = byteTable ? byteTable.get(character) : code <= max ? code : undefined;
    if (byte !== undefined) {
      result[count++] = byte;
      continue;
    }
    if (byteTable && charset === 'windows-1258') {
      const decomposed = character.normalize('NFD');
      const tone = decomposed.match(/[\u0300\u0301\u0303\u0309\u0323]/)?.[0];
      const vowel = tone ? byteTable.get(decomposed.replace(tone, '').normalize('NFC')) : undefined;
      const accent = tone ? byteTable.get(tone) : undefined;
      if (vowel !== undefined && accent !== undefined) {
        result[count++] = vowel;
        result[count++] = accent;
        continue;
      }
    }
    throw new Error('A character cannot be encoded in the selected character set.');
  }
  return result.subarray(0, count);
}

function decodeCharset(bytes: Uint8Array, charset: Charset) {
  if (charset === 'ascii' || charset === 'iso-8859-1') {
    if (charset === 'ascii' && bytes.some((byte) => byte > 127)) throw new Error('Invalid US-ASCII bytes.');
    let text = '';
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return text;
  }
  try {
    const decoded = new TextDecoder(charset, { fatal: true, ignoreBOM: true }).decode(bytes);
    return charset === 'windows-1258' ? decoded.normalize('NFC') : decoded;
  } catch {
    const label = charsets.find(([id]) => id === charset)?.[1] ?? charset;
    throw new Error('The decoded bytes are not valid ' + label + '.');
  }
}

export function decodeTextBytes(bytes: Uint8Array, selected: Charset | 'auto') {
  if (selected !== 'auto') return { text: decodeCharset(bytes, selected), charset: selected };
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: decodeCharset(bytes.subarray(2), 'utf-16le'), charset: 'utf-16le' };
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: decodeCharset(bytes.subarray(2), 'utf-16be'), charset: 'utf-16be' };
  }
  const utf8 = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  try { return { text: decodeCharset(utf8, 'utf-8'), charset: 'utf-8' }; }
  catch { return { text: decodeCharset(bytes, 'windows-1252'), charset: 'windows-1252' }; }
}
