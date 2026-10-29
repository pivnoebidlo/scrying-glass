// Записи справочника в окне управления: из папок справочника хранилища (приключение и общее) и из библиотеки (для
// всех кампаний). Тексты читаются через ядро и перечитываются, когда файлы изменились (здесь или снаружи).
import { locale, t } from '../../../renderer/lib/i18n.svelte';
import { connectNotes, notes } from '../../../renderer/lib/note/notes.svelte';
import { store } from '../../../renderer/lib/store.svelte';
import { currentSystem, placeOrder, placeTitle, roleFolderHere, visibleIn } from '../../../shared/adventures';
import { familyOf, isEnabled, systems } from '../../../systems';
import { allTypes, typeDef } from '../../../renderer/lib/entry/types.svelte';
import { BUILTIN, OVERRIDES, entryFamily, entryTitle, parseEntry, searchKey, type Entry } from '../../../shared/compendium';
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
  // Built-in entry: the language of its book and, in an English book, the Russian title (also found).
  lang?: string;
  ru?: string;
}

export const libraryGroup = () => t('cmpui.library');
export const isLibraryEntry = (path: string) => path.startsWith(LIBRARY);
export const isBuiltinEntry = (path: string) => path.startsWith(BUILTIN);

export const book = $state({ vault: [] as EntryItem[], library: [] as EntryItem[], builtin: [] as EntryItem[], rev: 0, loaded: false });
// Languages of the built-in books by system.
let builtinLangs: Record<string, string[]> = {};

// Какие встроенные записи показывать, когда у семейства приключения несколько систем со встроенными книгами (D&D
// 2014 и 2024): одной редакции (id системы), обе или никакие. Помнит окно (localStorage).
export type Edition = string;
const EDITION_KEY = 'compendium.edition';
function savedEdition(): Edition {
  try {
    const v = localStorage.getItem(EDITION_KEY);
    if (v) return v;
  } catch {
    /* нет хранилища — по умолчанию */
  }
  return '';
}
export const srd = $state({ edition: savedEdition() });
// Editions to pick from: the family's systems turned on that have built-in books, «both» and «none» — only when
// there are several (the title — the book's and the system's short name: «SRD 5.2.1 (2024)»).
export const editionsHere = (): { id: Edition; title: string }[] => {
  void store.state.vault.systemsOff;
  const withBooks = new Map(book.builtin.map((e) => [systemOfBuiltin(e.path), e.group]));
  const list = systems.filter((x) => x.family === hereFamily() && isEnabled(x.id) && withBooks.has(x.id));
  if (list.length < 2) return [];
  return [
    ...list.map((x) => ({ id: x.id, title: `${withBooks.get(x.id)} (${x.short ?? x.title})` })),
    { id: 'all', title: t('cmpui.bothEditions') },
    { id: 'none', title: t('cmpui.noSrd') },
  ];
};
// Выбранная редакция, а если её отключили (или она другого семейства) — первая доступная; '' — выбирать не из чего.
export const editionNow = (): Edition => {
  const list = editionsHere();
  return list.some((e) => e.id === srd.edition) ? srd.edition : (list[0]?.id ?? '');
};
export function setEdition(e: Edition) {
  srd.edition = e;
  try {
    localStorage.setItem(EDITION_KEY, e);
  } catch {
    /* не запомним — не страшно */
  }
}

// Loaded for this interface language (group and source labels are taken at load time) and this state of the
// library (system packs bring books of their own).
let builtinLoaded = '';
async function loadBuiltin() {
  if (builtinLoaded === `${locale.lang}|${book.rev}`) return;
  builtinLoaded = `${locale.lang}|${book.rev}`;
  const books = await window.api.listBuiltinEntries();
  builtinLangs = {};
  for (const b of books) (builtinLangs[b.system] ??= []).push(b.lang);
  book.builtin = books.flatMap((b) => {
    const source = b.source.translator ? t('cmpui.translatedBy', { source: b.source.title, by: b.source.translator }) : b.source.title;
    return b.entries.map(({ en, ru, ...e }) => ({
      path: `${BUILTIN}${b.system}/${e.type}/${e.title}`,
      group: b.source.title,
      order: 3,
      entry: { ...e, fields: { ...e.fields, source } },
      en,
      ru,
      lang: b.lang,
    }));
  });
}

let hooked = false;
let loadedFor = '';
let libraryFor = '';

