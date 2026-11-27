import forge from 'node-forge';
import { maxPasswordLength, maxPkcs12Bytes } from './limits.ts';

export type PemEntry = { pem: string; alias?: string };
export type Pkcs12Contents = { certificates: PemEntry[]; privateKeys: PemEntry[] };
export type ExtractError = 'invalid' | 'password' | 'unsupported' | 'empty' | 'size';
export type ExtractResult = { contents: Pkcs12Contents } | { error: ExtractError };

function pemFromAsn1(type: string, value: forge.asn1.Asn1) {
  return forge.pem.encode({ type, body: forge.asn1.toDer(value).getBytes() });
}

function readPfx(asn1: forge.asn1.Asn1, password: string) {
  try {
    return forge.pkcs12.pkcs12FromAsn1(asn1, true, password);
  } catch (error) {
    // PKCS#12 implementations have used two encodings for an empty password.
    if (password === '' && error instanceof Error && error.message.includes('MAC could not be verified')) {
      return forge.pkcs12.pkcs12FromAsn1(asn1, true);
    }
    throw error;
  }
}

export function extractPkcs12(bytes: Uint8Array<ArrayBuffer>, password: string): ExtractResult {
  if (bytes.length === 0) return { error: 'invalid' };
  if (bytes.length > maxPkcs12Bytes || password.length > maxPasswordLength) return { error: 'size' };
  const certificates: PemEntry[] = [];
  const privateKeys: PemEntry[] = [];
  const { certBag, keyBag, pkcs8ShroudedKeyBag } = forge.pki.oids;

  try {
    const asn1 = forge.asn1.fromDer(forge.util.createBuffer(bytes), true);
    if (!Array.isArray(asn1.value) || asn1.value.length < 2) return { error: 'invalid' };
    if (asn1.value.length === 2) return { error: 'unsupported' };
    const pfx = readPfx(asn1, password);
    for (const { safeBags } of pfx.safeContents) {
      for (const bag of safeBags) {
        const alias: unknown = bag.attributes.friendlyName?.[0];
        const name = typeof alias === 'string' ? alias : undefined;
        if (bag.type === certBag) {
          const pem = bag.cert ? forge.pki.certificateToPem(bag.cert) : pemFromAsn1('CERTIFICATE', bag.asn1);
          certificates.push({ pem, alias: name });
        } else if (bag.type === keyBag || bag.type === pkcs8ShroudedKeyBag) {
          const asn1 = bag.key ? forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(bag.key)) : bag.asn1;
          privateKeys.push({ pem: pemFromAsn1('PRIVATE KEY', asn1), alias: name });
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/MAC could not be verified|wrong password/i.test(message)) return { error: 'password' };
    if (/unsupported|not supported|only .* supported/i.test(message)) return { error: 'unsupported' };
    return { error: 'invalid' };
  }

  return certificates.length || privateKeys.length
    ? { contents: { certificates, privateKeys } }
    : { error: 'empty' };
}
