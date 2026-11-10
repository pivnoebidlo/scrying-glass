// A generator of parts (ships, guilds and cults): a result is named lines of text; each part rolls some of them and
// can be rerolled or pinned. Pure functions over the content of one language; people come from the NPC generator.
export type Result = Record<string, string>;
export type Random = () => number;

export interface Person {
  name: string;
  occupation: string;
  trait: string;
}
export interface Helpers {
  person: () => Person;
}

export interface PartSpec<C> {
  id: string;
  roll(c: C, now: Result, help: Helpers, r: Random): Result;
}

export const pick = <T>(list: readonly T[], r: Random): T => list[Math.floor(r() * list.length)]!;
export const between = (lo: number, hi: number, r: Random) => lo + Math.floor(r() * (hi - lo + 1));

// The parts in order: a later one may read what an earlier one rolled (the trade of a guild, the kind of a ship).
export function generate<C>(parts: PartSpec<C>[], c: C, help: Helpers, r: Random = Math.random, start: Result = {}): Result {
  let now = { ...start };
  for (const p of parts) now = { ...now, ...p.roll(c, now, help, r) };
  return now;
}

export function reroll<C>(parts: PartSpec<C>[], now: Result, pinned: string[], c: C, help: Helpers, r: Random = Math.random): Result {
  let next = { ...now };
  for (const p of parts) if (!pinned.includes(p.id)) next = { ...next, ...p.roll(c, next, help, r) };
  return next;
}

export function rerollOne<C>(parts: PartSpec<C>[], id: string, now: Result, c: C, help: Helpers, r: Random = Math.random): Result {
  const p = parts.find((x) => x.id === id);
  return p ? { ...now, ...p.roll(c, now, help, r) } : now;
}

export interface Section {
  label: string;
  lines: string[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => (/[.!?…»"]$/.test(s) ? s : `${s}.`);
export const sentence = (s: string) => end(cap(s.trim()));

// For the journal and the clipboard.
export function loreMarkdown(title: string, sections: Section[], heading?: string): string {
  const out = heading ? [`# ${heading}`, ''] : [];
  out.push(`**${title}**`, '');
  for (const s of sections) {
    if (s.lines.length === 1) out.push(`- **${s.label}:** ${s.lines[0]}`);
    else out.push(`- **${s.label}:**`, ...s.lines.map((l) => `  - ${l}`));
  }
  return out.join('\n');
}

// How a page shows a result: its parts with labels, a lead line set apart (a quote: what the heroes see first).
export interface LorePart {
  id: string;
  label: string;
  lines: string[];
  lead?: string;
  wide?: boolean;
}
export interface LoreView {
  title: string;
  // The journal page's name.
  page: string;
  parts: LorePart[];
}
