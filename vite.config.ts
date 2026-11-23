import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'compact-oui-data',
    enforce: 'pre',
    transform(source, id) {
      if (!id.endsWith('/node_modules/oui-data/index.json')) return;
      const records: Record<string, string> = JSON.parse(source);
      for (const [prefix, record] of Object.entries(records)) records[prefix] = record.split('\n', 1)[0];
      return JSON.stringify(records);
    },
  }],
  server: { host: 'localhost', port: 5173, strictPort: true },
});
