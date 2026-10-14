// Записи справочника в окне управления: из папок справочника хранилища (приключение и общее) и из библиотеки (для
// всех кампаний). Тексты читаются через ядро и перечитываются, когда файлы изменились (здесь или снаружи).
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { placeOrder, placeTitle, roleFolderHere, visibleIn } from '../../../shared/adventures';
import { entryTitle, parseEntry, searchKey, type Entry } from '../../../shared/compendium';
import { allFiles, dirname, LIBRARY, roleFolders, roleNames } from '../../../shared/vault';

export interface EntryItem {
  // Путь файла: в хранилище или «library:compendium/…».
  path: string;
  // Где лежит: «Страд», «Общее», «Библиотека».
  group: string;
  order: number;
  entry: Entry;
  text: string;
}

export const LIBRARY_GROUP = 'Библиотека';
export const isLibraryEntry = (path: string) => path.startsWith(LIBRARY);

export const book = $state({ vault: [] as EntryItem[], library: [] as EntryItem[], rev: 0, loaded: false });

let hooked = false;
let loadedFor = '';
let libraryFor = -1;

export async function loadEntries() {
  connectNotes();
  if (!hooked) {
    hooked = true;
    window.api.onCompendiumChanged(() => book.rev++);
  }
  if (libraryFor !== book.rev) {
    libraryFor = book.rev;
    const list = await window.api.listLibraryEntries();
    book.library = list.map((f) => ({ path: f.path, group: LIBRARY_GROUP, order: 2, entry: parseEntry(f.text, entryTitle(f.path)), text: f.text }));
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
      return { path: f.path, group: placeTitle(app.adventures, f.dir, app.vault.name), order: placeOrder(app.adventures, f.dir), entry: parseEntry(text, entryTitle(f.path)), text };
    })
  );
  if (loadedFor === key) {
    book.vault = list;
    book.loaded = true;
  }
}

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
export const allEntries = () =>
  [...book.vault, ...book.library].sort((a, b) => a.order - b.order || collator.compare(a.entry.title, b.entry.title));

// [[Ссылка]] на запись: по названию, без регистра и «ё»; запись приключения важнее общей, общая — библиотечной.
export function resolveEntry(name: string): EntryItem | null {
  const k = searchKey(name.trim());
  return allEntries().find((e) => searchKey(e.entry.title) === k) ?? null;
}

// Поиск: по названию, меткам и тексту; совпадение в названии — выше.
export function search(list: EntryItem[], query: string): EntryItem[] {
  const q = searchKey(query.trim());
  if (!q) return list;
  const scored = list
    .map((e) => {
      const t = searchKey(e.entry.title);
      const tags = Array.isArray(e.entry.fields['tags']) ? searchKey((e.entry.fields['tags'] as string[]).join(' ')) : '';
      const s = t === q ? 0 : t.startsWith(q) ? 1 : t.includes(q) ? 2 : tags.includes(q) ? 3 : searchKey(e.entry.body).includes(q) ? 4 : -1;
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
