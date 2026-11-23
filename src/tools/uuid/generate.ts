import { md5 } from './md5.ts';

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
export const MAX_UUID_COUNT = 100;
/** Gregorian UUID epoch offset in 100-ns ticks (15 Oct 1582 → Unix epoch). */
const GREGORIAN_OFFSET = 122192928000000000n;

export const uuidNamespaces = {
  dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
} as const;

/** Generatable forms from RFC 9562. v2 is DCE-only (out of scope); v8 has no standard algorithm. */
export type UuidVersion = 'nil' | 'max' | 'v1' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7';
export type NamespaceId = keyof typeof uuidNamespaces | 'custom';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUuidBytes(value: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  if (!UUID_RE.test(normalized)) throw new Error('Enter a valid namespace UUID.');
  const hex = normalized.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function formatUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-'
    + hex.slice(16, 20) + '-' + hex.slice(20);
}

function setVersionVariant(bytes: Uint8Array, version: number) {
  bytes[6] = (bytes[6] & 0x0f) | (version << 4);
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
}

function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

function gregorianTime(now = Date.now()): bigint {
  return BigInt(now) * 10000n + GREGORIAN_OFFSET;
}

function fillClockAndNode(bytes: Uint8Array, random = randomBytes) {
  const entropy = random(8);
  bytes[8] = entropy[0];
  bytes[9] = entropy[1];
  bytes.set(entropy.subarray(2, 8), 10);
  bytes[10] |= 0x01;
}

export function generateNil(): string {
  return NIL_UUID;
}

export function generateMax(): string {
  return MAX_UUID;
}

export function generateV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = randomBytes(16);
  setVersionVariant(bytes, 4);
  return formatUuid(bytes);
}

/** Time-based UUID. Uses a random multicast node when no MAC is available. */
export function generateV1(now = Date.now(), random = randomBytes): string {
  const uuidTime = gregorianTime(now);
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Number(uuidTime & 0xffff_ffffn));
  view.setUint16(4, Number((uuidTime >> 32n) & 0xffffn));
  view.setUint16(6, Number((uuidTime >> 48n) & 0x0fffn));
  fillClockAndNode(bytes, random);
  setVersionVariant(bytes, 1);
  return formatUuid(bytes);
}

/** Reordered time-based UUID for better DB locality (RFC 9562 §5.6). */
export function generateV6(now = Date.now(), random = randomBytes): string {
  const uuidTime = gregorianTime(now) & 0xfff_ffff_ffff_ffffn;
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Number(uuidTime >> 28n));
  view.setUint16(4, Number((uuidTime >> 12n) & 0xffffn));
  view.setUint16(6, Number(uuidTime & 0xfffn));
  fillClockAndNode(bytes, random);
  setVersionVariant(bytes, 6);
  return formatUuid(bytes);
}

/** Unix-ms time-ordered UUID (RFC 9562 §5.7). `seq` fills rand_a for same-ms batches. */
export function generateV7(now = Date.now(), seq = 0, random = randomBytes): string {
  const ms = BigInt(now) & 0xffff_ffffffffn;
  const bytes = random(16);
  bytes[0] = Number((ms >> 40n) & 0xffn);
  bytes[1] = Number((ms >> 32n) & 0xffn);
  bytes[2] = Number((ms >> 24n) & 0xffn);
  bytes[3] = Number((ms >> 16n) & 0xffn);
  bytes[4] = Number((ms >> 8n) & 0xffn);
  bytes[5] = Number(ms & 0xffn);
  const randA = seq & 0x0fff;
  setVersionVariant(bytes, 7);
  bytes[6] = (bytes[6] & 0xf0) | ((randA >> 8) & 0x0f);
  bytes[7] = randA & 0xff;
  return formatUuid(bytes);
}

function nameBytes(namespace: Uint8Array, name: string): Uint8Array {
  const encoded = new TextEncoder().encode(name);
  const joined = new Uint8Array(namespace.length + encoded.length);
  joined.set(namespace);
  joined.set(encoded, namespace.length);
  return joined;
}

export function generateV3(name: string, namespace: string): string {
  const digest = md5(nameBytes(parseUuidBytes(namespace), name));
  setVersionVariant(digest, 3);
  return formatUuid(digest);
}

export async function generateV5(name: string, namespace: string): Promise<string> {
  const payload = nameBytes(parseUuidBytes(namespace), name);
  const input = new Uint8Array(payload);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', input));
  const bytes = digest.subarray(0, 16);
  setVersionVariant(bytes, 5);
  return formatUuid(bytes);
}

export function resolveNamespace(id: NamespaceId, custom: string): string {
  if (id === 'custom') return custom.trim();
  return uuidNamespaces[id];
}

export type GenerateOptions = {
  version: UuidVersion;
  count: number;
  namespaceId: NamespaceId;
  customNamespace: string;
  name: string;
};

export async function generateUuids(options: GenerateOptions): Promise<string[]> {
  const count = Math.trunc(options.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_UUID_COUNT) {
    throw new Error('Choose a quantity between 1 and ' + MAX_UUID_COUNT + '.');
  }
  if (options.version === 'nil') return Array.from({ length: count }, () => generateNil());
  if (options.version === 'max') return Array.from({ length: count }, () => generateMax());
  if (options.version === 'v4') return Array.from({ length: count }, () => generateV4());
  if (options.version === 'v1') return Array.from({ length: count }, () => generateV1());
  if (options.version === 'v6') return Array.from({ length: count }, () => generateV6());
  if (options.version === 'v7') {
    const now = Date.now();
    return Array.from({ length: count }, (_, index) => generateV7(now, index));
  }

  const namespace = resolveNamespace(options.namespaceId, options.customNamespace);
  parseUuidBytes(namespace);
  if (!options.name) throw new Error('Enter a name for this namespace UUID.');
  if (options.version === 'v3') {
    return Array.from({ length: count }, () => generateV3(options.name, namespace));
  }
  const values: string[] = [];
  for (let i = 0; i < count; i++) values.push(await generateV5(options.name, namespace));
  return values;
}
