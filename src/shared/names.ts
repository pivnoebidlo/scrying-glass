// Name generator: lists of names, surnames and nicknames by race and gender, filters and generation. Pure functions —
// the window (tools/names) and the core (importing the GM's own lists) share them.
//
// A list is a text file, one entry per line (empty lines and «# …» are skipped, quotes around nicknames are dropped).
// Its file name says what it is: <race>_<gender>_<kind>.txt — «human_man_names.txt», «elves_woman_nicknames.txt»;
// the gender may be left out («dwarf_surnames.txt» — for both), the race may be «any» («any_woman_nicknames.txt» —
// for every race).

export const RACES = ['human', 'elf', 'dwarf', 'gnome', 'halfling', 'dragonborn', 'tiefling'] as const;
export type Gender = 'male' | 'female';
export type ListGender = Gender | 'any';
export type ListKind = 'names' | 'surnames' | 'nicknames' | 'epithets';
// A race of a list: one of RACES, «any» or the GM's own (any Latin word: «orc_man_names.txt»).
export type Race = string;

export interface ListId {
  race: Race;
  gender: ListGender;
  kind: ListKind;
}

const RACE_ALIASES: Record<string, Race> = {
  human: 'human', humans: 'human', elf: 'elf', elves: 'elf', elfs: 'elf', dwarf: 'dwarf', dwarves: 'dwarf', dwarfs: 'dwarf',
  gnome: 'gnome', gnomes: 'gnome', halfling: 'halfling', halflings: 'halfling', dragonborn: 'dragonborn',
  dragonborns: 'dragonborn', tiefling: 'tiefling', tieflings: 'tiefling', any: 'any', all: 'any', common: 'any',
};
const GENDER_ALIASES: Record<string, ListGender> = {
  man: 'male', men: 'male', male: 'male', m: 'male', boy: 'male',
  woman: 'female', women: 'female', female: 'female', f: 'female', girl: 'female',
  any: 'any', unisex: 'any', both: 'any',
};
const KIND_ALIASES: Record<string, ListKind> = {
  names: 'names', name: 'names', firstnames: 'names',
  surnames: 'surnames', surname: 'surnames', family: 'surnames', clans: 'surnames', clan: 'surnames', lastnames: 'surnames',
  nicknames: 'nicknames', nickname: 'nicknames', nicks: 'nicknames',
  epithets: 'epithets', epithet: 'epithets', epic: 'epithets', titles: 'epithets',
};

