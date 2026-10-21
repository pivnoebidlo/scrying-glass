// Tavern generation: pure functions over the content of one language and the name book (shared/names.ts).
import { entriesFor, type NameBook } from '../../../shared/names';
import type { Gendered, MenuItem, Person, Tavern, TavernContent, TavernOptions, TavernPart, Wealth } from './types';
import { WEALTH } from './types';

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;
// n different items (fewer if the list is shorter).
function pickSome<T>(list: T[], n: number, r: Random): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}
const between = (min: number, max: number, r: Random) => min + Math.floor(r() * (max - min + 1));

// Who runs and visits taverns: mostly humans, then dwarves and halflings.
const RACE_WEIGHTS: [string, number][] = [
  ['human', 45], ['dwarf', 15], ['halfling', 14], ['elf', 10], ['gnome', 7], ['tiefling', 5], ['dragonborn', 4],
];
function pickRace(book: NameBook, r: Random): string {
  const have = RACE_WEIGHTS.filter(([race]) => entriesFor(book, race, 'male', 'names').length && entriesFor(book, race, 'female', 'names').length);
  const total = have.reduce((n, [, w]) => n + w, 0);
  let x = r() * total;
  for (const [race, w] of have) if ((x -= w) < 0) return race;
  return have[0]?.[0] ?? 'human';
}

function person(book: NameBook, role: (g: 'male' | 'female') => string, r: Random, surname: boolean): Person {
  const race = pickRace(book, r);
  const gender = r() < 0.5 ? 'male' : 'female';
  const names = entriesFor(book, race, gender, 'names');
  const surnames = entriesFor(book, race, gender, 'surnames');
  const name = [names.length ? pick(names, r) : '?', surname && surnames.length ? pick(surnames, r) : ''].filter(Boolean).join(' ');
  return { name, race, gender, role: role(gender) };
}
const roleOf = (g: Gendered) => (gender: 'male' | 'female') => g[gender];

// Prices: the base (modest) price scaled by the wealth of the place, rounded to sensible coins.
const MULTIPLIER: Record<Wealth, number> = { squalid: 0.5, poor: 0.75, modest: 1, comfortable: 1.5, wealthy: 3, aristocratic: 6 };
// SRD lodging per day, in copper.
const ROOM_PRICE: Record<Wealth, number> = { squalid: 7, poor: 10, modest: 50, comfortable: 80, wealthy: 200, aristocratic: 400 };

export function coins(cp: number, c: TavernContent['coins']): string {
  const n = Math.max(1, Math.round(cp));
  // Above a few silver — round to silver; above 10 gold — to gold.
  const v = n >= 1000 ? Math.round(n / 100) * 100 : n >= 30 ? Math.round(n / 10) * 10 : n;
  const gp = Math.floor(v / 100);
  const sp = Math.floor((v % 100) / 10);
  const cpLeft = v % 10;
  return [gp && c.gp.replace('{n}', String(gp)), sp && c.sp.replace('{n}', String(sp)), cpLeft && c.cp.replace('{n}', String(cpLeft))].filter(Boolean).join(' ');
}

const levelOf = (w: Wealth) => WEALTH.indexOf(w);

// What this place serves: its wealth within the item's range, its kind among the item's kinds. An item made for
// this kind of place weighs more (a harbor tavern leans to fish).
export function menuFor(list: MenuItem[], o: Pick<TavernOptions, 'type' | 'wealth'>): { item: MenuItem; weight: number }[] {
  const at = levelOf(o.wealth);
  return list
    .filter((m) => levelOf(m.from) <= at && at <= levelOf(m.to) && (!m.types || m.types.includes(o.type)))
    .map((item) => ({ item, weight: item.types ? 3 : 1 }));
}
// n different items, the heavier ones more likely.
function pickWeighted<T>(list: { item: T; weight: number }[], n: number, r: Random): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    let x = r() * pool.reduce((sum, p) => sum + p.weight, 0);
    const i = Math.max(0, pool.findIndex((p) => (x -= p.weight) < 0));
    out.push(pool.splice(i, 1)[0]!.item);
  }
  return out;
}

