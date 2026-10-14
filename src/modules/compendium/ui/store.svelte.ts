// Записи справочника в окне управления: из папок справочника хранилища (приключение и общее) и из библиотеки (для
// всех кампаний). Тексты читаются через ядро и перечитываются, когда файлы изменились (здесь или снаружи).
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { placeOrder, placeTitle, roleFolderHere, visibleIn } from '../../../shared/adventures';
import { BUILTIN, entryTitle, parseEntry, searchKey, type Entry } from '../../../shared/compendium';
import { allFiles, dirname, LIBRARY, roleFolders, roleNames } from '../../../shared/vault';

export interface EntryItem {
  // Путь файла: в хранилище или «library:compendium/…».
  path: string;
  // Где лежит: «Страд», «Общее», «Библиотека».
  group: string;
  order: number;
  entry: Entry;
  // Английское название встроенной записи — тоже находится поиском и по [[ссылке]].
  en?: string;
}

export const LIBRARY_GROUP = 'Библиотека';
export const isLibraryEntry = (path: string) => path.startsWith(LIBRARY);
export const isBuiltinEntry = (path: string) => path.startsWith(BUILTIN);

export const book = $state({ vault: [] as EntryItem[], library: [] as EntryItem[], builtin: [] as EntryItem[], rev: 0, loaded: false });

// Какие встроенные записи показывать: редакция SRD, обе или никакие. Помнит окно (localStorage).
export type Edition = 'dnd5e-2024' | 'dnd5e-2014' | 'all' | 'none';
export const EDITIONS: { id: Edition; title: string }[] = [
  { id: 'dnd5e-2024', title: 'SRD 5.2.1 (2024)' },
  { id: 'dnd5e-2014', title: 'SRD 5.1 (2014)' },
  { id: 'all', title: 'Обе редакции SRD' },
  { id: 'none', title: 'Без SRD — только свои' },
];
const EDITION_KEY = 'compendium.edition';
function savedEdition(): Edition {
  try {
    const v = localStorage.getItem(EDITION_KEY);
    if (EDITIONS.some((e) => e.id === v)) return v as Edition;
  } catch {
    /* нет хранилища — по умолчанию */
  }
  return 'dnd5e-2024';
}
export const srd = $state({ edition: savedEdition() });
export function setEdition(e: Edition) {
  srd.edition = e;
  try {
    localStorage.setItem(EDITION_KEY, e);
  } catch {
    /* не запомним — не страшно */
  }
}

let builtinLoaded = false;
async function loadBuiltin() {
  if (builtinLoaded) return;
  builtinLoaded = true;
  const books = await window.api.listBuiltinEntries();
  book.builtin = books.flatMap((b) =>
    b.entries.map(({ en, ...e }) => ({
      path: `${BUILTIN}${b.system}/${e.type}/${e.title}`,
      group: b.source.title,
      order: 3,
      entry: { ...e, fields: { ...e.fields, source: `${b.source.title}, перевод OmnisGM` } },
      en,
    }))
  );
}

let hooked = false;
let loadedFor = '';
let libraryFor = -1;