export async function loadEntries() {
  connectNotes();
  if (!hooked) {
    hooked = true;
    window.api.onCompendiumChanged(() => book.rev++);
  }
  void loadBuiltin();
  if (libraryFor !== `${book.rev}|${locale.lang}`) {
    libraryFor = `${book.rev}|${locale.lang}`;
    const list = await window.api.listLibraryEntries();
    book.library = list.map((f) => ({ path: f.path, group: libraryGroup(), order: 2, entry: parseEntry(f.text, entryTitle(f.path)) }));
  }
  const app = store.state;
  const tree = app.vault.tree;
  const files = tree
    ? roleFolders(tree, 'compendium', app.vault.name)
        .filter((r) => visibleIn(app.adventures, r.folder.path))
        .flatMap((r) => allFiles(r.folder, 'entry').map((f) => ({ path: f.path, dir: dirname(r.folder.path) })))
    : [];
  const key = notes.rev + '|' + locale.lang + '|' + files.map((f) => f.path).join('|');
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
// Правка встроенной записи: какую заменяет (путь встроенной) или null.
export function overrideOf(e: EntryItem): string | null {
  const v = e.entry.fields[OVERRIDES];
  return typeof v === 'string' && v ? BUILTIN + v : null;
}
// Семейство системы текущего приключения: справочник показывает записи этого семейства и общие (без системы).
export const hereFamily = () => familyOf(currentSystem(store.state.adventures));
// The family has editions to choose from (the picker in the sidebar).
export const editionsChoice = () => editionsHere().length > 0;
// Типы записей для системы приключения: её и общие.
export const typesHere = () => allTypes().filter((t) => !t.def.family || t.def.family === hereFamily());
const fitsHere = (e: EntryItem) => {
  const f = entryFamily(e.entry, typeDef(e.entry.type));
  return f === null || f === hereFamily();
};
// Встроенные записи — системы приключения (её семейства, без отключённых систем); у D&D — в выбранной редакции.
const systemOfBuiltin = (builtinPath: string) => builtinPath.slice(BUILTIN.length).split('/')[0]!;
const editionShown = (builtinPath: string) => {
  const system = systemOfBuiltin(builtinPath);
  if (familyOf(system) !== hereFamily() || !isEnabled(system)) return false;
  const ed = editionNow();
  return ed === '' || ed === 'all' || (ed !== 'none' && system === ed);
};
// Своя запись: правка встроенной видна вместе с её редакцией и получает её английское название и подпись места.
function ownShown(list: EntryItem[]): EntryItem[] {
  return list.flatMap((e) => {
    if (!fitsHere(e)) return [];
    const over = overrideOf(e);
    if (!over) return [e];
    if (!editionShown(over)) return [];
    const orig = book.builtin.find((b) => b.path === over);
    return [{ ...e, en: e.en ?? orig?.en, group: t('cmpui.editOf', { group: e.group, orig: orig?.group ?? 'SRD' }), order: 3 }];
  });
}
// Language of the built-in book shown for a system: the interface language if there is such a book, else English.
const shownLang = (system: string) => {
  const langs = builtinLangs[system] ?? [];
  return langs.includes(locale.lang) ? locale.lang : langs.includes('en') ? 'en' : (langs[0] ?? '');
};
const builtinShown = () => {
  const replaced = new Set([...book.vault, ...book.library].map(overrideOf).filter(Boolean));
  return book.builtin.filter((e) => editionShown(e.path) && e.lang === shownLang(systemOfBuiltin(e.path)) && !replaced.has(e.path));
};
export const allEntries = () =>
  [...ownShown(book.vault), ...ownShown(book.library), ...builtinShown()].sort((a, b) => a.order - b.order || collator.compare(a.entry.title, b.entry.title));

// [[Ссылка]] на запись: по названию (или английскому названию встроенной), без регистра и «ё»; запись приключения
// важнее общей, общая — библиотечной, своя — встроенной. Встроенная ищется и в скрытой редакции (ссылка не должна
// пропадать), но выбранная — первой.
// Несколько названий («Ослеплён», «Ослеплённый», «Blinded») — подходит любое, своя запись всё равно важнее встроенной.
// Другие названия записи: английское (у встроенной) и поле aliases.
export const altNames = (e: EntryItem): string[] => {
  const a = e.entry.fields['aliases'];
  return [...(e.en ? [e.en] : []), ...(e.ru ? [e.ru] : []), ...(Array.isArray(a) ? a : typeof a === 'string' && a ? [a] : [])];
};

export function resolveEntry(names: string | string[]): EntryItem | null {
  const keys = new Set((Array.isArray(names) ? names : [names]).map((n) => searchKey(n.trim())));
  const hit = (e: EntryItem) => keys.has(searchKey(e.entry.title)) || altNames(e).some((n) => keys.has(searchKey(n)));
  return allEntries().find(hit) ?? book.builtin.find(hit) ?? null;
}

// Names of all entries of a type (own and built-in of every edition, with the English ones): D&D's spell links
// in stat blocks and sheets.
export const entryNames = (type: string) =>
  [...book.vault, ...book.library, ...book.builtin].filter((e) => e.entry.type === type).flatMap((e) => [e.entry.title, ...altNames(e)]);
// Запись по пути, в том числе встроенная из скрытой редакции.
// Встроенная, которую заменила правка, — это правка.
export function entryAt(path: string): EntryItem | undefined {
  const all = allEntries();
  return all.find((e) => e.path === path) ?? all.find((e) => overrideOf(e) === path) ?? book.builtin.find((e) => e.path === path);
}

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
