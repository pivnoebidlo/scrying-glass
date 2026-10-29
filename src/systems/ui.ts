// Компоненты систем для окна управления: как показать и как править блок stats карточки.
// A plugin's part for the windows — `SystemUi` (the shared part is systems/plugin.ts); a new plugin — one line in
// UIS. A pack system has its generic sheet, editor and tracker cells; an unknown one — «field — value» and JSON.
import type { Component } from 'svelte';
import type { Card, CardRef, CardSummary } from '../shared/cards';
import type { FieldValue } from '../shared/entrytypes';
import GenericStats from './GenericStats.svelte';
import GenericEditor from './GenericEditor.svelte';
import HpCells from './HpCells.svelte';
import PackSheet from './pack/Sheet.svelte';
import PackEditor from './pack/Editor.svelte';
import PackTrackerCells from './pack/TrackerCells.svelte';
import { isPackFamily, packOf } from './packs';
import type { Combatant } from '../modules/initiative/types';
import type { CardKind } from '../shared/cards';
import { familyOf } from '.';
import type { ToolDef } from '../modules/tools/ui/registry.svelte';
import type { ImportRequest } from '../modules/bestiary/ui/cards.svelte';
import { dnd5eUi } from './dnd5e/ui';

export type StatsView = Component<{ card: Card<any> }>;
// lang — язык карточки (подписи, которые попадут в статблок, например название колдовства).
// kind — the kind of card (a pack system has sections for some kinds only).
export type StatsEditor = Component<{ stats: any; system: string; lang?: string; kind?: CardKind }, {}, 'stats'>;
// Ячейки строки участника в трекере инициативы (хиты и КД, стресс и последствия).
export type TrackerCells = Component<{ c?: Combatant; head?: boolean }>;

// A button of a card (CardView): run may give a line of status to show under the buttons.
export interface CardAction {
  icon: Component<{ size?: number }>;
  readonly label: string;
  readonly title?: string;
  run(): unknown;
}
// A way to start a card besides a blank one (the «+» of Cards, «Create card» under a portrait).
export interface NewCard {
  icon: Component<{ size?: number }>;
  readonly label: string;
  // The label under a portrait.
  readonly short: string;
  readonly title: string;
  run(portrait?: { path: string; name: string }): unknown;
}
// The card as a sheet of paper (a picture to send to Telegram).
export type PaperView = Component<{ card: Card<any>; scope: CardRef['scope'] }>;

// The compendium list of a type of entries: a filter above it, which entries it lets through, and headed groups
// (D&D spells by level; null — not grouped now).
export interface EntryList {
  filter: Component<{ entries: Record<string, FieldValue>[] }>;
  match(fields: Record<string, FieldValue>): boolean;
  group?(fields: Record<string, FieldValue>): { order: number; title: string } | null;
}

export interface SystemUi {
  family: string;
  // How to show and edit a card's stats (by their shape: D&D has a stat block and a character sheet).
  view?(system: string, stats: unknown): StatsView | undefined;
  editor?(system: string, stats: unknown): StatsEditor | undefined;
  // The cells of a combatant's row; none — hit points and defence.
  trackerCells?: TrackerCells;
  // Its tools in Tools (with `families` and `page`) and the core's generators it shows as its own.
  tools?: ToolDef[];
  claims?: string[];
  cardActions?(summary: CardSummary, card: Card | null): CardAction[];
  newCard?: NewCard[];
  paper?(card: Card): PaperView | undefined;
  // Above a fight and an encounter: what the system says about it (D&D: how hard it is).
  encounter?: Component<{ list: Combatant[] }>;
  // The compendium's list by type of entries (D&D: spells).
  entryList?: Record<string, EntryList>;
  // An invisible component of the control window, always there (D&D: the index of spell names).
  background?: Component;
  // The window «What changed» for a character updated from an export (none — a plain question).
  importUpdate?: Component<{ request: ImportRequest }>;
  // A section of the Cards settings (D&D: the LSS spell table).
  cardSettings?: Component;
}

export const systemUis: SystemUi[] = [dnd5eUi];

export const systemUi = (system: string): SystemUi | undefined => systemUis.find((u) => u.family === familyOf(system));

export const statsView = (system: string, stats?: unknown): StatsView =>
  packOf(system) ? (PackSheet as StatsView) : (systemUi(system)?.view?.(system, stats) ?? GenericStats);
export const statsEditor = (system: string, stats?: unknown): StatsEditor =>
  packOf(system) ? (PackEditor as StatsEditor) : (systemUi(system)?.editor?.(system, stats) ?? GenericEditor);
export const trackerCells = (system: string): TrackerCells =>
  isPackFamily(familyOf(system)) ? PackTrackerCells : (systemUi(system)?.trackerCells ?? HpCells);
