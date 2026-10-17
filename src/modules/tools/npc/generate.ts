// NPC generation: pure functions over the content of one language and the name book (shared/names.ts).
import { entriesFor, RACES, type NameBook } from '../../../shared/names';
import type { Npc, NpcContent, NpcOptions, NpcPart } from './types';
import { IMPORTANCE } from './types';

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;
function pickSome<T>(list: T[], n: number, r: Random): T[] {
  const pool = [...list];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}

const RACE_WEIGHTS: Record<string, number> = { human: 45, dwarf: 13, halfling: 12, elf: 12, gnome: 7, tiefling: 6, dragonborn: 5 };
function pickRace(book: NameBook, r: Random): string {
  const have = RACES.filter((race) => entriesFor(book, race, 'male', 'names').length && entriesFor(book, race, 'female', 'names').length);
  const total = have.reduce((n, race) => n + (RACE_WEIGHTS[race] ?? 5), 0);
  let x = r() * total;
  for (const race of have) if ((x -= RACE_WEIGHTS[race] ?? 5) < 0) return race;
  return have[0] ?? 'human';
}

const level = (n: Npc) => IMPORTANCE.indexOf(n.importance);

export function generateNpcPart(part: NpcPart, n: Npc, c: NpcContent, book: NameBook, r: Random = Math.random): Partial<Npc> {
  switch (part) {
    case 'name': {
      const names = entriesFor(book, n.race, n.gender, 'names');
      const surnames = entriesFor(book, n.race, n.gender, 'surnames');
      const nicknames = entriesFor(book, n.race, n.gender, 'nicknames');
      const epithets = entriesFor(book, n.race, n.gender, 'epithets');
      const l = level(n);
      return {
        name: names.length ? pick(names, r) : '?',
        surname: l >= 1 && surnames.length && r() < 0.8 ? pick(surnames, r) : l === 0 && surnames.length && r() < 0.4 ? pick(surnames, r) : '',
        // Common — no nickname; uncommon — sometimes a simple one; rare — a simple one; very rare and up — an epithet.
        nickname: (l === 1 && r() < 0.5) || l === 2 ? (nicknames.length ? pick(nicknames, r) : '') : '',
        epithet: l >= 3 && epithets.length ? pick(epithets, r) : '',
      };
    }
    case 'occupation':
      return { occupation: pick(c.occupations, r)[n.gender] };
    case 'appearance':
      return { appearance: pickSome(c.appearance, level(n) >= 2 ? 2 : 1, r) };
    case 'trait':
      return { trait: pick(c.traits, r) };
    case 'manner':
      return { manner: pick(c.manners, r) };
    case 'desire':
      return { desire: pick(c.desires, r), fame: level(n) >= 2 ? pick(c.fame, r) : '' };
    case 'secret':
      return { secret: pick(c.secrets, r) };
    case 'item': {
      // The more important, the likelier a magic trinket.
      const magic = [0, 0.05, 0.2, 0.4, 0.7, 1][level(n)]!;
      return { item: r() < magic ? pick(c.magicItems, r) : pick(c.items, r) };
    }
  }
}

export function generateNpc(c: NpcContent, book: NameBook, o: NpcOptions, r: Random = Math.random): Npc {
  const race = o.race && entriesFor(book, o.race, 'male', 'names').length + entriesFor(book, o.race, 'female', 'names').length ? o.race : pickRace(book, r);
  const gender = o.gender === 'random' ? (r() < 0.5 ? 'male' : 'female') : o.gender;
  // Random importance leans to the ordinary.
  const importance = o.importance !== 'random' ? o.importance : pick(['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'veryRare', 'legendary'] as const, r);
  let n = { race, gender, importance } as Npc;
  for (const part of ['name', 'occupation', 'appearance', 'trait', 'manner', 'desire', 'secret', 'item'] as const) n = { ...n, ...generateNpcPart(part, n, c, book, r) };
  return n;
}

// Reroll every part that is not pinned (race, gender and importance stay; a new NPC — generateNpc).
export function rerollNpc(n: Npc, pinned: NpcPart[], c: NpcContent, book: NameBook, r: Random = Math.random): Npc {
  let next = { ...n };
  for (const part of ['name', 'occupation', 'appearance', 'trait', 'manner', 'desire', 'secret', 'item'] as const) {
    if (!pinned.includes(part)) next = { ...next, ...generateNpcPart(part, next, c, book, r) };
  }
  return next;
}

// «Aldric “the Lame” Moor, Bane of Giants».
export function npcName(n: Npc, quote: (s: string) => string): string {
  const head = [n.name, n.nickname ? quote(n.nickname) : '', n.surname].filter(Boolean).join(' ');
  return n.epithet ? `${head}, ${n.epithet}` : head;
}
