import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// pdf.js reads CMaps, standard fonts, ICC profiles and wasm decoders by URL: they go to out/renderer/pdfjs/ (the
// core serves them as sg-asset://p/…; in development — straight from node_modules).
const PDFJS = ['cmaps', 'standard_fonts', 'iccs', 'wasm'];
function pdfjsData(): Plugin {
  return {
    name: 'pdfjs-data',
    apply: 'build',
    generateBundle() {
      for (const dir of PDFJS) {
        const from = resolve('node_modules/pdfjs-dist', dir);
        for (const name of readdirSync(from)) this.emitFile({ type: 'asset', fileName: `pdfjs/${dir}/${name}`, source: readFileSync(join(from, name)) });
      }
    },
  };
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    root: 'src/renderer',
    plugins: [svelte(), pdfjsData()],
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
