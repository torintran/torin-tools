import { createHash } from 'node:crypto';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../dist/', import.meta.url);
const { version: appVersion } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await writeFile(new URL('version.json', root), JSON.stringify({ version: appVersion }) + '\n');
await copyFile(new URL('../node_modules/jose/LICENSE.md', import.meta.url), new URL('JOSE-LICENSE.txt', root));
await copyFile(new URL('../node_modules/@peculiar/x509/LICENSE', import.meta.url), new URL('PECULIAR-X509-LICENSE.txt', root));
await copyFile(new URL('../node_modules/reflect-metadata/LICENSE', import.meta.url), new URL('REFLECT-METADATA-LICENSE.txt', root));
await copyFile(new URL('../node_modules/oui-data/LICENSE', import.meta.url), new URL('OUI-DATA-LICENSE.txt', root));
await copyFile(new URL('../node_modules/diff/LICENSE', import.meta.url), new URL('JSDIFF-LICENSE.txt', root));
await copyFile(new URL('../node_modules/node-forge/LICENSE', import.meta.url), new URL('NODE-FORGE-LICENSE.txt', root));
await copyFile(new URL('../node_modules/@mantine/core/LICENSE', import.meta.url), new URL('MANTINE-LICENSE.txt', root));
await copyFile(new URL('../node_modules/lucide-react/LICENSE', import.meta.url), new URL('LUCIDE-LICENSE.txt', root));
await copyFile(new URL('../node_modules/@fontsource/be-vietnam-pro/LICENSE', import.meta.url), new URL('BE-VIETNAM-PRO-LICENSE.txt', root));
const assets = (await readdir(new URL('assets/', root))).filter((file) => /\.(js|css|woff2?)$/.test(file)).sort();
const lookupAssets = assets.filter((file) => /^oui-data-.*\.js$/.test(file)).map((file) => 'assets/' + file);
const files = [
  'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'Torin_Favicon.svg', 'Torin_Favicon_Round.svg', 'Torin_Logo_Ngang.svg', 'Torin_Logo_Ngang_Nen_Toi.svg',
  ...assets.map((file) => 'assets/' + file).filter((file) => !lookupAssets.includes(file)),
];
const hash = createHash('sha256');
for (const file of [...files, ...lookupAssets]) hash.update(await readFile(new URL(file, root)));
const version = 'torin-static-' + hash.digest('hex').slice(0, 16);

await writeFile(new URL('sw.js', root), `
const version = ${JSON.stringify(version)};
const files = new Set(${JSON.stringify(files)}.map((file) => new URL(file, self.registration.scope).href));
const lookupAssets = new Set(${JSON.stringify(lookupAssets)}.map((file) => new URL(file, self.registration.scope).href));
const home = new URL('.', self.registration.scope).href;
const index = new URL('index.html', home).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(version).then((cache) => cache.addAll([...files].map((file) =>
    new Request(file, { credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' })))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(async (keys) => {
    await Promise.all(keys.filter((key) => key.startsWith('torin-static-') && key !== version).map((key) => caches.delete(key)));
    await self.clients.claim();
  }));
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('x-api-key')) return;
  const target = new URL(request.url);
  target.hash = '';
  const page = request.mode === 'navigate' && (target.href === home || target.href === index);
  if (lookupAssets.has(target.href)) {
    event.respondWith(caches.open(version).then(async (cache) => {
      const cached = await cache.match(target.href);
      if (cached) return cached;
      const response = await fetch(target.href, { credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
      if (response.ok) await cache.put(target.href, response.clone());
      return response;
    }));
    return;
  }
  if (!page && !files.has(target.href)) return;
  event.respondWith(caches.open(version).then(async (cache) =>
    (await cache.match(page ? index : request)) || fetch(request)));
});
`);