export async function loadEntries() {
  connectNotes();
  if (!hooked) {
    hooked = true;
    window.api.onCompendiumChanged(() => book.rev++);
  }
  void loadBuiltin();
  if (libraryFor !== book.rev) {
    libraryFor = book.rev;
    const list = await window.api.listLibraryEntries();
    book.library = list.map((f) => ({ path: f.path, group: LIBRARY_GROUP, order: 2, entry: parseEntry(f.text, entryTitle(f.path)) }));
  }
  const app = store.state;
  const tree = app.vault.tree;
  const files = tree
    ? roleFolders(tree, 'compendium', app.vault.name)
        .filter((r) => visibleIn(app.adventures, r.folder.path))
        .flatMap((r) => allFiles(r.folder, 'entry').map((f) => ({ path: f.path, dir: dirname(r.folder.path) })))
    : [];
  const key = notes.rev + '|' + files.map((f) => f.path).join('|');
  if (key === loadedFor) return;
  loadedFor = key;
  const list = await Promise.all(
    files.map(async (f) => {
      const text = (await window.api.readEntry(f.path)) ?? '';
      return { path: f.path, group: placeTitle(app.adventures, f.dir, app.vault.name), order: placeOrder(app.adventures, f.dir), entry: parseEntry(text, entryTitle(f.path)) };
    })
  );
  if (loadedFor === key) {
    book.vault = list;
    book.loaded = true;
  }
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const builtinShown = () => {
  const ed = srd.edition;
  return ed === 'none' ? [] : ed === 'all' ? book.builtin : book.builtin.filter((e) => e.path.startsWith(`${BUILTIN}${ed}/`));
};
export const allEntries = () =>
  [...book.vault, ...book.library, ...builtinShown()].sort((a, b) => a.order - b.order || collator.compare(a.entry.title, b.entry.title));

// [[Ссылка]] на запись: по названию (или английскому названию встроенной), без регистра и «ё»; запись приключения
// важнее общей, общая — библиотечной, своя — встроенной. Встроенная ищется и в скрытой редакции (ссылка не должна
// пропадать), но выбранная — первой.
// Несколько названий («Ослеплён», «Ослеплённый», «Blinded») — подходит любое, своя запись всё равно важнее встроенной.
// Другие названия записи: английское (у встроенной) и поле aliases.
export const altNames = (e: EntryItem): string[] => {
  const a = e.entry.fields['aliases'];
  return [...(e.en ? [e.en] : []), ...(Array.isArray(a) ? a : typeof a === 'string' && a ? [a] : [])];
};

export function resolveEntry(names: string | string[]): EntryItem | null {
  const keys = new Set((Array.isArray(names) ? names : [names]).map((n) => searchKey(n.trim())));
  const hit = (e: EntryItem) => keys.has(searchKey(e.entry.title)) || altNames(e).some((n) => keys.has(searchKey(n)));
  return allEntries().find(hit) ?? book.builtin.find(hit) ?? null;
}

// Названия всех заклинаний (свои и встроенные обеих редакций, с английскими) — для ссылок в статблоках и листах.
export const spellNames = () =>
  [...book.vault, ...book.library, ...book.builtin].filter((e) => e.entry.type === 'spell').flatMap((e) => [e.entry.title, ...altNames(e)]);
// Запись по пути, в том числе встроенная из скрытой редакции.
export const entryAt = (path: string) => allEntries().find((e) => e.path === path) ?? book.builtin.find((e) => e.path === path);

// Поиск: по названию, меткам и тексту; совпадение в названии — выше.
export function search(list: EntryItem[], query: string): EntryItem[] {
  const q = searchKey(query.trim());
  if (!q) return list;
  const scored = list
    .map((e) => {
      const t = searchKey(e.entry.title);
      const tags = Array.isArray(e.entry.fields['tags']) ? searchKey((e.entry.fields['tags'] as string[]).join(' ')) : '';
      const alts = altNames(e).map(searchKey);
      const s = t === q || alts.includes(q) ? 0 : t.startsWith(q) || alts.some((a) => a.startsWith(q)) ? 1 : t.includes(q) || alts.some((a) => a.includes(q)) ? 2 : tags.includes(q) ? 3 : searchKey(e.entry.body).includes(q) ? 4 : -1;
      return { e, s };
    })
    .filter((x) => x.s >= 0);
  return scored.sort((a, b) => a.s - b.s).map((x) => x.e);
}

// Папка справочника для места: приключения, «Общее» (null) или библиотеки (LIBRARY).
export function entriesFolder(place: string | null): string {
  if (place === LIBRARY) return LIBRARY + 'compendium';
  const app = store.state;
  const here = app.vault.tree ? roleFolderHere(app.vault.tree, { ...app.adventures, current: place }, 'compendium') : null;
  const name = roleNames().compendium[0]!;
  return here?.path ?? (place ? `${place}/${name}` : name);
}
