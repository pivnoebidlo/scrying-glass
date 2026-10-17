// NPC generator in the control window: options, the current NPC with its pinned parts and the history of recent ones
// (remembered by the window), the content in the interface language, names from the name generator's lists.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { fullBook, loadOwn } from '../names/store.svelte';
import { en } from './content/en';
import { ru } from './content/ru';
import { generateNpc, generateNpcPart, rerollNpc } from './generate';
import type { Npc, NpcContent, NpcOptions, NpcPart } from './types';

const CONTENT: Record<string, NpcContent> = { en, ru };
export const contentLang = () => (CONTENT[locale.lang] ? locale.lang : 'en');

const KEY = 'npc.state';
const HISTORY_MAX = 30;
const DEFAULTS: NpcOptions = { race: '', gender: 'random', importance: 'random' };

interface Saved {
  opts: NpcOptions;
  npc: Npc | null;
  pinned: NpcPart[];
  // Language of the NPC's texts (an interface language switch doesn't mix languages inside one NPC).
  lang: string;
  history: { npc: Npc; lang: string }[];
}
function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    return { opts: { ...DEFAULTS, ...v?.opts }, npc: v?.npc ?? null, pinned: v?.pinned ?? [], lang: v?.lang ?? '', history: v?.history ?? [] };
  } catch {
    return { opts: { ...DEFAULTS }, npc: null, pinned: [], lang: '', history: [] };
  }
}

export const npcs = $state(load());
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(npcs)));
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
const content = () => CONTENT[contentLang()]!;

function remember() {
  if (!npcs.npc) return;
  npcs.history = [{ npc: $state.snapshot(npcs.npc) as Npc, lang: npcs.lang }, ...npcs.history].slice(0, HISTORY_MAX);
}

export async function createNpc() {
  npcs.npc = generateNpc(content(), await names(), $state.snapshot(npcs.opts));
  npcs.pinned = [];
  npcs.lang = contentLang();
  remember();
  save();
}

export async function rerollUnpinned() {
  if (!npcs.npc || npcs.lang !== contentLang()) return createNpc();
  npcs.npc = rerollNpc($state.snapshot(npcs.npc) as Npc, npcs.pinned, content(), await names());
  remember();
  save();
}

export async function rerollPart(part: NpcPart) {
  if (!npcs.npc || npcs.lang !== contentLang()) return;
  npcs.npc = { ...npcs.npc, ...generateNpcPart(part, $state.snapshot(npcs.npc) as Npc, content(), await names()) };
  save();
}

export function togglePin(part: NpcPart) {
  npcs.pinned = npcs.pinned.includes(part) ? npcs.pinned.filter((p) => p !== part) : [...npcs.pinned, part];
  save();
}

// Back to an NPC from the history.
export function restore(i: number) {
  const h = npcs.history[i];
  if (!h) return;
  npcs.npc = structuredClone($state.snapshot(h.npc) as Npc);
  npcs.lang = h.lang;
  npcs.pinned = [];
  save();
}
export function clearHistory() {
  npcs.history = [];
  save();
}
