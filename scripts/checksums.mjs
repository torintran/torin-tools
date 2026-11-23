import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const folder = process.argv[2] ?? 'artifacts';
const files = (await readdir(folder, { withFileTypes: true }))
  .filter((file) => file.isFile() && /\.(?:zip|exe|AppImage|dmg)$/.test(file.name))
  .map((file) => file.name).sort();
if (!files.length) throw new Error('No packages found in ' + folder);
const entries = [];
for (const file of files) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(join(folder, file))) hash.update(chunk);
  const sha256 = hash.digest('hex');
  entries.push({ name: file, file: 'downloads/' + file, sha256 });
}
await writeFile(join(folder, 'SHA256SUMS.txt'), entries.map(({ name, sha256 }) => sha256 + '  ' + name).join('\n') + '\n');
if (process.argv.includes('--portal')) {
  await writeFile(join(folder, '..', 'downloads.json'), JSON.stringify(entries.filter(({ name }) => !name.startsWith('torin-web-')), null, 2) + '\n');
}
