import { GATEWAY_PREFIX, MAX_RESPONSE_BYTES, POSTMAN_ORIGIN, REQUEST_TIMEOUT, upstreamRoute } from './routes.ts';

export type Transport = (route: string, signal: AbortSignal) => Promise<{
  status: number;
  retryAfter: string | null;
  data?: unknown;
}>;

export class BackupError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

async function limitedBody(response: Response) {
  const length = response.headers.get('content-length');
  if (length && Number(length) > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new BackupError('A Postman response exceeds the per-item size limit.');
  }
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const reader = response.body?.getReader();
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new BackupError('A Postman response exceeds the per-item size limit.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  return new Blob(chunks);
}

export function webTransport(apiKey: string, mode: 'direct' | 'gateway'): Transport {
  return async (route, signal) => {
    const safeRoute = upstreamRoute(route);
    if (!safeRoute) throw new BackupError('Invalid Postman route.');
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT);
    const requestSignal = AbortSignal.any([signal, timeout]);
    try {
      const target = mode === 'gateway' ? GATEWAY_PREFIX : POSTMAN_ORIGIN;
      const response = await fetch(target + safeRoute, {
        headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
        credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: requestSignal,
      });
      const result = { status: response.status, retryAfter: response.headers.get('Retry-After') };
      if (!response.ok) {
        await response.body?.cancel();
        return result;
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new BackupError('Postman returned an unexpected response type.');
      }
      return { ...result, data: JSON.parse(await (await limitedBody(response)).text()) as unknown };
    } catch (error) {
      signal.throwIfAborted();
      if (timeout.aborted) throw new BackupError('The Postman request timed out.');
      if (error instanceof BackupError) throw error;
      if (error instanceof SyntaxError) throw new BackupError('Postman returned invalid JSON.');
      throw new BackupError(mode === 'gateway'
        ? 'The self-hosted gateway could not reach Postman.'
        : 'The browser could not reach Postman. Check your connection, or use a configured gateway or the Windows app.');
    }
  };
}

export function statusError(status: number) {
  const messages: Record<number, string> = {
    401: 'Postman rejected the API key.',
    403: 'Postman denied the request. Check workspace access.',
    404: 'The workspace or resource was not found.',
    413: 'A Postman response exceeds the per-item size limit.',
    429: 'Postman rate limited the backup. Wait and try again.',
    504: 'The Postman request timed out.',
  };
  return new BackupError(messages[status] ?? 'Postman request failed (HTTP ' + status + ').', status);
}
