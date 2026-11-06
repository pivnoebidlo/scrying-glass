// The sheet of a character on a player's phone: loaded on demand, so the page does not carry the tools and editors
// of systems/ui.ts. A new plugin with a sheet — one line in SHEETS.
import type { Component } from 'svelte';
import type { Card } from '../shared/cards';
import { familyOf } from '.';
import { isCharacter as isDnd } from './dnd5e/character';

type Sheet = Component<{ card: Card<any> }>;
type Load = () => Promise<{ default: Sheet }>;

const SHEETS: Record<string, (stats: unknown) => Load | undefined> = {
  dnd5e: (s) => (isDnd(s) ? () => import('./dnd5e/CharacterSheet.svelte') as Promise<{ default: Sheet }> : undefined),
};

export async function sheetOf(card: Card, pack: boolean): Promise<Sheet> {
  if (pack) return ((await import('./pack/Sheet.svelte')) as { default: Sheet }).default;
  const load = SHEETS[familyOf(card.system)]?.(card.stats);
  return (await (load?.() ?? (import('./GenericStats.svelte') as Promise<{ default: Sheet }>))).default;
}
