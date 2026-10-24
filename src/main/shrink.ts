// Lighter pictures for publishing an adventure (packs.ts `Shrink`): the repository keeps every adventure, and a GM's
// pictures are often PNGs straight from an image generator — 3–4 MB each at an ordinary size. Map data, pins and
// tokens are fractions of the picture, so a smaller picture changes nothing in them.
//   an opaque PNG → a JPEG (the name gets «.jpg»; packs.ts renames it everywhere in the pack);
//   a PNG with transparency stays a PNG (tokens, portraits cut out), only made smaller if it is too big;
//   a JPEG — made smaller if too big, encoded again if heavy.
// A copy is taken only when it is really lighter; the GM's own files are never touched.
import { nativeImage, type NativeImage } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Shrink } from './packs';

// The longest side: enough for a battle map on a 4K screen.
export const MAX_SIDE = 4096;
const QUALITY = 85;
// A JPEG lighter than this is left alone unless it is too big.
const HEAVY_JPEG = 1.5 * 1024 * 1024;
// A copy must save at least a fifth.
const WORTH = 0.8;

function opaque(img: NativeImage): boolean {
  const px = img.toBitmap();
  for (let i = 3; i < px.length; i += 4) if (px[i] !== 255) return false;
  return true;
}

export function shrinker(dir: string): Shrink {
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  return (abs, rel) => {
    const ext = path.extname(rel).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return null;
    let size = 0;
    try {
      size = fs.statSync(abs).size;
    } catch {
      return null;
    }
    let img = nativeImage.createFromPath(abs);
    if (img.isEmpty()) return null;
    const { width, height } = img.getSize();
    const big = Math.max(width, height) > MAX_SIDE;
    if (big) img = img.resize(width >= height ? { width: MAX_SIDE, quality: 'best' } : { height: MAX_SIDE, quality: 'best' });
    let data: Buffer;
    let name = rel;
    if (ext === '.png') {
      if (opaque(img)) {
        data = img.toJPEG(QUALITY);
        name = rel.slice(0, -ext.length) + '.jpg';
      } else if (big) data = img.toPNG();
      else return null;
    } else if (big || size > HEAVY_JPEG) data = img.toJPEG(QUALITY);
    else return null;
    if (data.length > size * WORTH) return null;
    const out = path.join(dir, `${n++}${path.extname(name)}`);
    fs.writeFileSync(out, data);
    return { abs: out, rel: name };
  };
}
