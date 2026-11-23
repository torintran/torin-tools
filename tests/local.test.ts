import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';
import { decodeBase64, encodeBase64 } from '../src/tools/base64/codec.ts';
import { convertText, convertFile } from '../src/tools/base64/convert.ts';
import { decodeJwt, inspectFields } from '../src/tools/jwt/codec.ts';
import { signJwt, verifyJwtSignature } from '../src/tools/jwt/signature.ts';
import {
  generateMax, generateNil, generateUuids, generateV1, generateV3, generateV4, generateV5,
  generateV6, generateV7, uuidNamespaces,
} from '../src/tools/uuid/generate.ts';
import { md5 } from '../src/tools/uuid/md5.ts';
import { lookupMac, normalizeMac } from '../src/tools/mac-address-lookup/lookup.ts';
import { convertTemperature } from '../src/tools/temperature-converter/convert.ts';

test('MAC lookup normalizes inputs and prefers the longest registered prefix', async () => {
  assert.equal(normalizeMac('C85C.E27A.BCDE'), 'C85CE27ABCDE');
  assert.equal(normalizeMac('C8:5C:E2-7A:BC:DE'), undefined);
  const result = await lookupMac('C85CE27ABCDE');
  assert.equal(result.kind, 'match');
  if (result.kind === 'match') assert.equal(result.prefix, 'C85CE27');
  assert.deepEqual(await lookupMac('021122334455'), { kind: 'local' });
  assert.deepEqual(await lookupMac('011122334455'), { kind: 'multicast' });
});

test('temperature converter handles reference points and rejects values below absolute zero', () => {
  assert.deepEqual(convertTemperature('-459.67', 'F'), { F: -459.67, C: -273.15, K: 0 });
  assert.equal(convertTemperature('100', 'C')?.K, 373.15);
  assert.equal(convertTemperature('32', 'F')?.C, 0);
  assert.equal(convertTemperature('-0.01', 'K'), undefined);
  assert.equal(convertTemperature('0x20', 'C'), undefined);
});
import { convertUrl } from '../src/tools/url-encoder/codec.ts';
import {
  convertDateTime, formatExcelSerial, formatMongoObjectId, type DateOutputId,
} from '../src/tools/date-time-converter/convert.ts';
import { formatJson, stripJsonc } from '../src/tools/json-formatter/format.ts';
import { removeWhitespace } from '../src/tools/whitespace-remover/strip.ts';

function dateOut(input: string, format: Parameters<typeof convertDateTime>[1], id: DateOutputId) {
  return convertDateTime(input, format).outputs.find((row) => row.id === id)?.value;
}

test('Base64 handles character sets, separate lines and MIME wrapping', () => {
  const options = { alphabet: 'standard', lines: 'each', newline: 'crlf' } as const;
  assert.equal(convertText('€\n\nCafé', { ...options, mode: 'encode', charset: 'windows-1252' }).text, 'gA==\r\n\r\nQ2Fm6Q==');
  assert.equal(convertText('gA==\n\nQ2Fm6Q==', { ...options, mode: 'decode', charset: 'windows-1252' }).text, '€\r\n\r\nCafé');
  assert.equal(convertText('/P9hAA==', { ...options, mode: 'decode', charset: 'auto', lines: 'whole' }).charset, 'windows-1252');
  const wrapped = convertText('x'.repeat(100), { ...options, mode: 'encode', lines: 'mime', charset: 'utf-8' }).text;
  assert.deepEqual(wrapped.split('\r\n').map((line) => line.length), [76, 60]);
  assert.equal(decodeBase64(wrapped), 'x'.repeat(100));
  assert.throws(() => convertText('Zg==\ninvalid!', { ...options, mode: 'decode', charset: 'utf-8' }), /Line 2/);
  const vietnamese = convertText('Tiếng Việt, ậ', { ...options, mode: 'encode', charset: 'windows-1258' }).text;
  assert.equal(convertText(vietnamese, { ...options, mode: 'decode', charset: 'windows-1258' }).text, 'Tiếng Việt, ậ');
});