// One part of a tavern, generated anew (the others are kept: pinned or not asked for).
export function generatePart(part: TavernPart, t: Tavern, c: TavernContent, book: NameBook, o: TavernOptions, r: Random = Math.random): Partial<Tavern> {
  switch (part) {
    case 'name': {
      const noun = pick(c.nouns, r);
      if (r() < 0.75) {
        const adj = pick(c.adjectives, r)[noun.gender];
        return { name: c.name.adjectiveNoun.replace('{adjective}', adj).replace('{noun}', noun.word), sign: `${noun.sign}, ${pick(c.signStates, r)}` };
      }
      const other = pick(c.nouns.filter((x) => x !== noun), r);
      const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
      const name = c.name.nounAndNoun.replace('{Noun}', cap(noun.word)).replace('{noun}', noun.word).replace('{noun2}', other.word);
      return { name, sign: `${noun.sign}, ${pick(c.signStates, r)}` };
    }
    case 'intro': {
      const parts = [pick(c.exterior[o.type], r), pick(c.interior, r), pick(c.smell, r), pick(c.sound[o.crowd], r)];
      const wonder = o.wonders === 'none' ? undefined : o.wonders === 'often' || r() < 0.4 ? pick(c.wonders, r) : undefined;
      return { intro: parts.join(' '), wonder };
    }
    case 'owner': {
      const p = person(book, roleOf(c.ownerTitle), r, true);
      return { owner: { ...p, trait: pick(c.traits, r), catchphrase: pick(c.catchphrases, r), secret: pick(c.ownerSecrets, r) } };
    }
    case 'staff': {
      const n = o.type === 'den' ? between(1, 2, r) : between(1, 3, r);
      return { staff: pickSome(c.staff, n, r).map((role) => ({ ...person(book, roleOf(role), r, false), trait: pick(c.traits, r) })) };
    }
    case 'patrons': {
      const n = o.crowd === 'quiet' ? between(1, 2, r) : o.crowd === 'usual' ? between(3, 4, r) : between(5, 6, r);
      const doings = pickSome(c.doings, n, r);
      const secrets = pickSome(c.patronSecrets, n, r);
      return {
        patrons: pickSome(c.occupations, n, r).map((occ, i) => ({ ...person(book, roleOf(occ), r, r() < 0.5), doing: doings[i], secret: secrets[i] })),
      };
    }
    case 'menu': {
      const price = (cp: number) => coins(cp * MULTIPLIER[o.wealth], c.coins);
      const drinks = pickWeighted(menuFor(c.drinks, o), between(3, 5, r), r);
      const food = pickWeighted(menuFor(c.food, o), between(3, 5, r), r);
      return {
        menu: [...drinks.map((d) => ({ name: d.name, price: price(d.price), kind: 'drink' as const })), ...food.map((d) => ({ name: d.name, price: price(d.price), kind: 'food' as const }))],
      };
    }
    case 'rooms': {
      const lodging = o.lodging === 'yes' || (o.lodging === 'auto' && (o.type === 'inn' || o.type === 'roadside' || (o.type !== 'den' && o.type !== 'winehouse' && r() < 0.5)));
      if (!lodging) return { rooms: [], services: [] };
      const at = levelOf(o.wealth);
      const tiers = [at - 1, at, at + 1].filter((i) => i >= 0 && i < WEALTH.length).map((i) => WEALTH[i]!);
      return {
        rooms: tiers.map((w) => ({ name: c.rooms[w], price: coins(ROOM_PRICE[w], c.coins) })),
        services: pickSome(c.services, between(1, 2, r), r),
      };
    }
    case 'event':
      return { event: Math.floor(r() * c.events.length) };
    case 'rumors':
      return { rumors: pickSome(c.rumors, 3, r) };
    case 'request':
      return { request: Math.floor(r() * c.requests.length) };
    case 'secret':
      return { secret: pick(c.secrets, r) };
  }
}

export function generateTavern(c: TavernContent, book: NameBook, o: TavernOptions, r: Random = Math.random): Tavern {
  let t = { type: o.type, wealth: o.wealth } as Tavern;
  for (const part of ['name', 'intro', 'owner', 'staff', 'patrons', 'menu', 'rooms', 'event', 'rumors', 'request', 'secret'] as const) {
    t = { ...t, ...generatePart(part, t, c, book, o, r) };
  }
  return t;
}

// Reroll every part that is not pinned.
export function rerollTavern(t: Tavern, pinned: TavernPart[], c: TavernContent, book: NameBook, o: TavernOptions, r: Random = Math.random): Tavern {
  let next: Tavern = { ...t, type: o.type, wealth: o.wealth };
  for (const part of ['name', 'intro', 'owner', 'staff', 'patrons', 'menu', 'rooms', 'event', 'rumors', 'request', 'secret'] as const) {
    if (!pinned.includes(part)) next = { ...next, ...generatePart(part, next, c, book, o, r) };
  }
  return next;
}

// An event or a request with the names of this tavern's people.
export function withPeople(template: string, t: Tavern): string {
  const patron = t.patrons[0]?.name ?? t.owner.name;
  return template
    .replaceAll('{owner}', t.owner.name)
    .replaceAll('{staff}', t.staff[0]?.name ?? t.owner.name)
    .replaceAll('{patron}', patron)
    .replaceAll('{patron2}', t.patrons[1]?.name ?? t.staff[0]?.name ?? patron);
}
