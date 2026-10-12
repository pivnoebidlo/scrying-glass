import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
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
