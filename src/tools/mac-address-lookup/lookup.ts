export function normalizeMac(input: string) {
  const text = input.trim();
  const plain = /^(?:[0-9a-f]{6}|[0-9a-f]{12})$/i;
  const pairs = /^[0-9a-f]{2}([:-])[0-9a-f]{2}(?:\1[0-9a-f]{2}){1,4}$/i;
  const dotted = /^(?:[0-9a-f]{4}\.){2}[0-9a-f]{4}$/i;
  if (!plain.test(text) && !pairs.test(text) && !dotted.test(text)) return;
  const hex = text.replace(/[:.\-]/g, '').toUpperCase();
  return hex.length === 6 || hex.length === 12 ? hex : undefined;
}

export async function lookupMac(hex: string) {
  const firstOctet = Number.parseInt(hex.slice(0, 2), 16);
  if (firstOctet & 1) return { kind: 'multicast' } as const;
  if (firstOctet & 2) return { kind: 'local' } as const;
  const { default: data } = await import('oui-data', { with: { type: 'json' } });
  for (const length of [9, 7, 6]) {
    if (hex.length < length) continue;
    const prefix = hex.slice(0, length);
    const entry: string | undefined = (data as Record<string, string>)[prefix];
    const organization = entry?.split('\n', 1)[0];
    if (organization && organization !== 'IEEE Registration Authority') {
      return { kind: 'match', prefix, organization } as const;
    }
  }
  return { kind: 'missing' } as const;
}
