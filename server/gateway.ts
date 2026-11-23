import type { IncomingMessage, ServerResponse } from 'node:http';
import { GATEWAY_PREFIX, MAX_RESPONSE_BYTES, POSTMAN_ORIGIN, REQUEST_TIMEOUT, upstreamRoute, validApiKey } from '../src/tools/postman/routes.ts';
import { version } from '../package.json';

export function createGateway(origin: string, upstreamFetch: typeof fetch = fetch) {
  let active = 0;
  return async (request: IncomingMessage, response: ServerResponse) => {
    const end = (status: number) => { response.writeHead(status).end(); };
    if (request.headers['sec-fetch-site'] === 'cross-site' ||
        (request.headers.origin && request.headers.origin !== origin)) return end(403);
    if (request.url === GATEWAY_PREFIX + '/status') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end('{"enabled":true}');
      return;
    }
    const route = upstreamRoute((request.url ?? '').slice(GATEWAY_PREFIX.length));
    if (!route) return end(404);
    const key = request.headers['x-api-key'];
    if (typeof key !== 'string' || !validApiKey(key)) return end(401);
    if (active >= 16) {
      response.setHeader('Retry-After', '2');
      return end(429);
    }

    const abort = new AbortController();
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT);
    const close = () => abort.abort();
    response.once('close', close);
    active++;
    try {
      const upstream = await upstreamFetch(POSTMAN_ORIGIN + route, {
        redirect: 'error', cache: 'no-store', signal: AbortSignal.any([abort.signal, timeout]),
        headers: { 'X-Api-Key': key, 'User-Agent': 'TorinTools/' + version, Accept: 'application/json' },
      });
      if (!upstream.ok) {
        await upstream.body?.cancel();
        const retryAfter = upstream.headers.get('retry-after');
        if (upstream.status === 429 && retryAfter) response.setHeader('Retry-After', retryAfter);
        return end(upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502);
      }
      if (!upstream.headers.get('content-type')?.includes('application/json') || !upstream.body) {
        await upstream.body?.cancel();
        return end(502);
      }
      if (Number(upstream.headers.get('content-length')) > MAX_RESPONSE_BYTES) {
        await upstream.body.cancel();
        return end(413);
      }
      const chunks: Buffer[] = [];
      let size = 0;
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_RESPONSE_BYTES) {
            await reader.cancel();
            return end(413);
          }
          chunks.push(Buffer.from(value));
        }
      } finally {
        reader.releaseLock();
      }
      if (!response.destroyed) {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(Buffer.concat(chunks, size));
      }
    } catch {
      if (!response.destroyed) end(timeout.aborted ? 504 : 502);
    } finally {
      active--;
      response.off('close', close);
    }
  };
}
