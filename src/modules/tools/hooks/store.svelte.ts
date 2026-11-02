// Adventure hook generator in the control window: the theme, the current hook with its pinned parts (remembered by
// the window), the content in the interface language; the patron comes from the NPC generator.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { RACES } from '../../../shared/names';
import { helpers as townHelpers } from '../settlement/store.svelte';
import { en } from './content/en';
import { ru } from './content/ru';
import { generateHook, generateHookPart, rerollHook, type Helpers } from './generate';
import type { Hook, HookContent, HookPart, Theme } from './types';

const CONTENT: Record<string, HookContent> = { en, ru };
const contentLang = () => (CONTENT[locale.lang] ? locale.lang : 'en');

const KEY = 'hooks.state';
interface Saved {
  theme: Theme | 'random';
  hook: Hook | null;
  pinned: HookPart[];
  lang: string;
}
function load(): Saved {
  const empty: Saved = { theme: 'random', hook: null, pinned: [], lang: '' };
  try {
    return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null) };
  } catch {
    return empty;
  }
}
export const hooks = $state(load());
export const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(hooks)));
  } catch {
    /* not remembered — not a problem */
  }
};

// The patron: mostly a human, sometimes any other people of the name lists.
async function helpers(lang: string): Promise<Helpers> {
  const town = await townHelpers(lang);
  return {
    patron: () => {
      const p = town.person(Math.random() < 0.6 ? 'human' : RACES[Math.floor(Math.random() * RACES.length)]!);
      return { name: p.name, occupation: p.occupation, trait: p.trait };
    },
  };
}

export async function createHook() {
  const lang = contentLang();
  hooks.hook = generateHook(hooks.theme, CONTENT[lang]!, await helpers(lang));
  hooks.lang = lang;
  hooks.pinned = [];
  save();
}
export async function rerollUnpinned() {
  if (!hooks.hook) return;
  const lang = hooks.lang || contentLang();
  hooks.hook = rerollHook($state.snapshot(hooks.hook) as Hook, hooks.pinned, CONTENT[lang]!, await helpers(lang));
  save();
}
export async function rerollPart(part: HookPart) {
  if (!hooks.hook) return;
  const lang = hooks.lang || contentLang();
  const h = $state.snapshot(hooks.hook) as Hook;
  hooks.hook = { ...h, ...generateHookPart(part, h, CONTENT[lang]!, await helpers(lang)) };
  save();
}
export function togglePin(part: HookPart) {
  hooks.pinned = hooks.pinned.includes(part) ? hooks.pinned.filter((p) => p !== part) : [...hooks.pinned, part];
  save();
}
