// Reshape a stat block: the base card and what is done to it (kept while the window is open).
import { openTab } from '../../../renderer/lib/nav';
import type { Card, CardRef } from '../../../shared/cards';
import { NO_RESHAPE, type Reshape } from '../../../systems/dnd5e/reshape';
import type { Dnd5eStats } from '../../../systems/dnd5e/stats';
import { ui } from '../ui/ui.svelte';

export const rs = $state({
  base: null as Card<Dnd5eStats> | null,
  ref: null as CardRef | null,
  // Empty — the base's name with the templates.
  name: '',
  r: structuredClone(NO_RESHAPE) as Reshape,
  // A portrait the card is made for (Characters → «From a stat block…»): it goes next to it, with its name.
  target: null as { portrait: string; name: string } | null,
});

export async function pickBase(ref: CardRef) {
  const c = (await window.api.getCard(ref)) as Card<Dnd5eStats> | null;
  if (!c) return;
  rs.base = c;
  rs.ref = ref;
  rs.name = '';
  rs.r = structuredClone(NO_RESHAPE);
}

// «From a stat block…» under a portrait without a card: the tool, a base to pick, the card — for this portrait.
export function reshapeFor(portrait: string, name: string) {
  rs.target = { portrait, name };
  rs.base = null;
  rs.ref = null;
  rs.name = '';
  rs.r = structuredClone(NO_RESHAPE);
  ui.tool = 'reshape';
  ui.note = null;
  openTab('tools');
}

// «Reshape…» on a card: the tool with it as the base.
export async function reshapeFrom(ref: CardRef) {
  rs.target = null;
  await pickBase(ref);
  ui.tool = 'reshape';
  ui.note = null;
  openTab('tools');
}

export const editionOf = (system: string): '2014' | '2024' => (system.endsWith('2014') ? '2014' : '2024');
