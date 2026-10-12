// Чтение и запись JSON-файлов приложения.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { dialog } from 'electron';

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
      message: 'Файл данных повреждён, начинаем с чистого листа',
      detail: `Старый файл сохранён как ${backup}\n\n${String(e)}`,
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
