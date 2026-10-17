// Tavern generator in the control window: options and the current tavern with its pinned parts (remembered by the
// window, so a tavern survives a restart), the content in the interface language and the name lists.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { fullBook, loadOwn } from '../names/store.svelte';
import { en } from './content/en';
import { ru } from './content/ru';
import { generatePart, generateTavern, rerollTavern } from './generate';
import type { Tavern, TavernContent, TavernOptions, TavernPart } from './types';

const CONTENT: Record<string, TavernContent> = { en, ru };
// Content in the interface language, else English; names — in the same language.
export const contentLang = () => (CONTENT[locale.lang] ? locale.lang : 'en');
export const content = () => CONTENT[contentLang()]!;

const KEY = 'tavern.state';
const DEFAULTS: TavernOptions = { type: 'tavern', wealth: 'modest', crowd: 'usual', lodging: 'auto', wonders: 'rare' };

interface Saved {
  opts: TavernOptions;
  tavern: Tavern | null;
  pinned: TavernPart[];
  // Language of the tavern's texts: switching the interface language doesn't mix languages inside one tavern.
  lang: string;
}
function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    return { opts: { ...DEFAULTS, ...v?.opts }, tavern: v?.tavern ?? null, pinned: v?.pinned ?? [], lang: v?.lang ?? '' };
  } catch {
    return { opts: { ...DEFAULTS }, tavern: null, pinned: [], lang: '' };
  }
}

export const tavern = $state(load());
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(tavern)));
  } catch {
    /* not remembered — not a problem */
  }
};
export const saveOptions = save;

let ownLoaded = false;
async function names() {
  if (!ownLoaded) {
    ownLoaded = true;
    await loadOwn();
  }
  return fullBook(contentLang());
}

export async function createTavern() {
  tavern.tavern = generateTavern(content(), await names(), $state.snapshot(tavern.opts));
  tavern.pinned = [];
  tavern.lang = contentLang();
  save();
}

export async function rerollUnpinned() {
  if (!tavern.tavern || tavern.lang !== contentLang()) return createTavern();
  tavern.tavern = rerollTavern($state.snapshot(tavern.tavern) as Tavern, tavern.pinned, content(), await names(), $state.snapshot(tavern.opts));
  save();
}

export async function rerollPart(part: TavernPart) {
  if (!tavern.tavern) return;
  tavern.tavern = { ...tavern.tavern, ...generatePart(part, $state.snapshot(tavern.tavern) as Tavern, content(), await names(), $state.snapshot(tavern.opts)) };
  save();
}

export function togglePin(part: TavernPart) {
  tavern.pinned = tavern.pinned.includes(part) ? tavern.pinned.filter((p) => p !== part) : [...tavern.pinned, part];
  save();
}

// Content of the tavern's own language (the interface language may have changed since).
export const tavernContent = () => CONTENT[tavern.lang] ?? content();
