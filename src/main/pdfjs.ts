// Data pdf.js reads by URL (CMaps, standard fonts, ICC profiles, wasm decoders) for the journal's PDFs: built into
// out/renderer/pdfjs/ (electron.vite.config.ts), in development — node_modules/pdfjs-dist. Served as sg-asset://p/….
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';

export function resolvePdfjs(rel: string): string | null {
  for (const base of [path.join(app.getAppPath(), 'out/renderer/pdfjs'), path.join(app.getAppPath(), 'node_modules/pdfjs-dist')]) {
    const abs = path.resolve(base, rel);
    if (abs.startsWith(base + path.sep) && fs.existsSync(abs)) return abs;
  }
  return null;
}
