import 'reflect-metadata';
import { DNS, Name, Pkcs10CertificateRequestGenerator, SubjectAlternativeNameExtension } from '@peculiar/x509';
import { encodeBytes } from '../../shared/base64-bytes.ts';

export const subjectFields = ['CN', 'O', 'OU', 'L', 'ST', 'C'] as const;
export const rsaKeySizes = [2048, 3072, 4096] as const;
export type RsaKeySize = typeof rsaKeySizes[number];
export type Subject = Partial<Record<typeof subjectFields[number], string>>;

export function dnsName(input: string) {
  const name = input.trim().toLowerCase();
  const host = name.startsWith('*.') ? name.slice(2) : name;
  const label = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (name.length > 253 || !host.split('.').every((part) => label.test(part)) ||
      /^\d+(?:\.\d+)*$/.test(host)) return undefined;
  return name;
}

export async function generateCsr(subject: Subject, dnsNames: readonly string[], bits: RsaKeySize) {
  const keys = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: bits,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  const name = new Name(subjectFields.flatMap((field) => {
    const value = subject[field]?.trim();
    return value ? [{ [field]: [value] }] : [];
  }));
  const request = await Pkcs10CertificateRequestGenerator.create({
    name,
    keys,
    signingAlgorithm: { name: 'RSASSA-PKCS1-v1_5' },
    extensions: [new SubjectAlternativeNameExtension(dnsNames.map((value) => ({ type: DNS, value }) as const))],
  }, crypto);
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keys.privateKey));
  const body = encodeBytes(der).match(/.{1,64}/g)!.join('\n');
  return { csr: request.toString('pem'), privateKey: '-----BEGIN PRIVATE KEY-----\n' + body + '\n-----END PRIVATE KEY-----\n' };
}
