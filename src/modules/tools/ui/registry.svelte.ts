// The tools of Tools in one list: their icon, title, page and the systems they belong to. A tool without families is
// common (any system); a system's tools show only in its adventures, unless the GM turned one on for another system in
// the settings (Tools → "Tools of other systems", remembered by the window).
import type { Component } from 'svelte';
import { Beer, CalendarClock, Calculator, Castle, CloudSun, DoorOpen, Flag, Footprints, Gauge, Gem, Hourglass, Rat, Send, Signature, Signpost, Sparkles, Swords, Store, Table2, UserRound, Wand2, Zap } from '@lucide/svelte';
import { t } from '../../../renderer/lib/i18n.svelte';
import type { ToolId } from './ui.svelte';

export interface ToolDef {
  id: Exclude<ToolId, 'notes'>;
  icon: Component<{ size?: number }>;
  readonly title: string;
  // Families of systems the tool belongs to (none — common).
  families?: string[];
}

const tool = (id: ToolDef['id'], icon: ToolDef['icon'], key: string, families?: string[]): ToolDef => ({
  id,
  icon,
  get title() {
    return t(key as never);
  },
  ...(families ? { families } : {}),
});

const DND = ['dnd5e'];
const MAUS = ['mausritter'];
const FITD = ['fitd'];

// In the order of the sidebar (notes come first and are drawn apart: they have their list).
export const TOOLS: ToolDef[] = [
  tool('schedule', CalendarClock, 'tools.side.schedule'),
  tool('telegram', Send, 'tg.compose'),
  tool('timer', Hourglass, 'tools.side.timer'),
  tool('names', Signature, 'tools.side.names', DND),
  tool('npc', UserRound, 'tools.side.npc', DND),
  tool('tavern', Beer, 'tools.side.tavern', DND),
  tool('settlement', Castle, 'tools.side.settlement', DND),
  tool('shop', Store, 'tools.side.shop', DND),
  tool('relic', Sparkles, 'tools.side.relic', DND),
  tool('dungeon', DoorOpen, 'tools.side.dungeon', DND),
  tool('weather', CloudSun, 'tools.side.weather', DND),
  tool('events', Signpost, 'tools.side.events', DND),
  tool('treasure', Gem, 'tools.side.treasure', DND),
  tool('difficulty', Gauge, 'tools.side.difficulty', DND),
  tool('pointbuy', Calculator, 'tools.side.pointbuy', DND),
  tool('reshape', Wand2, 'tools.side.reshape', DND),
  tool('travel', Footprints, 'tools.side.travel', DND),
  tool('wildMagic', Zap, 'tools.side.wildMagic', DND),
  tool('mouse', Rat, 'tools.side.mouse', MAUS),
  tool('mausTables', Table2, 'tools.side.mausTables', MAUS),
  tool('factions', Flag, 'tools.side.factions', MAUS),
  tool('crew', Swords, 'tools.side.crew', FITD),
];

// Tools turned on by hand for a family: { mausritter: ['names'] }.
const KEY = 'tools.extra';
function load(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string[]>;
  } catch {
    return {};
  }
}
export const extra = $state(load());
export function setExtra(family: string, id: string, on: boolean) {
  const list = new Set(extra[family] ?? []);
  if (on) list.add(id);
  else list.delete(id);
  extra[family] = [...list];
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(extra)));
  } catch {
    /* not remembered — not a problem */
  }
}

export type Place = 'common' | 'own' | 'extra';
// Where a tool stands in a family's adventure: common, the system's own, turned on by hand — or hidden (null).
export function placeOf(def: ToolDef, family: string): Place | null {
  if (!def.families) return 'common';
  if (def.families.includes(family)) return 'own';
  return (extra[family] ?? []).includes(def.id) ? 'extra' : null;
}
export const shown = (id: ToolId, family: string) => id === 'notes' || TOOLS.some((d) => d.id === id && placeOf(d, family) !== null);
