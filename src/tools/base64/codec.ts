import { bytesFromBase64, encodeBytes, type Base64Alphabet } from '../../shared/base64-bytes.ts';
export { encodeBytes, type Base64Alphabet } from '../../shared/base64-bytes.ts';

const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
export function encodeBase64(text: string, alphabet: Base64Alphabet = 'standard'): string {
  return encodeBytes(new TextEncoder().encode(text), alphabet);
}

export function decodeBytes(text: string, alphabet: Base64Alphabet | 'auto'): Uint8Array<ArrayBuffer> {
  let payload = text.trim();
  if (/^data:/i.test(payload)) {
    const comma = payload.indexOf(',');
    if (comma < 0 || !/;base64$/i.test(payload.slice(0, comma))) {
      throw new Error('Enter a Base64-encoded data URL.');
    }
    payload = payload.slice(comma + 1);
  }
  payload = payload.replace(/[\t\n\r ]/g, '');
  if (alphabet === 'url-safe' && /[+/]/.test(payload)) throw new Error('Invalid Base64URL characters.');
  if (alphabet === 'auto' && /[-_]/.test(payload) && /[+/]/.test(payload)) {
    throw new Error('Base64 alphabets cannot be mixed.');
  }
  if (alphabet !== 'standard') {
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
  }
  return bytesFromBase64(payload);
}

export function decodeBase64(text: string, alphabet: Base64Alphabet = 'standard'): string {
  const bytes = decodeBytes(text, alphabet);
  try {
    return decoder.decode(bytes);
  } catch {
    throw new Error('The decoded bytes are not valid UTF-8.');
  }
}
