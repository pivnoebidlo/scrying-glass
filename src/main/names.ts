// The GM's own lists for the name generator: text files in <library>/names/<lang>/ (shared/names.ts — the format).
// They are added to the built-in lists. The app only reads them and copies files the GM loads; it never sends them
// anywhere (lists taken from other sites stay on the GM's computer and in their backups).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { t } from '../shared/i18n';
import { listFileName, listLang, parseList, parseListName } from '../shared/names';

export const namesDir = (library: string) => path.join(library, 'names');

// All lists: file path inside names/ and the text. A list's language is its folder (en, ru…).
export function listNameLists(library: string | null): { file: string; lang: string; text: string }[] {
  if (!library) return [];
  const root = namesDir(library);
  const out: { file: string; lang: string; text: string }[] = [];
  let langs: string[] = [];
  try {
    langs = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
  } catch {
    return [];
  }
  for (const lang of langs) {
    for (const f of fs.readdirSync(path.join(root, lang))) {
      if (!f.toLowerCase().endsWith('.txt') || !parseListName(f)) continue;
      try {
        out.push({ file: `${lang}/${f}`, lang, text: fs.readFileSync(path.join(root, lang, f), 'utf8') });
      } catch {
        /* unreadable — skipped */
      }
    }
  }
  return out;
}

// Copy lists into the library: the file name says the race, gender and kind, the letters say the language.
// A list with the same name in the same language is replaced (a fresh export of the same list).
export function importNameLists(library: string | null, files: string[]): { count: number; errors: string[] } {
  if (!library) return { count: 0, errors: [t('names.noLibrary')] };
  let count = 0;
  const errors: string[] = [];
  for (const file of files) {
    const name = path.basename(file);
    const id = parseListName(name);
    if (!id) {
      errors.push(t('names.badFileName', { file: name }));
      continue;
    }
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      errors.push(`${name}: ${String(e)}`);
      continue;
    }
    if (!parseList(text).length) {
      errors.push(t('names.emptyList', { file: name }));
      continue;
    }
    const dir = path.join(namesDir(library), listLang(text));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, listFileName(id)), text.replace(/\r\n/g, '\n'));
    count++;
  }
  return { count, errors };
}
