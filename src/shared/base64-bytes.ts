const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export type Base64Alphabet = 'standard' | 'url-safe';

export function encodeBytes(bytes: Uint8Array, variant: Base64Alphabet = 'standard'): string {
  const blocks: string[] = [];
  // Multiples of three keep padding out of the middle of the result.
  const blockSize = 24 * 1024;
  for (let index = 0; index < bytes.length; index += blockSize) {
    const block = btoa(String.fromCharCode(...bytes.subarray(index, index + blockSize)));
    blocks.push(variant === 'url-safe'
      ? block.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      : block);
  }
  return blocks.join('');
}

export function bytesFromBase64(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 === 1 ||
      (value.includes('=') && value.length % 4 !== 0)) {
    throw new Error('Invalid Base64 input.');
  }
  const length = value.length - (value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0);
  const remainder = length % 4;
  const unusedBits = remainder === 2 ? 15 : remainder === 3 ? 3 : 0;
  if (unusedBits && (alphabet.indexOf(value.charAt(length - 1)) & unusedBits) !== 0) {
    throw new Error('Invalid Base64 padding bits.');
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
