export type UrlMode = 'encode' | 'decode';
/** component = encodeURIComponent; full = encodeURI; form = form-urlencoded (+ for space). */
export type UrlScope = 'component' | 'full' | 'form';

function asUriError(failure: unknown): Error {
  if (failure instanceof URIError) {
    return new Error('Invalid percent-encoding or malformed UTF-8 escape sequence.');
  }
  return failure instanceof Error ? failure : new Error('URL conversion failed.');
}

export function encodeUrl(input: string, scope: UrlScope): string {
  try {
    if (scope === 'full') return encodeURI(input);
    const encoded = encodeURIComponent(input);
    return scope === 'form' ? encoded.replace(/%20/g, '+') : encoded;
  } catch (failure) {
    throw asUriError(failure);
  }
}

export function decodeUrl(input: string, scope: UrlScope): string {
  try {
    if (scope === 'full') return decodeURI(input);
    const prepared = scope === 'form' ? input.replace(/\+/g, ' ') : input;
    return decodeURIComponent(prepared);
  } catch (failure) {
    throw asUriError(failure);
  }
}

export function convertUrl(input: string, mode: UrlMode, scope: UrlScope): string {
  return mode === 'encode' ? encodeUrl(input, scope) : decodeUrl(input, scope);
}
