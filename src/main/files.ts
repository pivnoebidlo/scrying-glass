// Чтение и запись JSON-файлов приложения.
import { t } from '../shared/i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { clipboard, ClipboardItem, dialog, nativeImage } from 'electron';
import { fileURLToPath } from 'node:url';
import { IMAGE_EXT } from '../shared/vault';

// Запись через временный файл: при сбое посреди записи на диске остаётся прежняя версия.
export function writeJsonAtomic(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, JSON.stringify(data, null, 2));
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

// Читает JSON. Нет файла — undefined. Повреждённый файл не перезаписывается: он откладывается в сторону
// (<имя>.broken-<время>.json), пользователь получает предупреждение, возвращается undefined.
// Если файл есть, но прочитать его нельзя (права и т.п.), бросает исключение: работать с ним дальше опасно,
// первое же сохранение его затрёт.
export function readJson(file: string): unknown {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw e;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = file.replace(/\.json$/, '') + `.broken-${stamp}.json`;
    fs.renameSync(file, backup);
    dialog.showMessageBoxSync({
      type: 'warning',
      message: t('core.broken'),
      detail: t('core.brokenDetail', { file: backup, error: String(e) }),
      buttons: ['OK'],
    });
    return undefined;
  }
}

export function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// Свободное имя файла в папке: «имя.png», «имя (2).png», …
export function freeName(dir: string, file: string): string {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  let name = file;
  for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base} (${i})${ext}`;
  return name;
}

// Картинка из буфера обмена: скопированный в Finder файл или само изображение (скриншот, картинка из
// браузера). null — в буфере нет картинки. В Electron 44 буфер читается асинхронно, как в браузере.
const IMAGE_MIME: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' };

// Files copied in Finder or Explorer (⌘C / Ctrl+C): their paths, from the clipboard's file:// list.
export async function clipboardFiles(): Promise<string[]> {
  let items: Electron.ClipboardItem[] = [];
  try {
    items = await clipboard.read();
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const item of items) {
    for (const type of item.types.filter((t) => t === 'text/uri-list' || t.includes('file-url'))) {
      try {
        const text = await ((await item.getType(type)) as Blob).text();
        for (const line of text.split(/\r?\n/)) {
          if (!line.startsWith('file://')) continue;
          const file = fileURLToPath(line.trim());
          if (fs.statSync(file).isFile() && !out.includes(file)) out.push(file);
        }
      } catch {
        /* not a file */
      }
    }
  }
  return out;
}

export async function clipboardImage(): Promise<{ name: string; data: Buffer } | null> {
  let items: Electron.ClipboardItem[] = [];
  try {
    items = await clipboard.read();
  } catch {
    return null;
  }
  for (const item of items) {
    // Файл, скопированный в Finder (⌘C): в буфере его адрес file://…
    for (const type of item.types.filter((t) => t === 'text/uri-list' || t.includes('file-url'))) {
      try {
        const text = await ((await item.getType(type)) as Blob).text();
        const url = text.split(/\r?\n/).find((l) => l.startsWith('file://'));
        const file = url && fileURLToPath(url.trim());
        if (file && IMAGE_EXT.includes(path.extname(file).toLowerCase()) && fs.statSync(file).isFile()) {
          return { name: path.basename(file), data: fs.readFileSync(file) };
        }
      } catch {
        /* не файл — попробуем как изображение */
      }
    }
    const mime = item.types.find((t) => IMAGE_MIME[t]);
    if (mime) {
      const blob = (await item.getType(mime)) as Blob;
      // Местное время: «Картинка 2026-10-13 01-54.png».
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}`;
      return { name: `${t('core.name.image', { stamp })}${IMAGE_MIME[mime]}`, data: Buffer.from(await blob.arrayBuffer()) };
    }
  }
  return null;
}

// A picture file into the clipboard, as PNG (any format the system decodes). false — not a picture we can read.
export async function copyImageFile(file: string): Promise<boolean> {
  const img = nativeImage.createFromPath(file);
  if (img.isEmpty()) return false;
  const png = img.toPNG();
  await clipboard.write([new ClipboardItem({ 'image/png': new Blob([new Uint8Array(png)], { type: 'image/png' }) })]);
  return true;
}
