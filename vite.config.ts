import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
        'svelte/index': resolve(__dirname, 'src/svelte/index.ts'),
        'persist/index': resolve(__dirname, 'src/persist/index.ts'),
        'middleware/index': resolve(__dirname, 'src/middleware/index.ts'),
        'debug/index': resolve(__dirname, 'src/debug/index.ts'),
        'helpers/index': resolve(__dirname, 'src/helpers/index.ts'),
        'devtools/index': resolve(__dirname, 'src/devtools/index.ts'),
        'async/index': resolve(__dirname, 'src/async/index.ts'),
        'server/index': resolve(__dirname, 'src/server/index.ts'),
        'ssr/index': resolve(__dirname, 'src/ssr/index.ts'),
        'adapters/express': resolve(__dirname, 'src/adapters/express.ts'),
        'adapters/fastify': resolve(__dirname, 'src/adapters/fastify.ts'),
        'adapters/next': resolve(__dirname, 'src/adapters/next.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'vue'],
    },
  },
});