test('Base64 file conversion preserves binary bytes and line endings', async () => {
  const original = new Uint8Array([0, 255, 10, 0, 5, 13, 10, 254]);
  const options = { alphabet: 'url-safe', lines: 'whole', newline: 'keep' } as const;
  const encoded = convertFile(original, { ...options, mode: 'encode' });
  const decoded = convertFile(new Uint8Array(await encoded.arrayBuffer()), { ...options, mode: 'decode' });
  assert.deepEqual(new Uint8Array(await decoded.arrayBuffer()), original);
  const wrapped = convertFile(original, { ...options, lines: 'each', mode: 'encode' });
  const joined = convertFile(new Uint8Array(await wrapped.arrayBuffer()), { ...options, lines: 'each', mode: 'decode' });
  assert.deepEqual(new Uint8Array(await joined.arrayBuffer()), original);
});

test('Base64 round trips UTF-8, preserves BOM and rejects corrupt input', () => {
  const input = '\uFEFFTiếng Việt 🐉';
  assert.equal(decodeBase64(encodeBase64(input)), input);
  for (const invalid of ['Z?', 'Z', 'ZZ==', '/w==']) {
    assert.throws(() => decodeBase64(invalid), /Base64|UTF-8/);
  }
});

test('Base64 can use the URL-safe alphabet and read Base64 data URLs as text', () => {
  assert.equal(encodeBase64('🦄', 'url-safe'), '8J-mhA');
  assert.equal(decodeBase64('8J-mhA==', 'url-safe'), '🦄');
  assert.equal(decodeBase64('DATA:text/plain;charset=utf-8;base64,8J+mhA=='), '🦄');
  assert.throws(() => decodeBase64('8J+mhA==', 'url-safe'), /Base64/);
  assert.throws(() => decodeBase64('data:text/plain,SGVsbG8='), /Base64/);
});

test('JWT reads signed objects and reports malformed and encrypted tokens', () => {
  const part = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const header = part({ alg: 'HS256' });
  const payload = part({ sub: 'Việt', exp: 1700000000 });
  const decoded = decodeJwt(header + '.' + payload + '.YQ');
  assert.equal(decoded.payload.sub, 'Việt');
  assert.equal(decoded.dates.exp, '2023-11-14T22:13:20.000Z');
  assert.throws(() => decodeJwt('a.b.c.d.e'), /Encrypted/);
  assert.throws(() => decodeJwt(header + '.' + payload + '.'), /signed JWT/);
  assert.throws(() => decodeJwt(header + '.bad.YQ'), /JSON/);
});

test('JWT shows registered field meanings, array audiences and UTC dates', () => {
  const part = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const decoded = decodeJwt(
    part({ typ: 'JWT', alg: 'RS256' }) + '.' +
    part({ aud: ['demo-api', 'demo-app'], exp: 1700000000, constructor: 'custom-claim' }) + '.YQ',
  );
  const fields = inspectFields('payload', decoded);
  assert.deepEqual(fields.find(({ name }) => name === 'aud'), {
    name: 'aud', label: 'Audience', value: ['demo-api', 'demo-app'], detail: undefined,
  });
  assert.equal(fields.find(({ name }) => name === 'exp')?.detail, '2023-11-14T22:13:20.000Z');
  assert.equal(fields.find(({ name }) => name === 'constructor')?.label, undefined);
  assert.equal(inspectFields('header', decoded).find(({ name }) => name === 'alg')?.detail, 'RSA PKCS#1 v1.5 with SHA-256');
});

test('JWT signing matches an independent HMAC and verifies only the selected algorithm and original bytes', async () => {
  const key = 'test-only-key-'.repeat(4);
  const token = await signJwt('{"typ":"JWT"}', '{"sub":"Việt","exp":1}', 'HS256', { key, format: 'text' });
  const [header, payload, signature] = token.split('.');
  assert.equal(signature, createHmac('sha256', key).update(header + '.' + payload).digest('base64url'));
  const encodedKey = Buffer.from(key).toString('base64url');
  assert.equal((await verifyJwtSignature(token, 'HS256', { key: encodedKey, format: 'base64url' })).weakKey, false);
  await assert.rejects(verifyJwtSignature(token, 'HS512', { key, format: 'text' }), /algorithm/);
  const edited = header + '.' + Buffer.from('{"sub":"other"}').toString('base64url') + '.' + signature;
  await assert.rejects(verifyJwtSignature(edited, 'HS256', { key, format: 'text' }), /does not match/);
  const shortSignature = createHmac('sha256', 'short').update(header + '.' + payload).digest('base64url');
  assert.equal((await verifyJwtSignature(header + '.' + payload + '.' + shortSignature, 'HS256',
    { key: 'short', format: 'text' })).weakKey, true);
  await assert.rejects(signJwt('{}', '{}', 'HS256', { key: 'short', format: 'text' }), /32 bytes/);
  await assert.rejects(signJwt('{"crit":["b64"],"b64":false}', '{}', 'HS256', { key, format: 'text' }), /header parameter/);
});

