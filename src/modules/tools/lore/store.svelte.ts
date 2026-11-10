// A generator of parts in the control window: the kind chosen, the current result with its pinned parts (remembered
// by the window), the content in the interface language; people come from the NPC generator.
import { locale } from '../../../renderer/lib/i18n.svelte';
import { RACES } from '../../../shared/names';
import { helpers as townHelpers } from '../settlement/store.svelte';
import { generate, reroll, rerollOne, type Helpers, type PartSpec, type Result } from './engine';

interface Saved {
  kind: string;
  result: Result | null;
  // The kind the result was made of (the chosen one may be «random»).
  made: string;
  pinned: string[];
  lang: string;
}

async function people(lang: string): Promise<Helpers> {
  const town = await townHelpers(lang);
  return {
    person: () => {
      const p = town.person(Math.random() < 0.6 ? 'human' : RACES[Math.floor(Math.random() * RACES.length)]!);
      return { name: p.name, occupation: p.occupation, trait: p.trait };
    },
  };
}

export function loreStore<C>(key: string, contents: Record<string, C>, partsOf: (kind: string) => PartSpec<C>[], kinds: readonly string[] = ['']) {
  const empty: Saved = { kind: kinds.length > 1 ? 'random' : kinds[0]!, result: null, made: kinds[0]!, pinned: [], lang: '' };
  let saved = empty;
  try {
    saved = { ...empty, ...(JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<Saved> | null) };
  } catch {
    /* a fresh start */
  }
  const s = $state(saved);
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify($state.snapshot(s)));
    } catch {
      /* not remembered — not a problem */
    }
  };
  const lang = () => s.lang || (contents[locale.lang] ? locale.lang : 'en');
  return {
    s,
    save,
    async create() {
      const l = contents[locale.lang] ? locale.lang : 'en';
      const kind = s.kind === 'random' ? kinds[Math.floor(Math.random() * kinds.length)]! : s.kind;
      s.result = generate(partsOf(kind), contents[l]!, await people(l));
      s.made = kind;
      s.lang = l;
      s.pinned = [];
      save();
    },
    async rerollUnpinned() {
      if (!s.result) return;
      s.result = reroll(partsOf(s.made), $state.snapshot(s.result), s.pinned, contents[lang()]!, await people(lang()));
      save();
    },
    async rerollPart(id: string) {
      if (!s.result) return;
      s.result = rerollOne(partsOf(s.made), id, $state.snapshot(s.result), contents[lang()]!, await people(lang()));
      save();
    },
    togglePin(id: string) {
      s.pinned = s.pinned.includes(id) ? s.pinned.filter((p) => p !== id) : [...s.pinned, id];
      save();
    },
  };
}
export type LoreStore = ReturnType<typeof loreStore>;
