// The compendium as a player sees it: only what their own sheet names (and the conditions on them), so a phone cannot
// browse the GM's entries. Everything here is pure; the core (main/players.ts) gathers the entries.
import { IMAGE_FIELD, searchKey, type Entry } from './compendium';

export interface BookEntry {
  entry: Entry;
  // The names it is found by: the title, the other language's, aliases.
  names: string[];
  // Lower — chosen first when a name is found twice (the adventure's own, the library, the book of the card's system).
  rank: number;
}

export type BookIndex = Map<string, { name: string; entry: Entry }>;

export const entryNamesOf = (e: Entry, more: (string | undefined)[] = []): string[] => {
  const a = e.fields['aliases'];
  return [e.title, ...more, ...(Array.isArray(a) ? a : typeof a === 'string' && a ? [a] : [])].filter((n): n is string => !!n?.trim());
};

// aliases — other names of known entries → the name to go by (LSS's own Russian spell names → the English one).
export function bookIndex(list: BookEntry[], aliases: Record<string, string> = {}): BookIndex {
  const index: BookIndex = new Map();
  for (const item of [...list].sort((a, b) => a.rank - b.rank)) {
    for (const name of item.names) {
      const key = searchKey(name.trim());
      if (key.length > 2 && !index.has(key)) index.set(key, { name: name.trim(), entry: item.entry });
    }
  }
  for (const [alias, to] of Object.entries(aliases)) {
    const key = searchKey(alias.trim());
    const found = index.get(searchKey(to.trim()));
    if (key.length > 2 && found && !index.has(key)) index.set(key, { name: alias.trim(), entry: found.entry });
  }
  return index;
}

// Every string of a sheet, whatever its shape.
export function sheetText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(sheetText).join('\n');
  if (value && typeof value === 'object') return Object.values(value).map(sheetText).join('\n');
  return '';
}

const WORD = /[\p{L}\p{N}]/u;

// The names of the index that the text has as whole words.
export function namesInText(index: BookIndex, text: string): string[] {
  const key = searchKey(text);
  const found: string[] = [];
  for (const [name, hit] of index) {
    for (let at = key.indexOf(name); at >= 0; at = key.indexOf(name, at + 1)) {
      if (WORD.test(key[at - 1] ?? '') || WORD.test(key[at + name.length] ?? '')) continue;
      found.push(hit.name);
      break;
    }
  }
  return found;
}

// Fields that say something about the GM's files and books; the rest of an entry is its description.
const PRIVATE_FIELDS = new Set(['overrides', 'tags', 'source', 'aliases', 'en', IMAGE_FIELD]);

export const publicEntry = (e: Entry): Entry => ({
  title: e.title,
  type: e.type,
  fields: Object.fromEntries(Object.entries(e.fields).filter(([k]) => !PRIVATE_FIELDS.has(k))),
  body: e.body,
});
