import { CompactSign, compactVerify, errors, importJWK, importPKCS8, importSPKI, type JWK } from 'jose';
import { bytesFromBase64, encodeBytes } from '../../shared/base64-bytes.ts';
import { decodeJwt } from './codec.ts';

export const jwtAlgorithms = [
  'HS256', 'HS384', 'HS512',
  'RS256', 'RS384', 'RS512',
  'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512',
] as const;
export type JwtAlgorithm = typeof jwtAlgorithms[number];
export type KeyFormat = 'text' | 'base64url' | 'pem-jwk';
type KeyInput = { key: string; format: KeyFormat };

export function isJwtAlgorithm(value: unknown): value is JwtAlgorithm {
  return typeof value === 'string' && jwtAlgorithms.some((algorithm) => algorithm === value);
}

function readObject(input: string, label: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(input);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch { /* An input error never echoes the user's data. */ }
  throw new Error(label + ' must be a JSON object.');
}

function checkHeader(header: Record<string, unknown>) {
  if (Object.hasOwn(header, 'crit') || (Object.hasOwn(header, 'b64') && header.b64 !== true)) {
    throw new Error('This JWT uses an unsupported protected header parameter.');
  }
}

function readSecret(input: KeyInput) {
  if (input.format === 'pem-jwk' || /-----BEGIN [A-Z ]+-----/.test(input.key)) {
    throw new Error('Enter an HMAC shared secret in the selected encoding.');
  }
  if (input.format === 'text') {
    let jwk: unknown;
    try { jwk = input.key.trimStart().startsWith('{') ? JSON.parse(input.key) : undefined; }
    catch { /* A text secret can contain braces. */ }
    if (jwk && typeof jwk === 'object' && Object.hasOwn(jwk, 'kty')) {
      throw new Error('Enter an HMAC shared secret in the selected encoding.');
    }
    return new TextEncoder().encode(input.key);
  }
  const encoded = input.key.trim();
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(encoded)) throw new Error('Enter a valid Base64URL shared secret.');
  return bytesFromBase64(encoded.replace(/-/g, '+').replace(/_/g, '/'));
}

async function importKey(input: KeyInput, algorithm: JwtAlgorithm, usage: 'sign' | 'verify') {
  if (!input.key.trim()) throw new Error('Enter a key to continue.');
  if (algorithm.startsWith('HS')) {
    const key = readSecret(input);
    const required = Number(algorithm.slice(2)) / 8;
    if (!key.length) throw new Error('Enter a shared secret to continue.');
    if (usage === 'sign' && key.length < required) {
      throw new Error(algorithm + ' signing requires a secret of at least ' + required + ' bytes.');
    }
    return { key, weakKey: key.length < required };
  }

  const encoded = input.key.trim();
  if (input.format !== 'pem-jwk') throw new Error('Select the PEM / JWK key format.');
  const purpose = usage === 'verify' ? 'public key' : 'private key';
  const expected = algorithm.startsWith('ES') ? 'EC' : 'RSA';
  if (encoded.startsWith('{')) {
    const jwk: JWK = readObject(encoded, 'JWK');
    if (jwk.kty !== expected || (jwk.alg && jwk.alg !== algorithm) ||
        (usage === 'sign' ? !jwk.d : Object.hasOwn(jwk, 'd'))) {
      throw new Error('Enter a matching ' + expected + ' ' + purpose + ' as JWK.');
    }
    try {
      return { key: await importJWK(jwk, algorithm), weakKey: false };
    } catch {
      throw new Error('The JWK ' + purpose + ' is invalid or unsupported for ' + algorithm + '.');
    }
  }

  try {
    const key = usage === 'verify'
      ? await importSPKI(encoded, algorithm)
      : await importPKCS8(encoded, algorithm);
    return { key, weakKey: false };
  } catch {
    const pem = usage === 'verify' ? 'SPKI' : 'PKCS #8';
    throw new Error('Enter a valid ' + pem + ' PEM ' + purpose + ' for ' + algorithm + '.');
  }
}

export async function signJwt(headerJson: string, payloadJson: string, algorithm: JwtAlgorithm, input: KeyInput) {
  if (!isJwtAlgorithm(algorithm)) throw new Error('Select a supported signing algorithm.');
  const header = readObject(headerJson, 'Header');
  readObject(payloadJson, 'Payload');
  checkHeader(header);
  if (Object.hasOwn(header, 'alg') && header.alg !== algorithm) {
    throw new Error('The header algorithm must match the selected algorithm.');
  }
  const { key } = await importKey(input, algorithm, 'sign');
  try {
    return await new CompactSign(new TextEncoder().encode(payloadJson))
      .setProtectedHeader({ ...header, alg: algorithm }).sign(key);
  } catch {
    throw new Error('The token could not be signed with the selected algorithm and key.');
  }
}

export async function verifyJwtSignature(token: string, algorithm: JwtAlgorithm, input: KeyInput) {
  const { header } = decodeJwt(token);
  if (!isJwtAlgorithm(algorithm) || header.alg !== algorithm) {
    throw new Error('The token algorithm must match the selected verification algorithm.');
  }
  checkHeader(header);
  const { key, weakKey } = await importKey(input, algorithm, 'verify');
  try {
    await compactVerify(token.trim(), key, { algorithms: [algorithm] });
    return { weakKey };
  } catch (error) {
    if (error instanceof errors.JWSSignatureVerificationFailed) {
      throw new Error('The signature does not match this token and key.');
    }
    throw new Error('The signature could not be verified using the selected algorithm and key.');
  }
}

export async function exampleJwt() {
  const key = encodeBytes(crypto.getRandomValues(new Uint8Array(32)), 'url-safe');
  const token = await signJwt('{"typ":"JWT"}', '{"sub":"example-user","role":"demo"}', 'HS256', { key, format: 'base64url' });
  return { token, key };
}
