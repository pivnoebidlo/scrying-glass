// Миниатюры картинок для плиток и списков: большие карты и портреты (десятки мегабайт) окно не декодирует
// целиком ради плитки в 200 точек. Миниатюра делается один раз и лежит в <userData>/thumbs, ключ — путь, размер
// и время изменения файла (изменили картинку — будет новая миниатюра). Старые миниатюры удаляются при запуске,
// если папка разрослась.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { app, nativeImage } from 'electron';

// Ширины, которые просят окна: другие округляются вверх, чтобы не плодить копии.
const SIZES = [128, 256, 512, 1024];
const MAX_CACHE = 400 * 1024 * 1024;
// GIF может быть анимированным, SVG и так лёгкий — их отдаём как есть.
const THUMBABLE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp']);

const dir = () => path.join(app.getPath('userData'), 'thumbs');

export const canThumb = (file: string) => THUMBABLE.has(path.extname(file).toLowerCase());
export const thumbSize = (w: number) => SIZES.find((s) => s >= w) ?? SIZES[SIZES.length - 1]!;

// Миниатюры делаются по одной: декодирование большой картинки занимает главный процесс.
let queue: Promise<unknown> = Promise.resolve();
const pending = new Map<string, Promise<string | null>>();
// Картинки, которым миниатюра не нужна (и так маленькие) или не удалась: второй раз не декодируем.
const original = new Set<string>();

// Путь к готовой миниатюре (null — сделать не вышло, отдать оригинал).
export function thumbnail(file: string, width: number): Promise<string | null> {
  let st: fs.Stats;
  try {
    st = fs.statSync(file);
  } catch {
    return Promise.resolve(null);
  }
  const w = thumbSize(width);
  const key = createHash('sha1').update(`${file}\n${st.size}\n${st.mtimeMs}\n${w}`).digest('hex');
  const out = path.join(dir(), key.slice(0, 2), key + '.jpg');
  if (original.has(out)) return Promise.resolve(null);
  if (fs.existsSync(out)) return Promise.resolve(out);
  let p = pending.get(out);
  if (!p) {
    p = queue
      .then(() => make(file, out, w))
      .then((r) => (r ? r : (original.add(out), null)))
      .finally(() => pending.delete(out));
    queue = p.catch(() => null);
    pending.set(out, p);
  }
  return p;
}

async function make(file: string, out: string, w: number): Promise<string | null> {
  // Даём главному процессу ответить на другие запросы между миниатюрами.
  await new Promise((r) => setImmediate(r));
  const img = nativeImage.createFromPath(file);
  if (img.isEmpty()) return null;
  const size = img.getSize();
  // Картинка и так маленькая — миниатюра не нужна.
  if (size.width <= w * 1.25) return null;
  const small = img.resize({ width: w, quality: 'good' });
  // JPEG: прозрачный фон станет чёрным, как и фон плиток, а файл в разы меньше PNG.
  const data = small.toJPEG(85);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = out + '.tmp';
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, out);
  return out;
}

// При запуске: если миниатюр больше MAX_CACHE, удалить самые старые (по последнему изменению).
export function pruneThumbs() {
  setTimeout(() => {
    try {
      const files: { f: string; size: number; t: number }[] = [];
      for (const sub of fs.readdirSync(dir())) {
        const d = path.join(dir(), sub);
        for (const name of fs.readdirSync(d)) {
          const f = path.join(d, name);
          const st = fs.statSync(f);
          files.push({ f, size: st.size, t: st.mtimeMs });
        }
      }
      let total = files.reduce((a, x) => a + x.size, 0);
      for (const x of files.sort((a, b) => a.t - b.t)) {
        if (total <= MAX_CACHE * 0.8) break;
        fs.rmSync(x.f, { force: true });
        total -= x.size;
      }
    } catch {
      /* папки ещё нет */
    }
  }, 10_000);
}
