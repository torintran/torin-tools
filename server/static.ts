import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createGateway } from './gateway.ts';
import { GATEWAY_PREFIX } from '../src/tools/postman/routes.ts';

const shellFiles = new Set([
  'index.html', 'sw.js', 'downloads.json', 'version.json', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'JOSE-LICENSE.txt',
  'Torin_Favicon.svg', 'Torin_Favicon_Round.svg', 'Torin_Logo_Ngang.svg', 'Torin_Logo_Ngang_Nen_Toi.svg',
  'MANTINE-LICENSE.txt', 'LUCIDE-LICENSE.txt', 'BE-VIETNAM-PRO-LICENSE.txt',
  'PECULIAR-X509-LICENSE.txt', 'REFLECT-METADATA-LICENSE.txt',
  'OUI-DATA-LICENSE.txt', 'JSDIFF-LICENSE.txt',
]);
const asset = /^assets\/[a-zA-Z0-9_.-]+\.(?:js|css|png|webp|woff2?)$/;
const download = /^downloads\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:zip|exe|AppImage|dmg|txt)$/;
const content: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip',
};

export function createStaticServer(root = resolve('dist'), gateway?: { origin: string; upstreamFetch?: typeof fetch }) {
  const relay = gateway && createGateway(gateway.origin, gateway.upstreamFetch);
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; connect-src 'self' https://api.github.com https://api.postman.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    if (request.headers.authorization || request.headers['transfer-encoding'] ||
        (request.headers['content-length'] && request.headers['content-length'] !== '0')) {
      response.writeHead(400).end();
      return;
    }
    if (relay && request.method === 'GET' && request.url?.startsWith(GATEWAY_PREFIX + '/')) {
      return relay(request, response);
    }
    if (request.headers['x-api-key']) {
      response.writeHead(400).end();
      return;
    }

    const path = request.url === '/' ? 'index.html' : request.url?.slice(1) ?? '';
    if (!shellFiles.has(path) && !asset.test(path) && !download.test(path)) {
      response.writeHead(404).end();
      return;
    }

    const file = resolve(root, path);
    try {
      const details = await stat(file);
      if (!details.isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.setHeader('Content-Type', content[extname(file)] ?? 'application/octet-stream');
      response.setHeader('Cache-Control', path === 'version.json'
        ? 'no-store'
        : asset.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache');
      response.setHeader('Content-Length', details.size);
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch {
      response.writeHead(404).end();
    }
  });
}