// «human_man_names.txt» -> { race: 'human', gender: 'male', kind: 'names' }; null — not a list file.
export function parseListName(file: string): ListId | null {
  const base = file.split(/[\\/]/).pop()!.replace(/\.txt$/i, '').toLowerCase();
  const parts = base.split(/[_\-\s.]+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;
  const kind = KIND_ALIASES[parts.at(-1)!];
  if (!kind) return null;
  const gender = parts.length === 3 ? GENDER_ALIASES[parts[1]!] : 'any';
  if (!gender) return null;
  const race = RACE_ALIASES[parts[0]!] ?? (/^[a-z][a-z0-9]*$/.test(parts[0]!) ? parts[0]! : null);
  return race ? { race, gender, kind } : null;
}

export const listFileName = (id: ListId) => `${id.race}_${id.gender === 'male' ? 'man' : id.gender === 'female' ? 'woman' : 'any'}_${id.kind}.txt`;

// Entries of a list: trimmed, without quotes around them, without empty lines, «# comments» and repeats.
export function parseList(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[«"“„']+|[»"”']+$/g, '').trim();
    if (!line || line.startsWith('#')) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

// Language of a list by its letters: Cyrillic — Russian, otherwise English.
export const listLang = (text: string) => (/[А-Яа-яЁё]/.test(text) ? 'ru' : 'en');

// All lists of one language: race -> gender -> kind -> entries.
export type NameBook = Record<Race, Partial<Record<ListGender, Partial<Record<ListKind, string[]>>>>>;

// Add a list to a book (entries of the same race, gender and kind from several sources are joined).
export function addList(book: NameBook, id: ListId, entries: string[]) {
  const byGender = (book[id.race] ??= {});
  const byKind = (byGender[id.gender] ??= {});
  const have = new Set((byKind[id.kind] ??= []).map((x) => x.toLowerCase()));
  for (const e of entries) if (!have.has(e.toLowerCase())) (have.add(e.toLowerCase()), byKind[id.kind]!.push(e));
}

// Entries for a race and gender: its own lists, lists «for both genders» and lists for any race.
export function entriesFor(book: NameBook, race: Race, gender: Gender, kind: ListKind): string[] {
  const from = (r: Race) => [...(book[r]?.[gender]?.[kind] ?? []), ...(book[r]?.any?.[kind] ?? [])];
  const own = from(race);
  // Names are the race's own; surnames, nicknames and epithets may come from the lists for any race.
  return kind === 'names' ? own : [...new Set([...own, ...from('any')])];
}

// Races that have names in the book: the standard ones first, then the GM's own.
export const racesIn = (book: NameBook) => {
  const has = (r: Race) => Object.values(book[r] ?? {}).some((k) => (k?.names?.length ?? 0) > 0);
  return [...RACES.filter(has), ...Object.keys(book).filter((r) => r !== 'any' && !(RACES as readonly string[]).includes(r) && has(r)).sort()];
};

// ---------- Filters ----------
export type LengthFilter = 'any' | 'short' | 'medium' | 'long';
export type SoundFilter = 'any' | 'melodic' | 'soft' | 'harsh';

const letters = (s: string) => s.toLowerCase().replace(/[^a-zа-яё]/g, '');
// Short — up to 5 letters, medium — 6–7, long — 8 and more (most fantasy names are 5–7 letters long).
export function lengthOf(name: string): Exclude<LengthFilter, 'any'> {
  const n = letters(name).length;
  return n <= 5 ? 'short' : n <= 7 ? 'medium' : 'long';
}

const VOWELS = /[aeiouyаеёиоуыэюя]/;
const HARSH = /[kgtdxzqcpbкгтдхзжцчшщпб]/;
const SONOROUS = /[lmnrwлмнрйь]/;
// How a name sounds, roughly: harsh — many hard consonants (Grukk, Тордек), melodic — mostly vowels and sonorous
// consonants and an open ending (Aelia, Лиаэль), soft — everything in between.
export function soundOf(name: string): Exclude<SoundFilter, 'any'> {
  const s = letters(name);
  if (!s) return 'soft';
  let v = 0;
  let h = 0;
  let r = 0;
  for (const ch of s) {
    if (VOWELS.test(ch)) v++;
    else if (HARSH.test(ch)) h++;
    else if (SONOROUS.test(ch)) r++;
  }
  if (h / s.length >= 0.34 || /(kk|gg|rr|zz|кк|гг|рр|ргх|кх)/.test(s)) return 'harsh';
  if (v / s.length >= 0.45 && h <= 1 && (VOWELS.test(s.at(-1)!) || SONOROUS.test(s.at(-1)!))) return 'melodic';
  return 'soft';
}

const fold = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

export interface NameOptions {
  race: Race;
  gender: Gender;
  // name — just a name, full — name and surname.
  form: 'name' | 'full';
  nickname: 'none' | 'simple' | 'epic';
  length: LengthFilter;
  sound: SoundFilter;
  // First letters of the name (any case, «е» = «ё»); empty — any.
  first: string;
  count: number;
}

export interface GeneratedName {
  name: string;
  surname?: string;
  nickname?: string;
  epithet?: string;
}

// Names that pass the filters.
export function filterNames(names: string[], o: Pick<NameOptions, 'length' | 'sound' | 'first'>): string[] {
  const first = fold(o.first.trim());
  return names.filter(
    (n) => (o.length === 'any' || lengthOf(n) === o.length) && (o.sound === 'any' || soundOf(n) === o.sound) && (!first || fold(n).startsWith(first))
  );
}

// Generate up to o.count different names. Without names that pass the filters — an empty list.
export function generateNames(book: NameBook, o: NameOptions, random: () => number = Math.random): GeneratedName[] {
  const names = filterNames(entriesFor(book, o.race, o.gender, 'names'), o);
  const surnames = entriesFor(book, o.race, o.gender, 'surnames');
  const nicknames = entriesFor(book, o.race, o.gender, o.nickname === 'epic' ? 'epithets' : 'nicknames');
  const pick = (list: string[]) => list[Math.floor(random() * list.length)]!;
  const out: GeneratedName[] = [];
  const used = new Set<string>();
  const want = Math.max(1, Math.min(o.count, 100));
  // Fewer names than asked — each name once, in random order.
  const pool = [...names];
  for (let tries = 0; out.length < want && pool.length && tries < want * 20; tries++) {
    const i = Math.floor(random() * pool.length);
    const name = pool[i]!;
    const g: GeneratedName = { name };
    if (o.form === 'full' && surnames.length) g.surname = pick(surnames);
    if (o.nickname === 'simple' && nicknames.length) g.nickname = pick(nicknames);
    if (o.nickname === 'epic' && nicknames.length) g.epithet = pick(nicknames);
    const key = nameText(g, (s) => s);
    if (used.has(key)) continue;
    used.add(key);
    out.push(g);
    if (names.length <= want) pool.splice(i, 1);
  }
  return out;
}

// «Aldric “the Lame” Moor», «Aldric Moor, Slayer of Wyrms». quote — the language's quotes around a nickname.
export function nameText(g: GeneratedName, quote: (s: string) => string): string {
  const head = [g.name, g.nickname ? quote(g.nickname) : '', g.surname ?? ''].filter(Boolean).join(' ');
  return g.epithet ? `${head}, ${g.epithet}` : head;
}
