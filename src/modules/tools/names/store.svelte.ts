// Name generator in the control window: the built-in lists (builtin/<lang>/*.txt, written for the app), the GM's own
// lists from the library, the options (remembered by the window), favorites (in the library — shared by all
// campaigns and kept in backups) and the history of this window.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { addList, parseList, parseListName, type GeneratedName, type Gender, type NameBook, type NameOptions } from '../../../shared/names';

const raw = import.meta.glob('./builtin/*/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const BUILTIN = Object.entries(raw).map(([p, text]) => ({ lang: p.split('/').at(-2)!, file: p.split('/').at(-1)!, text }));

export interface SavedName {
  text: string;
  race: string;
  gender: Gender;
}

const OPTIONS_KEY = 'names.options';
const HISTORY_KEY = 'names.history';
const HISTORY_MAX = 200;

const DEFAULTS: NameOptions & { lang: string; builtin: boolean; own: boolean } = {
  race: 'human',
  gender: 'male',
  form: 'full',
  nickname: 'none',
  length: 'any',
  sound: 'any',
  first: '',
  count: 5,
  // Language of the lists ('' — the interface language), and which lists to use.
  lang: '',
  builtin: true,
  own: true,
};

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
}
function loadList<T>(key: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* not remembered — not a problem */
  }
}

export const opts = $state(load(OPTIONS_KEY, DEFAULTS));
export const names = $state({
  own: [] as { file: string; lang: string; text: string }[],
  results: null as GeneratedName[] | null,
  favorites: [] as SavedName[],
  history: loadList<SavedName>(HISTORY_KEY),
});

export const saveOptions = () => save(OPTIONS_KEY, $state.snapshot(opts));
export const resetFilters = () => {
  opts.length = 'any';
  opts.sound = 'any';
  opts.first = '';
  saveOptions();
};

// Languages that have lists (built-in or own), and the one used now: chosen, else the interface language, else English.
export const listLangs = () => [...new Set([...BUILTIN.map((b) => b.lang), ...names.own.map((o) => o.lang)])].sort();
export const langNow = () => {
  const langs = listLangs();
  return opts.lang && langs.includes(opts.lang) ? opts.lang : langs.includes(locale.lang) ? locale.lang : 'en';
};

// All lists of the current language from the chosen sources.
export function book(): NameBook {
  const lang = langNow();
  const b: NameBook = {};
  const add = (file: string, text: string) => {
    const id = parseListName(file);
    if (id) addList(b, id, parseList(text));
  };
  if (opts.builtin) for (const l of BUILTIN) if (l.lang === lang) add(l.file, l.text);
  if (opts.own) for (const l of names.own) if (l.lang === lang) add(l.file.split('/').pop()!, l.text);
  return b;
}
// Every list of a language (built-in and own), whatever the generator's options: for other generators (taverns).
export function fullBook(lang: string): NameBook {
  const b: NameBook = {};
  const add = (file: string, text: string) => {
    const id = parseListName(file);
    if (id) addList(b, id, parseList(text));
  };
  for (const l of BUILTIN) if (l.lang === lang) add(l.file, l.text);
  for (const l of names.own) if (l.lang === lang) add(l.file.split('/').pop()!, l.text);
  return b;
}
export const ownCount = () => names.own.filter((l) => l.lang === langNow()).length;

export async function loadOwn() {
  names.own = await window.api.listNameLists();
}

let favoritesLoaded = false;
export async function loadFavorites() {
  if (favoritesLoaded) return;
  favoritesLoaded = true;
  const data = (await window.api.readLibraryData('names.json')) as { favorites?: SavedName[] } | null;
  names.favorites = Array.isArray(data?.favorites) ? data.favorites.filter((f) => typeof f?.text === 'string') : [];
}
const saveFavorites = () => window.api.writeLibraryData('names.json', { favorites: $state.snapshot(names.favorites) });

export const isFavorite = (text: string) => names.favorites.some((f) => f.text === text);
export function toggleFavorite(n: SavedName) {
  names.favorites = isFavorite(n.text) ? names.favorites.filter((f) => f.text !== n.text) : [n, ...names.favorites];
  void saveFavorites();
}
export function clearFavorites() {
  names.favorites = [];
  void saveFavorites();
}

export function remember(list: SavedName[]) {
  names.history = [...list, ...names.history].slice(0, HISTORY_MAX);
  save(HISTORY_KEY, names.history);
}
export function clearHistory() {
  names.history = [];
  save(HISTORY_KEY, []);
}

// Export: plain text — a name per line; CSV — name, race, gender (with quotes where needed).
export const asText = (list: SavedName[]) => list.map((n) => n.text).join('\n') + '\n';
const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export const asCsv = (list: SavedName[], head: [string, string, string], race: (id: string) => string, gender: (g: Gender) => string) =>
  [head, ...list.map((n) => [n.text, race(n.race), gender(n.gender)])].map((r) => r.map(cell).join(',')).join('\n') + '\n';
