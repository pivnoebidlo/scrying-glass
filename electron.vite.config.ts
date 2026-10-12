import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
    plugins: [svelte()],
    build: {
      rollupOptions: {
        input: {
          control: resolve('src/renderer/control/index.html'),
          display: resolve('src/renderer/display/index.html'),
        },
      },
    },
  },
});
