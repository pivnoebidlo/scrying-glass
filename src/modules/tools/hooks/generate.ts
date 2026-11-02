// Adventure hook generation: pure functions over the content of one language. The patron comes from the NPC
// generator through a callback (the page passes it in).
import type { Hook, HookContent, HookPart, Patron, Theme } from './types';
import { THEMES } from './types';

type Random = () => number;
const pick = <T>(list: T[], r: Random): T => list[Math.floor(r() * list.length)]!;

export interface Helpers {
  patron: () => Patron;
}

export function generateHookPart(part: HookPart, h: Hook, c: HookContent, help: Helpers, r: Random = Math.random): Partial<Hook> {
  switch (part) {
    case 'patron':
      return { patron: help.patron(), approach: pick(c.approaches, r) };
    case 'task':
      return { task: pick(c.tasks[h.theme], r), deadline: pick(c.deadlines, r), stakes: pick(c.stakes, r) };
    case 'place':
      return { place: pick(c.places, r) };
    case 'foe':
      return { foe: pick(c.foes, r) };
    case 'twist':
      return { twist: pick(c.twists, r) };
    case 'reward':
      return { reward: pick(c.rewards, r) };
  }
}

const ORDER: HookPart[] = ['patron', 'task', 'place', 'foe', 'twist', 'reward'];

export function generateHook(theme: Theme | 'random', c: HookContent, help: Helpers, r: Random = Math.random): Hook {
  let h = { theme: theme === 'random' ? pick([...THEMES], r) : theme } as Hook;
  for (const part of ORDER) h = { ...h, ...generateHookPart(part, h, c, help, r) };
  return h;
}

export function rerollHook(h: Hook, pinned: HookPart[], c: HookContent, help: Helpers, r: Random = Math.random): Hook {
  let next = { ...h };
  for (const part of ORDER) if (!pinned.includes(part)) next = { ...next, ...generateHookPart(part, next, c, help, r) };
  return next;
}

// The approach with the patron put in: «Mira Stone, a miller, finds the heroes at the inn».
export const approachText = (h: Hook) => h.approach.replace(/\{patron\}/g, `${h.patron.name}, ${h.patron.occupation},`);
