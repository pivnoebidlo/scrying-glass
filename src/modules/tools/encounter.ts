// Generators → an encounter preset: creatures named in a dungeon room or a road event become combatants of a new
// encounter of the current adventure, and the Initiative tab opens on it. Cards are found by name: the language of
// the text, the current adventure's system first, own cards before the built-in ones.
import { openTab } from '../../renderer/lib/nav';
import { dispatch, store } from '../../renderer/lib/store.svelte';
import { currentSystem, inCurrentFamily } from '../../shared/adventures';
import type { CardSummary } from '../../shared/cards';
import { bestiary, connectCards } from '../bestiary/ui/cards.svelte';
import { addToInitiative } from '../bestiary/ui/combat';
import { ui as initiativeUi } from '../initiative/ui/ui.svelte';

const fold = (s: string) => s.normalize('NFC').trim().toLowerCase().replace(/ё/g, 'е').replace(/[’']/g, "'");

export function findCard(name: string, lang: string): CardSummary | undefined {
  const adv = store.state.adventures;
  const system = currentSystem(adv);
  const key = fold(name);
  const named = bestiary.all.filter((c) => fold(c.name) === key && inCurrentFamily(adv, c.system));
  const score = (c: CardSummary) => (c.lang === lang ? 4 : 0) + (c.system === system ? 2 : 0) + (c.ref.scope !== 'srd' ? 1 : 0);
  return named.sort((a, b) => score(b) - score(a))[0];
}

// How many come when the text does not say: the weaker the creature, the bigger the group.
export const groupSize = (c: CardSummary) => (c.rank === null ? 1 : c.rank <= 0.25 ? 4 : c.rank <= 1 ? 2 : 1);

// Make the encounter; returns the names that have no card here (nothing is made if none has).
export async function toEncounter(title: string, groups: { name: string; count?: number }[], lang: string): Promise<string[]> {
  await connectCards();
  const found = groups.map((g) => ({ ...g, card: findCard(g.name, lang) }));
  const missing = found.filter((g) => !g.card).map((g) => g.name);
  if (missing.length === found.length) return missing;
  const id = crypto.randomUUID();
  await dispatch('initiative', 'createEncounter', { id, name: title, adventure: store.state.adventures.current });
  for (const g of found) if (g.card) await addToInitiative(g.card, { count: g.count ?? groupSize(g.card), encounter: id });
  initiativeUi.encounter = id;
  openTab('initiative');
  return missing;
}
