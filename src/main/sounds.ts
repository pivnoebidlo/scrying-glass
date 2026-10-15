// Встроенные звуки (resources/sounds, см. README там): эффекты sfx/ и петли атмосферы ambience/. Только чтение;
// окна получают пути «sound:<папка>/<файл>» (shared/sounds.ts), файлы отдаёт протокол sg-asset://s/….
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { AUDIO_EXT } from '../shared/vault';
import { BUILTIN_SOUND, type BuiltinSounds } from '../shared/sounds';

const root = () => path.join(app.getAppPath(), 'resources', 'sounds');

// Файл встроенного звука по пути внутри resources/sounds; за её пределы — нет.
export function resolveSound(rel: string): string | null {
  const base = root();
  const abs = path.resolve(base, rel);
  return abs.startsWith(base + path.sep) ? abs : null;
}

let cache: BuiltinSounds | null = null;
export function builtinSounds(): BuiltinSounds {
  if (cache) return cache;
  const list = (dir: string) => {
    try {
      return fs
        .readdirSync(path.join(root(), dir))
        .filter((f) => AUDIO_EXT.includes(path.extname(f).toLowerCase()))
        .map((f) => `${BUILTIN_SOUND}${dir}/${f.normalize('NFC')}`)
        .sort((a, b) => a.localeCompare(b, 'ru'));
    } catch {
      return [];
    }
  };
  return (cache = { sfx: list('sfx'), ambience: list('ambience') });
}
