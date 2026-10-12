// Поиск приключений и картинок в папках. Файлы пользователя только читаются, не изменяются.
const fs = require('fs');
const path = require('path');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const CHARACTER_DIRS = ['characters', 'персонажи'];

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (_) { return false; }
}

function listNames(dir) {
  try { return fs.readdirSync(dir).filter((n) => !n.startsWith('.')); } catch (_) { return []; }
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });

// <приключение>/characters
function findCharactersDir(adventureDir) {
  const hit = listNames(adventureDir).find(
    (n) => CHARACTER_DIRS.includes(n.normalize('NFC').toLowerCase()) && isDir(path.join(adventureDir, n))
  );
  return hit ? path.join(adventureDir, hit) : null;
}

// Если выбрана папка приключения, вернёт её. Если выбрана папка, внутри которой лежат приключения,
// вернёт каждое приключение.
function findAdventures(dir) {
  if (findCharactersDir(dir)) return [dir];
  return listNames(dir)
    .map((n) => path.join(dir, n))
    .filter((p) => isDir(p) && findCharactersDir(p))
    .sort((a, b) => collator.compare(path.basename(a), path.basename(b)));
}

// Все картинки внутри папки (включая вложенные папки, до 3 уровней).
function listImages(dir, depth = 3) {
  const out = [];
  for (const n of listNames(dir)) {
    const p = path.join(dir, n);
    if (isDir(p)) {
      if (depth > 1) out.push(...listImages(p, depth - 1));
    } else if (IMAGE_EXT.has(path.extname(n).toLowerCase())) {
      out.push(p);
    }
  }
  return out.sort((a, b) => collator.compare(path.basename(a), path.basename(b)));
}

// староста_гилберт.jpg -> Староста Гилберт
function prettyName(file) {
  const base = path.basename(file, path.extname(file)).normalize('NFC');
  return base
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

module.exports = { IMAGE_EXT, findCharactersDir, findAdventures, listImages, prettyName };
