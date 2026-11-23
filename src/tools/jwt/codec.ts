import { bytesFromBase64 } from '../../shared/base64-bytes.ts';

const decoder = new TextDecoder('utf-8', { fatal: true });

function jwtBytes(segment: string) {
  return bytesFromBase64(segment.replace(/-/g, '+').replace(/_/g, '/'));
}

function jwtObject(segment: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(decoder.decode(jwtBytes(segment)));
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    // Keep token contents out of errors.
  }
  throw new Error('JWT header and payload must contain valid JSON objects.');
}

export function decodeJwt(token: string) {
  const segments = token.trim().split('.');
  if (segments.length === 5) throw new Error('Encrypted JWT (JWE) is not supported.');
  if (segments.length !== 3 || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
    throw new Error('Enter a signed JWT with three Base64URL segments.');
  }
  const header = jwtObject(segments[0]);
  const payload = jwtObject(segments[1]);
  if (typeof header.alg !== 'string' || !header.alg || header.alg === 'none') {
    throw new Error('Enter a signed JWT with a signing algorithm.');
  }
  jwtBytes(segments[2]);
  const dates: Record<string, string> = {};
  for (const claim of ['exp', 'nbf', 'iat']) {
    if (!Object.hasOwn(payload, claim)) continue;
    const value = payload[claim];
    const date = new Date(typeof value === 'number' ? value * 1000 : NaN);
    dates[claim] = Number.isNaN(date.getTime()) ? 'Invalid NumericDate' : date.toISOString();
  }
  return { header, payload, dates };
}

const headerLabels = new Map([
  ['alg', 'Signature algorithm'],
  ['typ', 'Token type'],
  ['cty', 'Content type'],
  ['kid', 'Key identifier'],
]);

const payloadLabels = new Map([
  ['iss', 'Issuer'],
  ['sub', 'Subject'],
  ['aud', 'Audience'],
  ['exp', 'Expires at'],
  ['nbf', 'Valid from'],
  ['iat', 'Issued at'],
  ['jti', 'Token identifier'],
]);

const algorithms = new Map([
  ['HS256', 'HMAC with SHA-256'],
  ['HS384', 'HMAC with SHA-384'],
  ['HS512', 'HMAC with SHA-512'],
  ['RS256', 'RSA PKCS#1 v1.5 with SHA-256'],
  ['RS384', 'RSA PKCS#1 v1.5 with SHA-384'],
  ['RS512', 'RSA PKCS#1 v1.5 with SHA-512'],
  ['PS256', 'RSA-PSS with SHA-256'],
  ['PS384', 'RSA-PSS with SHA-384'],
  ['PS512', 'RSA-PSS with SHA-512'],
  ['ES256', 'ECDSA P-256 with SHA-256'],
  ['ES384', 'ECDSA P-384 with SHA-384'],
  ['ES512', 'ECDSA P-521 with SHA-512'],
  ['ES256K', 'ECDSA secp256k1 with SHA-256'],
  ['EdDSA', 'Edwards-curve signature'],
  ['Ed25519', 'Ed25519 signature'],
  ['Ed448', 'Ed448 signature'],
]);

export function inspectFields(section: 'header' | 'payload', decoded: ReturnType<typeof decodeJwt>) {
  const labels = section === 'header' ? headerLabels : payloadLabels;
  return Object.entries(decoded[section]).map(([name, value]) => {
    const algorithm = section === 'header' && name === 'alg' && typeof value === 'string';
    const detail = algorithm ? algorithms.get(value)
      : section === 'payload' && Object.hasOwn(decoded.dates, name) ? decoded.dates[name] : undefined;
    return { name, label: labels.get(name), value, detail };
  });
}