test('JWT signs with a local RSA private key and verifies using public PEM and JWK keys', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pkcs8 = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
  const spki = publicKey.export({ format: 'pem', type: 'spki' }).toString();
  const token = await signJwt('{}', '{"aud":["demo"]}', 'RS256', { key: pkcs8, format: 'pem-jwk' });
  await verifyJwtSignature(token, 'RS256', { key: spki, format: 'pem-jwk' });
  await verifyJwtSignature(token, 'RS256', { key: JSON.stringify(publicKey.export({ format: 'jwk' })), format: 'pem-jwk' });
  const pss = await signJwt('{}', '{}', 'PS256', { key: pkcs8, format: 'pem-jwk' });
  await verifyJwtSignature(pss, 'PS256', { key: spki, format: 'pem-jwk' });
  await assert.rejects(verifyJwtSignature(token, 'RS256', { key: pkcs8, format: 'pem-jwk' }), /public key/);
  await assert.rejects(signJwt('{}', '{}', 'HS256', { key: spki, format: 'text' }), /shared secret/);
});

test('JWT signs and verifies ECDSA tokens with the selected curve', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const privateJwk = JSON.stringify(privateKey.export({ format: 'jwk' }));
  const publicJwk = JSON.stringify(publicKey.export({ format: 'jwk' }));
  const token = await signJwt('{}', '{"sub":"demo"}', 'ES256', { key: privateJwk, format: 'pem-jwk' });
  await verifyJwtSignature(token, 'ES256', { key: publicJwk, format: 'pem-jwk' });
  await assert.rejects(signJwt('{}', '{}', 'ES384', { key: privateJwk, format: 'pem-jwk' }), /invalid or unsupported/);
});

test('Date-time converter maps ISO, Unix, RFC 7231, Mongo ObjectId and Excel formats', () => {
  assert.equal(dateOut('0', 'unix-s', 'unix-ms'), '0');
  assert.equal(dateOut('0', 'unix-s', 'rfc7231'), 'Thu, 01 Jan 1970 00:00:00 GMT');
  assert.equal(dateOut('0', 'unix-s', 'utc'), 'Thu, 01 Jan 1970 00:00:00 GMT');
  assert.equal(dateOut('1704067200', 'unix-s', 'unix-ms'), '1704067200000');
  assert.equal(dateOut('2024-01-01T00:00:00.000Z', 'rfc3339', 'unix-s'), '1704067200');
  assert.equal(convertDateTime('1704067200000').detected, 'unix-ms');
  assert.equal(dateOut('1704067200', 'unix-s', 'mongo'), '659200800000000000000000');
  assert.equal(formatMongoObjectId(new Date(1_704_067_200_000)), '659200800000000000000000');
  assert.equal(dateOut('659200800000000000000000', 'mongo', 'unix-s'), '1704067200');
  const excel = formatExcelSerial(new Date(Date.UTC(2024, 0, 1)));
  assert.equal(excel, '45292');
  assert.equal(dateOut(excel, 'excel', 'unix-s'), '1704067200');
  assert.match(dateOut('2024-01-01 00:00:00', 'iso9075', 'iso9075') ?? '', /00:00:00$/);
  assert.throws(() => convertDateTime(''), /date-time/i);
  assert.throws(() => convertDateTime('not-a-date'), /Unrecognized|valid/i);
});

test('Whitespace remover strips spaces, tabs, newlines and NBSP', () => {
  assert.equal(removeWhitespace('a b\tc\nd'), 'abcd');
  assert.equal(removeWhitespace('a\u00A0b'), 'ab');
  assert.equal(removeWhitespace('abc'), 'abc');
  assert.equal(removeWhitespace('  \n\t  '), '');
  assert.equal(removeWhitespace(''), '');
});

test('JSON formatter pretty-prints, minifies and rejects invalid input', () => {
  assert.equal(formatJson('{"a":1,"b":[true,null]}', 'minify'), '{"a":1,"b":[true,null]}');
  assert.equal(formatJson('{ "a" : 1 }', 'format', '2'), '{\n  "a": 1\n}');
  assert.equal(formatJson('{"a":1}', 'format', '4'), '{\n    "a": 1\n}');
  assert.equal(formatJson('{"a":1}', 'format', 'tab'), '{\n\t"a": 1\n}');
  assert.equal(formatJson('"hi"', 'format', '2'), '"hi"');
  assert.throws(() => formatJson('', 'format'), /Enter JSON/i);
  assert.throws(() => formatJson('{', 'minify'), /JSON|Unexpected|position/i);
  assert.throws(() => formatJson('{"a":1,}', 'minify'), /JSON|Unexpected|position/i);
  assert.throws(() => formatJson('{"a":1}//x', 'minify'), /JSON|Unexpected|position/i);
  assert.equal(
    formatJson('{\n  // keep\n  "a": 1, /* trail */\n  "u": "http://x",\n}\n', 'minify', '2', { jsonc: true }),
    '{"a":1,"u":"http://x"}',
  );
  assert.equal(formatJson('[1, 2,]', 'format', '2', { jsonc: true }), '[\n  1,\n  2\n]');
  assert.match(stripJsonc('{"a":1,}//end'), /\{"a":1\}/);
  assert.throws(() => formatJson('{"a": /*', 'minify', '2', { jsonc: true }), /Unterminated block comment/i);
});

test('URL encoder distinguishes component, full URI and form scopes and rejects bad escapes', () => {
  assert.equal(convertUrl('a b', 'encode', 'component'), 'a%20b');
  assert.equal(convertUrl('a%20b', 'decode', 'component'), 'a b');
  assert.equal(convertUrl('€', 'encode', 'component'), '%E2%82%AC');
  assert.equal(convertUrl('https://example.com/a b?x=1#y', 'encode', 'full'), 'https://example.com/a%20b?x=1#y');
  assert.equal(convertUrl('a b&c=1', 'encode', 'form'), 'a+b%26c%3D1');
  assert.equal(convertUrl('a+b%26c%3D1', 'decode', 'form'), 'a b&c=1');
  assert.throws(() => convertUrl('%zz', 'decode', 'component'), /percent-encoding|malformed/i);
  assert.throws(() => convertUrl('\uD800', 'encode', 'component'), /percent-encoding|malformed/i);
});

test('UUID generator matches RFC name-based vectors and local NIL/Max/v1/v4/v6/v7 rules', async () => {
  assert.equal(Buffer.from(md5(new TextEncoder().encode(''))).toString('hex'), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(generateNil(), '00000000-0000-0000-0000-000000000000');
  assert.equal(generateMax(), 'ffffffff-ffff-ffff-ffff-ffffffffffff');
  assert.equal(generateV3('www.example.com', uuidNamespaces.dns), '5df41881-3aed-3515-88a7-2f4a814cf09e');
  assert.equal(await generateV5('www.example.com', uuidNamespaces.dns), '2ed6657d-e927-568b-95e1-2665a8aea6a2');
  const v4 = generateV4();
  assert.match(v4, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const fixed = (size: number) => new Uint8Array(size).fill(0x22);
  assert.match(generateV1(0, fixed), /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.match(generateV6(0, fixed), /^[0-9a-f]{8}-[0-9a-f]{4}-6[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.match(generateV7(1_704_067_200_000, 0xabc, fixed), /^[0-9a-f]{8}-[0-9a-f]{4}-7abc-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const batch = await generateUuids({
    version: 'v7', count: 3, namespaceId: 'dns', customNamespace: '', name: '',
  });
  assert.equal(batch.length, 3);
  assert.notEqual(batch[0], batch[1]);
  await assert.rejects(generateUuids({
    version: 'v5', count: 1, namespaceId: 'dns', customNamespace: '', name: '',
  }), /name/);
});
